import type { Metadata } from "next";
import { Button, ButtonLink, Card, CardHeader, Field, PageHeader } from "@/components/superadmin/ui";

export const metadata: Metadata = { title: "Convidar usuário" };

export default function InviteUserPage() {
  return (
    <>
      <PageHeader
        title="Convidar usuário"
        description="Cria a conta sem senha e envia o link de acesso por e-mail. Use quando alguém pediu ajuda por telefone ou veio da importação."
      />
      <div className="grid max-w-4xl gap-6 lg:grid-cols-[1fr_18rem]">
        <Card>
          <CardHeader title="Dados da pessoa" />
          <form className="space-y-5 p-5">
            <Field label="Nome" htmlFor="name">
              <input id="name" className="sa-input" placeholder="Nome completo" />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="E-mail" htmlFor="email">
                <input id="email" type="email" className="sa-input" placeholder="nome@exemplo.com" />
              </Field>
              <Field label="WhatsApp" htmlFor="whatsapp">
                <input id="whatsapp" className="sa-input" placeholder="(44) 99999-0000" />
              </Field>
            </div>
            <Field label="Motivo do convite" htmlFor="why" hint="Entra no registro de auditoria.">
              <select id="why" className="sa-input" defaultValue="">
                <option value="" disabled>
                  Escolha um motivo
                </option>
                <option>Pedido de ajuda por telefone</option>
                <option>Pedido de ajuda por WhatsApp</option>
                <option>Importação do Subleasy atual</option>
              </select>
            </Field>
            <div className="flex justify-end gap-2 border-t border-sa-haze pt-5">
              <ButtonLink href="/superadmin/usuarios" variant="ghost">
                Cancelar
              </ButtonLink>
              <Button variant="primary">Enviar convite</Button>
            </div>
          </form>
        </Card>
        <Card className="h-fit space-y-3 p-5 text-sa-sm text-sa-muted">
          <h2 className="text-sa-lg font-semibold text-sa-ink">O que acontece</h2>
          <p>A conta nasce como convite pendente, só com nome, e-mail e WhatsApp.</p>
          <p>A pessoa recebe um link de acesso e aceita os termos no primeiro acesso.</p>
          <p>Base legal: a pedido do titular (LGPD, art. 7º, V).</p>
        </Card>
      </div>
    </>
  );
}
