import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Peças de criptografia da verificação em duas etapas, sem banco nem cookies: servem ao proxy
 * e às Server Actions. A chave sai da service role, que já só existe no servidor.
 */
export const SESSION_COOKIE = "sl_2fa";
export const TRUST_COOKIE = "sl_trust";
export const TRUST_DAYS = 30;
const DAY = 24 * 60 * 60;

function secret() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY no .env.local");
  return createHmac("sha256", key).update("subleasy-2fa-v1").digest();
}

export function hmac(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Cookie "esta sessão passou pelo código": preso ao usuário e ao session_id do login. */
export function signSession(userId: string, sessionId: string, now = Date.now()) {
  const expires = Math.floor(now / 1000) + TRUST_DAYS * DAY;
  const body = `${userId}.${sessionId}.${expires}`;
  return `${body}.${hmac(`s:${body}`)}`;
}

export function verifySession(token: string | undefined, userId: string, sessionId: string, now = Date.now()) {
  const parts = token?.split(".");
  if (!parts || parts.length !== 4) return false;
  const [uid, sid, expires, signature] = parts;
  return (
    uid === userId &&
    sid === sessionId &&
    Number(expires) * 1000 > now &&
    safeEqual(signature, hmac(`s:${uid}.${sid}.${expires}`))
  );
}

/** Cookie "confiar neste aparelho": vale até a data e só se for mais novo que o último reset. */
export function signTrust(userId: string, now = Date.now()) {
  const issued = Math.floor(now / 1000);
  const body = `${userId}.${issued}.${issued + TRUST_DAYS * DAY}`;
  return `${body}.${hmac(`t:${body}`)}`;
}

/** Devolve quando o cookie foi emitido (ms), ou null se for inválido, vencido ou de outra conta. */
export function readTrust(token: string | undefined, userId: string, now = Date.now()) {
  const parts = token?.split(".");
  if (!parts || parts.length !== 4) return null;
  const [uid, issued, expires, signature] = parts;
  if (uid !== userId || Number(expires) * 1000 <= now) return null;
  if (!safeEqual(signature, hmac(`t:${uid}.${issued}.${expires}`))) return null;
  return Number(issued) * 1000;
}
