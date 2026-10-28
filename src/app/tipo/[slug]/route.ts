import type { NextRequest } from "next/server";
import { cleanSlug, redirectTo } from "@/lib/legacy-redirects";
import { searchUrl } from "@/lib/search-text";

/** Página de tipo do site antigo (/tipo/sala-de-psicologia/): vira a busca filtrada pelo tipo. */
export async function GET(request: NextRequest, { params }: RouteContext<"/tipo/[slug]">) {
  const slug = cleanSlug((await params).slug);
  if (!slug) return redirectTo(request, "/espacos", false);

  // searchUrl reconhece o tipo pelo texto; sem tipo reconhecido, não vira filtro de local.
  const url = searchUrl(slug.replaceAll("-", " "));
  return url.includes("tipo=") ? redirectTo(request, url, true) : redirectTo(request, "/espacos", false);
}
