"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { embedListing, geminiClient } from "@/lib/ai";
import {
  AMENITIES,
  BILLING_TYPE_KEYS,
  HIGHLIGHT_KEYS,
  LISTING_DAYS,
  MAX_HIGHLIGHTS,
  OFFER_KEYS,
  SPACE_TYPE_KEYS,
  UFS,
  toBrazilianWhatsApp,
} from "@/lib/listing-options";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/superadmin/auth";

export type AdminListingState = { status: "idle" } | { status: "error"; error: string; fields: Record<string, string> };

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null);

/** "600", "600,00" ou "1.200,50" para número. Devolve NaN quando não for um valor. */
function parsePrice(raw: string) {
  const cleaned = raw.replace(/[^\d.,]/g, "");
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  return Number(normalized);
}

const lines = (raw: string) =>
  raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const schema = z.object({
  title: z.string().trim().min(10).max(70),
  short_summary: optionalText.pipe(z.string().max(120).nullable()),
  description: optionalText,
  space_type: z.enum(SPACE_TYPE_KEYS),
  space_type_other: optionalText,
  billing_type: z.enum(BILLING_TYPE_KEYS),
  price: z.string().transform(parsePrice).pipe(z.number().min(10)),
  zip_code: optionalText.pipe(z.string().regex(/^[0-9]{5}-?[0-9]{3}$/).nullable()),
  neighborhood: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().toUpperCase().pipe(z.enum(UFS)),
  street_address: optionalText,
  min_rental_period: optionalText,
  rules: z.string().transform(lines),
  amenities: z.array(z.string()).transform((keys) => [...new Set(keys)]),
  highlights: z.array(z.enum(HIGHLIGHT_KEYS)).max(MAX_HIGHLIGHTS),
  offers: z.array(z.enum(OFFER_KEYS)),
  show_exact_location: z.boolean(),
  whatsapp: z.string().trim(),
  contact_email: optionalText.pipe(z.email().nullable()),
  email_contact: z.boolean(),
  status: z.enum(["draft", "pending_approval", "active", "paused"]),
  expires_on: optionalText.pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()),
  review_note: optionalText.pipe(z.string().max(1000).nullable()),
});

const LABELS: Record<string, string> = {
  title: "O título precisa ter entre 10 e 70 caracteres.",
  short_summary: "O resumo pode ter até 120 caracteres.",
  space_type: "Escolha a área de atuação.",
  billing_type: "Escolha a forma de cobrança.",
  price: "Informe o preço em reais, a partir de R$ 10.",
  zip_code: "Digite o CEP no formato 00000-000.",
  neighborhood: "Informe o bairro.",
  city: "Informe a cidade.",
  state: "Escolha a UF.",
  highlights: `Escolha até ${MAX_HIGHLIGHTS} destaques.`,
  contact_email: "Digite um e-mail válido.",
  expires_on: "Escolha uma data válida.",
  review_note: "A nota pode ter até 1000 caracteres.",
};

/**
 * Edição completa de um anúncio pelo Super Admin, em qualquer status. A gravação do anúncio usa a sessão
 * do admin (a política "Admin edita todos os anúncios" e o trigger de status só liberam quem é admin);
 * o contato privado usa a service role, porque admin só lê essa tabela. Fotos ainda não são editáveis aqui.
 */
export async function adminSaveListing(listingId: string, _previous: AdminListingState, formData: FormData): Promise<AdminListingState> {
  const admin = await requireAdmin(`/anuncios/${listingId}/editar`);

  const parsed = schema.safeParse({
    title: formData.get("title") ?? "",
    short_summary: formData.get("short_summary") ?? "",
    description: formData.get("description") ?? "",
    space_type: formData.get("space_type") ?? "",
    space_type_other: formData.get("space_type_other") ?? "",
    billing_type: formData.get("billing_type") ?? "",
    price: formData.get("price") ?? "",
    zip_code: formData.get("zip_code") ?? "",
    neighborhood: formData.get("neighborhood") ?? "",
    city: formData.get("city") ?? "",
    state: formData.get("state") ?? "",
    street_address: formData.get("street_address") ?? "",
    min_rental_period: formData.get("min_rental_period") ?? "",
    rules: formData.get("rules") ?? "",
    amenities: formData.getAll("amenity").map(String).filter((key) => key in AMENITIES),
    highlights: formData.getAll("highlight").map(String),
    offers: formData.getAll("offer").map(String),
    show_exact_location: formData.get("show_exact_location") === "on",
    whatsapp: formData.get("whatsapp") ?? "",
    contact_email: String(formData.get("contact_email") ?? "").toLowerCase(),
    email_contact: formData.get("email_contact") === "on",
    status: formData.get("status") ?? "",
    expires_on: formData.get("expires_on") ?? "",
    review_note: formData.get("review_note") ?? "",
  });

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      if (field in LABELS) fields[field] = LABELS[field];
    }
    return { status: "error", error: "Revise os campos marcados.", fields };
  }
  const data = parsed.data;

  const whatsapp = data.whatsapp ? toBrazilianWhatsApp(data.whatsapp) : null;
  if (data.whatsapp && !whatsapp) {
    return { status: "error", error: "Revise os campos marcados.", fields: { whatsapp: "Digite o WhatsApp com DDD, como (44) 99999-9999." } };
  }

  const supabase = await createClient();
  const { data: current } = await supabase.from("listings").select("id, slug, status, published_at, expires_at").eq("id", listingId).maybeSingle();
  if (!current) return { status: "error", error: "Anúncio não encontrado.", fields: {} };

  const now = Date.now();
  // Fim do dia escolhido, no horário de São Paulo.
  let expiresAt = data.expires_on ? new Date(`${data.expires_on}T23:59:59-03:00`).toISOString() : current.expires_at;
  let publishedAt = current.published_at;
  if (data.status === "active") {
    publishedAt ??= new Date(now).toISOString();
    if (!expiresAt || Date.parse(expiresAt) <= now) expiresAt = new Date(now + LISTING_DAYS * 24 * 60 * 60 * 1000).toISOString();
  }

  const content = {
    title: data.title,
    short_summary: data.short_summary,
    description: data.description,
    space_type: data.space_type,
    space_type_other: data.space_type === "outro" ? data.space_type_other : null,
    billing_type: data.billing_type,
    price: data.price,
    zip_code: data.zip_code,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
    min_rental_period: data.min_rental_period,
    rules: data.rules,
    amenities: data.amenities,
    highlights: data.highlights,
    offers: data.offers,
    show_exact_location: data.show_exact_location,
    email_contact: data.email_contact,
  };

  // O texto mudou: o vetor da busca por significado muda junto. Se falhar, a edição segue.
  let embedding: string | undefined;
  const ai = geminiClient();
  if (ai) {
    try {
      embedding = await embedListing(ai, content);
    } catch (error) {
      console.error("[superadmin] embedding não atualizado:", error);
    }
  }

  const { error } = await supabase
    .from("listings")
    .update({
      ...content,
      ...(embedding ? { embedding } : {}),
      status: data.status,
      published_at: publishedAt,
      expires_at: expiresAt,
      review_note: data.review_note,
    })
    .eq("id", listingId);
  if (error) {
    console.error("[superadmin] anúncio não salvo:", error.message);
    return { status: "error", error: "Não foi possível salvar o anúncio. Nada foi alterado.", fields: {} };
  }

  const { error: contactError } = await createAdminClient()
    .from("listing_contacts")
    .upsert({ listing_id: listingId, whatsapp_number: whatsapp, contact_email: data.contact_email, street_address: data.street_address });
  if (contactError) {
    console.error("[superadmin] contato não salvo:", contactError.message);
    return { status: "error", error: "O anúncio foi salvo, mas o contato não. Tente salvar de novo.", fields: {} };
  }

  // Ainda não existe admin_audit_log; até lá, o rastro fica no log do servidor.
  console.info(`[superadmin] ${admin.email} editou o anúncio ${listingId}`);

  updateTag(`listing:${current.slug}`);
  updateTag("listings");
  redirect(`/anuncios/${listingId}?salvo=1`);
}
