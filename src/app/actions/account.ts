"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordWhatsAppConsent } from "@/lib/consent-log";
import { bioProblem, isOwnAvatarPath } from "@/lib/public-profile";
import { PHOTO_BUCKET, toBrazilianWhatsApp } from "@/lib/listing-options";
import { getOrigin } from "@/lib/origin";
import { createClient } from "@/lib/supabase/server";

export type FieldResult = { ok: true; message?: string } | { ok: false; error: string };

async function session() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/configuracoes");
  return { supabase, user };
}

/** O perfil público fica em cache: muda o perfil, renova a página dele e o bloco do anunciante nas salas. */
async function refreshPublicProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("profiles").select("public_id").eq("id", userId).maybeSingle();
  if (data) updateTag(`profile:${data.public_id}`);
}

/** Nome exibido: no perfil e nos anúncios aparece o primeiro nome e a inicial do último. */
export async function updateName(name: string): Promise<FieldResult> {
  const parsed = z.string().trim().min(2).max(80).safeParse(name);
  if (!parsed.success) return { ok: false, error: "Use de 2 a 80 caracteres." };
  const { supabase, user } = await session();
  const { error } = await supabase.from("profiles").update({ display_name: parsed.data }).eq("id", user.id);
  if (error) return { ok: false, error: "Não foi possível salvar. Tente de novo." };
  await refreshPublicProfile(supabase, user.id);
  refresh();
  return { ok: true };
}

/** Apresentação do perfil público. Vazia apaga. */
export async function updateBio(raw: string): Promise<FieldResult> {
  const bio = raw.trim();
  const problem = bioProblem(bio);
  if (problem) return { ok: false, error: problem };
  const { supabase, user } = await session();
  const { error } = await supabase.from("profiles").update({ bio: bio || null }).eq("id", user.id);
  if (error) return { ok: false, error: "Não foi possível salvar. Tente de novo." };
  await refreshPublicProfile(supabase, user.id);
  refresh();
  return { ok: true };
}

/** Troca a foto do perfil (já enviada ao Storage pelo navegador) e apaga a anterior. Sem caminho, remove a foto. */
export async function updateAvatar(path: string | null): Promise<FieldResult> {
  const { supabase, user } = await session();
  if (path && !isOwnAvatarPath(path, user.id)) return { ok: false, error: "Foto inválida. Envie de novo." };
  const { data: current } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).maybeSingle();
  const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id);
  if (error) return { ok: false, error: "Não foi possível salvar a foto. Tente de novo." };
  if (current?.avatar_path && current.avatar_path !== path) await supabase.storage.from(PHOTO_BUCKET).remove([current.avatar_path]);
  await refreshPublicProfile(supabase, user.id);
  refresh();
  return { ok: true };
}

/**
 * Liga ou desliga o WhatsApp no perfil público. Cada mudança entra no registro de consentimentos
 * (LGPD, art. 8º). Desligar vale na hora: o número só sai no clique, nunca do cache.
 */
export async function setShowWhatsApp(value: boolean): Promise<FieldResult> {
  const { supabase, user } = await session();
  // Primeiro a prova, depois a mudança: sem registro, o número não vai a público.
  const logError = await recordWhatsAppConsent(supabase, user.id, value, "configuracoes");
  if (logError) {
    console.error("[setShowWhatsApp] registro de consentimento", logError);
    return { ok: false, error: "Não foi possível salvar. Tente de novo." };
  }
  const { error } = await supabase
    .from("profiles")
    .update({ show_whatsapp: value, show_whatsapp_at: value ? new Date().toISOString() : null })
    .eq("id", user.id);
  if (error) return { ok: false, error: "Não foi possível salvar. Tente de novo." };
  await refreshPublicProfile(supabase, user.id);
  return { ok: true };
}

/** WhatsApp padrão dos anúncios novos. Os anúncios já publicados mantêm o número que têm. */
export async function updateWhatsApp(raw: string): Promise<FieldResult> {
  const whatsapp = toBrazilianWhatsApp(raw);
  if (!whatsapp) return { ok: false, error: "Digite o WhatsApp com DDD, como (44) 99999-9999." };
  const { supabase, user } = await session();
  const { error } = await supabase.from("profiles").update({ whatsapp_number: whatsapp }).eq("id", user.id);
  if (error) return { ok: false, error: "Não foi possível salvar. Tente de novo." };
  refresh();
  return { ok: true };
}

/** Troca o e-mail de login. O Supabase manda um link de confirmação para o endereço novo. */
export async function updateEmail(email: string): Promise<FieldResult> {
  const parsed = z.string().trim().toLowerCase().pipe(z.email()).safeParse(email);
  if (!parsed.success) return { ok: false, error: "Digite um e-mail válido, como nome@exemplo.com." };
  const { supabase, user } = await session();
  if (parsed.data === user.email) return { ok: false, error: "Este já é o seu e-mail." };
  const { error } = await supabase.auth.updateUser(
    { email: parsed.data },
    { emailRedirectTo: `${await getOrigin()}/auth/callback?next=/configuracoes/informacoes-pessoais` },
  );
  if (error) {
    console.error("[updateEmail]", error);
    return { ok: false, error: "Não foi possível trocar o e-mail agora. Tente de novo." };
  }
  return { ok: true, message: `Enviamos um link de confirmação para ${parsed.data}. O e-mail muda quando você clicar nele.` };
}

const NOTIFICATIONS = ["notify_messages", "notify_listing_updates", "notify_expiration", "marketing_opt_in"] as const;
export type NotificationKey = (typeof NOTIFICATIONS)[number];

/** Liga ou desliga um tipo de e-mail. A novidade por e-mail guarda quando a pessoa aceitou (LGPD). */
export async function setNotification(key: NotificationKey, value: boolean): Promise<FieldResult> {
  if (!NOTIFICATIONS.includes(key)) return { ok: false, error: "Opção inválida." };
  const { supabase, user } = await session();
  const update =
    key === "marketing_opt_in" ? { marketing_opt_in: value, marketing_opt_in_at: value ? new Date().toISOString() : null } : { [key]: value };
  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return { ok: false, error: "Não foi possível salvar. Tente de novo." };
  return { ok: true };
}

const SECURITY_PATH = "/configuracoes/login-e-seguranca";

/**
 * Conecta a conta Google à conta atual (vinculação manual do Supabase).
 * Vai ao Google e volta para Login e segurança com o resultado na URL.
 */
export async function connectGoogle() {
  const { supabase } = await session();
  const callback = new URL("/auth/callback", await getOrigin());
  callback.searchParams.set("next", `${SECURITY_PATH}?google=conectado`);
  const { data, error } = await supabase.auth.linkIdentity({ provider: "google", options: { redirectTo: callback.toString() } });
  if (error || !data?.url) {
    console.error("[connectGoogle]", error);
    redirect(`${SECURITY_PATH}?google=erro`);
  }
  redirect(data.url);
}

/** Desconecta o Google. Exige outro jeito de entrar, senão a pessoa ficaria trancada fora. */
export async function disconnectGoogle(): Promise<FieldResult> {
  const { supabase } = await session();
  const { data, error: listError } = await supabase.auth.getUserIdentities();
  if (listError) return { ok: false, error: "Não foi possível ler as conexões da conta. Tente de novo." };
  const identities = data?.identities ?? [];
  const google = identities.find((identity) => identity.provider === "google");
  if (!google) return { ok: true };
  if (identities.length < 2) {
    return { ok: false, error: "O Google é o único jeito de entrar na sua conta. Entre uma vez pelo link no e-mail antes de desconectar." };
  }
  const { error } = await supabase.auth.unlinkIdentity(google);
  if (error) {
    console.error("[disconnectGoogle]", error);
    return { ok: false, error: "Não foi possível desconectar agora. Tente de novo." };
  }
  refresh();
  return { ok: true };
}

/** Encerra a sessão em todos os aparelhos, inclusive neste. */
export async function signOutEverywhere() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/entrar");
}

/**
 * Encerra a conta de vez: fotos do Storage primeiro, depois o usuário, que leva junto
 * perfil, anúncios, mensagens e favoritos. Exige digitar ENCERRAR para confirmar.
 */
export async function deleteAccount(confirmation: string): Promise<FieldResult> {
  if (confirmation.trim().toUpperCase() !== "ENCERRAR") return { ok: false, error: "Digite ENCERRAR para confirmar." };
  const { supabase, user } = await session();

  // Fotos ficam em <usuário>/<anúncio>/<arquivo>.
  const { data: folders } = await supabase.storage.from(PHOTO_BUCKET).list(user.id, { limit: 1000 });
  for (const folder of folders ?? []) {
    const path = `${user.id}/${folder.name}`;
    const { data: files } = await supabase.storage.from(PHOTO_BUCKET).list(path, { limit: 1000 });
    if (files?.length) await supabase.storage.from(PHOTO_BUCKET).remove(files.map((file) => `${path}/${file.name}`));
  }

  const { error } = await supabase.rpc("delete_own_account");
  if (error) {
    console.error("[deleteAccount]", error);
    return { ok: false, error: "Não foi possível encerrar a conta agora. Escreva para o suporte." };
  }
  await supabase.auth.signOut();
  redirect("/?conta=encerrada");
}
