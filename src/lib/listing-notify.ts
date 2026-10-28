import type { User } from "@supabase/supabase-js";
import { adminNewListingEmail, listingSubmittedEmail, sendEmail } from "@/lib/email";
import { BILLING_UNIT, formatPrice, photoUrl, type BillingType } from "@/lib/listing-options";
import { getAdminOrigin, getOrigin } from "@/lib/origin";
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
  /** Caminho da foto de capa no Storage. */
  cover: string | null;
};

/** Avisa o anunciante e o admin por e-mail que um anúncio foi enviado para análise. */
export async function notifySubmitted(supabase: Awaited<ReturnType<typeof createClient>>, user: User, listing: Submitted) {
  const origin = await getOrigin();
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  const hostName = profile?.display_name ?? user.email ?? "anunciante";

  const card = {
    image: listing.cover ? photoUrl(listing.cover) : null,
    status: "Em revisão",
    title: listing.title,
    place: `${listing.neighborhood}, ${listing.city} - ${listing.state}`,
    price: `${formatPrice(listing.price)} por ${BILLING_UNIT[listing.billing_type]}`,
  };

  await Promise.all([
    user.email && sendEmail(listingSubmittedEmail(user.email, hostName, listing.title, `${origin}/painel/anuncios/${listing.id}`, card)),
    process.env.ADMIN_EMAIL &&
      sendEmail(
        adminNewListingEmail(
          process.env.ADMIN_EMAIL,
          { host: hostName, hostEmail: user.email ?? "sem e-mail", photos: listing.photos },
          card,
          `${await getAdminOrigin()}/admin/anuncios/${listing.id}`,
        ),
      ),
  ]);
  if (!process.env.ADMIN_EMAIL) console.info("[notifySubmitted] ADMIN_EMAIL ausente: o admin não foi avisado.");
}
