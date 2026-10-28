/**
 * E-mails do fluxo de anúncio, enviados pelo Resend (API REST, sem SDK).
 * Sem RESEND_API_KEY no .env.local, o e-mail só aparece no log do servidor:
 * o fluxo continua funcionando em desenvolvimento.
 */

const RESEND_URL = "https://api.resend.com/emails";
// Sem domínio verificado no Resend, só o remetente de teste funciona,
// e ele só entrega para o e-mail da própria conta do Resend.
const FROM = process.env.EMAIL_FROM ?? "Subleasy <onboarding@resend.dev>";

// Logo branco do cabeçalho. Precisa de endereço público: o cliente de e-mail baixa a imagem.
// Enquanto subleasy.com.br for o WordPress, o único endereço público do 2.0 é o da Vercel;
// ao trocar o domínio, mude aqui (ou defina EMAIL_LOGO_URL).
const LOGO_URL = process.env.EMAIL_LOGO_URL ?? "https://subleasy-v2.vercel.app/email/logo-subleasy-white.png";
const BRAND_600 = "#3818d9";

/** Prazo prometido ao anunciante. Mude aqui se a rotina de revisão mudar. */
export const REVIEW_TIME = "1 dia útil";

/** Cartão do anúncio no corpo do e-mail: foto quadrada à esquerda, dados à direita. */
export type EmailCard = { image: string | null; status: string; title: string; place: string; price: string };

/**
 * Título do anúncio no corpo do e-mail: negrito e entre aspas. Os marcadores viram <strong>
 * em renderEmailHtml e somem no texto simples; o resto do parágrafo continua escapado.
 */
const TITLE_OPEN = "\u0001";
const TITLE_CLOSE = "\u0002";
export const bold = (title: string) => `${TITLE_OPEN}“${title}”${TITLE_CLOSE}`;

type Email = {
  to: string;
  subject: string;
  heading: string;
  paragraphs: string[];
  card?: EmailCard;
  cta?: { label: string; url: string };
  /** Código de verificação, em destaque. */
  code?: string;
  footnote?: string;
  /** Para onde vai a resposta. Na mensagem de um interessado, é o e-mail dele. */
  replyTo?: string;
};

export async function sendEmail(email: Email) {
  const apiKey = process.env.RESEND_API_KEY;
  const html = renderEmailHtml(email);
  const text = renderText(email);

  if (!apiKey) {
    console.info(`[email] RESEND_API_KEY ausente. E-mail não enviado:\nPara: ${email.to}\nAssunto: ${email.subject}\n\n${text}`);
    return;
  }

  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [email.to], subject: email.subject, html, text, ...(email.replyTo ? { reply_to: email.replyTo } : {}) }),
    });
    if (!response.ok) {
      console.error(`[email] Resend respondeu ${response.status}:`, await response.text());
    }
  } catch (error) {
    // Falha de e-mail não pode travar a publicação do anúncio.
    console.error("[email] Erro ao enviar:", error);
  }
}

// ── Mensagens ──────────────────────────────────────────────

export function loginCodeEmail(to: string, code: string, purpose: "login" | "signup" | "session"): Email {
  const intro =
    purpose === "signup"
      ? "Use o código abaixo para confirmar seu e-mail e criar sua conta no Subleasy."
      : purpose === "session"
        ? "Alguém entrou na sua conta do Subleasy. Para concluir, digite o código abaixo."
        : "Use o código abaixo para entrar no Subleasy.";
  return {
    to,
    subject: `${code} é o seu código do Subleasy`,
    heading: "Seu código de verificação",
    paragraphs: [intro, "O código vale por 10 minutos e só funciona uma vez."],
    code,
    footnote: "Se não foi você, ignore este e-mail. Ninguém entra na sua conta sem esse código.",
  };
}

export function welcomeEmail(to: string, name: string, url: string): Email {
  return {
    to,
    subject: "Seja bem-vindo ao Subleasy",
    heading: `Seja bem-vindo, ${firstName(name)}`,
    paragraphs: [
      "Sua conta no Subleasy está pronta. Aqui você anuncia sua sala por hora, turno, dia ou mês, sem comissão.",
      "O cadastro leva poucos minutos: escolha o tipo de sala, adicione fotos e a equipe confere o anúncio em até " + REVIEW_TIME + ".",
    ],
    cta: { label: "Anunciar minha sala", url },
  };
}

export function listingSubmittedEmail(to: string, name: string, title: string, url: string, card?: EmailCard): Email {
  return {
    to,
    subject: "Recebemos o anúncio da sua sala",
    heading: "Seu anúncio está em revisão",
    paragraphs: [
      `Oi, ${firstName(name)}. Recebemos o anúncio ${bold(title)}.`,
      `Agora a equipe do Subleasy confere as fotos e as informações. A revisão leva até ${REVIEW_TIME}.`,
      "Quando o anúncio for aprovado, você recebe outro e-mail com o link da sala para compartilhar.",
    ],
    card,
    cta: { label: "Ver meu anúncio", url },
  };
}

export function adminNewListingEmail(
  to: string,
  listing: { host: string; hostEmail: string; photos: number },
  card: EmailCard,
  url: string,
): Email {
  return {
    to,
    subject: `Novo anúncio para aprovar: ${card.title}`,
    heading: "Novo anúncio para aprovar",
    paragraphs: [`Anunciante: ${listing.host} (${listing.hostEmail})`, `Fotos: ${listing.photos}`],
    card,
    cta: { label: "Revisar anúncio", url },
  };
}

export function listingPublishedEmail(to: string, name: string, title: string, url: string): Email {
  return {
    to,
    subject: "Sua sala está no ar",
    heading: "Sua sala está no ar",
    paragraphs: [
      `${firstName(name)}, o anúncio ${bold(title)} foi aprovado e já aparece no Subleasy.`,
      "Compartilhe o link no Instagram, nos grupos de WhatsApp e com colegas. Quem se interessar fala com você direto pelo WhatsApp.",
    ],
    cta: { label: "Ver anúncio publicado", url },
    footnote: `Link da sala: ${url}`,
  };
}

export function listingReturnedEmail(to: string, name: string, title: string, note: string, url: string): Email {
  return {
    to,
    subject: "Seu anúncio precisa de um ajuste",
    heading: "Falta um ajuste para publicar",
    paragraphs: [
      `Oi, ${firstName(name)}. Revisamos o anúncio ${bold(title)} e ele precisa de um ajuste antes de ir ao ar:`,
      note,
      "Corrija e envie de novo. A nova revisão também leva até " + REVIEW_TIME + ".",
    ],
    cta: { label: "Corrigir anúncio", url },
  };
}

// ── Renderização ───────────────────────────────────────────

export function newInquiryEmail(
  to: string,
  title: string,
  inquiry: { name: string; email: string; phone: string | null; message: string },
  url: string,
): Email {
  return {
    to,
    replyTo: inquiry.email,
    subject: `Nova mensagem sobre “${title}”`,
    heading: `${firstName(inquiry.name)} quer saber da sua sala`,
    paragraphs: [
      `Mensagem enviada pelo anúncio ${bold(title)} no Subleasy:`,
      `“${inquiry.message}”`,
      `Contato: ${inquiry.name} · ${inquiry.email}${inquiry.phone ? ` · ${inquiry.phone}` : ""}`,
    ],
    cta: { label: "Ver no painel", url },
    footnote: "Responda este e-mail para falar direto com quem enviou.",
  };
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function escape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// HTML de e-mail: tabela, estilos em linha e largura de 560 px, que os clientes de e-mail entendem.
// Cabeçalho em brand-600 com o logo branco; botões também em brand-600 (bgcolor para o Outlook).
export function renderEmailHtml({ heading, paragraphs, card, cta, code, footnote }: Email) {
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#344054;">${richText(p)}</p>`)
    .join("");
  const cardBlock = card ? renderCard(card) : "";
  const codeBlock = code
    ? `<p style="margin:8px 0 20px;padding:18px 0;border-radius:8px;background:#f4f1ff;text-align:center;font-family:'Courier New',monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:#2c12b3;">${escape(code)}</p>`
    : "";
  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:8px;"><tr><td bgcolor="${BRAND_600}" style="border-radius:8px;background:${BRAND_600};"><a href="${escape(cta.url)}" style="display:inline-block;padding:14px 24px;border-radius:8px;background:${BRAND_600};color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;">${escape(cta.label)}</a></td></tr></table>`
    : "";
  const note = footnote
    ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#667085;word-break:break-all;">${escape(footnote)}</p>`
    : "";

  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f9fafb;font-family:Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #eaecf0;overflow:hidden;">
<tr><td align="center" bgcolor="${BRAND_600}" style="background:${BRAND_600};padding:40px 32px;"><img src="${escape(LOGO_URL)}" width="148" alt="Subleasy" style="display:block;border:0;height:auto;width:148px;"></td></tr>
<tr><td style="padding:32px 32px 36px;">
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#101828;">${escape(heading)}</h1>
${body}${cardBlock}${codeBlock}${button}${note}
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;color:#98a2b3;">Subleasy · Sua sala no turno certo.</p>
</td></tr></table></body></html>`;
}

/** Parágrafo escapado, com os títulos marcados por bold() em negrito. */
function richText(value: string) {
  return escape(value).replaceAll(TITLE_OPEN, '<strong style="color:#101828;">').replaceAll(TITLE_CLOSE, "</strong>");
}

const stripMarks = (value: string) => value.replaceAll(TITLE_OPEN, "").replaceAll(TITLE_CLOSE, "");

// Cartão horizontal como o de Meus anúncios: foto quadrada de 96 px e os dados ao lado.
function renderCard({ image, status, title, place, price }: EmailCard) {
  const photo = image
    ? `<img src="${escape(image)}" width="96" height="96" alt="" style="display:block;width:96px;height:96px;border:0;border-radius:8px;object-fit:cover;background:#f2f4f7;">`
    : `<div style="width:96px;height:96px;border-radius:8px;background:#f2f4f7;"></div>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;border:1px solid #eaecf0;border-radius:12px;"><tr>
<td width="96" valign="top" style="padding:12px;width:96px;">${photo}</td>
<td valign="top" style="padding:12px 12px 12px 0;">
<span style="display:inline-block;padding:2px 10px;border-radius:999px;background:#fef0c7;color:#93370d;font-size:12px;font-weight:700;line-height:1.5;">${escape(status)}</span>
<p style="margin:6px 0 0;font-size:16px;line-height:1.35;color:#101828;"><strong>${escape(`“${title}”`)}</strong></p>
<p style="margin:4px 0 0;font-size:14px;line-height:1.4;color:#667085;">${escape(place)}</p>
<p style="margin:4px 0 0;font-size:14px;line-height:1.4;font-weight:700;color:#344054;">${escape(price)}</p>
</td></tr></table>`;
}

function renderText({ heading, paragraphs, card, cta, code, footnote }: Email) {
  return [heading, "", ...paragraphs.map(stripMarks), "", card ? `“${card.title}” · ${card.place} · ${card.price}` : "", "", code ? `Código: ${code}` : "", "", cta ? `${cta.label}: ${cta.url}` : "", footnote ?? ""]
    .filter((line, index, all) => line !== "" || all[index - 1] !== "")
    .join("\n")
    .trim();
}
