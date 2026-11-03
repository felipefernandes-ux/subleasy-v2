import { connection } from "next/server";
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
  "prospect.import": "Importou prospects da planilha",
  "prospect.preview": "Criou a prévia de um prospect",
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

// São Paulo está em UTC-3 o ano todo (sem horário de verão desde 2019).
const SP_OFFSET = 3 * 36e5;
const DAY = 864e5;

/**
 * Anúncios aprovados hoje (dia de São Paulo), lidos do registro de auditoria. Conta anúncios, não
 * cliques: um anúncio devolvido e aprovado de novo no mesmo dia vale um. Lê com a sessão do admin
 * (a política da tabela só libera a leitura para ele): chame só depois de requireAdmin().
 */
export async function loadApprovedToday(): Promise<{ count: number; lastAt: string | null }> {
  // O corte do dia lê o relógio; sem isto o Next tenta pré-renderizar.
  await connection();
  const startOfDay = new Date(Math.floor((Date.now() - SP_OFFSET) / DAY) * DAY + SP_OFFSET).toISOString();
  const { data, error } = await (await createClient())
    .from("admin_audit_log")
    .select("created_at, target_id")
    .eq("action", "listing.approve")
    .gte("created_at", startOfDay)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(`Não foi possível ler as aprovações de hoje: ${error.message}`);
  const rows = data ?? [];
  return { count: new Set(rows.map((row) => row.target_id)).size, lastAt: rows[0]?.created_at ?? null };
}
