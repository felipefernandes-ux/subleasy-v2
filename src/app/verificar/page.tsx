import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AuthShell } from "@/components/auth-page";
import { VerifySessionPanel } from "@/components/verify-session-panel";
import { isAdminHost } from "@/lib/admin-host";
import { safeNextPath } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";
import { SESSION_COOKIE, verifySession } from "@/lib/two-factor-token";

export const metadata: Metadata = {
  title: "Confirme que é você",
  robots: { index: false, follow: false },
};

export default function VerifyPage({ searchParams }: PageProps<"/verificar">) {
  return (
    <AuthShell>
      <Suspense fallback={<div className="h-80 w-full animate-pulse rounded-panel bg-ink-50" aria-busy="true" />}>
        <Verify searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function Verify({ searchParams }: { searchParams: PageProps<"/verificar">["searchParams"] }) {
  await connection();
  const next = safeNextPath((await searchParams).next);
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.email || !claims.sub) redirect(`/entrar${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`);

  // Sessão que já passou pelo código não volta aqui.
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (verifySession(token, claims.sub, String(claims.session_id ?? ""))) redirect(next);

  const canTrust = !isAdminHost((await headers()).get("host"));
  return <VerifySessionPanel email={String(claims.email)} next={next} canTrust={canTrust} />;
}
