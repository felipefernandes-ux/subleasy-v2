import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { normalizeCity } from "@/lib/city-text";

/** Preços dos anúncios no ar, agrupados em níveis do mais local ao mais amplo. Nunca expõe um anúncio isolado. */
export type MarketStat = {
  level: "city" | "state" | "type" | "all";
  billing: string;
  /** Preenchidos conforme o nível. */
  cityKey?: string;
  state?: string;
  spaceType?: string;
  n: number;
  p25: number;
  median: number;
  p75: number;
};

/** Menos que isto não é base: um ou dois anúncios identificam o anunciante e não dizem nada do mercado. */
export const MIN_SAMPLE = 3;

function quantile(sorted: number[], q: number) {
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * q;
  const low = Math.floor(position);
  const high = Math.ceil(position);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}

function stat(values: number[], base: Omit<MarketStat, "n" | "p25" | "median" | "p75">): MarketStat | null {
  if (values.length < MIN_SAMPLE) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return { ...base, n: sorted.length, p25: quantile(sorted, 0.25), median: quantile(sorted, 0.5), p75: quantile(sorted, 0.75) };
}

/**
 * Referência de preço pelos anúncios do Subleasy no ar. A calculadora usa o nível mais local que tem
 * pelo menos 3 anúncios do mesmo tipo e cobrança: cidade, depois estado, depois o Brasil. Cresce sozinha
 * conforme entram anúncios. Guardada por horas; aprovar um anúncio renova na hora.
 */
export async function getMarketStats(): Promise<{ stats: MarketStat[]; updatedAt: string }> {
  "use cache";
  cacheTag("listings");
  cacheLife("hours");

  const { data, error } = await createPublicClient()
    .from("listings")
    .select("city, state, space_type, billing_type, price")
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .limit(5000);
  if (error) console.error("[getMarketStats]", error);
  const rows = (data ?? []).map((row) => ({
    cityKey: normalizeCity(row.city),
    state: row.state as string,
    spaceType: row.space_type as string,
    billing: row.billing_type as string,
    price: Number(row.price),
  }));

  const groups = new Map<string, { base: Omit<MarketStat, "n" | "p25" | "median" | "p75">; values: number[] }>();
  const add = (key: string, base: Omit<MarketStat, "n" | "p25" | "median" | "p75">, price: number) => {
    const group = groups.get(key) ?? { base, values: [] };
    group.values.push(price);
    groups.set(key, group);
  };
  for (const row of rows) {
    add(`city|${row.cityKey}|${row.state}|${row.spaceType}|${row.billing}`, { level: "city", billing: row.billing, cityKey: row.cityKey, state: row.state, spaceType: row.spaceType }, row.price);
    add(`state|${row.state}|${row.spaceType}|${row.billing}`, { level: "state", billing: row.billing, state: row.state, spaceType: row.spaceType }, row.price);
    add(`type|${row.spaceType}|${row.billing}`, { level: "type", billing: row.billing, spaceType: row.spaceType }, row.price);
    add(`all|${row.billing}`, { level: "all", billing: row.billing }, row.price);
  }
  // A data sai de dentro do cache: lida na página, `new Date()` impede o pré-render.
  return { stats: [...groups.values()].flatMap((group) => stat(group.values, group.base) ?? []), updatedAt: new Date().toISOString() };
}
