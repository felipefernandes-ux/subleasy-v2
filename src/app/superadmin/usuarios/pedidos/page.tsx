import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminGate } from "@/components/superadmin/admin-gate";
import { Card, PageHeader } from "@/components/superadmin/ui";
import { EmptyState, QueueClearArt } from "@/components/superadmin/empty-state";

export const metadata: Metadata = { title: "Pedidos do titular" };

export default function DataRequestsPage() {
  return (
    <>
      <PageHeader
        title="Pedidos do titular"
        description="Pedidos de exclusão, exportação e correção de dados. Prazo de 15 dias para responder (LGPD, art. 19, II). Os registros de acesso ficam 6 meses mesmo após a exclusão."
      />
      <Suspense>
        <AdminGate next="/usuarios/pedidos">
          <Card>
            <EmptyState
              art={<QueueClearArt />}
              title="Nenhum pedido registrado"
              description="Quando houver pedidos de exclusão, exportação ou correção de dados, a fila aparece aqui, com o prazo de cada um."
            />
          </Card>
        </AdminGate>
      </Suspense>
    </>
  );
}
