import { SUPABASE_URL } from "./supabase/env";

// Valores aceitos pelos checks da tabela listings, com o rótulo de cada um.
export const SPACE_TYPES = {
  consultorio_medico: "Consultório médico",
  psicologia: "Psicologia",
  nutricao: "Nutrição",
  fisioterapia: "Fisioterapia",
  odontologia: "Odontologia",
  estetica: "Estética",
  terapias: "Terapias integrativas",
  estudio: "Estúdio",
  reuniao: "Sala de reunião",
} as const;
export type SpaceType = keyof typeof SPACE_TYPES;
export const SPACE_TYPE_KEYS = Object.keys(SPACE_TYPES) as [SpaceType, ...SpaceType[]];

export const BILLING_TYPES = { hora: "Por hora", turno: "Por turno", dia: "Por dia", mes: "Por mês" } as const;
export type BillingType = keyof typeof BILLING_TYPES;
export const BILLING_TYPE_KEYS = Object.keys(BILLING_TYPES) as [BillingType, ...BillingType[]];
export const BILLING_UNIT: Record<BillingType, string> = { hora: "hora", turno: "turno", dia: "dia", mes: "mês" };

export const WEEKDAYS = { seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom" } as const;
export type Weekday = keyof typeof WEEKDAYS;
export const WEEKDAY_KEYS = Object.keys(WEEKDAYS) as Weekday[];

export const SHIFTS = { manha: "Manhã", tarde: "Tarde", noite: "Noite" } as const;
export type Shift = keyof typeof SHIFTS;
export const SHIFT_KEYS = Object.keys(SHIFTS) as Shift[];
export type ShiftGrid = Partial<Record<Weekday, Shift[]>>;

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

export const MIN_PHOTOS = 4;
export const RECOMMENDED_PHOTOS = 8;
export const MAX_PHOTOS = 12;
export const PHOTO_BUCKET = "listing-photos";

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

/** Lê shifts_available do banco ({"seg": ["manha"]}) descartando valores fora do padrão. */
export function parseShifts(value: unknown): ShiftGrid {
  const grid: ShiftGrid = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return grid;
  for (const day of WEEKDAY_KEYS) {
    const list = (value as Record<string, unknown>)[day];
    if (Array.isArray(list)) {
      const valid = SHIFT_KEYS.filter((shift) => list.includes(shift));
      if (valid.length > 0) grid[day] = valid;
    }
  }
  return grid;
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
