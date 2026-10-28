"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ListingView, type PublicListing } from "./listing-view";

const DESKTOP = "(min-width: 1024px)";
const subscribe = (callback: () => void) => {
  const query = window.matchMedia(DESKTOP);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};

/**
 * Prévia do anúncio como o visitante vai vê-lo no site, em escala menor. É a própria página
 * do anúncio desenhada numa largura de tela cheia e reduzida; nada nela é clicável.
 */
export function ListingPreview({ listing }: { listing: PublicListing }) {
  const desktop = useSyncExternalStore(subscribe, () => window.matchMedia(DESKTOP).matches, () => true);
  const width = desktop ? 1200 : 390;
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [outer, setOuter] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const outerEl = outerRef.current;
    const innerEl = innerRef.current;
    if (!outerEl || !innerEl) return;
    const measure = new ResizeObserver(() => {
      setOuter(outerEl.clientWidth);
      setHeight(innerEl.offsetHeight);
    });
    measure.observe(outerEl);
    measure.observe(innerEl);
    return () => measure.disconnect();
  }, []);

  const scale = outer ? outer / width : 0.5;
  return (
    <div className="overflow-hidden rounded-panel bg-white shadow-card ring-1 ring-ink-900/8">
      {/* Barra de navegador: deixa claro que é a página do anúncio no site. */}
      <div className="flex items-center gap-2 border-b border-ink-200 bg-ink-50 px-4 py-2.5" aria-hidden>
        <span className="size-2.5 rounded-full bg-ink-300" />
        <span className="size-2.5 rounded-full bg-ink-300" />
        <span className="size-2.5 rounded-full bg-ink-300" />
        <span className="ml-2 truncate rounded-full bg-white px-3 py-1 text-xs text-ink-500 ring-1 ring-ink-200">subleasy.com.br/sala/…</span>
      </div>
      <div ref={outerRef} className="relative max-h-[36rem] overflow-hidden" style={{ height: height * scale || undefined }} aria-label="Prévia do anúncio" role="img">
        <div ref={innerRef} inert className="origin-top-left bg-white p-8 select-none" style={{ width, transform: `scale(${scale})` }}>
          <ListingView listing={listing} host={null} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" aria-hidden />
      </div>
    </div>
  );
}
