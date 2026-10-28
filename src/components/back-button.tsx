"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react";

/**
 * Seta no canto superior esquerdo que volta à página anterior. Sem histórico (a pessoa abriu o
 * link direto), leva à página inicial em vez de não fazer nada.
 */
export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      aria-label="Voltar"
      className="focus-ring absolute top-[max(0.75rem,env(safe-area-inset-top))] left-3 grid size-11 place-items-center rounded-full text-ink-800 transition-colors hover:bg-ink-100 active:bg-ink-100 sm:top-5 sm:left-5"
    >
      <ArrowLeftIcon className="size-5" weight="bold" aria-hidden />
    </button>
  );
}
