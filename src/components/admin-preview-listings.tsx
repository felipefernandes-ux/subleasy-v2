import { getAdminClient } from "@/lib/admin-preview";
import { parsePhotoSizes } from "@/lib/listing-options";
import { ListingsCarousel } from "./listings-carousel";
import type { SearchResult } from "./search/result-card";

/**
 * Só para o admin: os anúncios que ainda não estão no ar, no mesmo carrossel da home.
 * Para os outros visitantes não renderiza nada, e o resto da home continua em cache.
 */
export async function AdminPreviewListings() {
  const supabase = await getAdminClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("listings")
    .select("id, slug, title, space_type, neighborhood, city, state, price, billing_type, photos, photo_sizes, offers, latitude, longitude")
    .neq("status", "active")
    .order("created_at", { ascending: false })
    .limit(24);
  if (!data?.length) return null;

  const listings: SearchResult[] = data.map((listing) => ({ ...listing, photo_sizes: parsePhotoSizes(listing.photo_sizes) }));
  return (
    <section aria-labelledby="previa-titulo" className="border-y border-warning-500/40 bg-warning-500/10">
      <div className="container-page py-12">
        <h2 id="previa-titulo" className="text-h3 font-bold text-ink-900">
          Prévia do admin: anúncios fora do ar
        </h2>
        <p className="mt-2 text-sm text-ink-700">Rascunhos, em análise, pausados e expirados. Só você vê esta seção.</p>
        <div className="mt-6">
          <ListingsCarousel listings={listings} />
        </div>
      </div>
    </section>
  );
}
