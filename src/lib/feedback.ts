import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/** Como a pessoa cadastrou o anúncio, detectado pelo app (listings.creation_method). */
export type CreationMethod = "ia" | "campo_a_campo";

/**
 * Pesquisa "Facilidade de anunciar (primeiro anúncio)", do tipo api, no PostHog: o PostHog guarda a definição e
 * as respostas, e o app desenha a pergunta (components/first-listing-feedback.tsx). Os ids vêm do PostHog;
 * o das perguntas liga cada resposta à pergunta, então não troque ao editar a pesquisa.
 */
export const FIRST_LISTING_SURVEY = {
  id: "01a1a33c-00a9-0000-7a1e-5dda646c90df",
  rating: "e74da461-ffa0-4deb-8732-6614031c912d",
  comment: "37cfae53-40ef-4d02-94ac-e486678fe232",
} as const;

/**
 * A pesquisa só vale para quem acabou de enviar o primeiro anúncio que cadastrou sozinho: o anúncio tem método
 * de cadastro (importados e antigos não têm) e a pessoa não tem outro anúncio enviado antes. Devolve o método
 * ou null. Chame com a sessão da própria pessoa.
 */
export async function loadFeedbackMethod(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  listingId: string,
): Promise<CreationMethod | null> {
  const [{ data: current }, { count: others }] = await Promise.all([
    supabase.from("listings").select("creation_method").eq("id", listingId).maybeSingle(),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", ownerId)
      .neq("id", listingId)
      .not("submitted_at", "is", null),
  ]);
  const method = current?.creation_method;
  if ((method !== "ia" && method !== "campo_a_campo") || others) return null;
  return method;
}
