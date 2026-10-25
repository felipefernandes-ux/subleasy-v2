/**
 * E-mails do fluxo de anúncio, enviados pelo Resend (API REST, sem SDK).
 * Sem RESEND_API_KEY no .env.local, o e-mail só aparece no log do servidor:
 * o fluxo continua funcionando em desenvolvimento.
 */

const RESEND_URL = "https://api.resend.com/emails";
// Sem domínio verificado no Resend, só o remetente de teste funciona,
// e ele só entrega para o e-mail da própria conta do Resend.
const FROM = process.env.EMAIL_FROM ?? "Subleasy <onboarding@resend.dev>";

/** Prazo prometido ao anfitrião. Mude aqui se a rotina de revisão mudar. */
export const REVIEW_TIME = "1 dia útil";

type Email = {
  to: string;
  subject: string;
  heading: string;
  paragraphs: string[];
  cta?: { label: string; url: string };
  footnote?: string;
  /** Para onde vai a resposta. Na mensagem de um interessado, é o e-mail dele. */
  replyTo?: string;
};

export async function sendEmail(email: Email) {
  const apiKey = process.env.RESEND_API_KEY;
  const html = renderHtml(email);
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

export function listingSubmittedEmail(to: string, name: string, title: string, url: string): Email {
  return {
    to,
    subject: "Recebemos o anúncio da sua sala",
    heading: "Seu anúncio está em revisão",
    paragraphs: [
      `Oi, ${firstName(name)}. Recebemos o anúncio “${title}”.`,
      `Agora a equipe do Subleasy confere as fotos e as informações. A revisão leva até ${REVIEW_TIME}.`,
      "Quando o anúncio for aprovado, você recebe outro e-mail com o link da sala para compartilhar.",
    ],
    cta: { label: "Ver meu anúncio", url },
  };
}

export function adminNewListingEmail(
  to: string,
  listing: { title: string; host: string; hostEmail: string; place: string; price: string; photos: number },
  url: string,
): Email {
  return {
    to,
    subject: `Novo anúncio para aprovar: ${listing.title}`,
    heading: "Novo anúncio para aprovar",
    paragraphs: [
      `“${listing.title}”`,
      `Anfitrião: ${listing.host} (${listing.hostEmail})`,
      `Local: ${listing.place}`,
      `Preço: ${listing.price}`,
      `Fotos: ${listing.photos}`,
    ],
    cta: { label: "Revisar anúncio", url },
  };
}

export function listingPublishedEmail(to: string, name: string, title: string, url: string): Email {
  return {
    to,
    subject: "Sua sala está no ar",
    heading: "Sua sala está no ar",
    paragraphs: [
      `${firstName(name)}, o anúncio “${title}” foi aprovado e já aparece no Subleasy.`,
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
      `Oi, ${firstName(name)}. Revisamos o anúncio “${title}” e ele precisa de um ajuste antes de ir ao ar:`,
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
      `Mensagem enviada pelo anúncio “${title}” no Subleasy:`,
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
function renderHtml({ heading, paragraphs, cta, footnote }: Email) {
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#344054;">${escape(p)}</p>`)
    .join("");
  const button = cta
    ? `<a href="${escape(cta.url)}" style="display:inline-block;margin-top:8px;padding:14px 24px;border-radius:8px;background:#3818d9;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;">${escape(cta.label)}</a>`
    : "";
  const note = footnote
    ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#667085;word-break:break-all;">${escape(footnote)}</p>`
    : "";

  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f9fafb;font-family:Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #eaecf0;">
<tr><td style="padding:32px 32px 0;"><span style="font-size:22px;font-weight:700;color:#3818d9;">subleasy</span><span style="font-size:22px;font-weight:700;color:#25edb1;">.</span></td></tr>
<tr><td style="padding:24px 32px 32px;">
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#101828;">${escape(heading)}</h1>
${body}${button}${note}
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;color:#98a2b3;">Subleasy · Sua sala no turno certo.</p>
</td></tr></table></body></html>`;
}

function renderText({ heading, paragraphs, cta, footnote }: Email) {
  return [heading, "", ...paragraphs, "", cta ? `${cta.label}: ${cta.url}` : "", footnote ?? ""]
    .filter((line, index, all) => line !== "" || all[index - 1] !== "")
    .join("\n")
    .trim();
}
