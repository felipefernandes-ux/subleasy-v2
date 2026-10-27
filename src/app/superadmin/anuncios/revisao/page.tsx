import type { Metadata } from "next";
import { ListingsTable } from "@/components/superadmin/listings-table";
import { PageHeader } from "@/components/superadmin/ui";
import { LISTINGS } from "../../_data/mock";

export const metadata: Metadata = { title: "Anúncios em revisão" };

export default function ReviewQueuePage() {
  const queue = LISTINGS.filter((listing) => listing.status === "em_revisao");
  return (
    <>
      <PageHeader
        title="Em revisão"
        description="Confira fotos, preço e descrição. Aprovar coloca a sala no ar e avisa o anunciante por e-mail. Meta: resposta em até 1 dia útil."
      />
      <ListingsTable listings={queue} variant="review" />
    </>
  );
}
