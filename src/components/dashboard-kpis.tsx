import { MinusIcon, TrendDownIcon, TrendUpIcon } from "@phosphor-icons/react/ssr";
import { contactsOf, percentChange, rateOf, type Period, type Totals } from "@/lib/dashboard-metrics";

type Delta = { label: string; tone: "up" | "down" | "flat" } | null;

function deltaOf(current: number, previous: number): Delta {
  if (previous === 0) return current > 0 ? { label: "novo", tone: "up" } : null;
  const change = percentChange(current, previous) ?? 0;
  if (change === 0) return { label: "igual", tone: "flat" };
  return { label: `${change > 0 ? "+" : ""}${change}%`, tone: change > 0 ? "up" : "down" };
}

function rateDelta(current: Totals, previous: Totals): Delta {
  if (previous.views === 0 || current.views === 0) return null;
  const points = Math.round((rateOf(current) - rateOf(previous)) * 1000) / 10;
  if (points === 0) return { label: "igual", tone: "flat" };
  return { label: `${points > 0 ? "+" : ""}${points.toLocaleString("pt-BR")} p.p.`, tone: points > 0 ? "up" : "down" };
}

const TONE = {
  up: { className: "bg-mint-50 text-mint-700", Icon: TrendUpIcon },
  down: { className: "bg-warning-500/15 text-warning-700", Icon: TrendDownIcon },
  flat: { className: "bg-ink-100 text-ink-600", Icon: MinusIcon },
} as const;

const STROKE = { views: "stroke-brand-500", contacts: "stroke-mint-500", rate: "stroke-ink-900", favorites: "stroke-brand-300" } as const;

/** Conversão acumulada em janela de 7 dias, para o minigráfico não pular a cada dia sem visita. */
function rollingRate(views: number[], contacts: number[]): number[] {
  return views.map((_, index) => {
    const from = Math.max(0, index - 6);
    const seen = views.slice(from, index + 1).reduce((sum, value) => sum + value, 0);
    const called = contacts.slice(from, index + 1).reduce((sum, value) => sum + value, 0);
    return seen > 0 ? called / seen : 0;
  });
}

/** Visitas, contatos, conversão e favoritos do período, com variação e minigráfico. */
export function DashboardKpis({
  period,
  current,
  previous,
  series,
  favoritesTotal,
}: {
  period: Period;
  current: Totals;
  previous: Totals;
  series: { views: number[]; contacts: number[]; favorites: number[] };
  favoritesTotal: number;
}) {
  const contacts = contactsOf(current);
  const rate = current.views > 0 ? `${(rateOf(current) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—";

  return (
    <section aria-label={`Resumo dos últimos ${period} dias, comparado aos ${period} dias anteriores`}>
      <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi label="Visitas" value={current.views.toLocaleString("pt-BR")} delta={deltaOf(current.views, previous.views)} note="Pessoas por dia nos seus anúncios" values={series.views} stroke={STROKE.views} />
        <Kpi
          label="Contatos"
          value={contacts.toLocaleString("pt-BR")}
          delta={deltaOf(contacts, contactsOf(previous))}
          note={`${current.whatsapp.toLocaleString("pt-BR")} WhatsApp · ${current.messages.toLocaleString("pt-BR")} ${current.messages === 1 ? "mensagem" : "mensagens"}`}
          values={series.contacts}
          stroke={STROKE.contacts}
        />
        <Kpi label="Conversão" value={rate} delta={rateDelta(current, previous)} note="Visitas que viraram contato" values={rollingRate(series.views, series.contacts)} stroke={STROKE.rate} />
        <Kpi
          label="Favoritos"
          value={current.favorites.toLocaleString("pt-BR")}
          delta={deltaOf(current.favorites, previous.favorites)}
          note={`${favoritesTotal.toLocaleString("pt-BR")} desde a publicação`}
          values={series.favorites}
          stroke={STROKE.favorites}
        />
      </dl>
    </section>
  );
}

function Kpi({ label, value, delta, note, values, stroke }: { label: string; value: string; delta: Delta; note: string; values: number[]; stroke: string }) {
  const tone = delta ? TONE[delta.tone] : null;
  return (
    <div className="flex flex-col rounded-panel bg-white p-4 shadow-card ring-1 ring-ink-900/6 sm:p-5">
      <dt className="text-sm font-medium text-ink-600">{label}</dt>
      <dd className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className="text-[2rem] leading-none font-bold tracking-[-0.03em] text-ink-900 tabular-nums sm:text-[2.5rem]">{value}</span>
        {delta && tone && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${tone.className}`}>
            <tone.Icon className="size-3.5" weight="bold" aria-hidden />
            {delta.label}
          </span>
        )}
      </dd>
      <dd aria-hidden>
        <Sparkline values={values} stroke={stroke} />
      </dd>
      <dd className="mt-2 text-xs text-ink-500">{note}</dd>
    </div>
  );
}

function Sparkline({ values, stroke }: { values: number[]; stroke: string }) {
  const max = Math.max(...values, 0);
  const step = values.length > 1 ? 100 / (values.length - 1) : 100;
  const points = values.map((value, index) => `${(index * step).toFixed(2)},${max > 0 ? (30 - (value / max) * 26).toFixed(2) : 30}`).join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="mt-3 h-9 w-full" aria-hidden>
      <polyline
        points={points}
        fill="none"
        vectorEffect="non-scaling-stroke"
        strokeWidth={max > 0 ? 2 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={max > 0 ? stroke : "stroke-ink-200"}
      />
    </svg>
  );
}
