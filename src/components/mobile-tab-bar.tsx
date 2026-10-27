"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowSquareOutIcon,
  CaretRightIcon,
  GearSixIcon,
  HeartIcon,
  HouseIcon,
  ListIcon,
  MagnifyingGlassIcon,
  SignOutIcon,
  SquaresFourIcon,
  UserIcon,
  UserPlusIcon,
  XIcon,
  type Icon,
} from "@phosphor-icons/react";
import { signOut } from "@/app/actions/auth";
import { useSignedIn } from "@/lib/use-signed-in";
import { AnnounceAiIcon } from "./announce-ai-icon";
import { Logo, buttonClasses } from "./ui";

// Páginas de navegação, públicas e da área logada (painel e configurações), onde a barra aparece.
// Ficam de fora as que já têm uma barra fixa própria (a página do anúncio tem a de contato; o editor
// de anúncio tem a de salvar), os fluxos de formulário (anunciar, entrar, cadastro) e o Super Admin.
const TAB_BAR_ROUTES = ["/salas", "/favoritos", "/como-funciona", "/u", "/painel", "/configuracoes"];
const TAB_BAR_HIDDEN = [/^\/painel\/anuncios\/[^/]+\/editar/];

/** Mostra a barra só nas rotas de TAB_BAR_ROUTES e na home. Vive no layout raiz, então não some ao navegar. */
export function TabBarGate() {
  const pathname = usePathname();
  const show =
    (pathname === "/" || TAB_BAR_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) &&
    !TAB_BAR_HIDDEN.some((pattern) => pattern.test(pathname));
  if (!show) return null;
  return (
    <>
      <TabBarSpacer />
      <MobileTabBar />
    </>
  );
}

/**
 * Barra de abas fixa na base, como a do iPhone, só no celular e no tablet. Cinco destinos:
 * Home, Buscar, Anunciar, Favoritos e Menu (que abre o painel em tela cheia com o resto).
 * Quem usa precisa deixar espaço no fim da página: veja TabBarSpacer.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  // undefined: ainda conferindo; false: sem sessão. Lida ao montar, para o menu já abrir certo.
  const signedIn = useSignedIn();
  const is = (prefix: string) => (prefix === "/" ? pathname === "/" : pathname.startsWith(prefix));

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
          <Tab href="/" label="Home" active={is("/")} icon={HouseIcon} />
          <Tab href="/salas" label="Buscar" active={is("/salas")} icon={MagnifyingGlassIcon} />
          {/* Anunciar: o ícone com a estrela avisa que a IA escreve o anúncio. */}
          <Tab href="/anunciar" label="Anunciar" hint="com IA" active={is("/anunciar")} icon={AnnounceAiIcon} />
          <Tab href="/favoritos" label="Favoritos" active={is("/favoritos")} icon={HeartIcon} />
          <li>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              className={`${TAB} w-full ${menuOpen ? "text-brand-600" : "text-ink-600"}`}
            >
              <ListIcon className="size-6" weight={menuOpen ? "bold" : "regular"} aria-hidden />
              <span>Menu</span>
            </button>
          </li>
        </ul>
      </nav>

      <MenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} signedIn={signedIn} />
    </>
  );
}

/** Reserva o espaço da barra no fim da página, para ela não cobrir o rodapé. */
export function TabBarSpacer() {
  return <div aria-hidden className="h-[calc(4rem+env(safe-area-inset-bottom))] lg:hidden" />;
}

const TAB =
  "focus-ring flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] leading-none font-semibold tracking-normal transition-colors";

type TabIcon = Icon | ((props: { active?: boolean; className?: string }) => ReactNode);

function Tab({ href, label, hint, active, icon: IconComponent }: { href: string; label: string; hint?: string; active: boolean; icon: TabIcon }) {
  return (
    <li>
      <Link href={href} aria-current={active ? "page" : undefined} className={`${TAB} ${active ? "text-brand-600" : "text-ink-600"}`}>
        {/* Os ícones do Phosphor mudam de peso; o de Anunciar recebe "active". */}
        <IconComponent className="size-6" {...(IconComponent === AnnounceAiIcon ? { active } : { weight: active ? "fill" : "regular", "aria-hidden": true })} />
        <span>{label}</span>
        {hint && <span className="sr-only"> {hint}</span>}
      </Link>
    </li>
  );
}

const NAV_LINKS = [
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/#perguntas", label: "Perguntas frequentes" },
];

/**
 * Menu em tela cheia (altura total), aberto pela aba Menu. É um <dialog>: foco preso, Esc fecha.
 * Movimento: o painel entra da esquerda com fade; os itens vêm um a um logo depois; a estrela de IA
 * do botão Anunciar acende uma vez. Ao fechar, o painel sai pelo mesmo lado, mais rápido.
 * Com prefers-reduced-motion, tudo vira um fade curto (regra em globals.css).
 */
function MenuPanel({ open, onClose, signedIn }: { open: boolean; onClose: () => void; signedIn: boolean | undefined }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setClosing(false);
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    }
  }, [open]);

  // Pede para fechar: toca a animação de saída e só então fecha o <dialog>.
  const requestClose = () => {
    if (ref.current?.open) setClosing(true);
  };

  const finishClose = () => {
    ref.current?.close();
    document.documentElement.style.overflow = "";
    setClosing(false);
    onClose();
  };

  // Entrada escalonada: o painel chega primeiro (≈0,12s), depois um item a cada 45ms.
  const stagger = (index: number): CSSProperties => ({ animationDelay: `${0.12 + index * 0.045}s` });
  const item = closing ? "" : "menu-item animate-item-in";

  return (
    <dialog
      ref={ref}
      aria-label="Menu"
      data-closing={closing || undefined}
      onCancel={(event) => {
        // Esc: em vez do fechamento seco do navegador, usa a animação de saída.
        event.preventDefault();
        requestClose();
      }}
      onAnimationEnd={(event) => {
        if (closing && event.target === ref.current) finishClose();
      }}
      className={`menu-panel m-0 h-dvh max-h-none w-full max-w-none bg-white p-0 text-ink-900 shadow-raised backdrop:bg-ink-900/40 sm:max-w-sm ${
        closing ? "animate-drawer-out backdrop:animate-veil-out" : "open:animate-drawer-in backdrop:animate-veil-in"
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-200 pr-2 pl-5">
          <Logo className="h-6 w-auto" />
          <button
            type="button"
            onClick={requestClose}
            aria-label="Fechar menu"
            className="focus-ring grid size-11 place-items-center rounded-full text-ink-800 transition-colors hover:bg-ink-100 active:bg-ink-100"
          >
            <XIcon className="size-5" weight="bold" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {/* CTA primário: o mesmo ícone de IA da aba Anunciar, com a estrela em menta sobre o roxo. */}
          <div className={item} style={stagger(0)}>
            <Link href="/anunciar" onClick={requestClose} className={`${buttonClasses("primary", "lg")} w-full`}>
              <AnnounceAiIcon className="size-7 text-white" sparkle="var(--color-mint-400)" halo="var(--color-brand-600)" animateSpark={!closing} />
              Anunciar
              <span className="sr-only"> com IA</span>
            </Link>
          </div>

          <ul className="mt-3">
            {NAV_LINKS.map((link, index) => (
              <li key={link.href} className={item} style={stagger(index + 1)}>
                <Row href={link.href} onNavigate={requestClose}>
                  {link.label}
                </Row>
              </li>
            ))}
            <li className={item} style={stagger(NAV_LINKS.length + 1)}>
              <Row href="https://blog.subleasy.com.br/" newTab onNavigate={requestClose}>
                Blog
              </Row>
            </li>
          </ul>

          <ul className={`mt-3 border-t border-ink-200 pt-3 ${item}`} style={stagger(NAV_LINKS.length + 2)}>
            <li>
              <Row href={signedIn ? "/painel" : "/entrar"} onNavigate={requestClose} icon={<UserIcon className="size-5 text-ink-600" weight="bold" aria-hidden />}>
                Minha conta
              </Row>
            </li>
            {signedIn === false && (
              <li>
                <Row href="/criar-conta" onNavigate={requestClose} icon={<UserPlusIcon className="size-5 text-ink-600" weight="bold" aria-hidden />}>
                  Criar conta
                </Row>
              </li>
            )}
            {signedIn && (
              <>
                <li>
                  <Row href="/painel/anuncios" onNavigate={requestClose} icon={<SquaresFourIcon className="size-5 text-ink-600" weight="bold" aria-hidden />}>
                    Meus anúncios
                  </Row>
                </li>
                <li>
                  <Row href="/configuracoes/informacoes-pessoais" onNavigate={requestClose} icon={<GearSixIcon className="size-5 text-ink-600" weight="bold" aria-hidden />}>
                    Configurações
                  </Row>
                </li>
                <li>
                  <form action={signOut}>
                    <button type="submit" className={ROW}>
                      <SignOutIcon className="size-5 text-ink-600" weight="bold" aria-hidden />
                      <span className="flex-1">Sair</span>
                    </button>
                  </form>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </dialog>
  );
}

const ROW =
  "focus-ring flex min-h-14 w-full items-center gap-3 rounded-control px-2 text-left text-lg font-semibold tracking-[-0.015em] text-ink-900 transition-colors active:bg-ink-100";

function Row({ href, children, icon, newTab, onNavigate }: { href: string; children: ReactNode; icon?: ReactNode; newTab?: boolean; onNavigate: () => void }) {
  return (
    <Link href={href} onClick={onNavigate} className={ROW} {...(newTab && { target: "_blank", rel: "noopener noreferrer" })}>
      {icon}
      <span className="flex-1">{children}</span>
      {newTab ? (
        <>
          <ArrowSquareOutIcon className="size-4 text-ink-400" aria-hidden />
          <span className="sr-only">(abre em nova aba)</span>
        </>
      ) : (
        <CaretRightIcon className="size-4 text-ink-400" weight="bold" aria-hidden />
      )}
    </Link>
  );
}
