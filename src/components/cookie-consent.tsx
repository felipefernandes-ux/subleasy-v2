"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "subleasy:cookies";
const CHANGE_EVENT = "subleasy:cookies-change";
const OPEN_EVENT = "subleasy:cookies-open";

/** Só o Google Analytics depende de consentimento; os cookies de sessão e de contagem do anúncio são necessários ao serviço. */
type Stored = { analytics: boolean; at: string };

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function parse(raw: string | null): Stored | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Stored>;
    return typeof value.analytics === "boolean" ? { analytics: value.analytics, at: String(value.at ?? "") } : null;
  } catch {
    return null;
  }
}

/** Apaga os cookies _ga* do host e dos domínios acima dele (subleasy.com.br, .com.br). */
function clearGoogleCookies() {
  const labels = window.location.hostname.split(".");
  const domains = labels.slice(0, -1).map((_, i) => labels.slice(i).join("."));
  for (const entry of document.cookie.split("; ")) {
    const name = entry.split("=")[0];
    if (!/^_ga(_|$)/.test(name)) continue;
    document.cookie = `${name}=; Max-Age=0; path=/`;
    for (const domain of domains) document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`;
  }
}

/**
 * Banner de cookies (LGPD) e carregamento do Google Analytics 4, que só entra depois do aceite.
 * Aceitar e recusar têm o mesmo peso; a escolha fica neste navegador e pode ser refeita pelo rodapé.
 * O Super Admin (admin.<domínio>) não usa GA nem mostra o banner.
 */
export function CookieConsent({ gaId }: { gaId?: string }) {
  // null no servidor e na hidratação: nada é renderizado até a escolha guardada ser lida.
  const raw = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(STORAGE_KEY) ?? "",
    () => null,
  );
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const open = () => setReopened(true);
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  if (raw === null || window.location.hostname.startsWith("admin.")) return null;

  const choice = parse(raw);
  const analyticsOn = Boolean(gaId && choice?.analytics);

  function decide(analytics: boolean) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics, at: new Date().toISOString() } satisfies Stored));
    if (gaId) {
      // Desliga o gtag já carregado nesta página e limpa o que ele gravou.
      (window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = !analytics;
      if (!analytics) clearGoogleCookies();
    }
    setReopened(false);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  const buttonClass =
    "focus-ring inline-flex min-h-11 flex-1 items-center justify-center rounded-control px-4 text-sm font-semibold";

  return (
    <>
      {analyticsOn && gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      {!choice || reopened ? (
        <div
          role="region"
          aria-label="Cookies"
          className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 animate-fade-up rounded-card bg-white p-5 shadow-raised ring-1 ring-ink-900/8 lg:right-auto lg:bottom-6 lg:left-6 lg:max-w-md"
        >
          <p className="text-sm font-bold text-ink-900">Cookies para entender o uso do site</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
            Usamos o Google Analytics para medir quais páginas são visitadas e melhorar o Subleasy. Ele só liga se você
            aceitar. Os cookies de login e segurança são necessários e ficam ativos sempre.{" "}
            <Link href="/privacidade#cookies" className="font-semibold text-brand-600 underline underline-offset-2">
              Saiba mais
            </Link>
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => decide(false)}
              className={`${buttonClass} bg-white text-ink-900 ring-1 ring-ink-300 hover:bg-ink-50`}
            >
              Recusar
            </button>
            <button
              type="button"
              onClick={() => decide(true)}
              className={`${buttonClass} bg-brand-600 text-white hover:bg-brand-700`}
            >
              Aceitar
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Link do rodapé que reabre o banner, para quem quiser mudar a escolha. */
export function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className="focus-ring inline-flex min-h-11 items-center rounded-control text-sm text-ink-500 hover:text-ink-900"
    >
      Preferências de cookies
    </button>
  );
}
