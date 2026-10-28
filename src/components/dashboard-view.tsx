import Link from "next/link";
import { connection } from "next/server";
import { ConversionCard, PriceCard, PulseChart, TurnosCard } from "@/components/dashboard-charts";
import { AnnounceButton } from "@/components/announce-button";
import { DashboardEmptyArt } from "@/components/dashboard-empty-art";
import { DashboardInsights } from "@/components/dashboard-insights";
import { DashboardKpis } from "@/components/dashboard-kpis";
import { LeadList, formatLeadDate } from "@/components/host-leads";
import { ListingRanking, ListingSpotlight, type DashboardListingRow } from "@/components/dashboard-listings";
import { buttonClasses } from "@/components/ui";
import { generateInsights, type InsightListing } from "@/lib/dashboard-insights";
import {
  PERIODS,
  aggregate,
  contactsOf,
  dayRange,
  emptyTotals,
  greetingInSaoPaulo,
  marketFor,
  nowMs,
  parsePeriod,
  priceGap,
  rateOf,
  shiftDay,
  summarizePattern,
  todayInSaoPaulo,
  type Period,
} from "@/lib/dashboard-metrics";
import { phaseOf } from "@/lib/listing-options";
import { getOrigin } from "@/lib/origin";
import { ownerRpc, type PanelOwner } from "@/lib/panel-owner";

const DAY = 24 * 60 * 60 * 1000;
const PATTERN_DAYS = 90;
const DISMISS_DAYS = 30;
const LEADS_SHOWN = 20;

/** O painel de um anunciante. Serve ao próprio e ao Super Admin vendo a conta (veja PanelOwner). */
export async function DashboardView({ searchParams, owner }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }>; owner: PanelOwner }) {
  // A sessão e o cliente do Supabase só existem na requisição.
  await connection();
  const period = parsePeriod((await searchParams).periodo);
  const { db: supabase } = owner;
  const user = { id: owner.id };
  const rpc = ownerRpc(owner);

  const now = nowMs();
  const today = todayInSaoPaulo();
  const days = dayRange(today, period);

  const [{ data: listings }, { data: daily }, { data: favorites }, { data: patternRows }, { data: profile }, { data: dismissals }] = await Promise.all([
    supabase
      .from("listings")
      .select("id, slug, title, status, price, billing_type, space_type, city, neighborhood, photos, description, published_at, expires_at")
      .eq("owner_id", user.id),
    rpc.dailyMetrics(shiftDay(days[0], -period)),
    rpc.favorites(),
    rpc.contactPattern(shiftDay(today, 1 - PATTERN_DAYS)),
    supabase.from("profiles").select("display_name, avatar_path, bio").eq("id", user.id).maybeSingle(),
    supabase
      .from("insight_dismissals")
      .select("insight_key")
      .eq("user_id", user.id)
      .gt("dismissed_at", new Date(now - DISMISS_DAYS * DAY).toISOString()),
  ]);

  const firstName = (profile?.display_name ?? "").trim().split(" ")[0];
  const greeting = firstName ? `${greetingInSaoPaulo()}, ${firstName}` : greetingInSaoPaulo();

  if (!listings || listings.length === 0) return <Empty greeting={greeting} owner={owner} />;

  // Contatos pelo formulário de todos os anúncios da pessoa. Só nome, mensagem e horário.
  const { data: inquiryRows } = await supabase
    .from("listing_inquiries")
    .select("id, listing_id, name, message, created_at")
    .in("listing_id", listings.map((listing) => listing.id))
    .order("created_at", { ascending: false })
    .limit(LEADS_SHOWN);
  const titles = new Map(listings.map((listing) => [listing.id, listing.title]));
  const leads = (inquiryRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    message: row.message,
    sentOn: formatLeadDate(row.created_at),
    listing: { id: row.listing_id, title: titles.get(row.listing_id) ?? "" },
  }));

  const withDays = listings.map((listing) => ({
    ...listing,
    photo: listing.photos[0] ?? null,
    expiresOn: listing.expires_at ? listing.expires_at.slice(0, 10) : null,
    daysLeft: listing.expires_at ? Math.ceil((new Date(listing.expires_at).getTime() - now) / DAY) : null,
  }));
  const live = withDays.filter((listing) => ["live", "due"].includes(phaseOf(listing.status, listing.daysLeft)));
  const expired = withDays.filter((listing) => phaseOf(listing.status, listing.daysLeft) === "over");

  // Preço de quem anuncia na mesma cidade, para comparar. Só anúncios no ar de outras pessoas.
  const cities = [...new Set(live.map((listing) => listing.city))];
  const { data: others } = cities.length
    ? await supabase
        .from("listings")
        .select("city, space_type, billing_type, price")
        .eq("status", "active")
        .gt("expires_at", new Date(now).toISOString())
        .neq("owner_id", user.id)
        .in("city", cities)
        .limit(1000)
    : { data: [] };

  const { byListing, series, total } = aggregate(daily ?? [], days);
  const favoriteTotals = new Map((favorites ?? []).map((row) => [row.listing_id, Number(row.total)]));
  const favoritesTotal = [...favoriteTotals.values()].reduce((sum, value) => sum + value, 0);
  const pattern = summarizePattern(patternRows ?? []);
  const hasAvatar = Boolean(profile?.avatar_path);
  const hasBio = Boolean(profile?.bio);
  const origin = await getOrigin();
  const metricsOf = (id: string) => byListing.get(id) ?? { current: emptyTotals(), previous: emptyTotals() };

  const rows: DashboardListingRow[] = live.map((listing) => {
    const metrics = metricsOf(listing.id);
    const market = marketFor(listing, others ?? []);
    return {
      id: listing.id,
      title: listing.title,
      status: listing.status,
      photos: listing.photos,
      url: `${origin}/sala/${listing.slug}`,
      photo: listing.photo,
      neighborhood: listing.neighborhood,
      city: listing.city,
      price: Number(listing.price),
      billingType: listing.billing_type,
      daysLeft: listing.daysLeft,
      views: metrics.current.views,
      contacts: contactsOf(metrics.current),
      favorites: favoriteTotals.get(listing.id) ?? 0,
      rate: rateOf(metrics.current),
      gap: priceGap(Number(listing.price), market),
      market,
      quality: [
        { label: "4 ou mais fotos", done: listing.photos.length >= 4 },
        { label: "Descrição com 200 caracteres ou mais", done: (listing.description ?? "").trim().length >= 200 },
        { label: "Foto no seu perfil", done: hasAvatar },
        { label: "Apresentação no seu perfil", done: hasBio },
      ],
    };
  });

  const insightListings: InsightListing[] = live.map((listing, index) => ({
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    photo: listing.photo,
    price: Number(listing.price),
    daysLeft: listing.daysLeft,
    expiresOn: listing.expiresOn,
    daysSincePublished: listing.published_at ? Math.floor((now - new Date(listing.published_at).getTime()) / DAY) : null,
    photoCount: listing.photos.length,
    descriptionLength: (listing.description ?? "").trim().length,
    current: metricsOf(listing.id).current,
    previous: metricsOf(listing.id).previous,
    favoritesTotal: rows[index].favorites,
    market: rows[index].market,
  }));

  const insights = generateInsights({
    period,
    listings: insightListings,
    expired: expired.map((listing) => ({ id: listing.id, title: listing.title, photo: listing.photo, expiresOn: listing.expiresOn })),
    total,
    pattern,
    profile: { hasAvatar, hasBio },
    dismissed: new Set((dismissals ?? []).map((row) => row.insight_key)),
    weekOfYear: Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.UTC(Number(today.slice(0, 4)), 0, 0)) / (7 * DAY)),
  });

  // O cartão de preço mostra o anúncio com mais visitas.
  const featured = [...rows].sort((a, b) => b.views - a.views)[0];

  return (
    <div className="space-y-4 sm:space-y-5">
      <Header greeting={greeting} period={period} owner={owner} />

      {live.length === 0 && (
        <p className="rounded-card bg-warning-500/15 p-4 text-sm text-ink-800 ring-1 ring-warning-500/30">
          Você não tem anúncios no ar agora. Os números abaixo são do período em que eles estiveram no ar.{" "}
          {!owner.asAdmin && (
            <Link href="/painel/anuncios" className="font-bold text-brand-600 hover:text-brand-700">
              Ver meus anúncios
            </Link>
          )}
        </p>
      )}

      <DashboardKpis period={period} current={total.current} previous={total.previous} series={series} favoritesTotal={favoritesTotal} />

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[2fr_1fr]">
        <PulseChart days={days} views={series.views} contacts={series.contacts} />
        <ConversionCard totals={total.current} />
      </div>

      <div className={`grid gap-4 sm:gap-5 ${featured ? "lg:grid-cols-[1.2fr_1fr]" : ""}`}>
        <TurnosCard pattern={pattern} />
        {featured && <PriceCard title={featured.title} city={featured.city} price={featured.price} billing={featured.billingType} market={featured.market} />}
      </div>

      <div className="pt-6">
        <DashboardInsights insights={insights} />
      </div>

      {rows.length > 0 && (
        <div className="pt-6">
          {rows.length === 1 ? <ListingSpotlight listing={rows[0]} /> : <ListingRanking listings={rows} />}
        </div>
      )}

      <section aria-labelledby="contatos" className="pt-6">
        <h2 id="contatos" className="text-h3 font-bold text-ink-900">
          Contatos pelo formulário
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          Pessoas que escreveram pelo formulário dos seus anúncios. Os dados de contato chegam no seu e-mail, e é de lá que você responde.
        </p>
        {leads.length === 0 ? (
          <p className="mt-4 rounded-card bg-white p-5 text-sm text-ink-600 ring-1 ring-ink-200">Nenhum contato pelo formulário ainda.</p>
        ) : (
          <LeadList leads={leads} base={owner.asAdmin ? undefined : owner.base} />
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 pt-6">
        <p className="text-xs text-ink-500">Visita = uma pessoa por anúncio por dia. Contato = clique no WhatsApp ou mensagem pelo formulário.</p>
        {/* Com mais de um anúncio, o atalho fica no topo da seção "Anúncio por anúncio". */}
        {rows.length <= 1 && (
          <Link href="/painel/anuncios" className={buttonClasses("secondary")}>
            Ver todos os meus anúncios
          </Link>
        )}
      </div>
    </div>
  );
}

function Header({ greeting, period, owner }: { greeting: string; period?: Period; owner: PanelOwner }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-2">
      <div>
        <p className="text-sm font-bold text-brand-600">{greeting}</p>
        <h1 className="mt-1 text-h2 font-bold text-ink-900">Painel</h1>
      </div>
      {period && (
        <nav aria-label="Período" className="flex rounded-full bg-white p-1 shadow-card ring-1 ring-ink-900/6">
          {PERIODS.map((option) => (
            <Link
              key={option}
              href={option === 30 ? owner.base : `${owner.base}?periodo=${option}`}
              aria-current={option === period ? "page" : undefined}
              className={`focus-ring inline-flex h-9 items-center rounded-full px-4 text-sm font-bold transition-colors ${
                option === period ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-100"
              }`}
            >
              {option} dias
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

function Empty({ greeting, owner }: { greeting: string; owner: PanelOwner }) {
  return (
    <div className="space-y-6">
      <Header greeting={greeting} owner={owner} />
      <div className="rounded-panel bg-white p-8 text-center shadow-card ring-1 ring-ink-900/6 sm:p-12">
        <DashboardEmptyArt className="mx-auto mb-6 h-auto w-60 sm:w-72" />
        <h2 className="text-h3 font-bold text-ink-900">{owner.asAdmin ? "Esta pessoa ainda não tem anúncios" : "As métricas aparecem quando você anuncia"}</h2>
        <p className="mx-auto mt-2 max-w-md text-ink-600">
          Visitas, contatos, horários de pico, preço comparado ao mercado e sugestões para melhorar o anúncio ficam aqui.
        </p>
        {!owner.asAdmin && <AnnounceButton variant="desktop" className="mt-6" />}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando o painel" className="space-y-5">
      <div className="h-16 w-1/3 animate-pulse rounded-control bg-ink-200" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-40 animate-pulse rounded-panel bg-white ring-1 ring-ink-200" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="h-80 animate-pulse rounded-panel bg-brand-900/90" />
        <div className="h-80 animate-pulse rounded-panel bg-white ring-1 ring-ink-200" />
      </div>
    </div>
  );
}
