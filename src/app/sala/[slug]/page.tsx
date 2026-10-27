import { Suspense } from "react";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { ListingView } from "@/components/listing-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ViewTracker } from "@/components/view-tracker";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { RelatedListings } from "@/components/related-listings";
import { BILLING_UNIT, SPACE_TYPES, formatPrice, photoUrl, type BillingType, type SpaceType } from "@/lib/listing-options";
import { STATUS_LABEL, getAdminClient } from "@/lib/admin-preview";
import { createPublicClient } from "@/lib/supabase/public";

// Anúncio publicado: guardado em cache e renovado quando o admin aprova (updateTag).
async function getPublicListing(slug: string) {
  "use cache";
  cacheTag(`listing:${slug}`);
  cacheLife("hours");

  const { data } = await createPublicClient()
    .from("listings")
    .select(
      "id, title, short_summary, description, space_type, billing_type, price, city, state, neighborhood, min_rental_period, rules, amenities, photos, photo_sizes, highlights, offers, latitude, longitude, show_exact_location, email_contact",
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  return data;
}

// Nome público, foto, anúncios no ar e ano de entrada do anunciante. Fica em cache junto do anúncio
// e também sob a etiqueta do anunciante, que muda quando ele troca foto ou nome.
async function getPublicHost(listingId: string, slug: string) {
  "use cache";
  cacheTag(`listing:${slug}`);
  cacheLife("hours");

  const { data } = await createPublicClient().rpc("listing_host", { p_listing_id: listingId }).maybeSingle();
  if (data) cacheTag(`profile:${data.public_id}`);
  return data;
}

// Até 4 salas parecidas: mesmo tipo na mesma cidade primeiro, depois mesma cidade, depois mesmo tipo.
async function getRelated(listing: { id: string; city: string; space_type: string }, slug: string) {
  "use cache";
  cacheTag(`listing:${slug}`, "listings");
  cacheLife("hours");

  const { data } = await createPublicClient()
    .from("listings")
    .select("slug, title, space_type, neighborhood, city, price, billing_type, photos, photo_sizes")
    .eq("status", "active")
    .neq("id", listing.id)
    .or(`city.eq."${listing.city.replace(/"/g, "")}",space_type.eq.${listing.space_type}`)
    .order("published_at", { ascending: false })
    .limit(24);
  const score = (item: { city: string; space_type: string }) => (item.city === listing.city ? 2 : 0) + (item.space_type === listing.space_type ? 1 : 0);
  return (data ?? []).sort((a, b) => score(b) - score(a)).slice(0, 4);
}

export async function generateMetadata({ params }: PageProps<"/sala/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getPublicListing(slug);
  if (!listing) return { title: "Sala não encontrada" };

  const description = listing.short_summary ?? `${listing.neighborhood}, ${listing.city}`;
  const image = listing.photos[0] ? photoUrl(listing.photos[0]) : undefined;
  return {
    title: listing.title,
    description,
    alternates: { canonical: `/sala/${slug}` },
    openGraph: { title: listing.title, description, url: `/sala/${slug}`, images: image ? [{ url: image }] : undefined },
    twitter: { card: "summary_large_image", title: listing.title, description, images: image ? [image] : undefined },
  };
}

export default function SalaPage({ params }: PageProps<"/sala/[slug]">) {
  return (
    <>
      <SiteHeader />
      <main className="container-page flex-1 pt-6 pb-24 sm:pt-10">
        <Suspense fallback={<div className="aspect-[2/1] animate-pulse rounded-panel bg-ink-100" />}>
          {params.then(({ slug }) => (
            <Sala slug={slug} />
          ))}
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

// Prévia do admin: o mesmo anúncio, sem cache, mesmo que não esteja no ar. Para os outros, null.
async function getAdminPreview(slug: string) {
  const supabase = await getAdminClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("listings")
    .select(
      "id, title, short_summary, description, space_type, billing_type, price, city, state, neighborhood, min_rental_period, rules, amenities, photos, photo_sizes, highlights, offers, latitude, longitude, show_exact_location, email_contact, status",
    )
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

async function Sala({ slug }: { slug: string }) {
  const published = await getPublicListing(slug);
  const preview = published ? null : await getAdminPreview(slug);
  const listing = published ?? preview;
  if (!listing) notFound();
  const [host, related] = await Promise.all([getPublicHost(listing.id, slug), getRelated(listing, slug)]);
  // Contexto que já vai escrito na mensagem do formulário de e-mail.
  const about = `${SPACE_TYPES[listing.space_type as SpaceType] ?? listing.space_type} em ${listing.neighborhood}, ${listing.city}, ${formatPrice(listing.price)}/${BILLING_UNIT[listing.billing_type as BillingType] ?? listing.billing_type}`;
  return (
    <>
      {preview && (
        <p role="status" className="mb-6 rounded-control border border-warning-500/40 bg-warning-500/10 px-4 py-3 text-sm text-ink-800">
          <strong className="font-bold">Prévia do admin.</strong> Este anúncio está como {STATUS_LABEL[preview.status] ?? preview.status} e só você o vê.
          O botão de contato e a contagem de visitas só funcionam com o anúncio no ar.
        </p>
      )}
      {!preview && <ViewTracker listingId={listing.id} />}
      <ListingView
        listing={listing}
        host={host}
        action={<WhatsAppButton listingId={listing.id} title={listing.title} about={about} email={listing.email_contact} />}
        related={<RelatedListings listings={related} description={`Outras opções em ${listing.city} e para a mesma área de atuação.`} />}
      />
    </>
  );
}
