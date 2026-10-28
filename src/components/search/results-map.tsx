"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { formatPrice } from "@/lib/listing-options";
import { MAP_MAX_ZOOM, addBaseTiles } from "@/lib/map-tiles";
import type { SearchResult } from "./result-card";

// Marcador com o preço, como no Airbnb. As classes ficam escritas por inteiro aqui
// para o Tailwind gerá-las (ele lê o código-fonte).
const PIN = "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold shadow-raised ring-1 transition-transform";
const PIN_IDLE = "bg-white text-ink-900 ring-ink-900/10";
const PIN_ACTIVE = "scale-110 bg-ink-900 text-white ring-ink-900";

/**
 * Mapa da busca: um marcador de preço por sala com localização. Passar o mouse num
 * cartão destaca o marcador; clicar no marcador abre a sala numa nova aba.
 */
export function ResultsMap({ results, highlighted, onHover }: { results: SearchResult[]; highlighted: string | null; onHover: (id: string | null) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef(new Map<string, { marker: Marker; html: (active: boolean) => string }>());
  const onHoverRef = useRef(onHover);
  const [ready, setReady] = useState(false);
  const located = results.filter((result) => result.latitude !== null && result.longitude !== null);

  useEffect(() => {
    onHoverRef.current = onHover;
  });

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, { zoomControl: true, maxZoom: MAP_MAX_ZOOM }).setView([-15.8, -47.9], 4);
      addBaseTiles(L, map);
      mapRef.current = map;
      setReady(true);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Marcadores refeitos quando a lista muda (filtro novo); o mapa enquadra todos.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    let cancelled = false;
    const markers = markersRef.current;
    import("leaflet").then((L) => {
      if (cancelled) return;
      for (const result of located) {
        const html = (active: boolean) => `<span class="${PIN} ${active ? PIN_ACTIVE : PIN_IDLE}">${formatPrice(result.price)}</span>`;
        const marker = L.marker([result.latitude!, result.longitude!], {
          icon: L.divIcon({ className: "", html: html(false), iconSize: undefined, iconAnchor: [28, 14] }),
          // Sem endereço exato, o marcador fica na área do bairro.
          title: result.approximate ? `${result.title} (área aproximada)` : result.title,
          riseOnHover: true,
        })
          .on("mouseover", () => onHoverRef.current(result.id))
          .on("mouseout", () => onHoverRef.current(null))
          .on("click", () => window.open(`/espaco/${result.slug}`, "_blank", "noopener"))
          .addTo(map);
        markers.set(result.id, { marker, html });
      }
      if (located.length === 1) map.setView([located[0].latitude!, located[0].longitude!], 14);
      else if (located.length > 1) map.fitBounds(L.latLngBounds(located.map((result) => [result.latitude!, result.longitude!])), { padding: [48, 48], maxZoom: 15 });
    });
    return () => {
      cancelled = true;
      for (const { marker } of markers.values()) marker.remove();
      markers.clear();
    };
    // located é derivado de results; refazer só quando results muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, results]);

  // Destaque do marcador do cartão sob o mouse.
  useEffect(() => {
    import("leaflet").then((L) => {
      for (const [id, { marker, html }] of markersRef.current) {
        const active = id === highlighted;
        marker.setIcon(L.divIcon({ className: "", html: html(active), iconAnchor: [28, 14] }));
        marker.setZIndexOffset(active ? 1000 : 0);
      }
    });
  }, [highlighted]);

  return (
    <div className="relative size-full">
      <div ref={containerRef} className="isolate z-0 size-full bg-ink-100 [&_.leaflet-tile-pane]:grayscale" />
      {ready && located.length < results.length && (
        <p className="pointer-events-none absolute right-3 bottom-8 left-3 z-[400] rounded-control bg-white/95 px-3 py-2 text-center text-xs text-ink-600 shadow-xs">
          {results.length - located.length} {results.length - located.length === 1 ? "sala não aparece" : "salas não aparecem"} no mapa: não achamos o bairro informado.
        </p>
      )}
    </div>
  );
}
