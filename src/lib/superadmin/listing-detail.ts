import { connection } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Tudo o que o banco guarda de um anúncio, para o Super Admin ver e editar. Chame só depois de requireAdmin(). */
export async function loadListingFull(id: string) {
  await connection();
  const db = createAdminClient();

  const { data: listing } = await db.from("listings").select("*").eq("id", id).maybeSingle();
  if (!listing) return null;

  const [contact, imported, events, inquiries] = await Promise.all([
    db.from("listing_contacts").select("whatsapp_number, contact_email, street_address").eq("listing_id", id).maybeSingle(),
    db.from("listing_imports").select("source_id, source_url, source_slug, source_status, wp_status, extras, imported_at").eq("listing_id", id).maybeSingle(),
    db.from("listing_events").select("kind").eq("listing_id", id).limit(10000),
    db
      .from("listing_inquiries")
      .select("id, name, email, phone, message, created_at")
      .eq("listing_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const counts = { view: 0, whatsapp_click: 0, email_click: 0 };
  for (const event of events.data ?? []) counts[event.kind as keyof typeof counts] += 1;

  return {
    // O vetor de busca não serve a quem edita e pesa na página.
    listing: { ...listing, embedding: undefined },
    contact: contact.data,
    imported: imported.data,
    counts,
    inquiries: inquiries.data ?? [],
  };
}

export type ListingFull = NonNullable<Awaited<ReturnType<typeof loadListingFull>>>;
