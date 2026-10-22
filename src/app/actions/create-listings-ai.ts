"use server";

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Gemini pelo endpoint compatível com a SDK da OpenAI (plano gratuito do Google AI Studio).
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
const EXTRACTION_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
// Trocar o modelo de embedding exige regerar os vetores de todos os anúncios.
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 1536;
const MAX_INPUT_LENGTH = 6000;

const SPACE_TYPES = [
  "consultorio_medico",
  "psicologia",
  "nutricao",
  "fisioterapia",
  "odontologia",
  "estetica",
  "terapias",
  "estudio",
  "reuniao",
] as const;
const BILLING_TYPES = ["hora", "turno", "dia", "mes"] as const;
const WEEKDAYS = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"] as const;
const SHIFTS = z.array(z.enum(["manha", "tarde", "noite"]));

// O que o modelo devolve. Structured Outputs exige todos os campos:
// o que não estiver no texto vem como null, nunca inventado.
const extractionSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  short_summary: z.string().nullable(),
  space_type: z.enum(SPACE_TYPES).nullable(),
  billing_type: z.enum(BILLING_TYPES).nullable(),
  price: z.number().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  neighborhood: z.string().nullable(),
  zip_code: z.string().nullable(),
  shifts_available: z.object(
    Object.fromEntries(WEEKDAYS.map((day) => [day, SHIFTS])) as Record<
      (typeof WEEKDAYS)[number],
      typeof SHIFTS
    >,
  ),
  min_rental_period: z.string().nullable(),
  rules: z.array(z.string()),
  amenities: z.array(z.string()),
});

// As mesmas regras dos checks da tabela listings, para falhar antes do insert.
const listingSchema = z.object({
  title: z.string().trim().min(10).max(70),
  description: z.string().trim().nullable(),
  short_summary: z.string().trim().max(120).nullable(),
  space_type: z.enum(SPACE_TYPES),
  billing_type: z.enum(BILLING_TYPES),
  price: z.number().min(10),
  city: z.string().trim().min(1),
  state: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
  neighborhood: z.string().trim().min(1),
  zip_code: z
    .string()
    .trim()
    .regex(/^[0-9]{5}-?[0-9]{3}$/)
    .nullable()
    .catch(null),
  shifts_available: extractionSchema.shape.shifts_available,
  min_rental_period: z.string().trim().nullable(),
  rules: z.array(z.string().trim()),
  amenities: z.array(z.string().trim()),
});

type Listing = z.infer<typeof listingSchema>;

const FIELD_LABELS: Record<string, string> = {
  title: "título (10 a 70 caracteres)",
  short_summary: "resumo (até 120 caracteres)",
  space_type: "tipo de espaço",
  billing_type: "forma de cobrança",
  price: "preço (mínimo R$ 10)",
  city: "cidade",
  state: "UF",
  neighborhood: "bairro",
};

const SYSTEM_PROMPT = `Você extrai dados de anúncios de consultórios e salas para locação no Brasil.
Use só o que está no texto. Se uma informação não aparece, devolva null (ou lista vazia). Nunca invente preço, endereço ou disponibilidade.

- title: título claro em português, entre 10 e 70 caracteres. Ex: "Consultório de psicologia em Pinheiros".
- description: o texto do anunciante reescrito em português correto, sem telefone, e-mail ou endereço completo.
- short_summary: resumo de até 120 caracteres para cards e prévia de WhatsApp.
- space_type: ${SPACE_TYPES.join(", ")}. Use "consultorio_medico" para consultórios médicos genéricos.
- billing_type e price: o preço vale para a unidade de cobrança (hora, turno, dia ou mes). Preço em reais, só o número.
- state: sigla da UF com 2 letras maiúsculas. zip_code: CEP no formato 00000-000.
- shifts_available: para cada dia (seg, ter, qua, qui, sex, sab, dom), os turnos livres (manha, tarde, noite). Dias sem informação ficam com lista vazia.
- min_rental_period: período mínimo, ex: "1 turno/semana".
- rules: regras de uso, frases curtas.
- amenities: em snake_case, ex: ar_condicionado, maca, pia, recepcao, wifi, estacionamento, acessibilidade.`;

export type CreateListingAIResult =
  | { ok: true; listing: { id: string; slug: string; title: string } }
  | { ok: false; error: string; code?: "unauthenticated"; missingFields?: string[] };

/**
 * Recebe a descrição livre de um espaço, extrai os campos da tabela listings
 * com o Gemini, gera o embedding e salva o anúncio como rascunho do usuário logado.
 */
export async function createListingAI(rawText: string): Promise<CreateListingAIResult> {
  const text = typeof rawText === "string" ? rawText.trim() : "";
  if (text.length < 30) {
    return { ok: false, error: "Descreva o espaço com um pouco mais de detalhe." };
  }
  if (text.length > MAX_INPUT_LENGTH) {
    return {
      ok: false,
      error: `A descrição passou de ${MAX_INPUT_LENGTH} caracteres. Encurte o texto.`,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[createListingAI] Falta GEMINI_API_KEY no .env.local");
    return { ok: false, error: "Serviço de IA não configurado." };
  }

  // A RLS só aceita insert com owner_id = auth.uid(), então exige sessão.
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      ok: false,
      code: "unauthenticated",
      error: "Entre na sua conta para salvar o anúncio. Seu texto continua aqui.",
    };
  }

  const ai = new OpenAI({ apiKey, baseURL: GEMINI_BASE_URL, timeout: 30_000 });

  let listing: Listing;
  try {
    const response = await ai.chat.completions.parse({
      model: EXTRACTION_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      response_format: zodResponseFormat(extractionSchema, "listing"),
    });

    const extracted = response.choices[0]?.message.parsed;
    if (!extracted) {
      return { ok: false, error: "Não foi possível ler a descrição. Tente reescrever o texto." };
    }

    const parsed = listingSchema.safeParse(extracted);
    if (!parsed.success) {
      const missingFields = [
        ...new Set(parsed.error.issues.map((issue) => String(issue.path[0]))),
      ].map((field) => FIELD_LABELS[field] ?? field);
      return {
        ok: false,
        error: "Faltam informações na descrição para criar o anúncio.",
        missingFields,
      };
    }
    listing = parsed.data;
  } catch (error) {
    return { ok: false, error: aiErrorMessage(error, "extração") };
  }

  let embedding: number[];
  try {
    const result = await ai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: embeddingInput(listing),
      dimensions: EMBEDDING_DIMENSIONS,
    });
    embedding = result.data[0]?.embedding ?? [];
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Embedding com ${embedding.length} dimensões`);
    }
  } catch (error) {
    return { ok: false, error: aiErrorMessage(error, "embedding") };
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      ...listing,
      shifts_available: compactShifts(listing.shifts_available),
      owner_id: user.id,
      slug: createSlug(listing.title),
      status: "draft",
      // pgvector aceita o formato de texto "[0.1,0.2,...]".
      embedding: JSON.stringify(embedding),
    })
    .select("id, slug, title")
    .single();

  if (error) {
    console.error("[createListingAI] Erro ao salvar no Supabase:", error);
    if (error.code === "42501") {
      return { ok: false, error: "Você não tem permissão para criar este anúncio." };
    }
    if (error.code === "23514") {
      return { ok: false, error: "Algum dado do anúncio está fora do formato aceito." };
    }
    return { ok: false, error: "Não foi possível salvar o anúncio. Tente de novo." };
  }

  return { ok: true, listing: data };
}

function aiErrorMessage(error: unknown, step: string) {
  console.error(`[createListingAI] Erro na ${step}:`, error);

  // Limite do plano gratuito (por minuto ou por dia) estourado.
  if (error instanceof OpenAI.RateLimitError) {
    return "Muitas solicitações agora. Tente de novo em instantes.";
  }
  // O Gemini devolve 503 quando o modelo está sobrecarregado.
  if (error instanceof OpenAI.InternalServerError) {
    return "Serviço de IA sobrecarregado. Tente de novo em alguns minutos.";
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return "Sem conexão com o serviço de IA. Tente de novo.";
  }
  // O Gemini responde chave inválida com 400, não 401.
  if (
    error instanceof OpenAI.AuthenticationError ||
    (error instanceof OpenAI.BadRequestError && /api key/i.test(error.message))
  ) {
    return "Serviço de IA não configurado.";
  }
  return "Não foi possível processar a descrição. Tente de novo.";
}

// Texto que representa o anúncio na busca semântica.
function embeddingInput(listing: Listing) {
  return [
    listing.title,
    listing.short_summary,
    listing.description,
    `Tipo: ${listing.space_type}`,
    `Local: ${listing.neighborhood}, ${listing.city} - ${listing.state}`,
    listing.amenities.length > 0 && `Comodidades: ${listing.amenities.join(", ")}`,
    listing.rules.length > 0 && `Regras: ${listing.rules.join("; ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

// Guarda só os dias com turno livre: {"seg": ["manha"], "ter": ["noite"]}.
function compactShifts(shifts: Listing["shifts_available"]) {
  const compact: Record<string, string[]> = {};
  for (const [day, list] of Object.entries(shifts)) {
    if (list.length > 0) compact[day] = [...new Set(list)];
  }
  return compact;
}

function createSlug(title: string) {
  const base = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}
