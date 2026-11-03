import { cacheLife } from "next/cache";
import { isAllowedSheet, scopeCss } from "@/lib/blog";

// Folhas de estilo do WordPress (Bricks, plugins) adaptadas ao shadow root do blog: mesma
// transformação do CSS inline (ver scopeCss), servidas daqui para o navegador guardá-las em cache
// entre as páginas em vez de receber 150 KB a mais em cada HTML.
async function adaptedSheet(href: string) {
  "use cache";
  cacheLife("days");
  const res = await fetch(href, { headers: { "user-agent": "Mozilla/5.0 (compatible; SubleasyBlog/1.0)" } });
  if (!res.ok) return null;
  return scopeCss(await res.text(), href);
}

export async function GET(request: Request) {
  const href = new URL(request.url).searchParams.get("u");
  if (!href || !isAllowedSheet(href)) return new Response("Not found", { status: 404 });

  const css = await adaptedSheet(href);
  if (css === null) return new Response("Not found", { status: 404 });

  return new Response(css, {
    headers: {
      "content-type": "text/css; charset=utf-8",
      // A URL leva ?ver= do WordPress, que muda a cada atualização do tema.
      "cache-control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
