import { Suspense } from "react";
import type { Metadata } from "next";
import { DashboardSkeleton, DashboardView } from "@/components/dashboard-view";
import { HostShell } from "@/components/host-shell";
import { loadViewAsOwner } from "@/lib/superadmin/view-as";

export const metadata: Metadata = {
  title: "Painel do usuário",
  robots: { index: false, follow: false },
};

export default function ViewAsDashboardPage({ params, searchParams }: PageProps<"/admin/ver-como/[id]">) {
  return (
    <Suspense fallback={<HostShell wide="xl"><DashboardSkeleton /></HostShell>}>
      <ViewAsDashboard params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ViewAsDashboard({ params, searchParams }: PageProps<"/admin/ver-como/[id]">) {
  const { id } = await params;
  const { owner, email } = await loadViewAsOwner(id, `/admin/ver-como/${id}`);
  return (
    <HostShell wide="xl" viewAs={{ email, userId: id, current: "painel" }}>
      <DashboardView searchParams={searchParams} owner={owner} />
    </HostShell>
  );
}
