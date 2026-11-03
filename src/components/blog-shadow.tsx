"use client";

import { useEffect, useRef } from "react";

// O conteúdo do WordPress vive num shadow root: o CSS dele (Bricks, tema) fica isolado do CSS do site,
// e o do site não o desmonta. No primeiro carregamento o navegador cria o shadow root sozinho a partir
// do <template shadowrootmode>, já com o HTML vindo do servidor. Numa navegação do Next (innerHTML)
// o navegador não cria esse shadow root, então o efeito abaixo o monta a partir do mesmo template.
export function BlogShadow({ html }: { html: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || host.shadowRoot) return;
    const template = host.querySelector("template");
    if (!template) return;
    host.attachShadow({ mode: "open" }).append(template.content.cloneNode(true));
    template.remove();
  }, [html]);

  return (
    <div
      ref={hostRef}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: `<template shadowrootmode="open">${html}</template>` }}
    />
  );
}
