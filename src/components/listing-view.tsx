import type { ReactNode } from "react";
import { CheckIcon, GiftIcon, MapPinIcon } from "@phosphor-icons/react/ssr";
import {
  BILLING_UNIT,
  HIGHLIGHTS,
  OFFERS,
  SPACE_TYPES,
  amenityLabel,
  formatPrice,
  parsePhotoSizes,
  photoUrl,
  type BillingType,
  type Highlight,
  type Offer,
  type SpaceType,
} from "@/lib/listing-options";
import { FramedPhoto } from "./framed-photo";
import { LocationMap } from "./location-map";

export type PublicListing = {
  id: string;
  title: string;
  short_summary: string | null;
  description: string | null;
  space_type: string;
  billing_type: string;
  price: number;
  city: string;
  state: string;
  neighborhood: string;
  min_rental_period: string | null;
  rules: string[];
  amenities: string[];
  photos: string[];
  photo_sizes: unknown;
  highlights: string[];
  offers: string[];
  latitude: number | null;
  longitude: number | null;
  show_exact_location: boolean;
};

/** O anúncio como quem procura vê. Usado na página pública e na revisão do admin. */
export function ListingView({ listing, action }: { listing: PublicListing; action?: ReactNode }) {
  const [cover, ...rest] = listing.photos;
  const sizes = parsePhotoSizes(listing.photo_sizes);
  const offers = listing.offers.filter((key): key is Offer => key in OFFERS);
  const highlights = listing.highlights.filter((key): key is Highlight => key in HIGHLIGHTS);

  return (
    <article>
      {cover && (
        <div className="grid gap-2 overflow-hidden rounded-panel sm:grid-cols-4 sm:grid-rows-2">
          <div className="relative aspect-[4/3] overflow-hidden bg-ink-100 sm:col-span-2 sm:row-span-2 sm:aspect-auto">
            <FramedPhoto src={photoUrl(cover)} alt={`Foto principal: ${listing.title}`} size={sizes[cover]} priority sizes="(min-width: 640px) 50vw, 100vw" />
          </div>
          {rest.slice(0, 4).map((path, index) => (
            <div key={path} className="relative hidden aspect-[4/3] overflow-hidden bg-ink-100 sm:block">
              <FramedPhoto src={photoUrl(path)} alt={`Foto ${index + 2} da sala`} size={sizes[path]} sizes="25vw" />
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div>
          <p className="text-sm font-bold text-brand-600">{SPACE_TYPES[listing.space_type as SpaceType] ?? listing.space_type}</p>
          <h1 className="mt-1 text-h2 font-bold text-ink-900 sm:text-h1">{listing.title}</h1>
          <p className="mt-3 flex items-center gap-1.5 text-ink-600">
            <MapPinIcon className="size-4.5 shrink-0" aria-hidden />
            {listing.neighborhood}, {listing.city} - {listing.state}
          </p>
          {highlights.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {highlights.map((key) => (
                <li key={key} className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-800 ring-1 ring-brand-100">
                  {HIGHLIGHTS[key]}
                </li>
              ))}
            </ul>
          )}

          {listing.description && (
            <div className="mt-8 space-y-4 leading-relaxed text-ink-700">
              {listing.description.split(/\n{2,}/).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}

          {listing.amenities.length > 0 && (
            <>
              <h2 className="mt-10 text-h3 font-bold text-ink-900">O que a sala tem</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {listing.amenities.map((key) => (
                  <li key={key} className="flex items-center gap-2 text-ink-700">
                    <CheckIcon className="size-4 text-mint-700" weight="bold" aria-hidden />
                    {amenityLabel(key)}
                  </li>
                ))}
              </ul>
            </>
          )}

          {(listing.rules.length > 0 || listing.min_rental_period) && (
            <>
              <h2 className="mt-10 text-h3 font-bold text-ink-900">Regras</h2>
              <ul className="mt-4 list-disc space-y-1.5 pl-5 text-ink-700">
                {listing.min_rental_period && <li>Período mínimo: {listing.min_rental_period}</li>}
                {listing.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </>
          )}

          {listing.latitude !== null && listing.longitude !== null && (
            <>
              <h2 className="mt-10 text-h3 font-bold text-ink-900">Onde fica</h2>
              <p className="mt-2 text-ink-600">
                {listing.neighborhood}, {listing.city} - {listing.state}.{" "}
                {listing.show_exact_location ? "O endereço completo você combina com o anfitrião." : "A localização exata é passada pelo anfitrião."}
              </p>
              <LocationMap latitude={listing.latitude} longitude={listing.longitude} exact={listing.show_exact_location} className="mt-4 h-80" />
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-panel bg-white p-6 shadow-raised ring-1 ring-ink-900/8">
            <p className="text-ink-600">
              <span className="text-h2 font-bold text-ink-900">{formatPrice(listing.price)}</span> por{" "}
              {BILLING_UNIT[listing.billing_type as BillingType] ?? listing.billing_type}
            </p>
            {listing.short_summary && <p className="mt-3 text-sm text-ink-600">{listing.short_summary}</p>}
            {offers.length > 0 && (
              <div className="mt-5 rounded-card bg-mint-50 p-4 ring-1 ring-mint-500/30">
                <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-mint-700 uppercase">
                  <GiftIcon className="size-4" weight="fill" aria-hidden />
                  Oferta para quem vem pelo Subleasy
                </p>
                <ul className="mt-2 space-y-1">
                  {offers.map((key) => (
                    <li key={key} className="text-sm text-ink-800">
                      <strong className="font-bold text-ink-900">{OFFERS[key].title}.</strong> {OFFERS[key].text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {action && <div className="mt-6">{action}</div>}
          </div>
        </aside>
      </div>
    </article>
  );
}
