import { cacheLife, cacheTag } from "next/cache";
import { normalizeCity } from "@/lib/city-text";
import { parsePhotoSizes, type PhotoSizes } from "@/lib/listing-options";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Páginas próprias por cidade: /consultorios/santo-andre-sp. Cada uma tem a sua rota fixa em src/app/consultorios
 * (sem params, para a página ser estática) e usa o componente CityLanding.
 * Só entra aqui a cidade com demanda comprovada e pelo menos 3 anúncios no ar, para não criar página vazia.
 * Os textos de bairro são fatos curtos e conferidos: nada de "melhor bairro" ou dado que a gente não tem.
 */
export type CityNeighborhood = {
  name: string;
  /** Trechos que identificam o bairro no campo livre do anúncio. O primeiro bairro que casar fica com a sala. */
  match: string[];
  text: string;
};

export type CityPage = {
  slug: string;
  city: string;
  state: string;
  /** Cidade sem acento, a mesma chave da busca. */
  key: string;
  /** Imagem do topo, em /public. */
  art: string;
  neighborhoods: CityNeighborhood[];
  /** Prova para quem tem sala, tirada dos dados do site. Conferir antes de mudar. */
  hostProof?: string;
  /** Cidades vizinhas para os links do fim da página. Só aparecem as que têm sala no ar. */
  nearby: { city: string; state: string }[];
};

export const CITY_PAGES: CityPage[] = [
  {
    slug: "santo-andre-sp",
    city: "Santo André",
    state: "SP",
    key: "santo andre",
    art: "/cidades/santo-andre-sp.webp",
    // Novembro de 2026: 4 de 14 cliques no WhatsApp do site inteiro, mais que qualquer outra cidade.
    hostProof: "Santo André é a cidade com mais contatos pelo WhatsApp no Subleasy. Quem procura sala aqui já está no site.",
    // Ordem de exibição. Um anúncio com dois bairros ("Casa Branca, Centro") fica com o que vem primeiro no texto.
    neighborhoods: [
      {
        name: "Centro",
        match: ["centro"],
        text: "Perto da estação Santo André da Linha 10 da CPTM e dos terminais de ônibus. O paciente chega de trem de São Paulo, São Caetano e Mauá.",
      },
      {
        name: "Casa Branca",
        match: ["casa branca"],
        text: "Vizinho ao Centro, perto do comércio central. Fácil de achar para quem já conhece a região.",
      },
      {
        name: "Vila Guiomar",
        match: ["guiomar"],
        text: "Bairro residencial vizinho ao Centro, de ruas mais calmas. Combina com atendimento que pede silêncio, como psicoterapia.",
      },
      {
        name: "Jardim Bela Vista",
        match: ["bela vista"],
        text: "Perto do Shopping ABC, um ponto de referência fácil de explicar para quem vem pela primeira vez.",
      },
      {
        name: "Vila Assunção",
        match: ["assuncao"],
        text: "Bairro residencial próximo ao Centro.",
      },
    ],
    nearby: [
      { city: "São Caetano do Sul", state: "SP" },
      { city: "São Bernardo do Campo", state: "SP" },
      { city: "Mauá", state: "SP" },
      { city: "Diadema", state: "SP" },
    ],
  },
];

export const cityPagePath = (page: CityPage) => `/consultorios/${page.slug}`;

export function findCityPageBySlug(slug: string) {
  return CITY_PAGES.find((page) => page.slug === slug) ?? null;
}

/** A busca /espacos?local=Santo+André aponta (canonical) para a página da cidade, para as duas não disputarem a mesma busca. */
export function findCityPage(city: string, state: string) {
  const key = normalizeCity(city);
  return CITY_PAGES.find((page) => page.key === key && page.state === state) ?? null;
}

export type CityListing = {
  slug: string;
  title: string;
  space_type: string;
  neighborhood: string;
  city: string;
  state: string;
  price: number;
  billing_type: string;
  photos: string[];
  photo_sizes: PhotoSizes;
};

/**
 * Salas no ar na cidade e quantas há nas cidades vizinhas. Guardado por poucos minutos;
 * aprovar um anúncio renova na hora (tag "listings"), como a lista de cidades da busca.
 */
export async function getCityListings(page: CityPage) {
  "use cache";
  cacheTag("listings");
  cacheLife("minutes");

  const states = [...new Set([page.state, ...page.nearby.map((city) => city.state)])];
  const { data, error } = await createPublicClient()
    .from("listings")
    .select("slug, title, space_type, neighborhood, city, state, price, billing_type, photos, photo_sizes")
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .in("state", states)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(2000);
  if (error) console.error("[getCityListings]", error);

  const rows = data ?? [];
  const listings: CityListing[] = rows
    .filter((row) => row.state === page.state && normalizeCity(row.city) === page.key)
    .map((row) => ({ ...row, price: Number(row.price), photo_sizes: parsePhotoSizes(row.photo_sizes) }));
  const nearby = page.nearby
    .map((city) => ({ ...city, count: rows.filter((row) => row.state === city.state && normalizeCity(row.city) === normalizeCity(city.city)).length }))
    .filter((city) => city.count > 0);
  return { listings, nearby };
}

/** Bairro da lista que o texto livre do anúncio nomeia, ou null. */
export function neighborhoodOf(page: CityPage, text: string) {
  const value = normalizeCity(text);
  let best: CityNeighborhood | null = null;
  let bestAt = Infinity;
  for (const item of page.neighborhoods) {
    for (const term of item.match) {
      const at = value.indexOf(term);
      if (at !== -1 && at < bestAt) [best, bestAt] = [item, at];
    }
  }
  return best;
}
