import type { Metadata } from "next";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/ssr";
import { ListingsTable } from "@/components/superadmin/listings-table";
import { Button, Card, PageHeader } from "@/components/superadmin/ui";
import { LISTINGS } from "../../_data/mock";

export const metadata: Metadata = { title: "Importados sem dono" };

export default function ImportedListingsPage() {
  const imported = LISTINGS.filter((listing) => listing.status === "convite_pendente");
  return (
    <>
      <PageHeader
        title="Importados sem dono"
        description="Anúncios criados pela importação que ainda esperam o anunciante aceitar o convite. Se o convite não for aceito em 30 dias, o anúncio pausa sozinho e cai aqui."
        actions={
          <Button variant="primary">
            <EnvelopeSimpleIcon className="size-4" weight="bold" aria-hidden />
            Reenviar convites vencendo
          </Button>
        }
      />
      <Card className="mb-4 grid divide-sa-haze sm:grid-cols-3 sm:divide-x">
        {[
          ["3", "esperando aceite"],
          ["1", "convite vence em 3 dias"],
          ["0", "pausados por vencimento"],
        ].map(([value, label]) => (
          <div key={label} className="px-5 py-4">
            <p className="sa-display text-sa-title font-semibold">{value}</p>
            <p className="text-sa-sm text-sa-muted">{label}</p>
          </div>
        ))}
      </Card>
      <ListingsTable listings={imported} variant="imported" />
    </>
  );
}
