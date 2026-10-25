import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { HostShell, PageIntro, Skeleton } from "@/components/host-shell";
import { ListingEditor } from "@/components/listing-editor";
import { ListingDashboard, type DashboardListing, type DashboardMetrics, type Inquiry } from "@/components/host-listing-dashboard";
import { SubmittedPanel } from "@/components/listing-status-panels";
import { parsePhotoSizes } from "@/lib/listing-options";
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
        "id, slug, status, title, short_summary, description, space_type, billing_type, price, zip_code, city, state, neighborhood, min_rental_period, rules, amenities, photos, photo_sizes, review_note, published_at, expires_at, email_contact",
      )
      .eq("id", id)
      .eq("owner_id", user.id)
      .maybeSingle(),
    supabase.from("listing_contacts").select("whatsapp_number, contact_email, street_address").eq("listing_id", id).maybeSingle(),
    supabase.from("profiles").select("whatsapp_number").eq("id", user.id).maybeSingle(),
  ]);
  if (!listing) notFound();

  const publicUrl = `${await getOrigin()}/sala/${listing.slug}`;

  if (listing.status === "pending_approval") {
    return <SubmittedPanel title={listing.title} email={user.email ?? ""} />;
  }
  if (listing.status === "active" || listing.status === "paused") {
    return <ListingDashboard {...await loadDashboard(supabase, { ...listing, url: publicUrl })} />;
  }

  return (
    <>
      <PageIntro eyebrow="Revisão do anúncio" title="Confira o que a IA preencheu">
        Revise os 5 passos, adicione as fotos e envie. Os campos com o ícone de brilho vieram da IA. Nada
        vai ao ar antes de a equipe do Subleasy aprovar.
      </PageIntro>
      <ListingEditor
        userId={user.id}
        listing={{
          ...listing,
          photo_sizes: parsePhotoSizes(listing.photo_sizes),
          whatsapp: contact?.whatsapp_number ?? profile?.whatsapp_number ?? "",
          contact_email: contact?.contact_email ?? user.email ?? "",
          street_address: contact?.street_address ?? null,
        }}
      />
    </>
  );
}

const DAY = 24 * 60 * 60 * 1000;
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

// Métricas desde a publicação e as mensagens do formulário, mais recentes primeiro.
async function loadDashboard(
  supabase: Awaited<ReturnType<typeof createClient>>,
  listing: Omit<DashboardListing, "publishedOn" | "expiresOn" | "daysLeft"> & { published_at: string | null; expires_at: string | null },
): Promise<{ listing: DashboardListing; metrics: DashboardMetrics; inquiries: Inquiry[] }> {
  const now = Date.now();
  const [{ data: events }, { data: inquiries }] = await Promise.all([
    supabase.from("listing_events").select("kind, day").eq("listing_id", listing.id),
    supabase.from("listing_inquiries").select("id, name, email, phone, message, created_at").eq("listing_id", listing.id).order("created_at", { ascending: false }),
  ]);
  const weekAgo = new Date(now - 7 * DAY).toISOString().slice(0, 10);
  const list = events ?? [];

  return {
    listing: {
      ...listing,
      publishedOn: listing.published_at ? formatDate(listing.published_at) : null,
      expiresOn: listing.expires_at ? formatDate(listing.expires_at) : null,
      daysLeft: listing.expires_at ? Math.ceil((new Date(listing.expires_at).getTime() - now) / DAY) : null,
    },
    metrics: {
      views: list.filter((event) => event.kind === "view").length,
      views7: list.filter((event) => event.kind === "view" && event.day >= weekAgo).length,
      whatsapp: list.filter((event) => event.kind === "whatsapp_click").length,
      messages: (inquiries ?? []).length,
    },
    inquiries: (inquiries ?? []).map((inquiry) => ({
      id: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      message: inquiry.message,
      sentOn: new Date(inquiry.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }),
    })),
  };
}
