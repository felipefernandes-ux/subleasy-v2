/** Semanas por mês: 52 ÷ 12. */
export const WEEKS_PER_MONTH = 4.33;

/** Meses em que a montagem da sala própria é diluída (60 meses, como nos exemplos publicados). */
export const SETUP_MONTHS = 60;

export type OwnCosts = {
  rent: number;
  condo: number;
  /** Energia, água, internet e limpeza. */
  running: number;
  /** Secretária ou recepção, com encargos. */
  staff: number;
  /** Software, telefonia, contador e o que mais se repete todo mês. */
  other: number;
  /** Investimento inicial de montagem (reforma, mobiliário, equipamentos). Entra diluído. */
  setup: number;
};

export type Verdict = "sublocacao" | "completo" | "empate";

export type Comparison = {
  /** Custo fixo mensal da sala própria, com a montagem diluída. */
  fixed: number;
  /** Horas atendidas por mês. */
  hours: number;
  /** Custo mensal pagando só as horas usadas. */
  hourly: number;
  /** Economia do mês trocando a sala própria pelo preço por hora; negativa se a sala própria sai mais barata. */
  saving: number;
  yearly: number;
  /** Custo de cada hora realmente usada na sala própria: custo fixo ÷ horas atendidas. */
  usedHourCost: number | null;
  /** Ponto de virada: horas por mês em que os dois custam o mesmo (custo fixo ÷ preço da hora). */
  breakEvenHours: number | null;
  verdict: Verdict | null;
};

export const fixedCost = (costs: OwnCosts) => costs.rent + costs.condo + costs.running + costs.staff + costs.other + costs.setup / SETUP_MONTHS;

/**
 * Compara a sala própria (custo fixo, igual com a agenda cheia ou vazia) com pagar só as horas usadas.
 * O ponto de virada é o custo fixo dividido pelo preço da hora. Perto dele (15% para mais ou para menos)
 * o resultado é empate: o custo deixa de decidir sozinho.
 */
export function compare({ costs, hoursPerWeek, pricePerHour }: { costs: OwnCosts; hoursPerWeek: number; pricePerHour: number }): Comparison {
  const fixed = fixedCost(costs);
  const hours = hoursPerWeek * WEEKS_PER_MONTH;
  const hourly = hours * pricePerHour;
  const saving = fixed - hourly;
  const breakEvenHours = fixed > 0 && pricePerHour > 0 ? fixed / pricePerHour : null;
  let verdict: Verdict | null = null;
  if (breakEvenHours) {
    const ratio = hours / breakEvenHours;
    verdict = ratio < 0.85 ? "sublocacao" : ratio > 1.15 ? "completo" : "empate";
  }
  return {
    fixed,
    hours,
    hourly,
    saving,
    yearly: saving * 12,
    usedHourCost: hours > 0 ? fixed / hours : null,
    breakEvenHours,
    verdict,
  };
}

/** Exemplos publicados, para a pessoa partir de números reais e trocar pelos seus. */
export const PRESETS = {
  thiago: {
    label: "Exemplo do Dr. Thiago Perfeito (ilustrativo)",
    costs: { rent: 3000, condo: 800, running: 500, staff: 1200, other: 0, setup: 30000 } satisfies OwnCosts,
    pricePerHour: 60,
    hoursPerWeek: 12,
  },
  hiraki: {
    label: "Exemplo do Instituto Hiraki (BH, valores de 2024)",
    costs: { rent: 3000, condo: 1100, running: 1200, staff: 3500, other: 200, setup: 60000 } satisfies OwnCosts,
    pricePerHour: 40,
    hoursPerWeek: 20,
  },
} as const;
