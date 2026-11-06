/**
 * A balança da decisão: de um lado a sala inteira (a chave, o custo que não muda), do outro só as horas (o relógio
 * e as moedas). O braço oscila devagar e os pratos ficam sempre de pé, porque cada um gira ao contrário do braço
 * em torno do próprio ponto de apoio. Decorativa, descrita no <title>. O movimento para sozinho para quem pede
 * menos animação (regra global no globals.css).
 */
const PIVOT = { x: 260, y: 84 };
const LEFT = { x: 96, y: 84 };
const RIGHT = { x: 424, y: 84 };

export function ScaleArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 330" role="img" aria-labelledby="scale-art-title" className={className}>
      <title id="scale-art-title">Balança com a chave de uma sala inteira de um lado e um relógio com moedas do outro, representando o custo fixo contra pagar só as horas</title>

      {/* Parede e piso */}
      <rect width="520" height="330" rx="24" className="fill-brand-50" />
      <path d="M0 270h520v36a24 24 0 0 1-24 24H24A24 24 0 0 1 0 306z" className="fill-brand-100" />
      <rect y="266" width="520" height="6" className="fill-brand-200" />

      {/* Base e coluna */}
      <path d="M200 270h120l-14-26h-92z" className="fill-brand-700" />
      <rect x="250" y="96" width="20" height="150" rx="6" className="fill-brand-900" />
      <rect x="236" y="236" width="48" height="12" rx="6" className="fill-brand-600" />

      {/* Braço com os dois pratos */}
      <g className="animate-scale-sway" style={{ transformOrigin: `${PIVOT.x}px ${PIVOT.y}px` }}>
        <line x1={LEFT.x} y1={LEFT.y} x2={RIGHT.x} y2={RIGHT.y} className="stroke-brand-900" strokeWidth="8" strokeLinecap="round" />
        <circle cx={LEFT.x} cy={LEFT.y} r="7" className="fill-mint-400" />
        <circle cx={RIGHT.x} cy={RIGHT.y} r="7" className="fill-mint-400" />

        {/* Prato da esquerda: sala inteira */}
        <g className="animate-scale-sway-back" style={{ transformOrigin: `${LEFT.x}px ${LEFT.y}px` }}>
          <path d={`M${LEFT.x} ${LEFT.y}L${LEFT.x - 54} 176M${LEFT.x} ${LEFT.y}L${LEFT.x + 54} 176`} className="stroke-brand-300" strokeWidth="2.5" />
          <path d={`M${LEFT.x - 70} 176h140a70 26 0 0 1-140 0z`} className="fill-brand-600" />
          {/* Chave */}
          <g transform={`translate(${LEFT.x - 34} 118)`}>
            <circle cx="14" cy="26" r="14" className="fill-none stroke-mint-400" strokeWidth="6" />
            <path d="M28 26h42M56 26v14M68 26v10" className="stroke-mint-400" strokeWidth="6" strokeLinecap="round" fill="none" />
          </g>
          <text x={LEFT.x} y="228" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-brand-700">
            Sala inteira
          </text>
        </g>

        {/* Prato da direita: só as horas */}
        <g className="animate-scale-sway-back" style={{ transformOrigin: `${RIGHT.x}px ${RIGHT.y}px` }}>
          <path d={`M${RIGHT.x} ${RIGHT.y}L${RIGHT.x - 54} 176M${RIGHT.x} ${RIGHT.y}L${RIGHT.x + 54} 176`} className="stroke-brand-300" strokeWidth="2.5" />
          <path d={`M${RIGHT.x - 70} 176h140a70 26 0 0 1-140 0z`} className="fill-brand-600" />
          {/* Relógio */}
          <g transform={`translate(${RIGHT.x - 52} 114)`}>
            <circle cx="24" cy="30" r="24" className="fill-white stroke-brand-200" strokeWidth="3" />
            <path d="M24 30V16M24 30l10 6" className="stroke-brand-900" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <circle cx="24" cy="30" r="2.5" className="fill-brand-900" />
          </g>
          {/* Moedas */}
          <g>
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <ellipse cx={RIGHT.x + 22} cy={162 - i * 9} rx="22" ry="8" className="fill-mint-400 stroke-mint-500" strokeWidth="2" />
              </g>
            ))}
          </g>
          <text x={RIGHT.x} y="228" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-brand-700">
            Só as horas
          </text>
        </g>
      </g>

      {/* Pivô */}
      <circle cx={PIVOT.x} cy={PIVOT.y} r="12" className="fill-brand-900" />
      <circle cx={PIVOT.x} cy={PIVOT.y} r="5" className="fill-mint-400" />
    </svg>
  );
}
