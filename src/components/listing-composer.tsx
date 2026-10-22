"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import {
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleNotchIcon,
  LockSimpleIcon,
  SignInIcon,
  SparkleIcon,
  TextAlignLeftIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { createListingAI, type CreateListingAIResult } from "@/app/actions/create-listings-ai";
import { buttonClasses } from "./ui";

const MIN_LENGTH = 30;
const MAX_LENGTH = 6000;

const EXAMPLE = `Sublocamos sala de psicologia em Pinheiros, São Paulo/SP, a 5 minutos do metrô Fradique Coutinho. R$ 80 por turno.
Livre segunda e quarta de manhã, quinta à noite e sábado à tarde.
A sala tem poltronas, mesa de apoio, ar-condicionado, wifi e janela com isolamento acústico. O prédio tem recepção e elevador.
Não pode procedimento invasivo. Período mínimo de 1 turno por semana.`;

// Pistas simples para a checklist reagir enquanto a pessoa escreve.
// Quem decide de verdade é a IA; isto só orienta.
const CHECKLIST = [
  {
    key: "tipo",
    label: "Tipo de sala",
    example: "sala de psicologia",
    required: true,
    test: /consultori|psicolog|nutri|fisio|odonto|dentist|estetic|terap|estudio|reuniao|medic|pilates|massag|clinic/,
  },
  {
    key: "local",
    label: "Bairro e cidade",
    example: "Pinheiros, São Paulo",
    required: true,
    test: /\b(bairro|zona|centro|jardim|vila|cidade|rua|avenida|av)\b|\/\s?[a-z]{2}\b|\bem [a-z]{4,}/,
  },
  {
    key: "preco",
    label: "Preço e cobrança",
    example: "R$ 80 por turno",
    required: true,
    test: /(r\$\s?\d|\d+\s?reais)[\s\S]*\b(hora|turno|dia|diaria|mes|mensal)|\b(hora|turno|dia|diaria|mes|mensal)\b[\s\S]*(r\$\s?\d|\d+\s?reais)/,
  },
  {
    key: "turnos",
    label: "Dias e turnos livres",
    example: "segunda de manhã",
    required: false,
    test: /segunda|terca|quarta|quinta|sexta|sabado|domingo|manha|tarde|noite|fim de semana|dias uteis/,
  },
  {
    key: "comodidades",
    label: "Comodidades",
    example: "ar-condicionado, maca",
    required: false,
    test: /ar.condicionado|wi.?fi|internet|maca|\bpia\b|recepc|estacionamento|banheiro|janela|poltrona|cadeira|acessib|elevador|isolamento/,
  },
  {
    key: "regras",
    label: "Regras de uso",
    example: "sem procedimento invasivo",
    required: false,
    test: /nao pode|nao e permitid|proibid|sem procedimento|regra|periodo minimo|minimo de|somente|apenas/,
  },
] as const;

const STEPS = [
  "Lendo sua descrição",
  "Separando tipo, local, preço e turnos",
  "Escrevendo título e resumo",
  "Salvando o rascunho",
];

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function ListingComposer() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<CreateListingAIResult | null>(null);
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fieldId = useId();
  const hintId = useId();

  const normalized = normalize(text);
  const found = new Set(CHECKLIST.filter((item) => item.test.test(normalized)).map((item) => item.key));
  const length = text.trim().length;
  const tooShort = length > 0 && length < MIN_LENGTH;
  const canSubmit = length >= MIN_LENGTH && !isPending;

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
    <div className="animate-fade-up [animation-delay:240ms]">
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

        <div data-busy={isPending} className="ai-border rounded-panel p-[1.5px] shadow-raised">
          <div className="rounded-[calc(var(--radius-panel)-1.5px)] bg-white">
            <label
              htmlFor={fieldId}
              className="flex items-center gap-2 px-5 pt-5 text-sm font-bold text-ink-900 sm:px-6"
            >
              <TextAlignLeftIcon className="size-4.5 text-brand-600" weight="bold" aria-hidden />
              Como é a sala que você quer sublocar?
            </label>

            <textarea
              ref={textareaRef}
              id={fieldId}
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
              rows={7}
              aria-describedby={hintId}
              placeholder="Ex: Sala de psicologia em Pinheiros, São Paulo. R$ 80 por turno. Livre segunda e quarta de manhã. Tem ar-condicionado e wifi."
              className={`block min-h-52 w-full resize-y bg-transparent px-5 pt-3 pb-4 text-lg leading-relaxed text-ink-900 placeholder:text-ink-400 focus:outline-none sm:px-6 ${
                isPending ? "text-ink-500" : ""
              }`}
            />

            <div className="flex flex-col-reverse gap-3 border-t border-ink-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <button
                type="button"
                onClick={() => {
                  setText(EXAMPLE);
                  setResult(null);
                  textareaRef.current?.focus();
                }}
                disabled={isPending}
                className={`${buttonClasses("ghost")} disabled:opacity-50`}
              >
                <SparkleIcon className="size-4 text-brand-600" weight="fill" aria-hidden />
                Usar texto de exemplo
              </button>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <p id={hintId} aria-live="polite" className="text-xs whitespace-nowrap text-ink-500 tabular-nums">
                  {tooShort ? (
                    <span className="text-ink-700">Escreva pelo menos {MIN_LENGTH} caracteres</span>
                  ) : (
                    <>
                      {length.toLocaleString("pt-BR")} / {MAX_LENGTH.toLocaleString("pt-BR")}
                    </>
                  )}
                </p>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`${buttonClasses("primary", "lg")} shadow-brand disabled:cursor-not-allowed disabled:bg-brand-300 disabled:shadow-none`}
                >
                  {isPending ? (
                    <>
                      <CircleNotchIcon className="size-5 animate-spin" weight="bold" aria-hidden />
                      Gerando anúncio
                    </>
                  ) : (
                    <>
                      <SparkleIcon className="size-5" weight="fill" aria-hidden />
                      Gerar anúncio com IA
                      <kbd
                        title="⌘ + Enter (Ctrl + Enter no Windows)"
                        className="ml-1 hidden rounded-md bg-white/15 px-1.5 py-0.5 font-sans text-xs font-normal lg:inline"
                      >
                        ⌘↵
                      </kbd>
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

      {!isPending && <Checklist found={found} />}

      <p className="mt-8 flex items-start gap-2 text-sm leading-relaxed text-ink-500">
        <LockSimpleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
        Deixe telefone e endereço completo de fora. O contato fica protegido e só aparece para
        quem chamar você. O texto é processado pela IA do Google (Gemini).
      </p>
    </div>
  );
}

function Checklist({ found }: { found: Set<string> }) {
  const groups = [
    { title: "Obrigatório", items: CHECKLIST.filter((item) => item.required) },
    { title: "Deixa o anúncio melhor", items: CHECKLIST.filter((item) => !item.required) },
  ];

  return (
    <section aria-labelledby="checklist-title" className="mt-8">
      <h2 id="checklist-title" className="text-sm font-bold text-ink-900">
        O que incluir no texto
      </h2>
      <div className="mt-3 grid gap-6 sm:grid-cols-2">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="text-xs font-bold tracking-wide text-ink-500 uppercase">{group.title}</p>
            <ul className="mt-2 space-y-1.5">
              {group.items.map((item) => {
                const done = found.has(item.key);
                return (
                  <li
                    key={item.key}
                    className={`flex items-center gap-3 rounded-control px-3 py-2 ring-1 transition-colors duration-300 ${
                      done ? "bg-mint-50 ring-mint-100" : "bg-white/70 ring-ink-200"
                    }`}
                  >
                    <span
                      className={`grid size-5 shrink-0 place-items-center rounded-full transition-colors duration-300 ${
                        done ? "bg-mint-400 text-brand-900" : "ring-1 ring-ink-300 ring-inset"
                      }`}
                    >
                      {done && <CheckIcon key="check" className="size-3 animate-pop" weight="bold" aria-hidden />}
                    </span>
                    <span className="min-w-0 text-sm">
                      <span className="font-bold text-ink-900">{item.label}</span>
                      <span className="text-ink-500"> · {item.example}</span>
                      {done && <span className="sr-only"> (incluído)</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
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
        <p className="mt-3 text-2xl leading-snug font-bold tracking-[-0.01em] text-brand-700">“{title}”</p>
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
