import { BANDS, WEEKDAYS, contactsOf, priceGap, rateOf, smoothPath, type Market, type Pattern, type Totals } from "@/lib/dashboard-metrics";
import { BILLING_UNIT, formatPrice, type BillingType } from "@/lib/listing-options";

const shortDate = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
const plural = (count: number, one: string, many: string) => `${count.toLocaleString("pt-BR")} ${count === 1 ? one : many}`;
const percent = (value: number) => `${(value * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

const CARD = "rounded-panel bg-white p-5 shadow-card ring-1 ring-ink-900/6 sm:p-6";

// ── Pulso: visitas por dia, com os dias em que alguém chamou ─────────────

const W = 640;
const H = 220;
const TOP = 24;
const BOTTOM = 10;

export function PulseChart({ days, views, contacts }: { days: string[]; views: number[]; contacts: number[] }) {
  const total = views.reduce((sum, value) => sum + value, 0);
  const totalContacts = contacts.reduce((sum, value) => sum + value, 0);
  const max = Math.max(...views, 1) * 1.1;
  const step = W / Math.max(days.length - 1, 1);
  const points = views.map((value, index): [number, number] => [index * step, H - BOTTOM - (value / max) * (H - TOP - BOTTOM)]);
  const line = smoothPath(points);
  const area = `${line} L${W},${H} L0,${H} Z`;
  const ticks = [0, Math.round((days.length - 1) / 4), Math.round((days.length - 1) / 2), Math.round(((days.length - 1) * 3) / 4), days.length - 1];
  const peak = views.indexOf(Math.max(...views));

  return (
    <figure className="relative overflow-hidden rounded-panel bg-[linear-gradient(160deg,var(--color-brand-800),var(--color-brand-900)_65%)] p-5 text-white shadow-card sm:p-6">
      <figcaption className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-200">Visitas e contatos por dia</p>
          <p className="mt-1 text-[3rem] leading-none font-bold tracking-[-0.04em] tabular-nums sm:text-[3.75rem]">{total.toLocaleString("pt-BR")}</p>
        </div>
        <div className="flex gap-5 text-sm text-brand-200">
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-brand-400" aria-hidden />
            Visitas
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-mint-400" aria-hidden />
            Dia com contato
          </span>
        </div>
      </figcaption>

      <p className="sr-only">
        {total === 0
          ? "Nenhuma visita no período."
          : `${plural(total, "visita", "visitas")} e ${plural(totalContacts, "contato", "contatos")} no período. Pico de ${plural(views[peak], "visita", "visitas")} em ${shortDate(days[peak])}.`}
      </p>

      <div className="relative mt-5" aria-hidden>
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible">
          <defs>
            <linearGradient id="pulso-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--color-brand-400)" stopOpacity="0.55" />
              <stop offset="1" stopColor="var(--color-brand-400)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((fraction) => (
            <line key={fraction} x1="0" x2={W} y1={H * fraction - 0.5} y2={H * fraction - 0.5} stroke="white" strokeOpacity="0.07" />
          ))}
          <path d={area} fill="url(#pulso-area)" />
          <path d={line} fill="none" stroke="var(--color-brand-300)" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {contacts.map((count, index) =>
            count > 0 ? (
              <g key={days[index]}>
                <circle cx={points[index][0]} cy={points[index][1]} r={7 + Math.min(count, 4) * 2} fill="var(--color-mint-400)" fillOpacity="0.18" />
                <circle cx={points[index][0]} cy={points[index][1]} r={3.5 + Math.min(count, 4)} fill="var(--color-mint-400)" stroke="var(--color-brand-900)" strokeWidth="2.5" />
              </g>
            ) : null,
          )}
          {days.map((day, index) => (
            <rect key={day} x={index * step - step / 2} y="0" width={step} height={H} fill="transparent">
              <title>{`${shortDate(day)}: ${plural(views[index], "visita", "visitas")}${contacts[index] ? `, ${plural(contacts[index], "contato", "contatos")}` : ""}`}</title>
            </rect>
          ))}
        </svg>
        {total === 0 && (
          <p className="absolute inset-0 grid place-items-center text-center text-sm text-brand-200">Ainda sem visitas neste período.</p>
        )}
        <div className="mt-2 flex justify-between text-[11px] text-white/45 tabular-nums">
          {ticks.map((index, position) => (
            <span key={position}>{position === ticks.length - 1 ? "hoje" : shortDate(days[index])}</span>
          ))}
        </div>
      </div>
    </figure>
  );
}

// ── Conversão ────────────────────────────────────────────

export function ConversionCard({ totals }: { totals: Totals }) {
  const contacts = contactsOf(totals);
  const rate = rateOf(totals);
  const circumference = 2 * Math.PI * 52;
  const steps = [
    { label: "Abriram o anúncio", value: totals.views, className: "bg-brand-600" },
    { label: "Salvaram nos favoritos", value: totals.favorites, className: "bg-brand-300" },
    { label: "Chamaram", value: contacts, className: "bg-mint-500" },
  ];
  const base = Math.max(totals.views, totals.favorites, contacts, 1);

  return (
    <section aria-labelledby="conversao-titulo" className={`${CARD} flex flex-col`}>
      <h2 id="conversao-titulo" className="font-bold text-ink-900">
        Conversão
      </h2>
      <p className="text-sm text-ink-600">Visitas que viraram contato</p>

      <div className="relative mx-auto mt-4 size-36">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r="52" fill="none" strokeWidth="11" className="stroke-ink-100" />
          {contacts > 0 && (
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              strokeWidth="11"
              strokeLinecap="round"
              className="stroke-mint-500"
              strokeDasharray={`${Math.max(Math.min(rate, 1) * circumference, 4)} ${circumference}`}
            />
          )}
        </svg>
        <p className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[2rem] leading-none font-bold tracking-[-0.03em] text-ink-900 tabular-nums">{totals.views > 0 ? percent(rate) : "—"}</span>
          <span className="mt-1 text-xs text-ink-500 tabular-nums">
            {contacts} de {totals.views.toLocaleString("pt-BR")}
          </span>
        </p>
      </div>

      <ul className="mt-5 space-y-3">
        {steps.map((step) => (
          <li key={step.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-ink-700">{step.label}</span>
              <span className="font-bold text-ink-900 tabular-nums">{step.value.toLocaleString("pt-BR")}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-ink-100">
              <div className={`h-full rounded-full ${step.className}`} style={{ width: step.value === 0 ? "0%" : `${Math.max((step.value / base) * 100, 3)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Turnos: dia da semana × faixa do dia ─────────────────────

export function TurnosCard({ pattern }: { pattern: Pattern }) {
  const enough = pattern.total >= 3;
  const max = Math.max(...pattern.grid.flat(), 1);

  return (
    <section aria-labelledby="turnos-titulo" className={CARD}>
      <h2 id="turnos-titulo" className="font-bold text-ink-900">
        Quando te procuram
      </h2>
      <p className="text-sm text-ink-600">
        {enough
          ? `Mais contatos ${WEEKDAYS[pattern.peakWeekday].phrase}, ${BANDS[pattern.peakBand].phrase}. Últimos 90 dias.`
          : "Com mais alguns contatos, os dias e turnos de pico aparecem aqui."}
      </p>

      <table className="mt-5 w-full table-fixed border-separate border-spacing-1.5">
        <caption className="sr-only">Contatos por faixa do dia e dia da semana, últimos 90 dias</caption>
        <thead>
          <tr>
            <th scope="col" className="w-20 sm:w-24">
              <span className="sr-only">Faixa do dia</span>
            </th>
            {WEEKDAYS.map((day) => (
              <th key={day.label} scope="col" className="text-xs font-normal text-ink-500">
                <span aria-hidden>{day.short}</span>
                <span className="sr-only">{day.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {BANDS.map((band, row) => (
            <tr key={band.key}>
              <th scope="row" className="pr-1 text-left text-xs font-normal text-ink-600">
                {band.label}
              </th>
              {pattern.grid[row].map((value, column) => {
                const peak = enough && row === pattern.peakBand && column === pattern.peakWeekday;
                return (
                  <td key={column} className="p-0">
                    <span
                      title={`${WEEKDAYS[column].label}, ${band.label.toLowerCase()}: ${plural(value, "contato", "contatos")}`}
                      className={`block h-8 rounded-[8px] sm:h-9 ${value === 0 ? "bg-ink-100" : ""} ${peak ? "ring-2 ring-mint-700 ring-offset-2" : ""}`}
                      style={value > 0 ? { backgroundColor: `color-mix(in oklab, var(--color-mint-500) ${Math.round(20 + (value / max) * 80)}%, white)` } : undefined}
                    >
                      <span className="sr-only">{plural(value, "contato", "contatos")}</span>
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ── Preço: cada ponto é uma sala parecida; o maior é a sua ─────────

export function PriceCard({ title, city, price, billing, market }: { title: string; city: string; price: number; billing: string; market: Market | null }) {
  const unit = BILLING_UNIT[billing as BillingType] ?? billing;
  const gap = priceGap(price, market);

  return (
    <section aria-labelledby="preco-titulo" className={`${CARD} flex flex-col`}>
      <h2 id="preco-titulo" className="font-bold text-ink-900">
        Preço no mercado
      </h2>
      <p className="truncate text-sm text-ink-600">
        {title} · {formatPrice(price)} por {unit}
      </p>

      {market && gap !== null ? (
        <>
          <Strip prices={market.prices} price={price} median={market.median} />
          <p className="mt-auto pt-5 text-sm text-ink-600">
            <span className="mr-1.5 text-[2rem] leading-none font-bold tracking-[-0.03em] text-ink-900 tabular-nums">
              {Math.abs(gap) < 5 ? "Na média" : `${Math.abs(gap)}%`}
            </span>
            {Math.abs(gap) >= 5 && (gap > 0 ? "acima da mediana" : "abaixo da mediana")}
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Mediana de {market.count} {market.count === 1 ? "sala" : "salas"} {market.scope === "tipo" ? "do mesmo tipo" : "de todos os tipos"} em {city}, cobradas por {unit}.
          </p>
        </>
      ) : (
        <>
          <div className="relative mt-12 h-24 border-b-2 border-dashed border-ink-200" aria-hidden>
            {GHOST.map(([left, level], index) => (
              <span key={index} className="absolute size-3 -translate-x-1/2 rounded-full bg-ink-100" style={{ left: `${left}%`, bottom: `${8 + level * 16}px` }} />
            ))}
            <span className="absolute bottom-1.5 left-1/2 size-5 -translate-x-1/2 rounded-full bg-brand-200 shadow-[0_0_0_4px_white]" />
          </div>
          <p className="mt-auto pt-5 text-sm text-ink-600">
            Ainda não há salas parecidas o bastante em {city} para comparar. Assim que houver, cada ponto aqui será uma sala e você verá onde o seu preço fica.
          </p>
        </>
      )}
    </section>
  );
}

// Posições fixas da régua de exemplo, quando ainda não há salas para comparar.
const GHOST: [number, number][] = [[12, 0], [24, 0], [33, 0], [33, 1], [45, 0], [58, 0], [58, 1], [66, 0], [78, 0], [90, 0]];

function Strip({ prices, price, median }: { prices: number[]; price: number; median: number }) {
  const low = Math.min(...prices, price) * 0.9;
  const high = Math.max(...prices, price) * 1.1;
  const at = (value: number) => ((value - low) / (high - low)) * 100;
  // Preços quase iguais empilham, como bolinhas numa régua.
  const stacks = new Map<number, number>();
  const dots = prices.map((value) => {
    const bucket = Math.round(at(value) / 3);
    const level = stacks.get(bucket) ?? 0;
    stacks.set(bucket, level + 1);
    return { left: at(value), level };
  });

  return (
    <div className="mt-12" aria-hidden>
      <div className="relative h-24 border-b-2 border-ink-200">
        {dots.map((dot, index) => (
          <span key={index} className="absolute size-3 -translate-x-1/2 rounded-full bg-ink-300" style={{ left: `${dot.left}%`, bottom: `${8 + dot.level * 16}px` }} />
        ))}
        <span className="absolute -top-4 bottom-0 w-px bg-ink-400" style={{ left: `${at(median)}%` }}>
          <span className="absolute -top-5 left-1.5 text-[11px] whitespace-nowrap text-ink-500">mediana {formatPrice(median)}</span>
        </span>
        <span
          className="absolute bottom-1.5 size-5 -translate-x-1/2 rounded-full bg-brand-600 shadow-[0_0_0_4px_white,0_6px_16px_rgb(56_24_217/0.35)]"
          style={{ left: `${at(price)}%` }}
        />
      </div>
      <div className="relative mt-2 flex justify-between text-[11px] text-ink-500 tabular-nums">
        <span>{formatPrice(Math.min(...prices))}</span>
        <span className="absolute -translate-x-1/2 font-bold text-brand-600" style={{ left: `${Math.min(Math.max(at(price), 18), 82)}%` }}>
          você
        </span>
        <span>{formatPrice(Math.max(...prices))}</span>
      </div>
    </div>
  );
}
