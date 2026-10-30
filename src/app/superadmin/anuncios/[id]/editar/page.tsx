import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink, PageHeader } from "@/components/superadmin/ui";
import { ListingEditForm } from "@/components/superadmin/listing-edit-form";
import { requireAdmin } from "@/lib/superadmin/auth";
import { loadListingFull } from "@/lib/superadmin/listing-detail";

export const metadata: Metadata = { title: "Editar anúncio" };

export default function EditListingPage({ params }: PageProps<"/superadmin/anuncios/[id]/editar">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-sa-muted">Carregando anúncio…</p>}>
      <EditListing params={params} />
    </Suspense>
  );
}

async function EditListing({ params }: { params: PageProps<"/superadmin/anuncios/[id]/editar">["params"] }) {
  const { id } = await params;
  await requireAdmin(`/anuncios/${id}/editar`);
  const full = await loadListingFull(id);
  if (!full) notFound();
  const { listing, contact } = full;

  return (
    <>
      <PageHeader
        title="Editar anúncio"
        description={listing.title}
        actions={
          <ButtonLink href={`/anuncios/${id}`} variant="ghost" className="max-lg:hidden">
            Voltar ao anúncio
          </ButtonLink>
        }
      />
      <ListingEditForm
        listing={{
          id: listing.id,
          title: listing.title,
          short_summary: listing.short_summary,
          description: listing.description,
          space_type: listing.space_type,
          space_type_other: listing.space_type_other,
          billing_type: listing.billing_type,
          price: Number(listing.price),
          zip_code: listing.zip_code,
          neighborhood: listing.neighborhood,
          city: listing.city,
          state: listing.state,
          min_rental_period: listing.min_rental_period,
          rules: listing.rules,
          amenities: listing.amenities,
          highlights: listing.highlights,
          offers: listing.offers,
          show_exact_location: listing.show_exact_location,
          email_contact: listing.email_contact,
          status: listing.status,
          expires_on: listing.expires_at
            ? new Date(listing.expires_at).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" })
            : "",
          review_note: listing.review_note,
          whatsapp: contact?.whatsapp_number ?? "",
          contact_email: contact?.contact_email ?? "",
          street_address: contact?.street_address ?? "",
        }}
      />
    </>
  );
}
