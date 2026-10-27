"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { embedListing, geminiClient } from "@/lib/ai";
import {
  BILLING_TYPE_KEYS,
  PHOTO_BUCKET,
  HIGHLIGHT_KEYS,
  MAX_HIGHLIGHTS,
  MAX_PHOTOS,
  MIN_PHOTOS,
  OFFER_KEYS,
  SPACE_TYPE_KEYS,
  UFS,
  createSlug,
  parsePhotoSizes,
  publicPoint,
  toBrazilianWhatsApp,
} from "@/lib/listing-options";
import { notifySubmitted } from "@/lib/listing-notify";
import { createClient } from "@/lib/supabase/server";

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null);

// O cadastro passo a passo chega inteiro de uma vez, no último passo.
const schema = z.object({
  id: z.uuid(),
  space_type: z.enum(SPACE_TYPE_KEYS),
  zip_code: optionalText.pipe(z.string().regex(/^[0-9]{5}-?[0-9]{3}$/).nullable()),
  street_address: optionalText,
  neighborhood: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().toUpperCase().pipe(z.enum(UFS)),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  show_exact_location: z.boolean(),
  amenities: z.array(z.string().trim().min(1)).max(40),
  photos: z.array(z.string()).min(MIN_PHOTOS).max(MAX_PHOTOS),
  photo_sizes: z.unknown().transform(parsePhotoSizes),
  highlights: z.array(z.enum(HIGHLIGHT_KEYS)).max(MAX_HIGHLIGHTS),
  title: z.string().trim().min(10).max(70),
  short_summary: optionalText.pipe(z.string().max(120).nullable()),
  description: z.string().trim().min(40),
  billing_type: z.enum(BILLING_TYPE_KEYS),
  price: z.number().min(10),
  min_rental_period: optionalText,
  rules: z.array(z.string().trim().min(1)).max(20),
  offers: z.array(z.enum(OFFER_KEYS)),
  whatsapp: z.string(),
  contact_email: z.string().trim().toLowerCase().pipe(z.email()),
});

// Índice do passo de contato no cadastro, para levar a pessoa até o erro.
const CONTACT_STEP = 8;

export type NewListing = z.input<typeof schema>;
export type CreateListingResult = { ok: false; error: string; step?: number };

/**
 * Cria o anúncio do cadastro passo a passo e já envia para análise.
 * O id vem do navegador: as fotos sobem para a pasta dele antes de o anúncio existir.
 */
export async function createListing(input: NewListing): Promise<CreateListingResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    console.error("[createListing]", parsed.error.issues);
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
  if (!user) redirect("/entrar?next=/anunciar");

  // Fotos só valem se estiverem na pasta deste anúncio, do próprio anunciante.
  const folder = `${user.id}/${data.id}/`;
  const photos = data.photos.filter((path) => path.startsWith(folder));
  if (photos.length < MIN_PHOTOS) return { ok: false, error: "Adicione pelo menos uma foto da sala.", step: 3 };
  const photoSizes = Object.fromEntries(photos.filter((path) => data.photo_sizes[path]).map((path) => [path, data.photo_sizes[path]]));
  const point = data.latitude !== null && data.longitude !== null ? publicPoint(data.latitude, data.longitude, data.show_exact_location) : null;

  const listing = {
    id: data.id,
    owner_id: user.id,
    slug: createSlug(data.title),
    status: "draft",
    space_type: data.space_type,
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

  // A busca usa o embedding; se ele falhar, o anúncio segue sem e é gerado na aprovação.
  let embedding: string | undefined;
  const ai = geminiClient();
  if (ai) {
    try {
      embedding = await embedListing(ai, listing);
    } catch (error) {
      console.error("[createListing] Embedding não gerado:", error);
    }
  }

  // Todo anúncio nasce rascunho (regra do banco) e logo em seguida vai para análise.
  const { error } = await supabase.from("listings").insert({ ...listing, ...(embedding ? { embedding } : {}) });
  if (error) {
    console.error("[createListing] Erro ao salvar:", error);
    return { ok: false, error: error.code === "23505" ? "Este anúncio já foi enviado." : "Não foi possível salvar. Tente de novo." };
  }

  const [{ error: contactError }, { error: submitError }] = await Promise.all([
    supabase
      .from("listing_contacts")
      .upsert({ listing_id: data.id, whatsapp_number: whatsapp, contact_email: data.contact_email, street_address: data.street_address }),
    supabase.from("listings").update({ status: "pending_approval", submitted_at: new Date().toISOString() }).eq("id", data.id),
  ]);
  if (contactError) console.error("[createListing] Erro ao salvar o contato:", contactError);
  if (submitError) {
    console.error("[createListing] Erro ao enviar para análise:", submitError);
    redirect(`/painel/anuncios/${data.id}`);
  }

  await notifySubmitted(supabase, user, { ...listing, photos: photos.length });
  redirect(`/painel/anuncios/${data.id}`);
}

/** Apaga as fotos de um rascunho do navegador descartado (anúncio que nunca chegou ao banco). */
export async function discardDraftPhotos(listingId: string) {
  if (!z.uuid().safeParse(listingId).success) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Se o anúncio já existe, as fotos são dele: não mexe.
  const { data: listing } = await supabase.from("listings").select("id").eq("id", listingId).maybeSingle();
  if (listing) return;

  const folder = `${user.id}/${listingId}`;
  const { data: files } = await supabase.storage.from(PHOTO_BUCKET).list(folder, { limit: 100 });
  if (files?.length) await supabase.storage.from(PHOTO_BUCKET).remove(files.map((file) => `${folder}/${file.name}`));
}
