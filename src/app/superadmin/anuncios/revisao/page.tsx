import { Suspense } from "react";
import type { Metadata } from "next";
import { ListingsTable } from "@/components/superadmin/listings-table";
import { PageHeader } from "@/components/superadmin/ui";
import { requireAdmin } from "@/lib/superadmin/auth";
import { loadAdminListings } from "@/lib/superadmin/listings";

export const metadata: Metadata = { title: "Anúncios em revisão" };

export default function ReviewQueuePage() {
  return (
    <>
      <PageHeader
        title="Em revisão"
        description="Confira fotos, preço e descrição. Aprovar coloca a sala no ar e avisa o anunciante por e-mail. Meta: resposta em até 1 dia útil."
      />
      <Suspense fallback={<p className="py-10 text-center text-sa-muted">Carregando…</p>}>
        <Queue />
      </Suspense>
    </>
  );
}

async function Queue() {
  await requireAdmin("/superadmin/anuncios/revisao");
  const listings = (await loadAdminListings()).filter((listing) => listing.status === "em_revisao");
  return <ListingsTable listings={listings} variant="review" selectable />;
}
