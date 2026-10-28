import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/** Nome de cada ação na tela de auditoria. Ação que não está aqui aparece com o código. */
export const AUDIT_ACTIONS: Record<string, string> = {
  "listing.approve": "Aprovou anúncio",
  "listing.return": "Devolveu anúncio com nota",
  "listing.edit": "Editou anúncio",
  "listing.pause": "Pausou anúncio",
  "listing.resume": "Reativou anúncio",
  "listing.renew": "Renovou anúncio por 30 dias",
  "listing.delete": "Excluiu anúncio",
  "user.suspend": "Suspendeu conta",
  "user.reactivate": "Reativou conta",
  "user.roles": "Mudou papéis da conta",
  "user.delete": "Excluiu conta",
  "user.view_as": "Abriu o painel de um usuário",
  "leads.brevo_sync": "Enviou contatos ao Brevo",
};

export type AuditEntry = {
  action: string;
  targetType: "listing" | "user" | "lead" | "system";
  targetId?: string | null;
  /** Nome do alvo agora (título, e-mail): continua legível depois que o alvo some. */
  targetLabel?: string | null;
  /** O que o admin escreveu para justificar a ação. */
  reason?: string | null;
  details?: Record<string, Json | undefined>;
};

/**
 * Grava uma ação do admin em admin_audit_log. Chame depois que a ação deu certo, dentro de uma
 * server action já protegida por admin. A tabela só aceita inserção pela service role e nunca
 * muda depois. Se a gravação falhar, a ação já feita não é desfeita: o erro vai para o log do servidor.
 */
export async function recordAudit(entry: AuditEntry) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("sem sessão");

    const { error } = await createAdminClient()
      .from("admin_audit_log")
      .insert({
        admin_id: user.id,
        admin_email: user.email ?? user.id,
        action: entry.action,
        target_type: entry.targetType,
        target_id: entry.targetId ?? null,
        target_label: entry.targetLabel ?? null,
        reason: entry.reason?.trim().slice(0, 1000) || null,
        details: (entry.details ?? {}) as Json,
      });
    if (error) throw error;
  } catch (error) {
    console.error(`[audit] ação ${entry.action} sem registro:`, error);
  }
}
