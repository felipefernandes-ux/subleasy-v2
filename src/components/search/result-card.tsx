"use client";

import { useRef, useState } from "react";
import { CaretLeftIcon, CaretRightIcon, GiftIcon, ImageIcon } from "@phosphor-icons/react";
import { BILLING_UNIT, SPACE_TYPES, formatPrice, photoUrl, type BillingType, type PhotoSizes, type SpaceType } from "@/lib/listing-options";
import { FramedPhoto } from "../framed-photo";

export type SearchResult = {
  id: string;
  slug: string;
  title: string;
  space_type: string;
  neighborhood: string;
  city: string;
  state: string;
  price: number;
  billing_type: string;
  photos: string[];
  photo_sizes: PhotoSizes;
  offers: string[];
  latitude: number | null;
  longitude: number | null;
  /** Ponto da área do bairro, não do endereço. */
  approximate?: boolean;
};

const MAX_PHOTOS = 4;

/**
 * Cartão da busca: até 4 fotos num carrossel (o resto fica no anúncio) e tudo abre
 * o anúncio numa nova aba, para a pessoa não perder a busca.
 */
export function ResultCard({ listing, onHover, priority }: { listing: SearchResult; onHover?: (id: string | null) => void; priority?: boolean }) {
  const photos = listing.photos.slice(0, MAX_PHOTOS);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const href = `/sala/${listing.slug}`;
  const unit = BILLING_UNIT[listing.billing_type as BillingType] ?? listing.billing_type;

  const show = (next: number) => {
    const track = trackRef.current;
    if (track) track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  };

  return (
    // Ao passar o mouse, só o título muda de cor; o marcador no mapa é que se destaca.
    <article onMouseEnter={() => onHover?.(listing.id)} onMouseLeave={() => onHover?.(null)} className="group relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-ink-100">
        {photos.length > 0 ? (
          <div
            ref={trackRef}
            onScroll={(event) => setIndex(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))}
            className={`flex size-full snap-x snap-mandatory overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${photos.length > 1 ? "overflow-x-auto" : "overflow-x-hidden"}`}
          >
            {photos.map((path, position) => (
              <a
                key={path}
                href={href}
                target="_blank"
                rel="noopener"
                tabIndex={position === 0 ? 0 : -1}
                aria-label={position === 0 ? `${listing.title} (abre em nova aba)` : undefined}
                className="relative block size-full shrink-0 snap-center"
              >
                <FramedPhoto src={photoUrl(path)} alt="" priority={priority && position === 0} size={listing.photo_sizes[path]} sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 100vw" />
                {/* Última foto do carrossel: convite para ver o resto no anúncio. */}
                {photos.length > 1 && position === photos.length - 1 && (
                  <span className="absolute inset-0 grid place-items-center bg-brand-600/55 backdrop-blur-md">
                    <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-700 shadow-raised">Ver anúncio completo</span>
                  </span>
                )}
              </a>
            ))}
          </div>
        ) : (
          <a href={href} target="_blank" rel="noopener" className="grid size-full place-items-center" aria-label={`${listing.title} (abre em nova aba)`}>
            <ImageIcon className="size-8 text-ink-400" aria-hidden />
          </a>
        )}

        {listing.offers.length > 0 && (
          <span className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-mint-700 shadow-xs">
            <GiftIcon className="size-3.5" weight="fill" aria-hidden />
            Oferta Subleasy
          </span>
        )}

        {photos.length > 1 && (
          <>
            {/* Setas aparecem ao passar o mouse; no celular, arrasta com o dedo. */}
            <Arrow side="left" hidden={index === 0} onClick={() => show(index - 1)} />
            <Arrow side="right" hidden={index === photos.length - 1} onClick={() => show(index + 1)} />
            <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
              {photos.map((path, position) => (
                <span key={path} className={`size-1.5 rounded-full transition-all ${position === index ? "scale-110 bg-white" : "bg-white/60"}`} />
              ))}
            </div>
          </>
        )}
      </div>

      <a href={href} target="_blank" rel="noopener" tabIndex={-1} className="mt-3 block">
        <span className="block truncate font-bold text-ink-900 group-hover:text-brand-700">{listing.title}</span>
        <span className="mt-0.5 block truncate text-sm text-ink-600">
          {SPACE_TYPES[listing.space_type as SpaceType] ?? listing.space_type} ・ {listing.neighborhood}, {listing.city}
        </span>
        <span className="mt-1 block text-sm">
          <strong className="font-bold text-ink-900">{formatPrice(listing.price)}</strong>
          <span className="text-ink-600">/{unit}</span>
        </span>
      </a>
    </article>
  );
}

function Arrow({ side, hidden, onClick }: { side: "left" | "right"; hidden: boolean; onClick: () => void }) {
  const Icon = side === "left" ? CaretLeftIcon : CaretRightIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Foto anterior" : "Próxima foto"}
      className={`focus-ring absolute top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink-900 opacity-0 shadow-xs transition-opacity group-hover:opacity-100 focus-visible:opacity-100 max-sm:hidden ${
        side === "left" ? "left-3" : "right-3"
      } ${hidden ? "invisible" : ""}`}
    >
      <Icon className="size-4" weight="bold" aria-hidden />
    </button>
  );
}
