import type { Metadata } from "next";
import Link from "next/link";
import { DownloadSimpleIcon } from "@phosphor-icons/react/ssr";
import { SettingsSection, SettingsTitle } from "@/components/settings-ui";
import { buttonClasses } from "@/components/ui";

export const metadata: Metadata = { title: "Privacidade" };

/** O que é público, o que fica guardado e como levar uma cópia dos dados (LGPD). */
export default function PrivacyPage() {
  return (
    <>
      <SettingsTitle>Privacidade</SettingsTitle>
      <SettingsSection title="O que aparece para outras pessoas">
        <ul className="mt-4 space-y-3 text-ink-700">
          <li className="border-b border-ink-200 pb-3">
            <strong className="font-bold text-ink-900">Seu primeiro nome</strong>, quantos anúncios você tem no ar e desde quando está no Subleasy.
          </li>
          <li className="border-b border-ink-200 pb-3">
            <strong className="font-bold text-ink-900">Seus anúncios</strong>: fotos, descrição, preço, bairro e cidade. A rua e o número nunca aparecem.
          </li>
          <li className="pb-3">
            <strong className="font-bold text-ink-900">Seu WhatsApp e seu e-mail não ficam visíveis.</strong> O número só é revelado para quem clica
            em Falar no WhatsApp, e o e-mail nunca aparece: as mensagens chegam pelo formulário.
          </li>
        </ul>
      </SettingsSection>

      <SettingsSection title="Seus dados" description="Baixe tudo o que o Subleasy guarda sobre você: perfil, anúncios, mensagens recebidas e favoritos.">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-200 py-6">
          <div>
            <p className="font-bold text-ink-900">Baixar uma cópia dos seus dados</p>
            <p className="mt-1 text-ink-600">Um arquivo JSON, gerado na hora.</p>
          </div>
          <a href="/configuracoes/dados" download className={buttonClasses("secondary")}>
            <DownloadSimpleIcon className="size-4" aria-hidden />
            Baixar
          </a>
        </div>
        <p className="py-6 text-ink-600">
          Para entender como usamos seus dados, leia a{" "}
          <Link href="/privacidade" className="font-bold text-brand-600 hover:text-brand-700">
            Política de privacidade
          </Link>{" "}
          e os{" "}
          <Link href="/termos" className="font-bold text-brand-600 hover:text-brand-700">
            Termos de uso
          </Link>
          . Para apagar tudo, encerre a conta em{" "}
          <Link href="/configuracoes/login-e-seguranca" className="font-bold text-brand-600 hover:text-brand-700">
            Login e segurança
          </Link>
          .
        </p>
      </SettingsSection>
    </>
  );
}
