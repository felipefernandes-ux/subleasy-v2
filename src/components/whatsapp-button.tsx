"use client";

import { useState, useTransition } from "react";
import { CircleNotchIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { getWhatsAppLink } from "@/app/actions/listing";
import { InquiryForm } from "./inquiry-form";
import { WhatsAppIcon, buttonClasses } from "./ui";

/**
 * Busca o número só no clique (LGPD) e abre a conversa numa nova aba, com mensagem pronta.
 * O e-mail, quando o anunciante informou, fica como segunda opção: o formulário abre no
 * próprio bloco, no lugar dos botões.
 */
export function WhatsAppButton({ listingId, title, about, email = false }: { listingId: string; title: string; about: string; email?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const [writing, setWriting] = useState(false);

  if (writing) return <InquiryForm listingId={listingId} title={title} about={about} onCancel={() => setWriting(false)} />;

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          // A aba abre já no clique (depois de esperar o servidor, o navegador bloquearia); o endereço chega em seguida.
          const tab = window.open("", "_blank");
          startTransition(async () => {
            const link = await getWhatsAppLink(listingId, title);
            if (!link) {
              tab?.close();
              setFailed(true);
            } else if (tab) {
              tab.opener = null;
              tab.location.href = link;
            } else {
              window.location.href = link;
            }
          });
        }}
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
