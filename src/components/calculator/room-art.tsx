const COLS = 7;
const ROWS = 3;
const CELL_W = 26;
const CELL_H = 20;
const GAP = 6;
const BOARD_X = 252;
const BOARD_Y = 70;

// Quais turnos da semana estão alugados na ilustração (índice = coluna × 3 + linha). A ordem do brilho é a da agenda.
const RENTED = new Set([0, 1, 4, 6, 9, 11, 13, 16, 19]);
const OFFERED = 15;

/**
 * Sala de atendimento com a agenda da semana na parede. É a mesma grade da calculadora: as células alugadas acendem
 * em cascata, uma moeda sobe a cada ciclo e o ponteiro do relógio gira. Decorativa, descrita no <title>.
 * O movimento para sozinho para quem pede menos animação (regra global no globals.css).
 */
export function RoomArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 330" role="img" aria-labelledby="room-art-title" className={className}>
      <title id="room-art-title">Sala de atendimento com a agenda da semana na parede, turnos alugados acesos e moedas subindo</title>

      {/* Parede e piso */}
      <rect width="520" height="330" rx="24" className="fill-brand-50" />
      <path d="M0 262h520v44a24 24 0 0 1-24 24H24A24 24 0 0 1 0 306z" className="fill-brand-100" />
      <rect y="258" width="520" height="6" className="fill-brand-200" />

      {/* Janela com a luz da manhã entrando */}
      <g>
        <polygon points="40,66 126,66 188,262 64,262" className="animate-sun-breathe fill-mint-100" opacity="0.7" />
        <rect x="40" y="40" width="86" height="130" rx="8" className="fill-white stroke-brand-200" strokeWidth="2" />
        <path d="M83 40v130M40 105h86" className="stroke-brand-200" strokeWidth="2" />
        <rect x="46" y="46" width="31" height="53" rx="3" className="fill-brand-100" />
        <circle cx="62" cy="64" r="9" className="animate-sun-breathe fill-mint-400" />
      </g>

      {/* Relógio */}
      <g>
        <circle cx="170" cy="86" r="26" className="fill-white stroke-brand-300" strokeWidth="3" />
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * Math.PI) / 6;
          return (
            <line
              key={i}
              x1={170 + Math.sin(angle) * 20}
              y1={86 - Math.cos(angle) * 20}
              x2={170 + Math.sin(angle) * (i % 3 === 0 ? 15 : 17)}
              y2={86 - Math.cos(angle) * (i % 3 === 0 ? 15 : 17)}
              className="stroke-brand-400"
              strokeWidth={i % 3 === 0 ? 2 : 1}
              strokeLinecap="round"
            />
          );
        })}
        <line x1="170" y1="86" x2="170" y2="74" className="stroke-brand-900" strokeWidth="3" strokeLinecap="round" />
        <g className="animate-hand-turn" style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
          <line x1="170" y1="86" x2="170" y2="68" className="stroke-mint-500" strokeWidth="2" strokeLinecap="round" />
        </g>
        <circle cx="170" cy="86" r="3" className="fill-brand-900" />
      </g>

      {/* Agenda da semana */}
      <g>
        <rect x={BOARD_X - 14} y={BOARD_Y - 30} width={COLS * CELL_W + (COLS - 1) * GAP + 28} height={ROWS * CELL_H + (ROWS - 1) * GAP + 54} rx="14" className="fill-white stroke-brand-200" strokeWidth="2" />
        {["S", "T", "Q", "Q", "S", "S", "D"].map((day, col) => (
          <text key={col} x={BOARD_X + col * (CELL_W + GAP) + CELL_W / 2} y={BOARD_Y - 10} textAnchor="middle" fontSize="10" fontWeight="700" className="fill-brand-400">
            {day}
          </text>
        ))}
        {Array.from({ length: COLS * ROWS }, (_, index) => {
          const col = Math.floor(index / ROWS);
          const row = index % ROWS;
          const x = BOARD_X + col * (CELL_W + GAP);
          const y = BOARD_Y + row * (CELL_H + GAP);
          const offered = index < OFFERED + 6;
          if (RENTED.has(index) && offered) {
            return (
              <rect
                key={index}
                x={x}
                y={y}
                width={CELL_W}
                height={CELL_H}
                rx="5"
                className="animate-cell-glow fill-mint-400"
                style={{ animationDelay: `${index * 0.32}s` }}
              />
            );
          }
          return <rect key={index} x={x} y={y} width={CELL_W} height={CELL_H} rx="5" className={offered ? "fill-brand-200" : "fill-ink-100"} />;
        })}
        <text x={BOARD_X} y={BOARD_Y + ROWS * (CELL_H + GAP) + 20} fontSize="11" fontWeight="700" className="fill-brand-700">
          21 turnos por semana
        </text>
      </g>

      {/* Moedas subindo da agenda */}
      {[0, 1.7, 3.4].map((delay, i) => (
        <g key={delay} className="animate-coin-rise" style={{ animationDelay: `${delay}s`, opacity: 0 }}>
          <circle cx={BOARD_X + 150 + i * 28} cy={BOARD_Y - 38} r="12" className="fill-mint-400 stroke-mint-500" strokeWidth="2" />
          <text x={BOARD_X + 150 + i * 28} y={BOARD_Y - 34} textAnchor="middle" fontSize="10" fontWeight="800" className="fill-brand-900">
            R$
          </text>
        </g>
      ))}

      {/* Poltrona */}
      <g>
        <rect x="58" y="188" width="108" height="64" rx="18" className="fill-brand-600" />
        <rect x="46" y="212" width="30" height="48" rx="12" className="fill-brand-700" />
        <rect x="148" y="212" width="30" height="48" rx="12" className="fill-brand-700" />
        <rect x="70" y="226" width="84" height="34" rx="10" className="fill-brand-500" />
        <path d="M70 262v12M154 262v12" className="stroke-brand-900" strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* Mesa lateral com abajur */}
      <g>
        <rect x="204" y="226" width="62" height="6" rx="3" className="fill-brand-900" />
        <path d="M214 232v30M256 232v30" className="stroke-brand-900" strokeWidth="5" strokeLinecap="round" />
        <path d="M235 226v-30" className="stroke-brand-900" strokeWidth="3" strokeLinecap="round" />
        <path d="M216 196h38l-8-26h-22z" className="fill-mint-400" />
        <ellipse cx="235" cy="176" rx="22" ry="5" className="animate-sun-breathe fill-mint-100" opacity="0.8" />
      </g>

      {/* Planta */}
      <g>
        <path d="M432 262l-8-44h44l-8 44z" className="fill-brand-300" />
        <path d="M446 218c-26-6-34-34-30-56 22 8 34 28 30 56zM446 218c4-30 24-48 46-50-2 26-18 46-46 50zM446 218c-2-26 0-44 8-62 12 18 12 44-8 62z" className="fill-mint-500" />
      </g>

      {/* Tapete */}
      <ellipse cx="300" cy="292" rx="120" ry="10" className="fill-brand-200" opacity="0.7" />
    </svg>
  );
}
