"use client";

import posthog from "posthog-js";
import type { Survey } from "posthog-js";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { FIRST_LISTING_SURVEY, type CreationMethod } from "@/lib/feedback";
import { buttonClasses } from "./ui";

const CONSENT_KEY = "subleasy:cookies";
const CONSENT_EVENT = "subleasy:cookies-change";
const DONE_KEY = "subleasy:feedback:primeiro-anuncio";

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Só com o aceite de cookies de análise: sem ele nada é carregado nem enviado ao PostHog. */
function analyticsAllowed() {
  try {
    return JSON.parse(window.localStorage.getItem(CONSENT_KEY) ?? "null")?.analytics === true;
  } catch {
    return false;
  }
}

const RATINGS = [
  { value: 1, label: "Muito difícil" },
  { value: 2, label: "Difícil" },
  { value: 3, label: "Mais ou menos" },
  { value: 4, label: "Fácil" },
  { value: 5, label: "Muito fácil" },
];

type Step = "rating" | "comment" | "thanks";

/**
 * Pesquisa de uma pergunta para quem acabou de enviar o primeiro anúncio: foi fácil? Depois, um "por quê"
 * opcional. O método de cadastro (ia ou campo a campo) vai como propriedade dos eventos, sem perguntar.
 * Segue o contrato das pesquisas `api` do PostHog: o PostHog guarda a definição e as respostas, e o app desenha
 * e envia os eventos "survey shown", "survey sent" e "survey dismissed".
 */
export function FirstListingFeedback({ listingId, method }: { listingId: string; method: CreationMethod }) {
  const allowed = useSyncExternalStore(subscribe, analyticsAllowed, () => false);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [step, setStep] = useState<Step>("rating");
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const submissionId = useRef<string | null>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  // Pede ao PostHog as pesquisas que valem para esta pessoa. Os dois ouvintes repetem o pedido quando os
  // flags e o pacote de pesquisas terminam de carregar; o primeiro que achar a pesquisa a mostra.
  useEffect(() => {
    if (!allowed || window.localStorage.getItem(DONE_KEY)) return;
    let found = false;
    const look = () => {
      if (found) return;
      posthog.getActiveMatchingSurveys((surveys) => {
        const match = surveys.find((item) => item.id === FIRST_LISTING_SURVEY.id);
        if (!match || found) return;
        found = true;
        setSurvey(match);
      });
    };
    const offFlags = posthog.onFeatureFlags(look);
    const offSurveys = posthog.onSurveysLoaded(look);
    look();
    return () => {
      offFlags();
      offSurveys();
    };
  }, [allowed]);

  const shown = survey !== null;
  useEffect(() => {
    if (!survey) return;
    posthog.capture("survey shown", {
      $survey_id: survey.id,
      $survey_iteration: survey.current_iteration,
      creation_method: method,
      listing_id: listingId,
    });
    // O posthog-js lê esta chave para o intervalo entre pesquisas; só o renderizador dele a grava.
    try {
      window.localStorage.setItem("lastSeenSurveyDate", new Date().toISOString());
    } catch {}
  }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps -- uma vez, quando a pesquisa aparece

  useEffect(() => {
    if (step === "comment") commentRef.current?.focus();
  }, [step]);

  if (!survey) return null;

  function send(answers: Record<string, number | string>, completed: boolean) {
    if (!survey) return;
    submissionId.current ??= crypto.randomUUID();
    posthog.capture("survey sent", {
      $survey_id: survey.id,
      $survey_iteration: survey.current_iteration,
      $survey_submission_id: submissionId.current,
      $survey_completed: completed,
      $survey_questions: survey.questions.map(({ id, question }) => ({ id, question })),
      ...Object.fromEntries(Object.entries(answers).map(([id, value]) => [`$survey_response_${id}`, value])),
      creation_method: method,
      listing_id: listingId,
    });
  }

  function finish() {
    try {
      window.localStorage.setItem(DONE_KEY, "1");
    } catch {}
    setStep("thanks");
  }

  function choose(value: number) {
    // Resposta parcial já guarda a nota se a pessoa parar aqui.
    setRating(value);
    send({ [FIRST_LISTING_SURVEY.rating]: value }, false);
    setStep("comment");
  }

  function submit(withComment: boolean) {
    if (rating === null) return;
    const text = comment.trim();
    send(
      { [FIRST_LISTING_SURVEY.rating]: rating, ...(withComment && text ? { [FIRST_LISTING_SURVEY.comment]: text } : {}) },
      true,
    );
    finish();
  }

  function dismiss() {
    if (!survey) return;
    posthog.capture("survey dismissed", {
      $survey_id: survey.id,
      $survey_iteration: survey.current_iteration,
      creation_method: method,
      listing_id: listingId,
    });
    try {
      window.localStorage.setItem(DONE_KEY, "1");
    } catch {}
    setSurvey(null);
  }

  return (
    <section
      aria-labelledby="feedback-titulo"
      className="mt-4 animate-fade-up rounded-panel bg-white p-5 shadow-card ring-1 ring-ink-900/8 sm:p-6"
    >
      <div aria-live="polite">
        {step === "rating" && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="feedback-titulo" className="font-bold text-ink-900">
                  Foi fácil anunciar sua sala?
                </h2>
                <p className="mt-1 text-sm text-ink-600">Sua nota ajuda a deixar o cadastro mais simples.</p>
              </div>
              <button type="button" onClick={dismiss} className={`${buttonClasses("ghost")} -mt-1 -mr-2 shrink-0`}>
                Agora não
              </button>
            </div>

            <div role="group" aria-label="Nota de 1 a 5" className="mt-4 flex gap-2">
              {RATINGS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => choose(item.value)}
                  aria-label={`${item.value} de 5: ${item.label}`}
                  className="focus-ring h-12 flex-1 rounded-control bg-white text-lg font-bold text-ink-900 tabular-nums ring-1 ring-ink-300 transition-colors hover:bg-brand-50 hover:ring-brand-600"
                >
                  {item.value}
                </button>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-ink-500" aria-hidden="true">
              <span>Muito difícil</span>
              <span>Muito fácil</span>
            </div>
          </>
        )}

        {step === "comment" && (
          <>
            <h2 id="feedback-titulo" className="font-bold text-ink-900">
              Quer contar o porquê?
            </h2>
            <p className="mt-1 text-sm text-ink-600">Opcional. Uma frase já ajuda.</p>
            <label htmlFor="feedback-comentario" className="sr-only">
              Por que você deu essa nota?
            </label>
            <textarea
              id="feedback-comentario"
              ref={commentRef}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={500}
              rows={3}
              className="focus-ring mt-3 w-full rounded-control border border-ink-300 bg-white p-3 text-sm text-ink-900"
            />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => submit(true)} className={buttonClasses("primary")}>
                Enviar
              </button>
              <button type="button" onClick={() => submit(false)} className={buttonClasses("ghost")}>
                Pular
              </button>
            </div>
          </>
        )}

        {step === "thanks" && (
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="size-6 shrink-0 text-mint-700" weight="fill" aria-hidden />
            <div>
              <h2 id="feedback-titulo" className="font-bold text-ink-900">
                Obrigado!
              </h2>
              <p className="text-sm text-ink-600">Isso ajuda a deixar o cadastro mais simples.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
