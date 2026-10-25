import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Sessão e perfil para as páginas de configuração. Sem sessão, vai para o login. */
export async function loadAccount(path: string) {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=${path}`);
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { supabase, user, profile };
}

/** "felipe@gmail.com" vira "f***e@gmail.com", como no Airbnb. */
export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return name.length <= 2 ? `${name[0]}***@${domain}` : `${name[0]}***${name.at(-1)}@${domain}`;
}

/** "+5544991372071" vira "+55 ******2071". */
export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `+55 ******${digits.slice(-4)}`;
}
