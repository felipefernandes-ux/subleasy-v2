import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { HostShell, Skeleton } from "@/components/host-shell";
import { ListingEditWizard } from "@/components/listing-wizard";
import { ListingDashboard, type DashboardListing, type DashboardMetrics, type Inquiry } from "@/components/host-listing-dashboard";
import { formatLeadDate } from "@/components/host-leads";
import { SubmittedPanel } from "@/components/listing-status-panels";
import { getOrigin } from "@/lib/origin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Revisar anúncio",
  robots: { index: false, follow: false },
};

export default function ListingReviewPage({ params }: PageProps<"/painel/anuncios/[id]">) {
  return (
    <Suspense fallback={<HostShell><Skeleton /></HostShell>}>
      <ListingReview params={params} />
    </Suspense>
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
        "id, slug, status, title, short_summary, description, space_type, space_type_other, billing_type, price, zip_code, city, state, neighborhood, latitude, longitude, show_exact_location, min_rental_period, rules, amenities, highlights, offers, photos, photo_sizes, review_note, published_at, expires_at, email_contact, whatsapp_contact",
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
    return (
      <HostShell>
        <SubmittedPanel title={listing.title} email={user.email ?? ""} />
      </HostShell>
    );
  }
  if (listing.status === "active" || listing.status === "paused") {
    return (
      <HostShell>
        <ListingDashboard {...await loadDashboard(supabase, { ...listing, url: publicUrl })} />
      </HostShell>
    );
  }

  // Devolvido para ajustes: o mesmo passo a passo do cadastro, com o recado da equipe.
  return (
    <ListingEditWizard
      userId={user.id}
      listing={{
        ...listing,
        whatsapp: contact?.whatsapp_number ?? profile?.whatsapp_number ?? "",
        contact_email: contact?.contact_email ?? user.email ?? "",
        street_address: contact?.street_address ?? null,
      }}
    />
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
    supabase.from("listing_inquiries").select("id, name, message, created_at").eq("listing_id", listing.id).order("created_at", { ascending: false }),
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
    inquiries: (inquiries ?? []).map((inquiry) => ({ id: inquiry.id, name: inquiry.name, message: inquiry.message, sentOn: formatLeadDate(inquiry.created_at) })),
  };
}
