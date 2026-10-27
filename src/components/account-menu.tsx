"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BellIcon, ChartLineUpIcon, GearSixIcon, HeartIcon, ListIcon, SignOutIcon, SquaresFourIcon } from "@phosphor-icons/react";
import { signOut } from "@/app/actions/auth";
import { PROFILE_CHANGED_EVENT } from "@/lib/public-profile";
import { createClient } from "@/lib/supabase/client";
import { ProfileAvatar } from "./profile-avatar";
import { buttonClasses } from "./ui";

type Account = { name: string; email: string; avatarPath: string | null };

/**
 * Entrar, para quem não está logado; menu da conta, para quem está.
 * As páginas públicas ficam em cache no servidor, então a sessão é lida aqui, no navegador.
 */
export function AccountMenu({ showSignIn = true }: { showSignIn?: boolean }) {
  // undefined: ainda conferindo; null: sem sessão.
  const [account, setAccount] = useState<Account | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) return setAccount(null);
      const { data: profile } = await supabase.from("profiles").select("display_name, avatar_path").eq("id", user.id).maybeSingle();
      if (active) setAccount({ name: profile?.display_name ?? user.email ?? "", email: user.email ?? "", avatarPath: profile?.avatar_path ?? null });
    }

    load();
    // Entrar ou sair em outra aba (ou pelo modal de favoritos) atualiza o cabeçalho.
    const { data } = supabase.auth.onAuthStateChange(() => load());
    // Foto trocada nas configurações aparece no menu sem recarregar a página.
    window.addEventListener(PROFILE_CHANGED_EVENT, load);
    return () => {
      active = false;
      data.subscription.unsubscribe();
      window.removeEventListener(PROFILE_CHANGED_EVENT, load);
    };
  }, []);

  // Reserva o espaço do botão enquanto confere a sessão, para o cabeçalho não pular.
  if (account === undefined) return <span className="h-11 w-20" aria-hidden />;
  if (account === null) {
    return showSignIn ? (
      // No celular (abaixo de sm) o cabeçalho não tem "Entrar": o acesso fica em Menu > Minha conta.
      <a href="/entrar" className={`${buttonClasses("ghost")} max-sm:hidden`}>
        Entrar
      </a>
    ) : null;
  }
  return <Menu account={account} />;
}

function Menu({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstName = account.name.split(" ")[0] || account.email;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onClick = (event: MouseEvent) => !rootRef.current?.contains(event.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    rootRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // Setas para cima e para baixo percorrem as opções.
  function onMenuKey(event: React.KeyboardEvent) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const options = [...(rootRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    const index = options.indexOf(document.activeElement as HTMLElement);
    options[(index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length]?.focus();
  }

  return (
    <div ref={rootRef} className="relative">
      {/* Como no Airbnb: menu e avatar no mesmo botão. */}
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menu da conta de ${firstName}`}
        onClick={() => setOpen((current) => !current)}
        className={`focus-ring flex h-11 items-center gap-2.5 rounded-full py-1 pr-1 pl-3.5 ring-1 ring-ink-300 transition-shadow hover:shadow-raised ${open ? "shadow-raised" : ""}`}
      >
        <ListIcon className="size-4.5 text-ink-700" weight="bold" aria-hidden />
        <ProfileAvatar name={firstName} path={account.avatarPath} size={32} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Conta"
          onKeyDown={onMenuKey}
          className="absolute top-full right-0 z-50 mt-2 w-64 animate-fade-up rounded-card bg-white py-2 shadow-raised ring-1 ring-ink-900/8 [animation-duration:0.2s]"
        >
          <div className="border-b border-ink-200 px-4 pt-1 pb-3">
            <p className="truncate font-bold text-ink-900">{account.name || firstName}</p>
            <p className="truncate text-sm text-ink-500">{account.email}</p>
          </div>
          <div className="py-1.5">
            <Item href="/painel" icon={<ChartLineUpIcon className="size-5" aria-hidden />} onSelect={() => setOpen(false)}>
              Painel
            </Item>
            <Item href="/painel/anuncios" icon={<SquaresFourIcon className="size-5" aria-hidden />} onSelect={() => setOpen(false)}>
              Meus anúncios
            </Item>
            <Item href="/favoritos" icon={<HeartIcon className="size-5" aria-hidden />} onSelect={() => setOpen(false)}>
              Favoritos
            </Item>
            <Item href="/configuracoes/notificacoes" icon={<BellIcon className="size-5" aria-hidden />} onSelect={() => setOpen(false)}>
              Notificações
            </Item>
            <Item href="/configuracoes/informacoes-pessoais" icon={<GearSixIcon className="size-5" aria-hidden />} onSelect={() => setOpen(false)}>
              Configurações
            </Item>
          </div>
          <form action={signOut} className="border-t border-ink-200 pt-1.5">
            <button type="submit" role="menuitem" tabIndex={-1} className={ITEM}>
              <SignOutIcon className="size-5" aria-hidden />
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const ITEM = "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink-800 outline-none transition-colors hover:bg-ink-100 focus-visible:bg-ink-100";

function Item({ href, icon, onSelect, children }: { href: string; icon: ReactNode; onSelect: () => void; children: ReactNode }) {
  return (
    <Link href={href} role="menuitem" tabIndex={-1} onClick={onSelect} className={ITEM}>
      <span className="text-ink-600">{icon}</span>
      {children}
    </Link>
  );
}
