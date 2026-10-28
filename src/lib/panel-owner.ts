import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * De quem é o painel que está na tela. Para o próprio anunciante, `db` é o cliente com a sessão
 * dele e as funções owner_* leem auth.uid(). Para o Super Admin vendo a conta de outra pessoa,
 * `db` é a service role (depois de requireAdmin()) e as funções admin_owner_* recebem o dono.
 * `base` é o prefixo das rotas do painel, para os links de período.
 */
export type PanelOwner = {
  id: string;
  db: SupabaseClient<Database>;
  asAdmin: boolean;
  base: string;
};

export function ownerRpc(owner: PanelOwner) {
  const { db, id, asAdmin } = owner;
  return {
    dailyMetrics: (since: string) =>
      asAdmin ? db.rpc("admin_owner_daily_metrics", { p_owner: id, p_since: since }) : db.rpc("owner_daily_metrics", { p_since: since }),
    favorites: () => (asAdmin ? db.rpc("admin_owner_listing_favorites", { p_owner: id }) : db.rpc("owner_listing_favorites")),
    contactPattern: (since: string) =>
      asAdmin ? db.rpc("admin_owner_contact_pattern", { p_owner: id, p_since: since }) : db.rpc("owner_contact_pattern", { p_since: since }),
  };
}
