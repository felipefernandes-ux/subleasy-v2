"use client";

import { useActionState, useRef } from "react";
import { CheckCircleIcon, CircleNotchIcon, EnvelopeSimpleIcon, XIcon } from "@phosphor-icons/react";
import { submitInquiry, type InquiryState } from "@/app/actions/listing";
import { buttonClasses } from "./ui";

const INPUT =
  "mt-2 w-full rounded-control border border-ink-300 bg-white px-4 text-base text-ink-900 shadow-xs outline-none transition-colors placeholder:text-ink-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15";

/** Segunda opção de contato: a mensagem vai para o anfitrião por e-mail e fica no painel dele. */
export function InquiryForm({ listingId, title }: { listingId: string; title: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, isPending] = useActionState<InquiryState, FormData>(submitInquiry.bind(null, listingId, title), { status: "idle" });
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className={`${buttonClasses("ghost")} mt-2 w-full`}>
        <EnvelopeSimpleIcon className="size-4" aria-hidden />
        Prefere e-mail? Enviar mensagem
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="inquiry-title"
        onClick={(event) => event.target === event.currentTarget && close()}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(32rem,calc(100vw-2rem))] overflow-y-auto rounded-panel bg-white p-0 text-ink-800 shadow-raised backdrop:bg-ink-900/60 backdrop:backdrop-blur-sm"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="inquiry-title" className="text-h3 font-bold text-ink-900">
                Mensagem para o anfitrião
              </h2>
              <p className="mt-1 text-sm text-ink-600">Sobre “{title}”. A resposta chega no seu e-mail.</p>
            </div>
            <button type="button" onClick={close} aria-label="Fechar" className="focus-ring grid size-10 shrink-0 place-items-center rounded-full text-ink-500 hover:bg-ink-100">
              <XIcon className="size-5" aria-hidden />
            </button>
          </div>

          {state.status === "sent" ? (
            <div role="status" className="mt-6 text-center">
              <CheckCircleIcon className="mx-auto size-12 text-mint-700" weight="fill" aria-hidden />
              <p className="mt-3 font-bold text-ink-900">Mensagem enviada</p>
              <p className="mt-1 text-sm text-ink-600">O anfitrião recebeu por e-mail e responde direto para você.</p>
              <button type="button" onClick={close} className={`${buttonClasses("secondary")} mt-6`}>
                Fechar
              </button>
            </div>
          ) : (
            <form action={formAction} className="mt-6 space-y-4">
              <label className="block text-sm font-bold text-ink-800">
                Nome
                <input name="name" required autoComplete="name" className={`${INPUT} h-12 font-normal`} />
              </label>
              <label className="block text-sm font-bold text-ink-800">
                E-mail
                <input name="email" type="email" required autoComplete="email" className={`${INPUT} h-12 font-normal`} />
              </label>
              <label className="block text-sm font-bold text-ink-800">
                Telefone <span className="font-normal text-ink-500">(opcional)</span>
                <input name="phone" type="tel" autoComplete="tel" className={`${INPUT} h-12 font-normal`} />
              </label>
              <label className="block text-sm font-bold text-ink-800">
                Mensagem
                <textarea
                  name="message"
                  required
                  rows={4}
                  defaultValue={`Olá! Vi a sala “${title}” no Subleasy e quero saber mais.`}
                  className={`${INPUT} py-3 leading-relaxed font-normal`}
                />
              </label>
              {/* Robôs preenchem este campo; pessoas não o veem. */}
              <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-px opacity-0" />
              {state.status === "error" && (
                <p role="alert" className="text-sm text-danger-600">
                  {state.error}
                </p>
              )}
              <button type="submit" disabled={isPending} className={`${buttonClasses("primary", "lg")} w-full disabled:opacity-70`}>
                {isPending && <CircleNotchIcon className="size-5 animate-spin" weight="bold" aria-hidden />}
                Enviar mensagem
              </button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
