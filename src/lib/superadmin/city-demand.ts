import { SPACE_TYPES, type SpaceType } from "@/lib/listing-options";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveCities } from "@/lib/cities";

export type CityDemand = {
  key: string;
  city: string;
  state: string;
  /** Pessoas que pediram (uma por visitante). */
  people: number;
  /** Pessoas que deixaram e-mail e ainda não foram avisadas. */
  waiting: number;
  lastAt: string;
  topType: string | null;
  /** Salas no ar nessa cidade hoje; 0 = ainda sem anúncio. */
  active: number;
};

/**
 * Pedidos de "Não encontrou a cidade que buscava?" agrupados por cidade, com as salas no ar hoje.
 * Cidade sem sala vem primeiro: é onde falta anunciante. Chame depois de requireAdmin().
 */
export async function loadCityDemand(): Promise<CityDemand[]> {
  const [{ data }, active] = await Promise.all([
    createAdminClient()
      .from("city_requests")
      .select("city, city_key, state, space_type, email, notified_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5000),
    getActiveCities(),
  ]);
  const activeByKey = new Map(active.map((option) => [option.key, option.count]));

  const groups = new Map<string, { city: string; state: string; people: number; waiting: number; lastAt: string; types: Map<string, number> }>();
  for (const row of data ?? []) {
    const key = `${row.city_key}|${row.state}`;
    const group = groups.get(key) ?? { city: row.city, state: row.state, people: 0, waiting: 0, lastAt: row.updated_at, types: new Map() };
    group.people += 1;
    if (row.email && !row.notified_at) group.waiting += 1;
    if (row.space_type) group.types.set(row.space_type, (group.types.get(row.space_type) ?? 0) + 1);
    groups.set(key, group);
  }

  return [...groups]
    .map(([key, group]): CityDemand => {
      const top = [...group.types].sort((a, b) => b[1] - a[1])[0]?.[0];
      return {
        key,
        city: group.city,
        state: group.state,
        people: group.people,
        waiting: group.waiting,
        lastAt: group.lastAt,
        topType: top ? (SPACE_TYPES[top as SpaceType] ?? null) : null,
        active: activeByKey.get(key) ?? 0,
      };
    })
    .sort((a, b) => Number(a.active > 0) - Number(b.active > 0) || b.people - a.people);
}
