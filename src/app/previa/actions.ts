"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const TOKEN = /^[A-Za-z0-9_-]{20,40}$/;

/** Prévia aberta: existe, não foi derrubada e não venceu. Devolve também o prospect, para as ações abaixo. */
async function openPreview(token: string) {
  if (!TOKEN.test(token)) return null;
  const db = createAdminClient();
  const { data: preview } = await db.from("prospect_previews").select("prospect_id, view_count, last_viewed_at, expires_at, revoked_at").eq("token", token).maybeSingle();
  if (!preview || preview.revoked_at || new Date(preview.expires_at) <= new Date()) return null;
  const { data: prospect } = await db.from("prospects").select("id, status").eq("id", preview.prospect_id).maybeSingle();
  if (!prospect || prospect.status === "nao_contatar") return null;
  return { db, preview, prospect };
}

async function isAdminViewing() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return false;
    const { data: isAdmin } = await supabase.rpc("is_admin");
    return Boolean(isAdmin);
  } catch {
    return false;
  }
}

/**
 * Conta uma visita. Roda no navegador depois que a página abre: leitores de link (a prévia do WhatsApp,
 * por exemplo) não executam o script, então não inflam a contagem. A visita do admin não conta.
 * O evento da linha do tempo só entra se a última visita foi há mais de 30 minutos.
 */
export async function trackPreviewView(token: string): Promise<void> {
  const open = await openPreview(token);
  if (!open || (await isAdminViewing())) return;
  const { db, preview, prospect } = open;
  const now = new Date();

  await db
    .from("prospect_previews")
    .update({
      view_count: preview.view_count + 1,
      first_viewed_at: preview.last_viewed_at ? undefined : now.toISOString(),
      last_viewed_at: now.toISOString(),
    })
    .eq("prospect_id", prospect.id);

  const recently = preview.last_viewed_at && now.getTime() - new Date(preview.last_viewed_at).getTime() < 30 * 60 * 1000;
  if (!recently) await db.from("prospect_events").insert({ prospect_id: prospect.id, kind: "preview_viewed", detail: { visitas: preview.view_count + 1 } });
}

const claimSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(120),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(200),
  phone: z
    .string()
    .trim()
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 13;
    }, "Informe o WhatsApp com DDD."),
});

export type ClaimState = { status: "idle" } | { status: "error"; error: string; fields?: Record<string, string> } | { status: "done" };

/**
 * “Quero esse anúncio grátis”: guarda nome, e-mail e telefone de quem pediu e marca o prospect.
 * Não cria conta nem publica: a equipe confere se a pessoa é do local e segue o fluxo normal de anúncio.
 */
export async function requestAd(token: string, _state: ClaimState, formData: FormData): Promise<ClaimState> {
  const parsed = claimSchema.safeParse({ name: formData.get("name"), email: formData.get("email"), phone: formData.get("phone") });
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ||= issue.message;
    return { status: "error", error: "Confira os campos.", fields };
  }
  const open = await openPreview(token);
  if (!open) return { status: "error", error: "Esta prévia não está mais disponível." };
  const { db, prospect } = open;

  // Teto simples contra repetição: poucos pedidos por prévia.
  const { count } = await db.from("prospect_claims").select("id", { count: "exact", head: true }).eq("prospect_id", prospect.id);
  if ((count ?? 0) >= 5) return { status: "done" };

  const { error } = await db.from("prospect_claims").insert({
    prospect_id: prospect.id,
    contact_name: parsed.data.name,
    contact_email: parsed.data.email,
    contact_phone: parsed.data.phone,
  });
  if (error) {
    console.error("[previa] não gravou o pedido:", error.message);
    return { status: "error", error: "Não foi possível enviar agora. Tente de novo em instantes." };
  }

  // Só avança o status: quem já mandou dados ou já publicou fica como está.
  const early = ["novo", "mensagem_enviada", "previa_enviada", "respondeu", "sem_resposta"];
  if (early.includes(prospect.status)) await db.from("prospects").update({ status: "quer_anuncio" }).eq("id", prospect.id);
  await db.from("prospect_events").insert({ prospect_id: prospect.id, kind: "claim_requested", detail: { nome: parsed.data.name } });
  return { status: "done" };
}

/** “Não é do meu local / não quero receber”: tira o link do ar e marca o contato como Não contatar. */
export async function optOutOfPreview(token: string): Promise<{ ok: boolean }> {
  const open = await openPreview(token);
  if (!open) return { ok: false };
  const { db, prospect } = open;
  await Promise.all([
    db.from("prospects").update({ status: "nao_contatar" }).eq("id", prospect.id),
    db.from("prospect_previews").update({ revoked_at: new Date().toISOString() }).eq("prospect_id", prospect.id),
    db.from("prospect_events").insert({ prospect_id: prospect.id, kind: "opted_out", detail: { via: "link da prévia" } }),
  ]);
  return { ok: true };
}
