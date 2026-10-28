"use client";

import Link from "next/link";
import { Suspense, use, useEffect, useState } from "react";
import { ListIcon, MapTrifoldIcon } from "@phosphor-icons/react";
import { ResultCard, type SearchResult } from "./result-card";
import { ResultsMap } from "./results-map";
import { useSearchLayout } from "./search-layout";

/** Pontos aproximados (área do bairro) das salas sem localização, por id. Chegam depois da lista. */
export type AreaPoints = Record<string, [number, number]>;

/** Lê o que o servidor ainda está resolvendo e entrega ao mapa, sem travar a lista. */
function AreaPointsReader({ promise, onPoints }: { promise: Promise<AreaPoints>; onPoints: (points: AreaPoints) => void }) {
  const points = use(promise);
  useEffect(() => onPoints(points), [points, onPoints]);
  return null;
}

/**
 * Grade de salas à esquerda e mapa com os preços à direita. A lista aparece assim que
 * o banco responde; a posição das salas sem coordenadas chega depois e só move o mapa.
 */
export function SearchResults({ results, areaPoints }: { results: SearchResult[]; areaPoints: Promise<AreaPoints> }) {
  const { showMap, highlighted, setHighlighted } = useSearchLayout();
  const [mobileMap, setMobileMap] = useState(false);
  const [extra, setExtra] = useState<AreaPoints>({});

  const placed = results.map((result) => {
    const point = extra[result.id];
    return point && result.latitude === null ? { ...result, latitude: point[0], longitude: point[1] } : result;
  });

  return (
    <>
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
          <ul className={`mt-4 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 ${showMap ? "xl:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4"}`}>
            {results.map((result, index) => (
              <li key={result.id} className="min-w-0">
                <ResultCard listing={result} onHover={setHighlighted} priority={index < 3} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <AreaPointsSlot promise={areaPoints} onPoints={setExtra} />

      {/* Desktop: mapa fixo ao lado, da altura da tela abaixo dos filtros. */}
      {showMap && (
        <aside aria-label="Mapa" className="sticky top-[8.25rem] hidden h-[calc(100dvh-8.25rem)] w-[42%] shrink-0 border-l border-ink-200 lg:block">
          <ResultsMap results={placed} highlighted={highlighted} onHover={setHighlighted} />
        </aside>
      )}

      {/* Celular: o mapa abre por cima da lista, como no Airbnb. */}
      {mobileMap && (
        <div className="fixed inset-x-0 top-[8.25rem] bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 lg:hidden">
          <ResultsMap results={placed} highlighted={highlighted} onHover={setHighlighted} />
        </div>
      )}
      <button
        type="button"
        onClick={() => setMobileMap((current) => !current)}
        className="focus-ring fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-30 inline-flex h-12 -translate-x-1/2 items-center gap-2 rounded-full bg-ink-900 px-5 text-sm font-bold text-white shadow-raised lg:hidden"
      >
        {mobileMap ? <ListIcon className="size-4.5" aria-hidden /> : <MapTrifoldIcon className="size-4.5" aria-hidden />}
        {mobileMap ? "Ver lista" : "Ver mapa"}
      </button>
    </>
  );
}

function AreaPointsSlot(props: { promise: Promise<AreaPoints>; onPoints: (points: AreaPoints) => void }) {
  return (
    <Suspense fallback={null}>
      <AreaPointsReader {...props} />
    </Suspense>
  );
}
