import type { ReactNode } from "react";

/**
 * Ilustrações do estado vazio, na linguagem "Turno Aberto" (docs/design-system/philosophy.md):
 * células iguais, cinza para o que está livre, roxo para o que foi decidido e um único ponto
 * de menta onde algo mudou de estado.
 */
const frame = "mx-auto h-28 w-44";

/** Fila limpa: a primeira linha já está resolvida, as de baixo esperam. */
export function QueueClearArt() {
  return (
    <svg viewBox="0 0 176 114" className={frame} fill="none" aria-hidden>
      {[0, 1, 2].map((row) => {
        const y = 14 + row * 30;
        const done = row === 0;
        return (
          <g key={row} opacity={done ? 1 : row === 1 ? 0.6 : 0.3}>
            <rect x="12" y={y} width="152" height="26" rx="8" className="fill-sa-canvas stroke-sa-line" />
            <rect x="22" y={y + 3} width="20" height="20" rx="6" className={done ? "fill-brand-600" : "fill-sa-haze"} />
            <rect x="52" y={y + 6} width="68" height="5" rx="2.5" className="fill-sa-haze" />
            <rect x="52" y={y + 15} width="42" height="5" rx="2.5" className="fill-sa-haze" />
            <rect x="134" y={y + 9} width="20" height="8" rx="4" className="fill-sa-haze" />
            {done && (
              <path
                d="m27.5 27.2 3.3 3.3 6-6.3"
                className="stroke-white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        );
      })}
      <circle cx="43" cy="16" r="4" className="fill-mint-500 stroke-sa-canvas" strokeWidth="2" />
    </svg>
  );
}

/** Linha do tempo ainda sem registros: o nó do topo espera o primeiro. */
export function QuietTimelineArt() {
  return (
    <svg viewBox="0 0 176 114" className={frame} fill="none" aria-hidden>
      <path d="M40 22v72" className="stroke-sa-line" strokeWidth="2" strokeLinecap="round" />
      {[0, 1, 2, 3].map((node) => {
        const y = 22 + node * 24;
        const first = node === 0;
        return (
          <g key={node} opacity={first ? 1 : 1 - node * 0.25}>
            <circle cx="40" cy={y} r="7" className={first ? "fill-sa-canvas stroke-brand-600" : "fill-sa-canvas stroke-sa-line-strong"} strokeWidth="2" />
            <rect x="60" y={y - 7} width={first ? 76 : 64 - node * 6} height="5" rx="2.5" className="fill-sa-haze" />
            <rect x="60" y={y + 2} width={first ? 44 : 38 - node * 4} height="5" rx="2.5" className="fill-sa-haze" />
          </g>
        );
      })}
      <circle cx="40" cy="22" r="2.5" className="fill-mint-500" />
    </svg>
  );
}

export function EmptyState({
  art,
  title,
  description,
  action,
}: {
  art: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-5 py-8 text-center">
      {art}
      <p className="mt-4 text-sa-base font-semibold text-sa-ink">{title}</p>
      <p className="mt-1 max-w-xs text-sa-sm text-sa-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
