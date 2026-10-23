"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowSquareOutIcon, CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { WhatsAppIcon, buttonClasses } from "./ui";

/** Link da sala com copiar, abrir e mandar no WhatsApp. */
export function ShareLink({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const share = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 rounded-control bg-ink-50 p-1.5 pl-4 ring-1 ring-ink-200">
        <span className="min-w-0 flex-1 truncate text-sm text-ink-800">{url}</span>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className={buttonClasses("secondary")}
        >
          {copied ? <CheckIcon className="size-4 text-mint-700" weight="bold" aria-hidden /> : <CopyIcon className="size-4" aria-hidden />}
          <span aria-live="polite">{copied ? "Copiado" : "Copiar link"}</span>
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <a href={share} target="_blank" rel="noopener noreferrer" className={buttonClasses("whatsapp", "lg")}>
          <WhatsAppIcon className="size-5" />
          Mandar no WhatsApp
        </a>
        <Link href={url} className={buttonClasses("secondary", "lg")}>
          <ArrowSquareOutIcon className="size-5" aria-hidden />
          Abrir anúncio
        </Link>
      </div>
    </div>
  );
}
