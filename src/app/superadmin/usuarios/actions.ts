"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { PHOTO_BUCKET } from "@/lib/listing-options";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAudit } from "@/lib/superadmin/audit";
import { requireAdmin } from "@/lib/superadmin/auth";

export type UserActionResult = { ok: true } | { ok: false; error: string };

// Pouco mais de 100 anos: o Supabase não tem "para sempre". "none" tira a suspensão.
const BAN_FOREVER = "876600h";
const REASON_ERROR = "Escreva o motivo em pelo menos uma frase.";

/**
 * Confere quem é o alvo antes de qualquer ação sobre uma conta: o id é válido, a conta existe,
 * não é a do próprio admin e (nas ações destrutivas) não é de outro admin.
 */
async function loadTarget(userId: string, adminId: string, { allowAdmin }: { allowAdmin: boolean }) {
  if (!z.uuid().safeParse(userId).success) return { ok: false as const, error: "Conta não encontrada." };
  if (userId === adminId) return { ok: false as const, error: "Você não pode fazer isso na sua própria conta." };

  const db = createAdminClient();
  const [{ data, error }, { data: adminRow }] = await Promise.all([
    db.auth.admin.getUserById(userId),
    db.from("admin_users").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);
  if (error || !data.user) return { ok: false as const, error: "Conta não encontrada." };
  if (adminRow && !allowAdmin) return { ok: false as const, error: "Esta conta é de admin. Tire o papel de admin antes." };
  return { ok: true as const, db, user: data.user, isAdmin: Boolean(adminRow) };
}

/** Suspende a conta: login bloqueado, anúncios no ar pausados e perfil público fora do ar. Os dados ficam guardados. */
export async function suspendUser(userId: string, reason: string): Promise<UserActionResult> {
  const admin = await requireAdmin(`/usuarios/${userId}`);
  if (reason.trim().length < 3) return { ok: false, error: REASON_ERROR };
  const target = await loadTarget(userId, admin.id, { allowAdmin: false });
  if (!target.ok) return target;
  const { db, user } = target;

  const { error } = await db.auth.admin.updateUserById(userId, { ban_duration: BAN_FOREVER });
  if (error) {
    console.error("[superadmin] suspensão falhou:", error.message);
    return { ok: false, error: "Não foi possível suspender. Nada foi alterado." };
  }

  // Os anúncios no ar saem das buscas. Reativar a conta não os religa: cada um volta pelo admin.
  const { data: paused, error: pauseError } = await db
    .from("listings")
    .update({ status: "paused" })
    .eq("owner_id", userId)
    .eq("status", "active")
    .select("id, slug");
  if (pauseError) console.error("[superadmin] anúncios não pausados:", pauseError.message);
  for (const listing of paused ?? []) updateTag(`listing:${listing.slug}`);
  updateTag("listings");

  await recordAudit({
    action: "user.suspend",
    targetType: "user",
    targetId: userId,
    targetLabel: user.email ?? userId,
    reason,
    details: { anuncios_pausados: paused?.length ?? 0 },
  });
  return pauseError ? { ok: false, error: "A conta foi suspensa, mas os anúncios não foram pausados. Pause cada um na ficha do anúncio." } : { ok: true };
}

/** Tira a suspensão. Os anúncios continuam pausados até o admin religar cada um. */
export async function reactivateUser(userId: string, reason: string): Promise<UserActionResult> {
  const admin = await requireAdmin(`/usuarios/${userId}`);
  if (reason.trim().length < 3) return { ok: false, error: REASON_ERROR };
  const target = await loadTarget(userId, admin.id, { allowAdmin: true });
  if (!target.ok) return target;
  const { db, user } = target;

  const { error } = await db.auth.admin.updateUserById(userId, { ban_duration: "none" });
  if (error) {
    console.error("[superadmin] reativação falhou:", error.message);
    return { ok: false, error: "Não foi possível reativar. Nada foi alterado." };
  }
  updateTag("listings");
  await recordAudit({ action: "user.reactivate", targetType: "user", targetId: userId, targetLabel: user.email ?? userId, reason });
  return { ok: true };
}

const rolesSchema = z.array(z.enum(["anunciante", "cliente", "admin"]));

/** Define os papéis da conta. Admin é uma linha em admin_users; os outros ficam no perfil. */
export async function setUserRoles(userId: string, roles: string[], reason: string): Promise<UserActionResult> {
  const admin = await requireAdmin(`/usuarios/${userId}`);
  if (reason.trim().length < 3) return { ok: false, error: REASON_ERROR };
  const parsed = rolesSchema.safeParse(roles);
  if (!parsed.success) return { ok: false, error: "Papel inválido." };
  const wanted = new Set(parsed.data);

  const target = await loadTarget(userId, admin.id, { allowAdmin: true });
  if (!target.ok) return target;
  const { db, user, isAdmin } = target;

  const [{ data: profile }, { count: owned }] = await Promise.all([
    db.from("profiles").select("roles").eq("id", userId).maybeSingle(),
    db.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", userId),
  ]);
  const currentRoles = new Set<string>(profile?.roles ?? []);
  if (owned) currentRoles.add("anunciante");
  if (isAdmin) currentRoles.add("admin");

  const profileRoles = (["anunciante", "cliente"] as const).filter((role) => wanted.has(role));
  const profileChanged = profileRoles.some((role) => !currentRoles.has(role)) || (["anunciante", "cliente"] as const).some((role) => currentRoles.has(role) && !wanted.has(role));
  if (profileChanged && !profile) return { ok: false, error: "Esta conta ainda não tem perfil, então só o papel de admin pode mudar." };
  if (!wanted.has("anunciante") && owned) return { ok: false, error: "A conta tem anúncios, então continua sendo anunciante." };
  if (wanted.has("admin") && user.banned_until && Date.parse(user.banned_until) > Date.now()) {
    return { ok: false, error: "Reative a conta antes de torná-la admin." };
  }

  if (profileChanged) {
    const { error } = await db.from("profiles").update({ roles: profileRoles }).eq("id", userId);
    if (error) {
      console.error("[superadmin] papéis não salvos:", error.message);
      return { ok: false, error: "Não foi possível salvar os papéis. Nada foi alterado." };
    }
  }
  if (wanted.has("admin") !== isAdmin) {
    const { error } = wanted.has("admin")
      ? await db.from("admin_users").insert({ user_id: userId })
      : await db.from("admin_users").delete().eq("user_id", userId);
    if (error) {
      console.error("[superadmin] papel de admin não salvo:", error.message);
      return { ok: false, error: "Não foi possível mudar o papel de admin." };
    }
  }

  await recordAudit({
    action: "user.roles",
    targetType: "user",
    targetId: userId,
    targetLabel: user.email ?? userId,
    reason,
    details: { de: [...currentRoles].sort().join(", ") || "nenhum", para: [...wanted].sort().join(", ") || "nenhum" },
  });
  return { ok: true };
}

/** Todos os arquivos da pasta da conta no Storage: fotos de anúncios (uma subpasta por anúncio) e foto de perfil. */
async function userFiles(db: ReturnType<typeof createAdminClient>, userId: string) {
  const paths: string[] = [];
  const { data: top } = await db.storage.from(PHOTO_BUCKET).list(userId, { limit: 1000 });
  for (const entry of top ?? []) {
    // Subpasta não tem id; arquivo tem.
    if (entry.id) {
      paths.push(`${userId}/${entry.name}`);
      continue;
    }
    const { data: files } = await db.storage.from(PHOTO_BUCKET).list(`${userId}/${entry.name}`, { limit: 1000 });
    paths.push(...(files ?? []).map((file) => `${userId}/${entry.name}/${file.name}`));
  }
  return paths;
}

/**
 * Exclui a conta de vez: login, perfil, anúncios, fotos e favoritos saem. A pesquisa de saída dos anúncios
 * fica sem dono (estatística anonimizada). A prova do pedido é a linha do registro de auditoria, com o e-mail.
 */
export async function deleteUser(userId: string, reason: string, confirmation: string): Promise<UserActionResult> {
  const admin = await requireAdmin(`/usuarios/${userId}`);
  if (reason.trim().length < 3) return { ok: false, error: REASON_ERROR };
  const target = await loadTarget(userId, admin.id, { allowAdmin: false });
  if (!target.ok) return target;
  const { db, user } = target;
  if (confirmation.trim().toLowerCase() !== (user.email ?? "").toLowerCase() || !user.email) {
    return { ok: false, error: "Digite o e-mail da conta para confirmar." };
  }

  const { data: listings } = await db.from("listings").select("id, slug").eq("owner_id", userId);

  // Estatística de saída: sem nome do anúncio nem comentário livre, que podem identificar a pessoa.
  const { error: anonError } = await db
    .from("listing_removals")
    .update({ owner_id: null, title: "Anúncio de conta excluída", comment: null })
    .eq("owner_id", userId);
  if (anonError) {
    console.error("[superadmin] estatísticas não anonimizadas:", anonError.message);
    return { ok: false, error: "Não foi possível anonimizar as estatísticas. Nada foi apagado." };
  }

  const files = await userFiles(db, userId);

  // Apaga a conta; perfil, anúncios, contatos, mensagens, favoritos e consentimentos saem por ON DELETE CASCADE.
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) {
    console.error("[superadmin] exclusão falhou:", error.message);
    return { ok: false, error: "Não foi possível excluir a conta. Tente de novo." };
  }

  if (files.length > 0) {
    const { error: storageError } = await db.storage.from(PHOTO_BUCKET).remove(files);
    if (storageError) console.error("[superadmin] arquivos da conta excluída não removidos:", storageError.message);
  }
  for (const listing of listings ?? []) updateTag(`listing:${listing.slug}`);
  updateTag("listings");

  await recordAudit({
    action: "user.delete",
    targetType: "user",
    targetId: userId,
    targetLabel: user.email ?? userId,
    reason,
    details: { anuncios: listings?.length ?? 0, arquivos: files.length },
  });
  return { ok: true };
}
