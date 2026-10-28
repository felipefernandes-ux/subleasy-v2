"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdminHost } from "@/lib/admin-host";
import { PROFILE_PATH, safeNextPath } from "@/lib/auth-redirect";
import { getOrigin } from "@/lib/origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkCode, issueCode, markSessionVerified } from "@/lib/two-factor";

export type AuthMode = "signin" | "signup";

export type LoginCodeState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; error: string; email: string; code?: "no_account" };

export type CodeFormState = { status: "idle" } | { status: "error"; error: string };

const emailSchema = z.email();

/** E-mail que entra sem link, só no localhost em desenvolvimento. */
const LOCAL_DEV_EMAIL = "felipe@lavuh.com";

/** Leva ao Google. O Supabase devolve em /auth/callback com o código da sessão. */
export async function signInWithGoogle(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: await callbackUrl(next) },
  });

  if (error || !data.url) {
    console.error("[signInWithGoogle]", error);
    const mode = formData.get("mode") === "signup" ? "/criar-conta" : "/entrar";
    redirect(`${mode}?erro=google&next=${encodeURIComponent(next)}`);
  }
  redirect(data.url);
}

/**
 * Pede o código de 6 dígitos do login. Em "Entrar" só aceita e-mail que já tem conta;
 * em "Criar conta" a conta só nasce depois que o código é digitado (veja verifyLoginCode),
 * então ninguém cria conta com um e-mail que não controla.
 */
export async function requestLoginCode(_previous: LoginCodeState, formData: FormData): Promise<LoginCodeState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const mode: AuthMode = formData.get("mode") === "signup" ? "signup" : "signin";
  const next = safeNextPath(formData.get("next"));

  if (!emailSchema.safeParse(email).success) {
    return { status: "error", email, error: "Digite um e-mail válido, como nome@exemplo.com." };
  }

  const supabase = await createClient();

  if (email === LOCAL_DEV_EMAIL && (await isLocalhost())) {
    const signedIn = await signInLocally(supabase, email);
    if (signedIn) {
      await markSessionVerified();
      const { data } = await supabase.auth.getUser();
      return redirectAfterSignIn(supabase, String(data.user?.id), next);
    }
  }

  const { data: userId } = await createAdminClient().rpc("auth_user_id_by_email", { p_email: email });
  if (mode === "signin" && !userId) {
    return { status: "error", email, code: "no_account", error: "Não encontramos uma conta com este e-mail." };
  }

  const issued = await issueCode(mode === "signup" ? "signup" : "login", email, userId ?? null);
  if (!issued.ok) return { status: "error", email, error: issued.error };
  return { status: "sent", email };
}

/**
 * Confere o código do e-mail e abre a sessão. Em "Criar conta", é aqui que a conta nasce, já com
 * o e-mail confirmado; depois o cadastro (nome e WhatsApp) completa o perfil.
 */
export async function verifyLoginCode(_previous: CodeFormState, formData: FormData): Promise<CodeFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const mode: AuthMode = formData.get("mode") === "signup" ? "signup" : "signin";
  const next = safeNextPath(formData.get("next"));
  if (!emailSchema.safeParse(email).success) return { status: "error", error: "Digite um e-mail válido." };

  const checked = await checkCode([mode === "signup" ? "signup" : "login"], email, String(formData.get("code") ?? ""));
  if (!checked.ok) return { status: "error", error: checked.error };

  const db = createAdminClient();
  const { data: existing } = await db.rpc("auth_user_id_by_email", { p_email: email });
  if (!existing) {
    if (mode !== "signup") return { status: "error", error: "Não encontramos uma conta com este e-mail." };
    const { error } = await db.auth.admin.createUser({ email, email_confirm: true });
    if (error) {
      console.error("[verifyLoginCode] createUser", error.message);
      return { status: "error", error: "Não foi possível criar a conta. Tente de novo." };
    }
  }

  // Abre a sessão no navegador: gera o token de acesso e o confirma aqui mesmo, sem mandar e-mail.
  const supabase = await createClient();
  if (!(await signInLocally(supabase, email))) return { status: "error", error: "Não foi possível entrar agora. Tente de novo." };
  await markSessionVerified();

  const { data } = await supabase.auth.getUser();
  return redirectAfterSignIn(supabase, String(data.user?.id), next);
}

/** Envia o código da segunda etapa para quem entrou pelo Google. Não reenvia dentro de 30 segundos. */
export async function sendSessionCode(): Promise<CodeFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { status: "error", error: "Entre de novo para continuar." };
  const issued = await issueCode("session", user.email.toLowerCase(), user.id);
  return issued.ok ? { status: "idle" } : { status: "error", error: issued.error };
}

/** Confere o código da segunda etapa e libera a sessão. `trust` lembra o aparelho por 30 dias. */
export async function verifySessionCode(_previous: CodeFormState, formData: FormData): Promise<CodeFormState> {
  const next = safeNextPath(formData.get("next"));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect(`/entrar?next=${encodeURIComponent(next)}`);

  const checked = await checkCode(["session"], user.email.toLowerCase(), String(formData.get("code") ?? ""));
  if (!checked.ok) return { status: "error", error: checked.error };

  // Super Admin nunca confia no aparelho: o código vale por login.
  const trust = formData.get("trust") === "on" && !isAdminHost((await headers()).get("host"));
  await markSessionVerified({ trust });
  return redirectAfterSignIn(supabase, user.id, next);
}

/** Encerra a sessão e volta para o login. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}

/** Quem ainda não tem perfil passa pelo cadastro antes do destino. */
async function redirectAfterSignIn(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, next: string): Promise<never> {
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (profile) redirect(next);
  redirect(`${PROFILE_PATH}${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`);
}

async function callbackUrl(next: string) {
  const url = new URL("/auth/callback", await getOrigin());
  if (next !== "/") url.searchParams.set("next", next);
  return url.toString();
}

async function isLocalhost() {
  if (process.env.NODE_ENV === "production") return false;
  const host = (await headers()).get("host") ?? "";
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
}

/** Gera o link com a service role e já o confirma aqui, sem e-mail. */
async function signInLocally(supabase: Awaited<ReturnType<typeof createClient>>, email: string) {
  try {
    const { data, error } = await createAdminClient().auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (error || !data.properties?.hashed_token) throw error;
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: data.properties.hashed_token,
    });
    if (verifyError) throw verifyError;
    return true;
  } catch (error) {
    console.error("[signInLocally]", error);
    return false;
  }
}
