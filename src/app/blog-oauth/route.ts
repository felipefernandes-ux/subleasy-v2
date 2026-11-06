import { WP_ORIGIN } from "@/lib/blog";

// Metadados OAuth do Novamira (RFC 8414) para autorizar o CLI em subleasy.com.br/blog.
// O plugin monta o authorization_endpoint com a URL do admin, que fica no subdomínio do WordPress, e o CLI só
// aceita endereços da mesma origem do `home`. Aqui só esse campo troca para /blog/novamira-authorize, que o
// next.config.ts redireciona para a tela do wp-admin (quem segue o redirect é o navegador de quem autoriza).
// O restante do JSON, incluindo token e registro em /blog/wp-json, vem do WordPress sem alteração.
export async function GET() {
  const res = await fetch(`${WP_ORIGIN}/blog/.well-known/oauth-authorization-server/`, {
    headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (compatible; SubleasyBlog/1.0)" },
    cache: "no-store",
  });
  if (!res.ok) return new Response("Bad gateway", { status: 502 });

  let metadata: Record<string, unknown>;
  try {
    metadata = await res.json();
  } catch {
    return new Response("Bad gateway", { status: 502 });
  }
  if (typeof metadata.issuer !== "string" || typeof metadata.authorization_endpoint !== "string") {
    return new Response("Bad gateway", { status: 502 });
  }

  const publicOrigin = new URL(metadata.issuer).origin;
  metadata.authorization_endpoint = `${publicOrigin}/blog/novamira-authorize`;

  return Response.json(metadata, {
    headers: { "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}
