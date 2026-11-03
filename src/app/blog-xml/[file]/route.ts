import { cacheLife, cacheTag } from "next/cache";
import { WP_ORIGIN } from "@/lib/blog";

// Sitemaps do Rank Math (/blog/sitemap_index.xml, post-sitemap.xml…). O plugin liga cada um a uma folha XSLT só
// para mostrar uma versão bonita no navegador; o Chrome vai remover o suporte a XSLT e já avisa quem abre o
// sitemap. Buscadores ignoram a folha e leem o XML, então ela sai daqui.
async function sitemap(file: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("blog");

  const res = await fetch(`${WP_ORIGIN}/blog/${file}`, { headers: { "user-agent": "Mozilla/5.0 (compatible; SubleasyBlog/1.0)" } });
  if (!res.ok) return { status: res.status === 404 ? 404 : 502, body: "", type: "text/plain" };
  const body = (await res.text()).replace(/<\?xml-stylesheet[^>]*\?>\s*/g, "");
  return { status: 200, body, type: res.headers.get("content-type") ?? "text/xml; charset=UTF-8" };
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!/^[\w-]+\.xml$/.test(file)) return new Response("Not found", { status: 404 });

  const { status, body, type } = await sitemap(file);
  if (status !== 200) return new Response("Not found", { status });

  return new Response(body, {
    headers: {
      "content-type": type,
      // O Rank Math já marca o sitemap como noindex (a página do sitemap, não as URLs dentro dele).
      "x-robots-tag": "noindex",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
