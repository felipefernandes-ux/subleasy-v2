import { Suspense } from "react";
import type { Metadata } from "next";
import { PlusIcon, ShieldCheckIcon } from "@phosphor-icons/react/ssr";
import { Avatar, Badge, Button, Card, PageHeader, TableCard } from "@/components/superadmin/ui";
import { requireAdmin } from "@/lib/superadmin/auth";
import { loadAdmins } from "@/lib/superadmin/admins";

export const metadata: Metadata = { title: "Administradores" };

export default function AdminsPage() {
  return (
    <>
      <PageHeader
        title="Administradores"
        description="Quem tem acesso ao Super Admin e se cada pessoa já ativou o segundo fator (2FA)."
        actions={
          <Button variant="primary">
            <PlusIcon className="size-4" weight="bold" aria-hidden />
            Convidar admin
          </Button>
        }
      />
      <Suspense fallback={<p className="py-10 text-center text-sa-muted">Carregando…</p>}>
        <Admins />
      </Suspense>
    </>
  );
}

async function Admins() {
  await requireAdmin("/configuracoes");
  const admins = await loadAdmins();
  return (
    <>
      <TableCard>
        <table className="sa-table">
          <thead>
            <tr>
              <th scope="col">Pessoa</th>
              <th scope="col">Função</th>
              <th scope="col">2FA</th>
              <th scope="col">Último acesso</th>
              <th scope="col">Admin desde</th>
              <th scope="col">
                <span className="sr-only">Ação</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td>
                  <span className="flex items-center gap-3">
                    <Avatar name={admin.name} />
                    <span>
                      <span className="block font-semibold">{admin.name}</span>
                      <span className="text-sa-xs text-sa-muted">{admin.email}</span>
                    </span>
                  </span>
                </td>
                <td>
                  <Badge tone="brand">Super admin</Badge>
                </td>
                <td>
                  {admin.twoFactor ? (
                    <Badge tone="success" dot>
                      Ativo
                    </Badge>
                  ) : (
                    <Badge tone="warning" dot>
                      Desligado
                    </Badge>
                  )}
                </td>
                <td className="text-sa-muted">{admin.lastSeen}</td>
                <td className="text-sa-muted">{admin.since}</td>
                <td className="text-right">
                  <Button small variant="ghost" disabled>
                    Remover
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      {admins.length === 1 && (
        <Card className="mt-6 flex items-start gap-3 p-5">
          <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-mint-700" weight="fill" aria-hidden />
          <div>
            <p className="font-semibold">Você é o único admin</p>
            <p className="text-sa-sm text-sa-muted">
              Se outras pessoas entrarem (suporte, moderação), vale separar permissões por área desde o primeiro convite.
            </p>
          </div>
        </Card>
      )}
    </>
  );
}
