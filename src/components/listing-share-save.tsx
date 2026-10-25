"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import {
  ChatCircleDotsIcon,
  CheckIcon,
  CircleNotchIcon,
  CopyIcon,
  DotsThreeOutlineIcon,
  EnvelopeSimpleIcon,
  FacebookLogoIcon,
  HeartIcon,
  ImageIcon,
  LinkedinLogoIcon,
  PlusIcon,
  ShareNetworkIcon,
  TelegramLogoIcon,
  WhatsappLogoIcon,
  XIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { createFavoriteList, getFavoriteState, toggleFavorite, type FavoriteList, type FavoriteState } from "@/app/actions/favorites";
import { AuthForm } from "./auth-form";
import { buttonClasses } from "./ui";

type Shared = { id: string; title: string; subtitle: string; cover: string | null };

const TOP_BUTTON =
  "focus-ring inline-flex h-9 items-center gap-2 rounded-control px-3 text-sm font-bold text-ink-900 transition-colors hover:bg-ink-100";

/** Compartilhar e Salvar no topo do anúncio, como no Airbnb. */
export function ListingShareSave({ listing }: { listing: Shared }) {
  const shareRef = useRef<HTMLDialogElement>(null);
  const saveRef = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<FavoriteState | null>(null);
  const [canShare, setCanShare] = useState(false);
  const saved = state?.loggedIn && state.lists.some((list) => list.hasListing);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // O coração já aparece cheio para quem salvou antes. A página fica em cache, então a consulta é daqui.
  useEffect(() => {
    let active = true;
    getFavoriteState(listing.id).then((next) => {
      if (!active) return;
      setState(next);
      // Voltou do login para salvar: abre a escolha de lista e limpa o ?salvar da URL.
      if (next.loggedIn && params.get("salvar")) {
        saveRef.current?.showModal();
        router.replace(pathname, { scroll: false });
      }
    });
    return () => {
      active = false;
    };
  }, [listing.id, params, pathname, router]);

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => {
          setCanShare(typeof navigator.share === "function");
          shareRef.current?.showModal();
        }}
        className={TOP_BUTTON}
      >
        <ShareNetworkIcon className="size-4.5" aria-hidden />
        Compartilhar
      </button>
      <button type="button" onClick={() => saveRef.current?.showModal()} aria-pressed={Boolean(saved)} className={TOP_BUTTON}>
        <HeartIcon className={`size-4.5 ${saved ? "text-danger-600" : ""}`} weight={saved ? "fill" : "regular"} aria-hidden />
        {saved ? "Salvo" : "Salvar"}
      </button>

      <ShareDialog dialogRef={shareRef} listing={listing} canShare={canShare} />
      <Modal dialogRef={saveRef} title={state?.loggedIn ? "Salvar em uma lista" : "Entre para salvar"} wide={!state?.loggedIn}>
        {state === null ? (
          <div className="grid h-32 place-items-center">
            <CircleNotchIcon className="size-6 animate-spin text-brand-600" aria-hidden />
          </div>
        ) : state.loggedIn ? (
          <SaveLists listingId={listing.id} lists={state.lists} onChange={setState} />
        ) : (
          // Login no próprio modal; o link do e-mail e o Google trazem a pessoa de volta para salvar.
          <div className="[&_h1]:sr-only [&_h1+p]:hidden [&_form]:first-of-type:mt-6">
            <p className="text-center text-ink-600">Entre para guardar salas em listas e voltar a elas quando quiser.</p>
            <AuthForm mode="signin" next={`${pathname}?salvar=1`} />
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── Compartilhar ───────────────────────────────────────────

function ShareDialog({ dialogRef, listing, canShare }: { dialogRef: React.RefObject<HTMLDialogElement | null>; listing: Shared; canShare: boolean }) {
  const [copied, setCopied] = useState(false);

  // O endereço vem da própria página, sem parâmetros de busca.
  const url = () => `${window.location.origin}${window.location.pathname}`;
  const text = `${listing.title} no Subleasy`;
  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");
  // E-mail e SMS abrem o app do sistema, na mesma aba.
  const launch = (href: string) => window.location.assign(href);

  const options: { label: string; icon: ReactNode; onClick: () => void }[] = [
    {
      label: copied ? "Link copiado" : "Copiar link",
      icon: copied ? <CheckIcon className="size-6 text-mint-700" weight="bold" aria-hidden /> : <CopyIcon className="size-6" aria-hidden />,
      onClick: async () => {
        await navigator.clipboard.writeText(url());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
    },
    { label: "E-mail", icon: <EnvelopeSimpleIcon className="size-6" aria-hidden />, onClick: () => launch(`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${listing.title}\n${url()}`)}`) },
    { label: "Mensagens", icon: <ChatCircleDotsIcon className="size-6" aria-hidden />, onClick: () => launch(`sms:?&body=${encodeURIComponent(`${text}: ${url()}`)}`) },
    { label: "WhatsApp", icon: <WhatsappLogoIcon className="size-6" aria-hidden />, onClick: () => open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url()}`)}`) },
    { label: "Facebook", icon: <FacebookLogoIcon className="size-6" aria-hidden />, onClick: () => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`) },
    { label: "X", icon: <XLogoIcon className="size-6" aria-hidden />, onClick: () => open(`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url())}`) },
    { label: "LinkedIn", icon: <LinkedinLogoIcon className="size-6" aria-hidden />, onClick: () => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url())}`) },
    { label: "Telegram", icon: <TelegramLogoIcon className="size-6" aria-hidden />, onClick: () => open(`https://t.me/share/url?url=${encodeURIComponent(url())}&text=${encodeURIComponent(text)}`) },
  ];
  // "Mais opções" usa o compartilhamento do sistema (celular), quando existe.
  if (canShare) {
    options.push({
      label: "Mais opções",
      icon: <DotsThreeOutlineIcon className="size-6" aria-hidden />,
      onClick: () => navigator.share({ title: listing.title, text, url: url() }).catch(() => {}),
    });
  }

  return (
    <Modal dialogRef={dialogRef} title="Compartilhe esta sala">
      <div className="flex items-center gap-4">
        <Thumb src={listing.cover} />
        <div className="min-w-0">
          <p className="truncate font-bold text-ink-900">{listing.title}</p>
          <p className="truncate text-sm text-ink-600">{listing.subtitle}</p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={option.onClick}
            className="focus-ring flex h-16 items-center gap-3 rounded-card px-4 text-left font-bold text-ink-900 ring-1 ring-ink-300 transition-colors hover:bg-ink-50"
          >
            {option.icon}
            <span aria-live={option.label.startsWith("Link") || option.label.startsWith("Copiar") ? "polite" : undefined}>{option.label}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

// ── Salvar ─────────────────────────────────────────────────

function SaveLists({ listingId, lists, onChange }: { listingId: string; lists: FavoriteList[]; onChange: (state: FavoriteState) => void }) {
  const [creating, setCreating] = useState(lists.length === 0);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Última lista em que a sala entrou: mostra o atalho para ver a lista.
  const [savedIn, setSavedIn] = useState<{ id: string; name: string } | null>(null);

  if (creating) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await createFavoriteList(name, listingId);
            if ("error" in result) return setError(result.error);
            onChange(result);
            // A lista nova é a mais recente: vem primeiro.
            if (result.loggedIn && result.lists[0]) setSavedIn({ id: result.lists[0].id, name: result.lists[0].name });
            setCreating(false);
            setName("");
          });
        }}
      >
        <p className="text-sm text-ink-600">{lists.length === 0 ? "Você ainda não tem listas. Crie a primeira e a sala já entra nela." : "A sala entra na lista nova."}</p>
        <label className="mt-4 block text-sm font-bold text-ink-800">
          Nome da lista
          <input
            autoFocus
            value={name}
            maxLength={50}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Salas na Zona 7"
            className="mt-2 h-12 w-full rounded-control border border-ink-300 bg-white px-4 text-base font-normal text-ink-900 shadow-xs outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15"
          />
        </label>
        <p className="mt-1.5 text-right text-xs text-ink-500 tabular-nums">{name.length}/50</p>
        {error && (
          <p role="alert" className="mt-2 text-sm text-danger-600">
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          {lists.length > 0 && (
            <button type="button" onClick={() => setCreating(false)} className={buttonClasses("ghost")}>
              Voltar
            </button>
          )}
          <button type="submit" disabled={!name.trim() || isPending} className={`${buttonClasses("primary")} disabled:opacity-50`}>
            {isPending && <CircleNotchIcon className="size-4 animate-spin" weight="bold" aria-hidden />}
            Criar e salvar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <ul className="grid grid-cols-2 gap-4">
        {lists.map((list) => (
          <li key={list.id}>
            <button
              type="button"
              aria-pressed={list.hasListing}
              disabled={pendingId === list.id}
              onClick={() => {
                setPendingId(list.id);
                startTransition(async () => {
                  const next = await toggleFavorite(list.id, listingId);
                  onChange(next);
                  const added = next.loggedIn && next.lists.find((item) => item.id === list.id)?.hasListing;
                  setSavedIn(added ? { id: list.id, name: list.name } : null);
                  setPendingId(null);
                });
              }}
              className="group focus-ring block w-full rounded-card text-left"
            >
              <span className="relative block">
                <Thumb src={list.cover} large />
                <span
                  className={`absolute top-2 right-2 grid size-8 place-items-center rounded-full shadow-xs ${list.hasListing ? "bg-white text-danger-600" : "bg-white/90 text-ink-700"}`}
                  aria-hidden
                >
                  {pendingId === list.id ? (
                    <CircleNotchIcon className="size-4 animate-spin" weight="bold" />
                  ) : (
                    <HeartIcon className="size-4.5" weight={list.hasListing ? "fill" : "regular"} />
                  )}
                </span>
              </span>
              <span className="mt-2 block truncate font-bold text-ink-900 group-hover:text-brand-700">{list.name}</span>
              <span className="block text-sm text-ink-600">
                {list.count} {list.count === 1 ? "sala salva" : "salas salvas"}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {savedIn && (
        <div role="status" className="mt-6 flex animate-fade-up items-center gap-3 rounded-card bg-mint-50 p-3 pl-4 ring-1 ring-mint-500/30 [animation-duration:0.3s]">
          <CheckIcon className="size-5 shrink-0 text-mint-700" weight="bold" aria-hidden />
          <p className="min-w-0 flex-1 truncate text-sm text-ink-800">
            Salvo em <strong className="font-bold text-ink-900">{savedIn.name}</strong>
          </p>
          <Link href={`/favoritos/${savedIn.id}`} className={buttonClasses("secondary", "sm")}>
            Ver lista
          </Link>
        </div>
      )}
      <button type="button" onClick={() => setCreating(true)} className={`${buttonClasses(savedIn ? "ghost" : "secondary")} mt-4 w-full`}>
        <PlusIcon className="size-4" weight="bold" aria-hidden />
        Criar nova lista
      </button>
    </div>
  );
}

// ── Peças ──────────────────────────────────────────────────

function Thumb({ src, large = false }: { src: string | null; large?: boolean }) {
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden bg-ink-100 ${large ? "aspect-square w-full rounded-card" : "size-16 rounded-control"}`}>
      {src ? <Image src={src} alt="" fill sizes={large ? "200px" : "64px"} className="object-cover" /> : <ImageIcon className="size-6 text-ink-400" aria-hidden />}
    </span>
  );
}

/** Modal centralizado no estilo do Airbnb: título no meio, X à esquerda, Esc e clique fora fecham. */
function Modal({
  dialogRef,
  title,
  wide = false,
  children,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  /** Login usa o modal mais estreito; listas e compartilhar, o mais largo. */
  wide?: boolean;
  children: ReactNode;
}) {
  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onClick={(event) => event.target === event.currentTarget && close()}
      className={`m-auto max-h-[calc(100dvh-2rem)] ${wide ? "w-[min(30rem,calc(100vw-2rem))]" : "w-[min(36rem,calc(100vw-2rem))]"} overflow-y-auto rounded-panel bg-white p-0 text-left text-ink-800 shadow-raised backdrop:bg-ink-900/60 open:animate-zoom-in`}
    >
      <div className="sticky top-0 z-10 grid grid-cols-[2.5rem_1fr_2.5rem] items-center border-b border-ink-200 bg-white px-4 py-3">
        <button type="button" onClick={close} aria-label="Fechar" className="focus-ring grid size-10 place-items-center rounded-full text-ink-700 hover:bg-ink-100">
          <XIcon className="size-5" aria-hidden />
        </button>
        <p className="text-center font-bold text-ink-900">{title}</p>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}
