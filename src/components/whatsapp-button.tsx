"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { CircleNotchIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";
import posthog from "posthog-js";
import { getWhatsAppLink } from "@/app/actions/listing";
import { trackContact } from "@/lib/analytics";
import { InquiryForm } from "./inquiry-form";
import { WhatsAppIcon, buttonClasses } from "./ui";

/**
 * Abre a conversa do WhatsApp do anunciante. O número só sai do servidor no clique (LGPD) e a aba abre
 * já no clique (depois de esperar o servidor, o navegador bloquearia); o endereço chega em seguida.
 * Usado pelo bloco de contato e pela barra fixa do celular.
 */
function useWhatsApp(listingId: string, title: string) {
  const [isPending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function open() {
    const tab = window.open("", "_blank");
    startTransition(async () => {
      const link = await getWhatsAppLink(listingId, title);
      if (!link) {
        tab?.close();
        setFailed(true);
      } else if (tab) {
        posthog.capture("listing_contact_initiated", { listing_id: listingId, contact_channel: "whatsapp" });
        void trackContact("whatsapp_click", listingId);
        tab.opener = null;
        tab.location.href = link;
      } else {
        posthog.capture("listing_contact_initiated", { listing_id: listingId, contact_channel: "whatsapp" });
        void trackContact("whatsapp_click", listingId);
        window.location.href = link;
      }
    });
  }

  return { open, isPending, failed };
}

/**
 * Busca o número só no clique (LGPD) e abre a conversa numa nova aba, com mensagem pronta.
 * O e-mail, quando o anunciante informou, fica como segunda opção: o formulário abre no
 * próprio bloco, no lugar dos botões. Anúncio sem WhatsApp (whatsapp=false) não mostra o botão:
 * o formulário é o contato principal e já aparece aberto.
 */
export function WhatsAppButton({
  listingId,
  title,
  about,
  whatsapp = true,
  email = false,
}: {
  listingId: string;
  title: string;
  about: string;
  whatsapp?: boolean;
  email?: boolean;
}) {
  const { open: openWhatsApp, isPending, failed } = useWhatsApp(listingId, title);
  const [writing, setWriting] = useState(false);

  if (!whatsapp) return <InquiryForm listingId={listingId} title={title} about={about} />;
  if (writing) return <InquiryForm listingId={listingId} title={title} about={about} onCancel={() => setWriting(false)} />;

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={openWhatsApp}
        className="focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-control bg-whatsapp px-5 text-base font-bold whitespace-nowrap text-white shadow-xs transition-colors hover:bg-whatsapp-hover disabled:cursor-wait disabled:opacity-80 sm:h-13"
      >
        {isPending ? <CircleNotchIcon className="size-5 animate-spin" weight="bold" aria-hidden /> : <WhatsAppIcon className="size-5" />}
        Falar no WhatsApp
      </button>
      {email && (
        <button type="button" onClick={() => setWriting(true)} className={`${buttonClasses("ghost")} mt-2 w-full`}>
          <EnvelopeSimpleIcon className="size-4" aria-hidden />
          Prefiro enviar por e-mail
        </button>
      )}
      <p className="mt-3 text-center text-xs text-ink-500" aria-live="polite">
        {failed ? "Esta sala não está recebendo contatos agora." : "Você fala direto com o anunciante. Sem comissão."}
      </p>
    </div>
  );
}

/**
 * Botão da barra fixa do celular, no lugar de "Entrar em contato". Com WhatsApp abre a conversa direto;
 * sem WhatsApp abre o formulário numa folha que sobe de baixo. O bloco de contato da página fica como está.
 */
export function MobileContact({ listingId, title, about, whatsapp }: { listingId: string; title: string; about: string; whatsapp: boolean }) {
  const { open, isPending, failed } = useWhatsApp(listingId, title);
  const [sheet, setSheet] = useState(false);

  if (whatsapp) {
    return (
      <button
        type="button"
        onClick={open}
        disabled={isPending || failed}
        className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-control bg-whatsapp px-5 text-sm font-bold whitespace-nowrap text-white shadow-xs transition-colors hover:bg-whatsapp-hover disabled:cursor-wait disabled:opacity-80"
      >
        {isPending ? <CircleNotchIcon className="size-5 animate-spin" weight="bold" aria-hidden /> : <WhatsAppIcon className="size-5" />}
        {failed ? "Sem contato agora" : "Falar no WhatsApp"}
      </button>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setSheet(true)} className={`${buttonClasses("primary")} whitespace-nowrap`}>
        <EnvelopeSimpleIcon className="size-5" aria-hidden />
        Enviar mensagem
      </button>
      {sheet && <ContactSheet listingId={listingId} title={title} about={about} onClose={() => setSheet(false)} />}
    </>
  );
}

/** Folha que sobe de baixo com o formulário. Fecha com Esc, toque no fundo ou "Voltar"; trava a rolagem da página. */
function ContactSheet({ listingId, title, about, onClose }: { listingId: string; title: string; about: string; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // No body: a barra fixa tem backdrop-blur, que prenderia uma folha fixa dentro dela.
  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <div onClick={onClose} aria-hidden className="absolute inset-0 animate-veil-in bg-ink-900/50" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mensagem para o anunciante"
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 max-h-[92dvh] animate-sheet-up overflow-y-auto rounded-t-panel bg-white px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-raised outline-none"
      >
        <div aria-hidden className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ink-300" />
        <InquiryForm listingId={listingId} title={title} about={about} onCancel={onClose} />
      </div>
    </div>,
    document.body,
  );
}
