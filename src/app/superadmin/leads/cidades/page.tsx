import { Suspense } from "react";
import type { Metadata } from "next";
import { Badge, Card, PageHeader, StatCard, TableCard } from "@/components/superadmin/ui";
import { EmptyState, QueueClearArt } from "@/components/superadmin/empty-state";
import { StatCardsSkeleton, TableSkeleton } from "@/components/superadmin/skeletons";
import { requireAdmin } from "@/lib/superadmin/auth";
import { loadCityDemand } from "@/lib/superadmin/city-demand";

export const metadata: Metadata = { title: "Cidades buscando anúncios" };

export default function Page() {
  return (
    <>
      <PageHeader
        title="Cidades buscando anúncios"
        description="Pedidos de quem não achou a cidade na busca. Cidades sem sala no ar aparecem primeiro: é onde faltam anunciantes."
      />
      <Suspense
        fallback={
          <>
            <StatCardsSkeleton count={3} className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3" />
            <TableSkeleton label="Carregando pedidos" />
          </>
        }
      >
        <Cities />
      </Suspense>
    </>
  );
}

const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });

async function Cities() {
  await requireAdmin("/leads/cidades");
  const rows = await loadCityDemand();
  const without = rows.filter((row) => row.active === 0);
  const people = rows.reduce((sum, row) => sum + row.people, 0);
  const waiting = rows.reduce((sum, row) => sum + row.waiting, 0);

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Cidades sem sala com pedido" value={without.length} hint={`${rows.length} cidades com pedido no total`} />
        <StatCard label="Pessoas que pediram" value={people} hint="Uma por visitante e cidade" />
        <StatCard label="Esperando aviso por e-mail" value={waiting} hint="Recebem um e-mail quando a 1ª sala entrar" />
      </div>
      {rows.length === 0 ? (
        <Card>
          <EmptyState
            art={<QueueClearArt />}
            title="Nenhum pedido ainda"
            description="Os pedidos aparecem aqui quando alguém usa “Não encontrou a cidade que buscava?” na busca."
          />
        </Card>
      ) : (
        <TableCard>
          <table className="sa-table">
            <thead>
              <tr>
                <th scope="col">Cidade</th>
                <th scope="col">Pessoas</th>
                <th scope="col">Esperando aviso</th>
                <th scope="col">Tipo mais pedido</th>
                <th scope="col">Salas no ar</th>
                <th scope="col">Último pedido</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="font-semibold">
                    {row.city}, {row.state}
                  </td>
                  <td>{row.people}</td>
                  <td>{row.waiting}</td>
                  <td className="text-sa-body">{row.topType ?? "Não informado"}</td>
                  <td>
                    {row.active > 0 ? (
                      <Badge tone="success" dot>
                        {row.active} {row.active === 1 ? "sala" : "salas"}
                      </Badge>
                    ) : (
                      <Badge tone="warning" dot>
                        Sem sala
                      </Badge>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-sa-muted">{date.format(new Date(row.lastAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
    </>
  );
}
