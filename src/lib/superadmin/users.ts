import { connection } from "next/server";
import { formatWhatsApp } from "@/lib/listing-options";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role, User, UserStatus } from "@/app/superadmin/_data/mock";

export type AdminUser = User & {
  /** Contas criadas pela importação nunca entram; o login vem do convite. */
  lastSignIn: string | null;
  provider: string;
  termsAcceptedAt: string | null;
  marketingAt: string | null;
};

const date = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : null);

function topCity(cities: string[]) {
  const counts = new Map<string, number>();
  for (const city of cities) counts.set(city, (counts.get(city) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
}

/**
 * Todas as contas de login com perfil, papéis e anúncios. Só leitura; chame depois de requireAdmin().
 * Status: perfil = ativo; sem perfil e sem login = convite pendente; banned_until no futuro = suspenso.
 */
export async function loadAdminUsers(onlyId?: string): Promise<AdminUser[]> {
  await connection(); // lê o relógio (banned_until)
  const db = createAdminClient();

  const [auth, profiles, admins, listings] = await Promise.all([
    db.auth.admin.listUsers({ perPage: 1000 }),
    db
      .from("profiles")
      .select("id, display_name, whatsapp_number, roles, marketing_opt_in, marketing_opt_in_at, terms_accepted_at, created_at"),
    db.from("admin_users").select("user_id"),
    db.from("listings").select("owner_id, city"),
  ]);
  if (auth.error) throw new Error(`Não foi possível ler os usuários: ${auth.error.message}`);

  const profileById = new Map((profiles.data ?? []).map((row) => [row.id, row]));
  const adminIds = new Set((admins.data ?? []).map((row) => row.user_id));
  const citiesByOwner = new Map<string, string[]>();
  for (const row of listings.data ?? []) {
    citiesByOwner.set(row.owner_id, [...(citiesByOwner.get(row.owner_id) ?? []), row.city]);
  }

  const users = auth.data.users
    .filter((user) => !onlyId || user.id === onlyId)
    .map((user): AdminUser => {
      const profile = profileById.get(user.id);
      const email = user.email ?? "";
      const owned = citiesByOwner.get(user.id) ?? [];
      const roles = new Set<Role>((profile?.roles ?? []).filter((role): role is Role => role === "anunciante" || role === "cliente"));
      if (owned.length > 0) roles.add("anunciante");
      if (adminIds.has(user.id)) roles.add("admin");

      const banned = user.banned_until ? Date.parse(user.banned_until) > Date.now() : false;
      const status: UserStatus = banned ? "suspenso" : profile || user.last_sign_in_at ? "ativo" : "convite_pendente";

      return {
        id: user.id,
        // Sem perfil, o nome vem do metadado gravado na importação (full_name) ou, no Google, do próprio login.
        name: profile?.display_name || String(user.user_metadata?.full_name ?? "") || email || "Sem nome",
        email,
        whatsapp: profile?.whatsapp_number ? formatWhatsApp(profile.whatsapp_number) : "—",
        city: topCity(owned),
        roles: [...roles],
        status,
        joined: date(profile?.created_at ?? user.created_at) ?? "—",
        listings: owned.length,
        marketing: profile?.marketing_opt_in ?? false,
        lastSignIn: date(user.last_sign_in_at),
        provider: user.app_metadata?.provider ?? "email",
        termsAcceptedAt: date(profile?.terms_accepted_at),
        marketingAt: date(profile?.marketing_opt_in_at),
      };
    });

  // Cadastros reais primeiro, convites pendentes depois; dentro de cada grupo, por nome.
  const rank = (user: AdminUser) => (user.status === "convite_pendente" ? 1 : 0);
  return users.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, "pt-BR"));
}
