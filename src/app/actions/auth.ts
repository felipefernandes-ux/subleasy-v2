"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PROFILE_PATH, safeNextPath } from "@/lib/auth-redirect";
import { getOrigin } from "@/lib/origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AuthMode = "signin" | "signup";

export type MagicLinkState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; error: string; email: string; code?: "no_account" };

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
 * Envia o link de acesso. Em "Entrar" só aceita e-mail que já tem conta;
 * em "Criar conta" cria o usuário se ele ainda não existir.
 */
export async function sendMagicLink(
  _previous: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
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
      const { data } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", String(data.user?.id))
        .maybeSingle();
      if (profile) redirect(next);
      redirect(`${PROFILE_PATH}${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`);
    }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: mode === "signup",
      emailRedirectTo: await callbackUrl(next),
    },
  });

  if (!error) return { status: "sent", email };

  // Com shouldCreateUser: false, e-mail sem conta volta como "Signups not allowed for otp".
  if (error.code === "otp_disabled" || /signups not allowed/i.test(error.message)) {
    return {
      status: "error",
      email,
      code: "no_account",
      error: "Não encontramos uma conta com este e-mail.",
    };
  }
  if (error.code === "over_email_send_rate_limit" || error.status === 429) {
    return {
      status: "error",
      email,
      error: "Muitos pedidos de link agora. Espere alguns minutos e tente de novo.",
    };
  }
  console.error("[sendMagicLink]", error);
  return { status: "error", email, error: "Não foi possível enviar o link. Tente de novo." };
}

/** Encerra a sessão e volta para o login. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
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
