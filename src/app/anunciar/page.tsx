import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { ListingComposer } from "@/components/listing-composer";
import { Logo, buttonClasses } from "@/components/ui";

export const metadata: Metadata = {
  title: "Anunciar sala com IA",
  description:
    "Descreva seu consultório ou sala do seu jeito e a IA monta o anúncio: tipo, local, preço e turnos livres. Grátis e sem comissão.",
  alternates: { canonical: "/anunciar" },
};

export default function AnunciarPage() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-ink-50">
      <Glow />

      <header>
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

      <main className="flex flex-1 flex-col justify-center px-5 pt-8 pb-24 sm:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="animate-fade-up text-center text-[1.625rem] leading-[1.15] font-bold tracking-[-0.02em] text-ink-900 sm:text-h1">
            Descreva sua sala.{" "}
            <span className="bg-[linear-gradient(100deg,var(--color-brand-600),var(--color-brand-400)_55%,var(--color-mint-500))] bg-clip-text text-transparent block">
              A{" "}IA monta o anúncio.
            </span>
          </h1>

          <div className="mt-7 sm:mt-10">
            <ListingComposer />
          </div>
        </div>
      </main>
    </div>
  );
}

/** Brilho difuso atrás do campo, só na cor primária, respirando devagar. */
function Glow() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 grid place-items-center">
      <div className="relative h-[40rem] w-[min(64rem,140vw)]">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,var(--color-brand-200),transparent)] blur-3xl" />
        <div className="absolute top-1/4 left-[12%] size-[28rem] animate-aurora rounded-full bg-brand-600/20 blur-[110px]" />
        <div className="absolute right-[10%] bottom-[12%] size-[24rem] animate-aurora rounded-full bg-brand-600/15 blur-[110px] [animation-delay:-10s]" />
      </div>
    </div>
  );
}
