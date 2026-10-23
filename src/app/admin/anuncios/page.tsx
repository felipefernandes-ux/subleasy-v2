import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CheckCircleIcon } from "@phosphor-icons/react/ssr";
import { HostShell, PageIntro, Skeleton } from "@/components/host-shell";
import { ListingList } from "@/components/listing-list";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Anúncios para aprovar",
  robots: { index: false, follow: false },
};

export default function AdminListingsPage({ searchParams }: PageProps<"/admin/anuncios">) {
  return (
    <HostShell admin>
      <PageIntro eyebrow="Admin" title="Anúncios para aprovar">
        Confira fotos, preço e descrição. Aprovar coloca a sala no ar e avisa o anfitrião por e-mail.
      </PageIntro>
      <Suspense fallback={<Skeleton />}>
        <PendingListings searchParams={searchParams} />
      </Suspense>
    </HostShell>
  );
}

async function PendingListings({ searchParams }: { searchParams: PageProps<"/admin/anuncios">["searchParams"] }) {
  await connection();
  const [params, supabase] = await Promise.all([searchParams, createClient()]);
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/");

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, status, price, billing_type, neighborhood, city, photos, submitted_at")
    .eq("status", "pending_approval")
    .order("submitted_at", { ascending: true });

  const notice = params.aprovado ? "Anúncio aprovado. O anfitrião recebeu o link por e-mail." : params.devolvido ? "Anúncio devolvido. O anfitrião recebeu o pedido de ajuste por e-mail." : null;

  return (
    <>
      {notice && (
        <p role="status" className="mb-6 flex items-center gap-2 rounded-card bg-mint-50 p-4 text-ink-800 ring-1 ring-mint-500/30">
          <CheckCircleIcon className="size-5 text-mint-700" weight="fill" aria-hidden />
          {notice}
        </p>
      )}
      {listings && listings.length > 0 ? (
        <ListingList
          listings={listings}
          hrefBase="/admin/anuncios"
          meta={(id) => `enviado ${since(listings.find((listing) => listing.id === id)?.submitted_at)}`}
        />
      ) : (
        <div className="rounded-panel bg-white p-8 text-center text-ink-600 shadow-card ring-1 ring-ink-900/6">
          Nenhum anúncio esperando aprovação.
        </div>
      )}
    </>
  );
}

function since(date?: string | null) {
  if (!date) return "agora";
  const hours = Math.round((Date.now() - Date.parse(date)) / 36e5);
  if (hours < 1) return "há menos de 1 hora";
  if (hours < 24) return `há ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.round(hours / 24);
  return `há ${days} ${days === 1 ? "dia" : "dias"}`;
}
