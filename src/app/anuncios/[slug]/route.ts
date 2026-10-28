import type { NextRequest } from "next/server";
import { cleanSlug, redirectTo } from "@/lib/legacy-redirects";
import { createAdminClient } from "@/lib/supabase/admin";

// Anúncios do site antigo removidos de vez, sem equivalente no 2.0: respondem 410 (Gone).
// O Google tira a URL do índice mais rápido do que com 404, e a busca não ajudaria (não há anúncio parecido).
const REMOVED = new Set(["sala-para-psicologos-tercas-no-centro-de-maringa-consultorio-lume"]);

const GONE_HTML = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Anúncio removido · Subleasy</title>
<body style="font-family:Helvetica,Arial,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1.5rem;color:#101828">
<h1>Este anúncio não existe mais</h1><p>A sala foi retirada do Subleasy.</p><p><a href="/espacos" style="color:#3818d9;font-weight:700">Ver outros espaços</a></p></body></html>`;

/**
 * Anúncio do site antigo: subleasy.com.br/anuncios/<post_name>/ vira /espaco/<slug>.
 * Quem não está no ar (ou não foi importado) vai para a busca do mesmo tipo e cidade, quando se sabe qual era.
 * No subdomínio admin.* esta rota nem é alcançada: o proxy a reescreve para o Super Admin.
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/anuncios/[slug]">) {
  const slug = cleanSlug((await params).slug);
  if (!slug) return redirectTo(request, "/espacos", false);

  if (REMOVED.has(slug)) return new Response(GONE_HTML, { status: 410, headers: { "content-type": "text/html; charset=utf-8" } });

  const db = createAdminClient();
  // A importação guarda o endereço antigo inteiro em source_url; source_slug ainda não é preenchido.
  const { data: imports } = await db.from("listing_imports").select("source_url, listing_id").like("source_url", `%/anuncios/${slug}%`);
  const imported = imports?.find((row) => new URL(row.source_url).pathname.replace(/^\/anuncios\/|\/$/g, "") === slug);
  if (!imported) return redirectTo(request, "/espacos", false);

  const { data: listing } = await db
    .from("listings")
    .select("slug, status, expires_at, space_type, city")
    .eq("id", imported.listing_id)
    .maybeSingle();
  if (!listing) return redirectTo(request, "/espacos", false);

  const live = listing.status === "active" && listing.expires_at !== null && new Date(listing.expires_at) > new Date();
  if (live) return redirectTo(request, `/espaco/${listing.slug}`, true);

  const search = new URLSearchParams({ tipo: listing.space_type, local: listing.city });
  return redirectTo(request, `/espacos?${search}`, false);
}
