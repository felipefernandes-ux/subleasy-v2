"use server";

import { createClient } from "@/lib/supabase/server";

// Chave do insight: "regra:alvo", só letras minúsculas, números, hífen, dois-pontos e datas.
const KEY_PATTERN = /^[a-z0-9:-]{3,120}$/;

/** Esconde o insight do painel por 30 dias. */
export async function dismissInsight(key: string): Promise<boolean> {
  if (!KEY_PATTERN.test(key)) return false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase
    .from("insight_dismissals")
    .upsert({ user_id: user.id, insight_key: key, dismissed_at: new Date().toISOString() });
  return !error;
}

/** Desfaz o dispensar. */
export async function restoreInsight(key: string): Promise<boolean> {
  if (!KEY_PATTERN.test(key)) return false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase.from("insight_dismissals").delete().eq("user_id", user.id).eq("insight_key", key);
  return !error;
}
