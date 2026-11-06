import type { Metadata } from "next";
import { findCity, type CityOption } from "@/lib/city-text";
import { SPACE_TYPE_KEYS, type SpaceType } from "@/lib/listing-options";

/** Nome do espaço no começo do título: "Consultório médico para alugar em São Paulo". */
const TIPO_TITLE: Record<SpaceType, string> = {
  consultorio_medico: "Consultório médico",
  odontologia: "Consultório odontológico",
  psicologia: "Sala de psicologia",
  estetica: "Sala de estética",
  terapias: "Espaço terapêutico",
  fisioterapia: "Sala de fisioterapia",
  nutricao: "Sala de nutrição",
  to_fono: "Sala de TO e fonoaudiologia",
  outro: "Sala",
};

type Params = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export type Landing = {
  /** Título da página e H1. */
  title: string;
  /** Cidade da lista, quando a busca nomeia uma com sala no ar. */
  city: CityOption | null;
  canonical: string;
  index: boolean;
};

/**
 * Página de destino por cidade e tipo: /espacos?local=São+Paulo&tipo=consultorio_medico.
 * O título só nomeia uma cidade que está na lista de cidades com sala no ar, e nunca o texto cru da URL:
 * assim ninguém fabrica uma página com título de sua escolha. Outras combinações de filtro não são indexadas.
 */
export function describeLanding(params: Params, cities: CityOption[]): Landing | null {
  const tipos = one(params.tipo).split(",").filter(Boolean);
  const tipo = tipos.length === 1 && (SPACE_TYPE_KEYS as string[]).includes(tipos[0]) ? (tipos[0] as SpaceType) : null;
  const city = findCity(cities, one(params.local));
  if (!city && !tipo) return null;

  const base = new URLSearchParams();
  if (city) base.set("local", city.city);
  if (tipo) base.set("tipo", tipo);
  const refined = ["cobranca", "min", "max", "comodidades"].some((key) => one(params[key]));
  const extraTipos = tipos.length > 1 || (tipos.length === 1 && !tipo);
  // Só indexa a combinação que tem sala: a cidade existe e, com tipo, tem ao menos uma sala desse tipo.
  const hasRooms = city ? !tipo || city.types.includes(tipo) : true;

  const where = city ? ` em ${city.city}` : " por hora, turno, dia ou mês";
  const title = tipo ? `${TIPO_TITLE[tipo]} para alugar${where}` : `Consultórios e salas para alugar${where}`;
  return {
    title,
    city,
    canonical: `/espacos?${base}`,
    index: hasRooms && !refined && !extraTipos && Boolean(one(params.local) ? city : true),
  };
}

export function landingIntro(count: number, landing: Landing) {
  const total = count === 1 ? "1 sala" : `${count} salas`;
  const place = landing.city ? ` em ${landing.city.city}` : "";
  return `${total}${place}, com preço e fotos. Fale direto com o anunciante pelo WhatsApp, sem comissão.`;
}

export function landingMetadata(landing: Landing): Metadata {
  return {
    title: landing.title,
    description: `${landing.title}: veja preço e fotos e fale direto com o anunciante pelo WhatsApp, sem comissão. Cobrança por hora, turno, dia ou mês.`,
    alternates: { canonical: landing.canonical },
    robots: landing.index ? undefined : { index: false, follow: true },
  };
}
