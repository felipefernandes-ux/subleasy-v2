import { cacheLife } from "next/cache";
import { normalizeCity } from "@/lib/city-text";

export type Municipio = { name: string; uf: string; key: string };

type IbgeMunicipio = {
  nome: string;
  microrregiao?: { mesorregiao?: { UF?: { sigla?: string } } } | null;
  "regiao-imediata"?: { "regiao-intermediaria"?: { UF?: { sigla?: string } } } | null;
};

/**
 * Os 5.571 municípios do Brasil, da API de localidades do IBGE (dado público, sem chave).
 * Serve para completar o estado de uma cidade pelo nome e sugerir cidades ao digitar. Guardada por dias.
 */
export async function getMunicipios(): Promise<Municipio[]> {
  "use cache";
  cacheLife("days");

  try {
    const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome");
    if (!response.ok) return [];
    const data = (await response.json()) as IbgeMunicipio[];
    return data.flatMap((item) => {
      const uf = item.microrregiao?.mesorregiao?.UF?.sigla ?? item["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla;
      return uf ? [{ name: item.nome, uf, key: normalizeCity(item.nome) }] : [];
    });
  } catch (error) {
    console.error("[getMunicipios]", error);
    return [];
  }
}

/** Cidades que começam com o texto, depois as que o contêm, sem acento nem caixa. */
export async function searchMunicipios(text: string, limit = 6): Promise<Municipio[]> {
  const query = normalizeCity(text);
  if (query.length < 2) return [];
  const all = await getMunicipios();
  const starts = all.filter((item) => item.key.startsWith(query));
  const contains = all.filter((item) => !item.key.startsWith(query) && item.key.includes(query));
  return [...starts, ...contains].slice(0, limit);
}
