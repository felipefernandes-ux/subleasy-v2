import type { Specialty } from "./status";

/**
 * Mensagens da prospecção. Os textos da pergunta são os da aba Mensagens da planilha (modelos A, B1 e B2);
 * a mensagem com a prévia é a do segundo toque. Asteriscos viram negrito no WhatsApp.
 * Sem promessa de paciente, sempre com a saída ("é só avisar que não escrevo mais").
 */

export type MessageKind = "pergunta" | "previa";

export type MessageProspect = {
  message_model: string | null;
  treatment: string | null;
  recipient: string | null;
  specialty: string | null;
};

/** [para uma pessoa (“você”), para a equipe do local (“vocês”)]. */
const QUESTIONS: Record<Specialty, [string, string]> = {
  odonto: ["Algum dia a sua cadeira ou consultório fica sem uso?", "Algum dia a cadeira de um dos consultórios fica sem uso?"],
  psi: ["A sua sala fica vazia em algum dia ou turno em que você não atende?", "Alguma sala de vocês fica vazia em algum dia ou turno em que ninguém atende?"],
  est: ["A sala de procedimentos fica parada em algum turno?", "A sala de procedimentos fica parada em algum turno?"],
  med: ["O consultório fica sem agenda em algum dia da semana?", "O consultório fica sem agenda em algum dia da semana?"],
  fisio: ["Alguma sala ou box fica livre em certos horários?", "Alguma sala ou box fica livre em certos horários?"],
  centro: ["Alguma sala fica parada em certos dias ou turnos?", "Alguma sala fica parada em certos dias ou turnos?"],
};

const OPT_OUT = "Se não fizer sentido, é só avisar que não escrevo mais.";

function question(specialty: string | null, personal: boolean) {
  const entry = QUESTIONS[(specialty as Specialty) ?? "med"] ?? QUESTIONS.med;
  return entry[personal ? 0 : 1];
}

/** Texto da mensagem, ou null quando faltam dados (ex.: prévia sem link). */
export function buildMessage(prospect: MessageProspect, kind: MessageKind, previewUrl?: string | null): string | null {
  const center = prospect.message_model === "A";
  const personal = !center && Boolean(prospect.treatment);

  if (kind === "pergunta") {
    if (center) {
      return [
        "Olá, tudo bem? Aqui é o Felipe, fundador do Subleasy, site onde profissionais de saúde anunciam sala por turno. Seu contato está no Google.",
        `Falo com a administração ${prospect.recipient ?? "do local"}, de Maringá? Vocês têm várias salas e eu queria saber: *alguma fica parada em certos dias ou turnos?*`,
        "Se ficar, eu cadastro a sala por vocês, sem custo, e vocês só aprovam antes de ir ao ar. Publicar é grátis.",
        "Posso explicar em dois minutos por aqui?",
        OPT_OUT,
      ].join("\n\n");
    }
    const greeting = personal ? `Oi, ${prospect.treatment}, tudo bem?` : "Olá, tudo bem?";
    return [
      `${greeting} Aqui é o Felipe, fundador do Subleasy, site onde profissionais de saúde anunciam sala de consultório por turno. ${personal ? "Peguei seu contato" : "Peguei o contato de vocês"} no Google.`,
      `Uma pergunta direta: *${question(prospect.specialty, personal)}*`,
      personal
        ? "Se tiver, eu monto o anúncio por você com as fotos e os horários que você mandar. Você aprova antes de publicar, e publicar é grátis."
        : "Se tiver, eu monto o anúncio por vocês com as fotos e os horários que vocês mandarem. Vocês aprovam antes de publicar, e publicar é grátis.",
      personal ? "Posso te mandar um exemplo de anúncio?" : "Posso mandar um exemplo de anúncio?",
      OPT_OUT,
    ].join("\n\n");
  }

  if (!previewUrl) return null;
  const who = center ? "Olá, tudo bem?" : personal ? `Oi, ${prospect.treatment}, tudo bem?` : "Olá, tudo bem?";
  const place = center ? `da administração ${prospect.recipient ?? "do local"}` : "";
  return [
    `${who} Aqui é o Felipe, fundador do Subleasy, site onde profissionais de saúde anunciam sala por turno.${place ? ` Escrevo ${place}.` : ""} Peguei ${personal ? "seu contato" : "o contato de vocês"} no Google.`,
    `Em vez de pedir informação, montei uma prévia de como ${center ? "o anúncio de uma sala de vocês" : personal ? "o anúncio da sua sala" : "o anúncio da sala de vocês"} ficaria no Subleasy:`,
    previewUrl,
    `É só uma prévia, com fotos ilustrativas. Se fizer sentido, ${center || !personal ? "vocês trocam" : "você troca"} pelas fotos reais e ${center || !personal ? "aprovam" : "aprova"} antes de publicar. Publicar é grátis.`,
    OPT_OUT,
  ].join("\n\n");
}

export function whatsappLink(number: string, text: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
