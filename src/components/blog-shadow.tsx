"use client";

import { useEffect, useRef } from "react";

// Distância do topo que o título deve ficar ao rolar: o cabeçalho do site é fixo (sticky) e cobriria o título.
const SCROLL_OFFSET = 96;

// O conteúdo do WordPress vive num shadow root: o CSS dele (Bricks, tema) fica isolado do CSS do site,
// e o do site não o desmonta. No primeiro carregamento o navegador cria o shadow root sozinho a partir
// do <template shadowrootmode>, já com o HTML vindo do servidor. Numa navegação do Next (innerHTML)
// o navegador não cria esse shadow root, então o efeito abaixo o monta a partir do mesmo template.
//
// O Next não carrega o JavaScript do Bricks, e o navegador não leva um link #âncora a um alvo dentro de um
// shadow root. Por isso `enhance` refaz aqui duas coisas que o Bricks fazia: o menu "Neste artigo"
// (nav.brxe-post-toc, que vem vazio do servidor) e a rolagem dos links de âncora, inclusive o Índice do
// Rank Math no corpo do post.
export function BlogShadow({ html }: { html: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!host.shadowRoot) {
      const template = host.querySelector("template");
      if (!template) return;
      host.attachShadow({ mode: "open" }).append(template.content.cloneNode(true));
      template.remove();
    }
    return host.shadowRoot ? enhance(host.shadowRoot) : undefined;
  }, [html]);

  return (
    <div
      ref={hostRef}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: `<template shadowrootmode="open">${html}</template>` }}
    />
  );
}

function enhance(root: ShadowRoot) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const scrollToId = (id: string, smooth: boolean) => {
    const target = root.getElementById(id);
    if (!target) return false;
    const top = target.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top, behavior: smooth && !reduceMotion.matches ? "smooth" : "auto" });
    return true;
  };

  // Menu "Neste artigo": um link por título, na mesma estrutura que o Bricks gera (as classes já têm CSS).
  const nav = root.querySelector<HTMLElement>("nav.brxe-post-toc");
  const content = root.querySelector<HTMLElement>(nav?.dataset.contentSelector || ".sb-prose");
  const headings = nav && content ? collectHeadings(root, content, nav.dataset.headingSelectors || "h2") : [];
  const links = new Map<string, HTMLAnchorElement>();

  if (nav && headings.length) {
    const list = document.createElement("ul");
    list.className = "toc-list";
    for (const heading of headings) {
      const item = document.createElement("li");
      item.className = "toc-list-item";
      const link = document.createElement("a");
      link.className = `toc-link node-name--${heading.tagName}`;
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent?.trim() ?? "";
      item.append(link);
      list.append(item);
      links.set(heading.id, link);
    }
    nav.replaceChildren(list);
  }

  // Destaca no menu a seção que está sob o cabeçalho.
  let frame = 0;
  let activeId = "";
  const highlight = () => {
    frame = 0;
    let current = headings[0]?.id ?? "";
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top - SCROLL_OFFSET - 8 <= 0) current = heading.id;
      else break;
    }
    if (current === activeId) return;
    activeId = current;
    for (const [id, link] of links) link.classList.toggle("is-active-link", id === current);
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(highlight);
  };

  // Clique em qualquer link #âncora do conteúdo (menu e Índice do corpo): rola até o título dentro do shadow root.
  const onClick = (event: Event) => {
    const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    const hash = anchor?.getAttribute("href");
    if (!anchor || !hash || hash.length < 2) return;
    let id = hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {}
    if (!root.getElementById(id)) return;
    event.preventDefault();
    scrollToId(id, true);
    history.replaceState(history.state, "", `${location.pathname}${location.search}#${encodeURIComponent(id)}`);
  };

  root.addEventListener("click", onClick);
  window.addEventListener("scroll", onScroll, { passive: true });
  highlight();

  // Endereço com #seção (link compartilhado): o navegador não acha o alvo no shadow root, então rolamos aqui.
  if (location.hash.length > 1) {
    let id = location.hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {}
    requestAnimationFrame(() => scrollToId(id, false));
  }

  return () => {
    root.removeEventListener("click", onClick);
    window.removeEventListener("scroll", onScroll);
    if (frame) cancelAnimationFrame(frame);
  };
}

// Os títulos do conteúdo, com id (cria um quando falta). O Índice do Rank Math não entra no próprio menu.
function collectHeadings(root: ShadowRoot, content: HTMLElement, selector: string) {
  const result: HTMLElement[] = [];
  for (const heading of content.querySelectorAll<HTMLElement>(selector)) {
    if (heading.closest("#rank-math-toc") || !heading.textContent?.trim()) continue;
    if (!heading.id) {
      const base = slugify(heading.textContent) || "secao";
      let id = base;
      for (let n = 2; root.getElementById(id); n++) id = `${base}-${n}`;
      heading.id = id;
    }
    result.push(heading);
  }
  return result;
}

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
