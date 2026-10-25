import type { ReactNode } from "react";
import Link from "next/link";
import { CaretRightIcon, GiftIcon, MapPinIcon } from "@phosphor-icons/react/ssr";
import { AMENITY_ICONS, DEFAULT_AMENITY_ICON } from "@/lib/amenity-icons";
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
import { ListingShareSave } from "./listing-share-save";
import { LocationMap } from "./location-map";
import { PhotoGallery } from "./photo-gallery";

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

/** Anfitrião na página pública: só o primeiro nome, nunca contato ou sobrenome. */
export type PublicHost = { host_id: string; first_name: string; active_listings: number; member_since: string };

/**
 * O anúncio como quem procura vê, no desenho do Airbnb: título e preço, grade de fotos,
 * informações à esquerda e o bloco de contato à direita, fixo ao rolar.
 * Sem action, é a prévia do admin: sem compartilhar, salvar e barra de contato no celular.
 */
export function ListingView({
  listing,
  host,
  action,
  related,
}: {
  listing: PublicListing;
  host?: PublicHost | null;
  action?: ReactNode;
  /** Anúncios semelhantes, no fim da página. */
  related?: ReactNode;
}) {
  const sizes = parsePhotoSizes(listing.photo_sizes);
  const offers = listing.offers.filter((key): key is Offer => key in OFFERS);
  const highlights = listing.highlights.filter((key): key is Highlight => key in HIGHLIGHTS);
  const unit = BILLING_UNIT[listing.billing_type as BillingType] ?? listing.billing_type;
  const spaceType = SPACE_TYPES[listing.space_type as SpaceType] ?? listing.space_type;
  const place = `${listing.neighborhood}, ${listing.city} - ${listing.state}`;
  const price = (
    <>
      <span className="font-bold text-ink-900">{formatPrice(listing.price)}</span>
      <span className="text-ink-600">/{unit}</span>
    </>
  );

  return (
    <article>
      {/* Título e preço acima das fotos; compartilhar e salvar à direita. */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-h2 font-bold text-ink-900 sm:text-[2rem] sm:leading-tight">{listing.title}</h1>
          <p className="mt-1 text-lg">
            {price}
            <span className="text-ink-600">
              {" "}
              ・ {listing.neighborhood ? `${listing.neighborhood}, ` : ""}
              {listing.city} {listing.state}
            </span>
          </p>
        </div>
        {action && (
          <ListingShareSave
            listing={{
              id: listing.id,
              title: listing.title,
              subtitle: `${formatPrice(listing.price)}/${unit} ・ ${listing.neighborhood ? `${listing.neighborhood}, ` : ""}${listing.city} ${listing.state}`,
              cover: listing.photos[0] ? photoUrl(listing.photos[0]) : null,
            }}
          />
        )}
      </header>

      <div className="mt-6">
        <PhotoGallery photos={listing.photos.map((path) => ({ src: photoUrl(path), size: sizes[path] }))} title={listing.title} />
      </div>

      <div className="mt-8 grid gap-10 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-20">
        <div className="divide-y divide-ink-200">
          <section className="pb-8">
            <h2 className="text-h3 font-bold text-ink-900">
              {spaceType} em {listing.neighborhood}, {listing.city}
            </h2>
            <p className="mt-1 text-ink-600">
              Cobrança por {unit}
              {listing.min_rental_period && ` ・ Mínimo: ${listing.min_rental_period}`}
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
          </section>

          {listing.description && (
            <section className="py-8">
              <h2 className="text-h3 font-bold text-ink-900">Sobre a sala</h2>
              <div className="mt-4 space-y-4 leading-relaxed text-ink-700">
                {listing.description.split(/\n{2,}/).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}

          {listing.amenities.length > 0 && (
            <section className="py-8">
              <h2 className="text-h3 font-bold text-ink-900">O que a sala oferece</h2>
              <ul className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {listing.amenities.map((key) => {
                  const AmenityIcon = AMENITY_ICONS[key] ?? DEFAULT_AMENITY_ICON;
                  return (
                    <li key={key} className="flex items-center gap-3 text-ink-800">
                      <AmenityIcon className="size-6 shrink-0 text-ink-700" aria-hidden />
                      {amenityLabel(key)}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {listing.latitude !== null && listing.longitude !== null && (
            <section className="py-8">
              <h2 className="text-h3 font-bold text-ink-900">Onde fica</h2>
              <p className="mt-2 flex items-center gap-1.5 text-ink-600">
                <MapPinIcon className="size-4.5 shrink-0" aria-hidden />
                {place}
              </p>
              <LocationMap latitude={listing.latitude} longitude={listing.longitude} exact={listing.show_exact_location} className="mt-4 h-80" />
              <p className="mt-3 text-sm text-ink-500">
                {listing.show_exact_location ? "O endereço completo você combina com o anfitrião." : "Área aproximada. A localização exata é passada pelo anfitrião."}
              </p>
            </section>
          )}
          {(listing.rules.length > 0 || listing.min_rental_period) && (
            <section className="pt-8">
              <h2 className="text-h3 font-bold text-ink-900">Regras da sala</h2>
              <ul className="mt-4 list-disc space-y-1.5 pl-5 text-ink-700">
                {listing.min_rental_period && <li>Período mínimo: {listing.min_rental_period}</li>}
                {listing.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </section>
          )}

        </div>

        {/* Bloco de contato em destaque, fixo ao topo ao rolar (abaixo do cabeçalho do site). */}
        <aside id="contato" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-panel bg-white p-6 shadow-raised ring-1 ring-ink-900/8">
            <p className="text-[1.375rem]">{price}</p>
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

            {host && (
              // O bloco inteiro leva ao perfil público do anfitrião (a página vem depois).
              <Link
                href={`/anfitriao/${host.host_id}`}
                className="group focus-ring -mx-2 mt-4 flex items-center gap-3 rounded-card border-t border-ink-200 px-2 pt-5 pb-1"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-600 text-lg font-bold text-white" aria-hidden>
                  {host.first_name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-ink-900 group-hover:text-brand-700">Anunciado por {host.first_name}</span>
                  <span className="block text-xs text-ink-600">
                    {host.active_listings} {host.active_listings === 1 ? "anúncio" : "anúncios"} ・ desde {new Date(host.member_since).getFullYear()}
                  </span>
                </span>
                <CaretRightIcon className="size-4 shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-700" aria-hidden />
              </Link>
            )}
          </div>
        </aside>
      </div>

      {related}

      {/* Celular: o contato fica no fim da página, então uma barra fixa leva até ele. */}
      {action && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 backdrop-blur-md lg:hidden">
          <div className="container-page flex items-center justify-between gap-4 py-3">
            <p className="text-lg">{price}</p>
            <a href="#contato" className="focus-ring inline-flex h-11 items-center rounded-control bg-brand-600 px-5 text-sm font-bold text-white shadow-xs hover:bg-brand-500">
              Entrar em contato
            </a>
          </div>
        </div>
      )}
    </article>
  );
}
