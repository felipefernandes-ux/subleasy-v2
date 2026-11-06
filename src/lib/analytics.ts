"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { createClient } from "@/lib/supabase/client";

const CONSENT_KEY = "subleasy:cookies";

/** Eventos de contato que viram eventos-chave no GA4 (e conversões no Google Ads). */
export type ContactEvent = "whatsapp_click" | "inquiry_submit";

function analyticsAllowed() {
  try {
    return JSON.parse(window.localStorage.getItem(CONSENT_KEY) ?? "null")?.analytics === true;
  } catch {
    return false;
  }
}

/**
 * Manda um contato com o anunciante ao GA4. Só envia com o aceite de cookies de análise e com o GA já
 * carregado. Super Admin nunca gera dado no site público, então também não manda. Visitante sem login
 * não precisa de consulta: não é admin. Erros aqui não podem atrapalhar o contato, por isso nada é lançado.
 */
export async function trackContact(event: ContactEvent, listingId: string) {
  try {
    if (!analyticsAllowed() || !(window as unknown as { dataLayer?: unknown }).dataLayer) return;
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (isAdmin) return;
    }
    sendGAEvent("event", event, { listing_id: listingId, contact_channel: event === "whatsapp_click" ? "whatsapp" : "formulario" });
  } catch (error) {
    console.error("[trackContact]", error);
  }
}
