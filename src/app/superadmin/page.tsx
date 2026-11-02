import { Suspense, cache } from "react";
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
import { Tabs } from "@/components/superadmin/tabs";
import { EmptyState, QueueClearArt, QuietTimelineArt } from "@/components/superadmin/empty-state";
import { getAdminIdentity, requireAdmin } from "@/lib/superadmin/auth";
import { loadDailyNumbers } from "@/lib/superadmin/daily-numbers";
import { loadAdminListings } from "@/lib/superadmin/listings";
import { loadTrafficNumbers, type TrafficPair } from "@/lib/superadmin/posthog-analytics";

export const metadata: Metadata = { title: "Início" };

// A fila e a lista "Aprovar agora" leem os mesmos anúncios; o cache evita a segunda ida ao banco.
const loadListings = cache(loadAdminListings);

export default function SuperAdminHome() {
  return (
    <>
      <Suspense fallback={<PageHeader title="Início" description="Só o que pede ação hoje." />}>
        <HomeHeader />
      </Suspense>

      <Tabs
        label="Resumo"
        tabs={[
          {
            id: "anuncios",
            label: "Anúncios",
            content: (
              <section aria-label="Fila do dia" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <Suspense fallback={<p className="col-span-2 text-sa-sm text-sa-muted xl:col-span-4">Carregando…</p>}>
                  <DayQueue />
                </Suspense>
              </section>
            ),
          },
          {
            id: "trafego",
            label: "Tráfego do site",
            content: (
              <section aria-label="Tráfego do site">
                <Suspense fallback={<p className="py-6 text-sa-sm text-sa-muted">Carregando…</p>}>
                  <TrafficNumbers />
                </Suspense>
              </section>
            ),
          },
        ]}
      />

      <section aria-label="Números do dia" className="mt-8">
        <Suspense fallback={<p className="py-6 text-sa-sm text-sa-muted">Carregando…</p>}>
          <DailyNumbers />
        </Suspense>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_24rem]">
        <Card className="overflow-hidden">
          <CardHeader
            title="Aprovar agora"
            description="Do mais antigo para o mais novo."
            action={<ButtonLink href="/anuncios/revisao" small>Ver todos</ButtonLink>}
          />
          <Suspense fallback={<p className="px-5 py-8 text-center text-sa-sm text-sa-muted">Carregando…</p>}>
            <ReviewList />
          </Suspense>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Atividade recente"
            action={<ButtonLink href="/configuracoes/auditoria" small>Auditoria</ButtonLink>}
          />
          {/* Ainda não há tabela de auditoria; quando houver, a lista volta aqui. */}
          <EmptyState
            art={<QuietTimelineArt />}
            title="Sem atividade por enquanto"
            description="Aprovações, devoluções e remoções feitas no painel ficam registradas aqui."
          />
        </Card>
      </div>
    </>
  );
}

/** Fila real: anúncios em revisão do banco, do mais antigo para o mais novo. */
async function ReviewList() {
  await requireAdmin("/");
  const pending = (await loadListings()).filter((listing) => listing.status === "em_revisao").reverse();
  if (pending.length === 0) {
    return (
      <EmptyState
        art={<QueueClearArt />}
        title="Nada para aprovar"
        description="A fila está limpa. Novos anúncios enviados para revisão aparecem aqui, do mais antigo para o mais novo."
      />
    );
  }
  return (
    <ul className="divide-y divide-sa-haze">
      {pending.map((listing) => (
        <li key={listing.id}>
          <Link
            href={`/anuncios/${listing.id}`}
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
  );
}

async function DailyNumbers() {
  await requireAdmin("/");
  const numbers = await loadDailyNumbers();
  return (
    <>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="sa-display text-sa-title font-semibold">Números do dia</h2>
        <span className="text-sa-sm text-sa-muted">Atualizado às {numbers.updatedAt}</span>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 sm:-mx-6 sm:scroll-px-6 sm:px-6 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        <div className="w-[calc(50%-0.375rem)] shrink-0 snap-start md:w-auto">
          <StatCard label="Novos cadastros hoje" value={numbers.signups.value} hint={numbers.signups.hint} series={numbers.signups.series} />
        </div>
        <div className="w-[calc(50%-0.375rem)] shrink-0 snap-start md:w-auto">
          <StatCard label="Anúncios no ar" value={numbers.liveListings.value} hint={numbers.liveListings.hint} series={numbers.liveListings.series} />
        </div>
        <div className="w-[calc(50%-0.375rem)] shrink-0 snap-start md:w-auto">
          <StatCard label="Contatos nos últimos 7 dias" value={numbers.contacts.value} hint={numbers.contacts.hint} series={numbers.contacts.series} />
        </div>
      </div>
    </>
  );
}

/** Compara com os 7 dias anteriores: "+12% vs. 7 dias anteriores". */
function versus(pair: TrafficPair) {
  if (pair.previous === 0) return "Sem base nos 7 dias anteriores";
  const change = Math.round(((pair.current - pair.previous) / pair.previous) * 100);
  return `${change > 0 ? "+" : change < 0 ? "−" : ""}${Math.abs(change)}% vs. 7 dias anteriores`;
}

function duration(seconds: number) {
  const rounded = Math.round(seconds);
  return rounded < 60 ? `${rounded}s` : `${Math.floor(rounded / 60)}min ${String(rounded % 60).padStart(2, "0")}s`;
}

async function TrafficNumbers() {
  await requireAdmin("/");
  const result = await loadTrafficNumbers();
  return (
    <>
      <p className="mb-3 text-sa-sm text-sa-muted">PostHog, últimos 7 dias, sem admins.</p>
      {result.ok ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard label="Usuários" value={result.data.users.current} hint={versus(result.data.users)} />
          <StatCard label="Novos usuários" value={result.data.firstTimeUsers.current} hint={versus(result.data.firstTimeUsers)} />
          <StatCard label="Em tempo real" value={result.data.live} hint="Nos últimos 5 minutos" />
          <StatCard
            label="Duração da sessão"
            value={duration(result.data.sessionSeconds.current)}
            hint={versus(result.data.sessionSeconds)}
          />
        </div>
      ) : (
        <Card className="p-5 text-sa-sm text-sa-muted">Não foi possível ler o PostHog: {result.reason}</Card>
      )}
    </>
  );
}

async function DayQueue() {
  await requireAdmin("/");
  const listings = await loadListings();
  // A lista vem do mais novo para o mais antigo; o último da fila é o que espera há mais tempo.
  const pending = listings.filter((listing) => listing.status === "em_revisao");
  const imported = listings.filter((listing) => listing.status === "convite_pendente");
  return (
    <>
      <QueueCard
        href="/anuncios/revisao"
        label="Anúncios em revisão"
        count={pending.length}
        detail={pending.length ? `Mais antigo: ${pending[pending.length - 1].submitted}` : "Fila limpa"}
        icon={ListChecksIcon}
      />
      <QueueCard
        href="/usuarios/pedidos"
        label="Pedidos do titular (LGPD)"
        count="—"
        detail="Nenhum pedido registrado"
        icon={ScrollIcon}
      />
      <QueueCard
        href="/moderacao"
        label="Denúncias abertas"
        count="—"
        detail="Chega com a moderação"
        icon={FlagIcon}
        soon
      />
      <QueueCard
        href="/anuncios/importados"
        label="Importados sem dono"
        count={imported.length}
        detail={imported.length ? "Esperando o dono aceitar o convite" : "Nenhum esperando convite"}
        icon={TrayArrowDownIcon}
      />
    </>
  );
}

async function HomeHeader() {
  await requireAdmin("/");
  const { firstName } = await getAdminIdentity();
  const hour = Number(new Date().toLocaleString("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }));
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  return (
    <PageHeader
      title={firstName ? `${greeting}, ${firstName}` : greeting}
      description="Só o que pede ação hoje. Fechando a fila, o resto do dia é seu."
      actions={
        <>
          <ButtonLink href="/usuarios/novo">Convidar usuário</ButtonLink>
          <ButtonLink href="/anuncios/novo" variant="primary">
            Novo anúncio
          </ButtonLink>
        </>
      }
    />
  );
}
