import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { AuthShell } from "@/components/auth-page";
import { ProfileForm } from "@/components/profile-form";
import { safeNextPath } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Complete seu cadastro",
  robots: { index: false, follow: false },
};

export default function CadastroPage({ searchParams }: PageProps<"/cadastro">) {
  return (
    <AuthShell>
      {/* Lê a sessão e a URL, que só existem na requisição. */}
      <Suspense fallback={<ProfileForm email="" defaultName="" next="/" />}>
        <ProfileFormWithUser searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function ProfileFormWithUser({
  searchParams,
}: {
  searchParams: PageProps<"/cadastro">["searchParams"];
}) {
  // O cliente do Supabase lê o relógio; sem isto o Next tenta pré-renderizar o trecho.
  await connection();
  const [{ next }, supabase] = await Promise.all([searchParams, createClient()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O Google manda o nome em full_name (ou name); o link mágico não manda nada.
  const metadata = user?.user_metadata ?? {};
  const defaultName = String(metadata.full_name ?? metadata.name ?? "");

  return (
    <ProfileForm
      email={user?.email ?? ""}
      defaultName={defaultName}
      next={safeNextPath(Array.isArray(next) ? next[0] : next)}
    />
  );
}
