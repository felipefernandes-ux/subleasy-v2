import { Suspense } from "react";
import type { Metadata } from "next";
import { PlusIcon } from "@phosphor-icons/react/ssr";
import { ListingsSkeleton } from "@/components/superadmin/listings-skeleton";
import { ListingsView } from "@/components/superadmin/listings-view";
import { ButtonLink, PageHeader } from "@/components/superadmin/ui";
import { requireAdmin } from "@/lib/superadmin/auth";
import { loadAdminListings } from "@/lib/superadmin/listings";

export const metadata: Metadata = { title: "Todos os anúncios" };

export default function ListingsPage() {
  return (
    <>
      <PageHeader
        title="Anúncios"
        description="Todos os anúncios da plataforma, direto do banco. Marque os que quiser e exclua em lote."
        actions={
          <ButtonLink href="/anuncios/novo" variant="primary">
            <PlusIcon className="size-4" weight="bold" aria-hidden />
            Novo anúncio
          </ButtonLink>
        }
      />
      <Suspense fallback={<ListingsSkeleton />}>
        <ListingsData />
      </Suspense>
    </>
  );
}

async function ListingsData() {
  await requireAdmin("/anuncios");
  const listings = await loadAdminListings();
  return <ListingsView listings={listings} />;
}
