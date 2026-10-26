"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Entra em cena quando aparece na tela: sobe 18px e ganha opacidade (ver [data-reveal] no globals.css).
 * `delay` escalona itens vizinhos. Depois de mostrado, fica visível.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  delay?: number;
  as?: "div" | "li" | "section" | "article";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        node.setAttribute("data-shown", "");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      data-reveal=""
      className={className}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
