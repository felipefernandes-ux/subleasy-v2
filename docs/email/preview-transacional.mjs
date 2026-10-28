// Gera a prévia de um e-mail transacional (o mesmo HTML que o Resend envia) em preview-notificacao.html.
// Uso: node docs/email/preview-transacional.mjs   (depois abra docs/email/preview-notificacao.html no navegador)
process.env.EMAIL_LOGO_URL = "assets/logo%20subleasy%20white.png";
const { newInquiryEmail, renderEmailHtml } = await import("../../src/lib/email.ts");
import { writeFileSync } from "node:fs";

const email = newInquiryEmail(
  "anunciante@exemplo.com",
  "Sala de psicologia mobiliada com recepção compartilhada",
  {
    name: "Carolina Souza",
    email: "carolina@exemplo.com",
    phone: "(44) 99999-9999",
    message: "Oi! Tenho interesse na sala às quartas pela manhã. Ela aceita atendimento de crianças? Posso visitar nesta semana?",
  },
  "#",
);
writeFileSync(new URL("preview-notificacao.html", import.meta.url), renderEmailHtml(email));
console.log("docs/email/preview-notificacao.html gerado");
