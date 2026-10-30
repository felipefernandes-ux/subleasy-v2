import { Suspense } from "react";
import type { Metadata } from "next";
import { UploadSimpleIcon } from "@phosphor-icons/react/ssr";
import { BrevoSyncCard } from "@/components/superadmin/brevo-sync-card";
import {
  Badge,
  ButtonLink,
  Card,
  PageHeader,
  Pagination,
  StatCard,
  TableCard,
} from "@/components/superadmin/ui";
import { EmptyState, QueueClearArt } from "@/components/superadmin/empty-state";
import { requireAdmin } from "@/lib/superadmin/auth";
import { loadLeads } from "@/lib/superadmin/leads";

export const metadata: Metadata = { title: "Base de leads" };

export default function LeadsPage() {
  return (
    <>
      <PageHeader
        title="Base de leads"
        description="Uma tabela única, com a origem e a base legal de cada contato. Quem não tem base legal para marketing fica na base, mas o envio de campanha bloqueia."
        actions={
          <ButtonLink href="/leads/importar" variant="primary">
            <UploadSimpleIcon className="size-4" weight="bold" aria-hidden />
            Importar lista
          </ButtonLink>
        }
      />
      <BrevoSyncCard />
      <Suspense fallback={<p className="py-10 text-center text-sa-muted">Carregando…</p>}>
        <Leads />
      </Suspense>
    </>
  );
}

async function Leads() {
  await requireAdmin("/leads");
  const leads = await loadLeads();
  const canReceive = leads.filter((lead) => lead.campaign).length;
  const fromWordPress = leads.filter((lead) => lead.origin === "WordPress atual").length;
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Contatos na base" value={leads.length} hint={`${fromWordPress} do WordPress atual`} />
        <StatCard label="Podem receber campanha" value={canReceive} hint="Consentimento ou legítimo interesse" />
        <StatCard label="Só e-mails do serviço" value={leads.length - canReceive} hint="Sem base legal para marketing" />
      </div>
      {leads.length === 0 ? (
        <Card>
          <EmptyState
            art={<QueueClearArt />}
            title="Nenhum contato na base"
            description="Os contatos aparecem aqui quando alguém cria conta ou quando a lista do WordPress é importada."
          />
        </Card>
      ) : (
        <TableCard footer={<Pagination total={leads.length} shown={leads.length} />}>
          <table className="sa-table">
            <thead>
              <tr>
                <th scope="col">Contato</th>
                <th scope="col">Cidade</th>
                <th scope="col">Origem</th>
                <th scope="col">Base legal</th>
                <th scope="col">Campanha</th>
                <th scope="col">Entrou em</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <span className="block font-semibold">{lead.name}</span>
                    <span className="text-sa-xs text-sa-muted">{lead.email}</span>
                  </td>
                  <td className="text-sa-body">{lead.city}</td>
                  <td className="whitespace-nowrap text-sa-body">{lead.origin}</td>
                  <td className="text-sa-muted">{lead.legalBasis}</td>
                  <td>
                    {lead.campaign ? (
                      <Badge tone="success" dot>
                        Pode receber
                      </Badge>
                    ) : (
                      <Badge>Bloqueado</Badge>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-sa-muted">{lead.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
    </>
  );
}
