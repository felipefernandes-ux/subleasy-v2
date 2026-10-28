"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNextPath } from "@/lib/auth-redirect";
import { recordWhatsAppConsent } from "@/lib/consent-log";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { bioProblem, isOwnAvatarPath } from "@/lib/public-profile";
import { TERMS_VERSION } from "@/lib/legal";
import { toBrazilianWhatsApp } from "@/lib/listing-options";
import { getOrigin } from "@/lib/origin";
import { createClient } from "@/lib/supabase/server";

type ProfileField = "display_name" | "whatsapp" | "terms" | "bio";

export type ProfileState =
  | { status: "idle" }
  | {
      status: "error";
      error?: string;
      fields: Partial<Record<ProfileField, string>>;
      values: { display_name: string; whatsapp: string; terms: boolean; marketing: boolean; bio: string; avatar_path: string; show_whatsapp: boolean };
    };

const FIELD_ERRORS: Record<ProfileField, string> = {
  display_name: "Digite seu nome ou o nome da clínica.",
  whatsapp: "Digite o WhatsApp com DDD, como (44) 99999-9999.",
  terms: "Para continuar, aceite os Termos de uso e a Política de privacidade.",
  bio: "Revise a apresentação.",
};

const profileSchema = z.object({
  display_name: z.string().trim().min(2).max(80),
  // Opcional: vazio vira null; preenchido, precisa ser um número válido.
  whatsapp: z
    .string()
    .trim()
    .transform((value) => (value ? toBrazilianWhatsApp(value) : null))
    .pipe(z.string().regex(/^\+55[0-9]{10,11}$/).nullable()),
  terms: z.literal("on"),
  marketing: z.boolean(),
});

/** Salva o perfil do primeiro acesso e segue para o destino em ?next=. */
export async function saveProfile(
  _previous: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const values = {
    display_name: String(formData.get("display_name") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    terms: formData.get("terms") === "on",
    marketing: formData.get("marketing") === "on",
    bio: String(formData.get("bio") ?? "").trim(),
    avatar_path: String(formData.get("avatar_path") ?? ""),
    show_whatsapp: formData.get("show_whatsapp") === "on",
  };
  const next = safeNextPath(formData.get("next"));

  const parsed = profileSchema.safeParse({ ...values, terms: formData.get("terms") ?? undefined });
  if (!parsed.success) {
    const fields: Partial<Record<ProfileField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as ProfileField;
      fields[field] = FIELD_ERRORS[field];
    }
    return { status: "error", fields, values };
  }
  const bioError = bioProblem(values.bio);
  if (bioError) return { status: "error", fields: { bio: bioError }, values };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(`/cadastro?next=${next}`)}`);

  const avatarPath = values.avatar_path && isOwnAvatarPath(values.avatar_path, user.id) ? values.avatar_path : null;

  // Sem número não há o que mostrar no perfil público.
  const showWhatsapp = values.show_whatsapp && parsed.data.whatsapp !== null;

  // WhatsApp no perfil público: o registro do consentimento vem antes (LGPD, art. 8º, §2º).
  if (showWhatsapp) {
    const logError = await recordWhatsAppConsent(supabase, user.id, true, "cadastro");
    if (logError) {
      console.error("[saveProfile] registro de consentimento", logError);
      return { status: "error", error: "Não foi possível salvar seu cadastro. Tente de novo.", fields: {}, values };
    }
  }

  // Primeiro cadastro (sem perfil anterior): vale o e-mail de boas-vindas.
  const { data: existing } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();

  const now = new Date().toISOString();
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: parsed.data.display_name,
    whatsapp_number: parsed.data.whatsapp,
    terms_version: TERMS_VERSION,
    terms_accepted_at: now,
    marketing_opt_in: parsed.data.marketing,
    marketing_opt_in_at: parsed.data.marketing ? now : null,
    bio: values.bio || null,
    avatar_path: avatarPath,
    show_whatsapp: showWhatsapp,
    show_whatsapp_at: showWhatsapp ? now : null,
  });

  if (error) {
    console.error("[saveProfile] Erro ao salvar no Supabase:", error);
    return {
      status: "error",
      error: "Não foi possível salvar seu cadastro. Tente de novo.",
      fields: {},
      values,
    };
  }

  if (!existing && user.email) await sendEmail(welcomeEmail(user.email, parsed.data.display_name, `${await getOrigin()}/anunciar`));

  redirect(next);
}
