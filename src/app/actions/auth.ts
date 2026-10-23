"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNextPath } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

export type AuthMode = "signin" | "signup";

export type MagicLinkState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; error: string; email: string; code?: "no_account" };

const emailSchema = z.email();

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

// O Origin vem em toda chamada de Server Action; o host é a reserva.
async function callbackUrl(next: string) {
  const requestHeaders = await headers();
  const origin =
    requestHeaders.get("origin") ??
    `${requestHeaders.get("x-forwarded-proto") ?? "http"}://${requestHeaders.get("host")}`;
  const url = new URL("/auth/callback", origin);
  if (next !== "/") url.searchParams.set("next", next);
  return url.toString();
}
