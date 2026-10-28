// Troca as variáveis do Brevo por dados de exemplo e grava preview.html.
// Uso: node docs/email/preview.mjs   (depois abra docs/email/preview.html no navegador)
import { readFileSync, writeFileSync } from "node:fs";

const dir = new URL(".", import.meta.url);
// Uso: node docs/email/preview.mjs [ativacao|convite|vem-ai] [--sem-anuncio]   (padrão: convite)
// --sem-anuncio testa o fallback do título ("sua sala") para quem não tem anúncio.
const name = process.argv[2] ?? "convite";
const semAnuncio = process.argv.includes("--sem-anuncio");
const html = readFileSync(new URL(`${name}.html`, dir), "utf8");

const sample = {
  "contact.GROUP_LINE":
    "O seu anúncio voltou para rascunho depois de 30 dias e ninguém avisou você. Foi falha nossa, e a regra mudou: no 2.0 o anúncio só é pausado depois de dois lembretes sem resposta.",
  "contact.GROUP_PS": "Se você não renovou, me conta por quê? A resposta muda o que eu construo.",
  "contact.INTEREST_URL": "#",
  "params.URL_SITE": "https://subleasy.com.br",
  "params.LOGO_URL": "../../public/logo-subleasy.svg",
  "params.HERO_URL": "assets/vem-ai-hero.png",
  "contact.FIRSTNAME": "Mariana",
  "contact.AD_URL": "#",
  "contact.AD_IMAGE": "../../public/salas/consultorio-odontologico-maringa.jpg",
  "contact.AD_TITLE": "Sala de psicologia mobiliada com recepção compartilhada",
  "contact.AD_TYPE": "Sala de psicologia",
  "contact.AD_NEIGHBORHOOD": "Zona 7",
  "contact.AD_CITY": "Londrina",
  "contact.AD_STATE": "PR",
  "contact.AD_PRICE": "600",
  "contact.AD_BILLING": "mês",
  "contact.AD_AMENITY_1": "Wi-Fi",
  "contact.AD_AMENITY_2": "Ar-condicionado",
  "contact.AD_AMENITY_3": "Recepção",
  "contact.PUBLISH_URL": "#",
  "contact.OPTOUT_URL": "#",
  unsubscribe: "#",
};

if (semAnuncio) delete sample["contact.AD_TITLE"];

// Aceita {{ chave }} e {{ chave | default: "valor" }}, como o Brevo.
const out = html.replace(/\{\{\s*([\w.]+)\s*(?:\|\s*default:\s*(?:"([^"]*)"|'([^']*)'))?\s*\}\}/g, (m, key, d1, d2) => sample[key] ?? d1 ?? d2 ?? m);
writeFileSync(new URL(`preview-${name}.html`, dir), out);
console.log(`docs/email/preview-${name}.html gerado`);
