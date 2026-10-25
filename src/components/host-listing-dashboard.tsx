import Link from "next/link";
import { ArrowLeftIcon, ChatCircleTextIcon, EnvelopeSimpleIcon, EyeIcon, ImageIcon, PercentIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { BILLING_UNIT, formatPrice, phaseOf, photoUrl, type BillingType } from "@/lib/listing-options";
import { ListingActions } from "./host-listing-actions";
import { ShareLink } from "./share-link";
import { WhatsAppIcon, buttonClasses } from "./ui";

export type DashboardListing = {
  id: string;
  title: string;
  status: string;
  price: number;
  billing_type: string;
  neighborhood: string;
  city: string;
  photos: string[];
  email_contact: boolean;
  url: string;
  publishedOn: string | null;
  expiresOn: string | null;
  daysLeft: number | null;
};

export type DashboardMetrics = { views: number; views7: number; whatsapp: number; messages: number };

export type Inquiry = { id: string; name: string; email: string; phone: string | null; message: string; sentOn: string };

/** O anúncio publicado visto pelo anfitrião: ações, prazo, métricas completas e mensagens recebidas. */
export function ListingDashboard({ listing, metrics, inquiries }: { listing: DashboardListing; metrics: DashboardMetrics; inquiries: Inquiry[] }) {
  const phase = phaseOf(listing.status, listing.daysLeft);
  const contacts = metrics.whatsapp + metrics.messages;
  const rate = metrics.views > 0 ? Math.round((contacts / metrics.views) * 1000) / 10 : 0;
  const days = listing.daysLeft ?? 0;
  const deadline = days <= 0 ? `Expirou em ${listing.expiresOn}` : days === 1 ? "Expira amanhã" : `Expira em ${days} dias`;

  return (
    <div className="space-y-6">
      <Link href="/painel" className={`${buttonClasses("ghost", "sm")} -ml-3`}>
        <ArrowLeftIcon className="size-4" aria-hidden />
        Meus anúncios
      </Link>

      <section className="rounded-panel bg-white shadow-card ring-1 ring-ink-900/6">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-control bg-ink-100">
            {listing.photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element -- miniatura simples, já comprimida no upload
              <img src={photoUrl(listing.photos[0])} alt="" className={`size-full object-cover ${phase === "over" ? "opacity-50 grayscale" : ""}`} />
            ) : (
              <ImageIcon className="size-7 text-ink-400" aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-h3 font-bold text-ink-900">{listing.title}</h1>
            <p className="mt-0.5 text-sm text-ink-600">
              {listing.neighborhood}, {listing.city} · {formatPrice(listing.price)} por {BILLING_UNIT[listing.billing_type as BillingType] ?? listing.billing_type}
            </p>
            <p className={`mt-1.5 text-xs tabular-nums ${phase === "due" ? "font-bold text-warning-700" : "text-ink-500"}`}>
              {phase === "due" && <WarningCircleIcon className="mr-1 inline size-4 align-[-3px] text-warning-500" weight="fill" aria-hidden />}
              {phase === "paused" ? "Pausado ・ " : ""}Publicado em {listing.publishedOn} ・ {deadline}
            </p>
          </div>
        </div>
        <div className="rounded-b-panel border-t border-ink-200 bg-ink-50/60 px-5 py-3 sm:px-6">
          <ListingActions listing={{ id: listing.id, title: listing.title, url: listing.url, phase }} />
        </div>
      </section>

      <section aria-labelledby="metricas">
        <h2 id="metricas" className="text-h3 font-bold text-ink-900">
          Desempenho
        </h2>
        <p className="mt-1 text-sm text-ink-600">Desde a publicação. Cada pessoa conta uma vez por dia.</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={<EyeIcon className="size-5" aria-hidden />} label="Visualizações" value={metrics.views} note={`${metrics.views7} nos últimos 7 dias`} />
          <Stat icon={<WhatsAppIcon className="size-5" />} label="Cliques no WhatsApp" value={metrics.whatsapp} />
          <Stat icon={<ChatCircleTextIcon className="size-5" aria-hidden />} label="Mensagens por e-mail" value={metrics.messages} />
          <Stat icon={<PercentIcon className="size-5" aria-hidden />} label="Taxa de contato" value={rate} suffix="%" note="Contatos ÷ visualizações" />
        </dl>
      </section>

      {phase !== "over" && phase !== "paused" && (
        <section className="rounded-panel bg-white p-5 shadow-card ring-1 ring-ink-900/6 sm:p-6">
          <h2 className="text-h3 font-bold text-ink-900">Compartilhe o link</h2>
          <p className="mt-1 text-sm text-ink-600">No Instagram, nos grupos de WhatsApp e com colegas. Mais visitas, mais contatos.</p>
          <ShareLink url={listing.url} title={listing.title} />
        </section>
      )}

      <section aria-labelledby="mensagens">
        <h2 id="mensagens" className="text-h3 font-bold text-ink-900">
          Mensagens recebidas
        </h2>
        <p className="mt-1 text-sm text-ink-600">Enviadas pelo formulário do anúncio, para quem prefere e-mail. Elas também chegam na sua caixa de entrada.</p>
        {!listing.email_contact ? (
          <p className="mt-4 rounded-card bg-white p-5 text-sm text-ink-600 ring-1 ring-ink-200">
            Este anúncio não recebe mensagens por e-mail. Edite o anúncio e informe um e-mail de contato para ativar o formulário.
          </p>
        ) : inquiries.length === 0 ? (
          <p className="mt-4 rounded-card bg-white p-5 text-sm text-ink-600 ring-1 ring-ink-200">Nenhuma mensagem ainda.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {inquiries.map((inquiry) => (
              <li key={inquiry.id} className="rounded-card bg-white p-5 shadow-card ring-1 ring-ink-900/6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="font-bold text-ink-900">{inquiry.name}</p>
                  <p className="text-xs text-ink-500 tabular-nums">{inquiry.sentOn}</p>
                </div>
                <p className="mt-1 text-sm text-ink-600">
                  {inquiry.email}
                  {inquiry.phone && ` · ${inquiry.phone}`}
                </p>
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink-800">{inquiry.message}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`mailto:${inquiry.email}?subject=${encodeURIComponent(`Re: ${listing.title}`)}`}
                    className={buttonClasses("secondary", "sm")}
                  >
                    <EnvelopeSimpleIcon className="size-4" aria-hidden />
                    Responder por e-mail
                  </a>
                  {inquiry.phone && inquiry.phone.replace(/\D/g, "").length >= 10 && (
                    <a
                      href={`https://wa.me/55${inquiry.phone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClasses("ghost", "sm")}
                    >
                      <WhatsAppIcon className="size-4" />
                      Chamar no WhatsApp
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, label, value, suffix = "", note }: { icon: React.ReactNode; label: string; value: number; suffix?: string; note?: string }) {
  return (
    <div className="rounded-card bg-white p-4 shadow-card ring-1 ring-ink-900/6 sm:p-5">
      <dt className="flex items-center gap-2 text-sm text-ink-600">
        <span className="text-ink-500">{icon}</span>
        {label}
      </dt>
      <dd className="mt-2 text-[1.75rem] leading-none font-bold text-ink-900 tabular-nums">
        {value.toLocaleString("pt-BR")}
        {suffix}
      </dd>
      {note && <p className="mt-1.5 text-xs text-ink-500">{note}</p>}
    </div>
  );
}
