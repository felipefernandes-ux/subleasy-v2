"use server";

import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { EXTRACTION_MODEL, aiErrorMessage, geminiClient } from "@/lib/ai";
import { BILLING_TYPE_KEYS, SPACE_TYPE_KEYS } from "@/lib/listing-options";
import { createClient } from "@/lib/supabase/server";
import type { AIExtraction } from "@/lib/wizard-draft";

const MAX_INPUT_LENGTH = 6000;
const SPACE_TYPES = SPACE_TYPE_KEYS;
const BILLING_TYPES = BILLING_TYPE_KEYS;

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
  min_rental_period: z.string().nullable(),
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
  min_rental_period: z.string().trim().nullable(),
  amenities: z.array(z.string().trim()),
});

type Listing = z.infer<typeof listingSchema>;

const FIELD_LABELS: Record<string, string> = {
  title: "título (10 a 70 caracteres)",
  short_summary: "resumo (até 120 caracteres)",
  space_type: "área de atuação",
  billing_type: "forma de cobrança",
  price: "preço (mínimo R$ 10)",
  city: "cidade",
  state: "UF",
  neighborhood: "bairro",
};

const SYSTEM_PROMPT = `Você extrai dados de anúncios de consultórios e salas para locação no Brasil.
Use só o que está no texto. Se uma informação não aparece, devolva null (ou lista vazia). Nunca invente preço, endereço ou disponibilidade.

- title: título claro em português, entre 10 e 70 caracteres. Ex: "Consultório de psicologia em Pinheiros".
- description: o texto do anunciante reescrito em português correto, sem telefone, e-mail ou endereço completo. Mantenha as quebras de linha em parágrafos curtos e os emojis que o anunciante usou.
- short_summary: resumo de até 120 caracteres para cards e prévia de WhatsApp.
- space_type: ${SPACE_TYPES.join(", ")}. Use "consultorio_medico" para consultórios médicos genéricos.
- billing_type e price: o preço vale para a unidade de cobrança (hora, turno, dia ou mes). Preço em reais, só o número.
- state: sigla da UF com 2 letras maiúsculas. zip_code: CEP no formato 00000-000.
- min_rental_period: período mínimo, ex: "1 turno/semana".
- amenities: em snake_case, ex: ar_condicionado, maca, pia, recepcao, wifi, estacionamento, acessibilidade.`;

export type CreateListingAIResult =
  | { ok: true; userId: string; listing: AIExtraction }
  | { ok: false; error: string; code?: "unauthenticated"; missingFields?: string[] };

/**
 * Recebe a descrição livre de um espaço, extrai os campos da tabela listings
 * com o Gemini, gera o embedding, salva o anúncio como rascunho do usuário logado
 * e abre a tela de revisão.
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

  const ai = geminiClient();
  if (!ai) return { ok: false, error: "Serviço de IA não configurado." };

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

  // Nada é salvo aqui: o cadastro passo a passo abre com estes dados e só cria o anúncio ao enviar.
  return { ok: true, userId: user.id, listing };
}
