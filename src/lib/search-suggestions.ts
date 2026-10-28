import { BILLING_TYPES, type BillingType, type SpaceType } from "@/lib/listing-options";

type Row = { space_type: string; city: string; neighborhood: string; billing_type: string };

// Frase de cada tipo no jeito que a pessoa digitaria. Cada uma precisa ser reconhecida por searchUrl.
const TYPE_PHRASE: Partial<Record<SpaceType, string>> = {
  consultorio_medico: "Consultório médico",
  odontologia: "Consultório odontológico",
  psicologia: "Sala de psicologia",
  estetica: "Sala de estética",
  terapias: "Espaço terapêutico",
  fisioterapia: "Sala de fisioterapia",
  nutricao: "Consultório de nutrição",
  to_fono: "Sala de fonoaudiologia",
};

const MAX = 4;

/**
 * Sugestões de busca a partir dos anúncios no ar: as combinações que mais aparecem
 * (tipo + cidade, tipo + bairro, tipo + cobrança), de modo que toda sugestão acha pelo menos uma sala.
 */
export function buildSuggestions(rows: Row[]): string[] {
  const count = (key: (row: Row) => string | null) => {
    const totals = new Map<string, number>();
    for (const row of rows) {
      const value = key(row);
      if (value) totals.set(value, (totals.get(value) ?? 0) + 1);
    }
    return [...totals].sort((a, b) => b[1] - a[1]).map(([value]) => value);
  };
  const phrase = (row: Row) => TYPE_PHRASE[row.space_type as SpaceType];

  const byCity = count((row) => (phrase(row) && row.city ? `${phrase(row)} em ${row.city}` : null));
  const byNeighborhood = count((row) => (phrase(row) && row.neighborhood ? `${phrase(row)} em ${row.neighborhood}` : null));
  const byBilling = count((row) => {
    const unit = BILLING_TYPES[row.billing_type as BillingType];
    return phrase(row) && unit ? `${phrase(row)} ${unit.toLowerCase()}` : null;
  });

  // Uma de cada lista por vez, para variar o tipo de sugestão; sem repetir frase.
  const picked: string[] = [];
  const lists = [byCity, byNeighborhood, byBilling];
  for (let index = 0; picked.length < MAX && lists.some((list) => index < list.length); index++) {
    for (const list of lists) {
      const item = list[index];
      if (item && picked.length < MAX && !picked.includes(item)) picked.push(item);
    }
  }
  return picked;
}
