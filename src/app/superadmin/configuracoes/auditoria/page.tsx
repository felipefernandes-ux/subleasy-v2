import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminGate } from "@/components/superadmin/admin-gate";
import { Card, PageHeader } from "@/components/superadmin/ui";
import { EmptyState, QuietTimelineArt } from "@/components/superadmin/empty-state";

export const metadata: Metadata = { title: "Registro de auditoria" };

export default function AuditPage() {
  return (
    <>
      <PageHeader
        title="Registro de auditoria"
        description="Cada ação do admin grava quem fez, quando, o quê e o motivo. O registro só cresce: não tem edição nem exclusão, nem para você."
      />
      <Suspense>
        <AdminGate next="/configuracoes/auditoria">
          <Card>
            <EmptyState
              art={<QuietTimelineArt />}
              title="Nenhuma ação registrada"
              description="Aprovações, devoluções, remoções e convites feitos no painel aparecem aqui, com quem fez, quando e o motivo."
            />
          </Card>
        </AdminGate>
      </Suspense>
    </>
  );
}
