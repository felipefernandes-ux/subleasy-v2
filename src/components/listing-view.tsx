import type { ReactNode } from "react";
import Image from "next/image";
import { CheckIcon, MapPinIcon } from "@phosphor-icons/react/ssr";
import {
  BILLING_UNIT,
  SHIFTS,
  SHIFT_KEYS,
  SPACE_TYPES,
  WEEKDAYS,
  WEEKDAY_KEYS,
  amenityLabel,
  formatPrice,
  parseShifts,
  photoUrl,
  type BillingType,
  type SpaceType,
} from "@/lib/listing-options";

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
  shifts_available: unknown;
  photos: string[];
};

/** O anúncio como quem procura vê. Usado na página pública e na revisão do admin. */
export function ListingView({ listing, action }: { listing: PublicListing; action?: ReactNode }) {
  const shifts = parseShifts(listing.shifts_available);
  const [cover, ...rest] = listing.photos;

  return (
    <article>
      {cover && (
        <div className="grid gap-2 overflow-hidden rounded-panel sm:grid-cols-4 sm:grid-rows-2">
          <div className="relative aspect-[4/3] sm:col-span-2 sm:row-span-2 sm:aspect-auto">
            <Image src={photoUrl(cover)} alt={`Foto principal: ${listing.title}`} fill priority sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
          </div>
          {rest.slice(0, 4).map((path, index) => (
            <div key={path} className="relative hidden aspect-[4/3] sm:block">
              <Image src={photoUrl(path)} alt={`Foto ${index + 2} da sala`} fill sizes="25vw" className="object-cover" />
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

          {listing.description && (
            <div className="mt-8 space-y-4 leading-relaxed text-ink-700">
              {listing.description.split(/\n{2,}/).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}

          <h2 className="mt-10 text-h3 font-bold text-ink-900">Turnos livres</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[26rem] border-separate border-spacing-1 text-center text-xs">
              <thead>
                <tr>
                  <th className="w-16" />
                  {WEEKDAY_KEYS.map((day) => (
                    <th key={day} scope="col" className="font-bold text-ink-600">
                      {WEEKDAYS[day]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SHIFT_KEYS.map((shift) => (
                  <tr key={shift}>
                    <th scope="row" className="pr-1 text-left font-bold text-ink-600">
                      {SHIFTS[shift]}
                    </th>
                    {WEEKDAY_KEYS.map((day) => {
                      const free = shifts[day]?.includes(shift);
                      return (
                        <td key={day} className={`h-9 rounded-control ${free ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-400"}`}>
                          {free ? <CheckIcon className="mx-auto size-4" weight="bold" aria-label="Livre" /> : <span className="sr-only">Ocupado</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-panel bg-white p-6 shadow-raised ring-1 ring-ink-900/8">
            <p className="text-ink-600">
              <span className="text-h2 font-bold text-ink-900">{formatPrice(listing.price)}</span> por{" "}
              {BILLING_UNIT[listing.billing_type as BillingType] ?? listing.billing_type}
            </p>
            {listing.short_summary && <p className="mt-3 text-sm text-ink-600">{listing.short_summary}</p>}
            {action && <div className="mt-6">{action}</div>}
          </div>
        </aside>
      </div>
    </article>
  );
}
