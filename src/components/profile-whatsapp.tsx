"use client";

import { useState, useTransition } from "react";
import { CircleNotchIcon } from "@phosphor-icons/react";
import { revealProfileWhatsApp } from "@/app/actions/public-profile";
import { WhatsAppIcon, buttonClasses } from "./ui";

/** "Mostrar WhatsApp" do perfil: o número chega do servidor só no clique, com o link da conversa. */
export function ProfileWhatsApp({ publicId, name }: { publicId: string; name: string }) {
  const [contact, setContact] = useState<{ display: string; link: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (contact) {
    return (
      <div className="rounded-card bg-ink-50 p-4 ring-1 ring-ink-200">
        <p className="text-xs text-ink-500">WhatsApp de {name}</p>
        <p className="mt-0.5 text-lg font-bold text-ink-900 tabular-nums select-all">{contact.display}</p>
        <a href={contact.link} target="_blank" rel="noopener noreferrer" className={`${buttonClasses("whatsapp")} mt-3 w-full`}>
          <WhatsAppIcon className="size-5" />
          Abrir conversa
        </a>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await revealProfileWhatsApp(publicId, name);
            if (result) setContact(result);
            else setFailed(true);
          })
        }
        className={`${buttonClasses("secondary", "lg")} w-full disabled:cursor-wait`}
      >
        {isPending ? <CircleNotchIcon className="size-5 animate-spin" weight="bold" aria-hidden /> : <WhatsAppIcon className="size-5 text-whatsapp-hover" />}
        Mostrar WhatsApp
      </button>
      {failed && (
        <p role="status" className="mt-2 text-center text-sm text-ink-600">
          O WhatsApp não está disponível agora. Fale pelos botões dos anúncios.
        </p>
      )}
    </div>
  );
}
