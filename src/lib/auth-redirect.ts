/** Rotas que exigem conta. O proxy.ts manda quem não entrou para /entrar. */
export const PROTECTED_PATHS = ["/anunciar", "/painel", "/cadastro", "/admin", "/favoritos", "/configuracoes"];

/** Cadastro do perfil: quem entrou pela primeira vez passa por aqui antes do resto. */
export const PROFILE_PATH = "/cadastro";

/** Telas de login e cadastro: quem já entrou segue direto para o destino. */
export const AUTH_PATHS = ["/entrar", "/criar-conta"];

export function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Aceita só caminhos internos ("/anunciar"), para o ?next= não virar
 * redirecionamento para outro site ("//golpe.com" ou "https://...").
 */
export function safeNextPath(value: unknown, fallback = "/") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
