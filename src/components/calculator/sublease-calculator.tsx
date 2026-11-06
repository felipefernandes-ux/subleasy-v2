"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { CaretDownIcon, MapPinIcon, TrendUpIcon } from "@phosphor-icons/react";
import posthog from "posthog-js";
import { suggestCities } from "@/app/actions/city-demand";
import { trackCalculator } from "@/lib/analytics";
import { publishExpected } from "@/lib/calculator-store";
import { normalizeCity } from "@/lib/city-text";
import { SPACE_TYPES, type SpaceType } from "@/lib/listing-options";
import type { MarketStat } from "@/lib/market-prices";
import { BILLING_UNITS, calculate, marketScope, money, pickMarket, type Billing } from "@/lib/sublease-calc";
import { useCountUp } from "../shift-earnings";
import { ArrowRightIcon, buttonClasses } from "../ui";

const FIELD =
  "h-12 w-full rounded-control border border-ink-300 bg-white px-3.5 text-base text-ink-900 shadow-xs outline-none transition-colors placeholder:text-ink-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15";
const LABEL = "block text-sm font-bold text-ink-800";

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const SHIFTS = ["Manhã", "Tarde", "Noite"];

/**
 * Calculadora de sublocação: renda mensal, quanto do custo da sala ela paga e como o preço se compara
 * aos anúncios do Subleasy. Tudo roda no navegador; nada do que a pessoa digita é enviado.
 * A semana de 21 turnos (7 dias × manhã, tarde e noite) mostra o que a sala oferece e o que se aluga.
 */
export function SubleaseCalculator({ stats }: { stats: MarketStat[] }) {
  const [spaceType, setSpaceType] = useState<SpaceType>("psicologia");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [billing, setBilling] = useState<Billing>("hora");
  const [quantity, setQuantity] = useState(BILLING_UNITS.hora.start);
  const [priceText, setPriceText] = useState("");
  const [priceTouched, setPriceTouched] = useState(false);
  const [occupancy, setOccupancy] = useState(50);
  const [costText, setCostText] = useState("");

  const market = useMemo(() => pickMarket(stats, { cityKey: normalizeCity(city), state, spaceType, billing }), [stats, city, state, spaceType, billing]);
  const unit = BILLING_UNITS[billing];
  const suggested = market ? Math.round(market.median) : Math.round((unit.price[0] + unit.price[1]) / 4 / 5) * 5;

  // Enquanto a pessoa não escolhe o preço, o campo acompanha a referência do mercado.
  const priceValue = priceTouched ? digits(priceText) : suggested;
  const cost = digits(costText);
  const result = calculate({ billing, quantity, price: priceValue, occupancy: occupancy / 100, cost });
  const shown = useCountUp(result.expected);
  // A chamada final da página repete este valor.
  useEffect(() => publishExpected(result.expected), [result.expected]);

  // Medição: o uso começa na primeira mudança; o resultado conta uma vez por sessão da página, depois de uma pausa.
  const started = useRef(false);
  const reported = useRef(false);
  const touch = () => {
    if (started.current) return;
    started.current = true;
    void trackCalculator("calculator_started", { tool: "renda" });
    posthog.capture("calculator_started", { tool: "renda" });
  };
  useEffect(() => {
    if (!started.current || reported.current || result.expected <= 0) return;
    const timer = window.setTimeout(() => {
      reported.current = true;
      const params = { tool: "renda", billing, space_type: spaceType, level: market?.level ?? "none" };
      void trackCalculator("calculator_result", params);
      posthog.capture("calculator_result", params);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [result.expected, billing, spaceType, market?.level]);

  function changeBilling(next: Billing) {
    touch();
    setBilling(next);
    setQuantity(BILLING_UNITS[next].start);
    // O preço digitado vale para uma unidade; trocar a cobrança volta à referência.
    setPriceTouched(false);
    setPriceText("");
  }

  const position = market && priceValue > 0 ? priceValue / market.median - 1 : null;
  const lowPct = Math.max(0, occupancy - 20);
  const highPct = Math.min(100, occupancy + 20);
  const listingsUrl = `/espacos?tipo=${spaceType}${city && state ? `&local=${encodeURIComponent(city)}` : ""}`;

  return (
    <div className="grid overflow-hidden rounded-panel bg-white shadow-raised ring-1 ring-ink-900/8 lg:grid-cols-[1.02fr_1fr]">
      {/* ── Entradas ─────────────────────────────────────────── */}
      <form onSubmit={(event) => event.preventDefault()} className="space-y-6 p-6 sm:p-8" aria-label="Dados da sua sala">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={LABEL}>
            Tipo de sala
            {/* Seta própria: a do navegador cola na borda direita e não aceita espaçamento. */}
            <span className="relative mt-1.5 block">
              <select
                value={spaceType}
                onChange={(event) => {
                  touch();
                  setSpaceType(event.target.value as SpaceType);
                }}
                className={`${FIELD} appearance-none pr-10`}
              >
                {Object.entries(SPACE_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <CaretDownIcon className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-500" weight="bold" aria-hidden />
            </span>
          </label>
          <CityField
            value={city}
            state={state}
            onChange={(name, uf) => {
              touch();
              setCity(name);
              setState(uf);
            }}
          />
        </div>

        <fieldset>
          <legend className={LABEL}>Como você cobra</legend>
          <div role="radiogroup" className="mt-1.5 grid grid-cols-4 gap-1.5 rounded-control bg-ink-100 p-1">
            {(Object.keys(BILLING_UNITS) as Billing[]).map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={billing === key}
                onClick={() => changeBilling(key)}
                className={`focus-ring h-10 rounded-[8px] text-sm font-bold transition-[background-color,color,box-shadow] duration-200 ${
                  billing === key ? "bg-white text-brand-700 shadow-xs" : "text-ink-600 hover:text-ink-900"
                }`}
              >
                {BILLING_UNITS[key].label.replace("Por ", "")}
              </button>
            ))}
          </div>
        </fieldset>

        {billing === "mes" ? (
          <p className="rounded-control bg-brand-50 px-4 py-3 text-sm text-brand-900 ring-1 ring-brand-100">
            Na cobrança mensal a sala inteira fica com uma pessoa pelo mês. A ocupação abaixo é a chance de ela estar alugada.
          </p>
        ) : (
          <Slider
            label={`${capitalize(unit.units)} livres por semana`}
            value={`${quantity} ${quantity === 1 ? unit.unit : unit.units}`}
            min={1}
            max={unit.max}
            step={unit.step}
            current={quantity}
            onChange={(next) => {
              touch();
              setQuantity(next);
            }}
          />
        )}

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="calc-price" className={LABEL}>
              Quanto você cobra {billing === "mes" ? "por mês" : `por ${unit.unit}`}
            </label>
            {market && priceTouched && priceValue !== suggested && (
              <button
                type="button"
                onClick={() => {
                  setPriceTouched(false);
                  setPriceText("");
                }}
                className="focus-ring rounded-sm text-xs font-bold text-brand-600 hover:text-brand-700"
              >
                Usar {money.format(suggested)}
              </button>
            )}
          </div>
          <div className="relative mt-1.5">
            <span aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-500">
              R$
            </span>
            <input
              id="calc-price"
              inputMode="numeric"
              value={priceTouched ? priceText : String(suggested)}
              onChange={(event) => {
                touch();
                setPriceTouched(true);
                setPriceText(event.target.value.replace(/\D/g, "").slice(0, 6));
              }}
              className={`${FIELD} pl-10 tabular-nums`}
            />
          </div>
          <p className="mt-1.5 text-xs text-ink-600">
            {market
              ? `Referência: ${money.format(Math.round(market.median))}, mediana de ${market.n} anúncios do Subleasy ${marketScope(market, city)}.`
              : "Ainda sem anúncios suficientes para uma referência. Começamos por um valor médio; troque pelo seu."}
          </p>
        </div>

        <Slider
          label="Ocupação esperada"
          value={`${occupancy}%`}
          min={10}
          max={90}
          step={5}
          current={occupancy}
          onChange={(next) => {
            touch();
            setOccupancy(next);
          }}
          hint="Nem todo horário livre é alugado. Teste 30%, 50% e 70% para ver a diferença."
        />

        <div>
          <label htmlFor="calc-cost" className={LABEL}>
            Custo mensal da sala <span className="font-normal text-ink-500">(opcional)</span>
          </label>
          <div className="relative mt-1.5">
            <span aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-500">
              R$
            </span>
            <input
              id="calc-cost"
              inputMode="numeric"
              placeholder="Aluguel, condomínio, luz, internet"
              value={costText}
              onChange={(event) => {
                touch();
                setCostText(event.target.value.replace(/\D/g, "").slice(0, 6));
              }}
              className={`${FIELD} pl-10 tabular-nums`}
            />
          </div>
        </div>
      </form>

      {/* ── Resultado ────────────────────────────────────────── */}
      <div className="relative flex flex-col gap-6 overflow-hidden bg-brand-900 p-6 text-white sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-brand-600/50 blur-3xl" />

        <div className="relative">
          <p className="text-sm font-bold text-brand-100">Sua sala pode render</p>
          <p className="mt-2 text-[3.25rem] leading-none font-bold tracking-[-0.03em] tabular-nums sm:text-[4.5rem]" aria-hidden>
            {money.format(shown)}
            <span className="ml-2 align-middle text-lg font-normal tracking-normal text-brand-100">por mês</span>
          </p>
          <p className="sr-only" aria-live="polite">
            {money.format(result.expected)} por mês, {money.format(result.yearly)} por ano
          </p>
          <p className="mt-3 text-sm text-brand-100">
            Entre <strong className="text-white tabular-nums">{money.format(result.low)}</strong> e{" "}
            <strong className="text-white tabular-nums">{money.format(result.high)}</strong> com ocupação de {lowPct}% a {highPct}%.{" "}
            <span className="tabular-nums">{money.format(result.yearly)}</span> por ano.
          </p>
        </div>

        <WeekGrid offered={result.offered} rented={result.rented} />

        {result.coverage !== null && (
          <div className="relative">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-bold text-brand-100">Custo da sala coberto</span>
              <span className="font-bold tabular-nums">{Math.round(result.coverage * 100)}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-mint-400 transition-[width] duration-700 ease-out"
                style={{ width: `${Math.min(100, Math.round(result.coverage * 100))}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-brand-100">
              {result.coverage >= 1
                ? `Cobre o custo todo e sobram ${money.format(Math.max(0, result.expected - cost))} por mês.`
                : result.breakEven
                  ? `Para cobrir o custo com essa ocupação, cobre pelo menos ${money.format(result.breakEven)} ${billing === "mes" ? "por mês" : `por ${unit.unit}`}.`
                  : ""}
            </p>
          </div>
        )}

        {position !== null && market && (
          <p className="relative flex items-start gap-2 rounded-control bg-white/8 px-4 py-3 text-sm text-brand-100 ring-1 ring-white/12">
            <TrendUpIcon className="mt-0.5 size-4 shrink-0 text-mint-400" weight="bold" aria-hidden />
            <span>
              {Math.abs(position) < 0.05
                ? "Seu preço está na mediana dos anúncios do Subleasy."
                : position > 0
                  ? `Seu preço está ${Math.round(position * 100)}% acima da mediana dos anúncios do Subleasy.`
                  : `Seu preço está ${Math.round(-position * 100)}% abaixo da mediana dos anúncios do Subleasy.`}{" "}
              Faixa dos anúncios: {money.format(Math.round(market.p25))} a {money.format(Math.round(market.p75))}.
            </span>
          </p>
        )}

        <div className="relative mt-auto flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href="/anunciar"
            onClick={() => {
              void trackCalculator("calculator_cta_click", { tool: "renda", billing, space_type: spaceType });
              posthog.capture("calculator_cta_click", { tool: "renda", billing });
            }}
            className={buttonClasses("inverse", "lg")}
          >
            Anunciar minha sala grátis
            <ArrowRightIcon />
          </a>
          <a href={listingsUrl} className="focus-ring inline-flex h-12 items-center justify-center rounded-control px-5 text-base font-bold text-white ring-1 ring-white/30 transition-colors hover:bg-white/10 sm:h-13">
            Ver salas parecidas
          </a>
        </div>
        <p className="relative text-xs text-brand-200">
          Estimativa com os números que você digitou e os anúncios do Subleasy. O valor real depende de quantos horários você fecha.
        </p>
      </div>
    </div>
  );
}

const digits = (text: string) => Number(text.replace(/\D/g, "")) || 0;
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * A semana da sala: 7 dias × manhã, tarde e noite. Menta é o turno alugado, roxo claro é o turno livre
 * que não foi alugado e cinza é o que a sala não oferece. As células acendem em cascata a cada mudança.
 */
function WeekGrid({ offered, rented }: { offered: number; rented: number }) {
  // Os turnos alugados se espalham entre os oferecidos, em vez de se juntarem no começo da semana.
  const rentedSet = useMemo(() => {
    const picks = new Set<number>();
    for (let i = 0; i < rented; i += 1) picks.add(Math.floor((i * offered) / Math.max(rented, 1)));
    return picks;
  }, [offered, rented]);

  return (
    <div className="relative">
      <div className="grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] items-center gap-x-1.5 gap-y-1.5" aria-hidden>
        <span />
        {DAYS.map((day) => (
          <span key={day} className="text-center text-[0.6875rem] font-bold tracking-wide text-brand-200 uppercase">
            {day}
          </span>
        ))}
        {SHIFTS.map((shift, row) => (
          <Row key={shift} label={shift} row={row} offered={offered} rentedSet={rentedSet} />
        ))}
      </div>
      <p className="sr-only">
        A semana tem 21 turnos. Sua sala oferece {offered} e aluga cerca de {rented}.
      </p>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-100" aria-hidden>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-mint-400" />
          Alugado
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-brand-400/60" />
          Livre
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-white/10" />
          Não oferecido
        </li>
      </ul>
    </div>
  );
}

function Row({ label, row, offered, rentedSet }: { label: string; row: number; offered: number; rentedSet: Set<number> }) {
  return (
    <>
      <span className="text-[0.6875rem] text-brand-200">{label}</span>
      {DAYS.map((day, col) => {
        // Ordem da oferta: dia a dia, manhã, tarde e noite.
        const index = col * 3 + row;
        const isOffered = index < offered;
        const isRented = isOffered && rentedSet.has(index);
        return (
          <span
            key={day}
            className={`aspect-[5/4] rounded-[5px] transition-[background-color,transform] duration-500 ease-out ${
              isRented ? "scale-100 bg-mint-400" : isOffered ? "scale-100 bg-brand-400/60" : "scale-90 bg-white/10"
            }`}
            style={{ transitionDelay: `${index * 14}ms` }}
          />
        );
      })}
    </>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (value: number) => void;
  hint?: string;
}) {
  const id = useId();
  const fill = max === min ? 100 : ((current - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
        <span className="text-lg font-bold text-ink-900 tabular-nums">{value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(event) => onChange(Number(event.target.value))}
        className="range-brand mt-1 w-full"
        style={{ "--fill": `${fill}%` } as CSSProperties}
      />
      {hint && <p className="text-xs text-ink-600">{hint}</p>}
    </div>
  );
}

/**
 * Cidade com sugestões do IBGE. Escolher uma sugestão traz o estado, e a referência de preço passa a ser da cidade
 * quando houver anúncios suficientes. Texto livre também vale: sem estado, a referência é a do Brasil.
 */
function CityField({ value, state, onChange }: { value: string; state: string; onChange: (city: string, uf: string) => void }) {
  const [options, setOptions] = useState<{ name: string; uf: string }[]>([]);
  const latest = useRef(0);
  const id = useId();

  function change(text: string) {
    onChange(text, "");
    const request = ++latest.current;
    if (text.trim().length < 2) {
      setOptions([]);
      return;
    }
    window.setTimeout(async () => {
      if (request !== latest.current) return;
      const found = await suggestCities(text);
      if (request !== latest.current) return;
      const exact = found.filter((option) => normalizeCity(option.name) === normalizeCity(text));
      if (exact.length === 1) {
        onChange(exact[0].name, exact[0].uf);
        setOptions([]);
      } else {
        setOptions(found);
      }
    }, 200);
  }

  return (
    <div className="relative">
      <label htmlFor={id} className={LABEL}>
        Cidade
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => change(event.target.value)}
        autoComplete="off"
        placeholder="Digite sua cidade"
        className={`${FIELD} mt-1.5`}
      />
      {state && <span className="pointer-events-none absolute right-3.5 bottom-3.5 text-sm font-bold text-ink-500">{state}</span>}
      {options.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-control border border-ink-200 bg-white shadow-raised" aria-label="Sugestões de cidade">
          {options.map((option) => (
            <li key={`${option.name}-${option.uf}`}>
              <button
                type="button"
                onClick={() => {
                  latest.current += 1;
                  onChange(option.name, option.uf);
                  setOptions([]);
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-ink-800 hover:bg-ink-100"
              >
                <MapPinIcon className="size-4 shrink-0 text-ink-500" aria-hidden />
                {option.name}, {option.uf}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
