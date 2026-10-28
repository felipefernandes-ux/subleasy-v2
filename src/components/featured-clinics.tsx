import { cacheLife, cacheTag } from "next/cache";
import { parsePhotoSizes } from "@/lib/listing-options";
import { buildSuggestions } from "@/lib/search-suggestions";
import { createPublicClient } from "@/lib/supabase/public";
import { ListingsCarousel } from "./listings-carousel";
import { RoomSearch } from "./room-search";
import type { SearchResult } from "./search/result-card";
import { ArrowRightIcon, Eyebrow } from "./ui";

// Salas no ar para a home, mais recentes primeiro. Renovado quando um anúncio
// entra, sai, pausa ou renova (updateTag("listings") nas ações).
async function getActiveListings(): Promise<SearchResult[]> {
  "use cache";
  cacheTag("listings");
  cacheLife("hours");

  const { data } = await createPublicClient()
    .from("listings")
    .select("id, slug, title, space_type, neighborhood, city, state, price, billing_type, photos, photo_sizes, offers, latitude, longitude")
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(12);
  return (data ?? []).map((listing) => ({ ...listing, photo_sizes: parsePhotoSizes(listing.photo_sizes) }));
}

// Sugestões da busca a partir de todos os anúncios no ar, com a mesma renovação da lista.
async function getSearchSuggestions(): Promise<string[]> {
  "use cache";
  cacheTag("listings");
  cacheLife("hours");

  const { data } = await createPublicClient()
    .from("listings")
    .select("space_type, city, neighborhood, billing_type")
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .limit(500);
  return buildSuggestions(data ?? []);
}

export async function FeaturedClinics() {
  const [listings, suggestions] = await Promise.all([getActiveListings(), getSearchSuggestions()]);
  return (
    <section id="buscar" aria-labelledby="buscar-titulo" className="scroll-mt-16 bg-ink-50">
      <div className="container-page py-20 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Para quem procura sala</Eyebrow>
          <h2
            id="buscar-titulo"
            className="mt-3 text-h1 font-bold text-ink-900"
          >
            Encontre sala para atender por turno em Maringá
          </h2>
          <p className="mt-4 text-lg text-ink-600">
            Busque pelo tipo de sala, bairro ou cidade e fale direto com o dono da sala, sem comissão.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <RoomSearch suggestions={suggestions} />
        </div>

        {listings.length > 0 && (
          <div id="salas" className="mt-16 scroll-mt-24">
            <div className="flex items-end justify-between gap-4 sm:pr-28">
              <h3 className="text-h3 font-bold text-ink-900">Salas disponíveis</h3>
              <a
                href="/espacos"
                className="focus-ring inline-flex items-center gap-1 rounded-control text-sm font-bold text-brand-600 hover:text-brand-500"
              >
                Ver todas
                <ArrowRightIcon />
              </a>
            </div>
            <div className="mt-6">
              <ListingsCarousel listings={listings} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
