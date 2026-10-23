import Link from "next/link";
import { CaretRightIcon, ImageIcon } from "@phosphor-icons/react/ssr";
import { BILLING_UNIT, formatPrice, photoUrl, type BillingType } from "@/lib/listing-options";
import { StatusChip } from "./host-shell";

type ListItem = {
  id: string;
  title: string;
  status: string;
  price: number;
  billing_type: string;
  neighborhood: string;
  city: string;
  photos: string[];
  review_note?: string | null;
};

/** Lista de anúncios com capa, status e preço. Usada no painel e no admin. */
export function ListingList({ listings, hrefBase, meta }: { listings: ListItem[]; hrefBase: string; meta?: (id: string) => string }) {
  return (
    <ul className="space-y-3">
      {listings.map((listing) => (
        <li key={listing.id}>
          <Link
            href={`${hrefBase}/${listing.id}`}
            className="focus-ring flex items-center gap-4 rounded-card bg-white p-3 shadow-card ring-1 ring-ink-900/6 transition-shadow hover:shadow-raised sm:p-4"
          >
            <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-control bg-ink-100 sm:size-20">
              {listing.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura simples, já comprimida no upload
                <img src={photoUrl(listing.photos[0])} alt="" className="size-full object-cover" />
              ) : (
                <ImageIcon className="size-6 text-ink-400" aria-hidden />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <StatusChip status={listing.status} />
                {listing.status === "draft" && listing.review_note && (
                  <span className="text-xs font-bold text-warning-500">Ajuste pedido</span>
                )}
              </span>
              <span className="mt-1 block truncate font-bold text-ink-900">{listing.title}</span>
              <span className="mt-0.5 block truncate text-sm text-ink-600">
                {listing.neighborhood}, {listing.city} · {formatPrice(listing.price)} por{" "}
                {BILLING_UNIT[listing.billing_type as BillingType] ?? listing.billing_type}
                {meta ? ` · ${meta(listing.id)}` : ""}
              </span>
            </span>
            <CaretRightIcon className="size-5 shrink-0 text-ink-400" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
