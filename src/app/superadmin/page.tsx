import type { Metadata } from "next";
import Link from "next/link";
import { FlagIcon, ListChecksIcon, ScrollIcon, TrayArrowDownIcon } from "@phosphor-icons/react/ssr";
import {
  ButtonLink,
  Card,
  CardHeader,
  ListingStatusBadge,
  PageHeader,
  QueueCard,
  StatCard,
} from "@/components/superadmin/ui";
import { AUDIT, DAILY_NUMBERS, DATA_REQUESTS, LISTINGS } from "./_data/mock";

export const metadata: Metadata = { title: "Início" };

export default function SuperAdminHome() {
  const inReview = LISTINGS.filter((listing) => listing.status === "em_revisao");
  const openRequests = DATA_REQUESTS.filter((request) => request.status !== "concluido");

  return (
    <>
      <PageHeader
        title="Bom dia, Felipe"
        description="Só o que pede ação hoje. Fechando a fila, o resto do dia é seu."
        actions={
          <>
            <ButtonLink href="/superadmin/usuarios/novo">Convidar usuário</ButtonLink>
            <ButtonLink href="/superadmin/anuncios/novo" variant="primary">
              Novo anúncio
            </ButtonLink>
          </>
        }
      />

      <h2 className="sr-only">Fila do dia</h2>
      <section aria-label="Fila do dia" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <QueueCard
          href="/superadmin/anuncios/revisao"
          label="Anúncios em revisão"
          count={inReview.length}
          detail="Meta: resposta em até 1 dia útil"
          icon={ListChecksIcon}
        />
        <QueueCard
          href="/superadmin/usuarios/pedidos"
          label="Pedidos do titular (LGPD)"
          count={openRequests.length}
          detail="Prazo de 15 dias, 1 vence em 2 dias"
          icon={ScrollIcon}
        />
        <QueueCard
          href="/superadmin/moderacao"
          label="Denúncias abertas"
          count="—"
          detail="Chega com a moderação"
          icon={FlagIcon}
          soon
        />
        <QueueCard
          href="/superadmin/anuncios/importados"
          label="Importados sem dono"
          count={3}
          detail="1 convite vence em 3 dias"
          icon={TrayArrowDownIcon}
        />
      </section>

      <section aria-label="Números do dia" className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="sa-display text-sa-title font-semibold">Números do dia</h2>
          <span className="text-sa-sm text-sa-muted">Atualizado há 2 minutos</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Novos cadastros hoje" value={DAILY_NUMBERS.signups.value} hint={DAILY_NUMBERS.signups.delta} series={DAILY_NUMBERS.signups.series} />
          <StatCard label="Anúncios no ar" value={DAILY_NUMBERS.liveListings.value} hint={DAILY_NUMBERS.liveListings.delta} series={DAILY_NUMBERS.liveListings.series} />
          <StatCard label="Contatos nos últimos 7 dias" value={DAILY_NUMBERS.contacts.value} hint={DAILY_NUMBERS.contacts.delta} series={DAILY_NUMBERS.contacts.series} />
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Card className="overflow-hidden">
          <CardHeader
            title="Aprovar agora"
            description="Do mais antigo para o mais novo."
            action={<ButtonLink href="/superadmin/anuncios/revisao" small>Ver todos</ButtonLink>}
          />
          <ul className="divide-y divide-sa-haze">
            {inReview.map((listing) => (
              <li key={listing.id}>
                <Link
                  href={`/superadmin/anuncios/${listing.id}`}
                  className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-sa-paper"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-sa-ink">{listing.title}</p>
                    <p className="truncate text-sa-sm text-sa-muted">
                      {listing.owner} · {listing.neighborhood}, {listing.city}
                    </p>
                  </div>
                  <span className="hidden text-sa-sm text-sa-muted sm:block">{listing.submitted}</span>
                  <ListingStatusBadge status={listing.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Atividade recente"
            action={<ButtonLink href="/superadmin/configuracoes/auditoria" small>Auditoria</ButtonLink>}
          />
          <ol className="divide-y divide-sa-haze">
            {AUDIT.slice(0, 5).map((entry) => (
              <li key={entry.id} className="px-5 py-3">
                <p className="text-sa-base text-sa-ink">
                  <span className="font-semibold">{entry.action}</span>
                </p>
                <p className="truncate text-sa-sm text-sa-muted">{entry.target}</p>
                <p className="mt-1 text-sa-xs text-sa-subtle">{entry.when}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
