import type { ReactNode } from "react";
import type { Metadata } from "next";
import { SettingsNav } from "@/components/settings-ui";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  // Mantém o "| Subleasy" do título das abas.
  title: { default: "Configurações da conta", template: "%s | Subleasy" },
  robots: { index: false, follow: false },
};

/** Moldura das configurações: o mesmo cabeçalho do site, barra lateral e conteúdo. */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <SiteHeader />
      <div className="container-page grid grid-cols-1 flex-1 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <aside className="pt-8 lg:border-r lg:border-ink-200 lg:pt-12 lg:pr-10">
          <h1 className="text-h2 font-bold text-ink-900">Configurações da conta</h1>
          <SettingsNav />
        </aside>
        <main className="max-w-3xl pt-8 pb-24 lg:pt-12 lg:pl-20">{children}</main>
      </div>
    </div>
  );
}
