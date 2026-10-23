import OpenAI from "openai";

// Gemini pelo endpoint compatível com a SDK da OpenAI (plano gratuito do Google AI Studio).
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
export const EXTRACTION_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
// Trocar o modelo de embedding exige regerar os vetores de todos os anúncios.
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 1536;

/** Cliente do Gemini, ou null quando falta GEMINI_API_KEY no .env.local. */
export function geminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[ai] Falta GEMINI_API_KEY no .env.local");
    return null;
  }
  return new OpenAI({ apiKey, baseURL: GEMINI_BASE_URL, timeout: 30_000 });
}

type EmbeddableListing = {
  title: string;
  short_summary: string | null;
  description: string | null;
  space_type: string;
  neighborhood: string;
  city: string;
  state: string;
  amenities: string[];
  rules: string[];
};

/** Vetor do anúncio para a busca semântica, no formato de texto do pgvector. */
export async function embedListing(ai: OpenAI, listing: EmbeddableListing) {
  const result = await ai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: embeddingInput(listing),
    dimensions: EMBEDDING_DIMENSIONS,
  });
  const embedding = result.data[0]?.embedding ?? [];
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Embedding com ${embedding.length} dimensões`);
  }
  // pgvector aceita o formato de texto "[0.1,0.2,...]".
  return JSON.stringify(embedding);
}

// Texto que representa o anúncio na busca semântica.
function embeddingInput(listing: EmbeddableListing) {
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

export function aiErrorMessage(error: unknown, step: string) {
  console.error(`[ai] Erro na ${step}:`, error);

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
