import type { Json } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { PHOTO_BUCKET } from "@/lib/listing-options";
import { diffListing, type ListingDiff, type ListingSnapshot } from "@/lib/listing-diff";

/**
 * Histórico de edições de anúncio já aprovado (tabela listing_revisions, só a service role acessa).
 *
 * 1. Antes de gravar a edição de um anúncio publicado ou pausado, openRevision guarda a versão no ar.
 * 2. Enquanto a edição espera revisão, as fotos da versão no ar não saem do Storage (protectedPhotos).
 * 3. Na aprovação, closeRevision guarda a versão nova e apaga as fotos que a edição tirou.
 * Devolver e reenviar mantém a mesma edição aberta: o admin compara sempre com a última versão aprovada.
 */

const LISTING_COLUMNS =
  "title, short_summary, description, space_type, space_type_other, billing_type, price, min_rental_period, neighborhood, city, state, zip_code, show_exact_location, amenities, highlights, offers, rules, photos";

async function snapshot(listingId: string): Promise<ListingSnapshot | null> {
  const db = createAdminClient();
  const [{ data: listing }, { data: contact }] = await Promise.all([
    db.from("listings").select(LISTING_COLUMNS).eq("id", listingId).maybeSingle(),
    db.from("listing_contacts").select("whatsapp_number, contact_email, street_address").eq("listing_id", listingId).maybeSingle(),
  ]);
  if (!listing) return null;
  return {
    ...listing,
    price: Number(listing.price),
    whatsapp_number: contact?.whatsapp_number ?? null,
    contact_email: contact?.contact_email ?? null,
    street_address: contact?.street_address ?? null,
  };
}

/** Guarda a versão no ar antes da edição. Se já há uma edição esperando revisão, mantém a dela. */
export async function openRevision(listingId: string) {
  const db = createAdminClient();
  const { data: pending } = await db.from("listing_revisions").select("id").eq("listing_id", listingId).is("approved_at", null).maybeSingle();
  if (pending) return;
  const before = await snapshot(listingId);
  if (!before) return;
  const { error } = await db.from("listing_revisions").insert({ listing_id: listingId, before: before as unknown as Json });
  // Corrida com outro envio: o índice único deixa só uma edição aberta, e é ela que vale.
  if (error && error.code !== "23505") console.error("[openRevision]", error);
}

/** Fotos da versão no ar que a edição em revisão tirou: só saem do Storage na aprovação. */
export async function protectedPhotos(listingId: string): Promise<string[]> {
  const { data } = await createAdminClient().from("listing_revisions").select("before").eq("listing_id", listingId).is("approved_at", null).maybeSingle();
  return (data?.before as unknown as ListingSnapshot | undefined)?.photos ?? [];
}

/** Na aprovação: guarda a versão nova, fecha a edição e apaga as fotos que ela tirou. */
export async function closeRevision(listingId: string) {
  const db = createAdminClient();
  const { data: pending } = await db.from("listing_revisions").select("id, before").eq("listing_id", listingId).is("approved_at", null).maybeSingle();
  if (!pending) return;
  const after = await snapshot(listingId);
  if (!after) return;
  const { error } = await db
    .from("listing_revisions")
    .update({ after: after as unknown as Json, approved_at: new Date().toISOString() })
    .eq("id", pending.id);
  if (error) {
    console.error("[closeRevision]", error);
    return;
  }
  const removed = ((pending.before as unknown as ListingSnapshot).photos ?? []).filter((path) => !after.photos.includes(path));
  if (removed.length > 0) {
    const { error: storageError } = await db.storage.from(PHOTO_BUCKET).remove(removed);
    if (storageError) console.error("[closeRevision] fotos não removidas:", storageError.message);
  }
}

export type RevisionView = {
  id: number;
  submittedAt: string;
  approvedAt: string | null;
  before: ListingSnapshot;
  diff: ListingDiff;
};

/**
 * Edições do anúncio, da mais nova para a mais antiga, para o Super Admin. A edição aberta compara a versão no ar
 * com o anúncio como está agora; as aprovadas, o antes e o depois guardados. Chame só depois de requireAdmin().
 */
export async function loadRevisions(listingId: string): Promise<{ pending: RevisionView | null; history: RevisionView[] }> {
  const { data } = await createAdminClient()
    .from("listing_revisions")
    .select("id, before, after, submitted_at, approved_at")
    .eq("listing_id", listingId)
    .order("submitted_at", { ascending: false })
    .limit(20);
  const rows = data ?? [];
  const open = rows.find((row) => row.approved_at === null);
  const current = open ? await snapshot(listingId) : null;

  const view = (row: (typeof rows)[number], after: ListingSnapshot): RevisionView => {
    const before = row.before as unknown as ListingSnapshot;
    return { id: row.id, submittedAt: row.submitted_at, approvedAt: row.approved_at, before, diff: diffListing(before, after) };
  };
  return {
    pending: open && current ? view(open, current) : null,
    history: rows.filter((row) => row.approved_at !== null && row.after).map((row) => view(row, row.after as unknown as ListingSnapshot)),
  };
}

/** Anúncios da lista que estão em revisão por causa de uma edição (e não por serem novos). */
export async function editedListingIds(listingIds: string[]): Promise<Set<string>> {
  if (listingIds.length === 0) return new Set();
  const { data } = await createAdminClient().from("listing_revisions").select("listing_id").in("listing_id", listingIds).is("approved_at", null);
  return new Set((data ?? []).map((row) => row.listing_id));
}
