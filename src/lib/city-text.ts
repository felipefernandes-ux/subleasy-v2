// Texto de cidade: funções puras, usadas no servidor e no navegador.

export type CityOption = {
  city: string;
  state: string;
  count: number;
  key: string;
  types: string[];
  /** Entre as cidades que mais receberam anúncios nos últimos 7 dias. */
  trending: boolean;
};

const SMALL_WORDS = new Set(["de", "da", "do", "das", "dos", "e"]);

/** Cidade sem acento, em minúsculas e sem espaço sobrando: "Maringá " e "maringa" viram a mesma chave. */
export function normalizeCity(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** "maringá" e "SÃO PAULO" ficam "Maringá" e "São Paulo". Quem já escreveu com maiúsculas e minúsculas fica como está. */
export function displayCity(value: string) {
  const text = value.trim().replace(/\s+/g, " ");
  if (text !== text.toLowerCase() && text !== text.toUpperCase()) return text;
  return text
    .toLowerCase()
    .split(" ")
    .map((word, index) => (index > 0 && SMALL_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}


/** Acha a cidade da lista que o texto da URL nomeia, ou null. Só vale para cidade com sala no ar. */
export function findCity(cities: CityOption[], text: string) {
  const wanted = normalizeCity(text);
  return wanted ? (cities.find((option) => option.key.split("|")[0] === wanted) ?? null) : null;
}
