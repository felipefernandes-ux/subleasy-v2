import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { HostShell, PageIntro, Skeleton } from "@/components/host-shell";
import { ListingList } from "@/components/listing-list";
import { buttonClasses } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Meus anúncios",
  robots: { index: false, follow: false },
};

export default function PainelPage() {
  return (
    <HostShell>
      <PageIntro title="Meus anúncios" />
      <Suspense fallback={<Skeleton />}>
        <MyListings />
      </Suspense>
    </HostShell>
  );
}

async function MyListings() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/painel");

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, status, price, billing_type, neighborhood, city, photos, review_note, updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

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

  return <ListingList listings={listings} hrefBase="/painel/anuncios" />;
}
