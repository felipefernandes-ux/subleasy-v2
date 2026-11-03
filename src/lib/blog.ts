import { cacheLife, cacheTag } from "next/cache";

// O blog é um WordPress (Bricks) em blog.subleasy.com.br, servido em subleasy.com.br/blog.
// O Next busca o HTML de cada página e só aproveita o miolo (<main>) e os estilos; o cabeçalho,
// o rodapé e a tab bar são os do site, então o blog é parte dele e não um site à parte.
export const WP_ORIGIN = "https://blog.subleasy.com.br";

export type BlogDocument =
  | {
      kind: "ok";
      title: string;
      meta: Record<string, string>;
      canonical: string | null;
      bodyClass: string;
      // CSS do WordPress já adaptado (ver scopeCss), um bloco por <style> inline.
      styles: string[];
      // Folhas externas liberadas pela rota /blog-css.
      sheets: string[];
      jsonLd: string[];
      html: string;
      // A página já traz o próprio campo de busca (início e resultados), então a faixa do site não repete.
      hasSearch: boolean;
    }
  | { kind: "redirect"; to: string }
  | { kind: "notfound" };

// Só caminhos simples: letras, números, hífen, sublinhado, ponto e porcentagem.
const SAFE_SEGMENT = /^[\p{L}\p{N}_.%-]+$/u;

export function blogUrl(segments: string[], search: string) {
  if (segments.some((s) => s === ".." || s === "." || !SAFE_SEGMENT.test(s))) return null;
  const path = segments.length ? `${segments.join("/")}/` : "";
  const query = search ? `?s=${encodeURIComponent(search)}` : "";
  return `${WP_ORIGIN}/blog/${path}${query}`;
}

export async function getBlogDocument(segments: string[], search: string): Promise<BlogDocument> {
  "use cache";
  cacheLife("minutes");
  cacheTag("blog");

  const url = blogUrl(segments, search);
  if (!url) return { kind: "notfound" };

  const res = await fetch(url, {
    redirect: "manual",
    headers: { accept: "text/html", "user-agent": "Mozilla/5.0 (compatible; SubleasyBlog/1.0)" },
  });

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    if (!location) return { kind: "notfound" };
    const target = new URL(location, url);
    // Redirecionamento interno do WordPress (barra final, slug antigo): segue pelo domínio público.
    if (target.origin === WP_ORIGIN || target.origin === "https://subleasy.com.br") {
      return { kind: "redirect", to: `${target.pathname}${target.search}` };
    }
    return { kind: "redirect", to: target.toString() };
  }
  if (res.status === 404) return { kind: "notfound" };
  if (!res.ok) throw new Error(`Blog: o WordPress respondeu ${res.status} para ${url}`);

  return parseDocument(await res.text());
}

function parseDocument(page: string): BlogDocument {
  const headEnd = page.indexOf("</head>");
  const head = page.slice(0, headEnd);

  const mainStart = page.indexOf("<main");
  const mainEnd = page.lastIndexOf("</main>");
  if (mainStart < 0 || mainEnd < 0) return { kind: "notfound" };
  const mainHtml = page.slice(mainStart, mainEnd + "</main>".length);

  const titleRaw = /<title>([^<]*)<\/title>/.exec(head)?.[1] ?? "";
  // O Rank Math deixa "Blog Subleasy -" na página inicial; tira o separador solto.
  const title = decode(titleRaw).replace(/\s*[-–|]\s*$/, "").trim();

  const meta: Record<string, string> = {};
  for (const tag of head.matchAll(/<meta\s+([^>]*?)\/?>/g)) {
    const attrs = parseAttrs(tag[1]);
    const key = attrs.property ?? attrs.name;
    if (key && attrs.content !== undefined && !(key in meta)) meta[key] = decode(attrs.content);
  }

  const canonical = /<link rel="canonical" href="([^"]*)"/.exec(head)?.[1] ?? null;
  const bodyClass = /<body\s+class="([^"]*)"/.exec(page)?.[1] ?? "";

  const styles = [...head.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((m) => scopeCss(m[1])).filter(Boolean);

  const sheets: string[] = [];
  for (const tag of head.matchAll(/<link\s+([^>]*?)\/?>/g)) {
    const attrs = parseAttrs(tag[1]);
    if (attrs.rel !== "stylesheet" || !attrs.href) continue;
    const href = decode(attrs.href);
    if (isAllowedSheet(href) && !/themify|bricks-child/.test(href)) sheets.push(href);
  }

  const jsonLd = [...head.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) =>
    m[1].replace(/<\//g, "<\\/"),
  );

  return {
    kind: "ok",
    title,
    meta,
    canonical,
    bodyClass,
    styles,
    sheets,
    jsonLd,
    html: cleanMain(mainHtml),
    hasSearch: mainHtml.includes("bricks-search-form"),
  };
}

// Folhas que a rota /blog-css aceita: só CSS de tema e plugins do próprio WordPress.
export function isAllowedSheet(href: string) {
  try {
    const u = new URL(href);
    return u.origin === WP_ORIGIN && /^\/wp-(content|includes)\/.+\.css$/.test(u.pathname);
  } catch {
    return false;
  }
}

function parseAttrs(source: string) {
  const attrs: Record<string, string> = {};
  for (const m of source.matchAll(/([a-zA-Z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? "";
  return attrs;
}

function decode(text: string) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

const SEARCH_SVG =
  '<svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="6.25" stroke="currentColor" stroke-width="1.6"/><path d="M13.5 13.5 17 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const ARROW_SVG =
  '<svg viewBox="0 0 20 20" width="1em" height="1em" fill="none" aria-hidden="true"><path d="M4 10h12m0 0-4.5-4.5M16 10l-4.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// O Bricks carrega imagens e fundos por JavaScript (data-src, classe bricks-lazy-hidden). Aqui não há
// esse script: as imagens viram <img> comuns, com lazy-load nativo, e os ícones da fonte Themify
// (só a busca e a seta) viram SVG, para o blog não carregar uma fonte inteira por dois ícones.
function cleanMain(html: string) {
  return html
    .replace(/<img\b[^>]*>/g, (img) => {
      if (!/\sdata-src=/.test(img)) return img;
      const eager = /fetchpriority="high"/.test(img);
      return img
        .replace(/\ssrc="[^"]*"/, "")
        .replace(/\sdata-src=/, " src=")
        .replace(/\sdata-srcset=/, " srcset=")
        .replace(/\sdata-sizes=/, " sizes=")
        .replace(/\sdata-type="[^"]*"/, "")
        .replace(/<img\b/, eager ? "<img" : '<img loading="lazy"');
    })
    .replace(/\sbricks-lazy-(?:hidden|loaded)\b/g, "")
    .replace(/<i class="ti-search[^"]*"><\/i>/g, SEARCH_SVG)
    .replace(/<i class="ti-arrow-right[^"]*"><\/i>/g, ARROW_SVG);
}

// Tokens que o site já define no Tailwind (src/app/globals.css): o blog usa os mesmos, então
// as cópias antigas que o Bricks declara em :root saem daqui e valem as do site.
const SITE_TOKENS = [
  "font-sans",
  "text-display",
  "text-h1",
  "text-h2",
  "text-h3",
  "radius-control",
  "radius-card",
  "radius-panel",
  "shadow-xs",
  "shadow-card",
  "shadow-raised",
  "shadow-brand",
  "container-page",
];

// O CSS do Bricks mira body, html e :root. O conteúdo do blog vive num shadow root (assim o CSS do
// WordPress não vaza para o cabeçalho do site e o do site não desmonta o blog), onde esses seletores
// não existem: body vira o .wp-body, que embrulha o conteúdo, e :root e html viram :host.
// Também aplica o design system do site: Inter no lugar da Area Normal, pesos 500/600, cores e
// tokens do Tailwind no lugar da paleta antiga do Bricks.
export function scopeCss(css: string, baseUrl?: string) {
  let out = css;

  // Caminhos relativos de url() deixam de resolver quando a folha é servida de outro endereço.
  if (baseUrl) {
    out = out.replace(/url\((['"]?)(?!data:|https?:|\/\/|#)([^)'"]+)\1\)/g, (_, q, p) => `url(${q}${new URL(p, baseUrl).toString()}${q})`);
  }

  // (?<![\w-]) garante que é uma declaração de variável, e não parte de um seletor como .sb-eyebrow--mint::before.
  for (const name of SITE_TOKENS) out = out.replace(new RegExp(`(?<![\\w-])--${name}:\\s*[^;}]+;?`, "g"), "");

  // Paleta antiga do Bricks (brand, ink, mint…) aponta para as cores do site; o valor antigo fica de reserva.
  out = out.replace(/(?<![\w-])--((?:brand|ink|mint|warning|danger|whatsapp)(?:-\d+)?):\s*([^;}]+)(;?)/g, (_, name, old, end) => `--${name}: var(--color-${name}, ${old.trim()})${end}`);

  // Fonte do site (Inter) no lugar da Area Normal, e os dois pesos do design system.
  out = out.replace(/font-family:\s*[^;}]*area-normal[^;}]*/g, "font-family: var(--font-sans)");
  out = out.replace(/font-weight:\s*(?:600|700|800|900|bold)\b/g, "font-weight: var(--font-weight-bold)");
  out = out.replace(/font-weight:\s*(?:100|200|300|400|500|normal)\b/g, "font-weight: var(--font-weight-normal)");

  out = out.replace(/:where\(:root\)/g, ":where(.wp-body)");
  out = out.replace(/:root/g, ":host");
  out = out.replace(/(^|[\s,{}>+~(])html(?![\w-])/g, "$1:host");
  out = out.replace(/(^|[\s,{}>+~(])body(?![\w-])/g, "$1.wp-body");

  return out;
}
