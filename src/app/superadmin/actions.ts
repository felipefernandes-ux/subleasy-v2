"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { PHOTO_BUCKET } from "@/lib/listing-options";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/superadmin/auth";

const MAX_PER_BATCH = 50;
const idsSchema = z.array(z.uuid()).min(1).max(MAX_PER_BATCH);

export type DeleteResult = { ok: true; deleted: number } | { ok: false; error: string };

/**
 * Exclui anúncios de qualquer dono, para limpar dados de teste. Não tem volta.
 * Apaga as fotos do Storage e a linha em listings; contatos, eventos, mensagens, favoritos
 * e listing_imports saem junto por ON DELETE CASCADE. Não grava em listing_removals de propósito:
 * essa tabela alimenta as métricas de motivos de saída e teste não deve entrar nelas.
 */
export async function deleteListingsAsAdmin(ids: string[], confirmation: string): Promise<DeleteResult> {
  const admin = await requireAdmin();

  if (confirmation.trim().toLowerCase() !== "excluir") {
    return { ok: false, error: "Digite “excluir” para confirmar." };
  }
  const parsed = idsSchema.safeParse([...new Set(ids)]);
  if (!parsed.success) return { ok: false, error: `Escolha de 1 a ${MAX_PER_BATCH} anúncios.` };

  const db = createAdminClient();
  const { data: rows, error: readError } = await db
    .from("listings")
    .select("id, slug, owner_id, photos")
    .in("id", parsed.data);
  if (readError) return { ok: false, error: "Não foi possível ler os anúncios." };
  if (!rows || rows.length === 0) return { ok: false, error: "Anúncios não encontrados." };

  // Fotos: as do anúncio e tudo que sobrou na pasta dele (enviadas e nunca salvas).
  const paths: string[] = [];
  for (const row of rows) {
    const folder = `${row.owner_id}/${row.id}`;
    const { data: files } = await db.storage.from(PHOTO_BUCKET).list(folder, { limit: 100 });
    paths.push(...row.photos, ...(files ?? []).map((file) => `${folder}/${file.name}`));
  }
  const unique = [...new Set(paths)];
  if (unique.length > 0) {
    const { error: storageError } = await db.storage.from(PHOTO_BUCKET).remove(unique);
    if (storageError) console.error("[superadmin] fotos não removidas:", storageError.message);
  }

  const { error } = await db.from("listings").delete().in("id", rows.map((row) => row.id));
  if (error) {
    console.error("[superadmin] exclusão falhou:", error.message);
    return { ok: false, error: "Não foi possível excluir. Nada foi apagado do banco; tente de novo." };
  }

  // Ainda não existe admin_audit_log; até lá, o rastro fica no log do servidor.
  console.info(`[superadmin] ${admin.email} excluiu ${rows.length} anúncio(s):`, rows.map((row) => row.id).join(", "));

  for (const row of rows) updateTag(`listing:${row.slug}`);
  updateTag("listings");
  return { ok: true, deleted: rows.length };
}
