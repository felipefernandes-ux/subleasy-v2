import type { ReactNode } from "react";
import { buttonClasses } from "./ui";

/**
 * Link de ação com borda de degradê girando e brilho menta ao fundo (estilos em .glow-cta, no globals.css).
 * Feito para fundo escuro ou roxo, onde o brilho aparece. O botão por dentro é o "inverse" de sempre.
 */
export function GlowButton({ href, onClick, children, className = "" }: { href: string; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <span className={`glow-cta ${className}`}>
      <a href={href} onClick={onClick} className={`${buttonClasses("inverse", "lg")} relative`}>
        {children}
      </a>
    </span>
  );
}
