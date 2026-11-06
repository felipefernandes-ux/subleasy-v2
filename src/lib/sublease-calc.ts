import { normalizeCity } from "@/lib/city-text";
import type { MarketStat } from "@/lib/market-prices";

export type Billing = "hora" | "turno" | "dia" | "mes";

/** 52 semanas ÷ 12 meses. */
export const WEEKS_PER_MONTH = 4.33;

/** O que cada cobrança conta e o limite semanal que faz sentido. */
export const BILLING_UNITS: Record<Billing, { label: string; unit: string; units: string; max: number; step: number; start: number; price: [number, number] }> = {
  hora: { label: "Por hora", unit: "hora", units: "horas", max: 84, step: 1, start: 12, price: [20, 300] },
  turno: { label: "Por turno", unit: "turno", units: "turnos", max: 21, step: 1, start: 6, price: [40, 500] },
  dia: { label: "Por dia", unit: "dia", units: "dias", max: 7, step: 1, start: 3, price: [80, 900] },
  mes: { label: "Por mês", unit: "mês", units: "mês", max: 1, step: 1, start: 1, price: [300, 8000] },
};

export type CalcInput = {
  billing: Billing;
  /** Horas, turnos ou dias livres por semana (ignorado na cobrança mensal). */
  quantity: number;
  price: number;
  /** 0 a 1: parte do tempo livre que de fato é alugada. */
  occupancy: number;
  /** Custo mensal da sala (aluguel, condomínio, contas). Opcional. */
  cost: number;
};

export type CalcResult = {
  /** Renda mensal esperada, com a ocupação escolhida, e a faixa com 20 pontos a menos e a mais. */
  expected: number;
  low: number;
  high: number;
  yearly: number;
  /** Parte do custo que a sublocação paga, de 0 a 1 ou mais; null sem custo informado. */
  coverage: number | null;
  /** Preço mínimo por unidade para cobrir o custo com a ocupação escolhida; null sem custo ou sem agenda. */
  breakEven: number | null;
  /** Os 21 turnos da semana: quantos a sala oferece e quantos são alugados na ocupação esperada. */
  offered: number;
  rented: number;
};

/** Unidades livres por mês: na cobrança mensal é uma sala por mês, nas outras é a agenda semanal × 4,33. */
function unitsPerMonth(billing: Billing, quantity: number) {
  return billing === "mes" ? 1 : quantity * WEEKS_PER_MONTH;
}

/** Quanto da semana de 21 turnos (7 dias × manhã, tarde e noite) a agenda ocupa. Uma hora vale um quarto de turno. */
function toShifts(billing: Billing, quantity: number) {
  const shifts = billing === "hora" ? quantity / 4 : billing === "turno" ? quantity : billing === "dia" ? quantity * 3 : 21;
  return Math.max(0, Math.min(21, shifts));
}

export function calculate({ billing, quantity, price, occupancy, cost }: CalcInput): CalcResult {
  const units = unitsPerMonth(billing, quantity);
  const earn = (share: number) => Math.round(units * Math.max(0, Math.min(1, share)) * price);
  const expected = earn(occupancy);
  const offered = Math.round(toShifts(billing, quantity));
  return {
    expected,
    low: earn(occupancy - 0.2),
    high: earn(occupancy + 0.2),
    yearly: expected * 12,
    coverage: cost > 0 ? expected / cost : null,
    breakEven: cost > 0 && units * occupancy > 0 ? Math.ceil(cost / (units * occupancy)) : null,
    offered,
    rented: Math.round(offered * occupancy),
  };
}

/** Escolhe o nível mais local com base suficiente: cidade, estado, tipo no Brasil, cobrança no Brasil. */
export function pickMarket(stats: MarketStat[], where: { cityKey: string; state: string; spaceType: string; billing: Billing }): MarketStat | null {
  const city = normalizeCity(where.cityKey);
  const find = (match: (item: MarketStat) => boolean) => stats.find((item) => item.billing === where.billing && match(item)) ?? null;
  return (
    (city && where.state ? find((item) => item.level === "city" && item.cityKey === city && item.state === where.state && item.spaceType === where.spaceType) : null) ??
    (where.state ? find((item) => item.level === "state" && item.state === where.state && item.spaceType === where.spaceType) : null) ??
    find((item) => item.level === "type" && item.spaceType === where.spaceType) ??
    find((item) => item.level === "all")
  );
}

/** Texto do nível usado, para dizer de onde vem a referência. */
export function marketScope(stat: MarketStat, cityName: string) {
  if (stat.level === "city") return `em ${cityName}`;
  if (stat.level === "state") return `em ${stat.state}`;
  if (stat.level === "type") return "no Brasil, para esse tipo de sala";
  return "no Brasil, de todos os tipos de sala";
}

export const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
