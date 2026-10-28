"use client";

import { useSearchLayout } from "./search-layout";

/** Esqueleto da lista e do mapa, mostrado enquanto os anúncios carregam. */
export function ResultsSkeleton() {
  const { showMap } = useSearchLayout();
  return (
    <>
      <section aria-label="Carregando salas" aria-busy="true" className="min-w-0 flex-1 px-5 pt-6 pb-24 sm:px-8">
        <div className="h-5 w-36 animate-pulse rounded-sm bg-ink-100" />
        <ul className={`mt-4 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 ${showMap ? "xl:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4"}`}>
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index} className="min-w-0">
              <div className="aspect-[4/3] animate-pulse rounded-card bg-ink-100" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded-sm bg-ink-100" />
              <div className="mt-2 h-3.5 w-1/2 animate-pulse rounded-sm bg-ink-100" />
              <div className="mt-2 h-3.5 w-1/4 animate-pulse rounded-sm bg-ink-100" />
            </li>
          ))}
        </ul>
      </section>
      {showMap && <aside aria-hidden className="sticky top-[8.25rem] hidden h-[calc(100dvh-8.25rem)] w-[42%] shrink-0 animate-pulse border-l border-ink-200 bg-ink-100 lg:block" />}
    </>
  );
}
