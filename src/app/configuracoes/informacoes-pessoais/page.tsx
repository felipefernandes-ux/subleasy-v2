import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AvatarSetting } from "@/components/avatar-picker";
import { EditableRow, SettingsSection, SettingsTitle, ToggleRow } from "@/components/settings-ui";
import { loadAccount, maskEmail, maskPhone } from "@/lib/account";
import { BIO_MAX, WHATSAPP_CONSENT } from "@/lib/public-profile";
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
      {profile && (
        <p className="mt-2 text-sm text-ink-600">
          Seu nome, foto e apresentação formam o seu perfil público.{" "}
          <Link href={`/u/${profile.public_id}`} target="_blank" className="font-bold text-brand-600 hover:text-brand-700">
            Ver meu perfil público
          </Link>
        </p>
      )}
      <SettingsSection>
      <div className="border-b border-ink-200 py-6">
        <p className="font-bold text-ink-900">Foto</p>
        <div className="mt-3">
          <AvatarSetting name={name} initialPath={profile?.avatar_path ?? null} />
        </div>
      </div>
      <EditableRow
        field="name"
        label="Nome"
        value={name}
        initial={name}
        hint="Pode ser seu nome ou o da clínica. No perfil e nos anúncios aparece o primeiro nome e a inicial do último."
      />
      <EditableRow
        field="bio"
        label="Apresentação"
        value={profile?.bio ?? null}
        initial={profile?.bio ?? ""}
        type="textarea"
        maxLength={BIO_MAX}
        placeholder="Ex.: Psicóloga há 8 anos. Divido meu consultório na Zona 7 nos turnos em que não atendo."
        hint="Aparece no seu perfil público. Não coloque telefone, e-mail, documentos nem links. Se divulgar serviços de saúde, valem as regras de publicidade do seu conselho."
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
      <ToggleRow
        setting="show_whatsapp"
        label={WHATSAPP_CONSENT.label}
        description={WHATSAPP_CONSENT.description}
        initial={profile?.show_whatsapp ?? false}
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
