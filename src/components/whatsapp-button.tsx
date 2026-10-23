"use client";

import { useState, useTransition } from "react";
import { CircleNotchIcon } from "@phosphor-icons/react";
import { getWhatsAppLink } from "@/app/actions/listing";
import { WhatsAppIcon, buttonClasses } from "./ui";

/** Busca o número só no clique (LGPD) e abre a conversa com mensagem pronta. */
export function WhatsAppButton({ listingId, title }: { listingId: string; title: string }) {
  const [isPending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const link = await getWhatsAppLink(listingId, title);
            if (link) window.location.href = link;
            else setFailed(true);
          })
        }
        className={`${buttonClasses("whatsapp", "lg")} w-full disabled:cursor-wait disabled:opacity-80`}
      >
        {isPending ? <CircleNotchIcon className="size-5 animate-spin" weight="bold" aria-hidden /> : <WhatsAppIcon className="size-5" />}
        Falar no WhatsApp
      </button>
      <p className="mt-3 text-center text-xs text-ink-500" aria-live="polite">
        {failed ? "Esta sala não está recebendo contatos agora." : "Você fala direto com o anfitrião. Sem comissão."}
      </p>
    </div>
  );
}
