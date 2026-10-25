import type { ReactNode } from "react";
import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react/ssr";
import { AccountMenu } from "./account-menu";
import { Logo, buttonClasses } from "./ui";

/** Moldura das telas do anfitrião e do admin: logo, atalhos e fundo neutro. */
export function HostShell({
  children,
  admin = false,
  wide = false,
  white = false,
}: {
  children: ReactNode;
  admin?: boolean;
  wide?: boolean;
  /** Fundo branco, como a lista de anúncios: os filtros em cinza se destacam melhor. */
  white?: boolean;
}) {
  return (
    <div className={`flex min-h-dvh flex-col ${white ? "bg-white" : "bg-ink-50"}`}>
      <header className="border-b border-ink-200 bg-white">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Subleasy, página inicial" className="focus-ring rounded-control">
              <Logo />
            </Link>
            {admin && <span className="rounded-full bg-ink-900 px-2.5 py-0.5 text-xs font-bold text-white">Admin</span>}
          </div>
          <nav aria-label="Conta" className="flex items-center gap-1">
            {admin ? (
              <Link href="/admin/anuncios" className={buttonClasses("ghost")}>
                Para aprovar
              </Link>
            ) : (
              <>
                <Link href="/painel" className={buttonClasses("ghost")}>
                  Meus anúncios
                </Link>
                <Link href="/anunciar" className={`${buttonClasses("primary")} max-sm:px-3`}>
                  <PlusIcon className="size-4" weight="bold" aria-hidden />
                  <span className="max-sm:sr-only">Anunciar sala</span>
                </Link>
              </>
            )}
            <span className="ml-1">
              <AccountMenu showSignIn={false} />
            </span>
          </nav>
        </div>
      </header>
      <main className="flex-1 px-5 pt-8 pb-16 sm:px-8 sm:pt-12">
        <div className={`mx-auto w-full ${wide ? "max-w-5xl" : "max-w-3xl"}`}>{children}</div>
      </main>
    </div>
  );
}

export function PageIntro({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="text-sm font-bold text-brand-600">{eyebrow}</p>}
      <h1 className="mt-1 text-h2 font-bold text-ink-900 sm:text-h1">{title}</h1>
      {children && <div className="mt-3 max-w-2xl text-ink-600">{children}</div>}
    </div>
  );
}

export function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="space-y-6">
      <div className="h-10 w-2/3 animate-pulse rounded-control bg-ink-200" />
      <div className="h-64 animate-pulse rounded-panel bg-white ring-1 ring-ink-200" />
      <div className="h-48 animate-pulse rounded-panel bg-white ring-1 ring-ink-200" />
    </div>
  );
}

const STATUS: Record<string, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "bg-ink-100 text-ink-700" },
  pending_approval: { label: "Em revisão", className: "bg-warning-500/15 text-ink-800" },
  active: { label: "No ar", className: "bg-mint-100 text-mint-700" },
  paused: { label: "Pausado", className: "bg-ink-100 text-ink-600" },
};

export function StatusChip({ status }: { status: string }) {
  const item = STATUS[status] ?? STATUS.draft;
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${item.className}`}>{item.label}</span>;
}
