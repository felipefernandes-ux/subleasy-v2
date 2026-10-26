"use client";

import Link from "next/link";
import { useState } from "react";
import { ListIcon, MapTrifoldIcon } from "@phosphor-icons/react";
import { FilterBar } from "./filter-bar";
import { ResultCard, type SearchResult } from "./result-card";
import { ResultsMap } from "./results-map";

/**
 * Busca no desenho dos sites de aluguel: filtros numa linha no topo, grade de salas
 * à esquerda e mapa com os preços à direita. O mapa pode ser escondido.
 */
export function SearchResults({ results }: { results: SearchResult[] }) {
  const [showMap, setShowMap] = useState(true);
  const [mobileMap, setMobileMap] = useState(false);
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
    <>
      <div className="sticky top-16 z-30 border-b border-ink-200 bg-white/95 px-5 py-3 backdrop-blur-md sm:px-8">
        <FilterBar aside={toggle} />
      </div>

      <div className="flex">
        <section aria-label="Salas encontradas" className="min-w-0 flex-1 px-5 pt-6 pb-24 sm:px-8">
          <p className="text-sm text-ink-600">
            <strong className="font-bold text-ink-900">{results.length}</strong> {results.length === 1 ? "sala encontrada" : "salas encontradas"}
          </p>

          {results.length === 0 ? (
            <div className="mt-10 max-w-md">
              <p className="text-h3 font-bold text-ink-900">Nenhuma sala com esses filtros</p>
              <p className="mt-2 text-ink-600">Tente outro bairro ou cidade, uma faixa de preço maior ou menos comodidades.</p>
              <Link href="/salas" className="focus-ring mt-4 inline-block rounded-sm font-bold text-brand-600 hover:text-brand-700">
                Ver todas as salas
              </Link>
            </div>
          ) : (
            <ul className={`mt-4 grid gap-x-6 gap-y-10 sm:grid-cols-2 ${showMap ? "xl:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4"}`}>
              {results.map((result) => (
                <li key={result.id}>
                  <ResultCard listing={result} onHover={setHighlighted} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Desktop: mapa fixo ao lado, da altura da tela abaixo dos filtros. */}
        {showMap && (
          <aside aria-label="Mapa" className="sticky top-[8.25rem] hidden h-[calc(100dvh-8.25rem)] w-[42%] shrink-0 border-l border-ink-200 lg:block">
            <ResultsMap results={results} highlighted={highlighted} onHover={setHighlighted} />
          </aside>
        )}
      </div>

      {/* Celular: o mapa abre por cima da lista, como no Airbnb. */}
      {mobileMap && (
        <div className="fixed inset-x-0 top-[8.25rem] bottom-0 z-20 lg:hidden">
          <ResultsMap results={results} highlighted={highlighted} onHover={setHighlighted} />
        </div>
      )}
      <button
        type="button"
        onClick={() => setMobileMap((current) => !current)}
        className="focus-ring fixed bottom-6 left-1/2 z-30 inline-flex h-12 -translate-x-1/2 items-center gap-2 rounded-full bg-ink-900 px-5 text-sm font-bold text-white shadow-raised lg:hidden"
      >
        {mobileMap ? <ListIcon className="size-4.5" aria-hidden /> : <MapTrifoldIcon className="size-4.5" aria-hidden />}
        {mobileMap ? "Ver lista" : "Ver mapa"}
      </button>
    </>
  );
}
