import { cityRoomAvailableEmail, sendEmail } from "@/lib/email";
import { displayCity, normalizeCity } from "@/lib/city-text";
import { getPublicOrigin } from "@/lib/origin";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Chamada quando um anúncio entra no ar: avisa, uma única vez, quem pediu sala nessa cidade e deixou e-mail.
 * Só quem pediu quando a cidade ainda não tinha sala é avisado; depois do envio o pedido fica marcado.
 * Uma falha aqui nunca pode travar a aprovação do anúncio.
 */
export async function notifyCityWaiters(listing: { city: string; state: string }) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("city_requests")
      .select("id, email")
      .eq("city_key", normalizeCity(listing.city))
      .eq("state", listing.state)
      .not("email", "is", null)
      .is("notified_at", null)
      .limit(500);
    if (!data?.length) return;

    const city = displayCity(listing.city);
    const url = `${await getPublicOrigin()}/espacos?local=${encodeURIComponent(city)}`;
    // Um e-mail por endereço, mesmo que a pessoa tenha pedido de mais de um aparelho.
    const byEmail = new Map<string, number[]>();
    for (const row of data) {
      if (row.email) byEmail.set(row.email, [...(byEmail.get(row.email) ?? []), row.id]);
    }

    const sent: number[] = [];
    await Promise.all(
      [...byEmail].map(async ([email, ids]) => {
        try {
          await sendEmail(cityRoomAvailableEmail(email, city, url));
          sent.push(...ids);
        } catch (error) {
          console.error("[notifyCityWaiters] envio", error);
        }
      }),
    );
    if (sent.length) await admin.from("city_requests").update({ notified_at: new Date().toISOString() }).in("id", sent);
  } catch (error) {
    console.error("[notifyCityWaiters]", error);
  }
}
