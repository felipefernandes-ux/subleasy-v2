import { Suspense } from "react";
import type { Metadata } from "next";
import { EditableRow, SettingsSection, SettingsTitle } from "@/components/settings-ui";
import { loadAccount, maskEmail, maskPhone } from "@/lib/account";
import { formatWhatsApp } from "@/lib/listing-options";

export const metadata: Metadata = { title: "Informações pessoais" };

export default function PersonalInfoPage() {
  return (
    <Suspense fallback={<div className="h-80 animate-pulse rounded-panel bg-ink-50" />}>
      <PersonalInfo />
    </Suspense>
  );
}

async function PersonalInfo() {
  const { user, profile } = await loadAccount("/configuracoes/informacoes-pessoais");
  const name = profile?.display_name ?? "";
  const whatsapp = profile?.whatsapp_number ?? "";

  return (
    <>
      <SettingsTitle>Informações pessoais</SettingsTitle>
      <SettingsSection>
      <EditableRow
        field="name"
        label="Nome"
        value={name}
        initial={name}
        hint="Pode ser seu nome ou o da clínica. Nos anúncios aparece só o primeiro nome."
      />
      <EditableRow
        field="email"
        label="Endereço de e-mail"
        value={user.email ? maskEmail(user.email) : null}
        initial={user.email ?? ""}
        type="email"
        hint="É o e-mail de login e o que recebe os avisos do Subleasy. Mandamos um link para confirmar o endereço novo."
      />
      <EditableRow
        field="whatsapp"
        label="WhatsApp"
        value={whatsapp ? maskPhone(whatsapp) : null}
        initial={formatWhatsApp(whatsapp)}
        type="tel"
        placeholder="(44) 99999-9999"
        hint="Número que já vem preenchido nos anúncios novos. Os anúncios publicados mantêm o número que têm."
      />
      <div className="py-6">
        <p className="font-bold text-ink-900">No Subleasy desde</p>
        <p className="mt-1 text-ink-600">
          {new Date(profile?.created_at ?? user.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" })}
        </p>
      </div>
      </SettingsSection>
    </>
  );
}
