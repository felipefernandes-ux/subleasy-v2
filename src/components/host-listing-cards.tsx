"use client";

import Link from "next/link";
import { useState } from "react";
import { ImageIcon, TrendUpIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { BILLING_UNIT, formatPrice, phaseOf, photoUrl, type BillingType, type Phase } from "@/lib/listing-options";
import { ListingActions } from "./host-listing-actions";

export type HostListing = {
  id: string;
  title: string;
  status: string;
  price: number;
  billing_type: string;
  neighborhood: string;
  city: string;
  photos: string[];
  review_note: string | null;
  url: string;
  /** Datas já formatadas no servidor, para não divergir na hidratação. */
  updatedOn: string;
  submittedOn: string | null;
  publishedOn: string | null;
  expiresOn: string | null;
  daysLeft: number | null;
  views: number;
  contacts: number;
  favorites: number;
};

const CHIP: Record<Phase, { label: (daysLeft: number | null) => string; className: string }> = {
  draft: { label: () => "Rascunho", className: "bg-ink-100 text-ink-700" },
  review: { label: () => "Em revisão", className: "bg-warning-500/15 text-ink-800" },
  live: { label: () => "No ar", className: "bg-mint-100 text-mint-700" },
  due: { label: (days) => (days === 1 ? "Expira amanhã" : `Expira em ${days} dias`), className: "bg-warning-500/15 text-warning-700" },
  over: { label: () => "Expirado", className: "bg-ink-100 text-ink-600" },
  paused: { label: () => "Pausado", className: "bg-ink-100 text-ink-600" },
};

/**
 * Os anúncios do anunciante: foto, título e ações em cima; na última linha, as métricas
 * à esquerda e as datas à direita, em fonte pequena. No celular, a foto vira capa.
 */
export function HostListingCards({ listings }: { listings: HostListing[] }) {
  const [filter, setFilter] = useState<Group | "all">("all");
  const groups = GROUPS.map((group) => ({ ...group, count: listings.filter((listing) => groupOf(listing) === group.key).length })).filter((group) => group.count > 0);
  // Um filtro que sumiu (ex.: o último rascunho foi excluído) volta para todos.
  const active = groups.some((group) => group.key === filter) ? filter : "all";
  const visible = active === "all" ? listings : listings.filter((listing) => groupOf(listing) === active);

  return (
    <>
      {/* Filtros rápidos: só os status que têm anúncio, e só se houver mais de um. */}
      {groups.length > 1 && (
        <div role="group" aria-label="Filtrar por status" className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
          {[{ key: "all" as const, label: "Todos os anúncios", count: listings.length }, ...groups].map((group) => {
            const selected = active === group.key;
            return (
              <button
                key={group.key}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(group.key)}
                className={`focus-ring inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors ${
                  selected ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-800 hover:bg-ink-200"
                }`}
              >
                {group.label}
                <span className={`tabular-nums ${selected ? "text-white/80" : "text-ink-500"}`}>{group.count}</span>
              </button>
            );
          })}
        </div>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {visible.map((listing) => (
          <Card key={listing.id} listing={listing} />
        ))}
      </ul>
    </>
  );
}

// Grupos dos filtros, na ordem em que aparecem. Expirado fica separado de "No ar": não recebe contatos.
type Group = "live" | "over" | "paused" | "review" | "draft";
const GROUPS: { key: Group; label: string }[] = [
  { key: "live", label: "No ar" },
  { key: "over", label: "Expirados" },
  { key: "paused", label: "Pausados" },
  { key: "review", label: "Em revisão" },
  { key: "draft", label: "Rascunhos" },
];
function groupOf(listing: HostListing): Group {
  const phase = phaseOf(listing.status, listing.daysLeft);
  return phase === "due" ? "live" : phase;
}

function Card({ listing }: { listing: HostListing }) {
  const phase = phaseOf(listing.status, listing.daysLeft);
  return (
    // Sem overflow-hidden: o menu "…" precisa sair para fora do cartão.
    <li className="flex flex-col rounded-card bg-white shadow-card ring-1 ring-ink-900/6">
      <ListingCardTop listing={listing} />
      <Footer listing={listing} phase={phase} />
    </li>
  );
}

export type CardTopListing = Pick<HostListing, "id" | "title" | "status" | "price" | "billing_type" | "neighborhood" | "city" | "photos" | "review_note" | "url" | "daysLeft">;
export type CardTag = { label: string; tone: "up" | "warn" };

/** Topo do cartão de anúncio: foto, status, título, endereço e ações. Usado em Meus anúncios e no painel. */
export function ListingCardTop({ listing, tag }: { listing: CardTopListing; tag?: CardTag | null }) {
  const phase = phaseOf(listing.status, listing.daysLeft);
  const chip = CHIP[phase];

  return (
    <div className="flex flex-1 flex-col lg:flex-row lg:items-center lg:gap-5 lg:p-4">
      <Link href={`/painel/anuncios/${listing.id}`} tabIndex={-1} aria-hidden className="block shrink-0">
        <span
          className={`relative grid w-full place-items-center overflow-hidden rounded-t-card bg-ink-100 lg:size-20 lg:rounded-control ${listing.photos[0] ? "aspect-[3/2] lg:aspect-square" : "h-24 lg:h-20"}`}
        >
          {listing.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element -- miniatura simples, já comprimida no upload
            <img src={photoUrl(listing.photos[0])} alt="" className={`size-full object-cover ${phase === "over" ? "opacity-50 grayscale" : ""}`} />
          ) : (
            <ImageIcon className="size-7 text-ink-400" aria-hidden />
          )}
        </span>
      </Link>

      <div className="min-w-0 flex-1 p-4 pb-3 lg:p-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${chip.className}`}>{chip.label(listing.daysLeft)}</span>
          {tag && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${tag.tone === "up" ? "bg-mint-100 text-mint-700" : "bg-warning-500/15 text-warning-700"}`}
            >
              {tag.tone === "up" ? <TrendUpIcon className="size-3.5" weight="bold" aria-hidden /> : <WarningCircleIcon className="size-3.5" weight="fill" aria-hidden />}
              {tag.label}
            </span>
          )}
        </div>
        <Link href={`/painel/anuncios/${listing.id}`} className="focus-ring mt-1.5 block truncate rounded-sm text-lg leading-snug font-bold text-ink-900 hover:text-brand-700">
          {listing.title}
        </Link>
        <p className="mt-0.5 truncate text-sm text-ink-600">
          {listing.neighborhood}, {listing.city} · {formatPrice(listing.price)} por {BILLING_UNIT[listing.billing_type as BillingType] ?? listing.billing_type}
        </p>
        {phase === "draft" && listing.review_note && <p className="mt-1 text-sm font-bold text-warning-700">A equipe pediu um ajuste.</p>}
      </div>

      <div className="mt-auto px-4 pb-3 lg:mt-0 lg:shrink-0 lg:p-0">
        <ListingActions listing={{ id: listing.id, title: listing.title, url: listing.url, phase }} />
      </div>
    </div>
  );
}

function Footer({ listing, phase }: { listing: HostListing; phase: Phase }) {
  const left =
    phase === "draft"
      ? `Rascunho ・ editado em ${listing.updatedOn}`
      : phase === "review"
        ? `Enviado em ${listing.submittedOn ?? listing.updatedOn} ・ resposta em até 1 dia útil`
        : [
          plural(listing.views, "visualização", "visualizações"),
          plural(listing.contacts, "contato", "contatos"),
          listing.favorites > 0 ? plural(listing.favorites, "favorito", "favoritos") : null,
        ]
          .filter(Boolean)
          .join(" ・ ");

  let right: string | null = null;
  if (listing.publishedOn && phase !== "draft" && phase !== "review") {
    const days = listing.daysLeft ?? 0;
    const deadline = days <= 0 ? `Expirou em ${listing.expiresOn}` : days === 1 ? "Expira amanhã" : `Expira em ${days} dias`;
    right = `Publicado em ${listing.publishedOn} ・ ${deadline}`;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-b-card border-t border-ink-200 bg-ink-50/60 px-4 py-2.5 text-xs text-ink-500 tabular-nums">
      <span>{left}</span>
      {right &&
        (phase === "due" ? (
          // Perto do fim: cor e ícone de alerta, em negrito, para não passar despercebido.
          <span className="flex items-center gap-1.5 font-bold text-warning-700">
            <WarningCircleIcon className="size-4 text-warning-500" weight="fill" aria-hidden />
            {right}
          </span>
        ) : (
          <span>{right}</span>
        ))}
    </div>
  );
}

function plural(count: number, one: string, many: string) {
  return `${count.toLocaleString("pt-BR")} ${count === 1 ? one : many}`;
}
