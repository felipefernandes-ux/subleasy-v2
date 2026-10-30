import type { ReactNode } from "react";
import Link from "next/link";
import { ImageIcon } from "@phosphor-icons/react/ssr";
import { BILLING_UNIT, SPACE_TYPES, formatPrice, parsePhotoSizes, photoUrl, type BillingType, type SpaceType } from "@/lib/listing-options";
import { FramedPhoto } from "./framed-photo";

export type RelatedListing = {
  slug: string;
  title: string;
  space_type: string;
  neighborhood: string;
  city: string;
  price: number;
  billing_type: string;
  photos: string[];
  photo_sizes: unknown;
};

/**
 * Cartão de anúncio para grades (salas semelhantes, favoritos, sugestões).
 * corner fica por cima da foto, fora do link (ex.: o coração de remover dos favoritos).
 */
export function ListingCard({ listing, corner }: { listing: RelatedListing; corner?: ReactNode }) {
  const cover = listing.photos[0];
  const sizes = parsePhotoSizes(listing.photo_sizes);
  return (
    <div className="relative">
      <Link href={`/espaco/${listing.slug}`} className="group focus-ring block rounded-card">
        <span className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-card bg-ink-100">
          {cover ? (
            <span className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.03]">
              <FramedPhoto src={photoUrl(cover)} alt="" size={sizes[cover]} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
            </span>
          ) : (
            <ImageIcon className="size-8 text-ink-400" aria-hidden />
          )}
        </span>
        <span className="mt-3 block truncate font-bold text-ink-900 group-hover:text-brand-700">{listing.title}</span>
        <span className="mt-0.5 block truncate text-sm text-ink-600">
          {SPACE_TYPES[listing.space_type as SpaceType] ?? listing.space_type} ・ {listing.neighborhood}, {listing.city}
        </span>
        <span className="mt-1 block text-sm">
          <strong className="font-bold text-ink-900">{formatPrice(listing.price)}</strong>
          <span className="text-ink-600">/{BILLING_UNIT[listing.billing_type as BillingType] ?? listing.billing_type}</span>
        </span>
      </Link>
      {corner && <div className="absolute top-3 right-3">{corner}</div>}
    </div>
  );
}

/** Grade de outras salas, para quem procura seguir navegando sem voltar à busca. */
export function RelatedListings({
  listings,
  title = "Salas semelhantes",
  description,
}: {
  listings: RelatedListing[];
  title?: string;
  description?: string;
}) {
  if (listings.length === 0) return null;

  return (
    <section aria-labelledby="semelhantes" className="mt-16 border-t border-ink-200 pt-12">
      <h2 id="semelhantes" className="text-h3 font-bold text-ink-900">
        {title}
      </h2>
      {description && <p className="mt-1 text-ink-600">{description}</p>}
      <ul className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {listings.map((listing) => (
          <li key={listing.slug}>
            <ListingCard listing={listing} />
          </li>
        ))}
      </ul>
    </section>
  );
}
