import { CookiePreferencesButton } from "./cookie-consent";
import { ArrowRightIcon, Logo, buttonClasses } from "./ui";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-titulo" className="bg-white pb-20 sm:pb-24">
      <div className="container-page">
        <div className="relative isolate grid items-center gap-8 overflow-hidden rounded-panel bg-brand-600 p-8 text-white shadow-brand sm:p-12 lg:grid-cols-[1.4fr_auto] lg:gap-12 lg:p-16">
          {/* Grade decorativa à direita, desvanecendo para a esquerda */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-full bg-brand-500 [background-image:linear-gradient(to_right,var(--color-brand-600)_6px,transparent_6px),linear-gradient(to_bottom,var(--color-brand-600)_6px,transparent_6px)] [background-position:-3px_-3px] [background-size:30px_30px] [mask-image:linear-gradient(to_top,rgb(0_0_0/0.45),transparent_70%)] lg:w-[55%] lg:[mask-image:linear-gradient(to_left,rgb(0_0_0/0.55),transparent_85%)]"
          />
          <div className="flex flex-col gap-4">
            <p className="inline-flex items-center text-xs font-bold tracking-wider text-brand-100 uppercase">
              <span aria-hidden className="mr-2 size-2 shrink-0 rounded-full bg-mint-400" />
              Para quem tem sala
            </p>
            <h2 id="cta-titulo" className="max-w-[22ch] text-h2 font-bold text-balance">
              Sua sala fica vazia em algum turno?
            </h2>
            <p className="max-w-[52ch] text-lg text-brand-100">
              Anuncie grátis na Subleasy. Profissionais da sua região falam
              direto com você pelo WhatsApp.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a href="/anunciar" className={buttonClasses("inverse", "lg")}>
              Anunciar minha sala grátis
              <ArrowRightIcon />
            </a>
            <a
              href="#buscar"
              className="focus-ring inline-flex h-12 items-center justify-center rounded-control px-5 text-base font-bold text-white ring-1 ring-white/30 transition-colors hover:bg-white/10 sm:h-13 sm:px-6"
            >
              Procurar uma sala
            </a>
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
      { href: "/quanto-cobrar-sublocacao-consultorio", label: "Quanto cobrar pela sala" },
      { href: "#painel", label: "Painel do anunciante" },
    ],
  },
  {
    title: "Profissionais",
    links: [
      { href: "/espacos?local=Maring%C3%A1", label: "Salas em Maringá" },
      { href: "/espacos?tipo=psicologia&local=Maring%C3%A1", label: "Salas para psicólogos" },
      { href: "/blog/", label: "Blog" },
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
      <div className="container-page flex flex-wrap items-center justify-between gap-x-6 border-t border-ink-200 py-3 text-sm text-ink-500">
        <span>© 2026 Subleasy</span>
        <CookiePreferencesButton />
      </div>
    </footer>
  );
}
