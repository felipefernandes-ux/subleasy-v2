import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { HostShell, PageIntro, Skeleton } from "@/components/host-shell";
import { MyListingsView } from "@/components/my-listings-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Meus anúncios",
  robots: { index: false, follow: false },
};

export default function PainelPage({ searchParams }: PageProps<"/painel/anuncios">) {
  return (
    <HostShell wide white>
      <PageIntro title="Meus anúncios" />
      <Suspense fallback={<Skeleton />}>
        <MyListings searchParams={searchParams} />
      </Suspense>
    </HostShell>
  );
}

async function MyListings({ searchParams }: { searchParams: PageProps<"/painel/anuncios">["searchParams"] }) {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/painel/anuncios");
  return <MyListingsView searchParams={searchParams} owner={{ id: user.id, db: supabase, asAdmin: false, base: "/painel" }} />;
}
