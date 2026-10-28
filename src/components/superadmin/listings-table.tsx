"use client";

import Link from "next/link";
import { useState } from "react";
import type { Listing } from "@/app/superadmin/_data/mock";
import { DeleteListingsDialog } from "./delete-listings-dialog";
import { Avatar, Button, ButtonLink, ListingStatusBadge, OriginLabel, Pagination, TableCard } from "./ui";

export function ListingsTable({
  listings,
  total,
  variant = "all",
  selectable,
}: {
  listings: Listing[];
  total?: number;
  variant?: "all" | "review" | "imported";
  /** Liga as caixas de seleção e a exclusão em lote. Só para dados reais. */
  selectable?: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const chosen = listings.filter((listing) => selected.has(listing.id));
  const allSelected = listings.length > 0 && chosen.length === listings.length;

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <>
      {selectable && chosen.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-sa-card bg-brand-50 px-4 py-2.5 ring-1 ring-brand-200">
          <span className="text-sa-base text-brand-900">
            <strong className="font-semibold">{chosen.length}</strong> {chosen.length === 1 ? "anúncio selecionado" : "anúncios selecionados"}
          </span>
          <span className="flex gap-2">
            <Button small variant="ghost" onClick={() => setSelected(new Set())}>
              Limpar seleção
            </Button>
            <DeleteListingsDialog listings={chosen} onDone={() => setSelected(new Set())} />
          </span>
        </div>
      )}

      <TableCard footer={<Pagination total={total ?? listings.length} shown={listings.length} />}>
        <table className="sa-table">
          <thead>
            <tr>
              {selectable && (
                <th scope="col" className="w-10">
                  <input
                    type="checkbox"
                    aria-label="Selecionar todos"
                    checked={allSelected}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(listings.map((listing) => listing.id)))}
                    className="size-4 accent-brand-600"
                  />
                </th>
              )}
              <th scope="col">Anúncio</th>
              <th scope="col">Anunciante</th>
              <th scope="col">Cidade</th>
              <th scope="col">Preço</th>
              <th scope="col">Status</th>
              <th scope="col">{variant === "imported" ? "Convite" : "Origem"}</th>
              <th scope="col">{variant === "review" ? "Enviado" : "Validade"}</th>
              <th scope="col">
                <span className="sr-only">Ação</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id}>
                {selectable && (
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Selecionar ${listing.title}`}
                      checked={selected.has(listing.id)}
                      onChange={() => toggle(listing.id)}
                      className="size-4 accent-brand-600"
                    />
                  </td>
                )}
                <td className="max-w-80">
                  <Link href={`/anuncios/${listing.id}`} className="block truncate font-semibold text-sa-ink hover:text-brand-600">
                    {listing.title}
                  </Link>
                  <span className="text-sa-xs text-sa-muted">{listing.type}</span>
                </td>
                <td className="max-w-56">
                  <span className="flex items-center gap-2">
                    <Avatar name={listing.owner} size="sm" />
                    <span className="truncate">{listing.owner}</span>
                  </span>
                </td>
                <td className="whitespace-nowrap text-sa-body">{listing.city}</td>
                <td className="whitespace-nowrap text-sa-body">{listing.price}</td>
                <td>
                  <ListingStatusBadge status={listing.status} />
                </td>
                <td className="whitespace-nowrap">
                  {variant === "imported" ? <span className="text-sa-muted">{listing.expires}</span> : <OriginLabel origin={listing.origin} />}
                </td>
                <td className="whitespace-nowrap text-sa-muted">{variant === "review" ? listing.submitted : listing.expires}</td>
                <td className="text-right">
                  {variant === "review" ? (
                    <ButtonLink href={`/anuncios/${listing.id}`} small variant="primary">
                      Revisar
                    </ButtonLink>
                  ) : variant === "imported" ? (
                    <ButtonLink href={`/anuncios/${listing.id}`} small>
                      Reenviar convite
                    </ButtonLink>
                  ) : (
                    <ButtonLink href={`/anuncios/${listing.id}`} small variant="ghost">
                      Abrir
                    </ButtonLink>
                  )}
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr>
                <td colSpan={selectable ? 9 : 8} className="py-10 text-center text-sa-muted">
                  Nenhum anúncio por aqui.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableCard>
    </>
  );
}
