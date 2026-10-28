import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { approveListing } from "@/app/actions/listing";
import { AdminReturnForm } from "@/components/admin-return-form";
import { HostShell, Skeleton, StatusChip } from "@/components/host-shell";
import { ListingView } from "@/components/listing-view";
import { buttonClasses } from "@/components/ui";
import { formatWhatsApp } from "@/lib/listing-options";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Revisar anúncio",
  robots: { index: false, follow: false },
};

export default function AdminListingPage({ params, searchParams }: PageProps<"/admin/anuncios/[id]">) {
  return (
    <HostShell admin>
      <Link href="/admin/anuncios" className={`${buttonClasses("ghost")} -ml-4 mb-4`}>
        <ArrowLeftIcon className="size-4" aria-hidden />
        Para aprovar
      </Link>
      <Suspense fallback={<Skeleton />}>
        <AdminReview params={params} searchParams={searchParams} />
      </Suspense>
    </HostShell>
  );
}

async function AdminReview({
  params,
  searchParams,
}: {
  params: PageProps<"/admin/anuncios/[id]">["params"];
  searchParams: PageProps<"/admin/anuncios/[id]">["searchParams"];
}) {
  await connection();
  const [{ id }, query, supabase] = await Promise.all([params, searchParams, createClient()]);
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/");

  const [{ data: listing }, { data: owner }, { data: contact }, { data: host }] = await Promise.all([
    supabase
      .from("listings")
      .select(
        "id, status, title, short_summary, description, space_type, billing_type, price, zip_code, city, state, neighborhood, min_rental_period, rules, amenities, photos, photo_sizes, highlights, offers, latitude, longitude, show_exact_location",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.rpc("listing_owner", { p_listing_id: id }).maybeSingle(),
    supabase.from("listing_contacts").select("whatsapp_number, street_address").eq("listing_id", id).maybeSingle(),
    supabase.rpc("listing_host", { p_listing_id: id }).maybeSingle(),
  ]);
  if (!listing) notFound();

  const pending = listing.status === "pending_approval";

  return (
    <div className="space-y-8">
      <section className="rounded-panel bg-white p-5 shadow-card ring-1 ring-ink-900/6 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-h3 font-bold text-ink-900">Revisão do anúncio</h1>
          <StatusChip status={listing.status} />
        </div>
        <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <Info label="Anunciante" value={owner?.display_name ?? "Sem perfil"} />
          <Info label="E-mail" value={owner?.email ?? "-"} />
          <Info label="WhatsApp do anúncio" value={contact?.whatsapp_number ? formatWhatsApp(contact.whatsapp_number) : "Sem WhatsApp"} />
          <Info label="Endereço (privado)" value={contact?.street_address ?? "Não informado"} />
          <Info label="CEP" value={listing.zip_code ?? "Não informado"} />
          <Info label="Fotos" value={String(listing.photos.length)} />
        </dl>

        {query.erro && (
          <p role="alert" className="mt-4 text-sm text-danger-600">
            Não foi possível aprovar. Confira se o anúncio ainda está em revisão e tente de novo.
          </p>
        )}

        {pending ? (
          <div className="mt-6 grid gap-4 border-t border-ink-200 pt-6 sm:grid-cols-[auto_1fr] sm:items-start">
            <form action={approveListing.bind(null, listing.id)}>
              <button type="submit" className={`${buttonClasses("primary", "lg")} w-full`}>
                Aprovar e publicar
              </button>
            </form>
            <AdminReturnForm listingId={listing.id} />
          </div>
        ) : (
          <p className="mt-6 border-t border-ink-200 pt-6 text-sm text-ink-600">Este anúncio não está esperando aprovação.</p>
        )}
      </section>

      <div>
        <p className="mb-4 text-sm font-bold text-ink-500">Como o anúncio vai aparecer</p>
        <ListingView listing={listing} host={host} />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-500">{label}</dt>
      <dd className="mt-0.5 font-bold [overflow-wrap:anywhere] text-ink-900">{value}</dd>
    </div>
  );
}
