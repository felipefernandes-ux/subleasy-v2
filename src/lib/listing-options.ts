import { SUPABASE_URL } from "./supabase/env";

// Valores aceitos pelos checks da tabela listings, com o rótulo de cada um.
// Os mesmos tipos do formulário do Subleasy atual, na mesma ordem.
export const SPACE_TYPES = {
  consultorio_medico: "Consultório médico",
  odontologia: "Consultório odontológico",
  psicologia: "Sala de psicologia",
  estetica: "Estética e bem-estar",
  terapias: "Espaço terapêutico",
  fisioterapia: "Sala de fisioterapia",
  nutricao: "Sala de nutrição",
  to_fono: "TO e fonoaudiologia",
  outro: "Outro espaço",
} as const;
export type SpaceType = keyof typeof SPACE_TYPES;
export const SPACE_TYPE_KEYS = Object.keys(SPACE_TYPES) as [SpaceType, ...SpaceType[]];

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const BILLING_TYPES = { hora: "Por hora", turno: "Por turno", dia: "Por dia", mes: "Por mês" } as const;
export type BillingType = keyof typeof BILLING_TYPES;
export const BILLING_TYPE_KEYS = Object.keys(BILLING_TYPES) as [BillingType, ...BillingType[]];
export const BILLING_UNIT: Record<BillingType, string> = { hora: "hora", turno: "turno", dia: "dia", mes: "mês" };

// Comodidades mais comuns, sempre visíveis para marcar com um toque.
// O que a IA encontrar fora desta lista aparece junto, com o rótulo gerado.
export const AMENITIES: Record<string, string> = {
  ar_condicionado: "Ar-condicionado",
  wifi: "Wi-Fi",
  recepcao: "Recepção",
  sala_de_espera: "Sala de espera",
  maca: "Maca",
  pia: "Pia",
  banheiro_privativo: "Banheiro privativo",
  estacionamento: "Estacionamento",
  elevador: "Elevador",
  acessibilidade: "Acessibilidade",
  isolamento_acustico: "Isolamento acústico",
  limpeza_inclusa: "Limpeza inclusa",
};

export function amenityLabel(key: string) {
  if (AMENITIES[key]) return AMENITIES[key];
  const text = key.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Dias que um anúncio fica no ar a cada publicação ou renovação.
export const LISTING_DAYS = 30;

// Estado do anúncio para o painel: a cor e as ações mudam com o prazo.
export type Phase = "draft" | "review" | "live" | "due" | "over" | "paused";

export function phaseOf(status: string, daysLeft: number | null): Phase {
  if (status === "draft") return "draft";
  if (status === "pending_approval") return "review";
  if (status === "paused") return "paused";
  if (daysLeft === null || daysLeft <= 0) return "over";
  return daysLeft <= 7 ? "due" : "live";
}

// Uma foto basta para publicar: ela vira a capa.
export const MIN_PHOTOS = 1;
export const MAX_PHOTOS = 8;
export const PHOTO_BUCKET = "listing-photos";

// Até 2 destaques: dão o tom da descrição que a IA escreve.
export const HIGHLIGHTS = {
  silenciosa: "Silenciosa",
  bem_localizada: "Bem localizada",
  luz_natural: "Luz natural",
  reformada: "Recém-reformada",
  ampla: "Ampla",
  aconchegante: "Aconchegante",
} as const;
export type Highlight = keyof typeof HIGHLIGHTS;
export const HIGHLIGHT_KEYS = Object.keys(HIGHLIGHTS) as [Highlight, ...Highlight[]];
export const MAX_HIGHLIGHTS = 2;

// Ofertas prontas para quem chega pelo Subleasy. Sem texto livre: o que aparece no
// anúncio é exatamente o que vai na mensagem do WhatsApp.
export const OFFERS = {
  primeiro_turno_gratis: { title: "Primeiro turno grátis", text: "Para conhecer a sala antes de fechar." },
  desconto_primeiro_mes: { title: "10% no primeiro mês", text: "Desconto no primeiro mês de locação." },
  sem_caucao: { title: "Sem caução", text: "Não pede depósito de garantia." },
  sem_fidelidade: { title: "Sem fidelidade", text: "Pode sair quando quiser, sem multa." },
} as const;
export type Offer = keyof typeof OFFERS;
export const OFFER_KEYS = Object.keys(OFFERS) as [Offer, ...Offer[]];

/** Ponto público do mapa: exato, ou arredondado (~1 km) quando o anunciante prefere área aproximada. */
export function publicPoint(lat: number, lng: number, exact: boolean) {
  if (exact) return { latitude: lat, longitude: lng };
  return { latitude: Math.round(lat * 100) / 100, longitude: Math.round(lng * 100) / 100 };
}
export const APPROXIMATE_RADIUS_METERS = 900;

export function createSlug(title: string) {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

/** Largura e altura de cada foto, pelo caminho no Storage. */
export type PhotoSizes = Record<string, [number, number]>;

/** Lê photo_sizes do banco descartando valores fora do padrão. */
export function parsePhotoSizes(value: unknown): PhotoSizes {
  const sizes: PhotoSizes = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return sizes;
  for (const [path, size] of Object.entries(value)) {
    if (Array.isArray(size) && size.length === 2 && size.every((n) => Number.isInteger(n) && n > 0)) {
      sizes[path] = [size[0], size[1]];
    }
  }
  return sizes;
}

/** Foto em pé. Sem tamanho conhecido, trata como horizontal (o corte de sempre). */
export function isPortrait(size: readonly [number, number] | undefined) {
  return size ? size[1] > size[0] : false;
}

/** URL pública de uma foto guardada no Storage (bucket público). */
export function photoUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}

export function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
  });
}

/** "(44) 99999-9999" a partir de "+5544999999999". */
export function formatWhatsApp(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (digits.length < 10) return digits;
  const split = digits.length === 11 ? 7 : 6;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, split)}-${digits.slice(split)}`;
}

/**
 * Aceita "(44) 99999-9999", "44999999999" ou "+55 44 99999-9999" e devolve
 * "+5544999999999". Celular com 11 dígitos precisa começar com 9 depois do DDD.
 */
export function toBrazilianWhatsApp(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.length >= 12 && digits.startsWith("55")) digits = digits.slice(2);

  const validDdd = /^[1-9][1-9]/.test(digits);
  const validLength = digits.length === 10 || (digits.length === 11 && digits[2] === "9");
  return validDdd && validLength ? `+55${digits}` : "";
}
