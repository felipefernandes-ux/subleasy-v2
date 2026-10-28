import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { PROFILE_PATH, safeNextPath } from "@/lib/auth-redirect";
import { isAdminHost } from "@/lib/admin-host";
import { createClient } from "@/lib/supabase/server";
import { isTrustedDevice, markSessionVerified } from "@/lib/two-factor";
import { SESSION_COOKIE, verifySession } from "@/lib/two-factor-token";

/**
 * Volta do Google. Troca o código pela sessão (PKCE) e segue para o destino em ?next=,
 * depois da verificação por código (/verificar). No primeiro acesso, passa antes pelo
 * /cadastro. Link vencido volta para /entrar.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Login novo pelo Google: falta o código de 6 dígitos. Sessão já verificada (ao conectar o
      // Google numa conta aberta) e aparelho confiável seguem direto.
      const claims = (await supabase.auth.getClaims()).data?.claims;
      const store = await cookies();
      const verified =
        verifySession(store.get(SESSION_COOKIE)?.value, data.user.id, String(claims?.session_id ?? "")) ||
        (!isAdminHost(request.headers.get("host")) && (await isTrustedDevice(supabase, data.user.id)) && (await markSessionVerified()));
      if (!verified) {
        const verify = new URL("/verificar", origin);
        if (next !== "/") verify.searchParams.set("next", next);
        return NextResponse.redirect(verify);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profile) return NextResponse.redirect(new URL(next, origin));

      const signup = new URL(PROFILE_PATH, origin);
      if (next !== "/") signup.searchParams.set("next", next);
      return NextResponse.redirect(signup);
    }
    console.error("[auth/callback] Erro ao trocar o código:", error);
  }

  const back = new URL("/entrar", origin);
  back.searchParams.set("erro", "link");
  if (next !== "/") back.searchParams.set("next", next);
  return NextResponse.redirect(back);
}
