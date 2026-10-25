import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SettingsNav } from "@/components/settings-ui";
import { AccountMenu } from "@/components/account-menu";
import { Logo, buttonClasses } from "@/components/ui";

export const metadata: Metadata = {
  // Mantém o "| Subleasy" do título das abas.
  title: { default: "Configurações da conta", template: "%s | Subleasy" },
  robots: { index: false, follow: false },
};

/** Moldura das configurações, como no Airbnb: cabeçalho simples, barra lateral e conteúdo. */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="border-b border-ink-200">
        <div className="container-page flex h-20 items-center justify-between">
          <Link href="/" aria-label="Subleasy, página inicial" className="focus-ring rounded-control">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/anunciar" className={buttonClasses("primary")}>
              Anunciar grátis
            </Link>
            <AccountMenu />
          </div>
        </div>
      </header>
      <div className="container-page grid flex-1 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <aside className="pt-8 lg:border-r lg:border-ink-200 lg:pt-12 lg:pr-10">
          <h1 className="text-h2 font-bold text-ink-900">Configurações da conta</h1>
          <SettingsNav />
        </aside>
        <main className="max-w-3xl pt-8 pb-24 lg:pt-12 lg:pl-20">{children}</main>
      </div>
    </div>
  );
}
