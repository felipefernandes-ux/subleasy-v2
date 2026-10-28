import { CheckCircleIcon } from "@phosphor-icons/react/ssr";
import { connection } from "next/server";
import { AnnounceButton } from "@/components/announce-button";
import { HostListingCards, type HostListing } from "@/components/host-listing-cards";
import { getOrigin } from "@/lib/origin";
import { ownerRpc, type PanelOwner } from "@/lib/panel-owner";

/** Meus anúncios de um anunciante. Serve ao próprio e ao Super Admin vendo a conta (veja PanelOwner). */
export async function MyListingsView({ searchParams, owner }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }>; owner: PanelOwner }) {
  await connection();
  const { excluido } = await searchParams;
  const supabase = owner.db;

  const { data: listings } = await loadListings(supabase, owner.id);

  if (!listings || listings.length === 0) {
    return (
      <div className="rounded-panel bg-white p-8 text-center shadow-card ring-1 ring-ink-900/6 sm:p-12">
        <h2 className="text-h3 font-bold text-ink-900">{owner.asAdmin ? "Esta pessoa ainda não tem anúncios" : "Você ainda não tem anúncios"}</h2>
        {!owner.asAdmin && (
          <>
            <p className="mt-2 text-ink-600">Descreva sua sala do seu jeito e a IA monta o anúncio em minutos.</p>
            <AnnounceButton variant="desktop" className="mt-6" />
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {excluido && (
        <p role="status" className="mb-4 flex items-center gap-2 rounded-card bg-mint-50 p-4 text-ink-800 ring-1 ring-mint-500/30">
          <CheckCircleIcon className="size-5 text-mint-700" weight="fill" aria-hidden />
          Anúncio excluído. Obrigado por contar o motivo.
        </p>
      )}
      <HostListingCards listings={await withMetrics(owner, listings)} />
    </>
  );
}

type Supabase = PanelOwner["db"];
type Row = NonNullable<Awaited<ReturnType<typeof loadListings>>["data"]>[number];

function loadListings(supabase: Supabase, userId: string) {
  return supabase
    .from("listings")
    .select(
      "id, slug, title, status, price, billing_type, neighborhood, city, photos, review_note, updated_at, submitted_at, published_at, expires_at",
    )
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });
}

// Métricas desde a publicação (um evento por visitante por dia) e o prazo de cada anúncio.
async function withMetrics(owner: PanelOwner, listings: Row[]): Promise<HostListing[]> {
  const supabase = owner.db;
  const now = Date.now();
  const live = listings.filter((listing) => listing.status === "active" || listing.status === "paused").map((listing) => listing.id);
  const [{ data: events }, { data: favorites }] = await Promise.all([
    live.length ? supabase.from("listing_events").select("listing_id, kind").in("listing_id", live) : Promise.resolve({ data: [] }),
    ownerRpc(owner).favorites(),
  ]);
  const favoriteCount = new Map((favorites ?? []).map((row) => [row.listing_id, Number(row.total)]));
  const count = (id: string, kind: string) => (events ?? []).filter((event) => event.listing_id === id && event.kind === kind).length;

  const origin = await getOrigin();
  return listings.map((listing) => {
    const expires = listing.expires_at ? new Date(listing.expires_at).getTime() : null;
    return {
      ...listing,
      url: `${origin}/espaco/${listing.slug}`,
      updatedOn: formatDate(listing.updated_at),
      submittedOn: listing.submitted_at ? formatDate(listing.submitted_at) : null,
      publishedOn: listing.published_at ? formatDate(listing.published_at) : null,
      expiresOn: listing.expires_at ? formatDate(listing.expires_at) : null,
      daysLeft: expires === null ? null : Math.ceil((expires - now) / DAY),
      views: count(listing.id, "view"),
      contacts: count(listing.id, "whatsapp_click") + count(listing.id, "email_click"),
      favorites: favoriteCount.get(listing.id) ?? 0,
    };
  });
}

const DAY = 24 * 60 * 60 * 1000;

// "24/10/2026", para as datas da última linha do cartão.
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
