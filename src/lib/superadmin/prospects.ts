import { getPublicOrigin } from "@/lib/origin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { PROSPECT_STATUS_KEYS, type ProspectStatus } from "@/lib/prospecting/status";

export type Prospect = Database["public"]["Tables"]["prospects"]["Row"];
export type ProspectPreview = Database["public"]["Tables"]["prospect_previews"]["Row"];
export type ProspectEvent = Database["public"]["Tables"]["prospect_events"]["Row"];
export type ProspectClaim = Database["public"]["Tables"]["prospect_claims"]["Row"];

export type ProspectListItem = Pick<
  Prospect,
  "id" | "name" | "address" | "priority" | "specialty" | "status" | "whatsapp_number" | "touches" | "last_contact_at" | "message_model"
> & { previewViews: number; hasPreview: boolean; pendingClaims: number };

export type ProspectFilters = { status?: string; q?: string; channel?: string; page?: number };

export const PAGE_SIZE = 50;

/** Endereço de uma prévia. Em produção é o do site público; PROSPECT_PREVIEW_BASE_URL força outro (útil em desenvolvimento). */
export async function previewUrl(token: string) {
  const base = (process.env.PROSPECT_PREVIEW_BASE_URL ?? (await getPublicOrigin())).replace(/\/$/, "");
  return `${base}/previa/${token}`;
}

/** Lista paginada com filtros e a contagem por status. Chame depois de requireAdmin(). */
export async function loadProspects(filters: ProspectFilters) {
  const db = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);

  let query = db
    .from("prospects")
    .select("id, name, address, priority, specialty, status, whatsapp_number, touches, last_contact_at, message_model", { count: "exact" })
    .order("priority", { ascending: false, nullsFirst: false })
    .order("name")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (filters.status && (PROSPECT_STATUS_KEYS as string[]).includes(filters.status)) query = query.eq("status", filters.status);
  if (filters.channel === "whatsapp") query = query.not("whatsapp_number", "is", null);
  if (filters.channel === "sem_whatsapp") query = query.is("whatsapp_number", null);
  const q = filters.q?.trim().replace(/[%,()]/g, " ");
  if (q) query = query.or(`name.ilike.%${q}%,address.ilike.%${q}%`);

  const [{ data, count, error }, statuses] = await Promise.all([query, db.from("prospects").select("status")]);
  if (error) throw new Error(`Não foi possível ler os prospects: ${error.message}`);

  const ids = (data ?? []).map((row) => row.id);
  const [previews, claims] = await Promise.all([
    ids.length ? db.from("prospect_previews").select("prospect_id, view_count").in("prospect_id", ids) : { data: [] },
    ids.length ? db.from("prospect_claims").select("prospect_id").is("handled_at", null).in("prospect_id", ids) : { data: [] },
  ]);
  const previewBy = new Map((previews.data ?? []).map((row) => [row.prospect_id, row.view_count]));
  const claimsBy = new Map<string, number>();
  for (const row of claims.data ?? []) claimsBy.set(row.prospect_id, (claimsBy.get(row.prospect_id) ?? 0) + 1);

  const byStatus: Record<string, number> = {};
  for (const row of statuses.data ?? []) byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;

  const items: ProspectListItem[] = (data ?? []).map((row) => ({
    ...row,
    hasPreview: previewBy.has(row.id),
    previewViews: previewBy.get(row.id) ?? 0,
    pendingClaims: claimsBy.get(row.id) ?? 0,
  }));
  return { items, total: count ?? 0, page, byStatus: byStatus as Partial<Record<ProspectStatus, number>>, all: statuses.data?.length ?? 0 };
}

/** Um prospect com prévia, linha do tempo e pedidos. Chame depois de requireAdmin(). */
export async function loadProspect(id: string) {
  const db = createAdminClient();
  const [prospect, preview, events, claims] = await Promise.all([
    db.from("prospects").select("*").eq("id", id).maybeSingle(),
    db.from("prospect_previews").select("*").eq("prospect_id", id).maybeSingle(),
    db.from("prospect_events").select("*").eq("prospect_id", id).order("created_at", { ascending: false }).limit(40),
    db.from("prospect_claims").select("*").eq("prospect_id", id).order("created_at", { ascending: false }),
  ]);
  if (!prospect.data) return null;
  return {
    prospect: prospect.data,
    preview: preview.data,
    events: events.data ?? [],
    claims: claims.data ?? [],
  };
}
