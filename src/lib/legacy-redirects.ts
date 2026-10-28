import { NextResponse, type NextRequest } from "next/server";

/**
 * Redirecionamentos das URLs do site antigo (WordPress) que dependem do banco.
 * Os que são fixos ficam em next.config.ts. 308 é o permanente do Next (o Google trata como 301);
 * 307 vai para a busca quando não existe equivalente exato, para o Google não juntar sinais de páginas diferentes.
 */
export function redirectTo(request: NextRequest, path: string, permanent: boolean) {
  return NextResponse.redirect(new URL(path, request.url), permanent ? 308 : 307);
}

/** "Jaraguá do Sul" → "jaragua-do-sul", o formato dos endereços antigos. */
export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Slug vindo da URL: só letras, números, hífen e pontos já decodificados; o resto não é um anúncio nosso. */
export function cleanSlug(raw: string) {
  try {
    const slug = decodeURIComponent(raw).toLowerCase();
    return /^[a-z0-9-]{1,200}$/.test(slug) ? slug : null;
  } catch {
    return null;
  }
}
