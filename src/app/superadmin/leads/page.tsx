import type { Metadata } from "next";
import { UploadSimpleIcon } from "@phosphor-icons/react/ssr";
import {
  Badge,
  ButtonLink,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatCard,
  TableCard,
} from "@/components/superadmin/ui";
import { LEADS } from "../_data/mock";

export const metadata: Metadata = { title: "Base de leads" };

export default function LeadsPage() {
  return (
    <>
      <PageHeader
        title="Base de leads"
        description="Uma tabela única, com a origem e a base legal de cada contato. Quem não tem base legal para marketing fica na base, mas o envio de campanha bloqueia."
        actions={
          <ButtonLink href="/superadmin/leads/importar" variant="primary">
            <UploadSimpleIcon className="size-4" weight="bold" aria-hidden />
            Importar lista
          </ButtonLink>
        }
      />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Contatos na base" value={812} hint="318 do WordPress atual" />
        <StatCard label="Podem receber campanha" value={604} hint="Consentimento ou legítimo interesse" />
        <StatCard label="Só e-mails do serviço" value={208} hint="Sem base legal para marketing" />
      </div>
      <div className="flex flex-wrap items-center gap-2 pb-4">
        <SearchInput placeholder="Buscar por nome ou e-mail" className="w-full sm:w-80" />
        <Select label="Origem" options={["Cadastro com aceite", "Cadastro sem aceite", "WordPress atual", "Formulário Avise-me", "Mensagem a anúncio"]} />
        <Select label="Cidade" options={["Maringá", "Londrina", "Curitiba", "Cascavel"]} />
        <Select label="Recebe campanha" options={["Sim", "Não"]} />
      </div>
      <TableCard footer={<Pagination total={812} shown={LEADS.length} />}>
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
            {LEADS.map((lead) => (
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
    </>
  );
}
