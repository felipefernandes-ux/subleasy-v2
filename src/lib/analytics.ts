"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { analyticsAllowed } from "@/lib/attribution";
import { createClient } from "@/lib/supabase/client";

/** Eventos de contato que viram eventos-chave no GA4 (e conversões no Google Ads). */
export type ContactEvent = "whatsapp_click" | "inquiry_submit";

/**
 * Manda um contato com o anunciante ao GA4. Só envia com o aceite de cookies de análise e com o GA já
 * carregado. Super Admin nunca gera dado no site público, então também não manda. Visitante sem login
 * não precisa de consulta: não é admin. Erros aqui não podem atrapalhar o contato, por isso nada é lançado.
 */
export async function trackContact(event: ContactEvent, listingId: string) {
  await sendEvent(event, { listing_id: listingId, contact_channel: event === "whatsapp_click" ? "whatsapp" : "formulario" });
}

/** Evento da calculadora de sublocação: uso, resultado visto e clique em anunciar. Mesmas regras de consentimento e de Super Admin. */
export async function trackCalculator(event: "calculator_started" | "calculator_result" | "calculator_cta_click", params: Record<string, string | number> = {}) {
  await sendEvent(event, params);
}

async function sendEvent(event: string, params: Record<string, string | number>) {
  try {
    if (!analyticsAllowed() || !(window as unknown as { dataLayer?: unknown }).dataLayer) return;
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (isAdmin) return;
    }
    sendGAEvent("event", event, params);
  } catch (error) {
    console.error("[trackEvent]", error);
  }
}
