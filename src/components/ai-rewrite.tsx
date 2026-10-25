"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowClockwiseIcon, XIcon } from "@phosphor-icons/react";
import { rewriteField, type RewriteField, type RewriteTone } from "@/app/actions/rewrite";
import { SparkleIcon, buttonClasses } from "./ui";

const TONES: { tone: RewriteTone; label: string }[] = [
  { tone: "melhorar", label: "Melhorar" },
  { tone: "encurtar", label: "Encurtar" },
  { tone: "detalhar", label: "Mais detalhes" },
];
// Campo vazio: não há o que melhorar, só escrever.
const WRITE: typeof TONES = [{ tone: "escrever", label: "Escrever" }];

/**
 * "Reescrever com IA" de um campo, no espírito do "Help me write" do Gmail:
 * um botão discreto abre um painel pequeno; a sugestão só entra no campo se
 * o anfitrião clicar em "Usar este texto". Com o campo vazio, a IA já começa escrevendo.
 */
export function AiRewrite({
  field,
  value,
  facts,
  onApply,
  label = "Reescrever com IA",
}: {
  field: RewriteField;
  value: string;
  facts: string;
  onApply: (text: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<RewriteTone | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  // O painel abre logo abaixo do botão, por cima do campo; Esc fecha.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    const onClick = (event: MouseEvent) => {
      if (!panelRef.current?.parentElement?.contains(event.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  function close() {
    setOpen(false);
    setSuggestion(null);
    setError(null);
    setTone(null);
  }

  function run(next: RewriteTone) {
    setTone(next);
    setError(null);
    startTransition(async () => {
      const result = await rewriteField(field, next, value, facts);
      if (result.ok) setSuggestion(result.text);
      else setError(result.error);
    });
  }

  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => {
          if (open) return close();
          setOpen(true);
          if (!value.trim()) run("escrever");
        }}
        aria-expanded={open}
        className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-50"
      >
        <SparkleIcon className="size-3.5" />
        {label}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={label}
          className="absolute top-full right-0 z-20 mt-2 w-[min(26rem,calc(100vw-3rem))] animate-fade-up rounded-card bg-white p-4 text-left shadow-raised ring-1 ring-brand-100 [animation-duration:0.25s]"
        >
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-bold text-ink-900">
              <SparkleIcon className="size-4 text-brand-600" />
              {label}
            </p>
            <button type="button" onClick={close} aria-label="Fechar" className="focus-ring grid size-8 place-items-center rounded-full text-ink-500 hover:bg-ink-100">
              <XIcon className="size-4" aria-hidden />
            </button>
          </div>

          {suggestion === null && !isPending && (
            <div className="mt-3 flex flex-wrap gap-2">
              {(value.trim() ? TONES : WRITE).map((item) => (
                <button
                  key={item.tone}
                  type="button"
                  onClick={() => run(item.tone)}
                  className="focus-ring h-9 rounded-full bg-brand-50 px-3.5 text-sm font-bold text-brand-800 ring-1 ring-brand-100 transition-colors hover:bg-brand-100"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {isPending && (
            <div className="mt-3 space-y-2" role="status" aria-label="Escrevendo">
              <span className="block h-3 w-full animate-shimmer rounded-full bg-[linear-gradient(90deg,var(--color-brand-50)_25%,var(--color-brand-100)_50%,var(--color-brand-50)_75%)] bg-[length:200%_100%]" />
              <span className="block h-3 w-4/5 animate-shimmer rounded-full bg-[linear-gradient(90deg,var(--color-brand-50)_25%,var(--color-brand-100)_50%,var(--color-brand-50)_75%)] bg-[length:200%_100%]" />
            </div>
          )}

          {error && !isPending && (
            <p role="alert" className="mt-3 text-sm text-danger-600">
              {error}
            </p>
          )}

          {suggestion !== null && !isPending && (
            <>
              <p className="mt-3 max-h-56 overflow-y-auto rounded-control bg-ink-50 p-3 text-sm leading-relaxed whitespace-pre-line text-ink-800">{suggestion}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onApply(suggestion);
                    close();
                  }}
                  className={buttonClasses("primary")}
                >
                  Usar este texto
                </button>
                <button type="button" onClick={() => tone && run(tone)} className={buttonClasses("ghost")}>
                  <ArrowClockwiseIcon className="size-4" aria-hidden />
                  Tentar de novo
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </span>
  );
}
