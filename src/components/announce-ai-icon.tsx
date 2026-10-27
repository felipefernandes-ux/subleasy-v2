// O ícone de Anunciar com IA: usado na tab bar, no menu em tela cheia e no cabeçalho do celular.

/**
 * Círculo com "+", como o Anunciar do OLX, e uma estrela de quatro pontas no canto: o sinal de IA
 * (a mesma estrela do selo "Novo" e do assistente). A estrela leva um contorno da cor do fundo para
 * se separar da linha do círculo. Sobre o botão roxo, passe a estrela em menta e o contorno roxo.
 * `animateSpark` faz a estrela acender uma vez, quando o ícone aparece.
 */
export function AnnounceAiIcon({
  active,
  className = "size-6",
  sparkle = "var(--color-brand-600)",
  halo = "#fff",
  animateSpark,
}: {
  active?: boolean;
  className?: string;
  sparkle?: string;
  halo?: string;
  animateSpark?: boolean;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="11.5" cy="12.5" r="8.25" stroke="currentColor" strokeWidth={active ? 2 : 1.5} />
      <path d="M11.5 8.5v8M7.5 12.5h8" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
      <path
        d="M19.25 1.25c.32 2.3 1.9 3.88 4.2 4.2-2.3.32-3.88 1.9-4.2 4.2-.32-2.3-1.9-3.88-4.2-4.2 2.3-.32 3.88-1.9 4.2-4.2Z"
        fill={sparkle}
        stroke={halo}
        strokeWidth="1.25"
        strokeLinejoin="round"
        paintOrder="stroke"
        className={animateSpark ? "menu-spark animate-spark" : undefined}
        style={animateSpark ? { transformBox: "fill-box", transformOrigin: "center" } : undefined}
      />
    </svg>
  );
}
