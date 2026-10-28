import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { HostShell, Skeleton } from "@/components/host-shell";
import { ListingEditWizard } from "@/components/listing-wizard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Editar anúncio",
  robots: { index: false, follow: false },
};

export default function EditListingPage({ params }: PageProps<"/painel/anuncios/[id]/editar">) {
  return (
    <Suspense fallback={<HostShell><Skeleton /></HostShell>}>
      <EditListing params={params} />
    </Suspense>
  );
}

/** Edição de um anúncio publicado ou pausado. Rascunho e anúncio em revisão têm a própria tela. */
async function EditListing({ params }: { params: PageProps<"/painel/anuncios/[id]/editar">["params"] }) {
  await connection();
  const [{ id }, supabase] = await Promise.all([params, createClient()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=/painel/anuncios/${id}/editar`);

  const [{ data: listing }, { data: contact }] = await Promise.all([
    supabase
      .from("listings")
      .select(
        "id, status, title, short_summary, description, space_type, space_type_other, billing_type, price, zip_code, city, state, neighborhood, latitude, longitude, show_exact_location, min_rental_period, rules, amenities, highlights, offers, photos, photo_sizes, review_note",
      )
      .eq("id", id)
      .eq("owner_id", user.id)
      .maybeSingle(),
    supabase.from("listing_contacts").select("whatsapp_number, contact_email, street_address").eq("listing_id", id).maybeSingle(),
  ]);
  if (!listing) notFound();
  if (listing.status !== "active" && listing.status !== "paused") redirect(`/painel/anuncios/${id}`);

  return (
    <ListingEditWizard
      userId={user.id}
      listing={{
        ...listing,
        whatsapp: contact?.whatsapp_number ?? "",
        contact_email: contact?.contact_email ?? user.email ?? "",
        street_address: contact?.street_address ?? null,
      }}
    />
  );
}
