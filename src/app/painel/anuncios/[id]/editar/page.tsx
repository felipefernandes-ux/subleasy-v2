import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { HostShell, PageIntro, Skeleton } from "@/components/host-shell";
import { ListingEditor } from "@/components/listing-editor";
import { parsePhotoSizes } from "@/lib/listing-options";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Editar anúncio",
  robots: { index: false, follow: false },
};

export default function EditListingPage({ params }: PageProps<"/painel/anuncios/[id]/editar">) {
  return (
    <HostShell>
      <Suspense fallback={<Skeleton />}>
        <EditListing params={params} />
      </Suspense>
    </HostShell>
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
        "id, status, title, short_summary, description, space_type, billing_type, price, zip_code, city, state, neighborhood, min_rental_period, rules, amenities, photos, photo_sizes, review_note",
      )
      .eq("id", id)
      .eq("owner_id", user.id)
      .maybeSingle(),
    supabase.from("listing_contacts").select("whatsapp_number, contact_email, street_address").eq("listing_id", id).maybeSingle(),
  ]);
  if (!listing) notFound();
  if (listing.status !== "active" && listing.status !== "paused") redirect(`/painel/anuncios/${id}`);

  return (
    <>
      <PageIntro eyebrow="Editar anúncio" title={listing.title}>
        Ajuste o que mudou e envie. A equipe do Subleasy confere as alterações antes de elas aparecerem.
      </PageIntro>
      <ListingEditor
        userId={user.id}
        published
        listing={{
          ...listing,
          photo_sizes: parsePhotoSizes(listing.photo_sizes),
          whatsapp: contact?.whatsapp_number ?? "",
          contact_email: contact?.contact_email ?? user.email ?? "",
          street_address: contact?.street_address ?? null,
        }}
      />
    </>
  );
}
