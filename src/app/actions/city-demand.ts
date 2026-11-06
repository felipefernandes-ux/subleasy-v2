"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { displayCity, normalizeCity } from "@/lib/city-text";
import { SPACE_TYPE_KEYS, UFS } from "@/lib/listing-options";
import { getMunicipios, searchMunicipios, type Municipio } from "@/lib/municipios";
import { emitPostHogLog } from "@/lib/posthog-logs";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const VISITOR_COOKIE = "sl_vid";

const requestSchema = z.object({
  city: z.string().trim().min(2).max(80),
  // Vem da cidade escolhida na lista; vazio quando a pessoa digitou o nome inteiro, e o servidor completa.
  state: z.union([z.literal(""), z.enum(UFS)]),
  // Vazio é permitido: o e-mail é opcional.
  email: z.union([z.literal(""), z.string().trim().toLowerCase().pipe(z.email())]),
  tipo: z.union([z.literal(""), z.enum(SPACE_TYPE_KEYS)]),
  source: z.enum(["filtro", "sem_resultado"]),
  // Campo escondido: gente não preenche, robô sim.
  website: z.string().max(0),
});

export type CityRequestState = { status: "idle" } | { status: "sent"; city: string; withEmail: boolean } | { status: "error"; error: string };

/**
 * Pedido de uma cidade sem sala no ar. Uma pessoa conta uma vez por cidade (o e-mail e o tipo de sala
 * podem ser acrescentados depois). Super Admin não gera dado no site público, então não registra.
 */
export async function requestCity(_previous: CityRequestState, formData: FormData): Promise<CityRequestState> {
  const parsed = requestSchema.safeParse({
    city: formData.get("city") ?? "",
    state: formData.get("state") ?? "",
    email: formData.get("email") ?? "",
    tipo: formData.get("tipo") ?? "",
    source: formData.get("source") ?? "filtro",
    website: formData.get("website") ?? "",
  });
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0]);
    const messages: Record<string, string> = {
      city: "Digite o nome da cidade.",
      email: "Digite um e-mail válido, como nome@exemplo.com, ou deixe o campo vazio.",
    };
    return { status: "error", error: messages[field] ?? "Não foi possível enviar. Tente de novo." };
  }
  const data = parsed.data;

  const place = await resolvePlace(data.city, data.state);
  if ("error" in place) return { status: "error", error: place.error };

  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin) return { status: "error", error: "Contas de Super Admin não registram pedidos pelo site público." };

  const cookieStore = await cookies();
  const visitorId = cookieStore.get(VISITOR_COOKIE)?.value ?? crypto.randomUUID();
  if (!cookieStore.get(VISITOR_COOKIE)) {
    cookieStore.set(VISITOR_COOKIE, visitorId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  }

  const admin = createAdminClient();
  const cityKey = normalizeCity(place.name);
  const { data: existing } = await admin
    .from("city_requests")
    .select("id, email, requests")
    .eq("visitor_id", visitorId)
    .eq("city_key", cityKey)
    .eq("state", place.uf)
    .maybeSingle();

  const now = new Date().toISOString();
  const { error } = existing
    ? await admin
        .from("city_requests")
        .update({
          email: data.email || existing.email,
          space_type: data.tipo || undefined,
          requests: Math.min(existing.requests + 1, 100),
          updated_at: now,
        })
        .eq("id", existing.id)
    : await admin.from("city_requests").insert({
        visitor_id: visitorId,
        city: place.name,
        city_key: cityKey,
        state: place.uf,
        space_type: data.tipo || null,
        email: data.email || null,
        source: data.source,
      });
  if (error) {
    console.error("[requestCity]", error);
    return { status: "error", error: "Não foi possível enviar. Tente de novo." };
  }

  await emitPostHogLog("city_requested", { city: place.name, state: place.uf, source: data.source, with_email: Boolean(data.email) });
  return { status: "sent", city: place.name, withEmail: Boolean(data.email || existing?.email) };
}

/** Sugestões de cidade ao digitar, com o estado de cada uma. Só dado público do IBGE. */
export async function suggestCities(text: string): Promise<{ name: string; uf: string }[]> {
  return (await searchMunicipios(String(text).slice(0, 80))).map(({ name, uf }) => ({ name, uf }));
}

/**
 * Completa o estado pelo nome. Com o estado já escolhido na lista, só confere; sem ele, uma cidade única
 * resolve sozinha, e um nome que existe em mais de um estado pede para escolher na lista.
 */
async function resolvePlace(city: string, uf: string): Promise<Municipio | { error: string }> {
  const all = await getMunicipios();
  // IBGE fora do ar: aceita o que a pessoa digitou, se ela já escolheu o estado.
  if (!all.length) return uf ? { name: displayCity(city), uf, key: normalizeCity(city) } : { error: "Não foi possível confirmar a cidade agora. Tente de novo em instantes." };

  const key = normalizeCity(city);
  const matches = all.filter((item) => item.key === key && (!uf || item.uf === uf));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    return { error: `Há mais de uma cidade chamada ${matches[0].name} (${matches.map((item) => item.uf).join(", ")}). Escolha na lista.` };
  }
  return { error: "Não encontramos essa cidade. Digite o nome e escolha uma das sugestões." };
}
