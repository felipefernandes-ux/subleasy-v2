import type { Metadata } from "next";
import { Badge, Button, PageHeader, TableCard, Segmented } from "@/components/superadmin/ui";
import { ConfirmDialog } from "@/components/superadmin/confirm-dialog";
import { DATA_REQUESTS } from "../../_data/mock";

export const metadata: Metadata = { title: "Pedidos do titular" };

export default function DataRequestsPage() {
  return (
    <>
      <PageHeader
        title="Pedidos do titular"
        description="Pedidos de exclusão, exportação e correção de dados. Prazo de 15 dias para responder (LGPD, art. 19, II). Os registros de acesso ficam 6 meses mesmo após a exclusão."
      />
      <Segmented
        active="Abertos"
        items={[
          { label: "Abertos", count: DATA_REQUESTS.filter((request) => request.status !== "concluido").length },
          { label: "Concluídos", count: DATA_REQUESTS.filter((request) => request.status === "concluido").length },
        ]}
      />
      <div className="pt-4">
        <TableCard>
          <table className="sa-table">
            <thead>
              <tr>
                <th scope="col">Pessoa</th>
                <th scope="col">Pedido</th>
                <th scope="col">Recebido</th>
                <th scope="col">Prazo</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Ação</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {DATA_REQUESTS.map((request) => (
                <tr key={request.id}>
                  <td>
                    <span className="block font-semibold">{request.person}</span>
                    <span className="text-sa-xs text-sa-muted">{request.email}</span>
                  </td>
                  <td>{request.kind}</td>
                  <td className="whitespace-nowrap text-sa-muted">{request.received}</td>
                  <td className="whitespace-nowrap">
                    {request.status === "concluido" ? (
                      <span className="text-sa-muted">—</span>
                    ) : (
                      <Badge tone={request.dueIn <= 3 ? "danger" : "neutral"} dot>
                        {request.dueIn} dias
                      </Badge>
                    )}
                  </td>
                  <td>
                    <Badge tone={request.status === "concluido" ? "success" : request.status === "em_andamento" ? "brand" : "warning"}>
                      {request.status === "concluido" ? "Concluído" : request.status === "em_andamento" ? "Em andamento" : "Aberto"}
                    </Badge>
                  </td>
                  <td className="text-right">
                    {request.status === "concluido" ? (
                      <Button small variant="ghost">
                        Ver registro
                      </Button>
                    ) : (
                      <ConfirmDialog
                        trigger="Concluir"
                        triggerSmall
                        title={`Concluir: ${request.kind.toLowerCase()}`}
                        description={`${request.person} recebe a confirmação por e-mail. O pedido e a prova de cumprimento ficam guardados.`}
                        confirmLabel="Concluir pedido"
                        reasonLabel="Como foi atendido"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </div>
    </>
  );
}
