import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { ResultsSkeleton } from "@/components/search/results-skeleton";
import { SearchLayout } from "@/components/search/search-layout";
import { SearchResults, type AreaPoints } from "@/components/search/search-results";
import type { SearchResult } from "@/components/search/result-card";
import { SiteHeader } from "@/components/site-header";
import { geocodeArea, spread } from "@/lib/geocode";
import { AMENITIES, BILLING_TYPE_KEYS, SPACE_TYPE_KEYS, parsePhotoSizes } from "@/lib/listing-options";
import { getAdminClient } from "@/lib/admin-preview";
import { createPublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = {
  title: "Buscar salas",
  description: "Consultórios e salas para sublocar por hora, turno, dia ou mês. Filtre por tipo, preço e comodidades e veja no mapa.",
  alternates: { canonical: "/salas" },
};

export default function SalasPage({ searchParams }: PageProps<"/salas">) {
  // A casca (cabeçalho, filtros, áreas de lista e mapa) é estática e sai na hora;
  // só os anúncios esperam pelo banco e mostram o esqueleto enquanto isso.
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <SearchLayout>
          <Suspense fallback={<ResultsSkeleton />}>
            {searchParams.then((params) => (
              <Results params={params} />
            ))}
          </Suspense>
        </SearchLayout>
      </main>
    </>
  );
}

async function Results({ params }: { params: Awaited<PageProps<"/salas">["searchParams"]> }) {
  // Resultado sempre na hora: anúncios entram e expiram a todo momento.
  await connection();
  const results = await search(params);
  // A busca de coordenadas por bairro é lenta; a lista não espera por ela.
  return <SearchResults results={results} areaPoints={locateAreas(results)} />;
}

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
const many = (value: string | string[] | undefined) => one(value).split(",").filter(Boolean);

/**
 * Salas no ar e no prazo, com os filtros da URL. Valores fora da lista conhecida são
 * ignorados, e o texto do local perde os caracteres que mudariam a consulta.
 */
async function search(params: Awaited<PageProps<"/salas">["searchParams"]>): Promise<SearchResult[]> {
  const tipos = many(params.tipo).filter((value) => (SPACE_TYPE_KEYS as string[]).includes(value));
  const cobranca = one(params.cobranca);
  const comodidades = many(params.comodidades).filter((value) => value in AMENITIES);
  const min = Number(one(params.min));
  const max = Number(one(params.max));
  const local = one(params.local).replace(/[,()%*\\]/g, " ").trim().slice(0, 80);

  // O admin vê todos os anúncios, também os que ainda não estão no ar, para ver o site com conteúdo real.
  const adminClient = await getAdminClient();
  let query = (adminClient ?? createPublicClient())
    .from("listings")
    .select("id, slug, title, space_type, neighborhood, city, state, price, billing_type, photos, photo_sizes, offers, latitude, longitude");
  if (!adminClient) query = query.eq("status", "active").gt("expires_at", new Date().toISOString());
  if (tipos.length) query = query.in("space_type", tipos);
  if ((BILLING_TYPE_KEYS as string[]).includes(cobranca)) query = query.eq("billing_type", cobranca);
  if (comodidades.length) query = query.contains("amenities", comodidades);
  if (min > 0) query = query.gte("price", min);
  if (max > 0) query = query.lte("price", max);
  if (local) query = query.or(`city.ilike.%${local}%,neighborhood.ilike.%${local}%,state.ilike.${local}`);

  const { data, error } = await query.order("published_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(60);
  if (error) console.error("[salas]", error);

  return (data ?? []).map((listing) => ({ ...listing, photo_sizes: parsePhotoSizes(listing.photo_sizes), approximate: listing.latitude === null || listing.longitude === null }));
}

/**
 * Sala sem localização no mapa aparece na área do bairro. Uma consulta por área, uma de
 * cada vez, como pede o OpenStreetMap; as áreas já vistas voltam do cache na hora.
 */
async function locateAreas(results: SearchResult[]): Promise<AreaPoints> {
  const areas = new Map<string, [number, number] | null>();
  const points: AreaPoints = {};
  for (const listing of results) {
    if (!listing.approximate) continue;
    const key = `${listing.neighborhood}|${listing.city}|${listing.state}`;
    if (!areas.has(key)) areas.set(key, await geocodeArea(listing.neighborhood, listing.city, listing.state));
    const area = areas.get(key);
    if (area) points[listing.id] = spread(area, listing.id);
  }
  return points;
}
