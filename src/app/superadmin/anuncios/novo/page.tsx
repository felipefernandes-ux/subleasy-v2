import type { Metadata } from "next";
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { Button, ButtonLink, Card, CardHeader, Field, PageHeader, SearchInput } from "@/components/superadmin/ui";

export const metadata: Metadata = { title: "Criar anúncio em nome de" };

const STEPS = ["Anunciante", "Autorização", "Anúncio", "Publicar"];

export default function NewListingPage() {
  return (
    <>
      <PageHeader
        title="Criar anúncio em nome de"
        description="O anúncio sempre pertence a uma conta real de anunciante; você aparece só como quem criou. É o mesmo caminho que a importação do WordPress vai usar."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="1. Anunciante" description="Busque por nome, e-mail ou WhatsApp." />
            <div className="space-y-5 p-5">
              <SearchInput placeholder="Buscar anunciante" />
              <div className="relative text-center text-sa-xs text-sa-muted before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-sa-line">
                <span className="relative bg-sa-canvas px-3">ou, se a pessoa não tem conta</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Nome" htmlFor="owner-name">
                  <input id="owner-name" className="sa-input" placeholder="Nome completo" />
                </Field>
                <Field label="E-mail" htmlFor="owner-email">
                  <input id="owner-email" type="email" className="sa-input" placeholder="nome@exemplo.com" />
                </Field>
                <Field label="WhatsApp" htmlFor="owner-whatsapp">
                  <input id="owner-whatsapp" className="sa-input" placeholder="(44) 99999-0000" />
                </Field>
              </div>
              <p className="text-sa-sm text-sa-muted">A conta nasce como convite pendente, sem senha. Você nunca define a senha de ninguém.</p>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="2. Autorização do anunciante"
              description="Sem isso o anúncio não pode ir ao ar, porque expõe o contato de um terceiro."
            />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Por onde a pessoa pediu" htmlFor="auth-channel">
                <select id="auth-channel" className="sa-input" defaultValue="">
                  <option value="" disabled>
                    Escolha um canal
                  </option>
                  <option>Telefone</option>
                  <option>WhatsApp</option>
                  <option>E-mail</option>
                  <option>Importação</option>
                </select>
              </Field>
              <Field label="Data do pedido" htmlFor="auth-date">
                <input id="auth-date" type="date" className="sa-input" />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="3. Anúncio" description="Mesmo assistente do anunciante, com a IA e as fotos." />
            <div className="p-5">
              <div className="grid min-h-48 place-items-center rounded-sa-card border border-dashed border-sa-line-strong bg-sa-paper p-8 text-center">
                <div className="max-w-sm">
                  <p className="font-semibold text-sa-ink">O assistente de anúncio entra aqui</p>
                  <p className="mt-1 text-sa-sm text-sa-muted">
                    Texto livre, fotos e revisão da IA, como em /anunciar. Nesta etapa só o visual existe.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="4. Publicar" />
            <div className="space-y-4 p-5">
              <p className="flex gap-2 text-sa-base text-sa-body">
                <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-mint-700" weight="fill" aria-hidden />
                Com autorização registrada, o anúncio vai direto ao ar (você já é o revisor) e o prazo de 30 dias começa.
              </p>
              <p className="flex gap-2 text-sa-base text-sa-body">
                <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-mint-700" weight="fill" aria-hidden />
                O anunciante recebe o e-mail “Criamos o anúncio da sua sala”, com link de acesso.
              </p>
              <p className="flex gap-2 text-sa-base text-sa-body">
                <WarningCircleIcon className="mt-0.5 size-4 shrink-0 text-warning-500" weight="fill" aria-hidden />
                Convite não aceito em 30 dias: o anúncio pausa e entra em “Importados sem dono”.
              </p>
              <div className="flex justify-end gap-2 border-t border-sa-haze pt-4">
                <ButtonLink href="/anuncios" variant="ghost">
                  Cancelar
                </ButtonLink>
                <Button variant="outline">Salvar rascunho</Button>
                <Button variant="primary" disabled>
                  Publicar anúncio
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-20 xl:self-start">
          <Card className="p-5">
            <h2 className="text-sa-lg font-semibold">Etapas</h2>
            <ol className="mt-3 space-y-2.5">
              {STEPS.map((step, index) => (
                <li key={step} className="flex items-center gap-3 text-sa-base">
                  <span className="grid size-6 place-items-center rounded-full bg-sa-haze text-sa-xs font-semibold text-sa-body">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-5 space-y-1.5 border-t border-sa-haze pt-4 text-sa-sm text-sa-muted">
              <p>O anúncio guarda quem criou e a origem (admin), para métricas e auditoria.</p>
              <p>O admin nunca vira dono. Para trocar, use Transferir.</p>
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
