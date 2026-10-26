"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRightIcon, buttonClasses } from "./ui";

export type GuideStep = { title: string; body: string; meta: string };
type Path = { id: "anfitriao" | "profissional"; tab: string; title: string; steps: readonly GuideStep[]; cta: { href: string; label: string } };

/**
 * Os dois lados da sublocação em abas. Os dois painéis ficam no HTML (o inativo com `hidden`),
 * e os links #anfitriao e #profissional abrem a aba certa.
 */
export function GuidePaths({ paths }: { paths: readonly [Path, Path] }) {
  const [active, setActive] = useState<Path["id"]>(paths[0].id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const fromHash = () => {
      const hash = window.location.hash.slice(1);
      if (paths.some((path) => path.id === hash)) setActive(hash as Path["id"]);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [paths]);

  // Setas trocam de aba, como pede o padrão de abas da WAI-ARIA.
  function onKey(event: KeyboardEvent, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = (index + 1) % paths.length;
    setActive(paths[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Escolha seu lado" className="relative inline-grid grid-cols-2 rounded-full bg-ink-100 p-1">
        {/* Pílula que desliza até a aba ativa. */}
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-card transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
          style={{ transform: active === paths[0].id ? "translateX(0)" : "translateX(100%)" }}
        />
        {paths.map((path, index) => (
          <button
            key={path.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`aba-${path.id}`}
            aria-controls={`painel-${path.id}`}
            aria-selected={active === path.id}
            tabIndex={active === path.id ? 0 : -1}
            onClick={() => setActive(path.id)}
            onKeyDown={(event) => onKey(event, index)}
            className={`focus-ring relative z-10 h-11 rounded-full px-4 text-sm font-bold transition-colors sm:px-6 sm:text-base ${
              active === path.id ? "text-brand-700" : "text-ink-600 hover:text-ink-900"
            }`}
          >
            {path.tab}
          </button>
        ))}
      </div>

      {paths.map((path) => (
        <div
          key={path.id}
          id={`painel-${path.id}`}
          role="tabpanel"
          aria-labelledby={`aba-${path.id}`}
          hidden={active !== path.id}
          className="mt-10"
        >
          <h3 className="text-h3 font-bold text-ink-900">{path.title}</h3>
          <ol className="relative mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(13rem,1fr))]">
            {path.steps.map((step, index) => (
              <li
                key={step.title}
                className="group relative flex animate-fade-up flex-col rounded-card border border-ink-200 bg-white p-5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-raised"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-control bg-brand-50 text-sm font-bold text-brand-700 tabular-nums transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-right text-xs font-bold text-mint-700">{step.meta}</span>
                </div>
                <h4 className="mt-5 text-lg leading-snug font-bold text-ink-900">{step.title}</h4>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{step.body}</p>
              </li>
            ))}
          </ol>
          <a href={path.cta.href} className={`${buttonClasses("primary", "lg")} mt-8`}>
            {path.cta.label}
            <ArrowRightIcon />
          </a>
        </div>
      ))}
    </div>
  );
}
