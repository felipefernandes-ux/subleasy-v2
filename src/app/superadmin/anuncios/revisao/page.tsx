import { Suspense } from "react";
import type { Metadata } from "next";
import { ListingsTable } from "@/components/superadmin/listings-table";
import { PageHeader } from "@/components/superadmin/ui";
import { requireAdmin } from "@/lib/superadmin/auth";
import { loadAdminListings } from "@/lib/superadmin/listings";
import { editedListingIds } from "@/lib/listing-revisions";
import { TableSkeleton } from "@/components/superadmin/skeletons";

export const metadata: Metadata = { title: "Anúncios em revisão" };

export default function ReviewQueuePage() {
  return (
    <>
      <PageHeader
        title="Em revisão"
        description="Confira fotos, preço e descrição. Anúncios com o selo Edição já estavam no ar: a página deles mostra o que mudou. Aprovar coloca a sala no ar e avisa o anunciante por e-mail. Meta: resposta em até 1 dia útil."
      />
      <Suspense fallback={<TableSkeleton label="Carregando fila de revisão" />}>
        <Queue />
      </Suspense>
    </>
  );
}

async function Queue() {
  await requireAdmin("/anuncios/revisao");
  const listings = (await loadAdminListings()).filter((listing) => listing.status === "em_revisao");
  const edited = await editedListingIds(listings.map((listing) => listing.id));
  return <ListingsTable listings={listings} variant="review" selectable editedIds={[...edited]} />;
}
