import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminHost, isSharedPath, isSuperAdminPath } from "@/lib/admin-host";
import { AUTH_PATHS, PROFILE_PATH, isProtectedPath, safeNextPath } from "@/lib/auth-redirect";
import type { Database } from "@/lib/supabase/database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { SESSION_COOKIE, TRUST_COOKIE, TRUST_DAYS, readTrust, signSession, verifySession } from "@/lib/two-factor-token";

/**
 * Renova a sessão do Supabase a cada requisição e protege as rotas do anunciante:
 * sem conta, /anunciar e /painel levam para /entrar?next=<rota>; com conta mas
 * sem perfil, levam para /cadastro?next=<rota>.
 *
 * Todo login novo exige o código de 6 dígitos enviado por e-mail: sem o cookie de sessão verificada
 * (veja two-factor-token.ts), quem está logado vai para /verificar antes de qualquer rota protegida.
 * No site público, um aparelho marcado como confiável pula o código; no Super Admin, nunca.
 *
 * Em admin.<domínio> o Super Admin ocupa a raiz: /leads é servido por /superadmin/leads,
 * e o resto do site público dá 404. No domínio público, /superadmin dá 404.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const adminHost = isAdminHost(request.headers.get("host"));

  if (isSuperAdminPath(pathname)) {
    if (!adminHost) return notFound(request);
    // Endereço antigo ou colado do código: /superadmin/x vira /x no subdomínio.
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice("/superadmin".length) || "/";
    return NextResponse.redirect(url);
  }
  const toSuperAdmin = adminHost && !isSharedPath(pathname);

  // O Super Admin cuida do próprio acesso (requireAdmin); aqui só a sessão é renovada.
  const pass = () => {
    if (!toSuperAdmin) return NextResponse.next({ request });
    const url = request.nextUrl.clone();
    url.pathname = `/superadmin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url, { request });
  };
  let response = pass();

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = pass();
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getClaims valida o JWT; não confie em getSession() no servidor.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const signedIn = Boolean(claims);

  // A sessão passou pelo código? Cookie preso ao session_id; ou, no site público, aparelho confiável.
  const verified = async () => {
    if (!claims?.sub) return false;
    const sub = String(claims.sub);
    if (verifySession(request.cookies.get(SESSION_COOKIE)?.value, sub, String(claims.session_id ?? ""))) return true;
    if (adminHost) return false;
    const issued = readTrust(request.cookies.get(TRUST_COOKIE)?.value, sub);
    if (issued === null) return false;
    const { data } = await supabase.from("profiles").select("trusted_devices_reset_at").eq("id", sub).maybeSingle();
    if (!data || issued <= Date.parse(data.trusted_devices_reset_at)) return false;
    // Aparelho confiável: esta sessão nova já fica verificada.
    response.cookies.set(SESSION_COOKIE, signSession(sub, String(claims.session_id ?? "")), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: TRUST_DAYS * 24 * 60 * 60,
    });
    return true;
  };
  const toVerify = (target = `${pathname}${search}`) => {
    const url = request.nextUrl.clone();
    url.pathname = "/verificar";
    url.search = "";
    if (target !== "/") url.searchParams.set("next", target);
    return redirectKeepingCookies(url, response);
  };

  if (toSuperAdmin) {
    // Sem login, o requireAdmin leva para /entrar; logado sem código, o Super Admin pede o código.
    return signedIn && !(await verified()) ? toVerify() : response;
  }

  if (!signedIn && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return redirectKeepingCookies(url, response);
  }

  if (signedIn && isProtectedPath(pathname) && !(await verified())) return toVerify();

  // Só consulta o perfil nas rotas protegidas, para não pesar no resto do site.
  if (signedIn && isProtectedPath(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", String(claims?.sub))
      .maybeSingle();
    const onProfilePage = pathname === PROFILE_PATH;

    if (!profile && !onProfilePage) {
      const url = request.nextUrl.clone();
      url.pathname = PROFILE_PATH;
      url.search = "";
      url.searchParams.set("next", `${pathname}${search}`);
      return redirectKeepingCookies(url, response);
    }
    if (profile && onProfilePage) {
      const url = new URL(safeNextPath(searchParams.get("next")), request.url);
      return redirectKeepingCookies(url, response);
    }
  }

  if (signedIn && AUTH_PATHS.includes(pathname)) {
    if (!(await verified())) return toVerify(safeNextPath(searchParams.get("next")));
    const url = new URL(safeNextPath(searchParams.get("next")), request.url);
    return redirectKeepingCookies(url, response);
  }

  return response;
}

function notFound(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/nao-encontrado";
  return NextResponse.rewrite(url, { status: 404 });
}

// O redirecionamento precisa levar os cookies que o Supabase acabou de renovar.
function redirectKeepingCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: [
    // Tudo, menos arquivos estáticos e imagens.
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
