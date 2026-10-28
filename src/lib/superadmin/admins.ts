import { connection } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ago } from "./listings";

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  twoFactor: boolean;
  lastSeen: string;
  since: string;
};

/** Quem está em admin_users, com e-mail, último acesso e 2FA reais. Chame só depois de requireAdmin(). */
export async function loadAdmins(): Promise<AdminAccount[]> {
  // "há 3 h" lê o relógio; sem isto o Next tenta pré-renderizar.
  await connection();
  const db = createAdminClient();
  const { data: rows, error } = await db.from("admin_users").select("user_id, created_at").order("created_at");
  if (error) throw new Error(`Não foi possível ler os administradores: ${error.message}`);
  if (!rows || rows.length === 0) return [];

  const ids = rows.map((row) => row.user_id);
  const [profiles, accounts] = await Promise.all([
    db.from("profiles").select("id, display_name").in("id", ids),
    Promise.all(
      ids.map(async (id) => {
        const [user, factors] = await Promise.all([db.auth.admin.getUserById(id), db.auth.admin.mfa.listFactors({ userId: id })]);
        return { id, user: user.data.user, factors: factors.data?.factors ?? [] };
      }),
    ),
  ]);
  const names = new Map((profiles.data ?? []).map((row) => [row.id, row.display_name]));
  const byId = new Map(accounts.map((account) => [account.id, account]));

  return rows.map((row) => {
    const account = byId.get(row.user_id);
    const email = account?.user?.email ?? "";
    return {
      id: row.user_id,
      name: names.get(row.user_id) || String(account?.user?.user_metadata?.full_name ?? "") || email || "Sem nome",
      email,
      twoFactor: Boolean(account?.factors.some((factor) => factor.status === "verified")),
      lastSeen: account?.user?.last_sign_in_at ? ago(account.user.last_sign_in_at) : "nunca entrou",
      since: new Date(row.created_at).toLocaleDateString("pt-BR"),
    };
  });
}
