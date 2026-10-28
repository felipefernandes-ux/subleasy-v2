"use server";

import { redirect } from "next/navigation";
import { INVITE_CAMPAIGN, verifyInviteToken } from "@/lib/invite-token";
import { createAdminClient } from "@/lib/supabase/admin";

/** Registra o “Quero participar”. Idempotente: clicar de novo mantém a data da primeira vez. */
export async function confirmInterest(token: string) {
  const userId = verifyInviteToken(token);
  if (!userId) redirect("/");

  const db = createAdminClient();
  const { data } = await db
    .from("campaign_invites")
    .select("interested_at")
    .eq("user_id", userId)
    .eq("campaign", INVITE_CAMPAIGN)
    .maybeSingle();

  if (!data?.interested_at) {
    const now = new Date().toISOString();
    const { error } = await db
      .from("campaign_invites")
      .upsert({ user_id: userId, campaign: INVITE_CAMPAIGN, clicked_at: now, interested_at: now }, { onConflict: "user_id,campaign" });
    if (error) console.error("[convite] não gravou o interesse:", error.message);
  }
  redirect(`/convite/${token}`);
}
