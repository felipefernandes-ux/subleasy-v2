import Link from "next/link";
import { AccountMenu } from "./account-menu";
import { SearchNavMenu } from "./search-nav-menu";
import { Logo, buttonClasses } from "./ui";

// "Buscar salas" vem antes, com o menu dos tipos de sala (SearchNavMenu).
const NAV = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/sobre", label: "Sobre" },
  { href: "/#perguntas", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/80 bg-white/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="Subleasy, página inicial" className="focus-ring rounded-control">
          <Logo />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
          <SearchNavMenu />
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="focus-ring rounded-control px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href="/anunciar" className={buttonClasses("primary")}>
            Anunciar grátis
          </a>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
