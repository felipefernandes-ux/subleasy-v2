"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import {
  AddressBookIcon,
  BellIcon,
  BuildingsIcon,
  CaretRightIcon,
  HouseSimpleIcon,
  ListIcon,
  MagnifyingGlassIcon,
  UsersIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import { SoonBadge, cx } from "./ui";
import { HOME, NAV_GROUPS, findNav, isGroupSoon, isSoon, type NavGroup, type NavItem } from "./nav";

const rowClass = (active: boolean, muted?: boolean) =>
  cx(
    "flex h-8 items-center gap-2.5 rounded-sa-control px-2.5 text-sa-base transition-colors",
    active ? "bg-sa-haze font-semibold text-sa-ink" : "text-sa-body hover:bg-sa-paper",
    muted && !active && "text-sa-muted",
  );

/** Link de um item do flyout (e da lista do menu no celular). */
function SubLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate: () => void }) {
  const active = pathname === item.href;
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={rowClass(active, isSoon(item))}
    >
      <Icon className={cx("size-4 shrink-0", active ? "text-brand-600" : "text-sa-muted")} weight={active ? "fill" : "bold"} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {isSoon(item) && <SoonBadge />}
    </Link>
  );
}

function HomeLink({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  const active = pathname === HOME.href;
  const Icon = HOME.icon;
  return (
    <Link href={HOME.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={rowClass(active)}>
      <Icon className={cx("size-4 shrink-0", active ? "text-brand-600" : "text-sa-muted")} weight={active ? "fill" : "bold"} aria-hidden />
      <span className="flex-1">{HOME.label}</span>
    </Link>
  );
}

/**
 * Uma área do menu. Fica só o nome; as subpáginas abrem num flyout ao passar o mouse
 * ou ao focar com o teclado. No celular a navegação é a AdminTabBar.
 */
function GroupLink({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = pathname === group.href || pathname.startsWith(`${group.href}/`);
  const soon = isGroupSoon(group);
  const hasMenu = group.items.length > 1;
  const Icon = group.icon;

  const top = (
    <Link
      href={group.href}
      onClick={onNavigate}
      aria-current={pathname === group.href ? "page" : undefined}
      aria-haspopup={hasMenu ? "menu" : undefined}
      className={rowClass(active, soon)}
    >
      <Icon className={cx("size-4 shrink-0", active ? "text-brand-600" : "text-sa-muted")} weight={active ? "fill" : "bold"} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{group.label}</span>
      {soon && <SoonBadge />}
      {hasMenu && <CaretRightIcon className="size-3 shrink-0 text-sa-faint" aria-hidden />}
    </Link>
  );

  if (!hasMenu) return top;

  return (
    <div className="group/nav relative">
      {top}
      {/* pl-2 serve de ponte para o mouse não perder o hover entre o item e o painel. */}
      <div className="invisible absolute left-full top-0 z-50 pl-2 opacity-0 transition-opacity duration-100 group-focus-within/nav:visible group-focus-within/nav:opacity-100 group-hover/nav:visible group-hover/nav:opacity-100">
        <div role="menu" aria-label={group.label} className="w-60 space-y-0.5 rounded-sa-card bg-sa-canvas p-1.5 shadow-sa-raised ring-1 ring-sa-line">
          <p className="px-2.5 pb-1 pt-1.5 text-sa-xs text-sa-subtle">{group.label}</p>
          {group.items.map((item) => (
            <SubLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ footer }: { footer: ReactNode }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Super Admin" className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-4">
        <span className="grid size-7 place-items-center rounded-sa-control bg-brand-600 text-sa-sm font-semibold text-white">S</span>
        <span className="sa-display text-sa-lg">Subleasy</span>
        <span className="rounded-sa-badge bg-sa-haze px-1.5 text-sa-micro text-sa-body">Admin</span>
      </div>

      <div className="flex-1 space-y-0.5 px-3 pb-6 pt-2">
        <HomeLink pathname={pathname} onNavigate={() => {}} />
        {NAV_GROUPS.map((group) => (
          <GroupLink key={group.href} group={group} pathname={pathname} onNavigate={() => {}} />
        ))}
      </div>

      <div className="shrink-0 border-t border-sa-line p-3">{footer}</div>
    </nav>
  );
}

function Breadcrumb() {
  const pathname = usePathname();
  const found = findNav(pathname);
  const crumbs = [found?.group?.label, found?.item.label].filter(Boolean) as string[];
  const isDetail = found && (pathname.replace(/\/$/, "") || "/") !== found.item.href;
  return (
    <ol className="flex min-w-0 items-center gap-1.5 text-sa-sm text-sa-muted">
      <li>Admin</li>
      {crumbs.map((crumb, index) => (
        <li key={crumb} className="flex min-w-0 items-center gap-1.5">
          <CaretRightIcon className="size-3 shrink-0" aria-hidden />
          <span className={cx("truncate", index === crumbs.length - 1 && !isDetail && "font-semibold text-sa-ink")}>{crumb}</span>
        </li>
      ))}
      {isDetail && (
        <li className="flex items-center gap-1.5">
          <CaretRightIcon className="size-3 shrink-0" aria-hidden />
          <span className="font-semibold text-sa-ink">Detalhe</span>
        </li>
      )}
    </ol>
  );
}

/** Abas fixas da barra do celular; o resto das áreas fica na aba Menu. */
const TABS: { href: string; label: string; icon: Icon }[] = [
  { href: "/", label: "Início", icon: HouseSimpleIcon },
  { href: "/anuncios", label: "Anúncios", icon: BuildingsIcon },
  { href: "/usuarios", label: "Usuários", icon: UsersIcon },
  { href: "/leads", label: "Leads", icon: AddressBookIcon },
];
const TAB_HREFS = TABS.map((tab) => tab.href);
const MENU_GROUPS = NAV_GROUPS.filter((group) => !TAB_HREFS.includes(group.href));

const tabClass = (active: boolean) =>
  cx(
    "flex h-16 w-full flex-col items-center justify-center gap-1 text-[0.6875rem] leading-none font-semibold transition-colors",
    active ? "text-brand-600" : "text-sa-muted",
  );

/** Única navegação no celular e no tablet: Início, Anúncios, Usuários, Leads e Menu (o restante). */
function AdminTabBar({ footer }: { footer: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const is = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  // A aba Menu acende quando a página atual é de uma área que só existe nele.
  const inMenu = MENU_GROUPS.some((group) => is(group.href));

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <nav
        aria-label="Super Admin"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-sa-line bg-sa-canvas pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
          {TABS.map(({ href, label, icon: TabIcon }) => {
            const active = is(href) && !open;
            return (
              <li key={href}>
                <Link href={href} aria-current={is(href) ? "page" : undefined} className={tabClass(active)}>
                  <TabIcon className="size-6" weight={active ? "fill" : "regular"} aria-hidden />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-haspopup="dialog"
              aria-expanded={open}
              className={tabClass(open || inMenu)}
            >
              <ListIcon className="size-6" weight={open || inMenu ? "bold" : "regular"} aria-hidden />
              <span>Menu</span>
            </button>
          </li>
        </ul>
      </nav>

      {open && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-sa-ink/30" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label="Menu"
            className="absolute inset-x-0 bottom-0 flex max-h-[80dvh] flex-col rounded-t-sa-card bg-sa-canvas pb-[calc(4rem+env(safe-area-inset-bottom))] shadow-sa-raised"
          >
            <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
              {MENU_GROUPS.map((group) => (
                <section key={group.href}>
                  <p className="px-2.5 pb-1 text-sa-xs text-sa-subtle">{group.label}</p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <SubLink key={item.href} item={item} pathname={pathname} onNavigate={() => setOpen(false)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <div className="shrink-0 border-t border-sa-line p-3">{footer}</div>
          </div>
        </div>
      )}
    </>
  );
}

/** `footer` é o rodapé do menu (quem está logado), renderizado no servidor pelo layout. */
export function SuperAdminShell({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <div className="sa-root min-h-screen bg-sa-paper">
      {/* Sidebar fixa no desktop. Sem overflow, para o flyout poder sair da coluna. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 border-r border-sa-line bg-sa-canvas lg:block">
        <Suspense>
          <Sidebar footer={footer} />
        </Suspense>
      </aside>

      <AdminTabBar footer={footer} />

      <div className="lg:pl-56">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-sa-line bg-sa-canvas/90 px-4 backdrop-blur sm:px-6">
          <div className="min-w-0 flex-1">
            <Suspense>
              <Breadcrumb />
            </Suspense>
          </div>
          <label className="relative hidden w-72 md:block">
            <span className="sr-only">Buscar anúncio, usuário ou lead</span>
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sa-subtle" aria-hidden />
            <input type="search" placeholder="Buscar anúncio, usuário ou lead" className="sa-input h-8 pl-9 pr-12 text-sa-sm" />
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-sa-badge bg-sa-haze px-1.5 text-sa-micro text-sa-muted">⌘K</kbd>
          </label>
          <button
            type="button"
            aria-label="Notificações"
            className="grid size-9 place-items-center rounded-sa-control text-sa-body hover:bg-sa-haze"
          >
            <BellIcon className="size-[18px]" aria-hidden />
          </button>
        </header>

        <main className="mx-auto w-full max-w-sa-page px-4 py-8 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-8">{children}</main>
      </div>
    </div>
  );
}
