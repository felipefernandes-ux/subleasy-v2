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
