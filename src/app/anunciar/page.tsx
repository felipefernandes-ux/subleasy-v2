import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ListingWizard } from "@/components/listing-wizard";
import { formatWhatsApp } from "@/lib/listing-options";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Anunciar sala",
  description: "Cadastre seu consultório ou sala passo a passo, com ajuda da IA para escrever. Grátis e sem comissão.",
  alternates: { canonical: "/anunciar" },
};

export default function AnunciarPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-white" aria-busy="true" />}>
      <Wizard />
    </Suspense>
  );
}

async function Wizard() {
  // A sessão só existe na requisição. As fotos sobem para a pasta do usuário.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/anunciar");

  const { data: profile } = await supabase.from("profiles").select("whatsapp_number").eq("id", user.id).maybeSingle();
  return <ListingWizard userId={user.id} profile={{ whatsapp: formatWhatsApp(profile?.whatsapp_number ?? ""), email: user.email ?? "" }} />;
}
