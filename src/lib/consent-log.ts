import { headers } from "next/headers";
import { WHATSAPP_CONSENT, type ConsentChannel } from "@/lib/public-profile";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Registra a decisão de mostrar (ou não) o WhatsApp no perfil público.
 * É a prova do consentimento (LGPD, art. 8º, §2º): quem, o quê, quando, onde, com qual texto.
 */
export async function recordWhatsAppConsent(supabase: Supabase, userId: string, granted: boolean, channel: ConsentChannel) {
  const list = await headers();
  const ip = list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || null;
  const { error } = await supabase.from("consent_events").insert({
    user_id: userId,
    purpose: "show_whatsapp_profile",
    granted,
    channel,
    text_version: WHATSAPP_CONSENT.version,
    ip,
    user_agent: list.get("user-agent")?.slice(0, 400) ?? null,
  });
  return error;
}
