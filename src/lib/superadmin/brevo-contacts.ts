import type { BrevoContact } from "@/lib/brevo";
import { inviteUrl } from "@/lib/invite-token";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadAdminUsers } from "./users";

export type LeadSegment = "ativo" | "expirado" | "rascunho" | "sem_anuncio";

export type BrevoAudience = {
  contacts: BrevoContact[];
  /** Quantos entram em cada grupo. */
  bySegment: Record<LeadSegment, number>;
  /** Quem ficou de fora e por quê, para o admin conferir antes de enviar. */
  skipped: { admin: number; suspenso: number; semEmail: number; semBaseLegal: number };
};

const firstName = (name: string, email: string) => {
  if (!name || name === email) return "";
  return name.trim().split(/\s+/)[0] ?? "";
};

/**
 * Monta a lista que vai para o Brevo a partir das contas e anúncios reais (só leitura).
 * Base legal: quem já anunciou ou começou a anunciar entra por legítimo interesse; quem nunca
 * anunciou só entra se aceitou receber novidades (marketing_opt_in). Admins e suspensos nunca entram.
 * Chame depois de requireAdmin().
 */
export async function buildBrevoAudience(): Promise<BrevoAudience> {
  const db = createAdminClient();
  const [users, listings, imports] = await Promise.all([
    loadAdminUsers(),
    db.from("listings").select("id, owner_id, title, status, city, created_at"),
    db.from("listing_imports").select("listing_id, wp_status"),
  ]);
  if (listings.error) throw new Error(`Não foi possível ler os anúncios: ${listings.error.message}`);

  const wpStatus = new Map((imports.data ?? []).map((row) => [row.listing_id, row.wp_status]));
  const byOwner = new Map<string, NonNullable<typeof listings.data>>();
  for (const row of listings.data ?? []) byOwner.set(row.owner_id, [...(byOwner.get(row.owner_id) ?? []), row]);

  const bySegment: BrevoAudience["bySegment"] = { ativo: 0, expirado: 0, rascunho: 0, sem_anuncio: 0 };
  const skipped = { admin: 0, suspenso: 0, semEmail: 0, semBaseLegal: 0 };
  const contacts: BrevoContact[] = [];

  for (const user of users) {
    if (!user.email) {
      skipped.semEmail++;
      continue;
    }
    if (user.roles.includes("admin")) {
      skipped.admin++;
      continue;
    }
    if (user.status === "suspenso") {
      skipped.suspenso++;
      continue;
    }

    const owned = (byOwner.get(user.id) ?? []).sort((a, b) => b.created_at.localeCompare(a.created_at));
    // Anúncio importado entra como rascunho no 2.0; o status de origem diz se estava no ar no WordPress.
    const segment: LeadSegment = owned.some((l) => l.status === "active" || wpStatus.get(l.id) === "active")
      ? "ativo"
      : owned.some((l) => wpStatus.get(l.id) === "expired")
        ? "expirado"
        : owned.length > 0
          ? "rascunho"
          : "sem_anuncio";

    if (segment === "sem_anuncio" && !user.marketing) {
      skipped.semBaseLegal++;
      continue;
    }

    // O título do e-mail vem do anúncio mais relevante: o que está no ar, senão o mais recente.
    const featured = owned.find((l) => l.status === "active" || wpStatus.get(l.id) === "active") ?? owned[0];
    bySegment[segment]++;
    contacts.push({
      email: user.email.toLowerCase(),
      attributes: {
        FIRSTNAME: firstName(user.name, user.email),
        AD_TITLE: featured?.title ?? "",
        INTEREST_URL: inviteUrl(user.id),
        SEGMENTO: segment,
        CIDADE: featured?.city ?? "",
        SUBLEASY_ID: user.id,
      },
    });
  }

  return { contacts, bySegment, skipped };
}
