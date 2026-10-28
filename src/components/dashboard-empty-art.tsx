/**
 * Ilustração do painel sem dados, na linguagem "Primeiro Pulso" (docs/painel/empty-state/philosophy.md):
 * o campo do pulso ainda plano, um único ponto de menta no agora, números e turnos à espera e
 * uma célula contornada onde a primeira marca deve cair. Mesma geometria da folha em render.py.
 */
export function DashboardEmptyArt({ className = "mx-auto h-auto w-60" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 152" className={className} fill="none" aria-hidden>
      <rect x="8" y="8" width="224" height="76" rx="14" className="fill-brand-900" />
      <rect x="22" y="22" width="36" height="5" rx="2.5" className="fill-white" fillOpacity=".22" />
      <path d="M22 40h196M22 53h196" className="stroke-white" strokeOpacity=".08" />
      <path d="M22 66h128" className="stroke-brand-300" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" />
      <path d="M162 66h54" className="stroke-white" strokeOpacity=".28" strokeWidth="2" strokeLinecap="round" strokeDasharray="0 6" />
      <circle cx="150" cy="66" r="9" className="fill-mint-400" fillOpacity=".18" />
      <circle cx="150" cy="66" r="4" className="fill-mint-400 stroke-brand-900" strokeWidth="2" />

      <rect x="8.5" y="92.5" width="103" height="51" rx="11.5" className="fill-white stroke-ink-200" />
      <rect x="20" y="103" width="36" height="5" rx="2.5" className="fill-ink-200" />
      <rect x="20" y="114" width="26" height="10" rx="3" className="fill-ink-100" />
      <path d="M20 134h80" className="stroke-ink-200" strokeWidth="2" strokeLinecap="round" />

      <rect x="120.5" y="92.5" width="111" height="51" rx="11.5" className="fill-white stroke-ink-200" />
      {Array.from({ length: 28 }, (_, index) => {
        const x = 132 + (index % 7) * 13;
        const y = 99.5 + Math.floor(index / 7) * 10;
        // Quarta-feira de manhã: onde o primeiro contato deve aparecer.
        return index === 10 ? (
          <rect key={index} x={x + 0.75} y={y + 0.75} width="8.5" height="5.5" rx="1.75" className="fill-white stroke-brand-600" strokeWidth="1.5" />
        ) : (
          <rect key={index} x={x} y={y} width="10" height="7" rx="2" className="fill-ink-100" />
        );
      })}
    </svg>
  );
}
