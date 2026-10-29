import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ListingView } from "@/components/listing-view";
import { ClaimBar, PreviewContactButton, PreviewOptOut, PreviewViewTracker } from "@/components/preview/prospect-preview-client";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonClasses } from "@/components/ui";
import { geocodeArea, spread } from "@/lib/geocode";
import {
  PREVIEW_EXAMPLE_PRICE,
  PREVIEW_PHOTOS,
  PREVIEW_PHOTO_SIZES,
  exampleAmenities,
  exampleHighlights,
  specialtyOfSpaceType,
} from "@/lib/prospecting/preview";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Prévia de anúncio de prospecção: aberta só por link, sem cache e fora de buscadores.
 * O texto vem da tabela prospect_previews, nunca de public.listings, então nenhuma lista do site a enxerga.
 */
const TOKEN = /^[A-Za-z0-9_-]{20,40}$/;

async function getPreview(token: string) {
  if (!TOKEN.test(token)) return null;
  const db = createAdminClient();
  const { data: preview } = await db.from("prospect_previews").select("*").eq("token", token).maybeSingle();
  if (!preview || preview.revoked_at || new Date(preview.expires_at) <= new Date()) return null;
  const { data: prospect } = await db.from("prospects").select("status, name").eq("id", preview.prospect_id).maybeSingle();
  if (!prospect || prospect.status === "nao_contatar") return null;
  return { ...preview, hostName: prospect.name };
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  await connection();
  const { token } = await params;
  const preview = await getPreview(token);
  const robots = { index: false, follow: false, nocache: true };
  if (!preview) return { title: "Prévia indisponível", robots };
  return {
    title: preview.title,
    description: preview.short_summary ?? undefined,
    robots,
    openGraph: { title: preview.title, description: preview.short_summary ?? undefined, type: "website" },
  };
}

export default function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <>
      <SiteHeader />
      <main className="container-page flex-1 pt-6 pb-32 sm:pt-10">
        <Suspense fallback={<div className="aspect-[2/1] animate-pulse rounded-panel bg-ink-100" />}>
          <Preview params={params} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function Preview({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const preview = await getPreview(token);

  if (!preview) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center sm:py-24">
        <h1 className="text-h2 font-bold text-ink-900">Esta prévia não está mais disponível</h1>
        <p className="mt-3 text-ink-700">O link pode ter vencido ou ter sido retirado. Se quiser anunciar uma sala, é grátis publicar no Subleasy.</p>
        <Link href="/anunciar" className={`${buttonClasses("primary", "lg")} mt-8`}>
          Anunciar minha sala
        </Link>
      </div>
    );
  }

  // Área aproximada do bairro (o ponto é deslocado um pouco, sempre igual para a mesma prévia).
  const center = await geocodeArea(preview.neighborhood, preview.city, preview.state);
  const area = center ? spread(center, token) : null;

  // Prévias criadas antes das comodidades de exemplo ficam sem lista: o padrão da área entra no lugar.
  const specialty = specialtyOfSpaceType(preview.space_type);
  const amenities = preview.amenities.length > 0 ? preview.amenities : exampleAmenities(specialty);

  return (
    <>
      <PreviewViewTracker token={token} />
      <p role="status" className="mb-6 rounded-control border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-ink-800">
        <strong className="font-bold">Esta é uma prévia criada para você.</strong> O texto é uma sugestão, as fotos são ilustrativas e o valor, as comodidades e os selos são de exemplo. Nada é publicado sem a sua aprovação.
      </p>
      <ListingView
        listing={{
          id: "previa",
          title: preview.title,
          short_summary: preview.short_summary,
          description: preview.description,
          space_type: preview.space_type,
          billing_type: "turno",
          price: PREVIEW_EXAMPLE_PRICE,
          city: preview.city,
          state: preview.state,
          neighborhood: preview.neighborhood,
          min_rental_period: null,
          rules: [],
          amenities,
          photos: PREVIEW_PHOTOS,
          photo_sizes: PREVIEW_PHOTO_SIZES,
          highlights: exampleHighlights(specialty),
          offers: [],
          latitude: area?.[0] ?? null,
          longitude: area?.[1] ?? null,
          show_exact_location: false,
        }}
        hostName={preview.hostName}
        priceNote="Valor de exemplo: você define o seu ao publicar."
        amenitiesNote="Comodidades e selos de exemplo. Você confirma os da sua sala antes de publicar."
        contact={<PreviewContactButton />}
      />
      <div className="mt-12 border-t border-ink-200 pt-6">
        <PreviewOptOut token={token} />
      </div>
      <ClaimBar token={token} />
    </>
  );
}
