import { Suspense } from "react";
import type { Metadata } from "next";
import { PlusIcon } from "@phosphor-icons/react/ssr";
import { ListingsTable } from "@/components/superadmin/listings-table";
import { ButtonLink, PageHeader, SearchInput, Segmented, Select } from "@/components/superadmin/ui";
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
      <Suspense fallback={<p className="py-10 text-center text-sa-muted">Carregando anúncios…</p>}>
        <ListingsData />
      </Suspense>
    </>
  );
}

async function ListingsData() {
  await requireAdmin("/anuncios");
  const listings = await loadAdminListings();
  const count = (status: string) => listings.filter((listing) => listing.status === status).length;

  return (
    <>
      <Segmented
        active="Todos"
        items={[
          { label: "Todos", count: listings.length },
          { label: "No ar", count: count("no_ar") },
          { label: "Em revisão", count: count("em_revisao") },
          { label: "Pausados", count: count("pausado") },
          { label: "Rascunhos", count: count("rascunho") },
          { label: "Convite pendente", count: count("convite_pendente") },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2 py-4">
        <SearchInput placeholder="Buscar por título, anunciante ou e-mail" className="w-full sm:w-80" />
        <Select label="Cidade" options={[...new Set(listings.map((listing) => listing.city))].sort()} />
        <Select label="Tipo de sala" options={[...new Set(listings.map((listing) => listing.type))].sort()} />
        <Select label="Origem" options={["Anunciante", "Criado pelo admin", "Importado"]} />
      </div>
      <ListingsTable listings={listings} selectable />
    </>
  );
}
