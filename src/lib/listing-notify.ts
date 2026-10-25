import type { User } from "@supabase/supabase-js";
import { adminNewListingEmail, listingSubmittedEmail, sendEmail } from "@/lib/email";
import { BILLING_UNIT, formatPrice, type BillingType } from "@/lib/listing-options";
import { getOrigin } from "@/lib/origin";
import type { createClient } from "@/lib/supabase/server";

type Submitted = {
  id: string;
  title: string;
  neighborhood: string;
  city: string;
  state: string;
  price: number;
  billing_type: BillingType;
  photos: number;
};

/** Avisa o anfitrião e o admin por e-mail que um anúncio foi enviado para análise. */
export async function notifySubmitted(supabase: Awaited<ReturnType<typeof createClient>>, user: User, listing: Submitted) {
  const origin = await getOrigin();
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  const hostName = profile?.display_name ?? user.email ?? "anfitrião";

  await Promise.all([
    user.email && sendEmail(listingSubmittedEmail(user.email, hostName, listing.title, `${origin}/painel/anuncios/${listing.id}`)),
    process.env.ADMIN_EMAIL &&
      sendEmail(
        adminNewListingEmail(
          process.env.ADMIN_EMAIL,
          {
            title: listing.title,
            host: hostName,
            hostEmail: user.email ?? "sem e-mail",
            place: `${listing.neighborhood}, ${listing.city} - ${listing.state}`,
            price: `${formatPrice(listing.price)} por ${BILLING_UNIT[listing.billing_type]}`,
            photos: listing.photos,
          },
          `${origin}/admin/anuncios/${listing.id}`,
        ),
      ),
  ]);
  if (!process.env.ADMIN_EMAIL) console.info("[notifySubmitted] ADMIN_EMAIL ausente: o admin não foi avisado.");
}
