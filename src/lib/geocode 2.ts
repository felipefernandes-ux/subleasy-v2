import { cacheLife } from "next/cache";

/**
 * Centro de um bairro (ou, se ele não for achado, da cidade) pelo Nominatim, do
 * OpenStreetMap. Fica em cache por semanas: cada área é consultada uma vez só,
 * dentro do limite de uso gratuito do serviço.
 */
export async function geocodeArea(neighborhood: string, city: string, state: string): Promise<[number, number] | null> {
  "use cache";
  cacheLife("weeks");

  for (const query of [[neighborhood, city, state], [city, state]]) {
    const text = [...query, "Brasil"].filter(Boolean).join(", ");
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&accept-language=pt-BR&q=${encodeURIComponent(text)}`,
        { headers: { "User-Agent": "Subleasy/2.0 (https://subleasy.com.br)" } },
      );
      if (!response.ok) continue;
      const [place] = (await response.json()) as { lat: string; lon: string }[];
      if (place) return [Number(place.lat), Number(place.lon)];
    } catch (error) {
      console.error("[geocodeArea]", error);
    }
  }
  return null;
}

/**
 * Desloca um pouco (até ~350 m) o ponto de uma área, sempre igual para o mesmo anúncio,
 * para salas do mesmo bairro não ficarem empilhadas no mesmo marcador.
 */
export function spread([latitude, longitude]: [number, number], seed: string): [number, number] {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  const angle = ((hash >>> 0) % 360) * (Math.PI / 180);
  const meters = 120 + ((hash >>> 9) % 230);
  return [
    latitude + (meters * Math.cos(angle)) / 111_000,
    longitude + (meters * Math.sin(angle)) / (111_000 * Math.cos((latitude * Math.PI) / 180)),
  ];
}
