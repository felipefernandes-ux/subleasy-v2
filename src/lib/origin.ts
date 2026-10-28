import { headers } from "next/headers";
import { SITE_URL } from "./site";

/**
 * Endereço do site que recebeu a requisição (localhost em desenvolvimento),
 * para montar links de e-mail e de retorno do login.
 */
export async function getOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  if (origin) return origin;
  const host = requestHeaders.get("host");
  if (!host) return SITE_URL;
  return `${requestHeaders.get("x-forwarded-proto") ?? "http"}://${host}`;
}

/** Endereço do Super Admin (admin.<domínio>), para links de e-mail que levam à moderação. */
export async function getAdminOrigin() {
  const url = new URL(await getOrigin());
  // Prévias da Vercel não têm subdomínio admin.
  if (url.hostname.startsWith("admin.") || url.hostname.endsWith(".vercel.app")) return url.origin;
  url.hostname = `admin.${url.hostname}`;
  return url.origin;
}

/** Endereço do site público, para links que saem do Super Admin (no subdomínio admin.*, /sala/... dá 404). */
export async function getPublicOrigin() {
  const url = new URL(await getOrigin());
  if (url.hostname.startsWith("admin.")) url.hostname = url.hostname.slice("admin.".length);
  return url.origin;
}
