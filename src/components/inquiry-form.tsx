"use client";

import { useActionState } from "react";
import { ArrowLeftIcon, CheckCircleIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { submitInquiry, type InquiryState } from "@/app/actions/listing";
import { buttonClasses } from "./ui";

const INPUT =
  "mt-1.5 w-full rounded-control border border-ink-300 bg-white px-3.5 text-base font-normal text-ink-900 shadow-xs outline-none transition-colors placeholder:text-ink-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15";

/**
 * Segunda opção de contato, aberta no próprio bloco de contato: a mensagem vai para o
 * anfitrião por e-mail e fica no painel dele. Já vem escrita com os dados da sala.
 */
export function InquiryForm({ listingId, title, about, onCancel }: { listingId: string; title: string; about: string; onCancel: () => void }) {
  const [state, formAction, isPending] = useActionState<InquiryState, FormData>(submitInquiry.bind(null, listingId, title), { status: "idle" });

  if (state.status === "sent") {
    return (
      <div role="status" className="py-2 text-center">
        <CheckCircleIcon className="mx-auto size-11 text-mint-700" weight="fill" aria-hidden />
        <p className="mt-3 font-bold text-ink-900">Mensagem enviada</p>
        <p className="mt-1 text-sm text-ink-600">O anfitrião recebeu por e-mail e responde direto para você.</p>
        <button type="button" onClick={onCancel} className={`${buttonClasses("ghost")} mt-4`}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold text-ink-900">Mensagem para o anfitrião</p>
        <button type="button" onClick={onCancel} className={`${buttonClasses("ghost", "sm")} -mr-2`}>
          <ArrowLeftIcon className="size-4" aria-hidden />
          Voltar
        </button>
      </div>
      <label className="block text-sm font-bold text-ink-800">
        Nome
        <input name="name" required autoComplete="name" className={`${INPUT} h-11`} />
      </label>
      <label className="block text-sm font-bold text-ink-800">
        E-mail
        <input name="email" type="email" required autoComplete="email" className={`${INPUT} h-11`} />
      </label>
      <label className="block text-sm font-bold text-ink-800">
        WhatsApp <span className="font-normal text-ink-500">(opcional)</span>
        <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(44) 99999-9999" className={`${INPUT} h-11`} />
      </label>
      <label className="block text-sm font-bold text-ink-800">
        Mensagem
        <textarea
          name="message"
          required
          rows={5}
          defaultValue={`Olá! Vi no Subleasy a sala “${title}” (${about}) e tenho interesse. Ela está disponível? Pode me contar como funciona a locação?`}
          className={`${INPUT} py-2.5 leading-relaxed`}
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
  );
}
