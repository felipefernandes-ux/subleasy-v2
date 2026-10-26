import type { CSSProperties } from "react";

/*
 * A semana de uma sala: 7 dias × 3 turnos divididos entre quatro profissionais.
 * As células entram em cascata; por último, duas linhas (quem tem sala e quem procura)
 * se desenham e se encontram no único turno menta, o que acabou de ser alugado.
 */

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const SHIFTS = ["Manhã", "Tarde", "Noite"];

const PEOPLE = {
  psi: { label: "Psicologia", tag: "Psi", cell: "bg-brand-600 text-white" },
  nut: { label: "Nutrição", tag: "Nut", cell: "bg-brand-400 text-white" },
  fis: { label: "Fisioterapia", tag: "Fis", cell: "bg-brand-800 text-white" },
  fono: { label: "Fonoaudiologia", tag: "Fono", cell: "bg-brand-300 text-brand-900" },
} as const;
type Person = keyof typeof PEOPLE;

// [turno][dia]; null é turno livre.
const WEEK: (Person | null)[][] = [
  ["psi", "psi", "fis", "psi", "psi", "nut", null],
  ["nut", "fono", "fis", "nut", "fono", null, null],
  [null, "fis", null, "fis", null, null, null],
];
const MATCH = { day: 5, shift: 1 }; // sábado à tarde

const STEP_MS = 45;
const MATCH_DELAY = 21 * STEP_MS + 700;

export function SharedWeek() {
  const occupied = WEEK.flat().filter(Boolean).length + 1;

  return (
    <figure className="relative mx-auto w-full max-w-[38rem] lg:mr-0">
      <figcaption className="sr-only">
        Exemplo da agenda de uma sala sublocada: {occupied} de 21 turnos da semana ocupados por
        profissionais de psicologia, nutrição, fisioterapia e fonoaudiologia. O turno de sábado à
        tarde acabou de ser alugado.
      </figcaption>

      <div aria-hidden className="absolute -inset-5 -z-10 rounded-[2rem] bg-brand-600/[0.05] sm:-inset-8" />

      <div className="rounded-panel bg-white p-4 shadow-raised ring-1 ring-ink-900/8 sm:p-6" aria-hidden>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-ink-900">Sala 204 · Zona 7</p>
            <p className="text-xs text-ink-500">Agenda desta semana</p>
          </div>
          <p className="text-right text-xs text-ink-500">
            <span className="block text-2xl font-bold tracking-tight text-ink-900 tabular-nums">
              {occupied}
              <span className="text-base text-ink-400">/21</span>
            </span>
            turnos ocupados
          </p>
        </div>

        <div className="mt-5 grid grid-cols-[2.75rem_1fr] gap-x-2 sm:grid-cols-[3.5rem_1fr]">
          <span />
          <div className="grid grid-cols-7 gap-1.5 pb-2 sm:gap-2">
            {DAYS.map((day) => (
              <span key={day} className="text-center text-[11px] font-bold tracking-wide text-ink-500 uppercase sm:text-xs">
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-rows-3 gap-1.5 sm:gap-2">
            {SHIFTS.map((shift) => (
              <span key={shift} className="flex items-center text-[11px] text-ink-500 sm:text-xs">
                {shift}
              </span>
            ))}
          </div>

          <div className="relative">
            <div className="grid grid-cols-7 grid-rows-3 gap-1.5 sm:gap-2">
              {WEEK.flatMap((row, shift) =>
                row.map((who, day) => {
                  const isMatch = day === MATCH.day && shift === MATCH.shift;
                  const delay = isMatch ? MATCH_DELAY : (day * 3 + shift) * STEP_MS;
                  const base = "relative aspect-[5/4] rounded-[6px] sm:rounded-control";
                  if (isMatch) {
                    return (
                      <span key={`${day}-${shift}`} className={`${base} animate-cell-in bg-mint-400`} style={{ animationDelay: `${delay}ms` }}>
                        <span className="absolute inset-0 animate-ping-soft rounded-[inherit] bg-mint-400" style={{ animationDelay: `${delay + 400}ms` }} />
                        <span className="absolute top-1 left-1.5 hidden text-[10px] font-bold text-brand-900 sm:block">Novo</span>
                      </span>
                    );
                  }
                  if (!who) {
                    return <span key={`${day}-${shift}`} className={`${base} border border-ink-200 bg-ink-50`} />;
                  }
                  return (
                    <span
                      key={`${day}-${shift}`}
                      className={`${base} animate-cell-in ${PEOPLE[who].cell}`}
                      style={{ animationDelay: `${delay}ms` }}
                    >
                      <span className="absolute top-1 left-1.5 hidden text-[10px] font-bold sm:block">{PEOPLE[who].tag}</span>
                    </span>
                  );
                }),
              )}
            </div>

            {/* As linhas descem 25% abaixo da grade. Assim o centro do turno menta fica sempre em 78,6% × 40%. */}
            <Line d="M0 100 C 45 100, 77 86, 78.6 40" color="stroke-brand-900" from="left" delay={MATCH_DELAY - 600} />
            <Line d="M100 100 C 88 100, 80 86, 78.6 40" color="stroke-brand-400" from="right" delay={MATCH_DELAY - 500} />
          </div>
        </div>

        <div className="mt-14 flex items-center justify-between text-xs font-bold">
          <span className="text-brand-900">Quem tem sala</span>
          <span className="text-brand-500">Quem procura</span>
        </div>

        <div
          className="mt-4 flex animate-fade-up items-center gap-3 rounded-card bg-mint-50 p-3 ring-1 ring-mint-100"
          style={{ animationDelay: `${MATCH_DELAY + 500}ms` }}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mint-400 text-sm font-bold text-brand-900">F</span>
          <p className="text-sm leading-snug text-ink-800">
            <span className="font-bold">Fonoaudióloga</span> chamou no WhatsApp para alugar o sábado à tarde.
          </p>
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-600" aria-hidden>
        {Object.values(PEOPLE).map((person) => (
          <li key={person.label} className="flex items-center gap-1.5">
            <span className={`size-3 rounded-[3px] ${person.cell}`} />
            {person.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] border border-ink-300 bg-ink-50" />
          Livre
        </li>
      </ul>
    </figure>
  );
}

// Cada linha num SVG próprio, revelado por um recorte que anda da borda até o turno menta.
// O traço não escala com o SVG esticado, então fica com 2px em qualquer largura.
function Line({ d, color, from, delay }: { d: string; color: string; from: "left" | "right"; delay: number }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-x-0 top-0 h-[125%] w-full overflow-visible ${
        from === "left" ? "animate-wipe-from-left" : "animate-wipe-from-right"
      }`}
      style={{ animationDelay: `${delay}ms` } as CSSProperties}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <path d={d} className={`fill-none ${color}`} strokeWidth={2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
