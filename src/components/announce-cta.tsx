"use client";

import { useSignedIn } from "@/lib/use-signed-in";
import { AnnounceAiIcon } from "./announce-ai-icon";
import { buttonClasses } from "./ui";

/**
 * "Anunciar grátis" do cabeçalho. Quem já está logado não vê: tem o painel e, no celular, a aba
 * Anunciar. Enquanto a sessão é conferida o botão aparece, que é o caso de quem ainda não tem conta.
 * Celular: compacto (altura pelo conteúdo, 8px 12px, fonte menor) e com o ícone de IA.
 */
export function AnnounceCta() {
  const signedIn = useSignedIn();
  if (signedIn) return null;
  return (
    <a
      href="/anunciar"
      className={`${buttonClasses("primary")} max-sm:h-auto max-sm:gap-1.5 max-sm:px-3 max-sm:py-2 max-sm:text-[0.8125rem] max-sm:leading-tight`}
    >
      <AnnounceAiIcon className="size-5 sm:hidden" sparkle="var(--color-mint-400)" halo="var(--color-brand-600)" />
      Anunciar grátis
    </a>
  );
}
