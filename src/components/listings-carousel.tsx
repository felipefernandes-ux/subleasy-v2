"use client";

import { useRef, useState } from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { ResultCard, type SearchResult } from "./search/result-card";

/**
 * Salas no ar na home: 3 por vez no desktop (2 no tablet, uma e um pedaço no celular),
 * com setas que avançam uma tela inteira.
 */
export function ListingsCarousel({ listings }: { listings: SearchResult[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: listings.length <= 3 });

  const update = () => {
    const track = trackRef.current;
    if (!track) return;
    setEdges({ start: track.scrollLeft < 8, end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 8 });
  };
  const page = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (track) track.scrollBy({ left: direction * track.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div className="absolute -top-14 right-0 hidden gap-2 sm:flex">
        <Arrow label="Salas anteriores" disabled={edges.start} onClick={() => page(-1)}>
          <CaretLeftIcon className="size-4.5" weight="bold" aria-hidden />
        </Arrow>
        <Arrow label="Próximas salas" disabled={edges.end} onClick={() => page(1)}>
          <CaretRightIcon className="size-4.5" weight="bold" aria-hidden />
        </Arrow>
      </div>
      <ul
        ref={trackRef}
        onScroll={update}
        className="-mx-5 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {listings.map((listing) => (
          <li key={listing.id} className="w-[82%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]">
            <ResultCard listing={listing} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Arrow({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="focus-ring grid size-10 place-items-center rounded-full bg-white text-ink-900 ring-1 ring-ink-300 transition hover:shadow-raised disabled:opacity-35 disabled:hover:shadow-none"
    >
      {children}
    </button>
  );
}
