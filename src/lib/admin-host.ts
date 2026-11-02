/** O Super Admin vive em admin.<domínio>; o app é o mesmo e o proxy.ts reescreve para /superadmin. */
export function isAdminHost(host: string | null) {
  return Boolean(host?.startsWith("admin."));
}

/**
 * Rotas públicas que continuam abertas no subdomínio: login, código de verificação, retorno do login,
 * a moderação antiga e a página do anúncio (/espaco), que o admin abre aqui como prévia: a sessão é por host.
 */
const SHARED_PATHS = ["/entrar", "/auth", "/cadastro", "/verificar", "/admin", "/espaco"];

export function isSharedPath(pathname: string) {
  return SHARED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function isSuperAdminPath(pathname: string) {
  return pathname === "/superadmin" || pathname.startsWith("/superadmin/");
}
