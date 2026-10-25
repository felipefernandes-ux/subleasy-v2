// Frase livre da busca da home ("sala para psicologia na Zona 7, por hora") vira os
// filtros da página /salas. Só o que dá para reconhecer com segurança; o resto vira local.

const TYPES: { key: string; pattern: RegExp }[] = [
  { key: "psicologia", pattern: /psic|terapia\b/ },
  { key: "fisioterapia", pattern: /fisio/ },
  { key: "nutricao", pattern: /nutri/ },
  { key: "estetica", pattern: /est[eé]tic|bem[- ]estar/ },
  { key: "odontologia", pattern: /odonto|dentist/ },
  { key: "consultorio_medico", pattern: /m[eé]dic/ },
  { key: "to_fono", pattern: /fono|terapia ocupacional/ },
  { key: "terapias", pattern: /terap[eê]utic|integrativ/ },
];

const BILLING: { key: string; pattern: RegExp }[] = [
  { key: "hora", pattern: /por hora|\bhora\b/ },
  { key: "turno", pattern: /por turno|\bturnos?\b/ },
  { key: "dia", pattern: /por dia|di[aá]ria/ },
  { key: "mes", pattern: /por m[eê]s|mensal/ },
];

const AMENITY: { key: string; pattern: RegExp }[] = [
  { key: "maca", pattern: /\bmaca\b/ },
  { key: "pia", pattern: /\bpia\b/ },
  { key: "ar_condicionado", pattern: /ar[- ]condicionado/ },
  { key: "estacionamento", pattern: /estacionamento/ },
];

// Palavras que encerram o nome do lugar: "na Zona 7 por hora" → "Zona 7".
const PLACE_END = /\s+(?:por|para|com|de manh[ãa]|à tarde|a tarde|à noite|manh[ãa]s?|tardes?|noites?|segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|domingo)\b.*$/i;

export function searchUrl(text: string) {
  const query = text.trim();
  const lower = query.toLowerCase();
  const params = new URLSearchParams();

  const tipos = TYPES.filter((item) => item.pattern.test(lower)).map((item) => item.key);
  const cobranca = BILLING.find((item) => item.pattern.test(lower))?.key;
  const comodidades = AMENITY.filter((item) => item.pattern.test(lower)).map((item) => item.key);
  // "na Zona 7", "no Centro", "em Maringá": o lugar vem depois da preposição.
  const place = query.match(/\b(?:na|no|em)\s+([^,]+)/i)?.[1]?.replace(PLACE_END, "").trim();

  if (tipos.length) params.set("tipo", tipos.join(","));
  if (cobranca) params.set("cobranca", cobranca);
  if (comodidades.length) params.set("comodidades", comodidades.join(","));
  if (place) params.set("local", place);
  // Nada reconhecido: a frase inteira vira busca por cidade ou bairro ("Maringá").
  if (params.size === 0 && query) params.set("local", query);

  return `/salas${params.size ? `?${params}` : ""}`;
}
