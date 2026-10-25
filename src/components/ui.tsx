import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "whatsapp" | "inverse";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_BASE =
  "focus-ring inline-flex shrink-0 items-center justify-center gap-2 rounded-control font-bold whitespace-nowrap transition-colors";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white shadow-xs hover:bg-brand-500",
  secondary:
    "border border-ink-300 bg-white text-ink-800 shadow-xs hover:border-ink-400 hover:bg-ink-50",
  ghost: "text-ink-700 hover:bg-ink-100 hover:text-ink-900",
  whatsapp: "bg-whatsapp text-ink-900 shadow-xs hover:bg-whatsapp-hover",
  inverse: "bg-white text-brand-700 shadow-xs hover:bg-brand-50",
};

// Alvo mínimo de 44px em md e lg. sm só em prévias decorativas, sem clique.
const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base sm:h-13 sm:px-6",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
) {
  return `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]}`;
}

export function Logo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG oficial, sem ganho com next/image
    <img src="/logo-subleasy.svg" alt="Subleasy" width={1060} height={285} className={className} />
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm font-bold text-brand-600">{children}</p>
  );
}

/** Padrão único para tudo que a IA gera: ícone, fundo suave e rótulo "Sugestão". */
export function AiBadge({ label = "Sugestão" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
      <SparkleIcon className="size-3.5" />
      {label}
    </span>
  );
}

/** Versão compacta para campos de formulário: só o ícone, com a explicação num tooltip (hover e foco). */
export function AiHint({ tip }: { tip: string }) {
  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        role="img"
        aria-label={tip}
        className="focus-ring grid size-6 place-items-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-100"
      >
        <SparkleIcon className="size-3.5" />
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-56 -translate-x-1/2 translate-y-1 rounded-control bg-ink-900 px-2.5 py-1.5 text-xs font-normal text-white opacity-0 shadow-raised transition duration-150 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
      >
        {tip}
      </span>
    </span>
  );
}

export function SparkleIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 1.5c.3 0 .5.2.6.5l.8 2.6c.2.6.7 1.1 1.3 1.3l2.6.8c.3.1.5.3.5.6s-.2.5-.5.6l-2.6.8c-.6.2-1.1.7-1.3 1.3l-.8 2.6c-.1.3-.3.5-.6.5s-.5-.2-.6-.5l-.8-2.6c-.2-.6-.7-1.1-1.3-1.3L2.2 8.3c-.3-.1-.5-.3-.5-.6s.2-.5.5-.6l2.6-.8c.6-.2 1.1-.7 1.3-1.3L7 2c.1-.3.3-.5.6-.5Z" />
    </svg>
  );
}

export function ArrowRightIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path
        d="M3 8h10m0 0L9 4m4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path
        d="m3.5 8.5 3 3 6-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <circle cx="9" cy="9" r="6.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4ZM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
    </svg>
  );
}
