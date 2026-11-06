import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { ResultsSkeleton } from "@/components/search/results-skeleton";
import { SearchLayout } from "@/components/search/search-layout";
import { SearchResults, type AreaPoints } from "@/components/search/search-results";
import type { SearchResult } from "@/components/search/result-card";
import { SiteHeader } from "@/components/site-header";
import { getActiveCities } from "@/lib/cities";
import { describeLanding, landingIntro, landingMetadata } from "@/lib/espacos-landing";
import { geocodeArea, spread } from "@/lib/geocode";
import { AMENITIES, BILLING_TYPE_KEYS, SPACE_TYPE_KEYS, parsePhotoSizes } from "@/lib/listing-options";
import { getAdminClient } from "@/lib/admin-preview";
import { createPublicClient } from "@/lib/supabase/public";

const DEFAULT_METADATA: Metadata = {
  title: "Buscar salas",
  description: "Consultórios e salas para sublocar por hora, turno, dia ou mês. Filtre por tipo, preço e comodidades e veja no mapa.",
  alternates: { canonical: "/espacos" },
};

/** Título próprio por cidade e tipo (ex.: /espacos?local=São+Paulo&tipo=consultorio_medico); sem eles vale o padrão. */
export async function generateMetadata({ searchParams }: PageProps<"/espacos">): Promise<Metadata> {
  const params = await searchParams;
  const landing = describeLanding(params, await getActiveCities());
  if (landing) return landingMetadata(landing);
  // Busca com filtros soltos ou cidade desconhecida: não vale indexar.
  return Object.keys(params).length ? { ...DEFAULT_METADATA, robots: { index: false, follow: true } } : DEFAULT_METADATA;
}

export default async function SalasPage({ searchParams }: PageProps<"/espacos">) {
  // Cidades com sala no ar: a lista do filtro. Vem do cache, então a casca continua estática.
  const cities = await getActiveCities();
  // A casca (cabeçalho, filtros, áreas de lista e mapa) é estática e sai na hora;
  // só os anúncios esperam pelo banco e mostram o esqueleto enquanto isso.
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <SearchLayout cities={cities}>
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

async function Results({ params }: { params: Awaited<PageProps<"/espacos">["searchParams"]> }) {
  // Resultado sempre na hora: anúncios entram e expiram a todo momento.
  await connection();
  const [results, cities] = await Promise.all([search(params), getActiveCities()]);
  const landing = describeLanding(params, cities);
  const heading = landing ? { title: landing.title, intro: landingIntro(results.length, landing) } : undefined;
  // A busca de coordenadas por bairro é lenta; a lista não espera por ela.
  return <SearchResults results={results} areaPoints={locateAreas(results)} heading={heading} tipo={one(params.tipo).split(",")[0] ?? ""} />;
}

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
const many = (value: string | string[] | undefined) => one(value).split(",").filter(Boolean);

/**
 * Salas no ar e no prazo, com os filtros da URL. Valores fora da lista conhecida são
 * ignorados, e o texto do local perde os caracteres que mudariam a consulta.
 */
async function search(params: Awaited<PageProps<"/espacos">["searchParams"]>): Promise<SearchResult[]> {
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
