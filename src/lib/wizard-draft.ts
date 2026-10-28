import { AMENITIES, BILLING_TYPE_KEYS, HIGHLIGHT_KEYS, MAX_HIGHLIGHTS, SPACE_TYPE_KEYS, type BillingType, type Highlight, type SpaceType } from "@/lib/listing-options";

/** Onde o cadastro passo a passo guarda o rascunho no navegador. */
export const wizardStorageKey = (userId: string) => `subleasy:cadastro:${userId}`;

/**
 * Onde a tela de IA deixa o rascunho para o cadastro. Fica numa chave à parte: o cadastro
 * aberto antes (o Next o mantém montado) continua gravando na chave principal e apagaria o da IA.
 */
export const wizardHandoffKey = (userId: string) => `subleasy:cadastro-ia:${userId}`;

/** O que a IA extraiu do texto livre; o que ela não achou vem como null. */
export type AIExtraction = {
  space_type: SpaceType;
  billing_type: BillingType;
  price: number;
  city: string;
  state: string;
  neighborhood: string;
  zip_code: string | null;
  min_rental_period: string | null;
  amenities: string[];
  highlights: Highlight[];
};

/**
 * Grava o que a IA entendeu como rascunho do passo a passo. O cadastro abre já preenchido
 * (tipo, local, comodidades, destaques, preço) e a pessoa só revisa e completa. Título,
 * resumo e descrição não vão prontos: a IA os escreve no passo deles, com o texto original
 * e tudo o que a pessoa confirmou até lá.
 */
export function storeAIDraft(userId: string, ai: AIExtraction, text: string) {
  const draft = {
    id: crypto.randomUUID(),
    step: 0,
    ai_text: text.trim().slice(0, 2000),
    space_type: (SPACE_TYPE_KEYS as string[]).includes(ai.space_type) ? ai.space_type : "",
    billing_type: (BILLING_TYPE_KEYS as string[]).includes(ai.billing_type) ? ai.billing_type : "turno",
    price: ai.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    zip_code: ai.zip_code ?? "",
    neighborhood: ai.neighborhood,
    city: ai.city,
    state: ai.state,
    min_rental_period: ai.min_rental_period ?? "",
    amenities: [...new Set(ai.amenities.filter((key) => key in AMENITIES))],
    highlights: ai.highlights.filter((key) => (HIGHLIGHT_KEYS as string[]).includes(key)).slice(0, MAX_HIGHLIGHTS),
  };
  localStorage.setItem(wizardHandoffKey(userId), JSON.stringify(draft));
}
