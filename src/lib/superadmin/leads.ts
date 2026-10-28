import { createAdminClient } from "@/lib/supabase/admin";
import { loadAdminUsers } from "./users";

export type Lead = {
  id: string;
  name: string;
  email: string;
  city: string;
  origin: "WordPress atual" | "Cadastro com aceite" | "Cadastro sem aceite";
  legalBasis: string;
  campaign: boolean;
  date: string;
};

/**
 * Contatos reais: as contas com e-mail que não são admin, com a origem e a base legal de cada uma.
 * Mesma regra do envio ao Brevo (buildBrevoAudience): quem anunciou ou começou a anunciar entra por
 * legítimo interesse; quem nunca anunciou só entra se aceitou novidades; suspensos nunca entram.
 * Chame depois de requireAdmin().
 */
export async function loadLeads(): Promise<Lead[]> {
  const db = createAdminClient();
  const [users, imports, listings] = await Promise.all([
    loadAdminUsers(),
    db.from("listing_imports").select("listing_id"),
    db.from("listings").select("id, owner_id"),
  ]);
  const importedIds = new Set((imports.data ?? []).map((row) => row.listing_id));
  const importedOwners = new Set((listings.data ?? []).filter((row) => importedIds.has(row.id)).map((row) => row.owner_id));

  return users
    .filter((user) => user.email && !user.roles.includes("admin"))
    .map((user): Lead => {
      const imported = importedOwners.has(user.id);
      const hasListing = user.listings > 0;
      const legalBasis = user.marketing
        ? "Consentimento (art. 7º, I)"
        : hasListing
          ? "Legítimo interesse (art. 7º, IX)"
          : "Execução do contrato (art. 7º, V)";
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city,
        origin: imported ? "WordPress atual" : user.marketing ? "Cadastro com aceite" : "Cadastro sem aceite",
        legalBasis,
        campaign: user.status !== "suspenso" && (user.marketing || hasListing),
        date: user.joined,
      };
    });
}
