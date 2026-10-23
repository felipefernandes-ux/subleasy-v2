"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNextPath } from "@/lib/auth-redirect";
import { TERMS_VERSION } from "@/lib/legal";
import { toBrazilianWhatsApp } from "@/lib/listing-options";
import { createClient } from "@/lib/supabase/server";

type ProfileField = "display_name" | "whatsapp" | "terms";

export type ProfileState =
  | { status: "idle" }
  | {
      status: "error";
      error?: string;
      fields: Partial<Record<ProfileField, string>>;
      values: { display_name: string; whatsapp: string; terms: boolean; marketing: boolean };
    };

const FIELD_ERRORS: Record<ProfileField, string> = {
  display_name: "Digite seu nome ou o nome da clínica.",
  whatsapp: "Digite o WhatsApp com DDD, como (44) 99999-9999.",
  terms: "Para continuar, aceite os Termos de uso e a Política de privacidade.",
};

const profileSchema = z.object({
  display_name: z.string().trim().min(2).max(80),
  whatsapp: z.string().transform(toBrazilianWhatsApp).pipe(z.string().regex(/^\+55[0-9]{10,11}$/)),
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(`/cadastro?next=${next}`)}`);

  const now = new Date().toISOString();
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: parsed.data.display_name,
    whatsapp_number: parsed.data.whatsapp,
    terms_version: TERMS_VERSION,
    terms_accepted_at: now,
    marketing_opt_in: parsed.data.marketing,
    marketing_opt_in_at: parsed.data.marketing ? now : null,
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

  redirect(next);
}
