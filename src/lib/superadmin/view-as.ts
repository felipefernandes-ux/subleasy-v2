import { notFound } from "next/navigation";
import { z } from "zod";
import type { PanelOwner } from "@/lib/panel-owner";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/superadmin/auth";

/**
 * Prepara o painel de um usuário para o Super Admin ver, só leitura. Barra quem não é admin
 * antes de abrir a service role e dá 404 se o id não é de uma conta. Nada aqui grava dados da pessoa.
 */
export async function loadViewAsOwner(userId: string, path: string): Promise<{ owner: PanelOwner; email: string }> {
  const admin = await requireAdmin(path);
  if (!z.uuid().safeParse(userId).success) notFound();

  const db = createAdminClient();
  const { data, error } = await db.auth.admin.getUserById(userId);
  if (error || !data.user) notFound();

  // Ainda não existe admin_audit_log; até lá, o rastro fica no log do servidor.
  console.info(`[superadmin] ${admin.email} viu ${path} como ${data.user.email} (${userId})`);

  return {
    owner: { id: userId, db, asAdmin: true, base: `/admin/ver-como/${userId}` },
    email: data.user.email ?? userId,
  };
}
