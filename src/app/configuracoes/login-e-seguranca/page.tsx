import { Suspense } from "react";
import type { Metadata } from "next";
import { signOutEverywhere } from "@/app/actions/account";
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { DeleteAccount, GoogleConnection, SettingsSection, SettingsTitle } from "@/components/settings-ui";
import { buttonClasses } from "@/components/ui";
import { loadAccount, maskEmail } from "@/lib/account";

export const metadata: Metadata = { title: "Login e segurança" };

export default function SecurityPage({ searchParams }: PageProps<"/configuracoes/login-e-seguranca">) {
  return (
    <Suspense fallback={<div className="h-80 animate-pulse rounded-panel bg-ink-50" />}>
      <Security searchParams={searchParams} />
    </Suspense>
  );
}

async function Security({ searchParams }: { searchParams: PageProps<"/configuracoes/login-e-seguranca">["searchParams"] }) {
  const { google } = await searchParams;
  const { supabase, user } = await loadAccount("/configuracoes/login-e-seguranca");
  const providers = new Set((user.identities ?? []).map((identity) => identity.provider));
  const { count } = await supabase.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", user.id);

  return (
    <>
      <SettingsTitle>Login e segurança</SettingsTitle>
      <SettingsSection title="Login" description="O Subleasy não usa senha: você entra pelo Google ou por um link enviado ao seu e-mail.">
        <Row label="Link por e-mail" value={user.email ? `Ativo para ${maskEmail(user.email)}` : "Sem e-mail"} status="Ativo" />
        {/* Volta do Google ao conectar: o resultado vem na URL. */}
        {google === "conectado" && providers.has("google") && (
          <p role="status" className="mt-4 flex items-center gap-2 rounded-card bg-mint-50 p-4 text-sm text-ink-800 ring-1 ring-mint-500/30">
            <CheckCircleIcon className="size-5 text-mint-700" weight="fill" aria-hidden />
            Conta Google conectada. Na próxima vez, é só entrar com o Google.
          </p>
        )}
        {google === "erro" && (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-card bg-danger-600/6 p-4 text-sm text-ink-800 ring-1 ring-danger-600/20">
            <WarningCircleIcon className="mt-0.5 size-5 shrink-0 text-danger-600" weight="fill" aria-hidden />
            Não foi possível conectar o Google agora. Se essa conta Google já está ligada a outro cadastro no Subleasy, ela não pode ser conectada aqui.
          </p>
        )}
        <GoogleConnection connected={providers.has("google")} otherLogins={[...providers].filter((provider) => provider !== "google").length} />
      </SettingsSection>

      <SettingsSection title="Aparelhos" description="Saiu de um computador emprestado ou perdeu o celular? Encerre todas as sessões de uma vez.">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-200 py-6">
          <div>
            <p className="font-bold text-ink-900">Sair de todos os aparelhos</p>
            <p className="mt-1 text-ink-600">Inclusive deste. Para voltar, entre de novo pelo Google ou pelo link no e-mail.</p>
          </div>
          <form action={signOutEverywhere}>
            <button type="submit" className={buttonClasses("secondary")}>
              Sair de todos
            </button>
          </form>
        </div>
      </SettingsSection>

      <SettingsSection title="Conta">
        <DeleteAccount listings={count ?? 0} />
      </SettingsSection>
    </>
  );
}

function Row({ label, value, status }: { label: string; value: string; status?: string }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-ink-200 py-6">
      <div>
        <p className="font-bold text-ink-900">{label}</p>
        <p className="mt-1 text-ink-600">{value}</p>
      </div>
      {status && <span className="shrink-0 rounded-full bg-mint-100 px-2.5 py-0.5 text-xs font-bold text-mint-700">{status}</span>}
    </div>
  );
}
