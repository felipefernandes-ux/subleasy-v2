import type * as Leaflet from "leaflet";

// Light Gray Canvas (Esri): base cinza e minimalista, sem chave de API. Os nomes de
// ruas e bairros vêm numa segunda camada, por cima da base.
const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas";
const ATTRIBUTION = 'Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
export const MAP_MAX_ZOOM = 16;

/** Base do mapa do Subleasy, igual em todas as telas. */
export function addBaseTiles(L: typeof Leaflet, map: Leaflet.Map) {
  L.tileLayer(`${ESRI}/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`, { maxZoom: MAP_MAX_ZOOM, attribution: ATTRIBUTION }).addTo(map);
  L.tileLayer(`${ESRI}/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, { maxZoom: MAP_MAX_ZOOM }).addTo(map);
}
