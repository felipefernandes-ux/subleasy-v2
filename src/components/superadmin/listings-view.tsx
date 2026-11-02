"use client";

import { useState } from "react";
import type { Listing, ListingStatus } from "@/lib/superadmin/types";
import { ListingsTable } from "./listings-table";
import { SearchInput, Segmented, Select } from "./ui";

const TABS: Array<{ label: string; status: ListingStatus | null }> = [
  { label: "Todos", status: null },
  { label: "No ar", status: "no_ar" },
  { label: "Em revisão", status: "em_revisao" },
  { label: "Pausados", status: "pausado" },
  { label: "Rascunhos", status: "rascunho" },
  { label: "Convite pendente", status: "convite_pendente" },
];

/** Lista de anúncios com abas por status. O filtro roda no navegador; a tabela reentra com fade a cada troca. */
export function ListingsView({ listings }: { listings: Listing[] }) {
  const [active, setActive] = useState("Todos");
  const status = TABS.find((tab) => tab.label === active)?.status ?? null;
  const visible = status ? listings.filter((listing) => listing.status === status) : listings;

  return (
    <>
      <Segmented
        active={active}
        onChange={setActive}
        items={TABS.map((tab) => ({
          label: tab.label,
          count: tab.status ? listings.filter((listing) => listing.status === tab.status).length : listings.length,
        }))}
      />
      <div className="flex flex-wrap items-center gap-2 py-4">
        <SearchInput placeholder="Buscar por título, anunciante ou e-mail" className="w-full sm:w-80" />
        <Select label="Cidade" options={[...new Set(listings.map((listing) => listing.city))].sort()} />
        <Select label="Tipo de sala" options={[...new Set(listings.map((listing) => listing.type))].sort()} />
        <Select label="Origem" options={["Anunciante", "Criado pelo admin", "Importado"]} />
      </div>
      {/* A key remonta a tabela: a animação roda de novo e a seleção da aba anterior é descartada. */}
      <div key={active} className="animate-[sa-tab-in_0.28s_cubic-bezier(0.2,0.7,0.2,1)_both] motion-reduce:animate-none">
        <ListingsTable listings={visible} selectable />
      </div>
    </>
  );
}
