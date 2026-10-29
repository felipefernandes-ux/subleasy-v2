import { Suspense, type CSSProperties, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { confirmInterest } from "../actions";
import "../invite.css";
import { BillingModes } from "@/components/invite/billing-modes";
import { Reveal } from "@/components/reveal";
import { AiBadge, CheckIcon, Logo, buttonClasses } from "@/components/ui";
import { INVITE_CAMPAIGN, verifyInviteToken } from "@/lib/invite-token";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Convite para o Subleasy 2.0",
  robots: { index: false, follow: false },
};

/** Dia em que o 2.0 abre ao público. */
const LAUNCH_DATE = "2026-11-09";

/**
 * Destino do botão “Quero participar” do e-mail. Abrir a página registra o clique;
 * o interesse só conta depois do toque em “Confirmar”, porque leitores de link de e-mail
 * abrem o endereço sozinhos e inflariam a taxa de interessados.
 *
 * A página completa o e-mail: o e-mail resume, aqui cada ponto ganha uma demonstração animada.
 */
export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="border-b border-ink-200 bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/" aria-label="Subleasy, página inicial" className="focus-ring rounded-control">
            <Logo />
          </Link>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
            Acesso antecipado
          </span>
        </div>
      </header>
      <Suspense fallback={<div className="h-[32rem] bg-brand-600" aria-hidden />}>
        <InviteContent params={params} />
      </Suspense>
    </div>
  );
}

async function InviteContent({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token: rawToken } = await params;
  const token = decodeURIComponent(rawToken);
  const userId = verifyInviteToken(token);

  if (!userId) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-5 py-16 sm:py-24">
        <h1 className="text-h2 font-semibold text-ink-900">Este link não é válido</h1>
        <p className="mt-3 text-ink-700">Ele pode ter sido copiado pela metade. Abra o link direto do e-mail, ou responda o e-mail do Felipe que ele envia outro.</p>
        <Link href="/" className={`${buttonClasses("primary", "lg")} mt-8`}>
          Ir para o Subleasy
        </Link>
      </main>
    );
  }

  const db = createAdminClient();
  const [{ data: invite }, { data: userData }] = await Promise.all([
    db.from("campaign_invites").select("clicked_at, interested_at").eq("user_id", userId).eq("campaign", INVITE_CAMPAIGN).maybeSingle(),
    db.auth.admin.getUserById(userId),
  ]);

  if (!invite) {
    await db.from("campaign_invites").upsert(
      { user_id: userId, campaign: INVITE_CAMPAIGN, clicked_at: new Date().toISOString() },
      { onConflict: "user_id,campaign", ignoreDuplicates: true },
    );
  }

  const fullName = String(userData.user?.user_metadata?.full_name ?? "").trim();
  const first = fullName.split(/\s+/)[0] ?? "";
  const confirmed = Boolean(invite?.interested_at);
  const daysLeft = daysUntilLaunch();

  const cta = confirmed ? <ConfirmedBadge /> : <ConfirmForm token={token} />;

  return (
    <main className="flex-1">
      {/* ── Abertura ─────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-brand-600 text-white">
        <div aria-hidden className="iv-glow absolute -top-24 -right-24 -z-10 size-[28rem] rounded-full bg-mint-400/25 blur-3xl" />
        <div aria-hidden className="absolute -bottom-40 -left-32 -z-10 size-[26rem] rounded-full bg-brand-400/40 blur-3xl" />
        <div className="container-page grid items-center gap-14 py-14 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:py-24">
          <div className="max-w-[38rem]">
            <p className="inline-flex animate-fade-up items-center gap-2 text-sm font-bold text-brand-100">
              <span className="size-2 rounded-full bg-mint-400" aria-hidden />
              Subleasy 2.0
            </p>
            <h1 className="mt-4 animate-fade-up text-display font-bold text-balance" style={{ animationDelay: "80ms" }}>
              {first ? `${first}, o` : "O"} Subleasy foi reconstruído do zero.
            </h1>
            <p className="mt-6 animate-fade-up text-lg leading-relaxed text-brand-100" style={{ animationDelay: "160ms" }}>
              Abre ao público em 9 de novembro. Você entra antes, com o acesso preparado, para anunciar e ver a plataforma funcionando
              antes de todo mundo.
            </p>
            <div className="mt-8 animate-fade-up" style={{ animationDelay: "240ms" }}>
              {cta}
            </div>
          </div>

          <Reveal>
            <LaunchCard daysLeft={daysLeft} />
          </Reveal>
        </div>
      </section>

      {/* ── O que muda ───────────────────────────────────────── */}
      <section className="border-b border-ink-200 bg-white py-16 sm:py-24">
        <div className="container-page">
          <Reveal>
            <p className="text-sm font-bold text-brand-600">O que muda</p>
            <h2 className="mt-3 max-w-[40rem] text-h1 font-bold text-balance text-ink-900">
              Cada problema do site antigo virou uma coisa que a plataforma resolve sozinha.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            <Reveal>
              <FeatureCard
                before="Formulário longo"
                title="Cadastro em 3 minutos"
                body="Você responde 5 perguntas e a IA escreve o título e a descrição. Você revisa e aprova antes de publicar."
              >
                <AiWritesVisual />
              </FeatureCard>
            </Reveal>
            <Reveal delay={90}>
              <FeatureCard
                before="Um jeito só de cobrar"
                title="Hora, turno, dia ou mês"
                body="Você define como cobra pelo espaço, e quem aluga paga só pela parte da agenda que usa."
              >
                <BillingModes />
              </FeatureCard>
            </Reveal>
            <Reveal delay={180}>
              <FeatureCard
                before="Sem dados"
                title="Métricas reais"
                body="Veja quantas pessoas visitaram o espaço e quantas clicaram no seu WhatsApp, semana a semana."
              >
                <MetricsVisual />
              </FeatureCard>
            </Reveal>
          </div>

          <Reveal>
            <div className="mt-5 flex flex-col gap-4 rounded-panel bg-ink-50 p-6 ring-1 ring-ink-200 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mint-100 text-mint-700">
                <CheckIcon className="size-5" />
              </span>
              <div>
                <p className="text-h3 font-bold text-ink-900">Anúncio que não sai do ar sem você saber.</p>
                <p className="mt-1 text-ink-700">
                  O anúncio fica 30 dias no ar. Antes de vencer, você recebe um aviso e renova grátis com um clique. Se não renovar, ele sai da
                  busca e continua salvo no seu painel.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Quando fica pronto ───────────────────────────────── */}
      <section className="border-b border-ink-200 bg-ink-50 py-16 sm:py-24">
        <div className="container-page">
          <Reveal>
            <p className="text-sm font-bold text-brand-600">Quando fica pronto</p>
            <h2 className="mt-3 max-w-[40rem] text-h1 font-bold text-balance text-ink-900">
              O 2.0 abre ao público em 9 de novembro. Quem confirma entra antes.
            </h2>
          </Reveal>

          <Reveal>
            <Timeline />
          </Reveal>
        </div>
      </section>

      {/* ── Grátis + CTA final ───────────────────────────────── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container-page">
          <Reveal>
            <div className="relative isolate overflow-hidden rounded-panel bg-brand-900 px-6 py-12 text-white sm:px-12 sm:py-16">
              <div aria-hidden className="iv-glow absolute -right-20 -bottom-24 -z-10 size-80 rounded-full bg-mint-400/20 blur-3xl" />
              <p className="text-sm font-bold text-mint-400">Continua grátis</p>
              <h2 className="mt-3 max-w-[36rem] text-h1 font-bold text-balance">
                Anunciar e receber contatos continua grátis. Os recursos extras também, até março de 2027.
              </h2>
              <div className="mt-8">{cta}</div>
              <p className="mt-4 text-sm text-brand-200">
                {confirmed ? "Aviso por e-mail quando o seu acesso estiver no ar." : "Ao confirmar, preparo o seu acesso antes de abrirmos ao público."}
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-10 max-w-[36rem]">
              <p className="text-ink-800">
                Um abraço,
                <br />
                <strong className="font-semibold text-ink-900">Felipe</strong>
                <br />
                <span className="text-ink-500">Subleasy</span>
              </p>
              <p className="mt-5 text-ink-700">
                P.S. Qual foi o maior problema do site antigo para você? Responda o e-mail com uma linha, eu mesmo leio.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

/** Dias inteiros até o lançamento, no fuso de Brasília. Zero ou menos depois do dia 9. */
function daysUntilLaunch() {
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
  return Math.round((Date.parse(LAUNCH_DATE) - Date.parse(today)) / 86_400_000);
}

function ConfirmForm({ token }: { token: string }) {
  return (
    <form action={confirmInterest.bind(null, token)}>
      <button type="submit" className={`${buttonClasses("inverse", "lg")} w-full sm:w-auto`}>
        Confirmar que quero participar
      </button>
      <p className="mt-3 text-sm text-brand-100">Sem custo e sem compromisso. Um toque e o seu acesso entra na fila de preparo.</p>
    </form>
  );
}

function ConfirmedBadge() {
  return (
    <div className="inline-flex items-center gap-3 rounded-control bg-white/12 px-4 py-3 ring-1 ring-white/25">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-mint-400 text-brand-900">
        <CheckIcon className="size-4" />
      </span>
      <p className="text-sm font-semibold text-white">Seu interesse está registrado. Aviso por e-mail quando o acesso estiver no ar.</p>
    </div>
  );
}

/** Folha de calendário com o dia 9 e uma fileira de pontos, um por dia que falta. */
function LaunchCard({ daysLeft }: { daysLeft: number }) {
  const open = daysLeft <= 0;
  const dots = Math.min(Math.max(daysLeft, 1), 14);

  return (
    <figure
      className="iv-float mx-auto w-full max-w-[22rem] overflow-hidden rounded-panel bg-white text-ink-900 shadow-brand ring-1 ring-ink-900/8 lg:mr-0"
      style={{ "--iv-tilt": "2deg" } as CSSProperties}
    >
      <figcaption className="sr-only">
        {open ? "O Subleasy 2.0 já está aberto ao público." : `Faltam ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"} para o Subleasy 2.0 abrir ao público, em 9 de novembro.`}
      </figcaption>
      <div aria-hidden>
        <div className="flex items-center justify-between bg-brand-800 px-5 py-3 text-xs font-bold tracking-wide text-brand-100 uppercase">
          <span>Novembro 2026</span>
          <span>Abertura</span>
        </div>
        <div className="px-5 pt-6 pb-5 text-center">
          <p className="text-[6.5rem] leading-none font-bold tracking-tighter text-brand-600 tabular-nums">9</p>
          <p className="mt-1 text-sm font-semibold text-ink-600">segunda-feira</p>
        </div>
        <div className="border-t border-ink-200 bg-ink-50 px-5 py-4">
          <p className="text-sm font-bold text-ink-900">{open ? "Já está no ar" : daysLeft === 1 ? "Falta 1 dia" : `Faltam ${daysLeft} dias`}</p>
          <div className="mt-3 flex items-center gap-1.5">
            {Array.from({ length: dots }, (_, i) => (
              <span
                key={i}
                className={`iv-dot size-2.5 rounded-full ${i === dots - 1 ? "bg-mint-400 ring-4 ring-mint-100" : "bg-brand-300"}`}
                style={{ "--i": i } as CSSProperties}
              />
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}

function FeatureCard({ before, title, body, children }: { before: string; title: string; body: string; children: ReactNode }) {
  return (
    <article className="flex h-full flex-col rounded-panel bg-ink-50 p-5 ring-1 ring-ink-200 sm:p-6">
      <div className="min-h-[13.5rem]">{children}</div>
      <p className="mt-6 text-xs font-bold text-ink-500 line-through decoration-ink-300">{before}</p>
      <h3 className="mt-1 text-h3 font-bold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-700">{body}</p>
    </article>
  );
}

const ANSWERS = ["Para quem", "O que tem", "O prédio", "As regras", "O preço"];

/** Cinco respostas entram e acendem; depois a IA “escreve” o título do anúncio. */
function AiWritesVisual() {
  return (
    <div className="rounded-card bg-white p-4 shadow-card ring-1 ring-ink-900/8" aria-hidden>
      <div className="flex flex-wrap gap-1.5">
        {ANSWERS.map((label, i) => (
          <span
            key={label}
            className="iv-rise inline-flex items-center gap-1 rounded-full bg-mint-50 px-2.5 py-1 text-xs font-bold text-mint-700 ring-1 ring-mint-100"
            style={{ "--i": i } as CSSProperties}
          >
            <CheckIcon className="size-3" />
            {label}
          </span>
        ))}
      </div>
      <div className="mt-4 rounded-control bg-brand-50 p-3 ring-1 ring-brand-100">
        <AiBadge label="Sugestão da IA" />
        <p className="iv-type mt-2 text-sm font-bold text-ink-900">Sala de psicologia mobiliada na Zona 7</p>
        <div className="mt-2 space-y-1.5">
          <span className="block h-1.5 w-full rounded-full bg-brand-200" />
          <span className="block h-1.5 w-4/5 rounded-full bg-brand-200" />
        </div>
      </div>
      <p className="mt-3 text-right text-xs font-semibold text-ink-500">Cerca de 3 minutos</p>
    </div>
  );
}

const WEEK = [38, 52, 44, 70, 62, 88, 76];

/** Sete dias de visitas em barras, com os números de exemplo ao lado. */
function MetricsVisual() {
  return (
    <div className="rounded-card bg-white p-4 shadow-card ring-1 ring-ink-900/8" aria-hidden>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-ink-900">Últimos 7 dias</p>
        <span className="text-xs text-ink-500">Exemplo</span>
      </div>
      <div className="mt-4 flex h-24 items-end gap-2">
        {WEEK.map((height, i) => (
          <span
            key={i}
            className={`iv-bar flex-1 rounded-t-[5px] ${i === WEEK.length - 2 ? "bg-brand-600" : "bg-brand-200"}`}
            style={{ height: `${height}%`, "--i": i } as CSSProperties}
          />
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-ink-200 pt-3">
        <div>
          <dd className="text-h3 font-bold text-ink-900 tabular-nums">126</dd>
          <dt className="text-xs text-ink-500">visitas ao espaço</dt>
        </div>
        <div>
          <dd className="text-h3 font-bold text-ink-900 tabular-nums">18</dd>
          <dt className="text-xs text-ink-500">cliques no WhatsApp</dt>
        </div>
      </dl>
    </div>
  );
}

const STEPS = [
  { when: "Agora", title: "Você confirma", body: "Um toque no botão e eu sei que posso preparar o seu acesso." },
  { when: "Até 9 de novembro", title: "Preparo o seu acesso", body: "Se você já tinha começado um anúncio, os dados já estão guardados. Aviso por e-mail quando estiver pronto." },
  { when: "9 de novembro", title: "Abre ao público", body: "O Subleasy 2.0 entra no ar para todo mundo, com a busca e os anúncios novos." },
  { when: "Até março de 2027", title: "Recursos extras grátis", body: "Anunciar e receber contatos segue grátis, e os recursos extras também." },
] as const;

function Timeline() {
  return (
    <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
      <span aria-hidden className="iv-track absolute top-1 bottom-1 left-[0.6875rem] w-0.5 bg-brand-300 md:top-[0.6875rem] md:right-0 md:bottom-auto md:left-0 md:h-0.5 md:w-auto" />
      {STEPS.map((step, i) => (
        <li key={step.when} className="relative pl-10 md:pt-10 md:pl-0">
          <span
            aria-hidden
            className={`iv-rise absolute top-0 left-0 grid size-6 place-items-center rounded-full ring-4 ring-ink-50 ${
              i === 2 ? "bg-mint-400 text-brand-900" : "bg-brand-600 text-white"
            }`}
            style={{ "--i": i * 3 } as CSSProperties}
          >
            <span className="size-2 rounded-full bg-current" />
          </span>
          <p className={`text-sm font-bold ${i === 2 ? "text-mint-700" : "text-brand-600"}`}>{step.when}</p>
          <h3 className="mt-1 text-h3 font-bold text-ink-900">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
