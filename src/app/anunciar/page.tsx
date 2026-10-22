import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  PencilSimpleLineIcon,
  SparkleIcon,
} from "@phosphor-icons/react/ssr";
import { ListingComposer } from "@/components/listing-composer";
import { Logo, buttonClasses } from "@/components/ui";

export const metadata: Metadata = {
  title: "Anunciar sala com IA",
  description:
    "Descreva seu consultório ou sala do seu jeito e a IA monta o anúncio: tipo, local, preço e turnos livres. Grátis e sem comissão.",
  alternates: { canonical: "/anunciar" },
};

const STEPS = [
  {
    icon: PencilSimpleLineIcon,
    title: "Você descreve",
    text: "Em poucas linhas, do seu jeito.",
  },
  {
    icon: SparkleIcon,
    title: "A IA organiza",
    text: "Tipo, local, preço e turnos viram campos.",
  },
  {
    icon: CheckCircleIcon,
    title: "Você revisa e publica",
    text: "Nada vai ao ar sem sua aprovação.",
  },
];

export default function AnunciarPage() {
  return (
    <>
      <header className="relative z-10">
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

      <main className="relative isolate flex-1 overflow-hidden">
        <Backdrop />

        <div className="mx-auto w-full max-w-3xl px-5 pt-10 pb-20 sm:px-8 sm:pt-16 lg:pt-20">
          <p className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-ink-200 bg-white/80 py-1 pr-3 pl-1 text-sm text-ink-700 shadow-xs backdrop-blur-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-mint-400 px-2 py-0.5 text-xs font-bold text-brand-900">
              <SparkleIcon className="size-3.5" weight="fill" aria-hidden />
              IA
            </span>
            Anunciar é grátis e sem comissão
          </p>

          <h1 className="mt-5 animate-fade-up text-[2.25rem] leading-[1.08] font-bold tracking-[-0.02em] text-ink-900 [animation-delay:80ms] sm:text-h1 lg:text-display">
            Descreva sua sala.{" "}
            <span className="bg-[linear-gradient(100deg,var(--color-brand-600),var(--color-brand-400)_55%,var(--color-mint-500))] bg-clip-text text-transparent">
              A{"\u00a0"}IA monta o anúncio.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl animate-fade-up text-lg leading-relaxed text-ink-600 [animation-delay:160ms]">
            Escreva como numa mensagem para um colega: que sala é, onde fica, quanto custa e
            quando está livre. A IA separa tudo em campos e você revisa antes de publicar.
          </p>

          <div className="mt-10">
            <ListingComposer />
          </div>

          <ol className="mt-16 grid animate-fade-up gap-6 border-t border-ink-200 pt-10 [animation-delay:400ms] sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="flex gap-3 sm:flex-col">
                <span className="grid size-10 shrink-0 place-items-center rounded-card bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                  <Icon className="size-5" weight="duotone" aria-hidden />
                </span>
                <div>
                  <p className="text-xs text-ink-500 tabular-nums">Passo {index + 1}</p>
                  <p className="font-bold text-ink-900">{title}</p>
                  <p className="mt-0.5 text-sm text-ink-600">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </>
  );
}

/** Grade da agenda ao fundo e duas auroras lentas, roxo e menta. */
function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div
        className="absolute inset-0 [mask-image:radial-gradient(ellipse_80%_55%_at_50%_0%,black,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-ink-200) 1px, transparent 1px), linear-gradient(to bottom, var(--color-ink-200) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute -top-40 left-1/2 h-[36rem] w-[52rem] -translate-x-1/2">
        <div className="absolute top-0 left-0 size-[26rem] animate-aurora rounded-full bg-brand-400/25 blur-[100px]" />
        <div className="absolute top-24 right-0 size-[22rem] animate-aurora rounded-full bg-mint-400/25 blur-[100px] [animation-delay:-10s]" />
      </div>
    </div>
  );
}
