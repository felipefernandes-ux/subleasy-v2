// Cálculos do painel do anunciante. Sem React: recebe as linhas do banco e devolve números.
// Visita = um visitante por anúncio por dia (é assim que listing_events grava). Contato = clique no
// WhatsApp (whatsapp_click) ou mensagem pelo formulário (email_click).

export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];
export const DEFAULT_PERIOD: Period = 30;

export function parsePeriod(value: string | string[] | undefined): Period {
  const number = Number(Array.isArray(value) ? value[0] : value);
  return PERIODS.find((period) => period === number) ?? DEFAULT_PERIOD;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Instante atual em ms. Fica aqui para os componentes de servidor não chamarem Date.now() direto. */
export const nowMs = () => Date.now();

/** "Bom dia", "Boa tarde" ou "Boa noite", pela hora de São Paulo. */
export function greetingInSaoPaulo(): string {
  const hour = Number(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo", hour: "numeric", hourCycle: "h23" }));
  return hour < 5 ? "Boa noite" : hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
}

/** Hoje no fuso de São Paulo, como "2026-10-26". */
export function todayInSaoPaulo(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export function shiftDay(day: string, delta: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + delta * DAY_MS).toISOString().slice(0, 10);
}

/** Os últimos `length` dias até `end`, do mais antigo para o mais novo. */
export function dayRange(end: string, length: number): string[] {
  return Array.from({ length }, (_, index) => shiftDay(end, index - length + 1));
}

export function weekdayOf(day: string): number {
  return new Date(`${day}T12:00:00Z`).getUTCDay();
}

export type DailyRow = { listing_id: string; day: string; kind: string; total: number };
export type Totals = { views: number; whatsapp: number; messages: number; favorites: number };
export type ListingTotals = { current: Totals; previous: Totals };

export const emptyTotals = (): Totals => ({ views: 0, whatsapp: 0, messages: 0, favorites: 0 });
export const contactsOf = (totals: Totals) => totals.whatsapp + totals.messages;
export const rateOf = (totals: Totals) => (totals.views > 0 ? contactsOf(totals) / totals.views : 0);

function add(totals: Totals, kind: string, amount: number) {
  if (kind === "view") totals.views += amount;
  else if (kind === "whatsapp_click") totals.whatsapp += amount;
  else if (kind === "email_click") totals.messages += amount;
  else if (kind === "favorite") totals.favorites += amount;
}

/**
 * Soma as linhas por anúncio, separando o período atual do anterior (mesmo tamanho, logo antes).
 * As datas são "AAAA-MM-DD", então a comparação de texto equivale à de data.
 */
export function aggregate(rows: DailyRow[], days: string[]) {
  const start = days[0];
  const index = new Map(days.map((day, position) => [day, position]));
  const byListing = new Map<string, ListingTotals>();
  const series = { views: days.map(() => 0), contacts: days.map(() => 0), favorites: days.map(() => 0) };
  const total: ListingTotals = { current: emptyTotals(), previous: emptyTotals() };

  for (const row of rows) {
    const amount = Number(row.total);
    const isCurrent = row.day >= start;
    const entry = byListing.get(row.listing_id) ?? { current: emptyTotals(), previous: emptyTotals() };
    byListing.set(row.listing_id, entry);
    const side = isCurrent ? "current" : "previous";
    add(entry[side], row.kind, amount);
    add(total[side], row.kind, amount);
    const position = index.get(row.day);
    if (position !== undefined) {
      if (row.kind === "view") series.views[position] += amount;
      else if (row.kind === "favorite") series.favorites[position] += amount;
      else series.contacts[position] += amount;
    }
  }
  return { byListing, series, total };
}

/** Variação percentual inteira, ou null quando o período anterior está zerado. */
export function percentChange(current: number, previous: number): number | null {
  return previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
}

// ── Preço em relação ao mercado ───────────────────────────

export type PriceRow = { city: string; space_type: string; billing_type: string; price: number };
export type Market = { median: number; count: number; scope: "tipo" | "cidade"; prices: number[] };

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * Mediana dos anúncios no ar de outras pessoas, na mesma cidade e cobrança. Prefere o mesmo tipo de sala
 * (3 ou mais) e cai para a cidade inteira (5 ou mais). Sem amostra suficiente, devolve null.
 */
export function marketFor(listing: { city: string; space_type: string; billing_type: string }, others: PriceRow[]): Market | null {
  const sameCity = others.filter((row) => row.city === listing.city && row.billing_type === listing.billing_type);
  const sameType = sameCity.filter((row) => row.space_type === listing.space_type);
  const build = (rows: PriceRow[], scope: Market["scope"]): Market => {
    const prices = rows.map((row) => Number(row.price)).sort((a, b) => a - b);
    return { median: median(prices), count: prices.length, scope, prices };
  };
  if (sameType.length >= 3) return build(sameType, "tipo");
  if (sameCity.length >= 5) return build(sameCity, "cidade");
  return null;
}

/** Quanto o preço está acima (+) ou abaixo (−) da mediana, em %. */
export function priceGap(price: number, market: Market | null): number | null {
  return market && market.median > 0 ? Math.round(((price - market.median) / market.median) * 100) : null;
}

// ── Quando as pessoas chamam ──────────────────────────────

export type PatternRow = { dow: number; hour: number; total: number };
export const BANDS = [
  { key: "madrugada", label: "Madrugada", phrase: "de madrugada", from: 0, to: 5 },
  { key: "manha", label: "Manhã", phrase: "de manhã", from: 6, to: 11 },
  { key: "tarde", label: "Tarde", phrase: "à tarde", from: 12, to: 17 },
  { key: "noite", label: "Noite", phrase: "à noite", from: 18, to: 23 },
] as const;
export const WEEKDAYS = [
  { short: "D", label: "Domingo", phrase: "aos domingos" },
  { short: "S", label: "Segunda", phrase: "às segundas" },
  { short: "T", label: "Terça", phrase: "às terças" },
  { short: "Q", label: "Quarta", phrase: "às quartas" },
  { short: "Q", label: "Quinta", phrase: "às quintas" },
  { short: "S", label: "Sexta", phrase: "às sextas" },
  { short: "S", label: "Sábado", phrase: "aos sábados" },
] as const;

/** grid[faixa][dia da semana]: contatos em cada turno de cada dia. */
export type Pattern = { total: number; byWeekday: number[]; byBand: number[]; grid: number[][]; peakWeekday: number; peakBand: number };

export function summarizePattern(rows: PatternRow[]): Pattern {
  const byWeekday = Array<number>(7).fill(0);
  const byBand = Array<number>(BANDS.length).fill(0);
  const grid = BANDS.map(() => Array<number>(7).fill(0));
  for (const row of rows) {
    const amount = Number(row.total);
    const band = BANDS.findIndex((item) => row.hour >= item.from && row.hour <= item.to);
    byWeekday[row.dow] += amount;
    byBand[band] += amount;
    grid[band][row.dow] += amount;
  }
  const peak = (values: number[]) => values.indexOf(Math.max(...values));
  return { total: byWeekday.reduce((sum, value) => sum + value, 0), byWeekday, byBand, grid, peakWeekday: peak(byWeekday), peakBand: peak(byBand) };
}

/** Curva suave que passa por todos os pontos. */
export function smoothPath(points: [number, number][]): string {
  if (points.length === 0) return "";
  let path = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let index = 0; index < points.length - 1; index++) {
    const p0 = points[Math.max(index - 1, 0)];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[Math.min(index + 2, points.length - 1)];
    // Os pontos de controle ficam entre os dois vizinhos: a curva nunca passa do pico nem fica abaixo de zero.
    const low = Math.min(p1[1], p2[1]);
    const high = Math.max(p1[1], p2[1]);
    const clamp = (value: number) => Math.min(Math.max(value, low), high);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, clamp(p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, clamp(p2[1] - (p3[1] - p1[1]) / 6)];
    path += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return path;
}
