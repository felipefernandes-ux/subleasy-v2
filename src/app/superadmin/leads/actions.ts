"use server";

import { BREVO_LIST_NAME, BrevoError, brevoConfigured, ensureAttributes, ensureList, importContacts, importStatus } from "@/lib/brevo";
import { INVITE_CAMPAIGN } from "@/lib/invite-token";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildBrevoAudience, type BrevoAudience, type LeadSegment } from "@/lib/superadmin/brevo-contacts";
import { requireAdmin } from "@/lib/superadmin/auth";

/** Por grupo: quem tem convite no público, quem clicou no link e quem confirmou o interesse. */
export type InviteStats = Record<LeadSegment, { invited: number; clicked: number; confirmed: number }>;

export type BrevoPreview =
  | { ok: true; configured: boolean; total: number; bySegment: BrevoAudience["bySegment"]; skipped: BrevoAudience["skipped"]; invites: InviteStats }
  | { ok: false; error: string };

export type BrevoSyncResult =
  | { ok: true; sent: number; list: string; createdAttributes: string[]; status: string }
  | { ok: false; error: string };

/** Cruza o público com campaign_invites: o link do e-mail grava o clique e, depois, a confirmação. */
async function loadInviteStats(audience: BrevoAudience): Promise<InviteStats> {
  const { data, error } = await createAdminClient()
    .from("campaign_invites")
    .select("user_id, clicked_at, interested_at")
    .eq("campaign", INVITE_CAMPAIGN);
  if (error) throw new Error(`Não foi possível ler os convites: ${error.message}`);

  const byUser = new Map((data ?? []).map((row) => [row.user_id, row]));
  const stats: InviteStats = {
    ativo: { invited: 0, clicked: 0, confirmed: 0 },
    expirado: { invited: 0, clicked: 0, confirmed: 0 },
    rascunho: { invited: 0, clicked: 0, confirmed: 0 },
    sem_anuncio: { invited: 0, clicked: 0, confirmed: 0 },
  };
  for (const contact of audience.contacts) {
    const segment = contact.attributes.SEGMENTO as LeadSegment;
    const invite = byUser.get(contact.attributes.SUBLEASY_ID ?? "");
    stats[segment].invited++;
    if (invite?.clicked_at) stats[segment].clicked++;
    if (invite?.interested_at) stats[segment].confirmed++;
  }
  return stats;
}

/** Mostra quantos contatos iriam para o Brevo, sem enviar nada. */
export async function previewBrevoSync(): Promise<BrevoPreview> {
  await requireAdmin("/leads");
  if (!process.env.INVITE_TOKEN_SECRET) return { ok: false, error: "Falta INVITE_TOKEN_SECRET no .env.local (assina o link “Quero participar”)." };
  try {
    const audience = await buildBrevoAudience();
    const invites = await loadInviteStats(audience);
    return { ok: true, configured: brevoConfigured(), total: audience.contacts.length, bySegment: audience.bySegment, skipped: audience.skipped, invites };
  } catch (error) {
    console.error("[brevo] pré-visualização falhou:", error);
    return { ok: false, error: "Não foi possível ler a base de leads." };
  }
}

/**
 * Envia a base para a lista "Convite 2.0" do Brevo: cria os atributos e a lista se faltarem
 * e importa os contatos em lote. Não dispara e-mail nenhum; só leva os contatos.
 */
export async function syncLeadsToBrevo(confirmation: string): Promise<BrevoSyncResult> {
  const admin = await requireAdmin("/leads");
  if (confirmation.trim().toLowerCase() !== "enviar") return { ok: false, error: "Digite “enviar” para confirmar." };
  if (!brevoConfigured()) return { ok: false, error: "Falta BREVO_API_KEY no .env.local." };
  if (!process.env.INVITE_TOKEN_SECRET) return { ok: false, error: "Falta INVITE_TOKEN_SECRET no .env.local (assina o link “Quero participar”)." };

  try {
    const audience = await buildBrevoAudience();
    if (audience.contacts.length === 0) return { ok: false, error: "Nenhum contato pode ser enviado." };

    const createdAttributes = await ensureAttributes();
    const listId = await ensureList();
    const { sent, processIds } = await importContacts(listId, audience.contacts);

    // O Brevo importa em segundo plano; uma olhada rápida mostra se já terminou.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const status = (await importStatus(processIds[0]!).catch(() => ({ status: "em andamento" }))).status;

    // Ainda não existe admin_audit_log; até lá, o rastro fica no log do servidor.
    console.info(`[superadmin] ${admin.email} enviou ${sent} contato(s) ao Brevo (lista ${listId}).`);
    return { ok: true, sent, list: BREVO_LIST_NAME, createdAttributes, status };
  } catch (error) {
    console.error("[brevo] sincronização falhou:", error);
    if (error instanceof BrevoError) {
      if (error.status === 401) return { ok: false, error: `O Brevo recusou a chave: ${error.message}` };
      return { ok: false, error: `O Brevo respondeu: ${error.message}` };
    }
    return { ok: false, error: "Não foi possível enviar. Nada foi alterado no Subleasy; tente de novo." };
  }
}
