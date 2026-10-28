import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Token do link “Quero participar”: `<id do usuário>.<assinatura>`. A assinatura é um HMAC com
 * INVITE_TOKEN_SECRET, então ninguém monta o link de outra pessoa e não precisa guardar o token no banco.
 * Só código de servidor.
 */

export const INVITE_CAMPAIGN = "convite-2-0";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function sign(userId: string) {
  const secret = process.env.INVITE_TOKEN_SECRET;
  if (!secret) throw new Error("Falta INVITE_TOKEN_SECRET no .env.local");
  return createHmac("sha256", secret).update(`${INVITE_CAMPAIGN}:${userId}`).digest("base64url");
}

export function signInviteToken(userId: string) {
  return `${userId}.${sign(userId)}`;
}

/** Devolve o id do usuário se a assinatura confere; senão null. Nunca lança por token malformado. */
export function verifyInviteToken(token: string): string | null {
  const [userId, signature, ...rest] = token.split(".");
  if (!userId || !signature || rest.length > 0 || !UUID.test(userId)) return null;
  const expected = Buffer.from(sign(userId));
  const given = Buffer.from(signature);
  return given.length === expected.length && timingSafeEqual(given, expected) ? userId : null;
}

/** Endereço do link no e-mail. Antes da troca de domínio, aponte INVITE_BASE_URL para o ambiente do 2.0. */
export function inviteUrl(userId: string) {
  const base = (process.env.INVITE_BASE_URL ?? "https://subleasy.com.br").replace(/\/$/, "");
  return `${base}/convite/${signInviteToken(userId)}`;
}
