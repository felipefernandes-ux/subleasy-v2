"use server";

import { refresh } from "next/cache";
import { fetchSheetCsv } from "@/lib/prospecting/sheet";
import { parseNeighborhood, parseProspectSheet } from "@/lib/prospecting/import";
import { PREVIEW_DAYS, exampleAmenities, generatePreviewCopy, newPreviewToken } from "@/lib/prospecting/preview";
import { SPECIALTY_SPACE_TYPE, isProspectStatus, type Specialty } from "@/lib/prospecting/status";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { recordAudit } from "@/lib/superadmin/audit";
import { requireAdmin } from "@/lib/superadmin/auth";

const CITY = "Maringá";
const STATE = "PR";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export type ImportState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "done"; created: number; updated: number; skipped: number; withoutWhatsApp: number };

/** Importa a aba da planilha (por link do Google Sheets ou arquivo CSV). Reimportar atualiza os contatos e preserva status e anotações. */
export async function importProspects(_state: ImportState, formData: FormData): Promise<ImportState> {
  await requireAdmin("/prospeccao/importar");

  const file = formData.get("file");
  const url = String(formData.get("url") ?? "").trim();
  let csv: string;
  if (file instanceof File && file.size > 0) {
    if (file.size > 5_000_000) return { status: "error", error: "O arquivo passa de 5 MB." };
    csv = await file.text();
  } else if (url) {
    const fetched = await fetchSheetCsv(url);
    if (!fetched.ok) return { status: "error", error: fetched.error };
    csv = fetched.csv;
  } else {
    return { status: "error", error: "Cole o link da planilha ou escolha um arquivo CSV." };
  }

  const parsed = parseProspectSheet(csv);
  if (parsed.error) return { status: "error", error: parsed.error };
  if (parsed.rows.length === 0) return { status: "error", error: "Nenhuma linha com nome foi encontrada." };

  const db = createAdminClient();
  const [{ data: existingPlaces }, { data: existingNames }] = await Promise.all([
    db.from("prospects").select("place_id").not("place_id", "is", null),
    db.from("prospects").select("name, address").is("place_id", null),
  ]);
  const knownPlaces = new Set((existingPlaces ?? []).map((row) => row.place_id));
  const knownNames = new Set((existingNames ?? []).map((row) => `${row.name}|${row.address ?? ""}`));

  const seen = new Set<string>();
  const withPlace = parsed.rows.filter((row) => {
    if (!row.place_id || seen.has(row.place_id)) return false;
    seen.add(row.place_id);
    return true;
  });
  const withoutPlace = parsed.rows.filter((row) => !row.place_id && !knownNames.has(`${row.name}|${row.address ?? ""}`));

  let created = 0;
  let updated = 0;
  try {
    for (let i = 0; i < withPlace.length; i += 100) {
      const batch = withPlace.slice(i, i + 100).map((row) => ({ ...row, source: "planilha" }));
      const { error } = await db.from("prospects").upsert(batch, { onConflict: "place_id" });
      if (error) throw error;
    }
    for (const row of withPlace) {
      if (knownPlaces.has(row.place_id)) updated++;
      else created++;
    }
    if (withoutPlace.length > 0) {
      const { error } = await db.from("prospects").insert(withoutPlace.map((row) => ({ ...row, source: "planilha" })));
      if (error) throw error;
      created += withoutPlace.length;
    }
  } catch (error) {
    console.error("[prospeccao] importação falhou:", error);
    return { status: "error", error: "Não foi possível gravar os contatos. Parte deles pode ter entrado; importe de novo, sem duplicar." };
  }

  await recordAudit({
    action: "prospect.import",
    targetType: "lead",
    targetLabel: "Prospecção",
    details: { novos: created, atualizados: updated, ignorados: parsed.skipped },
  });
  refresh();
  return {
    status: "done",
    created,
    updated,
    skipped: parsed.skipped,
    withoutWhatsApp: parsed.rows.filter((row) => !row.whatsapp_number).length,
  };
}

async function logEvent(prospectId: string, kind: string, detail: Record<string, Json | undefined> = {}) {
  const { error } = await createAdminClient().from("prospect_events").insert({ prospect_id: prospectId, kind, detail: detail as Json });
  if (error) console.error("[prospeccao] não gravou o evento:", error.message);
}

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Muda o status e guarda de onde veio. “Não contatar” é definitivo para os envios: o botão do WhatsApp some. */
export async function setProspectStatus(id: string, status: string): Promise<ActionResult> {
  await requireAdmin("/prospeccao");
  if (!UUID.test(id) || !isProspectStatus(status)) return { ok: false, error: "Status inválido." };
  const db = createAdminClient();
  const { data: current } = await db.from("prospects").select("status").eq("id", id).maybeSingle();
  if (!current) return { ok: false, error: "Prospect não encontrado." };
  if (current.status === status) return { ok: true };

  const { error } = await db.from("prospects").update({ status }).eq("id", id);
  if (error) return { ok: false, error: "Não foi possível mudar o status." };
  await logEvent(id, "status_changed", { de: current.status, para: status });
  refresh();
  return { ok: true };
}

export async function saveProspectNotes(id: string, notes: string): Promise<ActionResult> {
  await requireAdmin("/prospeccao");
  if (!UUID.test(id)) return { ok: false, error: "Prospect inválido." };
  const { error } = await createAdminClient().from("prospects").update({ notes: notes.trim().slice(0, 2000) || null }).eq("id", id);
  if (error) return { ok: false, error: "Não foi possível salvar a anotação." };
  refresh();
  return { ok: true };
}

/**
 * Registra o envio: sobe o contador de toques, guarda a data e muda o status
 * (mensagem enviada, ou prévia enviada quando o texto levava o link). Só avança: não volta quem já respondeu.
 */
export async function markProspectSent(id: string, kind: "pergunta" | "previa", channel: "whatsapp" | "instagram"): Promise<ActionResult> {
  await requireAdmin("/prospeccao");
  if (!UUID.test(id)) return { ok: false, error: "Prospect inválido." };
  const db = createAdminClient();
  const { data: current } = await db.from("prospects").select("status, touches").eq("id", id).maybeSingle();
  if (!current) return { ok: false, error: "Prospect não encontrado." };

  const next = kind === "previa" ? "previa_enviada" : "mensagem_enviada";
  const early = ["novo", "mensagem_enviada", "previa_enviada", "sem_resposta"];
  const status = early.includes(current.status) ? next : current.status;
  const { error } = await db
    .from("prospects")
    .update({ status, touches: current.touches + 1, last_contact_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: "Não foi possível registrar o envio." };
  await logEvent(id, "status_changed", { de: current.status, para: status, envio: kind, canal: channel });
  refresh();
  return { ok: true };
}

/** Registra o clique em “Enviar no WhatsApp” ou “Copiar”, sem mudar o status (quem decide é o admin). */
export async function logProspectAction(id: string, kind: "whatsapp_opened" | "message_copied", message: "pergunta" | "previa"): Promise<void> {
  await requireAdmin("/prospeccao");
  if (!UUID.test(id)) return;
  await logEvent(id, kind, { mensagem: message });
}

/**
 * Cria a prévia do anúncio (ou refaz o texto da que já existe, mantendo o mesmo link para quem já o recebeu)
 * e renova a validade. Dados de endereço e especialidade vêm da planilha; a IA só escreve o texto.
 */
export async function createProspectPreview(id: string): Promise<ActionResult> {
  await requireAdmin("/prospeccao");
  if (!UUID.test(id)) return { ok: false, error: "Prospect inválido." };
  const db = createAdminClient();
  const { data: prospect } = await db.from("prospects").select("name, address, specialty").eq("id", id).maybeSingle();
  if (!prospect) return { ok: false, error: "Prospect não encontrado." };

  const specialty = (prospect.specialty as Specialty | null) ?? null;
  const copy = await generatePreviewCopy({ name: prospect.name, specialty, address: prospect.address, city: CITY });
  const expires = new Date(Date.now() + PREVIEW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: existing } = await db.from("prospect_previews").select("token").eq("prospect_id", id).maybeSingle();
  const content = {
    title: copy.title,
    short_summary: copy.short_summary,
    description: copy.description,
    space_type: SPECIALTY_SPACE_TYPE[specialty ?? "med"],
    neighborhood: parseNeighborhood(prospect.address) ?? "Centro",
    city: CITY,
    state: STATE,
    amenities: exampleAmenities(specialty),
    generated_by: copy.generated_by,
    expires_at: expires,
    revoked_at: null,
  };
  const { error } = existing
    ? await db.from("prospect_previews").update(content).eq("prospect_id", id)
    : await db.from("prospect_previews").insert({ ...content, prospect_id: id, token: newPreviewToken() });
  if (error) {
    console.error("[prospeccao] não gravou a prévia:", error.message);
    return { ok: false, error: "Não foi possível criar a prévia." };
  }

  await logEvent(id, "preview_created", { texto: copy.generated_by, renovada: Boolean(existing) });
  await recordAudit({ action: "prospect.preview", targetType: "lead", targetId: id, targetLabel: prospect.name });
  refresh();
  return { ok: true };
}

/** Derruba o link: quem abrir vê que a prévia saiu do ar. */
export async function revokeProspectPreview(id: string): Promise<ActionResult> {
  await requireAdmin("/prospeccao");
  if (!UUID.test(id)) return { ok: false, error: "Prospect inválido." };
  const { error } = await createAdminClient().from("prospect_previews").update({ revoked_at: new Date().toISOString() }).eq("prospect_id", id);
  if (error) return { ok: false, error: "Não foi possível revogar o link." };
  refresh();
  return { ok: true };
}

export async function markClaimHandled(claimId: string, prospectId: string): Promise<ActionResult> {
  await requireAdmin("/prospeccao");
  if (!UUID.test(claimId) || !UUID.test(prospectId)) return { ok: false, error: "Pedido inválido." };
  const { error } = await createAdminClient().from("prospect_claims").update({ handled_at: new Date().toISOString() }).eq("id", claimId);
  if (error) return { ok: false, error: "Não foi possível marcar o pedido." };
  refresh();
  return { ok: true };
}
