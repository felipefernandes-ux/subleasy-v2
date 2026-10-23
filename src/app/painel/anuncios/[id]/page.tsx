import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { HostShell, PageIntro, Skeleton } from "@/components/host-shell";
import { ListingEditor } from "@/components/listing-editor";
import { PausedPanel, PublishedPanel, SubmittedPanel } from "@/components/listing-status-panels";
import { parseShifts } from "@/lib/listing-options";
import { getOrigin } from "@/lib/origin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Revisar anúncio",
  robots: { index: false, follow: false },
};

export default function ListingReviewPage({ params }: PageProps<"/painel/anuncios/[id]">) {
  return (
    <HostShell>
      <Suspense fallback={<Skeleton />}>
        <ListingReview params={params} />
      </Suspense>
    </HostShell>
  );
}

async function ListingReview({ params }: { params: PageProps<"/painel/anuncios/[id]">["params"] }) {
  // A sessão e o cliente do Supabase só existem na requisição.
  await connection();
  const [{ id }, supabase] = await Promise.all([params, createClient()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=/painel/anuncios/${id}`);

  const [{ data: listing }, { data: contact }, { data: profile }] = await Promise.all([
    supabase
      .from("listings")
      .select(
        "id, slug, status, title, short_summary, description, space_type, billing_type, price, zip_code, city, state, neighborhood, min_rental_period, rules, amenities, shifts_available, photos, review_note",
      )
      .eq("id", id)
      .eq("owner_id", user.id)
      .maybeSingle(),
    supabase.from("listing_contacts").select("whatsapp_number, street_address").eq("listing_id", id).maybeSingle(),
    supabase.from("profiles").select("whatsapp_number").eq("id", user.id).maybeSingle(),
  ]);
  if (!listing) notFound();

  const publicUrl = `${await getOrigin()}/sala/${listing.slug}`;

  if (listing.status === "pending_approval") {
    return <SubmittedPanel title={listing.title} email={user.email ?? ""} />;
  }
  if (listing.status === "active") return <PublishedPanel title={listing.title} url={publicUrl} />;
  if (listing.status === "paused") return <PausedPanel title={listing.title} url={publicUrl} />;

  return (
    <>
      <PageIntro eyebrow="Revisão do anúncio" title="Confira o que a IA preencheu">
        Revise os 5 passos, adicione as fotos e envie. O que tem o selo Sugestão veio da IA. Nada vai
        ao ar antes de a equipe do Subleasy aprovar.
      </PageIntro>
      <ListingEditor
        userId={user.id}
        listing={{
          ...listing,
          shifts: parseShifts(listing.shifts_available),
          whatsapp: contact?.whatsapp_number ?? profile?.whatsapp_number ?? "",
          street_address: contact?.street_address ?? null,
        }}
      />
    </>
  );
}
