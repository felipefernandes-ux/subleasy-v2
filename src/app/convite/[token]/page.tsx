import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { confirmInterest } from "../actions";
import { INVITE_CAMPAIGN, verifyInviteToken } from "@/lib/invite-token";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Convite para o Subleasy 2.0",
  robots: { index: false, follow: false },
};

const buttonClass =
  "inline-flex h-12 items-center justify-center rounded-control bg-brand-600 px-6 font-semibold text-white transition-colors hover:bg-brand-700";

/**
 * Destino do botão “Quero participar” do e-mail. Abrir a página registra o clique;
 * o interesse só conta depois do toque em “Confirmar”, porque leitores de link de e-mail
 * abrem o endereço sozinhos e inflariam a taxa de interessados.
 */
export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Shell>
      <Suspense fallback={<div className="h-48" aria-hidden />}>
        <InviteContent params={params} />
      </Suspense>
    </Shell>
  );
}

async function InviteContent({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const userId = verifyInviteToken(decodeURIComponent(token));

  if (!userId) {
    return (
      <>
        <h1 className="text-h2 font-semibold text-ink-900">Este link não é válido</h1>
        <p className="mt-3 text-ink-700">Ele pode ter sido copiado pela metade. Abra o link direto do e-mail, ou responda o e-mail do Felipe que ele envia outro.</p>
        <Link href="/" className={`${buttonClass} mt-8`}>
          Ir para o Subleasy
        </Link>
      </>
    );
  }

  const db = createAdminClient();
  const [{ data: invite }, { data: userData }] = await Promise.all([
    db.from("campaign_invites").select("clicked_at, interested_at").eq("user_id", userId).eq("campaign", INVITE_CAMPAIGN).maybeSingle(),
    db.auth.admin.getUserById(userId),
  ]);

  if (!invite) {
    await db.from("campaign_invites").upsert(
      { user_id: userId, campaign: INVITE_CAMPAIGN, clicked_at: new Date().toISOString() },
      { onConflict: "user_id,campaign", ignoreDuplicates: true },
    );
  }

  const fullName = String(userData.user?.user_metadata?.full_name ?? "").trim();
  const first = fullName.split(/\s+/)[0] ?? "";
  const confirmed = Boolean(invite?.interested_at);

  if (confirmed) {
    return (
      <>
        <h1 className="text-h2 font-semibold text-ink-900">{first ? `Pronto, ${first}.` : "Pronto."} Seu interesse está registrado.</h1>
        <p className="mt-3 text-ink-700">
          Vou preparar o seu acesso ao Subleasy 2.0 e aviso por e-mail quando estiver no ar. Nada é publicado sem a sua aprovação.
        </p>
        <p className="mt-3 text-ink-700">Se quiser, responda o e-mail com uma linha contando o que mais travava você no site antigo. Eu leio.</p>
        <p className="mt-6 text-ink-700">Felipe, Subleasy</p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-h2 font-semibold text-ink-900">{first ? `${first}, ` : ""}quer participar do Subleasy 2.0?</h1>
      <p className="mt-3 text-ink-700">
        Ao confirmar, preparo o seu acesso antecipado antes de abrirmos ao público. Publicar e receber contatos pelo WhatsApp é grátis, e os recursos extras também, até março de 2027.
      </p>
      <form action={confirmInterest.bind(null, decodeURIComponent(token))} className="mt-8">
        <button type="submit" className={buttonClass}>
          Confirmar que quero participar
        </button>
      </form>
    </>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-lg px-5 py-16 sm:py-24">{children}</main>;
}
