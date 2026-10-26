"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { photoUrl } from "@/lib/listing-options";
import { createClient } from "@/lib/supabase/server";

export type FavoriteList = { id: string; name: string; count: number; cover: string | null; hasListing: boolean };
export type FavoriteState = { loggedIn: false } | { loggedIn: true; lists: FavoriteList[] };

/**
 * Listas de favoritos de quem está logado, com a capa do primeiro anúncio salvo e se
 * este anúncio já está em cada uma. A página da sala fica em cache, então isso vem do navegador.
 */
export async function getFavoriteState(listingId: string): Promise<FavoriteState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { loggedIn: false };

  const { data: lists } = await supabase
    .from("favorite_lists")
    .select("id, name, favorite_items(listing_id, created_at, listings(photos))")
    .order("created_at", { ascending: false });

  return {
    loggedIn: true,
    lists: (lists ?? []).map((list) => {
      const items = [...list.favorite_items].sort((a, b) => a.created_at.localeCompare(b.created_at));
      const firstPhoto = items.map((item) => item.listings?.photos[0]).find(Boolean);
      return {
        id: list.id,
        name: list.name,
        count: items.length,
        cover: firstPhoto ? photoUrl(firstPhoto) : null,
        hasListing: items.some((item) => item.listing_id === listingId),
      };
    }),
  };
}

/** Coloca ou tira o anúncio de uma lista. */
export async function toggleFavorite(listId: string, listingId: string): Promise<FavoriteState> {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("favorite_items").select("list_id").eq("list_id", listId).eq("listing_id", listingId).maybeSingle();
  const { error } = existing
    ? await supabase.from("favorite_items").delete().eq("list_id", listId).eq("listing_id", listingId)
    : await supabase.from("favorite_items").insert({ list_id: listId, listing_id: listingId });
  if (error) console.error("[toggleFavorite]", error);
  return getFavoriteState(listingId);
}

const nameSchema = z.string().trim().min(1).max(50);

/** Cria uma lista nova e já salva o anúncio nela. */
export async function createFavoriteList(name: string, listingId: string): Promise<FavoriteState | { error: string }> {
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { error: "Dê um nome de até 50 caracteres para a lista." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { loggedIn: false };

  const { data: list, error } = await supabase.from("favorite_lists").insert({ owner_id: user.id, name: parsed.data }).select("id").single();
  if (error || !list) {
    console.error("[createFavoriteList]", error);
    return { error: "Não foi possível criar a lista. Tente de novo." };
  }
  const { error: itemError } = await supabase.from("favorite_items").insert({ list_id: list.id, listing_id: listingId });
  if (itemError) console.error("[createFavoriteList] Item não salvo:", itemError);
  return getFavoriteState(listingId);
}

/** Tira a sala da lista, na página da lista, e atualiza a página. */
export async function removeFromList(listId: string, listingId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("favorite_items").delete().eq("list_id", listId).eq("listing_id", listingId);
  if (error) console.error("[removeFromList]", error);
  refresh();
}
