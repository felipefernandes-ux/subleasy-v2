"use client";

import { useActionState, useId, useState, useTransition } from "react";
import { CircleNotchIcon, SparkleIcon } from "@phosphor-icons/react";
import { returnListing, type ReturnListingState } from "@/app/actions/listing";
import { reviewListingAI, type ListingReview } from "@/app/actions/review-listing-ai";
import { buttonClasses } from "./ui";

const VERDICTS: Record<ListingReview["verdict"], string> = {
  bom: "A IA não achou ajustes. Considere aprovar o anúncio.",
  ajustar: "A IA sugere ajustes pontuais.",
  fraco: "A IA achou problemas graves.",
};

/**
 * Devolve o anúncio ao anunciante com o que precisa mudar. O recado vai por e-mail.
 * Ao abrir, a IA analisa o anúncio e rascunha a nota; o admin edita antes de enviar.
 */
export function AdminReturnForm({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<ReturnListingState, FormData>(
    returnListing.bind(null, listingId),
    { status: "idle" },
  );
  const noteId = useId();
  const [note, setNote] = useState("");
  const [verdict, setVerdict] = useState<ListingReview["verdict"] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [analyzing, startAnalysis] = useTransition();

  const analyze = () => {
    setOpen(true);
    setAiError(null);
    setVerdict(null);
    startAnalysis(async () => {
      const result = await reviewListingAI(listingId);
      if (result.ok) {
        setNote(result.review.note);
        setVerdict(result.review.verdict);
      } else {
        setAiError(`${result.error} Escreva a nota à mão.`);
      }
    });
  };

  if (!open) {
    return (
      <button type="button" onClick={analyze} className={`${buttonClasses("secondary", "lg")} w-full sm:w-auto sm:justify-self-start`}>
        Devolver para ajustes
      </button>
    );
  }

  return (
    <form action={formAction} className="w-full">
      <label htmlFor={noteId} className="block text-sm font-bold text-ink-800">
        O que o anunciante precisa ajustar?
      </label>
      <textarea
        id={noteId}
        name="note"
        rows={analyzing || note.length > 300 ? 8 : 3}
        required
        autoFocus
        maxLength={1000}
        value={analyzing ? "" : note}
        onChange={(event) => setNote(event.target.value)}
        readOnly={analyzing}
        placeholder={analyzing ? "Analisando o anúncio…" : "Ex.: A foto 2 está escura. Envie uma foto da sala com a luz acesa."}
        className="mt-2 w-full rounded-control border border-ink-300 bg-white px-4 py-3 text-base text-ink-900 shadow-xs outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15"
      />
      {analyzing && (
        <p role="status" className="mt-2 flex items-center gap-2 text-sm text-ink-600">
          <CircleNotchIcon className="size-4 animate-spin" weight="bold" aria-hidden />
          A IA está lendo o texto e as fotos. Leva alguns segundos.
        </p>
      )}
      {verdict && (
        <p role="status" className="mt-2 flex items-center gap-2 text-sm text-ink-600">
          <SparkleIcon className="size-4 text-brand-600" weight="fill" aria-hidden />
          {VERDICTS[verdict]} Revise o texto antes de enviar.
        </p>
      )}
      {aiError && (
        <p role="alert" className="mt-2 text-sm text-danger-600">
          {aiError}
        </p>
      )}
      {state.status === "error" && (
        <p role="alert" className="mt-2 text-sm text-danger-600">
          {state.error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={isPending || analyzing} className={`${buttonClasses("secondary")} disabled:opacity-60`}>
          {isPending && <CircleNotchIcon className="size-4 animate-spin" weight="bold" aria-hidden />}
          Enviar
        </button>
        <button type="button" onClick={() => setOpen(false)} className={buttonClasses("ghost")}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
