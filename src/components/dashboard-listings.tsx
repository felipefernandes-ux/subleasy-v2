import Link from "next/link";
import { ArrowRightIcon, CheckCircleIcon, CircleIcon, ImageIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { ListingCardTop, type CardTag } from "./host-listing-cards";
import { buttonClasses } from "./ui";
import { BILLING_UNIT, formatPrice, photoUrl, type BillingType } from "@/lib/listing-options";
import type { Market } from "@/lib/dashboard-metrics";

export type DashboardListingRow = {
  id: string;
  title: string;
  photo: string | null;
  neighborhood: string;
  city: string;
  price: number;
  billingType: string;
  daysLeft: number | null;
  views: number;
  contacts: number;
  favorites: number;
  rate: number;
  gap: number | null;
  market: Market | null;
  quality: { label: string; done: boolean }[];
  status: string;
  photos: string[];
  url: string;
};

const LISTING_DAYS = 30;
const unit = (billing: string) => BILLING_UNIT[billing as BillingType] ?? billing;

function Thumb({ photo, size }: { photo: string | null; size: string }) {
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-control bg-ink-100 ${size}`}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- miniatura simples, já comprimida no upload
        <img src={photoUrl(photo)} alt="" className="size-full object-cover" />
      ) : (
        <ImageIcon className="size-6 text-ink-400" aria-hidden />
      )}
    </span>
  );
}

function Expiry({ daysLeft }: { daysLeft: number | null }) {
  const days = Math.max(daysLeft ?? 0, 0);
  const near = days <= 7;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${near ? "bg-warning-500/15 text-warning-700" : "bg-mint-100 text-mint-700"}`}>
      {near ? (days <= 1 ? "Expira amanhã" : `Expira em ${days} dias`) : "No ar"}
    </span>
  );
}

const pctLabel = (value: number) => `${(value * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

/** O caso mais comum no começo: um anúncio no ar. Mostra o que as métricas não mostram: prazo e qualidade. */
export function ListingSpotlight({ listing }: { listing: DashboardListingRow }) {
  const done = listing.quality.filter((item) => item.done).length;
  const progress = Math.min(Math.max(((listing.daysLeft ?? 0) / LISTING_DAYS) * 100, 0), 100);
  const near = (listing.daysLeft ?? 0) <= 7;

  return (
    <section aria-labelledby="anuncio-titulo" className="rounded-panel bg-white shadow-card ring-1 ring-ink-900/6">
      <div className="flex items-center gap-4 border-b border-ink-200 p-5">
        <Thumb photo={listing.photo} size="size-16" />
        <div className="min-w-0 flex-1">
          <h2 id="anuncio-titulo" className="sr-only">
            Seu anúncio
          </h2>
          <Link href={`/painel/anuncios/${listing.id}`} className="focus-ring block truncate rounded-sm text-lg font-bold text-ink-900 hover:text-brand-700">
            {listing.title}
          </Link>
          <p className="truncate text-sm text-ink-600">
            {listing.neighborhood}, {listing.city} · {formatPrice(listing.price)} por {unit(listing.billingType)}
          </p>
        </div>
        <Expiry daysLeft={listing.daysLeft} />
      </div>

      <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
        <div>
          <h3 className="text-sm font-bold text-ink-900">Tempo no ar</h3>
          <p className={`mt-1 text-sm ${near ? "font-bold text-warning-700" : "text-ink-600"}`}>
            {near && <WarningCircleIcon className="mr-1 inline size-4 align-[-3px] text-warning-500" weight="fill" aria-hidden />}
            {(listing.daysLeft ?? 0) <= 0 ? "Expirado" : `${listing.daysLeft} ${listing.daysLeft === 1 ? "dia restante" : "dias restantes"}`}
          </p>
          <div className="mt-3 h-1.5 rounded-full bg-ink-100" role="img" aria-label={`${Math.round(progress)}% do prazo restante`}>
            <div className={`h-full rounded-full ${near ? "bg-warning-500" : "bg-mint-500"}`} style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-ink-500">Renove antes do fim para continuar recebendo contatos.</p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-ink-900">
            Anúncio completo <span className="font-normal text-ink-500 tabular-nums">{done} de {listing.quality.length}</span>
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {listing.quality.map((item) => (
              <li key={item.label} className={`flex items-start gap-2 ${item.done ? "text-ink-600" : "text-ink-900"}`}>
                {item.done ? <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-mint-700" weight="fill" aria-hidden /> : <CircleIcon className="mt-0.5 size-4 shrink-0 text-ink-400" aria-hidden />}
                <span>
                  {item.label}
                  <span className="sr-only">{item.done ? " (feito)" : " (pendente)"}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Com mais de um anúncio: o cartão de Meus anúncios em cima, as métricas do período embaixo. */
export function ListingRanking({ listings }: { listings: DashboardListingRow[] }) {
  const ranked = [...listings].sort((a, b) => b.contacts - a.contacts || b.rate - a.rate || b.views - a.views);
  const views = listings.reduce((sum, listing) => sum + listing.views, 0);
  const contacts = listings.reduce((sum, listing) => sum + listing.contacts, 0);
  const overall = views > 0 ? contacts / views : 0;

  // Acima da média: converte mais que o conjunto dos seus anúncios e já teve contato.
  const tagOf = (listing: DashboardListingRow): CardTag | null => {
    if (listing.contacts > 0 && listing.rate > overall) return { label: "Acima da média", tone: "up" };
    if (listing.views >= 10 && listing.contacts === 0) return { label: "Pede atenção", tone: "warn" };
    return null;
  };
  const allListings = (
    <Link href="/painel/anuncios" className={buttonClasses("secondary")}>
      Ver todos os meus anúncios
      <ArrowRightIcon className="size-4" aria-hidden />
    </Link>
  );

  return (
    <section aria-labelledby="ranking-titulo">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="ranking-titulo" className="text-h3 font-bold text-ink-900">
            Anúncio por anúncio
          </h2>
          <p className="mt-1 text-sm text-ink-600">Ordenados por contatos no período. Compare o que os melhores têm e os outros não.</p>
        </div>
        <div className="shrink-0 max-sm:hidden">{allListings}</div>
      </div>
      <ul className="mt-4 space-y-3">
        {ranked.map((listing) => (
          // Sem overflow-hidden: o menu "…" das ações precisa sair do cartão.
          <li key={listing.id} className="flex flex-col rounded-card bg-white shadow-card ring-1 ring-ink-900/6">
            <ListingCardTop
              tag={tagOf(listing)}
              listing={{
                id: listing.id,
                title: listing.title,
                status: listing.status,
                price: listing.price,
                billing_type: listing.billingType,
                neighborhood: listing.neighborhood,
                city: listing.city,
                photos: listing.photos,
                review_note: null,
                url: listing.url,
                daysLeft: listing.daysLeft,
              }}
            />
            <dl className="grid grid-cols-2 gap-3 rounded-b-card border-t border-ink-200 bg-ink-50/60 px-4 py-3 text-sm sm:grid-cols-5">
              <Metric label="Visitas" value={listing.views.toLocaleString("pt-BR")} />
              <Metric label="Contatos" value={listing.contacts.toLocaleString("pt-BR")} />
              <Metric label="Conversão" value={listing.views > 0 ? pctLabel(listing.rate) : "—"} />
              <Metric label="Favoritos" value={listing.favorites.toLocaleString("pt-BR")} />
              <Metric
                label="Preço vs. mercado"
                value={listing.gap === null ? "—" : Math.abs(listing.gap) < 8 ? "Na média" : listing.gap > 0 ? `${listing.gap}% acima` : `${Math.abs(listing.gap)}% abaixo`}
              />
            </dl>
          </li>
        ))}
      </ul>
      <div className="mt-4 sm:hidden [&>a]:w-full">{allListings}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="font-bold text-ink-900 tabular-nums">{value}</dd>
    </div>
  );
}
