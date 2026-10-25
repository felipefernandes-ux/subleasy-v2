import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Cópia dos dados da pessoa logada (LGPD): perfil, anúncios, contatos, mensagens e favoritos. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Entre na sua conta para baixar seus dados." }, { status: 401 });

  const [{ data: profile }, { data: listings }, { data: favorites }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("listings")
      .select("*, listing_contacts(whatsapp_number, contact_email, street_address), listing_inquiries(name, email, phone, message, created_at)")
      .eq("owner_id", user.id),
    supabase.from("favorite_lists").select("name, created_at, favorite_items(created_at, listings(title, slug))"),
  ]);

  // O vetor da busca não diz nada para a pessoa e deixaria o arquivo enorme.
  const cleanListings = (listings ?? []).map((listing) => {
    const copy: Record<string, unknown> = { ...listing };
    delete copy.embedding;
    return copy;
  });
  const body = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at, providers: (user.identities ?? []).map((identity) => identity.provider) },
    profile,
    listings: cleanListings,
    favorites,
  };

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="subleasy-meus-dados-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
