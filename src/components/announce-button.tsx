import Link from "next/link";
import { AnnounceAiIcon } from "./announce-ai-icon";
import { buttonClasses } from "./ui";

/**
 * O botão Anunciar do site, um só para todo lugar. Aparece para todo mundo, logado ou não.
 * Os dois levam o ícone de IA, com a estrela em menta sobre o roxo.
 * - desktop: botão roxo no tamanho padrão.
 * - mobile: compacto (altura pelo conteúdo, 8px 12px, fonte menor). `large` (mobile) ocupa a largura toda, como no menu em tela cheia, onde a estrela
 *   acende uma vez (`animateSpark`).
 */
export function AnnounceButton({
  variant,
  large,
  animateSpark,
  onClick,
  className = "",
  children = "Anunciar grátis",
}: {
  variant: "desktop" | "mobile";
  large?: boolean;
  animateSpark?: boolean;
  onClick?: () => void;
  className?: string;
  children?: string;
}) {
  return (
    <Link
      href="/anunciar"
      onClick={onClick}
      className={`${buttonClasses("primary", large ? "lg" : "md")} ${
        large ? "w-full" : variant === "mobile" ? "h-auto gap-1.5 px-3 py-2 text-[0.8125rem] leading-tight" : "gap-2"
      } ${className}`}
    >
      <AnnounceAiIcon
        className={large ? "size-7 text-white" : "size-5"}
        sparkle="var(--color-mint-400)"
        halo="var(--color-brand-600)"
        animateSpark={animateSpark}
      />
      {children}
      <span className="sr-only"> com IA</span>
    </Link>
  );
}
