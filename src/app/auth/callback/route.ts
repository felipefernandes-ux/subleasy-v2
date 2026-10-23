import { NextResponse, type NextRequest } from "next/server";
import { PROFILE_PATH, safeNextPath } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * Volta do Google e do link mágico. Troca o código pela sessão (PKCE)
 * e segue para o destino em ?next=. No primeiro acesso, passa antes pelo
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
