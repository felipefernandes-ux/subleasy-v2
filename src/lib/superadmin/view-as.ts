import { notFound } from "next/navigation";
import { z } from "zod";
import type { PanelOwner } from "@/lib/panel-owner";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAudit } from "@/lib/superadmin/audit";
import { requireAdmin } from "@/lib/superadmin/auth";

/**
 * Prepara o painel de um usuário para o Super Admin ver, só leitura. Barra quem não é admin
 * antes de abrir a service role e dá 404 se o id não é de uma conta. Nada aqui grava dados da pessoa.
 */
export async function loadViewAsOwner(userId: string, path: string): Promise<{ owner: PanelOwner; email: string }> {
  await requireAdmin(path);
  if (!z.uuid().safeParse(userId).success) notFound();

  const db = createAdminClient();
  const { data, error } = await db.auth.admin.getUserById(userId);
  if (error || !data.user) notFound();

  // Ver os dados de alguém é acesso a dados pessoais: cada tela aberta fica registrada.
  await recordAudit({ action: "user.view_as", targetType: "user", targetId: userId, targetLabel: data.user.email ?? userId, details: { path } });

  return {
    owner: { id: userId, db, asAdmin: true, base: `/admin/ver-como/${userId}` },
    email: data.user.email ?? userId,
  };
}
