import { parsePhotoSizes } from "./listing-options";

// Os mesmos limites que o anunciante vê ao escrever (rewrite.ts).
const TITLE_MAX = 70;
const SUMMARY_MAX = 120;
const DESCRIPTION_WORDS = [80, 160] as const;
const RULES_RANGE = [3, 6] as const;
// Abaixo disso a foto fica pixelada na capa e no card.
const MIN_PHOTO_WIDTH = 800;

const HYPE = /\b(incr[ií]vel|o melhor|a melhor|luxuos[oa]|perfeit[oa]|imperd[ií]vel|maravilhos[oa])\b/i;
const PHONE = /(?:\+?55\s*)?\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}/;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const LINK = /https?:\/\/|www\./i;

export type ReviewInput = {
  title: string;
  short_summary: string | null;
  description: string | null;
  rules: string[];
  photos: string[];
  photo_sizes: unknown;
};

/** Problemas objetivos do anúncio, medidos sem IA. Cada item é uma frase curta para o admin e para o prompt. */
export function checkListing(listing: ReviewInput): string[] {
  const issues: string[] = [];
  const title = listing.title.trim();
  const summary = (listing.short_summary ?? "").trim();
  const description = (listing.description ?? "").trim();
  const text = [title, summary, description, ...listing.rules].join("\n");

  if (title.length > TITLE_MAX) issues.push(`Título com ${title.length} caracteres (máximo ${TITLE_MAX}).`);
  if (title.length < 25) issues.push("Título curto: falta o diferencial ou o bairro.");
  if (title === title.toUpperCase() && /[A-Z]{4}/.test(title)) issues.push("Título todo em maiúsculas.");
  if (/!/.test(title)) issues.push("Título com exclamação.");

  if (!summary) issues.push("Sem resumo.");
  else {
    if (summary.length > SUMMARY_MAX) issues.push(`Resumo com ${summary.length} caracteres (máximo ${SUMMARY_MAX}).`);
    if (summary.toLowerCase() === title.toLowerCase()) issues.push("Resumo igual ao título.");
  }

  const words = description ? description.split(/\s+/).length : 0;
  if (words < DESCRIPTION_WORDS[0]) issues.push(`Descrição com ${words} palavras (o ideal é de ${DESCRIPTION_WORDS[0]} a ${DESCRIPTION_WORDS[1]}).`);
  else if (words > DESCRIPTION_WORDS[1] * 1.5) issues.push(`Descrição longa, com ${words} palavras.`);

  if (listing.rules.length < RULES_RANGE[0]) issues.push(`Só ${listing.rules.length} regra(s) de uso (o ideal é de ${RULES_RANGE[0]} a ${RULES_RANGE[1]}).`);

  if (HYPE.test(text)) issues.push("Adjetivos que não dá para verificar (como \"incrível\" ou \"o melhor\").");
  if (PHONE.test(text) || EMAIL.test(text) || LINK.test(text)) issues.push("Telefone, e-mail ou link dentro do texto. O contato vai pelo botão de WhatsApp.");

  if (listing.photos.length === 0) issues.push("Sem fotos.");
  const sizes = parsePhotoSizes(listing.photo_sizes);
  const small = listing.photos.filter((path) => {
    const size = sizes[path];
    return size !== undefined && Math.max(...size) < MIN_PHOTO_WIDTH;
  });
  if (small.length > 0) issues.push(`${small.length} foto(s) com resolução baixa (menos de ${MIN_PHOTO_WIDTH}px).`);

  return issues;
}
