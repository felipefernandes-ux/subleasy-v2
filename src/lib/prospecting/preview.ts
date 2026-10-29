import { randomBytes } from "node:crypto";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { EXTRACTION_MODEL, geminiClient } from "@/lib/ai";
import { AMENITIES, SPACE_TYPES } from "@/lib/listing-options";
import { parseNeighborhood } from "./import";
import { SPECIALTIES, SPECIALTY_SPACE_TYPE, type Specialty } from "./status";

/** Dias que o link da prévia continua aberto. */
export const PREVIEW_DAYS = 14;

/**
 * Fotos ilustrativas, as mesmas para todas as prévias: imagens geradas por IA, na pasta public/prospeccao.
 * Nenhuma é de um local real; a prévia avisa isso, e o anúncio publicado exige as fotos do anfitrião.
 */
export const PREVIEW_PHOTOS = [
  "/prospeccao/sala-1.jpg",
  "/prospeccao/sala-2.jpg",
  "/prospeccao/sala-5.jpg",
  "/prospeccao/sala-3.jpg",
  "/prospeccao/sala-4.jpg",
  "/prospeccao/sala-6.jpg",
];
export const PREVIEW_PHOTO_SIZES: Record<string, [number, number]> = Object.fromEntries(PREVIEW_PHOTOS.map((path) => [path, [2048, 1536]]));

/**
 * Valor de exemplo por turno mostrado na prévia, sempre marcado como exemplo. Não vem de dado de mercado
 * do Subleasy (ainda não há anúncios por turno no ar): é uma ordem de grandeza a partir da amostra de
 * salas fixas de R$ 1.600 a R$ 3.000 por mês em Maringá. O anfitrião define o valor real ao publicar.
 */
export const PREVIEW_EXAMPLE_PRICE = 70;

/** Comodidades de exemplo por área, só chaves de AMENITIES. A prévia avisa que o anfitrião confirma as da sala dele. */
const BASE_AMENITIES = ["ar_condicionado", "wifi", "recepcao", "sala_de_espera"];
const SPECIALTY_AMENITIES: Record<Specialty, string[]> = {
  odonto: [...BASE_AMENITIES, "pia", "limpeza_inclusa"],
  psi: [...BASE_AMENITIES, "isolamento_acustico", "banheiro_privativo"],
  est: [...BASE_AMENITIES, "maca", "pia"],
  med: [...BASE_AMENITIES, "maca", "pia"],
  fisio: [...BASE_AMENITIES, "maca", "pia"],
  centro: [...BASE_AMENITIES, "elevador", "acessibilidade"],
};

/** Selos de exemplo (no máximo 2, como no anúncio de verdade). */
export function exampleHighlights(specialty: Specialty | null): string[] {
  return specialty === "psi" ? ["aconchegante", "silenciosa"] : ["bem_localizada", "ampla"];
}

const SPACE_TYPE_SPECIALTY: Record<string, Specialty> = {
  odontologia: "odonto",
  psicologia: "psi",
  estetica: "est",
  fisioterapia: "fisio",
  nutricao: "fisio",
  consultorio_medico: "med",
};

/** Área da prévia a partir do tipo de sala gravado nela (a prévia não guarda a especialidade). */
export function specialtyOfSpaceType(spaceType: string): Specialty {
  return SPACE_TYPE_SPECIALTY[spaceType] ?? "med";
}

export function exampleAmenities(specialty: Specialty | null): string[] {
  return (SPECIALTY_AMENITIES[specialty ?? "med"] ?? SPECIALTY_AMENITIES.med).filter((key) => key in AMENITIES);
}

/** Token do link: 24 caracteres sorteados (144 bits), sem relação com o prospect. */
export function newPreviewToken() {
  return randomBytes(18).toString("base64url");
}

export type PreviewCopy = { title: string; short_summary: string; description: string; generated_by: "ia" | "template" };

type CopyInput = { name: string; specialty: Specialty | null; address: string | null; city: string };

const HOOK: Record<Specialty, string> = {
  odonto: "Consultório pronto para você chegar, atender e seguir com o seu dia.",
  psi: "Uma sala acolhedora para o seu atendimento fluir, no horário que combinar com você.",
  est: "Sala de procedimentos clara e organizada, pronta para receber os seus clientes.",
  med: "Consultório com estrutura pronta, para você atender sem se preocupar com o espaço.",
  fisio: "Sala com espaço para os seus atendimentos, no turno que fizer sentido para a sua agenda.",
  centro: "Sala em centro médico, com a estrutura do prédio e atendimento por turno.",
};

const copySchema = z.object({
  title: z.string(),
  short_summary: z.string(),
  description: z.string(),
});

const clip = (value: string, max: number) => {
  const clean = value.trim().replace(/^["“]|["”]$/g, "").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
};

/** Corpo da descrição: abertura, onde fica, como funciona e convite. Emojis de marcação, linhas curtas. As comodidades têm seção própria na página. */
function describe(input: CopyInput, hook: string) {
  const neighborhood = parseNeighborhood(input.address);
  const where = neighborhood ? `${neighborhood}, ${input.city}` : input.city;
  return [
    `✨ ${hook}`,
    `📍 Onde fica\nRegião de ${where}, com a facilidade de atender por turno, sem contrato longo.`,
    "✅ Como funciona\n✔️ Você escolhe os dias e turnos em que precisa da sala\n✔️ Combina o valor e os detalhes direto com o anunciante\n✔️ Anuncia de graça e aprova tudo antes de ir ao ar",
    "💬 Quer conhecer? Fale com o anunciante pelo WhatsApp.",
  ].join("\n\n");
}

/** Texto sem IA: sempre funciona e não afirma nada que não saibamos do local. */
export function templateCopy(input: CopyInput): PreviewCopy {
  const spaceType = SPACE_TYPES[(SPECIALTY_SPACE_TYPE[input.specialty ?? "med"] ?? "consultorio_medico") as keyof typeof SPACE_TYPES];
  const neighborhood = parseNeighborhood(input.address);
  const where = neighborhood ? `${neighborhood}, ${input.city}` : input.city;
  return {
    title: clip(`${spaceType} por turno em ${neighborhood ?? input.city}`, 70),
    short_summary: clip(`${spaceType} para alugar por turno, em ${where}. Você escolhe os dias e combina o valor.`, 120),
    description: describe(input, HOOK[input.specialty ?? "med"]),
    generated_by: "template",
  };
}

const SYSTEM_PROMPT = `Você escreve anúncios de sala de consultório por turno para o Subleasy, em português do Brasil.
Tom: caloroso e direto, frases curtas, no máximo uma exclamação, sem adjetivo vazio. Nunca prometa pacientes, clientes ou resultados.
Nunca invente comodidade, preço, metragem, equipamento ou horário: use só o que está nos fatos.
Não use o nome da clínica nem de profissional no título nem no resumo. Descreva a sala e o bairro.
A descrição usa emojis como marcadores e linhas em branco entre os blocos.`;

/** Título, resumo e descrição da prévia. Usa a IA e cai no texto-padrão se ela falhar ou não estiver configurada. */
export async function generatePreviewCopy(input: CopyInput): Promise<PreviewCopy> {
  const fallback = templateCopy(input);
  const ai = geminiClient();
  if (!ai) return fallback;

  const specialty = input.specialty ? SPECIALTIES[input.specialty] : "saúde";
  const neighborhood = parseNeighborhood(input.address);
  const facts = [
    `Área: ${specialty}`,
    `Cidade: ${input.city}`,
    neighborhood && `Bairro: ${neighborhood}`,
    "Preço e turnos: não mencionar.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await ai.chat.completions.parse({
      model: EXTRACTION_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Escreva o anúncio a partir dos fatos.\n<regras>\n- title: de 10 a 70 caracteres: tipo de sala, o turno como ideia e o bairro.\n- short_summary: até 120 caracteres, uma frase.\n- description: de 70 a 130 palavras, com estes blocos separados por linha em branco, cada um começando com o emoji: "✨" uma abertura criativa de uma ou duas frases; "📍 Onde fica" (só bairro e cidade); "✅ Como funciona" (três linhas com "✔️": escolher dias e turnos, combinar valor direto com o anunciante, anunciar de graça e aprovar antes de publicar); "💬" uma chamada final para falar com o anunciante pelo WhatsApp. Não liste comodidades na descrição: a página tem uma seção própria para elas.\n</regras>\n<fatos>\n${facts}\n</fatos>`,
        },
      ],
      response_format: zodResponseFormat(copySchema, "anuncio"),
    });
    const parsed = response.choices[0]?.message.parsed;
    if (!parsed) return fallback;
    const title = clip(parsed.title.split("\n")[0] ?? "", 70);
    if (title.length < 10) return fallback;
    return {
      title,
      short_summary: clip(parsed.short_summary.split("\n")[0] ?? "", 120) || fallback.short_summary,
      description: clip(parsed.description, 1500) || fallback.description,
      generated_by: "ia",
    };
  } catch (error) {
    console.error("[prospeccao] IA da prévia falhou, usei o texto-padrão:", error);
    return fallback;
  }
}

export { SPECIALTY_SPACE_TYPE };
