"use client";

import { useActionState, useId, useState } from "react";
import { CircleNotchIcon } from "@phosphor-icons/react";
import { returnListing, type ReturnListingState } from "@/app/actions/listing";
import { buttonClasses } from "./ui";

/** Devolve o anúncio ao anfitrião com o que precisa mudar. O recado vai por e-mail. */
export function AdminReturnForm({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<ReturnListingState, FormData>(
    returnListing.bind(null, listingId),
    { status: "idle" },
  );
  const noteId = useId();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${buttonClasses("secondary", "lg")} w-full sm:w-auto sm:justify-self-start`}>
        Devolver para ajustes
      </button>
    );
  }

  return (
    <form action={formAction} className="w-full">
      <label htmlFor={noteId} className="block text-sm font-bold text-ink-800">
        O que o anfitrião precisa ajustar?
      </label>
      <textarea
        id={noteId}
        name="note"
        rows={3}
        required
        autoFocus
        maxLength={1000}
        placeholder="Ex.: A foto 2 está escura. Envie uma foto da sala com a luz acesa."
        className="mt-2 w-full rounded-control border border-ink-300 bg-white px-4 py-3 text-base text-ink-900 shadow-xs outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15"
      />
      {state.status === "error" && (
        <p role="alert" className="mt-2 text-sm text-danger-600">
          {state.error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={isPending} className={`${buttonClasses("secondary")} disabled:opacity-60`}>
          {isPending && <CircleNotchIcon className="size-4 animate-spin" weight="bold" aria-hidden />}
          Enviar pedido de ajuste
        </button>
        <button type="button" onClick={() => setOpen(false)} className={buttonClasses("ghost")}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
