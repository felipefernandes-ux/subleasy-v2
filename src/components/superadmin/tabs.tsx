"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";

type Tab = { id: string; label: string; content: ReactNode };

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

/**
 * Abas com troca animada. Os painéis ficam montados na mesma célula da grade: o ativo aparece (fade e subida
 * leve) e o outro sai, sem mudar a altura da página nem refazer a busca de dados. Respeita "reduzir movimento".
 */
export function Tabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const [active, setActive] = useState(tabs[0].id);
  const uid = useId();

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = tabs[(index + step + tabs.length) % tabs.length];
    setActive(next.id);
    document.getElementById(`${uid}-tab-${next.id}`)?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label={label} className="mb-4 flex gap-1 border-b border-sa-line">
        {tabs.map((tab, index) => {
          const current = tab.id === active;
          return (
            <button
              key={tab.id}
              id={`${uid}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={current}
              aria-controls={`${uid}-panel-${tab.id}`}
              tabIndex={current ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cx(
                "-mb-px border-b-2 px-3 pb-2.5 pt-1 text-sa-base transition-colors duration-200",
                current
                  ? "border-brand-600 font-semibold text-brand-700"
                  : "border-transparent text-sa-muted hover:text-sa-ink",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid">
        {tabs.map((tab) => {
          const current = tab.id === active;
          return (
            <div
              key={tab.id}
              id={`${uid}-panel-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`${uid}-tab-${tab.id}`}
              inert={!current}
              className={cx(
                "col-start-1 row-start-1 transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none",
                current ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
              )}
            >
              {tab.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
