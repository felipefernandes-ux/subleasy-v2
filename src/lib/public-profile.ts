// Regras do perfil público (/u/<public_id>): foto, bio e WhatsApp no perfil.
// Base legal e pesquisa: docs/reports/Verificação e perfil público de anfitriões.md

export const BIO_MAX = 400;
// Id da URL pública: 12 caracteres hexadecimais aleatórios (profiles.public_id).
export const PUBLIC_ID_PATTERN = /^[a-f0-9]{12}$/;
export const AVATAR_FOLDER = "perfil";
// Evento de janela disparado quando foto ou nome mudam, para o menu da conta se atualizar.
export const PROFILE_CHANGED_EVENT = "subleasy:perfil-alterado";

/**
 * Texto do consentimento para mostrar o WhatsApp no perfil (LGPD, art. 8º).
 * Mudou o texto, muda a versão: o registro guarda qual versão a pessoa leu.
 */
export const WHATSAPP_CONSENT = {
  version: "2026-10-26",
  label: "Exibir meu WhatsApp a todos os visitantes do meu perfil",
  description:
    "Ligado: qualquer pessoa que abrir seu perfil vê o número ao clicar em “Mostrar WhatsApp”, mesmo sem conta no Subleasy. Números públicos podem receber mensagens de desconhecidos. Desligado: seu número continua privado e as pessoas falam com você pelos botões de contato dos anúncios. Você pode mudar quando quiser.",
};

export type ConsentChannel = "cadastro" | "configuracoes";

const PHONE = /(?:\+?55[\s.-]?)?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}/;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const LINK = /(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|net|org|br|me|app|io|link|ly)(?:\/\S*)?\b/i;

/** A bio é pública: sem telefone, e-mail ou link, que levariam o contato para fora dos canais com consentimento. */
export function bioProblem(bio: string) {
  if (bio.length > BIO_MAX) return `Use até ${BIO_MAX} caracteres.`;
  if (PHONE.test(bio)) return "Tire o telefone da apresentação. Para mostrar seu WhatsApp, use a opção abaixo do número.";
  if (EMAIL.test(bio)) return "Tire o e-mail da apresentação. As pessoas falam com você pelos botões dos anúncios.";
  if (LINK.test(bio)) return "Tire os links da apresentação.";
  return null;
}

/** A foto só pode estar na pasta de perfil do próprio usuário. */
export function isOwnAvatarPath(path: string, userId: string) {
  return new RegExp(`^${userId}/${AVATAR_FOLDER}/[0-9]+\\.(webp|jpg)$`).test(path);
}
