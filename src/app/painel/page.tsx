import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircleIcon } from "@phosphor-icons/react/ssr";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { HostShell, PageIntro, Skeleton } from "@/components/host-shell";
import { HostListingCards, type HostListing } from "@/components/host-listing-cards";
import { buttonClasses } from "@/components/ui";
import { getOrigin } from "@/lib/origin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Meus anúncios",
  robots: { index: false, follow: false },
};

export default function PainelPage({ searchParams }: PageProps<"/painel">) {
  return (
    <HostShell wide white>
      <PageIntro title="Meus anúncios" />
      <Suspense fallback={<Skeleton />}>
        <MyListings searchParams={searchParams} />
      </Suspense>
    </HostShell>
  );
}

async function MyListings({ searchParams }: { searchParams: PageProps<"/painel">["searchParams"] }) {
  await connection();
  const { excluido } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/painel");

  const { data: listings } = await loadListings(supabase, user.id);

  if (!listings || listings.length === 0) {
    return (
      <div className="rounded-panel bg-white p-8 text-center shadow-card ring-1 ring-ink-900/6 sm:p-12">
        <h2 className="text-h3 font-bold text-ink-900">Você ainda não tem anúncios</h2>
        <p className="mt-2 text-ink-600">Descreva sua sala do seu jeito e a IA monta o anúncio em minutos.</p>
        <Link href="/anunciar" className={`${buttonClasses("primary", "lg")} mt-6`}>
          Anunciar sala
        </Link>
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
      <HostListingCards listings={await withMetrics(supabase, listings)} />
    </>
  );
}

type Supabase = Awaited<ReturnType<typeof createClient>>;
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
async function withMetrics(supabase: Supabase, listings: Row[]): Promise<HostListing[]> {
  const now = Date.now();
  const live = listings.filter((listing) => listing.status === "active" || listing.status === "paused").map((listing) => listing.id);
  const { data: events } = live.length ? await supabase.from("listing_events").select("listing_id, kind").in("listing_id", live) : { data: [] };
  const count = (id: string, kind: string) => (events ?? []).filter((event) => event.listing_id === id && event.kind === kind).length;

  const origin = await getOrigin();
  return listings.map((listing) => {
    const expires = listing.expires_at ? new Date(listing.expires_at).getTime() : null;
    return {
      ...listing,
      url: `${origin}/sala/${listing.slug}`,
      updatedOn: formatDate(listing.updated_at),
      submittedOn: listing.submitted_at ? formatDate(listing.submitted_at) : null,
      publishedOn: listing.published_at ? formatDate(listing.published_at) : null,
      expiresOn: listing.expires_at ? formatDate(listing.expires_at) : null,
      daysLeft: expires === null ? null : Math.ceil((expires - now) / DAY),
      views: count(listing.id, "view"),
      contacts: count(listing.id, "whatsapp_click") + count(listing.id, "email_click"),
    };
  });
}

const DAY = 24 * 60 * 60 * 1000;

// "24/10/2026", para as datas da última linha do cartão.
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
