"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import posthog from "posthog-js";
import { trackCalculator } from "@/lib/analytics";
import { publishSaving } from "@/lib/calculator-store";
import { PRESETS, SETUP_MONTHS, WEEKS_PER_MONTH, compare, type OwnCosts, type Verdict } from "@/lib/own-vs-hourly";
import { money } from "@/lib/sublease-calc";
import { useCountUp } from "../shift-earnings";
import { ArrowRightIcon, buttonClasses } from "../ui";

const FIELD =
  "h-12 w-full rounded-control border border-ink-300 bg-white pl-10 pr-3.5 text-base text-ink-900 shadow-xs outline-none transition-colors placeholder:text-ink-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15 tabular-nums";
const LABEL = "block text-sm font-bold text-ink-800";

type CostKey = keyof OwnCosts;
const COST_FIELDS: { key: CostKey; label: string; hint?: string }[] = [
  { key: "rent", label: "Aluguel da sala" },
  { key: "condo", label: "Condomínio e IPTU" },
  { key: "running", label: "Energia, água, internet e limpeza" },
  { key: "staff", label: "Secretária ou recepção", hint: "Com encargos, se houver." },
  { key: "other", label: "Outros custos mensais", hint: "Software, telefonia, contador." },
  { key: "setup", label: "Montagem da sala", hint: `Reforma e mobiliário. Entra diluída em ${SETUP_MONTHS} meses.` },
];

const digits = (text: string) => Number(text.replace(/\D/g, "")) || 0;
const asText = (value: number) => (value ? String(Math.round(value)) : "");

/**
 * Sublocação x aluguel completo: o custo fixo da sala própria contra pagar só as horas usadas. Mostra a economia
 * do mês, o ponto em que a sala própria passa a compensar e o cruzamento das duas linhas. Tudo roda no navegador.
 */
export function EconomyCalculator({ hourMedian }: { hourMedian: { median: number; n: number } | null }) {
  const start = PRESETS.thiago;
  const [costText, setCostText] = useState<Record<CostKey, string>>(() => ({
    rent: asText(start.costs.rent),
    condo: asText(start.costs.condo),
    running: asText(start.costs.running),
    staff: asText(start.costs.staff),
    other: asText(start.costs.other),
    setup: asText(start.costs.setup),
  }));
  const [priceText, setPriceText] = useState<string>(String(start.pricePerHour));
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(start.hoursPerWeek);
  const [preset, setPreset] = useState<keyof typeof PRESETS | null>("thiago");

  const costs = Object.fromEntries(COST_FIELDS.map(({ key }) => [key, digits(costText[key])])) as OwnCosts;
  const price = digits(priceText);
  const result = compare({ costs, hoursPerWeek, pricePerHour: price });
  const shown = useCountUp(Math.abs(Math.round(result.saving)));

  // A chamada final da página repete a economia.
  useEffect(() => publishSaving(Math.round(result.saving)), [result.saving]);

  // Medição: o uso começa na primeira mudança; o resultado conta uma vez por visita, depois de uma pausa.
  const started = useRef(false);
  const reported = useRef(false);
  const touch = () => {
    if (started.current) return;
    started.current = true;
    void trackCalculator("calculator_started", { tool: "economia" });
    posthog.capture("calculator_started", { tool: "economia" });
  };
  useEffect(() => {
    if (!started.current || reported.current || !result.verdict) return;
    const timer = window.setTimeout(() => {
      reported.current = true;
      const params = { tool: "economia", verdict: result.verdict ?? "none" };
      void trackCalculator("calculator_result", params);
      posthog.capture("calculator_result", params);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [result.verdict]);

  function applyPreset(key: keyof typeof PRESETS) {
    touch();
    const next = PRESETS[key];
    setPreset(key);
    setCostText({
      rent: asText(next.costs.rent),
      condo: asText(next.costs.condo),
      running: asText(next.costs.running),
      staff: asText(next.costs.staff),
      other: asText(next.costs.other),
      setup: asText(next.costs.setup),
    });
    setPriceText(String(next.pricePerHour));
    setHoursPerWeek(next.hoursPerWeek);
  }

  const perWeek = result.breakEvenHours ? result.breakEvenHours / WEEKS_PER_MONTH : null;

  return (
    <div className="grid overflow-hidden rounded-panel bg-white shadow-raised ring-1 ring-ink-900/8 lg:grid-cols-[1fr_1.05fr]">
      {/* ── Entradas ─────────────────────────────────────────── */}
      <form onSubmit={(event) => event.preventDefault()} className="space-y-6 p-6 sm:p-8" aria-label="Seus custos e suas horas">
        <div>
          <p className={LABEL}>Comece por um exemplo publicado e troque pelos seus números</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                aria-pressed={preset === key}
                className={`focus-ring min-h-10 rounded-full px-3.5 py-1.5 text-left text-sm transition-colors ${
                  preset === key ? "bg-brand-50 font-bold text-brand-800 ring-2 ring-brand-600" : "bg-white text-ink-700 ring-1 ring-ink-300 hover:ring-ink-500"
                }`}
              >
                {PRESETS[key].label}
              </button>
            ))}
          </div>
        </div>

        <Slider
          label="Horas que você atende por semana"
          value={`${hoursPerWeek} h ・ ${Math.round(hoursPerWeek * WEEKS_PER_MONTH)} h por mês`}
          min={1}
          max={40}
          current={hoursPerWeek}
          onChange={(next) => {
            touch();
            setPreset(null);
            setHoursPerWeek(next);
          }}
        />

        <fieldset className="space-y-4">
          <legend className="text-sm font-bold text-ink-800">Custos da sala própria, por mês</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {COST_FIELDS.map(({ key, label, hint }) => (
              <MoneyField
                key={key}
                label={label}
                hint={hint}
                value={costText[key]}
                onChange={(text) => {
                  touch();
                  setPreset(null);
                  setCostText((current) => ({ ...current, [key]: text }));
                }}
              />
            ))}
          </div>
        </fieldset>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="eco-price" className={LABEL}>
              Preço da hora de uma sala por hora
            </label>
            {hourMedian && price !== Math.round(hourMedian.median) && (
              <button
                type="button"
                onClick={() => {
                  touch();
                  setPreset(null);
                  setPriceText(String(Math.round(hourMedian.median)));
                }}
                className="focus-ring rounded-sm text-xs font-bold text-brand-600 hover:text-brand-700"
              >
                Usar {money.format(Math.round(hourMedian.median))}
              </button>
            )}
          </div>
          <div className="relative mt-1.5">
            <span aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-500">
              R$
            </span>
            <input
              id="eco-price"
              inputMode="numeric"
              value={priceText}
              onChange={(event) => {
                touch();
                setPreset(null);
                setPriceText(event.target.value.replace(/\D/g, "").slice(0, 5));
              }}
              className={FIELD}
            />
          </div>
          <p className="mt-1.5 text-xs text-ink-600">
            {hourMedian
              ? `Referência: ${money.format(Math.round(hourMedian.median))}, mediana de ${hourMedian.n} salas por hora anunciadas no Subleasy. Confira o que o preço inclui, como recepção e limpeza.`
              : "Pergunte ao espaço quanto custa a hora e o que está incluso, como recepção, limpeza e taxas."}
          </p>
        </div>
      </form>

      {/* ── Resultado ────────────────────────────────────────── */}
      <div className="relative flex flex-col gap-6 overflow-hidden bg-brand-900 p-6 text-white sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-brand-600/50 blur-3xl" />

        {result.verdict ? (
          <>
            <div className="relative">
              <p className="text-sm font-bold text-brand-100">
                {result.verdict === "completo" ? "Com essas horas, a sala própria sai mais barata em" : result.verdict === "empate" ? "A diferença entre os dois é de" : "Sublocar economiza"}
              </p>
              <p
                className={`mt-2 text-[3.25rem] leading-none font-bold tracking-[-0.03em] tabular-nums transition-colors duration-500 sm:text-[4.5rem] ${
                  result.verdict === "completo" ? "text-brand-200" : "text-mint-400"
                }`}
                aria-hidden
              >
                {money.format(shown)}
                <span className="ml-2 align-middle text-lg font-normal tracking-normal text-brand-100">por mês</span>
              </p>
              <p className="sr-only" aria-live="polite">
                {verdictText(result.verdict)} {money.format(Math.abs(Math.round(result.saving)))} por mês, {money.format(Math.abs(Math.round(result.yearly)))} por ano.
              </p>
              <p className="mt-3 text-sm text-brand-100">
                {verdictText(result.verdict)} <span className="tabular-nums">{money.format(Math.abs(Math.round(result.yearly)))}</span> por ano.
              </p>
            </div>

            <Bars fixed={result.fixed} hourly={result.hourly} verdict={result.verdict} />

            <CrossoverChart fixed={result.fixed} price={price} hours={result.hours} breakEven={result.breakEvenHours ?? 0} />

            <ul className="relative grid gap-3 text-sm text-brand-100 sm:grid-cols-2">
              <li className="rounded-control bg-white/8 px-4 py-3 ring-1 ring-white/12">
                <span className="block text-xs font-bold tracking-wide text-brand-200 uppercase">Ponto de virada</span>
                <strong className="mt-1 block text-white tabular-nums">
                  {Math.round(result.breakEvenHours ?? 0)} h por mês{perWeek ? ` (${Math.round(perWeek)} h por semana)` : ""}
                </strong>
                Abaixo disso, pagar por hora custa menos.
              </li>
              <li className="rounded-control bg-white/8 px-4 py-3 ring-1 ring-white/12">
                <span className="block text-xs font-bold tracking-wide text-brand-200 uppercase">Hora usada na sala própria</span>
                <strong className="mt-1 block text-white tabular-nums">
                  {result.usedHourCost ? money.format(Math.round(result.usedHourCost)) : "-"} contra {money.format(price)} por hora
                </strong>
                Custo fixo dividido pelas horas que você atende.
              </li>
            </ul>
          </>
        ) : (
          <p className="relative rounded-control bg-white/8 px-4 py-6 text-brand-100 ring-1 ring-white/12">
            Preencha os custos da sala e o preço da hora para ver a comparação.
          </p>
        )}

        <div className="relative mt-auto flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href="/espacos?cobranca=hora"
            onClick={() => {
              void trackCalculator("calculator_cta_click", { tool: "economia", verdict: result.verdict ?? "none" });
              posthog.capture("calculator_cta_click", { tool: "economia", verdict: result.verdict ?? "none" });
            }}
            className={buttonClasses("inverse", "lg")}
          >
            Ver salas por hora
            <ArrowRightIcon />
          </a>
        </div>
        <p className="relative text-xs text-brand-200">
          Estimativa com os números que você digitou. Não inclui impostos nem o que o seu espaço cobra além da hora. Perto do ponto de virada, contrato, marca e flexibilidade pesam mais que o custo.
        </p>
      </div>
    </div>
  );
}

function verdictText(verdict: Verdict) {
  return verdict === "sublocacao"
    ? "Pagar só pelas horas usadas custa menos que manter a sala própria."
    : verdict === "completo"
      ? "Com tantas horas, a sala própria passa a compensar."
      : "Os dois custam quase o mesmo, e o custo deixa de decidir sozinho.";
}

/** Duas barras lado a lado: o custo fixo da sala própria e o custo das horas usadas. Crescem a cada mudança. */
function Bars({ fixed, hourly, verdict }: { fixed: number; hourly: number; verdict: Verdict }) {
  const max = Math.max(fixed, hourly, 1);
  const rows = [
    { label: "Sala própria", value: fixed, tone: "bg-brand-300", win: verdict === "completo" },
    { label: "Por hora", value: hourly, tone: "bg-mint-400", win: verdict === "sublocacao" },
  ];
  return (
    <div className="relative space-y-3" aria-hidden>
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex items-baseline justify-between text-sm">
            <span className={`font-bold ${row.win ? "text-white" : "text-brand-100"}`}>{row.label}</span>
            <span className="font-bold tabular-nums">{money.format(Math.round(row.value))}</span>
          </div>
          <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-white/12">
            <div className={`h-full rounded-full ${row.tone} transition-[width] duration-700 ease-out`} style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const W = 520;
const H = 250;
const PAD = { l: 52, r: 16, t: 16, b: 34 };

/**
 * Custo do mês pelas horas atendidas: a linha reta é a sala própria (o mesmo custo com a agenda cheia ou vazia)
 * e a linha inclinada é pagar por hora. Onde se cruzam está o ponto de virada. Menta é a zona em que pagar por hora
 * custa menos. O marcador mostra onde você está, e se move quando as horas mudam.
 */
function CrossoverChart({ fixed, price, hours, breakEven }: { fixed: number; price: number; hours: number; breakEven: number }) {
  const maxX = Math.max(breakEven * 1.6, hours * 1.2, 40);
  const maxY = Math.max(fixed * 1.3, 1);
  const x = (hoursValue: number) => PAD.l + (hoursValue / maxX) * (W - PAD.l - PAD.r);
  const y = (cost: number) => H - PAD.b - (Math.min(cost, maxY) / maxY) * (H - PAD.t - PAD.b);
  // A linha por hora sai de baixo e para onde encosta no teto do gráfico.
  const hourlyEnd = Math.min(maxX, maxY / Math.max(price, 0.01));
  const cross = Math.min(breakEven, maxX);
  const zone = `M${x(0)} ${y(0)} L${x(cross)} ${y(cross * price)} L${x(cross)} ${y(fixed)} L${x(0)} ${y(fixed)} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((step) => Math.round((maxX * step) / 10) * 10);
  const youX = x(Math.min(hours, maxX));
  const youLine = y(hours * price);
  const id = useId();

  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-t`} className="w-full">
        <title id={`${id}-t`}>
          Custo do mês pelas horas atendidas: a sala própria custa {money.format(Math.round(fixed))} sempre, e pagar por hora custa {money.format(price)} por hora. Elas se cruzam em
          {" "}{Math.round(breakEven)} horas por mês.
        </title>
        {/* Grade e eixos */}
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={x(tick)} x2={x(tick)} y1={PAD.t} y2={H - PAD.b} stroke="white" strokeOpacity="0.08" />
            <text x={x(tick)} y={H - 12} textAnchor="middle" fontSize="11" fill="white" fillOpacity="0.6">
              {tick} h
            </text>
          </g>
        ))}
        {[0.5, 1].map((step) => (
          <g key={step}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(maxY * step)} y2={y(maxY * step)} stroke="white" strokeOpacity="0.08" />
            <text x={PAD.l - 8} y={y(maxY * step) + 4} textAnchor="end" fontSize="11" fill="white" fillOpacity="0.6">
              {money.format(Math.round((maxY * step) / 100) * 100)}
            </text>
          </g>
        ))}

        {/* Onde pagar por hora custa menos */}
        <path d={zone} fill="var(--color-mint-400)" fillOpacity="0.16" className="transition-[d] duration-500" />

        {/* Sala própria: reta */}
        <path d={`M${x(0)} ${y(fixed)} L${x(maxX)} ${y(fixed)}`} fill="none" stroke="var(--color-brand-300)" strokeWidth="3" strokeLinecap="round" pathLength={1} strokeDasharray={1} className="animate-line-draw" />
        {/* Por hora: inclinada */}
        <path d={`M${x(0)} ${y(0)} L${x(hourlyEnd)} ${y(hourlyEnd * price)}`} fill="none" stroke="var(--color-mint-400)" strokeWidth="3" strokeLinecap="round" pathLength={1} strokeDasharray={1} className="animate-line-draw" style={{ animationDelay: "0.25s" }} />

        {/* Ponto de virada */}
        {breakEven > 0 && breakEven <= maxX && (
          <g className="transition-transform duration-500" style={{ transform: `translate(${x(breakEven)}px, ${y(fixed)}px)` }}>
            <circle r="9" fill="white" fillOpacity="0.15" />
            <circle r="5" fill="white" />
          </g>
        )}

        {/* Você */}
        <g className="transition-transform duration-500 ease-out" style={{ transform: `translate(${youX}px, 0px)` }}>
          <line y1={PAD.t} y2={H - PAD.b} stroke="white" strokeOpacity="0.5" strokeDasharray="4 4" />
          <circle cy={youLine} r="5" fill="var(--color-mint-400)" stroke="white" strokeWidth="2" />
          <circle cy={y(fixed)} r="5" fill="var(--color-brand-300)" stroke="white" strokeWidth="2" />
        </g>

        <text x={PAD.l + 6} y={y(fixed) - 9} fontSize="11" fontWeight="700" fill="var(--color-brand-200)">
          Sala própria
        </text>
        <text x={x(Math.min(hourlyEnd, maxX) * 0.5) - 6} y={y(Math.min(hourlyEnd, maxX) * 0.5 * price) + 20} fontSize="11" fontWeight="700" fill="var(--color-mint-400)">
          Por hora
        </text>
      </svg>
      <figcaption className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-100">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-white" />
          Ponto de virada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-[3px] bg-mint-400/40" />
          Pagar por hora custa menos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-px border-l border-dashed border-white" />
          Você, com {Math.round(hours)} h por mês
        </span>
      </figcaption>
    </figure>
  );
}

function MoneyField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (text: string) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <div className="relative mt-1.5">
        <span aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-500">
          R$
        </span>
        <input id={id} inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="0" className={FIELD} />
      </div>
      {hint && <p className="mt-1 text-xs text-ink-600">{hint}</p>}
    </div>
  );
}

function Slider({ label, value, min, max, current, onChange }: { label: string; value: string; min: number; max: number; current: number; onChange: (value: number) => void }) {
  const id = useId();
  const fill = ((current - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
        <span className="text-base font-bold text-ink-900 tabular-nums">{value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={current}
        onChange={(event) => onChange(Number(event.target.value))}
        className="range-brand mt-1 w-full"
        style={{ "--fill": `${fill}%` } as CSSProperties}
      />
    </div>
  );
}
