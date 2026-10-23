import { Suspense } from "react";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { ListingView } from "@/components/listing-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { photoUrl } from "@/lib/listing-options";
import { createPublicClient } from "@/lib/supabase/public";

// Anúncio publicado: guardado em cache e renovado quando o admin aprova (updateTag).
async function getPublicListing(slug: string) {
  "use cache";
  cacheTag(`listing:${slug}`);
  cacheLife("hours");

  const { data } = await createPublicClient()
    .from("listings")
    .select(
      "id, title, short_summary, description, space_type, billing_type, price, city, state, neighborhood, min_rental_period, rules, amenities, shifts_available, photos",
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  return data;
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

async function Sala({ slug }: { slug: string }) {
  const listing = await getPublicListing(slug);
  if (!listing) notFound();
  return <ListingView listing={listing} action={<WhatsAppButton listingId={listing.id} title={listing.title} />} />;
}
