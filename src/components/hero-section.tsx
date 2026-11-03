import Image from "next/image";
import { smoothPath } from "@/lib/dashboard-metrics";
import {
  AiBadge,
  ArrowRightIcon,
  CheckIcon,
  SearchIcon,
  buttonClasses,
} from "./ui";

const TRUST = ["Grátis para anunciar", "Sem comissão", "Contato direto pelo WhatsApp"];

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden border-b border-ink-200 bg-white">
      <GridBackdrop />

      <div className="container-page grid items-center gap-10 pt-8 pb-14 sm:gap-14 sm:pt-20 sm:pb-28 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pt-24 lg:pb-28">
        <div className="max-w-[38rem]">
          {/* Compacto no celular: uma linha, texto de 12px. Cresce a partir de sm. */}
          <p className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white py-0.5 pr-2.5 pl-0.5 text-xs text-ink-700 shadow-xs sm:gap-2 sm:py-1 sm:pr-3 sm:pl-1 sm:text-sm">
            <span className="rounded-full bg-mint-400 px-1.5 py-px text-[0.6875rem] font-bold text-brand-900 sm:px-2 sm:py-0.5 sm:text-xs">
              Novo
            </span>
            Anúncio escrito com IA, revisado por você
          </p>

          <h1 className="mt-4 text-display font-bold text-balance text-ink-900 sm:mt-6">
            Sua sala vazia vira renda. Anúncio pronto em 3 minutos.
          </h1>

          <p className="mt-4 text-base leading-relaxed text-ink-600 sm:mt-6 sm:text-lg">
            Sublocação de consultórios e salas de saúde por turno. Envie fotos,
            responda 5 perguntas e a IA escreve o anúncio. Você revisa, publica
            de graça e vê quantas pessoas chamaram no WhatsApp.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
            <a href="/anunciar" className={buttonClasses("primary", "lg")}>
              Anunciar minha sala grátis
              <ArrowRightIcon />
            </a>
            <a href="#buscar" className={buttonClasses("secondary", "lg")}>
              <SearchIcon className="size-4.5 text-ink-500" />
              Procuro uma sala
            </a>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-600 sm:mt-8">
            {TRUST.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckIcon className="size-4 text-mint-700" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <ListingEditorPreview />
      </div>
    </section>
  );
}

/**
 * Prévia do anúncio com IA e do painel: mostra a origem de cada campo e, logo abaixo, os insights
 * que o painel dá depois. O cartão abre pronto (serve de imagem parada); só o que vem do painel
 * se anima, em cascata e uma vez: insights, barra de qualidade e o pulso da semana.
 */
function ListingEditorPreview() {
  return (
    <figure className="relative mx-auto w-full max-w-[34rem] lg:mr-0">
      <figcaption className="sr-only">
        Exemplo de anúncio gerado pela IA do Subleasy, com título sugerido, comodidades vistas nas
        fotos, três sugestões do painel (preço acima do mercado, poucas fotos e dia de maior procura),
        nota de qualidade e o resumo da semana: 12 pessoas viram a sala e 3 chamaram no WhatsApp.
      </figcaption>

      <div aria-hidden="true" className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand-600/[0.06]" />

      <div className="overflow-hidden rounded-panel bg-white shadow-raised ring-1 ring-ink-900/8">
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3">
          <p className="text-sm font-bold text-ink-900">Revisar anúncio</p>
          <p className="text-xs text-ink-500">Etapa 4 de 4</p>
        </div>

        <div className="grid grid-cols-[7.5rem_1fr] gap-4 p-5 sm:grid-cols-[9rem_1fr]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-ink-100">
            <Image
              src="/salas/sala-psicologia-maringa.webp"
              alt=""
              fill
              priority
              sizes="144px"
              className="object-cover"
            />
            <span className="absolute bottom-2 left-2 rounded-md bg-ink-900/75 px-1.5 py-0.5 text-[11px] text-white">
              Capa · foto 1
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2">
              <AiBadge />
              <span className="text-xs text-ink-500">Editável</span>
            </div>
            <p className="mt-2 text-[15px] leading-snug font-bold text-ink-900">
              Sala para psicologia com janela ampla na Zona 7
            </p>
            <ul className="mt-3 space-y-1.5 text-xs">
              <Source label="Poltronas e mesa de apoio" origin="Vimos na foto 3" />
              <Source label="Ar-condicionado" origin="Vimos na foto 2" />
              <Source label="R$ 60 por hora" origin="Você informou" />
            </ul>
          </div>
        </div>

        <InsightsBlock />

        <div className="flex items-center gap-4 border-t border-ink-200 bg-ink-50 px-5 py-4">
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-bold text-ink-700">Qualidade do anúncio</p>
              <p className="text-sm font-bold text-ink-900 tabular-nums">
                <Counter value={82} delay={0.7} />
                <span className="text-ink-500">/100</span>
              </p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-200">
              <div
                className="h-full w-[82%] origin-left animate-bar-fill rounded-full bg-mint-500"
                style={{ animationDelay: "0.7s" }}
              />
            </div>
          </div>
          <span className={`${buttonClasses("primary", "sm")} pointer-events-none`}>
            Publicar
          </span>
        </div>
      </div>

      <WeekPulse />
    </figure>
  );
}

function Source({ label, origin }: { label: string; origin: string }) {
  return (
    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-2">
      <span className="flex min-w-0 items-center gap-1.5 text-ink-800">
        <CheckIcon className="size-3.5 shrink-0 text-mint-700" />
        <span className="sm:truncate">{label}</span>
      </span>
      <span className="shrink-0 pl-5 text-ink-500 sm:pl-0">{origin}</span>
    </li>
  );
}

/** Um número que sobe até o valor final. O valor lido por leitores de tela fica no sr-only. */
function Counter({ value, delay = 0 }: { value: number; delay?: number }) {
  return (
    <>
      <span className="sr-only">{value}</span>
      <span
        aria-hidden="true"
        className="hero-count"
        style={{ "--hero-count": value, animationDelay: `${delay}s` } as React.CSSProperties}
      />
    </>
  );
}

// Os três insights usam os textos do painel, na ordem em que ele os mostra: o que pede cuidado,
// o que sugere e o que só informa. O ponto de cor é o mesmo do painel (aviso, sugestão, informação).
const INSIGHTS = [
  { dot: "bg-warning-500", title: "Preço 8% acima do mercado", action: "Revisar preço" },
  { dot: "bg-brand-500", title: "Só 2 fotos", action: "Adicionar fotos" },
  { dot: "bg-ink-400", title: "Mais procurado terça, à tarde", action: "Ajustar avisos" },
];

function InsightsBlock() {
  return (
    <div className="border-t border-ink-200 px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-ink-700">Insights do painel</p>
        <span
          className="inline-flex animate-fade-up items-center gap-1.5 rounded-full bg-white py-0.5 pr-2.5 pl-2 text-xs font-bold text-ink-800 shadow-xs ring-1 ring-ink-900/8"
          style={{ animationDelay: "0.5s" }}
        >
          <span aria-hidden="true" className="size-1.5 rounded-full bg-brand-600" />
          3 sugestões
        </span>
      </div>

      <ul className="mt-2.5 space-y-1.5 rounded-card bg-[linear-gradient(180deg,var(--color-brand-50),white)] p-1.5 ring-1 ring-brand-100">
        {INSIGHTS.map((insight, i) => (
          <li
            key={insight.title}
            className="flex animate-fade-up items-center gap-3 rounded-control bg-white px-3 py-2 shadow-xs ring-1 ring-ink-900/6"
            style={{ animationDelay: `${0.6 + i * 0.16}s` }}
          >
            <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${insight.dot}`} />
            <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink-900">{insight.title}</span>
            <span className="shrink-0 text-xs font-bold text-brand-600">{insight.action}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── O pulso da semana: o campo escuro do painel, em miniatura ─────────────────

const WEEK = [3, 5, 4, 7, 6, 9, 12];
const CONTACT_DAYS = [2, 4, 6];
const PW = 100;
const PH = 40;

/**
 * Cartão largo e baixo que só encosta na margem inferior do cartão principal: um satélite cobre
 * moldura, nunca conteúdo. O hero reserva o espaço abaixo (pb-28 a partir do tablet).
 */
function WeekPulse() {
  const max = Math.max(...WEEK) * 1.1;
  const step = PW / (WEEK.length - 1);
  const points = WEEK.map((value, i): [number, number] => [i * step, PH - 5 - (value / max) * (PH - 10)]);
  const line = smoothPath(points);
  const area = `${line} L${PW},${PH} L0,${PH} Z`;

  return (
    <div
      className="absolute -bottom-[6.1rem] -left-4 hidden w-[21rem] animate-fade-up overflow-hidden rounded-card bg-[linear-gradient(160deg,var(--color-brand-800),var(--color-brand-900)_65%)] p-4 text-white shadow-raised ring-1 ring-ink-900/10 sm:block lg:-left-10"
      style={{ animationDelay: "1.2s" }}
    >
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-brand-200">Esta semana</p>
          <p className="mt-1 flex items-baseline gap-2 whitespace-nowrap">
            <span className="text-3xl leading-none font-bold tracking-tight tabular-nums">
              <Counter value={12} delay={1.4} />
            </span>
            <span className="text-sm text-brand-100">pessoas viram sua sala</span>
          </p>
        </div>

        <svg viewBox={`0 0 ${PW} ${PH}`} className="block h-10 w-24 shrink-0 overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id="week-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--color-brand-400)" stopOpacity="0.5" />
              <stop offset="1" stopColor="var(--color-brand-400)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#week-area)" className="animate-fade-up" style={{ animationDelay: "2.1s" }} />
          <path
            d={line}
            pathLength={1}
            fill="none"
            stroke="var(--color-brand-300)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeDasharray="1"
            className="animate-line-draw"
            style={{ animationDelay: "1.5s" }}
          />
          {CONTACT_DAYS.map((day, i) => {
            const isLast = day === WEEK.length - 1;
            return (
              <g key={day} className="animate-pop" style={{ animationDelay: `${2.3 + i * 0.2}s`, transformBox: "fill-box", transformOrigin: "center" }}>
                {isLast && (
                  <circle
                    className="animate-halo"
                    style={{ animationDelay: "2.7s", transformBox: "fill-box", transformOrigin: "center" }}
                    cx={points[day][0]}
                    cy={points[day][1]}
                    r="4"
                    fill="var(--color-mint-400)"
                  />
                )}
                <circle cx={points[day][0]} cy={points[day][1]} r="2.6" fill="var(--color-mint-400)" stroke="var(--color-brand-900)" strokeWidth="1.5" />
              </g>
            );
          })}
        </svg>
      </div>

      <p className="mt-2.5 text-xs font-bold text-mint-400">3 chamaram no WhatsApp</p>
    </div>
  );
}

function GridBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div
        className="absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_70%_30%,black,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-ink-200) 1px, transparent 1px), linear-gradient(to bottom, var(--color-ink-200) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}
