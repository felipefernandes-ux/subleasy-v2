"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CircleNotchIcon, EnvelopeSimpleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { buttonClasses } from "./ui";

const RESEND_SECONDS = 30;

/**
 * Tela do código de 6 dígitos enviado por e-mail: usada no login por e-mail, na criação de conta
 * e na segunda etapa de quem entra pelo Google. O pai cuida da ação; aqui fica só a tela.
 */
export function CodeStep({
  email,
  title,
  description,
  formAction,
  pending,
  error,
  hidden,
  submitLabel,
  onResend,
  onBack,
  backLabel,
  children,
}: {
  email: string;
  title: string;
  description: string;
  formAction: (formData: FormData) => void;
  pending: boolean;
  error?: string;
  hidden: Record<string, string>;
  submitLabel: string;
  onResend: () => void;
  onBack: () => void;
  backLabel: string;
  /** Campos extras, como "Confiar neste aparelho". */
  children?: ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const codeId = useId();
  const errorId = useId();
  const [wait, setWait] = useState(RESEND_SECONDS);
  const [resent, setResent] = useState(false);

  useEffect(() => headingRef.current?.focus(), []);
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  return (
    <div className="w-full animate-fade-up text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-50 text-brand-600">
        <EnvelopeSimpleIcon className="size-6" weight="bold" aria-hidden />
      </span>
      <h1 ref={headingRef} tabIndex={-1} className="mt-5 text-h2 font-bold text-ink-900 focus:outline-none">
        {title}
      </h1>
      <p className="mt-3 text-ink-600">
        {description}
        <strong className="block font-bold [overflow-wrap:anywhere] text-ink-900">{email}</strong>
      </p>

      <form action={formAction} className="mt-6 text-left">
        {Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <label htmlFor={codeId} className="block text-center text-sm font-bold text-ink-800">
          Código de 6 dígitos
        </label>
        <input
          id={codeId}
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          placeholder="••••••"
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "").slice(0, 6);
            event.target.value = digits;
            // Preencheu os 6 números: envia sozinho.
            if (digits.length === 6) event.target.form?.requestSubmit();
          }}
          className={`mt-2 h-14 w-full rounded-control border bg-white text-center font-mono text-3xl font-bold tracking-[0.5em] text-ink-900 shadow-xs outline-none transition-colors placeholder:text-ink-300 focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15 ${
            error ? "border-danger-600" : "border-ink-300"
          }`}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-3 flex items-start gap-2 text-sm text-danger-600">
            <WarningCircleIcon className="mt-px size-4.5 shrink-0" weight="fill" aria-hidden />
            {error}
          </p>
        )}
        {children}
        <button type="submit" disabled={pending} className={`${buttonClasses("primary", "lg")} mt-5 w-full disabled:cursor-wait disabled:bg-brand-500`}>
          {pending ? (
            <>
              <CircleNotchIcon className="size-5 animate-spin" weight="bold" aria-hidden />
              Conferindo
            </>
          ) : (
            submitLabel
          )}
        </button>
      </form>

      <p className="mt-4 text-sm text-ink-500" aria-live="polite">
        {resent ? "Enviamos outro código. " : "Não chegou? Veja a caixa de spam. "}
        <button
          type="button"
          disabled={wait > 0}
          onClick={() => {
            onResend();
            setResent(true);
            setWait(RESEND_SECONDS);
          }}
          className="focus-ring rounded-sm font-bold text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:text-ink-400"
        >
          {wait > 0 ? `Reenviar em ${wait}s` : "Reenviar código"}
        </button>
      </p>
      <button type="button" onClick={onBack} className={`${buttonClasses("ghost")} mt-4`}>
        {backLabel}
      </button>
    </div>
  );
}
