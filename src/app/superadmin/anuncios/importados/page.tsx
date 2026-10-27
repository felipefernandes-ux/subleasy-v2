import { Suspense } from "react";
import type { Metadata } from "next";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/ssr";
import { ListingsTable } from "@/components/superadmin/listings-table";
import { Button, Card, PageHeader } from "@/components/superadmin/ui";
import { requireAdmin } from "@/lib/superadmin/auth";
import { loadAdminListings } from "@/lib/superadmin/listings";

export const metadata: Metadata = { title: "Importados sem dono" };

export default function ImportedListingsPage() {
  return (
    <>
      <PageHeader
        title="Importados sem dono"
        description="Anúncios criados pela importação que ainda esperam o anunciante aceitar o convite. Se o convite não for aceito em 30 dias, o anúncio pausa sozinho e cai aqui."
        actions={
          <Button variant="primary" disabled>
            <EnvelopeSimpleIcon className="size-4" weight="bold" aria-hidden />
            Reenviar convites vencendo
          </Button>
        }
      />
      <Suspense fallback={<p className="py-10 text-center text-sa-muted">Carregando…</p>}>
        <Imported />
      </Suspense>
    </>
  );
}

async function Imported() {
  await requireAdmin("/superadmin/anuncios/importados");
  const listings = (await loadAdminListings()).filter((listing) => listing.status === "convite_pendente");
  return (
    <>
      <Card className="mb-4 px-5 py-4">
        <p className="sa-display text-sa-title">{listings.length}</p>
        <p className="text-sa-sm text-sa-muted">importados esperando o dono aceitar o convite</p>
      </Card>
      <ListingsTable listings={listings} variant="imported" selectable />
    </>
  );
}
