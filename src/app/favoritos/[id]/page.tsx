import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeftIcon, HeartIcon, ImageIcon } from "@phosphor-icons/react/ssr";
import { ListingCard, RelatedListings, type RelatedListing } from "@/components/related-listings";
import { RemoveFavoriteButton } from "@/components/remove-favorite-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonClasses } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Lista de favoritos",
  robots: { index: false, follow: false },
};

const CARD_FIELDS = "id, slug, title, space_type, neighborhood, city, price, billing_type, photos, photo_sizes, status, expires_at";

export default function FavoriteListPage({ params }: PageProps<"/favoritos/[id]">) {
  return (
    <>
      <SiteHeader />
      <main className="container-page flex-1 pt-6 pb-24 sm:pt-10">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-panel bg-ink-100" />}>
          {params.then(({ id }) => (
            <FavoriteList id={id} />
          ))}
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function FavoriteList({ id }: { id: string }) {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=/favoritos/${id}`);

  const { data: list } = await supabase
    .from("favorite_lists")
    .select(`id, name, favorite_items(listing_id, created_at, listings(${CARD_FIELDS}))`)
    .eq("id", id)
    .maybeSingle();
  if (!list) notFound();

  const items = [...list.favorite_items].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const { available, unavailable } = splitAvailable(items);
  const suggestions = await suggest(supabase, available, items.map((item) => item.listing_id));
  const count = items.length;

  return (
    <>
      <Link href="/favoritos" className={`${buttonClasses("ghost", "sm")} -ml-3`}>
        <ArrowLeftIcon className="size-4" aria-hidden />
        Favoritos
      </Link>
      <h1 className="mt-3 text-h2 font-bold text-ink-900">{list.name}</h1>
      <p className="mt-1 text-ink-600">
        {count} {count === 1 ? "sala salva" : "salas salvas"}
      </p>

      {count === 0 ? (
        <div className="mt-10 max-w-md">
          <HeartIcon className="size-10 text-ink-400" aria-hidden />
          <p className="mt-4 text-ink-600">Esta lista está vazia. Toque em Salvar na página de uma sala para guardá-la aqui.</p>
          <Link href="/salas" className={`${buttonClasses("primary", "lg")} mt-6`}>
            Buscar salas
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {available.map((listing) => (
            <li key={listing.id}>
              <ListingCard listing={listing} corner={<RemoveFavoriteButton listId={list.id} listingId={listing.id} title={listing.title} />} />
            </li>
          ))}
          {/* Sala que saiu do ar (pausada, expirada ou excluída): fica até a pessoa tirar. */}
          {unavailable.map((item) => (
            <li key={item.listing_id} className="relative">
              <div className="grid aspect-[4/3] place-items-center rounded-card bg-ink-100 text-center">
                <span>
                  <ImageIcon className="mx-auto size-8 text-ink-400" aria-hidden />
                  <span className="mt-2 block text-sm text-ink-500">Fora do ar no momento</span>
                </span>
              </div>
              <p className="mt-3 truncate font-bold text-ink-500">{item.title ?? "Sala indisponível"}</p>
              <p className="mt-0.5 text-sm text-ink-500">O anunciante pausou ou encerrou o anúncio.</p>
              <div className="absolute top-3 right-3">
                <RemoveFavoriteButton listId={list.id} listingId={item.listing_id} title={item.title ?? "sala indisponível"} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <RelatedListings
        listings={suggestions}
        title="Sugestões para esta lista"
        description="Salas parecidas com as que você salvou: mesmas cidades e áreas de atuação."
      />
    </>
  );
}

type Item = { listing_id: string; listings: (RelatedListing & { id: string; status: string; expires_at: string | null }) | null };

// No ar e dentro do prazo aparece como cartão; o resto, como sala indisponível.
function splitAvailable(items: Item[]) {
  const now = Date.now();
  const live = (listing: Item["listings"]) =>
    listing !== null && listing.status === "active" && listing.expires_at !== null && new Date(listing.expires_at).getTime() > now;
  return {
    available: items.filter((item) => live(item.listings)).map((item) => item.listings!),
    unavailable: items.filter((item) => !live(item.listings)).map((item) => ({ listing_id: item.listing_id, title: item.listings?.title ?? null })),
  };
}

/**
 * Até 4 salas no ar, fora da lista, nas cidades e áreas de atuação das salas salvas.
 * A cidade pesa mais que a área: quem salva em Maringá quer ver Maringá.
 */
async function suggest(supabase: Awaited<ReturnType<typeof createClient>>, saved: RelatedListing[], exclude: string[]) {
  if (saved.length === 0) return [];
  const tally = (values: string[]) => values.reduce<Record<string, number>>((acc, value) => ({ ...acc, [value]: (acc[value] ?? 0) + 1 }), {});
  const cities = tally(saved.map((listing) => listing.city));
  const types = tally(saved.map((listing) => listing.space_type));
  const quote = (value: string) => `"${value.replace(/"/g, "")}"`;

  const { data } = await supabase
    .from("listings")
    .select(CARD_FIELDS)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .not("id", "in", `(${exclude.join(",")})`)
    .or(`city.in.(${Object.keys(cities).map(quote).join(",")}),space_type.in.(${Object.keys(types).join(",")})`)
    .limit(40);

  const score = (listing: RelatedListing) => (cities[listing.city] ?? 0) * 2 + (types[listing.space_type] ?? 0);
  return (data ?? []).sort((a, b) => score(b) - score(a)).slice(0, 4);
}
