import { Suspense } from "react";
import type { Metadata } from "next";
import { SettingsSection, SettingsTitle, ToggleRow } from "@/components/settings-ui";
import { loadAccount } from "@/lib/account";

export const metadata: Metadata = { title: "Notificações" };

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="h-80 animate-pulse rounded-panel bg-ink-50" />}>
      <Notifications />
    </Suspense>
  );
}

async function Notifications() {
  const { profile } = await loadAccount("/configuracoes/notificacoes");

  return (
    <>
      <SettingsTitle>Notificações</SettingsTitle>
      <SettingsSection title="E-mails do Subleasy" description="Escolha o que chega no seu e-mail. Avisos de segurança e de login sempre chegam.">
        <ToggleRow
          setting="notify_messages"
          label="Mensagens de interessados"
          description="Quando alguém escreve pelo formulário de um anúncio seu. As mensagens ficam no painel de qualquer jeito."
          initial={profile?.notify_messages ?? true}
        />
        <ToggleRow
          setting="notify_listing_updates"
          label="Andamento dos anúncios"
          description="Anúncio recebido, aprovado ou devolvido para ajustes."
          initial={profile?.notify_listing_updates ?? true}
        />
        <ToggleRow
          setting="notify_expiration"
          label="Prazo dos anúncios"
          description="Lembretes antes de um anúncio expirar, com a opção de renovar."
          initial={profile?.notify_expiration ?? true}
        />
      </SettingsSection>
      <SettingsSection title="Novidades">
        <ToggleRow
          setting="marketing_opt_in"
          label="Dicas e novidades do Subleasy"
          description="Recursos novos e dicas para alugar mais rápido. No máximo um e-mail por mês."
          initial={profile?.marketing_opt_in ?? false}
        />
      </SettingsSection>
    </>
  );
}
