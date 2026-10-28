"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { embedListing, geminiClient } from "@/lib/ai";
import { CONTACT_STEP, newListingSchema } from "@/lib/listing-schema";
import { PHOTO_BUCKET, MIN_PHOTOS, publicPoint, toBrazilianWhatsApp } from "@/lib/listing-options";
import { notifySubmitted } from "@/lib/listing-notify";
import { createClient } from "@/lib/supabase/server";
import type { CreateListingResult, NewListing } from "./create-listing";

/**
 * Salva a edição de um anúncio que já existe (devolvido para ajustes, publicado ou pausado)
 * e o envia de novo para análise. É o mesmo formulário do cadastro; o id é o do anúncio.
 */
export async function updateListing(input: NewListing): Promise<CreateListingResult> {
  const parsed = newListingSchema.safeParse(input);
  if (!parsed.success) {
    console.error("[updateListing]", parsed.error.issues);
    const contact = parsed.error.issues.some((issue) => issue.path[0] === "contact_email");
    return contact
      ? { ok: false, error: "Digite um e-mail válido, como nome@exemplo.com.", step: CONTACT_STEP }
      : { ok: false, error: "Algum campo ficou fora do formato. Revise os passos marcados." };
  }
  const data = parsed.data;
  const whatsapp = toBrazilianWhatsApp(data.whatsapp);
  if (!whatsapp) return { ok: false, error: "Digite o WhatsApp com DDD, como (44) 99999-9999.", step: CONTACT_STEP };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=/painel/anuncios/${data.id}`);

  const { data: current } = await supabase
    .from("listings")
    .select("slug, status, photos")
    .eq("id", data.id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!current) return { ok: false, error: "Anúncio não encontrado." };
  if (current.status === "pending_approval") {
    return { ok: false, error: "Este anúncio está em revisão e não pode ser editado agora." };
  }
  const published = current.status === "active" || current.status === "paused";

  // Fotos só valem se estiverem na pasta do próprio anunciante.
  const photos = data.photos.filter((path) => path.startsWith(`${user.id}/`));
  if (photos.length < MIN_PHOTOS) return { ok: false, error: "Adicione pelo menos uma foto da sala.", step: 5 };
  const photoSizes = Object.fromEntries(photos.filter((path) => data.photo_sizes[path]).map((path) => [path, data.photo_sizes[path]]));
  const point = data.latitude !== null && data.longitude !== null ? publicPoint(data.latitude, data.longitude, data.show_exact_location) : null;

  const listing = {
    space_type: data.space_type,
    space_type_other: data.space_type === "outro" ? data.space_type_other : null,
    title: data.title,
    short_summary: data.short_summary,
    description: data.description,
    billing_type: data.billing_type,
    price: data.price,
    zip_code: data.zip_code,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
    latitude: point?.latitude ?? null,
    longitude: point?.longitude ?? null,
    show_exact_location: data.show_exact_location,
    amenities: [...new Set(data.amenities)],
    photos,
    photo_sizes: photoSizes,
    highlights: data.highlights,
    min_rental_period: data.min_rental_period,
    rules: data.rules,
    offers: [...new Set(data.offers)],
    email_contact: true,
  };

  // O texto revisado substitui o antigo na busca. Se o embedding falhar, o envio segue.
  let embedding: string | undefined;
  const ai = geminiClient();
  if (ai) {
    try {
      embedding = await embedListing(ai, listing);
    } catch (error) {
      console.error("[updateListing] Embedding não atualizado:", error);
    }
  }

  const { error } = await supabase
    .from("listings")
    .update({
      ...listing,
      ...(embedding ? { embedding } : {}),
      status: "pending_approval",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", data.id);
  if (error) {
    console.error("[updateListing] Erro ao salvar:", error);
    return { ok: false, error: "Não foi possível salvar. Tente de novo." };
  }

  // Saiu do ar para revisar as mudanças: a página pública deixa de mostrar a versão antiga.
  if (published) {
    updateTag(`listing:${current.slug}`);
    updateTag("listings");
  }

  const { error: contactError } = await supabase
    .from("listing_contacts")
    .upsert({ listing_id: data.id, whatsapp_number: whatsapp, contact_email: data.contact_email, street_address: data.street_address });
  if (contactError) console.error("[updateListing] Erro ao salvar o contato:", contactError);

  // Fotos tiradas da lista saem também do Storage.
  const removed = current.photos.filter((path: string) => !photos.includes(path));
  if (removed.length > 0) await supabase.storage.from(PHOTO_BUCKET).remove(removed);

  await notifySubmitted(supabase, user, { id: data.id, ...listing, photos: photos.length });
  redirect(`/painel/anuncios/${data.id}`);
}
