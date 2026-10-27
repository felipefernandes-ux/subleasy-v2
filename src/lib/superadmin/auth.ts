import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Barra quem não é admin. Sem login vai para /entrar; logado sem ser admin vê 404,
 * para o /superadmin não revelar que existe. Chame antes de qualquer leitura com a service role.
 */
export async function requireAdmin(next = "/superadmin") {
  // O cliente do Supabase lê o relógio; sem isto o Next tenta pré-renderizar o trecho.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) notFound();
  return data.user;
}
