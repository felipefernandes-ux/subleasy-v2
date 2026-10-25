"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { APPROXIMATE_RADIUS_METERS } from "@/lib/listing-options";
import { MAP_MAX_ZOOM, addBaseTiles } from "@/lib/map-tiles";

// Pino desenhado em HTML: o ícone padrão do Leaflet depende de imagens que o bundler não serve.
const PIN = `<svg width="36" height="44" viewBox="0 0 36 44" aria-hidden="true"><path d="M18 43s15-13.7 15-25A15 15 0 0 0 3 18c0 11.3 15 25 15 25Z" fill="#3818d9" stroke="#fff" stroke-width="2"/><circle cx="18" cy="18" r="5.5" fill="#fff"/></svg>`;

/**
 * Mapa do OpenStreetMap com o pino exato ou uma área aproximada.
 * Com onMove, o pino pode ser arrastado para acertar o ponto.
 */
export function LocationMap({
  latitude,
  longitude,
  exact,
  onMove,
  className = "h-72",
}: {
  latitude: number;
  longitude: number;
  exact: boolean;
  onMove?: (latitude: number, longitude: number) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const onMoveRef = useRef(onMove);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onMoveRef.current = onMove;
  });

  // O Leaflet usa window: carrega só no navegador e cria o mapa uma vez.
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomControl: true, maxZoom: MAP_MAX_ZOOM });
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

  // Redesenha o pino (ou a área) quando o ponto ou a escolha de exibição mudam.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    let layer: { remove: () => void } | null = null;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled) return;
      if (exact) {
        const marker = L.marker([latitude, longitude], {
          icon: L.divIcon({ className: "", html: PIN, iconSize: [36, 44], iconAnchor: [18, 44] }),
          draggable: Boolean(onMoveRef.current),
          keyboard: false,
        });
        marker.on("dragend", () => {
          const point = marker.getLatLng();
          onMoveRef.current?.(point.lat, point.lng);
        });
        layer = marker.addTo(map);
      } else {
        layer = L.circle([latitude, longitude], {
          radius: APPROXIMATE_RADIUS_METERS,
          color: "#3818d9",
          weight: 2,
          fillColor: "#3818d9",
          fillOpacity: 0.14,
        }).addTo(map);
      }
      map.setView([latitude, longitude], exact ? 16 : 14);
    });
    return () => {
      cancelled = true;
      layer?.remove();
    };
  }, [ready, latitude, longitude, exact]);

  // Só as camadas do mapa ficam em cinza; o pino e a área seguem na cor da marca.
  return (
    <div
      ref={containerRef}
      className={`isolate z-0 overflow-hidden rounded-card bg-ink-100 ring-1 ring-ink-200 [&_.leaflet-tile-pane]:grayscale ${className}`}
    />
  );
}
