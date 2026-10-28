import Image from "next/image";
import { ArrowRightIcon, Logo, buttonClasses } from "./ui";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-titulo" className="bg-white pb-20 sm:pb-24">
      <div className="container-page">
        <div className="grid overflow-hidden rounded-panel bg-brand-600 text-white lg:grid-cols-[1.3fr_1fr]">
          <div className="p-8 sm:p-12">
            <h2
              id="cta-titulo"
              className="text-h1 font-bold"
            >
              Tem horários vagos na sua sala?
            </h2>
            <p className="mt-4 max-w-md text-lg text-brand-100">
              Publique em 3 minutos e comece a receber contatos de profissionais
              da sua cidade. Grátis e sem comissão.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/anunciar" className={buttonClasses("inverse", "lg")}>
                Anunciar minha sala grátis
                <ArrowRightIcon />
              </a>
              <a
                href="#buscar"
                className="focus-ring inline-flex h-12 items-center justify-center rounded-control px-5 text-base font-bold text-white ring-1 ring-white/30 transition-colors hover:bg-white/10 sm:h-13 sm:px-6"
              >
                Procuro uma sala
              </a>
            </div>
          </div>
          <div className="relative hidden min-h-72 lg:block">
            <Image
              src="/salas/psicologa-sublocacao-sala.webp"
              alt="Psicóloga sorrindo com uma prancheta em uma sala de atendimento"
              fill
              sizes="(max-width: 1024px) 0px, 40vw"
              className="object-cover object-[60%_20%]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

const FOOTER_LINKS = [
  {
    title: "Anunciantes",
    links: [
      { href: "/anunciar", label: "Anunciar sala" },
      { href: "/como-funciona", label: "Como funciona" },
      { href: "#painel", label: "Painel do anunciante" },
    ],
  },
  {
    title: "Profissionais",
    links: [
      { href: "/espacos?local=Maring%C3%A1", label: "Salas em Maringá" },
      { href: "/espacos?tipo=psicologia&local=Maring%C3%A1", label: "Salas para psicólogos" },
      { href: "https://blog.subleasy.com.br", label: "Blog" },
    ],
  },
  {
    title: "Subleasy",
    links: [
      { href: "#perguntas", label: "Perguntas frequentes" },
      { href: "/termos", label: "Termos de uso" },
      { href: "/privacidade", label: "Política de privacidade" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-200 bg-ink-50">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-ink-600">
            Sublocação de consultórios, salas terapêuticas e espaços de
            bem-estar por hora, turno ou mês.
          </p>
        </div>
        {FOOTER_LINKS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="text-sm font-bold text-ink-900">{group.title}</p>
            <ul className="mt-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="focus-ring inline-flex min-h-11 items-center rounded-control text-sm text-ink-600 hover:text-ink-900"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="container-page border-t border-ink-200 py-6 text-sm text-ink-500">
        © 2026 Subleasy
      </div>
    </footer>
  );
}
