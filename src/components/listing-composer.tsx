"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import {
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleNotchIcon,
  SignInIcon,
  SparkleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { createListingAI, type CreateListingAIResult } from "@/app/actions/create-listings-ai";
import { buttonClasses } from "./ui";

const MIN_LENGTH = 30;
const MAX_LENGTH = 6000;

// Alternam no placeholder para mostrar, sem explicar, o que vale escrever.
const EXAMPLES = [
  "Sala de psicologia em Pinheiros, São Paulo. R$ 80 por turno, livre segunda e quarta de manhã. Tem ar-condicionado e wifi.",
  "Consultório odontológico na Savassi, Belo Horizonte, com cadeira e autoclave. R$ 450 por dia, às sextas e aos sábados.",
  "Sala de estética no Batel, Curitiba. R$ 60 por hora, de terça a quinta à tarde. Tem maca, pia e recepção.",
  "Consultório de nutrição no Moinhos de Vento, Porto Alegre. R$ 1.800 por mês, todas as manhãs. Não pode procedimento invasivo.",
  "Sala de reunião para 8 pessoas em Boa Viagem, Recife. R$ 300 por dia, de segunda a sexta. Tem TV, wifi e café.",
];

const STEPS = [
  "Lendo sua descrição",
  "Separando tipo, local, preço e turnos",
  "Escrevendo título e resumo",
  "Salvando o rascunho",
];

export function ListingComposer() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<CreateListingAIResult | null>(null);
  const [step, setStep] = useState(0);
  const [example, setExample] = useState(0);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hintId = useId();

  const length = text.trim().length;
  const tooShort = length > 0 && length < MIN_LENGTH;
  const canSubmit = length >= MIN_LENGTH && !isPending;
  const showPlaceholder = text.length === 0;

  // Troca o exemplo do placeholder enquanto o campo está vazio.
  useEffect(() => {
    if (!showPlaceholder) return;
    const timer = setInterval(() => {
      setExample((current) => (current + 1) % EXAMPLES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [showPlaceholder]);

  // As etapas avançam no ritmo médio da IA e param na última até a resposta chegar.
  useEffect(() => {
    if (!isPending) return;
    const timer = setInterval(() => {
      setStep((current) => Math.min(current + 1, STEPS.length - 1));
    }, 3500);
    return () => clearInterval(timer);
  }, [isPending]);

  function submit() {
    if (!canSubmit) return;
    setResult(null);
    setStep(0);
    startTransition(async () => {
      const response = await createListingAI(text);
      setResult(response);
      if (!response.ok) textareaRef.current?.focus();
    });
  }

  function reset() {
    setText("");
    setResult(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  if (result?.ok) {
    return <SuccessCard title={result.listing.title} onReset={reset} />;
  }

  return (
    <div className="animate-fade-up [animation-delay:160ms]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="group relative"
      >
        {/* Halo da IA: aparece no foco e pulsa enquanto gera. */}
        <div
          aria-hidden="true"
          className={`ai-glow absolute -inset-1 -z-10 rounded-[1.5rem] blur-2xl transition-opacity duration-500 ${
            isPending ? "opacity-60" : "opacity-0 group-focus-within:opacity-35"
          }`}
        />

        <div data-busy={isPending} className="ai-border rounded-panel p-px shadow-raised">
          <div className="rounded-[calc(var(--radius-panel)-1px)] bg-white">
            <div className="relative">
              {showPlaceholder && (
                <p
                  key={example}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 animate-fade-up px-4 pt-4 text-base leading-relaxed text-ink-400 sm:px-6 sm:pt-5 sm:text-lg"
                >
                  Ex: {EXAMPLES[example]}
                </p>
              )}
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    submit();
                  }
                }}
                readOnly={isPending}
                maxLength={MAX_LENGTH}
                rows={6}
                aria-label="Descreva a sala que você quer sublocar"
                aria-describedby={hintId}
                className={`relative block min-h-40 w-full resize-y bg-transparent px-4 pt-4 pb-3 text-base leading-relaxed text-ink-900 focus:outline-none sm:min-h-48 sm:px-6 sm:pt-5 sm:pb-4 sm:text-lg ${
                  isPending ? "text-ink-500" : ""
                }`}
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-ink-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <button
                type="button"
                onClick={() => {
                  setText(EXAMPLES[example]);
                  setResult(null);
                  textareaRef.current?.focus();
                }}
                disabled={isPending}
                className={`${buttonClasses("ghost")} disabled:opacity-50 max-sm:h-10 max-sm:text-xs`}
              >
                <SparkleIcon className="size-4 text-brand-600" weight="fill" aria-hidden />
                Usar texto de exemplo
              </button>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
                <p id={hintId} aria-live="polite" className="text-center text-xs text-ink-700 empty:hidden">
                  {tooShort && `Escreva pelo menos ${MIN_LENGTH} caracteres`}
                </p>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`${buttonClasses("primary", "lg")} shadow-brand disabled:cursor-not-allowed disabled:bg-brand-300 disabled:shadow-none max-sm:h-11 max-sm:w-full max-sm:text-sm`}
                >
                  {isPending ? (
                    <>
                      <CircleNotchIcon className="size-4.5 animate-spin sm:size-5" weight="bold" aria-hidden />
                      Gerando anúncio
                    </>
                  ) : (
                    <>
                      <SparkleIcon className="size-4.5 sm:size-5" weight="fill" aria-hidden />
                      Gerar anúncio com IA
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      <div aria-live="polite" className="mt-6">
        {isPending ? (
          <Progress step={step} />
        ) : result && !result.ok ? (
          <ErrorCard result={result} />
        ) : null}
      </div>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <ol className="space-y-2.5 rounded-card bg-white/80 p-5 ring-1 ring-ink-200 backdrop-blur-sm">
      {STEPS.map((label, index) => {
        const done = index < step;
        const active = index === step;
        return (
          <li
            key={label}
            className={`flex items-center gap-3 text-sm transition-opacity duration-500 ${
              index > step ? "opacity-40" : "opacity-100"
            }`}
          >
            <span className="grid size-5 shrink-0 place-items-center">
              {done ? (
                <CheckCircleIcon className="size-5 animate-pop text-mint-700" weight="fill" aria-hidden />
              ) : active ? (
                <span className="size-2.5 animate-pulse rounded-full bg-brand-600" />
              ) : (
                <span className="size-2 rounded-full bg-ink-300" />
              )}
            </span>
            <span
              className={
                active
                  ? "animate-shimmer bg-[linear-gradient(90deg,var(--color-ink-700)_35%,var(--color-brand-500)_50%,var(--color-ink-700)_65%)] bg-[length:200%_100%] bg-clip-text font-bold text-transparent"
                  : done
                    ? "text-ink-700"
                    : "text-ink-500"
              }
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ErrorCard({ result }: { result: Extract<CreateListingAIResult, { ok: false }> }) {
  const missing = result.missingFields ?? [];

  if (missing.length > 0) {
    return (
      <div className="animate-fade-up rounded-card bg-white p-5 ring-1 ring-warning-500/40">
        <p className="flex items-center gap-2 font-bold text-ink-900">
          <WarningCircleIcon className="size-5 text-warning-500" weight="fill" aria-hidden />
          Faltou informação para montar o anúncio
        </p>
        <p className="mt-1 text-sm text-ink-600">Acrescente ao seu texto e gere de novo:</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {missing.map((field) => (
            <li key={field} className="rounded-full bg-ink-100 px-3 py-1 text-sm text-ink-800">
              {field}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const needsLogin = result.code === "unauthenticated";
  return (
    <div className="animate-fade-up flex flex-col gap-4 rounded-card bg-white p-5 ring-1 ring-danger-600/30 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="flex items-center gap-2 font-bold text-ink-900">
          <WarningCircleIcon className="size-5 text-danger-600" weight="fill" aria-hidden />
          {needsLogin ? "Falta entrar na sua conta" : "Não foi possível gerar o anúncio"}
        </p>
        <p className="mt-1 text-sm text-ink-600">{result.error}</p>
      </div>
      {needsLogin && (
        <Link href="/entrar" className={buttonClasses("secondary")}>
          <SignInIcon className="size-4.5" aria-hidden />
          Entrar
        </Link>
      )}
    </div>
  );
}

function SuccessCard({ title, onReset }: { title: string; onReset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <div className="animate-fade-up overflow-hidden rounded-panel bg-white shadow-raised ring-1 ring-ink-900/8">
      <div aria-hidden="true" className="ai-glow h-1" />
      <div className="p-6 sm:p-8">
        <span className="grid size-12 place-items-center rounded-full bg-mint-400 text-brand-900">
          <CheckIcon className="size-6 animate-pop" weight="bold" aria-hidden />
        </span>
        <h2 ref={headingRef} tabIndex={-1} className="mt-5 text-h3 font-bold text-ink-900 focus:outline-none">
          Rascunho salvo
        </h2>
        <p className="mt-3 text-xl leading-snug font-bold sm:text-2xl tracking-[-0.01em] text-brand-700">“{title}”</p>
        <p className="mt-3 text-ink-600">
          A IA organizou seu texto em campos. Só você vê este anúncio até ele ser publicado.
        </p>
        <button type="button" onClick={onReset} className={`${buttonClasses("secondary", "lg")} mt-6`}>
          <ArrowCounterClockwiseIcon className="size-4.5" aria-hidden />
          Descrever outra sala
        </button>
      </div>
    </div>
  );
}
