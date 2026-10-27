import Link from "next/link";
import { Avatar, ButtonLink, ListingStatusBadge, OriginLabel, TableCard, Pagination } from "./ui";
import type { Listing } from "@/app/superadmin/_data/mock";

export function ListingsTable({
  listings,
  total,
  variant = "all",
}: {
  listings: Listing[];
  total?: number;
  variant?: "all" | "review" | "imported";
}) {
  return (
    <TableCard footer={<Pagination total={total ?? listings.length} shown={listings.length} />}>
      <table className="sa-table">
        <thead>
          <tr>
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
              <td className="max-w-80">
                <Link href={`/superadmin/anuncios/${listing.id}`} className="block truncate font-semibold text-sa-ink hover:text-brand-600">
                  {listing.title}
                </Link>
                <span className="text-sa-xs text-sa-muted">{listing.type}</span>
              </td>
              <td>
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
                  <ButtonLink href={`/superadmin/anuncios/${listing.id}`} small variant="primary">
                    Revisar
                  </ButtonLink>
                ) : variant === "imported" ? (
                  <ButtonLink href={`/superadmin/anuncios/${listing.id}`} small>
                    Reenviar convite
                  </ButtonLink>
                ) : (
                  <ButtonLink href={`/superadmin/anuncios/${listing.id}`} small variant="ghost">
                    Abrir
                  </ButtonLink>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}
