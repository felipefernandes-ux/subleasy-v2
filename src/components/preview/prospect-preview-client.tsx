"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { optOutOfPreview, requestAd, trackPreviewView, type ClaimState } from "@/app/previa/actions";
import { WhatsAppIcon, buttonClasses } from "@/components/ui";

/** Conta a visita uma vez por sessão do navegador, depois que a página abre. */
export function PreviewViewTracker({ token }: { token: string }) {
  useEffect(() => {
    const key = `previa:${token}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    trackPreviewView(token);
  }, [token]);
  return null;
}

const INPUT =
  "mt-1.5 h-12 w-full rounded-control border border-ink-300 bg-white px-4 text-base text-ink-900 shadow-xs outline-none transition-colors placeholder:text-ink-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15";

/** Barra fixa com “Quero esse anúncio grátis” e o formulário do pedido. */
export function ClaimBar({ token }: { token: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState<ClaimState, FormData>(requestAd.bind(null, token), { status: "idle" });
  const fields = state.status === "error" ? (state.fields ?? {}) : {};

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 backdrop-blur-md">
        <div className="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
          <p className="text-sm text-ink-700">
            <strong className="font-bold text-ink-900">Prévia do seu anúncio.</strong> Ainda não está publicada.
          </p>
          <button type="button" onClick={() => dialog.current?.showModal()} className={buttonClasses("primary", "md")}>
            Quero esse anúncio grátis
          </button>
        </div>
      </div>

      <dialog
        ref={dialog}
        aria-labelledby="claim-title"
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-panel bg-white p-0 shadow-raised backdrop:bg-ink-900/50"
        onClick={(event) => event.target === event.currentTarget && dialog.current?.close()}
      >
        <div className="p-6 sm:p-8">
          {state.status === "done" ? (
            <div role="status">
              <h2 id="claim-title" className="text-h3 font-bold text-ink-900">
                Recebemos o seu pedido
              </h2>
              <p className="mt-3 text-ink-700">
                Nossa equipe fala com você pelo WhatsApp para confirmar que a sala é sua e pedir as fotos reais. O anúncio só vai ao ar depois que você aprovar.
              </p>
              <button type="button" onClick={() => dialog.current?.close()} className={`${buttonClasses("secondary", "md")} mt-6`}>
                Fechar
              </button>
            </div>
          ) : (
            <form action={formAction} noValidate>
              <h2 id="claim-title" className="text-h3 font-bold text-ink-900">
                Quero esse anúncio grátis
              </h2>
              <p className="mt-2 text-ink-700">Deixe seus dados. Publicar é grátis, e você aprova o texto e as fotos antes de ir ao ar.</p>
              <div className="mt-5 space-y-4">
                <label className="block text-sm font-bold text-ink-800">
                  Seu nome
                  <input name="name" autoComplete="name" required className={INPUT} aria-invalid={Boolean(fields.name)} />
                  {fields.name && <span className="mt-1 block text-sm font-normal text-danger-600">{fields.name}</span>}
                </label>
                <label className="block text-sm font-bold text-ink-800">
                  E-mail
                  <input name="email" type="email" autoComplete="email" required className={INPUT} aria-invalid={Boolean(fields.email)} />
                  {fields.email && <span className="mt-1 block text-sm font-normal text-danger-600">{fields.email}</span>}
                </label>
                <label className="block text-sm font-bold text-ink-800">
                  WhatsApp com DDD
                  <input name="phone" type="tel" autoComplete="tel" inputMode="tel" required placeholder="(44) 99999-9999" className={INPUT} aria-invalid={Boolean(fields.phone)} />
                  {fields.phone && <span className="mt-1 block text-sm font-normal text-danger-600">{fields.phone}</span>}
                </label>
              </div>
              {state.status === "error" && !state.fields && (
                <p role="alert" className="mt-4 text-sm text-danger-600">
                  {state.error}
                </p>
              )}
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => dialog.current?.close()} className={buttonClasses("ghost", "md")}>
                  Agora não
                </button>
                <button type="submit" disabled={pending} className={`${buttonClasses("primary", "md")} disabled:opacity-60`}>
                  {pending ? "Enviando…" : "Enviar pedido"}
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}

/** “Não é o meu local” / “não quero receber”: tira a prévia do ar e encerra o contato. */
export function PreviewOptOut({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "confirm" | "done">("idle");

  if (state === "done") return <p className="text-sm text-ink-600">Pronto. Esta prévia saiu do ar e não escrevemos mais.</p>;
  if (state === "confirm") {
    return (
      <p className="flex flex-wrap items-center gap-3 text-sm text-ink-700">
        Tirar esta prévia do ar e não receber mais mensagens?
        <button
          type="button"
          className="font-bold text-brand-700 underline underline-offset-2"
          onClick={async () => {
            const result = await optOutOfPreview(token);
            setState(result.ok ? "done" : "idle");
          }}
        >
          Sim, tirar
        </button>
        <button type="button" className="text-ink-600 underline underline-offset-2" onClick={() => setState("idle")}>
          Cancelar
        </button>
      </p>
    );
  }
  return (
    <button type="button" className="text-sm text-ink-600 underline underline-offset-2 hover:text-ink-900" onClick={() => setState("confirm")}>
      Não é o meu local ou não quero receber mensagens
    </button>
  );
}

/** Botão de contato da prévia: tem a cara do botão real, mas ainda não leva a ninguém. */
export function PreviewContactButton() {
  const [shown, setShown] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setShown(true)}
        className="focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-control bg-whatsapp px-5 text-base font-bold whitespace-nowrap text-white shadow-xs transition-colors hover:bg-whatsapp-hover sm:h-13"
      >
        <WhatsAppIcon className="size-5" />
        Falar no WhatsApp
      </button>
      <p className="mt-3 text-center text-xs text-ink-500" aria-live="polite">
        {shown ? "Na prévia o contato ainda não funciona. Depois de publicado, quem procura fala direto com você." : "Você fala direto com o anunciante. Sem comissão."}
      </p>
    </div>
  );
}
