import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { displayCity, normalizeCity, type CityOption } from "@/lib/city-text";

/**
 * Cidades com sala no ar agora, da mais cheia para a mais vazia. É a lista do filtro de cidade:
 * só dá para buscar onde existe anúncio. Guardada por poucos minutos; aprovar um anúncio renova na hora.
 * Cada cidade traz `trending`, para o ícone de alta no filtro.
 */
export async function getActiveCities(): Promise<CityOption[]> {
  "use cache";
  cacheTag("listings");
  cacheLife("minutes");

  const { data } = await createPublicClient()
    .from("listings")
    .select("city, state, space_type, published_at, created_at")
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .limit(2000);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const groups = new Map<string, { names: Map<string, number>; state: string; count: number; recent: number; types: Set<string> }>();
  for (const row of data ?? []) {
    const key = `${normalizeCity(row.city)}|${row.state}`;
    const group = groups.get(key) ?? { names: new Map(), state: row.state, count: 0, recent: 0, types: new Set<string>() };
    group.count += 1;
    if (new Date(row.published_at ?? row.created_at).getTime() >= weekAgo) group.recent += 1;
    group.types.add(row.space_type);
    const name = row.city.trim();
    group.names.set(name, (group.names.get(name) ?? 0) + 1);
    groups.set(key, group);
  }

  // Em alta: as 3 cidades com mais anúncios publicados nos últimos 7 dias (empates entram), com pelo menos 1.
  const recents = [...groups.values()].map((group) => group.recent).filter((recent) => recent > 0).sort((a, b) => b - a);
  const threshold = recents.length ? recents[Math.min(2, recents.length - 1)] : Infinity;

  return [...groups]
    .map(([key, group]) => {
      const name = [...group.names].sort((a, b) => b[1] - a[1])[0][0];
      return { key, city: displayCity(name), state: group.state, count: group.count, types: [...group.types], trending: group.recent > 0 && group.recent >= threshold };
    })
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, "pt-BR"));
}
