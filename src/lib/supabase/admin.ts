import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { SUPABASE_URL } from "./env";

/**
 * Cliente com a service role: ignora o RLS. Só para o Super Admin, depois de requireAdmin().
 * A chave nunca usa NEXT_PUBLIC_ e este arquivo só pode ser importado por código de servidor
 * (Server Components e Server Actions).
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY no .env.local");
  return createClient<Database>(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
