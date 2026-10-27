"use server";

import { formatWhatsApp } from "@/lib/listing-options";
import { PUBLIC_ID_PATTERN } from "@/lib/public-profile";
import { createClient } from "@/lib/supabase/server";

/**
 * WhatsApp do perfil público. Só sai do banco no clique, e só se o anunciante ligou
 * "Exibir meu WhatsApp" e tem anúncio no ar. Nunca vai no HTML da página (anti-raspagem).
 */
export async function revealProfileWhatsApp(publicId: string, name: string) {
  if (!PUBLIC_ID_PATTERN.test(publicId)) return null;
  const supabase = await createClient();
  const { data: number } = await supabase.rpc("get_profile_whatsapp", { p_public_id: publicId });
  if (!number) return null;
  const message = `Olá, ${name.split(" ")[0]}! Vi seu perfil no Subleasy e quero saber mais sobre suas salas.`;
  return {
    display: formatWhatsApp(number),
    link: `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
  };
}
