"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowCounterClockwiseIcon, ArrowRightIcon, ChatCircleTextIcon, InfoIcon, LightbulbIcon, SparkleIcon, TrendUpIcon, UserCircleIcon, WarningIcon, XIcon } from "@phosphor-icons/react";
import { dismissInsight, restoreInsight } from "@/app/actions/insights";
import type { Insight } from "@/lib/dashboard-insights";
import { photoUrl } from "@/lib/listing-options";
import { buttonClasses } from "./ui";

const DOT: Record<Insight["kind"], string> = {
  alert: "bg-warning-500",
  tip: "bg-brand-500",
  success: "bg-mint-500",
  info: "bg-ink-400",
};

const KIND_LABEL: Record<Insight["kind"], string> = {
  alert: "Atenção",
  tip: "Sugestão",
  success: "Boa notícia",
  info: "Para saber",
};

/** Insights em uma lista só. Cada um tem uma ação e pode ser dispensado por 30 dias. */
export function DashboardInsights({ insights }: { insights: Insight[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const active = insights.length - dismissed.size;

  function setHidden(key: string, hide: boolean) {
    setDismissed((current) => {
      const next = new Set(current);
      if (hide) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function toggle(key: string, hide: boolean) {
    setHidden(key, hide);
    startTransition(async () => {
      const ok = await (hide ? dismissInsight(key) : restoreInsight(key));
      // Se o servidor recusar, o insight volta ao estado anterior.
      if (!ok) setHidden(key, !hide);
    });
  }

  return (
    <section
      aria-labelledby="insights-titulo"
      className="relative overflow-hidden rounded-panel bg-[linear-gradient(180deg,var(--color-brand-50),white_55%)] p-4 ring-1 ring-brand-100 sm:p-6"
    >
      {/* Brilho suave no canto, só decoração. */}
      <span aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-control bg-brand-600 text-white shadow-[0_8px_20px_-6px_rgb(56_24_217/0.6)]">
            <SparkleIcon className="size-6" weight="fill" aria-hidden />
          </span>
          <div className="max-w-2xl">
            <h2 id="insights-titulo" className="text-h3 font-bold text-ink-900">
              Insights
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-600">
              Cruzamos as visitas, os contatos e o preço dos seus anúncios com salas parecidas da região para mostrar o que mudar primeiro. Cada sugestão leva direto ao
              ajuste, para você receber mais contatos sem adivinhar.
            </p>
          </div>
        </div>
        <p
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-white px-3 py-1.5 text-sm font-bold text-ink-800 shadow-card ring-1 ring-ink-900/6 max-sm:ml-16"
          aria-live="polite"
        >
          <span className={`size-2 rounded-full ${active === 0 ? "bg-mint-500" : "bg-brand-600"}`} aria-hidden />
          {active === 0 ? "Tudo em dia" : `${active} ${active === 1 ? "sugestão" : "sugestões"}`}
        </p>
      </div>

      {insights.length === 0 ? (
        <p className="relative mt-6 rounded-card border border-dashed border-ink-300 bg-white p-6 text-center text-sm text-ink-600">
          Nenhuma sugestão agora. Novos insights aparecem conforme seus anúncios recebem visitas e contatos.
        </p>
      ) : (
        <ul className="relative mt-6 space-y-3">
          {insights.map((insight) =>
            dismissed.has(insight.key) ? (
              <li key={insight.key} className="flex items-center justify-between gap-3 rounded-card bg-ink-100/70 px-4 py-2.5 text-sm text-ink-600">
                <span className="truncate">
                  Dispensado: <span className="font-bold text-ink-800">{insight.title}</span>
                </span>
                <button
                  type="button"
                  onClick={() => toggle(insight.key, false)}
                  className="focus-ring inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-control px-2 font-bold text-brand-600 hover:text-brand-700"
                >
                  <ArrowCounterClockwiseIcon className="size-4" aria-hidden />
                  Desfazer
                </button>
              </li>
            ) : (
              <InsightCard key={insight.key} insight={insight} onDismiss={() => toggle(insight.key, true)} />
            ),
          )}
        </ul>
      )}
    </section>
  );
}

function InsightCard({ insight, onDismiss }: { insight: Insight; onDismiss: () => void }) {
  return (
    <li className="group flex flex-col gap-4 rounded-card bg-white p-4 shadow-card ring-1 ring-ink-900/6 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-raised motion-reduce:transform-none sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <div className="flex min-w-0 flex-1 gap-4">
        <Visual insight={insight} />
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-2 text-xs font-bold tracking-wide text-ink-500 uppercase">
            <span className={`size-2 shrink-0 rounded-full ${DOT[insight.kind]}`} aria-hidden />
            <span className="sr-only">{KIND_LABEL[insight.kind]}: </span>
            <span className="truncate">{insight.scope}</span>
          </p>
          <p className="mt-1 font-bold text-ink-900">{insight.title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-ink-600">{insight.body}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 max-sm:pl-[4.5rem]">
        <Link href={insight.action.href} className={`${buttonClasses("primary", "sm")} group/action`}>
          {insight.action.label}
          <ArrowRightIcon className="size-4 transition-transform group-hover/action:translate-x-0.5 motion-reduce:transition-none" weight="bold" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Dispensar: ${insight.title}, ${insight.scope}`}
          title="Dispensar por 30 dias"
          className="focus-ring grid size-10 place-items-center rounded-control text-ink-500 ring-1 ring-ink-200 transition-colors hover:bg-ink-100 hover:text-ink-900"
        >
          <XIcon className="size-4" weight="bold" aria-hidden />
        </button>
      </div>
    </li>
  );
}

const ICON_TILE: Record<string, { Icon: typeof LightbulbIcon; className: string }> = {
  "Seu perfil": { Icon: UserCircleIcon, className: "bg-mint-50 text-mint-700" },
  "Seus contatos": { Icon: ChatCircleTextIcon, className: "bg-brand-50 text-brand-600" },
};

const BADGE: Record<Insight["kind"], { Icon: typeof LightbulbIcon; className: string }> = {
  alert: { Icon: WarningIcon, className: "bg-warning-500 text-white" },
  tip: { Icon: LightbulbIcon, className: "bg-brand-600 text-white" },
  success: { Icon: TrendUpIcon, className: "bg-mint-500 text-ink-900" },
  info: { Icon: InfoIcon, className: "bg-ink-700 text-white" },
};

function Visual({ insight }: { insight: Insight }) {
  const badge = BADGE[insight.kind];
  return (
    <span className="relative block size-14 shrink-0">
      <Tile insight={insight} />
      <span className={`absolute -right-1.5 -bottom-1.5 grid size-6 place-items-center rounded-full ring-2 ring-white ${badge.className}`} aria-hidden>
        <badge.Icon className="size-3.5" weight="fill" />
      </span>
    </span>
  );
}

function Tile({ insight }: { insight: Insight }) {
  if (insight.listing) {
    return (
      <span className="grid size-14 place-items-center overflow-hidden rounded-control bg-brand-50">
        {insight.listing.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- miniatura simples, já comprimida no upload
          <img src={photoUrl(insight.listing.photo)} alt="" className="size-full object-cover" />
        ) : (
          <LightbulbIcon className="size-6 text-brand-600" aria-hidden />
        )}
      </span>
    );
  }
  const tile = ICON_TILE[insight.scope] ?? { Icon: LightbulbIcon, className: "bg-ink-100 text-ink-600" };
  return (
    <span className={`grid size-14 place-items-center rounded-control ${tile.className}`}>
      <tile.Icon className="size-7" weight="duotone" aria-hidden />
    </span>
  );
}
