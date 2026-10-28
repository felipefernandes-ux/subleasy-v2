"use client";

import { useActionState, useId, useRef, useState, useTransition } from "react";
import { CircleNotchIcon, SparkleIcon } from "@phosphor-icons/react";
import { returnListing, type ReturnListingState } from "@/app/actions/listing";
import { reviewListingAI, type ListingReview } from "@/app/actions/review-listing-ai";
import { Button } from "./ui";

const VERDICTS: Record<ListingReview["verdict"], string> = {
  bom: "A IA não achou ajustes. Considere aprovar o anúncio em vez de devolver.",
  ajustar: "A IA sugere ajustes pontuais.",
  fraco: "A IA achou problemas graves.",
};

/**
 * Devolve o anúncio ao anunciante com uma nota por e-mail. Ao abrir, a IA analisa o anúncio
 * (texto e fotos) e rascunha a nota; o admin edita antes de enviar.
 */
export function ReturnListingDialog({ listingId }: { listingId: string }) {
  const uid = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [note, setNote] = useState("");
  const [verdict, setVerdict] = useState<ListingReview["verdict"] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [analyzing, startAnalysis] = useTransition();
  const [state, formAction, sending] = useActionState<ReturnListingState, FormData>(returnListing.bind(null, listingId), {
    status: "idle",
  });

  const open = () => {
    ref.current?.showModal();
    setNote("");
    setVerdict(null);
    setAiError(null);
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

  return (
    <>
      <Button onClick={open}>Devolver com nota</Button>
      <dialog
        ref={ref}
        aria-labelledby={`${uid}-title`}
        className="sa-root m-auto w-[min(32rem,calc(100vw-2rem))] rounded-sa-panel bg-sa-canvas p-0 text-sa-ink shadow-sa-raised backdrop:bg-sa-ink/30"
      >
        <form action={formAction} className="flex flex-col gap-4 p-6">
          <input type="hidden" name="next" value="superadmin" />
          <div>
            <h2 id={`${uid}-title`} className="sa-display text-sa-title font-semibold">
              Devolver com nota
            </h2>
            <p className="mt-1.5 text-sa-base text-sa-muted">
              A IA analisa o anúncio e rascunha a nota. Edite o que quiser: o anunciante recebe o texto por e-mail e pode ajustar o anúncio.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${uid}-note`} className="text-sa-sm font-semibold">
              Nota para o anunciante
            </label>
            <textarea
              id={`${uid}-note`}
              name="note"
              rows={10}
              required
              maxLength={1000}
              value={analyzing ? "" : note}
              onChange={(event) => setNote(event.target.value)}
              readOnly={analyzing}
              className="sa-input"
              placeholder={analyzing ? "Analisando o anúncio…" : "Escreva o que o anunciante precisa ajustar"}
            />
            {analyzing && (
              <p role="status" className="flex items-center gap-2 text-sa-sm text-sa-muted">
                <CircleNotchIcon className="size-4 animate-spin" weight="bold" aria-hidden />
                A IA está lendo o texto e as fotos. Leva alguns segundos.
              </p>
            )}
            {verdict && (
              <p role="status" className="flex items-center gap-2 text-sa-sm text-sa-muted">
                <SparkleIcon className="size-4" weight="fill" aria-hidden />
                {VERDICTS[verdict]} Revise o texto antes de enviar.
              </p>
            )}
            {aiError && (
              <p role="alert" className="text-sa-sm text-red-600">
                {aiError}
              </p>
            )}
            {state.status === "error" && (
              <p role="alert" className="text-sa-sm text-red-600">
                {state.error}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => ref.current?.close()}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={analyzing || sending || note.trim().length < 10}>
              {sending && <CircleNotchIcon className="size-4 animate-spin" weight="bold" aria-hidden />}
              Enviar
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
