"use server";

import { zodResponseFormat } from "openai/helpers/zod";
import type { ChatCompletionContentPart } from "openai/resources/chat/completions";
import { z } from "zod";
import { EXTRACTION_MODEL, aiErrorMessage, geminiClient } from "@/lib/ai";
import { checkListing } from "@/lib/listing-review";
import { AMENITIES, SPACE_TYPES, photoUrl, type SpaceType } from "@/lib/listing-options";
import { createClient } from "@/lib/supabase/server";

// A nota vai por e-mail e cabe em 1000 caracteres (returnListing corta nesse tamanho).
const NOTE_MAX = 1000;
// Mais fotos que isso gasta cota sem mudar o veredito.
const MAX_ANALYZED_PHOTOS = 6;
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

const reviewSchema = z.object({
  verdict: z.enum(["bom", "ajustar", "fraco"]),
  problems: z.array(
    z.object({
      field: z.enum(["titulo", "resumo", "descricao", "regras", "fotos", "coerencia"]),
      issue: z.string(),
      fix: z.string(),
    }),
  ),
  note: z.string(),
});

export type ListingReview = z.infer<typeof reviewSchema>;
export type ReviewListingResult = { ok: true; review: ListingReview; checks: string[] } | { ok: false; error: string };

const SYSTEM_PROMPT = `Você revisa anúncios do Subleasy antes de irem ao ar. O Subleasy é onde donos de consultórios e salas sublocam o espaço por hora, turno, dia ou mês para profissionais de saúde e bem-estar.

Avalie o anúncio e escreva a nota que o admin vai enviar ao anunciante.

O que avaliar:
- Título: diz o tipo de sala, o diferencial e o bairro? Sem exagero nem caixa alta.
- Resumo: uma frase que complementa o título, sem repetir.
- Descrição: diz para quem a sala serve, o que tem nela, o que o prédio oferece e como funciona a locação. Sem adjetivos que não dá para verificar.
- Fotos: mostram o espaço real, bem iluminado e nítido? Há foto do ambiente principal? Combinam com o tipo de sala e com o que o texto promete?
- Sinais de imagem gerada por IA ou render 3D: superfícies lisas demais, objetos deformados, texto ilegível, simetria estranha. Isso nunca é certeza. Se notar, peça fotos reais do espaço sem acusar o anunciante.
- Coerência: o texto promete algo que as fotos não mostram (ex.: "janela ampla" sem janela)?

Veredito:
- "bom": pode ir ao ar. problems fica vazio e a nota diz em uma frase que não há ajustes.
- "ajustar": publicável depois de ajustes pontuais.
- "fraco": falta o essencial (fotos do espaço, descrição) ou há problemas graves.

Regras da nota:
- Português do Brasil, tratando o anunciante por "você", tom cordial e direto.
- Comece pelo que está bom, em uma frase. Depois liste no máximo 5 ajustes, um por linha, cada um com o que mudar e como (use o exemplo do próprio anúncio quando ajudar).
- Cite as fotos pelo número (foto 1, foto 2).
- Máximo de ${NOTE_MAX - 100} caracteres. Sem markdown, sem emojis.
- Use só o que está no anúncio e nas fotos. Nunca invente defeito. Os "problemas medidos" já são fatos: inclua os que importam.`;

/** Baixa a foto e devolve como data URL: o Gemini não busca imagens por link no endpoint compatível. */
async function photoPart(path: string): Promise<ChatCompletionContentPart | null> {
  try {
    const response = await fetch(photoUrl(path), { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_PHOTO_BYTES) return null;
    const type = response.headers.get("content-type") ?? "image/jpeg";
    return { type: "image_url", image_url: { url: `data:${type};base64,${buffer.toString("base64")}` } };
  } catch {
    return null;
  }
}

/**
 * Analisa um anúncio em revisão e rascunha a nota de devolução para o anunciante.
 * O admin edita antes de enviar: a IA só sugere, nunca devolve nem aprova.
 */
export async function reviewListingAI(listingId: string): Promise<ReviewListingResult> {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { ok: false, error: "Sem permissão." };

  const ai = geminiClient();
  if (!ai) return { ok: false, error: "Serviço de IA não configurado." };

  const { data: listing } = await supabase
    .from("listings")
    .select("title, short_summary, description, space_type, neighborhood, city, state, amenities, rules, photos, photo_sizes")
    .eq("id", listingId)
    .eq("status", "pending_approval")
    .maybeSingle();
  if (!listing) return { ok: false, error: "O anúncio não está mais esperando aprovação." };

  const checks = checkListing(listing);
  const spaceType = SPACE_TYPES[listing.space_type as SpaceType] ?? listing.space_type;
  const amenities = listing.amenities.map((key: string) => (AMENITIES as Record<string, string>)[key] ?? key).join(", ");

  const analyzed = listing.photos.slice(0, MAX_ANALYZED_PHOTOS);
  const photos = await Promise.all(analyzed.map(photoPart));
  const photoParts = photos.flatMap((part, index): ChatCompletionContentPart[] =>
    part ? [{ type: "text", text: `Foto ${index + 1}:` }, part] : [],
  );
  const unread = analyzed.length - photoParts.length / 2;

  const facts = [
    `Tipo: ${spaceType}`,
    `Local: ${listing.neighborhood}, ${listing.city} - ${listing.state}`,
    `Título: ${listing.title}`,
    `Resumo: ${listing.short_summary ?? "(vazio)"}`,
    `Descrição:\n${listing.description ?? "(vazia)"}`,
    `Comodidades: ${amenities || "(nenhuma)"}`,
    `Regras:\n${listing.rules.join("\n") || "(nenhuma)"}`,
    `Total de fotos: ${listing.photos.length}${listing.photos.length > analyzed.length ? ` (você vê as ${analyzed.length} primeiras)` : ""}`,
    unread > 0 ? `${unread} foto(s) não puderam ser carregadas: não avalie essas.` : "",
    `Problemas medidos:\n${checks.map((c) => `- ${c}`).join("\n") || "(nenhum)"}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const response = await ai.chat.completions.parse({
      model: EXTRACTION_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: [{ type: "text", text: `<anuncio>\n${facts}\n</anuncio>` }, ...photoParts] },
      ],
      response_format: zodResponseFormat(reviewSchema, "revisao"),
    });
    const review = response.choices[0]?.message.parsed;
    if (!review || !review.note.trim()) return { ok: false, error: "A IA não devolveu uma análise. Tente de novo." };

    const note = review.note.trim();
    return {
      ok: true,
      checks,
      review: { ...review, note: note.length > NOTE_MAX ? `${note.slice(0, NOTE_MAX - 1).trimEnd()}…` : note },
    };
  } catch (error) {
    return { ok: false, error: aiErrorMessage(error, "revisão do anúncio") };
  }
}
