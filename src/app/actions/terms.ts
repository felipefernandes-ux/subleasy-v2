"use server";

import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth-redirect";
import { recordTermsAcceptance } from "@/lib/consent-log";
import { TERMS_VERSION } from "@/lib/legal";
import { createClient } from "@/lib/supabase/server";

/**
 * Aceite da versão atualizada dos Termos e da Política. Grava a versão e a data no perfil (o último aceite)
 * e uma linha em consent_events (o histórico). O registro vem antes: sem prova, não há aceite.
 */
export async function acceptTerms(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(next)}`);

  const logError = await recordTermsAcceptance(supabase, user.id, TERMS_VERSION);
  if (logError) {
    console.error("[acceptTerms] registro do aceite", logError);
    redirect(`/aceitar-termos?erro=1${next !== "/" ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ terms_version: TERMS_VERSION, terms_accepted_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) {
    console.error("[acceptTerms] perfil", error);
    redirect(`/aceitar-termos?erro=1${next !== "/" ? `&next=${encodeURIComponent(next)}` : ""}`);
  }
  redirect(next);
}
