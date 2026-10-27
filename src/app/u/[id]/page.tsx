import { Suspense } from "react";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { ClipboardTextIcon, EnvelopeSimpleIcon, MapPinIcon, SealCheckIcon, ShieldCheckIcon } from "@phosphor-icons/react/ssr";
import { ListingCard } from "@/components/related-listings";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ProfileWhatsApp } from "@/components/profile-whatsapp";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PUBLIC_ID_PATTERN } from "@/lib/public-profile";
import { createPublicClient } from "@/lib/supabase/public";

// Perfil público de qualquer usuário. A URL usa um id aleatório do perfil, sem nome e sem o id da conta.
// Anunciantes mostram também verificações, salas no ar e, com consentimento, o WhatsApp.
// O que aparece e por quê: docs/reports/Verificação e perfil público de anfitriões.md

async function getProfile(id: string) {
  "use cache";
  cacheTag(`profile:${id}`, "listings");
  cacheLife("hours");

  const supabase = createPublicClient();
  const [{ data: profile }, { data: listings }] = await Promise.all([
    supabase.rpc("public_profile", { p_public_id: id }).maybeSingle(),
    supabase.rpc("public_profile_listings", { p_public_id: id }),
  ]);
  return profile ? { profile, listings: listings ?? [] } : null;
}

const monthYear = (date: string) =>
  new Date(date).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });

export async function generateMetadata({ params }: PageProps<"/u/[id]">): Promise<Metadata> {
  const { id } = await params;
  const data = PUBLIC_ID_PATTERN.test(id) ? await getProfile(id) : null;
  if (!data) return { title: "Perfil não encontrado", robots: { index: false } };
  const { profile } = data;
  const advertiser = profile.roles.includes("anunciante") && profile.active_listings > 0;
  return {
    title: `${profile.public_name} no Subleasy`,
    description: advertiser
      ? `${profile.active_listings} ${profile.active_listings === 1 ? "sala" : "salas"} para sublocação em ${profile.cities.join(", ")}.`
      : `Perfil de ${profile.public_name} no Subleasy.`,
    alternates: { canonical: `/u/${id}` },
    // Perfil de pessoa: acessível pelo link, fora dos buscadores (minimização, LGPD art. 6º, III).
    robots: { index: false, follow: true },
  };
}

export default function ProfilePage({ params }: PageProps<"/u/[id]">) {
  return (
    <>
      <SiteHeader />
      <main className="container-page flex-1 pt-8 pb-24 sm:pt-12">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-panel bg-ink-50" />}>
          {params.then(({ id }) => (
            <PublicProfile id={id} />
          ))}
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function PublicProfile({ id }: { id: string }) {
  if (!PUBLIC_ID_PATTERN.test(id)) notFound();
  const data = await getProfile(id);
  if (!data) notFound();
  const { profile, listings } = data;
  const advertiser = profile.roles.includes("anunciante");
  const firstName = profile.public_name.split(" ")[0];

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[22rem_1fr] lg:gap-14">
      <aside className="lg:sticky lg:top-24">
        <div className="rounded-panel border border-ink-200 bg-white p-6 shadow-card">
          <div className="flex flex-col items-center text-center">
            <ProfileAvatar name={profile.public_name} path={profile.avatar_path} size={112} />
            <h1 className="mt-4 flex items-center gap-1.5 text-h3 font-bold text-ink-900">
              {profile.public_name}
              {profile.identity_verified_at && <SealCheckIcon className="size-5 text-brand-600" weight="fill" aria-label="Identidade verificada" />}
            </h1>
            <p className="mt-1 text-sm text-ink-600">
              {advertiser ? "Anunciante" : "Membro"} no Subleasy desde {monthYear(profile.member_since)}
            </p>
          </div>

          {advertiser && (
            <>
              <dl className="mt-6 grid grid-cols-2 divide-x divide-ink-200 rounded-card bg-ink-50 py-3 text-center">
                <div>
                  <dt className="text-xs text-ink-500">{profile.active_listings === 1 ? "Sala no ar" : "Salas no ar"}</dt>
                  <dd className="text-xl font-bold text-ink-900 tabular-nums">{profile.active_listings}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-500">{profile.cities.length === 1 ? "Cidade" : "Cidades"}</dt>
                  <dd className="text-xl font-bold text-ink-900 tabular-nums">{profile.cities.length}</dd>
                </div>
              </dl>
              {profile.cities.length > 0 && (
                <p className="mt-5 flex items-start gap-2 text-sm text-ink-700">
                  <MapPinIcon className="mt-0.5 size-4 shrink-0 text-ink-500" aria-hidden />
                  {profile.cities.join(", ")}
                </p>
              )}
            </>
          )}

          {profile.bio && <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line text-ink-700">{profile.bio}</p>}

          <div className="mt-6 border-t border-ink-200 pt-5">
            <h2 className="text-sm font-bold text-ink-900">O que o Subleasy confirmou</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-ink-700">
              {profile.identity_verified_at && (
                <li className="flex gap-2.5">
                  <SealCheckIcon className="mt-0.5 size-4 shrink-0 text-brand-600" weight="fill" aria-hidden />
                  Identidade verificada com documento e selfie em {monthYear(profile.identity_verified_at)}
                </li>
              )}
              <li className="flex gap-2.5">
                <EnvelopeSimpleIcon className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                E-mail confirmado
              </li>
              {advertiser && (
                <li className="flex gap-2.5">
                  <ClipboardTextIcon className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                  Cada anúncio passou pela revisão da equipe antes de ir ao ar
                </li>
              )}
            </ul>
            <details className="group mt-3 text-sm">
              <summary className="focus-ring inline-flex min-h-11 cursor-pointer list-none items-center rounded-sm font-bold text-brand-600 hover:text-brand-700 [&::-webkit-details-marker]:hidden">
                O que isso significa?
              </summary>
              <p className="pb-1 leading-relaxed text-ink-600">
                Conferimos esses pontos para reduzir perfis falsos. A verificação não garante a sala, o contrato nem a conduta de
                quem anuncia. Visite a sala e combine tudo por escrito antes de fechar.
              </p>
            </details>
          </div>

          {profile.show_whatsapp && (
            <div className="mt-5">
              <ProfileWhatsApp publicId={profile.public_id} name={profile.public_name} />
            </div>
          )}

          {advertiser && (
            <div className="mt-5 flex gap-3 rounded-card bg-mint-50 p-4 text-sm text-ink-800 ring-1 ring-mint-100">
              <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-mint-700" aria-hidden />
              <p>
                <strong className="font-bold">Visite a sala antes de pagar.</strong> O Subleasy nunca cobra reserva, caução ou taxa.
                Confira se o Pix está no nome do anunciante.
              </p>
            </div>
          )}
        </div>
      </aside>

      <section aria-labelledby="salas-titulo">
        <h2 id="salas-titulo" className="text-h2 font-bold tracking-[-0.015em] text-ink-900">
          Salas de {firstName}
        </h2>
        {listings.length > 0 ? (
          <>
            <p className="mt-1 text-ink-600">
              {listings.length} {listings.length === 1 ? "anúncio no ar" : "anúncios no ar"} no Subleasy
            </p>
            <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <li key={listing.slug}>
                  <ListingCard listing={listing} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-6 rounded-panel border border-dashed border-ink-300 bg-ink-50 p-8 text-center text-ink-600">
            {advertiser ? `${firstName} não tem salas no ar agora.` : `${firstName} ainda não anuncia salas no Subleasy.`}
          </p>
        )}
      </section>
    </div>
  );
}
