"use client";

import { Suspense, createContext, useContext, useState, type ReactNode } from "react";
import { MapTrifoldIcon } from "@phosphor-icons/react";
import { FilterBar } from "./filter-bar";

type LayoutState = {
  showMap: boolean;
  highlighted: string | null;
  setHighlighted: (id: string | null) => void;
};

const LayoutContext = createContext<LayoutState | null>(null);

export function useSearchLayout() {
  const state = useContext(LayoutContext);
  if (!state) throw new Error("useSearchLayout fora do SearchLayout");
  return state;
}

/**
 * Casca da busca, que não espera pelos anúncios: filtros fixos no topo e a área de
 * lista e mapa logo abaixo. O que está em `children` (os anúncios ou o esqueleto)
 * chega depois, sem trocar a casca.
 */
export function SearchLayout({ children }: { children: ReactNode }) {
  const [showMap, setShowMap] = useState(true);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  const toggle = (
    <button
      type="button"
      onClick={() => setShowMap((current) => !current)}
      aria-pressed={showMap}
      className="focus-ring hidden h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold text-ink-900 ring-1 ring-ink-300 transition-colors hover:bg-ink-50 lg:inline-flex"
    >
      <MapTrifoldIcon className="size-4.5" aria-hidden />
      {showMap ? "Ocultar mapa" : "Mostrar mapa"}
    </button>
  );

  return (
    <LayoutContext value={{ showMap, highlighted, setHighlighted }}>
      <div className="sticky top-16 z-30 border-b border-ink-200 bg-white/95 px-5 py-3 backdrop-blur-md sm:px-8">
        {/* Os filtros leem a URL; o esqueleto ocupa o lugar deles até ficarem prontos. */}
        <Suspense fallback={<FilterBarSkeleton />}>
          <FilterBar aside={toggle} />
        </Suspense>
      </div>
      <div className="flex">{children}</div>
    </LayoutContext>
  );
}

function FilterBarSkeleton() {
  return (
    <div aria-hidden className="flex items-center gap-2 py-1">
      {[56, 36, 32, 24, 36].map((width) => (
        <div key={width} className="h-10 shrink-0 animate-pulse rounded-full bg-ink-100" style={{ width: `${width * 4}px` }} />
      ))}
    </div>
  );
}
