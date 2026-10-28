import { randomInt, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { loginCodeEmail, sendEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SESSION_COOKIE, TRUST_COOKIE, TRUST_DAYS, hmac, readTrust, safeEqual, signSession, signTrust } from "@/lib/two-factor-token";

export type CodePurpose = "login" | "signup" | "session";

const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 30;
const MAX_PER_HOUR = 5;

const MINUTE = 60 * 1000;

type Issued = { ok: true; sent: boolean } | { ok: false; error: string };

/**
 * Cria um código de 6 dígitos e o envia por e-mail. Dentro dos 30 segundos do último envio não
 * manda outro (`sent: false`): a tela de verificação pode chamar de novo sem duplicar e-mails.
 * Até 5 códigos por hora por e-mail.
 */
export async function issueCode(purpose: CodePurpose, email: string, userId: string | null): Promise<Issued> {
  const db = createAdminClient();
  const now = Date.now();

  const { data: recent } = await db
    .from("login_codes")
    .select("created_at")
    .eq("email", email)
    .gte("created_at", new Date(now - 60 * MINUTE).toISOString())
    .order("created_at", { ascending: false });
  if (recent && recent.length > 0) {
    if (now - new Date(recent[0].created_at).getTime() < RESEND_SECONDS * 1000) return { ok: true, sent: false };
    if (recent.length >= MAX_PER_HOUR) return { ok: false, error: "Muitos pedidos de código agora. Espere alguns minutos e tente de novo." };
  }

  const id = randomUUID();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const { error } = await db.from("login_codes").insert({
    id,
    purpose,
    email,
    user_id: userId,
    code_hash: hmac(`c:${id}:${code}`),
    expires_at: new Date(now + CODE_MINUTES * MINUTE).toISOString(),
  });
  if (error) {
    console.error("[issueCode]", error.message);
    return { ok: false, error: "Não foi possível enviar o código. Tente de novo." };
  }
  // Limpeza: códigos com mais de um dia não servem para nada.
  await db.from("login_codes").delete().lt("created_at", new Date(now - 24 * 60 * MINUTE).toISOString());

  await sendEmail(loginCodeEmail(email, code, purpose));
  return { ok: true, sent: true };
}

export type CodeCheck = { ok: true } | { ok: false; error: string };

/** Confere o código mais recente do e-mail. Cada código vale uma vez e aguenta 5 tentativas. */
export async function checkCode(purposes: CodePurpose[], email: string, input: string): Promise<CodeCheck> {
  const code = input.replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "Digite os 6 números do código." };

  const db = createAdminClient();
  const { data: row } = await db
    .from("login_codes")
    .select("id, code_hash, expires_at, attempts")
    .eq("email", email)
    .in("purpose", purposes)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row || new Date(row.expires_at).getTime() < Date.now()) return { ok: false, error: "Este código venceu. Peça um novo." };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, error: "Muitas tentativas. Peça um novo código." };

  // Conta a tentativa antes de comparar, para duas requisições juntas não ganharem tentativas extras.
  const { data: counted } = await db
    .from("login_codes")
    .update({ attempts: row.attempts + 1 })
    .eq("id", row.id)
    .eq("attempts", row.attempts)
    .select("id");
  if (!counted || counted.length === 0) return { ok: false, error: "Tente de novo em instantes." };

  if (!safeEqual(row.code_hash, hmac(`c:${row.id}:${code}`))) {
    return { ok: false, error: row.attempts + 1 >= MAX_ATTEMPTS ? "Muitas tentativas. Peça um novo código." : "Código incorreto. Confira o e-mail e tente de novo." };
  }

  // Consumir é atômico: só uma requisição passa.
  const { data: consumed } = await db
    .from("login_codes")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", row.id)
    .is("consumed_at", null)
    .select("id");
  return consumed && consumed.length > 0 ? { ok: true } : { ok: false, error: "Este código já foi usado. Peça um novo." };
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

/**
 * Marca a sessão atual como verificada: o proxy deixa de pedir o código para ela.
 * `trust` (só no site público) também lembra o aparelho por 30 dias.
 */
export async function markSessionVerified(options: { trust?: boolean } = {}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub || !claims.session_id) return false;
  const store = await cookies();
  store.set(SESSION_COOKIE, signSession(claims.sub, String(claims.session_id)), cookieOptions(TRUST_DAYS * 24 * 60 * 60));
  if (options.trust) store.set(TRUST_COOKIE, signTrust(claims.sub), cookieOptions(TRUST_DAYS * 24 * 60 * 60));
  return true;
}

export async function clearTrust() {
  (await cookies()).delete(TRUST_COOKIE);
}

/** Este navegador foi marcado como confiável por essa conta, e a confiança não foi encerrada depois? */
export async function isTrustedDevice(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const issued = readTrust((await cookies()).get(TRUST_COOKIE)?.value, userId);
  if (issued === null) return false;
  const { data } = await supabase.from("profiles").select("trusted_devices_reset_at").eq("id", userId).maybeSingle();
  return Boolean(data) && issued > Date.parse(String(data?.trusted_devices_reset_at));
}
