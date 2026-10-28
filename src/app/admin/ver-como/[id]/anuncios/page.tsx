import { Suspense } from "react";
import type { Metadata } from "next";
import { HostShell, PageIntro, Skeleton } from "@/components/host-shell";
import { MyListingsView } from "@/components/my-listings-view";
import { loadViewAsOwner } from "@/lib/superadmin/view-as";

export const metadata: Metadata = {
  title: "Anúncios do usuário",
  robots: { index: false, follow: false },
};

export default function ViewAsListingsPage({ params, searchParams }: PageProps<"/admin/ver-como/[id]/anuncios">) {
  return (
    <Suspense fallback={<HostShell wide white><Skeleton /></HostShell>}>
      <ViewAsListings params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ViewAsListings({ params, searchParams }: PageProps<"/admin/ver-como/[id]/anuncios">) {
  const { id } = await params;
  const { owner, email } = await loadViewAsOwner(id, `/admin/ver-como/${id}/anuncios`);
  return (
    <HostShell wide white viewAs={{ email, userId: id, current: "anuncios" }}>
      <PageIntro title="Meus anúncios" />
      <MyListingsView searchParams={searchParams} owner={owner} />
    </HostShell>
  );
}
