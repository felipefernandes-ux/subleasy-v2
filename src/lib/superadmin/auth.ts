import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type AdminIdentity = { name: string; firstName: string; twoFactor: boolean };

/**
 * Barra quem não é admin. Sem login vai para /entrar; logado sem ser admin vê 404,
 * para o painel não revelar que existe. Chame antes de qualquer leitura com a service role.
 */
export async function requireAdmin(next = "/") {
  // O cliente do Supabase lê o relógio; sem isto o Next tenta pré-renderizar o trecho.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) notFound();
  return data.user;
}

/** Nome e 2FA de quem está logado, para o menu e a saudação. Chame depois de requireAdmin(). */
export async function getAdminIdentity(): Promise<AdminIdentity> {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return { name: "Admin", firstName: "", twoFactor: false };
  const [{ data: profile }, { data: factors }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.auth.mfa.listFactors(),
  ]);
  const name = profile?.display_name || String(user.user_metadata?.full_name ?? "") || user.email || "Admin";
  return {
    name,
    firstName: name.includes("@") ? "" : name.split(/\s+/)[0],
    twoFactor: Boolean(factors?.totp.some((factor) => factor.status === "verified")),
  };
}
