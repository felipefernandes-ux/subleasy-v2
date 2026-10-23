import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { TERMS_UPDATED_LABEL, isPlaceholder } from "@/lib/legal";
import { SiteFooter } from "./site-footer";
import { Logo, buttonClasses } from "./ui";

/** Moldura dos textos legais: leitura longa, coluna estreita, resumo no topo. */
export function LegalPage({
  title,
  summary,
  children,
}: {
  title: string;
  summary: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <header className="border-b border-ink-200">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/" aria-label="Subleasy, página inicial" className="focus-ring rounded-control">
            <Logo />
          </Link>
          <Link href="/" className={buttonClasses("ghost")}>
            <ArrowLeftIcon className="size-4" aria-hidden />
            Voltar ao início
          </Link>
        </div>
      </header>
      <main className="flex-1 px-5 pt-12 pb-24 sm:px-8 sm:pt-16">
        <article className="mx-auto max-w-[42rem]">
          <h1 className="text-h1 font-bold text-ink-900">{title}</h1>
          <p className="mt-3 text-sm text-ink-500">Última atualização: {TERMS_UPDATED_LABEL}</p>

          <aside className="mt-8 rounded-card bg-brand-50 p-5 ring-1 ring-brand-100 sm:p-6">
            <h2 className="font-bold text-brand-900">Resumo</h2>
            <div className="mt-3 space-y-2 text-ink-700 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1">
              {summary}
            </div>
            <p className="mt-4 text-sm text-ink-600">
              O resumo ajuda a leitura. O que vale é o texto completo abaixo.
            </p>
          </aside>

          <div className="mt-4 text-ink-700 [&_a]:font-bold [&_a]:text-brand-600 [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-12 [&_h2]:scroll-mt-8 [&_h2]:text-h3 [&_h2]:font-bold [&_h2]:text-ink-900 [&_h3]:mt-6 [&_h3]:font-bold [&_h3]:text-ink-900 [&_li]:mt-2 [&_li]:pl-1 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-4 [&_p]:leading-relaxed [&_strong]:text-ink-900 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5">
            {children}
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

/** Mostra um dado do responsável; destaca em amarelo enquanto não for preenchido. */
export function Fill({ value }: { value: string }) {
  if (!isPlaceholder(value)) return <>{value}</>;
  return <mark className="rounded-sm bg-warning-500/25 px-1 text-ink-900">{value}</mark>;
}
