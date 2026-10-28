import type { NextRequest } from "next/server";
import { cleanSlug, redirectTo } from "@/lib/legacy-redirects";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Anúncio do site antigo: subleasy.com.br/anuncios/<post_name>/ vira /espaco/<slug>.
 * Quem não está no ar (ou não foi importado) vai para a busca do mesmo tipo e cidade, quando se sabe qual era.
 * No subdomínio admin.* esta rota nem é alcançada: o proxy a reescreve para o Super Admin.
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/anuncios/[slug]">) {
  const slug = cleanSlug((await params).slug);
  if (!slug) return redirectTo(request, "/espacos", false);

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
