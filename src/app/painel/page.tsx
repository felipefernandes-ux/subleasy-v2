import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { DashboardSkeleton, DashboardView } from "@/components/dashboard-view";
import { HostShell } from "@/components/host-shell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export default function PainelPage({ searchParams }: PageProps<"/painel">) {
  return (
    <HostShell wide="xl">
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </HostShell>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/painel">["searchParams"] }) {
  // A sessão e o cliente do Supabase só existem na requisição.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/painel");
  return <DashboardView searchParams={searchParams} owner={{ id: user.id, db: supabase, asAdmin: false, base: "/painel" }} />;
}
