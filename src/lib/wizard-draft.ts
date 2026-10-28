import { AMENITIES, BILLING_TYPE_KEYS, SPACE_TYPE_KEYS, type BillingType, type SpaceType } from "@/lib/listing-options";

/** Onde o cadastro passo a passo guarda o rascunho no navegador. */
export const wizardStorageKey = (userId: string) => `subleasy:cadastro:${userId}`;

/** O que a IA extraiu do texto livre; o que ela não achou vem como null. */
export type AIExtraction = {
  title: string;
  short_summary: string | null;
  description: string | null;
  space_type: SpaceType;
  billing_type: BillingType;
  price: number;
  city: string;
  state: string;
  neighborhood: string;
  zip_code: string | null;
  min_rental_period: string | null;
  amenities: string[];
};

/**
 * Grava o que a IA entendeu como rascunho do passo a passo. O cadastro abre já preenchido,
 * com o ícone de sugestão da IA nos textos, e a pessoa só revisa e completa.
 */
export function storeAIDraft(userId: string, ai: AIExtraction) {
  const filled = (["title", "short_summary", "description"] as const).filter((field) => ai[field]?.trim());
  const draft = {
    id: crypto.randomUUID(),
    step: 0,
    space_type: (SPACE_TYPE_KEYS as string[]).includes(ai.space_type) ? ai.space_type : "",
    billing_type: (BILLING_TYPE_KEYS as string[]).includes(ai.billing_type) ? ai.billing_type : "turno",
    price: ai.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    title: ai.title,
    short_summary: ai.short_summary ?? "",
    description: ai.description ?? "",
    zip_code: ai.zip_code ?? "",
    neighborhood: ai.neighborhood,
    city: ai.city,
    state: ai.state,
    min_rental_period: ai.min_rental_period ?? "",
    amenities: ai.amenities.filter((key) => key in AMENITIES),
    ai_fields: filled,
  };
  localStorage.setItem(wizardStorageKey(userId), JSON.stringify(draft));
}
