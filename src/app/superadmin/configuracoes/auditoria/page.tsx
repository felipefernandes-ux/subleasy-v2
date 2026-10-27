import type { Metadata } from "next";
import { Badge, PageHeader, Pagination, SearchInput, Select, TableCard } from "@/components/superadmin/ui";
import { AUDIT } from "../../_data/mock";

export const metadata: Metadata = { title: "Registro de auditoria" };

export default function AuditPage() {
  return (
    <>
      <PageHeader
        title="Registro de auditoria"
        description="Cada ação do admin grava quem fez, quando, o quê e o motivo. O registro só cresce: não tem edição nem exclusão, nem para você."
      />
      <div className="flex flex-wrap items-center gap-2 pb-4">
        <SearchInput placeholder="Buscar por ação, alvo ou motivo" className="w-full sm:w-80" />
        <Select label="Pessoa" options={["Felipe Fernandes"]} />
        <Select label="Área" options={["Anúncios", "Usuários", "Leads", "Configurações"]} />
        <Select label="Período" options={["Hoje", "Últimos 7 dias", "Últimos 30 dias"]} />
      </div>
      <TableCard footer={<Pagination total={AUDIT.length} shown={AUDIT.length} />}>
        <table className="sa-table">
          <thead>
            <tr>
              <th scope="col">Quando</th>
              <th scope="col">Quem</th>
              <th scope="col">Ação</th>
              <th scope="col">Alvo</th>
              <th scope="col">Motivo</th>
              <th scope="col">Área</th>
            </tr>
          </thead>
          <tbody>
            {AUDIT.map((entry) => (
              <tr key={entry.id}>
                <td className="whitespace-nowrap text-sa-muted">{entry.when}</td>
                <td className="whitespace-nowrap">{entry.who}</td>
                <td className="whitespace-nowrap font-semibold">{entry.action}</td>
                <td className="max-w-72 truncate">{entry.target}</td>
                <td className="max-w-80 truncate text-sa-muted">{entry.reason}</td>
                <td>
                  <Badge>{entry.area}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </>
  );
}
