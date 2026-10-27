import { connection } from "next/server";
import { BILLING_UNIT, SPACE_TYPES, formatPrice, photoUrl, type BillingType, type SpaceType } from "@/lib/listing-options";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Listing, ListingStatus } from "@/app/superadmin/_data/mock";

export type AdminListing = Listing & {
  slug: string;
  ownerId: string;
  description: string | null;
  summary: string | null;
  photoUrls: string[];
  reviewNote: string | null;
};

const STATUS: Record<string, ListingStatus> = {
  pending_approval: "em_revisao",
  active: "no_ar",
  paused: "pausado",
  draft: "rascunho",
};

function ago(iso: string | null) {
  if (!iso) return "—";
  const hours = Math.round((Date.now() - Date.parse(iso)) / 36e5);
  if (hours < 1) return "agora";
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 60) return `há ${days} ${days === 1 ? "dia" : "dias"}`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function until(iso: string | null) {
  if (!iso) return "—";
  const days = Math.ceil((Date.parse(iso) - Date.now()) / 864e5);
  if (days < 0) return "expirado";
  return `em ${days} ${days === 1 ? "dia" : "dias"}`;
}

/** Todos os anúncios do banco, do mais novo para o mais antigo. Chame só depois de requireAdmin(). */
export async function loadAdminListings(onlyId?: string): Promise<AdminListing[]> {
  // Os textos "há 3 h" e "em 28 dias" leem o relógio; sem isto o Next tenta pré-renderizar.
  await connection();
  const db = createAdminClient();

  let query = db
    .from("listings")
    .select(
      "id, slug, title, description, short_summary, space_type, billing_type, price, city, state, neighborhood, status, owner_id, photos, review_note, created_at, submitted_at, expires_at",
    )
    .order("created_at", { ascending: false });
  if (onlyId) query = query.eq("id", onlyId);
  const { data: rows, error } = await query;
  if (error) throw new Error(`Não foi possível ler os anúncios: ${error.message}`);
  if (!rows || rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const ownerIds = [...new Set(rows.map((row) => row.owner_id))];

  const [imports, events, profiles, users] = await Promise.all([
    db.from("listing_imports").select("listing_id").in("listing_id", ids),
    db.from("listing_events").select("listing_id, kind").in("listing_id", ids).limit(10000),
    db.from("profiles").select("id, display_name").in("id", ownerIds),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const imported = new Set((imports.data ?? []).map((row) => row.listing_id));
  const names = new Map((profiles.data ?? []).map((row) => [row.id, row.display_name]));
  const emails = new Map(users.data.users.map((user) => [user.id, user.email ?? ""]));
  const metaNames = new Map(users.data.users.map((user) => [user.id, String(user.user_metadata?.full_name ?? "")]));
  const views = new Map<string, number>();
  const contacts = new Map<string, number>();
  for (const event of events.data ?? []) {
    const target = event.kind === "view" ? views : contacts;
    target.set(event.listing_id, (target.get(event.listing_id) ?? 0) + 1);
  }

  return rows.map((row) => {
    const isImported = imported.has(row.id);
    const email = emails.get(row.owner_id) ?? "";
    const owner = names.get(row.owner_id) || metaNames.get(row.owner_id) || email || "Sem dono";
    const status: ListingStatus = isImported && row.status === "draft" ? "convite_pendente" : (STATUS[row.status] ?? "rascunho");
    const unit = BILLING_UNIT[row.billing_type as BillingType] ?? row.billing_type;
    return {
      id: row.id,
      slug: row.slug,
      ownerId: row.owner_id,
      title: row.title,
      owner,
      ownerEmail: email,
      city: row.city,
      neighborhood: row.neighborhood,
      type: SPACE_TYPES[row.space_type as SpaceType] ?? row.space_type,
      price: `${formatPrice(row.price)} / ${unit}`,
      status,
      origin: isImported ? "importado" : "anunciante",
      createdBy: isImported ? "Importação WordPress" : owner,
      submitted: ago(row.submitted_at ?? row.created_at),
      expires: row.status === "active" ? until(row.expires_at) : "—",
      views: views.get(row.id) ?? 0,
      contacts: contacts.get(row.id) ?? 0,
      description: row.description,
      summary: row.short_summary,
      photoUrls: row.photos.map(photoUrl),
      reviewNote: row.review_note,
    } satisfies AdminListing;
  });
}
