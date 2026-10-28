import type { NextRequest } from "next/server";
import { cleanSlug, redirectTo, slugify } from "@/lib/legacy-redirects";
import { createAdminClient } from "@/lib/supabase/admin";

/** Página de cidade do site antigo (/estados/maringa/): vira a busca filtrada pela cidade. */
export async function GET(request: NextRequest, { params }: RouteContext<"/estados/[slug]">) {
  const slug = cleanSlug((await params).slug);
  if (!slug) return redirectTo(request, "/espacos", false);

  // O nome com acento só existe nos anúncios: acha a cidade cujo slug bate com o do endereço antigo.
  const { data } = await createAdminClient().from("listings").select("city").limit(1000);
  const city = data?.find((row) => slugify(row.city) === slug)?.city;
  return city ? redirectTo(request, `/espacos?${new URLSearchParams({ local: city })}`, true) : redirectTo(request, "/espacos", false);
}
