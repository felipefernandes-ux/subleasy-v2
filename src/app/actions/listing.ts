"use server";

import { refresh, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { embedListing, geminiClient } from "@/lib/ai";
import { listingPublishedEmail, listingReturnedEmail, newInquiryEmail, sendEmail } from "@/lib/email";
import {
  BILLING_TYPE_KEYS,
  MAX_PHOTOS,
  MIN_PHOTOS,
  PHOTO_BUCKET,
  SPACE_TYPE_KEYS,
  UFS,
  LISTING_DAYS,
  OFFERS,
  parsePhotoSizes,
  toBrazilianWhatsApp,
  type Offer,
} from "@/lib/listing-options";
import { notifySubmitted } from "@/lib/listing-notify";
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
  | "whatsapp"
  | "contact_email";

export type ListingFormState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; error: string; fields: Partial<Record<ListingField, string>> };

const FIELD_ERRORS: Record<ListingField, string> = {
  photos: `Adicione pelo menos uma foto da sala, até ${MAX_PHOTOS}.`,
  title: "O título precisa ter entre 10 e 70 caracteres.",
  short_summary: "O resumo pode ter até 120 caracteres.",
  description: "Escreva uma descrição com pelo menos 40 caracteres.",
  space_type: "Escolha a área de atuação.",
  billing_type: "Escolha a forma de cobrança.",
  price: "Informe o preço em reais, a partir de R$ 10.",
  zip_code: "Digite o CEP no formato 00000-000.",
  city: "Informe a cidade.",
  state: "Escolha a UF.",
  neighborhood: "Informe o bairro.",
  whatsapp: "Digite o WhatsApp com DDD, como (44) 99999-9999.",
  contact_email: "Digite um e-mail válido, como nome@exemplo.com.",
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
  state: z.string().trim().toUpperCase().pipe(z.enum(UFS)),
  neighborhood: z.string().trim().min(1),
  street_address: optionalText,
  min_rental_period: optionalText,
  rules: z.string().transform(toLines),
  amenities: z.array(z.string().trim().min(1)),
  photos: z.array(z.string()).max(MAX_PHOTOS),
  photo_sizes: z.unknown().transform(parsePhotoSizes),
  whatsapp: z.string(),
  contact_email: optionalText.pipe(z.email().nullable()),
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
    photos: safeJsonArray(formData.get("photos")),
    photo_sizes: safeJson(formData.get("photo_sizes")),
    whatsapp: formData.get("whatsapp") ?? "",
    contact_email: String(formData.get("contact_email") ?? "").toLowerCase(),
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

  // Para enviar, o anúncio precisa estar completo: capa, descrição e contato.
  if (submit) {
    if (data.photos.length < MIN_PHOTOS) fields.photos = FIELD_ERRORS.photos;
    if (!data.description || data.description.length < 40) fields.description = FIELD_ERRORS.description;
    if (!whatsapp) fields.whatsapp = FIELD_ERRORS.whatsapp;
    if (!data.contact_email) fields.contact_email = FIELD_ERRORS.contact_email;
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
    .select("id, slug, status, photos, owner_id")
    .eq("id", listingId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!current) return { status: "error", error: "Anúncio não encontrado.", fields: {} };
  // Anúncio publicado (ou pausado) pode ser editado, mas a mudança volta para a revisão.
  const published = current.status === "active" || current.status === "paused";
  if (current.status === "pending_approval") {
    return { status: "error", error: "Este anúncio está em revisão e não pode ser editado agora.", fields: {} };
  }
  if (published && !submit) {
    return { status: "error", error: "Para mudar um anúncio publicado, envie as alterações para revisão.", fields: {} };
  }

  // Fotos só valem se estiverem na pasta do próprio anunciante.
  const photos = data.photos.filter((path) => path.startsWith(`${user.id}/`));
  const photoSizes = Object.fromEntries(photos.filter((path) => data.photo_sizes[path]).map((path) => [path, data.photo_sizes[path]]));

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
    photos,
    photo_sizes: photoSizes,
    email_contact: Boolean(data.contact_email),
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

  // Saiu do ar para revisar as mudanças: a página pública deixa de mostrar a versão antiga.
  if (published) updateTag(`listing:${current.slug}`);

  if (whatsapp) {
    const { error: contactError } = await supabase
      .from("listing_contacts")
      .upsert({ listing_id: listingId, whatsapp_number: whatsapp, contact_email: data.contact_email, street_address: data.street_address });
    if (contactError) console.error("[saveListing] Erro ao salvar o contato:", contactError);
  }

  // Fotos tiradas da lista saem também do Storage.
  const removed = current.photos.filter((path) => !photos.includes(path));
  if (removed.length > 0) await supabase.storage.from(PHOTO_BUCKET).remove(removed);

  if (!submit) return { status: "saved" };

  await notifySubmitted(supabase, user, {
    id: listingId,
    title: data.title,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
    price: data.price,
    billing_type: data.billing_type,
    photos: photos.length,
  });

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
  // Alteração de um anúncio que já estava no ar: mantém a data de publicação e o prazo.
  const { data: before } = await supabase.from("listings").select("published_at, expires_at").eq("id", listingId).maybeSingle();
  const now = Date.now();
  const expires = before?.expires_at && new Date(before.expires_at).getTime() > now ? before.expires_at : new Date(now + LISTING_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: listing, error } = await supabase
    .from("listings")
    .update({
      status: "active",
      published_at: before?.published_at ?? new Date(now).toISOString(),
      expires_at: expires,
      review_note: null,
    })
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
  const visitorId = await getVisitorId();
  const supabase = await createClient();
  const { data: number } = await supabase.rpc("get_listing_whatsapp", {
    p_listing_id: listingId,
    p_visitor_id: visitorId,
  });
  if (!number) return null;

  // A oferta vai escrita na mensagem: o anfitrião sabe de onde veio o contato e o que prometeu.
  const { data: listing } = await supabase.from("listings").select("offers").eq("id", listingId).maybeSingle();
  const offers = (listing?.offers ?? []).filter((key): key is Offer => key in OFFERS).map((key) => `“${OFFERS[key].title}”`);
  const message = offers.length
    ? `Olá! Vi a sala “${title}” no Subleasy, com a oferta ${offers.join(" e ")}, e quero saber mais.`
    : `Olá! Vi a sala “${title}” no Subleasy e quero saber mais.`;
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  phone: z.string().trim().max(30),
  message: z.string().trim().min(10).max(2000),
  // Campo escondido: gente não preenche, robô sim.
  website: z.string().max(0),
});

export type InquiryState = { status: "idle" } | { status: "sent" } | { status: "error"; error: string };

/**
 * Mensagem de um interessado pelo formulário do anúncio. Fica guardada para o anfitrião
 * ver no painel e chega para ele por e-mail, com resposta direto para quem escreveu.
 */
export async function submitInquiry(listingId: string, title: string, _previous: InquiryState, formData: FormData): Promise<InquiryState> {
  const parsed = inquirySchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    message: formData.get("message") ?? "",
    website: formData.get("website") ?? "",
  });
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0]);
    const messages: Record<string, string> = {
      name: "Diga seu nome.",
      email: "Digite um e-mail válido, como nome@exemplo.com.",
      message: "Escreva uma mensagem com pelo menos 10 caracteres.",
    };
    return { status: "error", error: messages[field] ?? "Não foi possível enviar. Tente de novo." };
  }
  const data = parsed.data;

  const visitorId = await getVisitorId();
  const supabase = await createClient();
  const { data: hostEmail, error } = await supabase.rpc("submit_listing_inquiry", {
    p_listing_id: listingId,
    p_visitor_id: visitorId,
    p_name: data.name,
    p_email: data.email,
    p_phone: data.phone,
    p_message: data.message,
  });
  if (error) {
    console.error("[submitInquiry]", error);
    return { status: "error", error: "Não foi possível enviar. Tente de novo." };
  }
  if (!hostEmail) return { status: "error", error: "Esta sala não está recebendo mensagens agora." };

  const origin = await getOrigin();
  await sendEmail(newInquiryEmail(hostEmail, title, { ...data, phone: data.phone || null }, `${origin}/painel/anuncios/${listingId}`));
  return { status: "sent" };
}

/** Conta uma visualização da página da sala (uma por visitante por dia, só de anúncio no ar). */
export async function recordView(listingId: string) {
  const visitorId = await getVisitorId();
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_listing_view", { p_listing_id: listingId, p_visitor_id: visitorId });
  if (error) console.error("[recordView]", error);
}

// Id anônimo do visitante (cookie), para contar cada pessoa uma vez por dia.
async function getVisitorId() {
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
  return visitorId;
}

// ── Painel do anfitrião ────────────────────────────────────

async function ownListing(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/painel");
  const { data: listing } = await supabase
    .from("listings")
    .select("id, slug, status, photos, published_at")
    .eq("id", listingId)
    .eq("owner_id", user.id)
    .maybeSingle();
  return { supabase, user, listing };
}

/** Exclui um rascunho e as fotos dele. Anúncio enviado ou publicado não sai por aqui. */
export async function deleteDraft(listingId: string) {
  const { supabase, user, listing } = await ownListing(listingId);
  if (!listing || listing.status !== "draft") return;

  // Apaga a pasta inteira do anúncio no Storage, inclusive fotos enviadas e nunca salvas.
  const folder = `${user.id}/${listingId}`;
  const { data: files } = await supabase.storage.from(PHOTO_BUCKET).list(folder, { limit: 100 });
  const paths = [...new Set([...listing.photos, ...(files ?? []).map((file) => `${folder}/${file.name}`)])];
  if (paths.length > 0) await supabase.storage.from(PHOTO_BUCKET).remove(paths);

  const { error } = await supabase.from("listings").delete().eq("id", listingId).eq("status", "draft");
  if (error) console.error("[deleteDraft]", error);
  refresh();
}

/** Renova o anúncio por mais 30 dias, grátis. O prazo só muda por esta função do banco. */
export async function renewListing(listingId: string) {
  const { supabase, listing } = await ownListing(listingId);
  if (!listing) return;
  const { error } = await supabase.rpc("renew_listing", { p_listing_id: listingId });
  if (error) console.error("[renewListing]", error);
  updateTag(`listing:${listing.slug}`);
  refresh();
}

const REMOVAL_REASONS = ["alugado", "indisponivel", "sem_procura", "outra_plataforma", "outro"] as const;
const removalSchema = z.object({
  reason: z.enum(REMOVAL_REASONS),
  rented_via_subleasy: z.enum(["sim", "nao", "nao_sei"]).nullable(),
  comment: z.string().trim().max(1000),
});
export type RemovalSurvey = z.input<typeof removalSchema>;

/**
 * Exclui um anúncio já enviado ou publicado. Antes, guarda o motivo e um retrato do
 * anúncio (com as métricas) para o super admin medir a performance do site.
 */
export async function deleteListing(listingId: string, survey: RemovalSurvey): Promise<{ ok: false; error: string }> {
  const parsed = removalSchema.safeParse(survey);
  if (!parsed.success) return { ok: false, error: "Conte por que está excluindo o anúncio." };
  const answers = parsed.data;

  const { supabase, user, listing } = await ownListing(listingId);
  if (!listing || listing.status === "draft") return { ok: false, error: "Anúncio não encontrado." };

  const [{ data: details }, { data: events }] = await Promise.all([
    supabase.from("listings").select("title, space_type, city, state").eq("id", listingId).maybeSingle(),
    supabase.from("listing_events").select("kind").eq("listing_id", listingId),
  ]);
  if (!details) return { ok: false, error: "Anúncio não encontrado." };

  const { error: surveyError } = await supabase.from("listing_removals").insert({
    listing_id: listingId,
    owner_id: user.id,
    title: details.title,
    space_type: details.space_type,
    city: details.city,
    state: details.state,
    status: listing.status,
    published_at: listing.published_at,
    reason: answers.reason,
    rented_via_subleasy: answers.reason === "alugado" ? answers.rented_via_subleasy : null,
    comment: answers.comment || null,
    views: (events ?? []).filter((event) => event.kind === "view").length,
    contacts: (events ?? []).filter((event) => event.kind !== "view").length,
  });
  if (surveyError) console.error("[deleteListing] Pesquisa não salva:", surveyError);

  const folder = `${user.id}/${listingId}`;
  const { data: files } = await supabase.storage.from(PHOTO_BUCKET).list(folder, { limit: 100 });
  const paths = [...new Set([...listing.photos, ...(files ?? []).map((file) => `${folder}/${file.name}`)])];
  if (paths.length > 0) await supabase.storage.from(PHOTO_BUCKET).remove(paths);

  const { error } = await supabase.from("listings").delete().eq("id", listingId);
  if (error) {
    console.error("[deleteListing]", error);
    return { ok: false, error: "Não foi possível excluir. Tente de novo." };
  }
  updateTag(`listing:${listing.slug}`);
  redirect("/painel?excluido=1");
}

/** Tira o anúncio do ar sem perder nada. Reativar leva um clique. */
export async function pauseListing(listingId: string) {
  const { supabase, listing } = await ownListing(listingId);
  if (!listing || listing.status !== "active") return;
  const { error } = await supabase.from("listings").update({ status: "paused" }).eq("id", listingId);
  if (error) console.error("[pauseListing]", error);
  updateTag(`listing:${listing.slug}`);
  refresh();
}

/** Volta ao ar um anúncio pausado. O prazo não para durante a pausa. */
export async function resumeListing(listingId: string) {
  const { supabase, listing } = await ownListing(listingId);
  if (!listing || listing.status !== "paused" || !listing.published_at) return;
  const { error } = await supabase
    .from("listings")
    .update({ status: "active" })
    .eq("id", listingId);
  if (error) console.error("[resumeListing]", error);
  updateTag(`listing:${listing.slug}`);
  refresh();
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

function safeJson(value: FormDataEntryValue | null): unknown {
  try {
    return JSON.parse(String(value ?? "null"));
  } catch {
    return null;
  }
}

function safeJsonArray(value: FormDataEntryValue | null) {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
