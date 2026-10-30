import type { Metadata } from "next";
import { FileCsvIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { Button, ButtonLink, Card, CardHeader, Field, PageHeader } from "@/components/superadmin/ui";

export const metadata: Metadata = { title: "Importar leads do WordPress" };

export default function ImportLeadsPage() {
  return (
    <>
      <PageHeader
        title="Importar lista do WordPress"
        description="Traz os anunciantes do Subleasy atual para a base de leads, com origem importado_wp e a base legal registrada. É a base da campanha de lançamento."
      />
      <div className="grid grid-cols-1 max-w-5xl gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="1. Arquivo" />
            <div className="p-5">
              <label
                htmlFor="leads-file"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-sa-card border border-dashed border-sa-line-strong bg-sa-paper px-6 py-10 text-center transition-colors hover:border-brand-400"
              >
                <FileCsvIcon className="size-8 text-sa-subtle" aria-hidden />
                <span className="font-semibold text-sa-ink">Escolha o arquivo CSV ou JSON</span>
                <span className="text-sa-sm text-sa-muted">Colunas esperadas: nome, e-mail, WhatsApp e cidade</span>
                <input id="leads-file" type="file" accept=".csv,.json" className="sr-only" />
              </label>
            </div>
          </Card>

          <Card>
            <CardHeader title="2. Base legal" description="Registrada em cada contato importado." />
            <div className="space-y-4 p-5">
              <Field label="Base legal">
                <input className="sa-input" defaultValue="Legítimo interesse (LGPD, art. 7º, IX, e art. 10)" readOnly />
              </Field>
              <Field label="Teste de legítimo interesse" htmlFor="lia" hint="Anexe o documento escrito antes de importar.">
                <input id="lia" type="file" className="sa-input h-auto py-1.5 text-sa-sm" />
              </Field>
              <label className="flex items-start gap-2.5 text-sa-base">
                <input type="checkbox" className="mt-1 size-4 accent-brand-600" />
                <span>Confirmo que a lista é de anunciantes do Subleasy atual. Listas compradas ou copiadas nunca entram.</span>
              </label>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <ButtonLink href="/leads" variant="ghost">
              Cancelar
            </ButtonLink>
            <Button variant="primary" disabled>
              Importar contatos
            </Button>
          </div>
        </div>

        <aside>
          <Card className="space-y-3 p-5 text-sa-sm text-sa-muted">
            <h2 className="text-sa-lg font-semibold text-sa-ink">Antes de importar</h2>
            <p className="flex gap-2">
              <WarningCircleIcon className="mt-0.5 size-4 shrink-0 text-warning-500" weight="fill" aria-hidden />
              Escreva o teste de legítimo interesse da campanha para os anunciantes do WordPress.
            </p>
            <p>O descadastro precisa estar no próprio convite.</p>
            <p>E-mails duplicados e já suprimidos são ignorados na importação.</p>
          </Card>
        </aside>
      </div>
    </>
  );
}
