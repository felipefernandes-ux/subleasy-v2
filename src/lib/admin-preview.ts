import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Cliente com a sessão do admin, ou null para qualquer outra pessoa.
 * Serve à prévia: o admin vê no site os anúncios que ainda não estão no ar (rascunho, em análise,
 * pausado, expirado). A política "Admin lê todos os anúncios" libera a leitura no banco.
 * Lê cookies: chame só em trechos dinâmicos, nunca dentro de "use cache".
 */
export async function getAdminClient() {
  // O cliente do Supabase lê o relógio; sem isto o Next tenta pré-renderizar o trecho.
  await connection();
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return isAdmin ? supabase : null;
}

/** Nome do status para o aviso de prévia. */
export const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  pending_approval: "Em análise",
  active: "No ar",
  paused: "Pausado",
};
