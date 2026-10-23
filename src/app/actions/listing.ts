"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { embedListing, geminiClient } from "@/lib/ai";
import {
  adminNewListingEmail,
  listingPublishedEmail,
  listingReturnedEmail,
  listingSubmittedEmail,
  sendEmail,
} from "@/lib/email";
import {
  BILLING_TYPE_KEYS,
  BILLING_UNIT,
  MAX_PHOTOS,
  MIN_PHOTOS,
  PHOTO_BUCKET,
  SHIFT_KEYS,
  SPACE_TYPE_KEYS,
  WEEKDAY_KEYS,
  formatPrice,
  toBrazilianWhatsApp,
  type ShiftGrid,
} from "@/lib/listing-options";
import { getOrigin } from "@/lib/origin";
import { createClient } from "@/lib/supabase/server";

export type ListingField =
  | "photos"
  | "title"
  | "short_summary"
  | "description"
  | "space_type"
  | "billing_type"
  | "price"
  | "zip_code"
  | "city"
  | "state"
  | "neighborhood"
  | "shifts"
  | "whatsapp";

export type ListingFormState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; error: string; fields: Partial<Record<ListingField, string>> };

const FIELD_ERRORS: Record<ListingField, string> = {
  photos: `Adicione pelo menos ${MIN_PHOTOS} fotos da sala.`,
  title: "O título precisa ter entre 10 e 70 caracteres.",
  short_summary: "O resumo pode ter até 120 caracteres.",
  description: "Escreva uma descrição com pelo menos 40 caracteres.",
  space_type: "Escolha o tipo de sala.",
  billing_type: "Escolha a forma de cobrança.",
  price: "Informe o preço em reais, a partir de R$ 10.",
  zip_code: "Digite o CEP no formato 00000-000.",
  city: "Informe a cidade.",
  state: "Informe a UF com 2 letras, como PR.",
  neighborhood: "Informe o bairro.",
  shifts: "Marque pelo menos um turno livre.",
  whatsapp: "Digite o WhatsApp com DDD, como (44) 99999-9999.",
};

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null);

// Regras comuns ao rascunho e ao envio, iguais aos checks da tabela listings.
const draftSchema = z.object({
  title: z.string().trim().min(10).max(70),
  short_summary: optionalText.pipe(z.string().max(120).nullable()),
  description: optionalText,
  space_type: z.enum(SPACE_TYPE_KEYS),
  billing_type: z.enum(BILLING_TYPE_KEYS),
  price: z.string().transform(parsePrice).pipe(z.number().min(10)),
  zip_code: optionalText.pipe(z.string().regex(/^[0-9]{5}-?[0-9]{3}$/).nullable()),
  city: z.string().trim().min(1),
  state: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
  neighborhood: z.string().trim().min(1),
  street_address: optionalText,
  min_rental_period: optionalText,
  rules: z.string().transform(toLines),
  amenities: z.array(z.string().trim().min(1)),
  shifts: z.array(z.string()).transform(toShiftGrid),
  photos: z.array(z.string()).max(MAX_PHOTOS),
  whatsapp: z.string(),
});

/**
 * Salva a revisão do anúncio. Com intent=submit, também confere o que falta
 * para publicar, envia para análise e avisa o anfitrião e o admin por e-mail.
 */
export async function saveListing(
  listingId: string,
  _previous: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const submit = formData.get("intent") === "submit";
  const parsed = draftSchema.safeParse({
    title: formData.get("title") ?? "",
    short_summary: formData.get("short_summary") ?? "",
    description: formData.get("description") ?? "",
    space_type: formData.get("space_type") ?? "",
    billing_type: formData.get("billing_type") ?? "",
    price: formData.get("price") ?? "",
    zip_code: formData.get("zip_code") ?? "",
    city: formData.get("city") ?? "",
    state: formData.get("state") ?? "",
    neighborhood: formData.get("neighborhood") ?? "",
    street_address: formData.get("street_address") ?? "",
    min_rental_period: formData.get("min_rental_period") ?? "",
    rules: formData.get("rules") ?? "",
    amenities: formData.getAll("amenity").map(String),
    shifts: formData.getAll("shift").map(String),
    photos: safeJsonArray(formData.get("photos")),
    whatsapp: formData.get("whatsapp") ?? "",
  });

  const fields: Partial<Record<ListingField, string>> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]) as ListingField;
      if (field in FIELD_ERRORS) fields[field] = FIELD_ERRORS[field];
    }
    return { status: "error", error: "Revise os campos marcados.", fields };
  }
  const data = parsed.data;
  const whatsapp = toBrazilianWhatsApp(data.whatsapp);

  // Para enviar, o anúncio precisa estar completo: fotos, descrição, turnos e contato.
  if (submit) {
    if (data.photos.length < MIN_PHOTOS) fields.photos = FIELD_ERRORS.photos;
    if (!data.description || data.description.length < 40) fields.description = FIELD_ERRORS.description;
    if (Object.keys(data.shifts).length === 0) fields.shifts = FIELD_ERRORS.shifts;
    if (!whatsapp) fields.whatsapp = FIELD_ERRORS.whatsapp;
    if (Object.keys(fields).length > 0) {
      return { status: "error", error: "Falta pouco para enviar. Revise os campos marcados.", fields };
    }
  } else if (data.whatsapp.trim() && !whatsapp) {
    return { status: "error", error: "Revise os campos marcados.", fields: { whatsapp: FIELD_ERRORS.whatsapp } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=/painel/anuncios/${listingId}`);

  const { data: current } = await supabase
    .from("listings")
    .select("id, status, photos, owner_id")
    .eq("id", listingId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!current) return { status: "error", error: "Anúncio não encontrado.", fields: {} };
  if (current.status !== "draft") {
    return { status: "error", error: "Este anúncio já foi enviado e não pode ser editado agora.", fields: {} };
  }

  // Fotos só valem se estiverem na pasta do próprio anunciante.
  const photos = data.photos.filter((path) => path.startsWith(`${user.id}/`));

  const listing = {
    title: data.title,
    short_summary: data.short_summary,
    description: data.description,
    space_type: data.space_type,
    billing_type: data.billing_type,
    price: data.price,
    zip_code: data.zip_code,
    city: data.city,
    state: data.state,
    neighborhood: data.neighborhood,
    min_rental_period: data.min_rental_period,
    rules: data.rules,
    amenities: [...new Set(data.amenities)],
    shifts_available: data.shifts,
    photos,
  };

  let embedding: string | undefined;
  if (submit) {
    // O texto revisado substitui o da IA na busca. Se o embedding falhar, o envio segue.
    const ai = geminiClient();
    if (ai) {
      try {
        embedding = await embedListing(ai, listing);
      } catch (error) {
        console.error("[saveListing] Embedding não atualizado:", error);
      }
    }
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("listings")
    .update({
      ...listing,
      ...(embedding ? { embedding } : {}),
      ...(submit ? { status: "pending_approval", submitted_at: now } : {}),
    })
    .eq("id", listingId);
  if (error) {
    console.error("[saveListing] Erro ao salvar:", error);
    return { status: "error", error: "Não foi possível salvar. Tente de novo.", fields: {} };
  }

  if (whatsapp) {
    const { error: contactError } = await supabase
      .from("listing_contacts")
      .upsert({ listing_id: listingId, whatsapp_number: whatsapp, street_address: data.street_address });
    if (contactError) console.error("[saveListing] Erro ao salvar o contato:", contactError);
  }

  // Fotos tiradas da lista saem também do Storage.
  const removed = current.photos.filter((path) => !photos.includes(path));
  if (removed.length > 0) await supabase.storage.from(PHOTO_BUCKET).remove(removed);

  if (!submit) return { status: "saved" };

  const origin = await getOrigin();
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  const hostName = profile?.display_name ?? user.email ?? "anfitrião";

  await Promise.all([
    user.email &&
      sendEmail(listingSubmittedEmail(user.email, hostName, data.title, `${origin}/painel/anuncios/${listingId}`)),
    process.env.ADMIN_EMAIL &&
      sendEmail(
        adminNewListingEmail(
          process.env.ADMIN_EMAIL,
          {
            title: data.title,
            host: hostName,
            hostEmail: user.email ?? "sem e-mail",
            place: `${data.neighborhood}, ${data.city} - ${data.state}`,
            price: `${formatPrice(data.price)} por ${BILLING_UNIT[data.billing_type]}`,
            photos: photos.length,
          },
          `${origin}/admin/anuncios/${listingId}`,
        ),
      ),
  ]);
  if (!process.env.ADMIN_EMAIL) console.info("[saveListing] ADMIN_EMAIL ausente: o admin não foi avisado.");

  redirect(`/painel/anuncios/${listingId}`);
}

// ── Admin ──────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/");
  return supabase;
}

/** Publica o anúncio e avisa o anfitrião com o link para compartilhar. */
export async function approveListing(listingId: string) {
  const supabase = await requireAdmin();
  const { data: listing, error } = await supabase
    .from("listings")
    .update({ status: "active", published_at: new Date().toISOString(), review_note: null, last_confirmed_at: new Date().toISOString() })
    .eq("id", listingId)
    .eq("status", "pending_approval")
    .select("slug, title")
    .maybeSingle();
  if (error || !listing) {
    console.error("[approveListing]", error);
    redirect(`/admin/anuncios/${listingId}?erro=aprovar`);
  }

  updateTag(`listing:${listing.slug}`);
  const [{ data: owner }, origin] = await Promise.all([
    supabase.rpc("listing_owner", { p_listing_id: listingId }).maybeSingle(),
    getOrigin(),
  ]);
  if (owner?.email) {
    await sendEmail(
      listingPublishedEmail(owner.email, owner.display_name ?? "", listing.title, `${origin}/sala/${listing.slug}`),
    );
  }
  redirect("/admin/anuncios?aprovado=1");
}

export type ReturnListingState = { status: "idle" } | { status: "error"; error: string };

/** Devolve o anúncio para rascunho com um recado do que ajustar. */
export async function returnListing(
  listingId: string,
  _previous: ReturnListingState,
  formData: FormData,
): Promise<ReturnListingState> {
  const note = String(formData.get("note") ?? "").trim();
  if (note.length < 10) {
    return { status: "error", error: "Explique em uma frase o que o anfitrião precisa ajustar." };
  }

  const supabase = await requireAdmin();
  const { data: listing, error } = await supabase
    .from("listings")
    .update({ status: "draft", review_note: note.slice(0, 1000) })
    .eq("id", listingId)
    .eq("status", "pending_approval")
    .select("title")
    .maybeSingle();
  if (error || !listing) {
    console.error("[returnListing]", error);
    return { status: "error", error: "Não foi possível devolver o anúncio. Tente de novo." };
  }

  const [{ data: owner }, origin] = await Promise.all([
    supabase.rpc("listing_owner", { p_listing_id: listingId }).maybeSingle(),
    getOrigin(),
  ]);
  if (owner?.email) {
    await sendEmail(
      listingReturnedEmail(owner.email, owner.display_name ?? "", listing.title, note, `${origin}/painel/anuncios/${listingId}`),
    );
  }
  redirect("/admin/anuncios?devolvido=1");
}

// ── Contato público ────────────────────────────────────────

const VISITOR_COOKIE = "sl_vid";

/**
 * Entrega o link do WhatsApp do anfitrião e registra o clique.
 * O número só sai do banco por esta ação, como pede a LGPD.
 */
export async function getWhatsAppLink(listingId: string, title: string) {
  const cookieStore = await cookies();
  let visitorId = cookieStore.get(VISITOR_COOKIE)?.value;
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    cookieStore.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  const supabase = await createClient();
  const { data: number } = await supabase.rpc("get_listing_whatsapp", {
    p_listing_id: listingId,
    p_visitor_id: visitorId,
  });
  if (!number) return null;

  const message = `Olá! Vi a sala “${title}” no Subleasy e quero saber mais.`;
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

// ── Conversões ─────────────────────────────────────────────

// "80", "80,50", "1.800" e "1.800,50" viram 80, 80.5, 1800 e 1800.5.
function parsePrice(raw: string) {
  const clean = raw.replace(/[^\d.,]/g, "");
  if (!clean) return Number.NaN;
  const normalized = clean.includes(",")
    ? clean.replace(/\./g, "").replace(",", ".")
    : /\.\d{3}$/.test(clean)
      ? clean.replace(/\./g, "")
      : clean;
  return Number(normalized);
}

function toLines(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

// "seg:manha" vira {"seg": ["manha"]}.
function toShiftGrid(values: string[]) {
  const grid: ShiftGrid = {};
  for (const value of values) {
    const [day, shift] = value.split(":");
    if (!WEEKDAY_KEYS.includes(day as never) || !SHIFT_KEYS.includes(shift as never)) continue;
    const key = day as keyof ShiftGrid;
    grid[key] = [...new Set([...(grid[key] ?? []), shift as (typeof SHIFT_KEYS)[number]])];
  }
  return grid;
}

function safeJsonArray(value: FormDataEntryValue | null) {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
