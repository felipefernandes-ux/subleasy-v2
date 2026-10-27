import type { Metadata } from "next";
import { PlusIcon } from "@phosphor-icons/react/ssr";
import { ListingsTable } from "@/components/superadmin/listings-table";
import { ButtonLink, PageHeader, SearchInput, Segmented, Select } from "@/components/superadmin/ui";
import { LISTINGS } from "../_data/mock";

export const metadata: Metadata = { title: "Todos os anúncios" };

export default function ListingsPage() {
  const count = (status: string) => LISTINGS.filter((listing) => listing.status === status).length;
  return (
    <>
      <PageHeader
        title="Anúncios"
        description="Todos os anúncios da plataforma, com filtros por status, cidade, anunciante e origem."
        actions={
          <ButtonLink href="/superadmin/anuncios/novo" variant="primary">
            <PlusIcon className="size-4" weight="bold" aria-hidden />
            Novo anúncio
          </ButtonLink>
        }
      />
      <Segmented
        active="Todos"
        items={[
          { label: "Todos", count: LISTINGS.length },
          { label: "No ar", count: count("no_ar") },
          { label: "Em revisão", count: count("em_revisao") },
          { label: "Pausados", count: count("pausado") },
          { label: "Convite pendente", count: count("convite_pendente") },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2 py-4">
        <SearchInput placeholder="Buscar por título, anunciante ou e-mail" className="w-full sm:w-80" />
        <Select label="Cidade" options={["Maringá", "Londrina", "Curitiba", "Cascavel"]} />
        <Select label="Tipo de sala" options={["Psicologia", "Odontologia", "Medicina", "Fisioterapia", "Nutrição"]} />
        <Select label="Origem" options={["Anunciante", "Criado pelo admin", "Importado"]} />
      </div>
      <ListingsTable listings={LISTINGS} total={142} />
    </>
  );
}
