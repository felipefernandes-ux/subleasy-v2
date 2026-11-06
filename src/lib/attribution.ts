/**
 * Origem da primeira visita (utm_*, gclid, fbclid), guardada num cookie próprio por 90 dias e enviada
 * junto do clique no WhatsApp ou da mensagem do formulário. Só é guardada com o aceite dos cookies de análise.
 */

export const ATTRIBUTION_COOKIE = "sl_attr";
export const ATTRIBUTION_MAX_AGE = 60 * 60 * 24 * 90;

const CONSENT_KEY = "subleasy:cookies";
export const CONSENT_EVENT = "subleasy:cookies-change";

/** Parâmetros do endereço que valem guardar. */
export const URL_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"] as const;

const KEYS = [...URL_PARAMS, "landing_path", "first_seen"] as const;
export type Attribution = Partial<Record<(typeof KEYS)[number], string>>;

/** Lê o aceite dos cookies de análise guardado neste navegador. Só roda no navegador. */
export function analyticsAllowed() {
  try {
    return JSON.parse(window.localStorage.getItem(CONSENT_KEY) ?? "null")?.analytics === true;
  } catch {
    return false;
  }
}

/** Valida o que veio do cookie: só as chaves conhecidas, só texto, cortado em 200 caracteres. */
export function parseAttribution(raw: string | undefined): Attribution | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
    const clean: Attribution = {};
    for (const key of KEYS) {
      const item = value[key];
      if (typeof item === "string" && item.trim()) clean[key] = item.trim().slice(0, 200);
    }
    return Object.keys(clean).length ? clean : null;
  } catch {
    return null;
  }
}
