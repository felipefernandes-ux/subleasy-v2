"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const CONSENT_KEY = "subleasy:cookies";
const CONSENT_EVENT = "subleasy:cookies-change";

function analyticsAllowed() {
  try {
    return JSON.parse(window.localStorage.getItem(CONSENT_KEY) ?? "null")?.analytics === true;
  } catch {
    return false;
  }
}

/**
 * Liga o PostHog ao usuário logado, só com o aceite de cookies de análise. A pessoa é identificada pelo id do
 * Supabase (nunca e-mail ou nome) e ganha `user_type`: "anunciante" (tem anúncio) ou "sem_anuncio" (logado, sem anúncio).
 * Sem login o visitante continua anônimo. O Supabase fica no navegador para não tornar o layout raiz dinâmico.
 */
export function PostHogIdentify() {
  useEffect(() => {
    if (window.location.hostname.startsWith("admin.")) return;
    const supabase = createClient();
    let lastId: string | null = null;

    async function sync(userId: string | null) {
      if (!userId || !analyticsAllowed()) {
        if (lastId) posthog.reset();
        lastId = null;
        return;
      }
      if (userId === lastId) return;
      lastId = userId;
      const [{ count }, { data: isAdmin }] = await Promise.all([
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", userId),
        supabase.rpc("is_admin"),
      ]);
      posthog.identify(userId, { user_type: count ? "anunciante" : "sem_anuncio", is_admin: Boolean(isAdmin) });
    }

    supabase.auth.getUser().then(({ data }) => sync(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Fora do callback: chamar o Supabase dentro dele pode travar.
      setTimeout(() => sync(session?.user.id ?? null), 0);
    });
    const onConsent = () => supabase.auth.getUser().then(({ data }) => sync(data.user?.id ?? null));
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener(CONSENT_EVENT, onConsent);
    };
  }, []);

  return null;
}
