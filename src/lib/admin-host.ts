/** O Super Admin vive em admin.<domínio>; o app é o mesmo e o proxy.ts reescreve para /superadmin. */
export function isAdminHost(host: string | null) {
  return Boolean(host?.startsWith("admin."));
}

/** Rotas públicas que continuam abertas no subdomínio: login, retorno do login e a moderação antiga. */
const SHARED_PATHS = ["/entrar", "/auth", "/cadastro", "/admin"];

export function isSharedPath(pathname: string) {
  return SHARED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function isSuperAdminPath(pathname: string) {
  return pathname === "/superadmin" || pathname.startsWith("/superadmin/");
}
