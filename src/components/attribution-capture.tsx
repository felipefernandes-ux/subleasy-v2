"use client";

import { useEffect } from "react";
import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_MAX_AGE,
  CONSENT_EVENT,
  URL_PARAMS,
  analyticsAllowed,
  type Attribution,
} from "@/lib/attribution";

function hasCookie() {
  return document.cookie.split("; ").some((entry) => entry.startsWith(`${ATTRIBUTION_COOKIE}=`));
}

function clearCookie() {
  document.cookie = `${ATTRIBUTION_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
}

/**
 * Guarda a origem da primeira visita (primeiro toque: não sobrescreve). Sem aceite dos cookies de análise
 * nada é guardado, e a recusa apaga o que já existe. Se a pessoa aceitar o aviso na própria página de
 * chegada, os parâmetros do endereço ainda estão lá e são guardados nessa hora. Não renderiza nada.
 */
export function AttributionCapture() {
  useEffect(() => {
    if (window.location.hostname.startsWith("admin.")) return;

    function sync() {
      if (!analyticsAllowed()) {
        clearCookie();
        return;
      }
      if (hasCookie()) return;
      const query = new URLSearchParams(window.location.search);
      const found: Attribution = {};
      for (const key of URL_PARAMS) {
        const value = query.get(key)?.trim();
        if (value) found[key] = value.slice(0, 200);
      }
      if (!Object.keys(found).length) return;
      found.landing_path = window.location.pathname.slice(0, 200);
      found.first_seen = new Date().toISOString();
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${ATTRIBUTION_COOKIE}=${encodeURIComponent(JSON.stringify(found))}; Max-Age=${ATTRIBUTION_MAX_AGE}; path=/; SameSite=Lax${secure}`;
    }

    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  return null;
}
