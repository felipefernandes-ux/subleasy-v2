"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import {
  ArrowClockwiseIcon,
  ArrowSquareOutIcon,
  CheckIcon,
  CircleNotchIcon,
  CopyIcon,
  DotsThreeIcon,
  PauseIcon,
  PencilSimpleIcon,
  PlayIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { deleteDraft, deleteListing, pauseListing, renewListing, resumeListing, type RemovalSurvey } from "@/app/actions/listing";
import type { Phase } from "@/lib/listing-options";
import { buttonClasses } from "./ui";

type ActionListing = { id: string; title: string; url: string; phase: Phase };

/**
 * Ações de um anúncio: um botão principal, que muda com o estado, e o resto num menu "…".
 * Excluir fica de propósito no fim do menu, separado das outras opções.
 */
export function ListingActions({ listing, className = "" }: { listing: ActionListing; className?: string }) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const deleteRef = useRef<HTMLDialogElement>(null);
  const draftRef = useRef<HTMLDialogElement>(null);
  const run = (action: (id: string) => Promise<void>) => startTransition(() => action(listing.id));
  const { phase } = listing;
  const spinner = <CircleNotchIcon className="size-4 animate-spin" weight="bold" aria-hidden />;

  const copy = async () => {
    await navigator.clipboard.writeText(listing.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const open = () => window.open(listing.url, "_blank", "noopener,noreferrer");
  const editHref = `/painel/anuncios/${listing.id}/editar`;
  const remove: MenuItem = { label: "Excluir", icon: <TrashIcon className="size-4" aria-hidden />, danger: true, onSelect: () => (phase === "draft" ? draftRef : deleteRef).current?.showModal() };

  // Botão principal e opções do menu, por estado.
  let primary: ReactNode = null;
  let items: MenuItem[] = [];
  if (phase === "draft") {
    primary = (
      <Link href={`/painel/anuncios/${listing.id}`} className={buttonClasses("primary", "sm")}>
        <PencilSimpleIcon className="size-4" aria-hidden />
        Continuar publicação
      </Link>
    );
    items = [remove];
  } else if (phase === "review") {
    items = [remove];
  } else if (phase === "live") {
    primary = (
      <button type="button" disabled={isPending} onClick={() => run(pauseListing)} className={`${buttonClasses("secondary", "sm")} disabled:opacity-60`}>
        {isPending ? spinner : <PauseIcon className="size-4" aria-hidden />}
        Pausar
      </button>
    );
    items = [
      { label: copied ? "Link copiado" : "Copiar link", icon: copied ? <CheckIcon className="size-4 text-mint-700" weight="bold" aria-hidden /> : <CopyIcon className="size-4" aria-hidden />, onSelect: copy, keepOpen: true },
      { label: "Ver anúncio", icon: <ArrowSquareOutIcon className="size-4" aria-hidden />, onSelect: open },
      { label: "Editar", icon: <PencilSimpleIcon className="size-4" aria-hidden />, href: editHref },
      remove,
    ];
  } else if (phase === "due" || phase === "over") {
    primary = (
      <button type="button" disabled={isPending} onClick={() => run(renewListing)} className={`${buttonClasses("primary", "sm")} disabled:opacity-70`}>
        {isPending ? spinner : <ArrowClockwiseIcon className="size-4" weight="bold" aria-hidden />}
        Renovar agora
      </button>
    );
    items = [
      ...(phase === "due"
        ? [
            { label: "Pausar", icon: <PauseIcon className="size-4" aria-hidden />, onSelect: () => run(pauseListing) },
            { label: copied ? "Link copiado" : "Copiar link", icon: copied ? <CheckIcon className="size-4 text-mint-700" weight="bold" aria-hidden /> : <CopyIcon className="size-4" aria-hidden />, onSelect: copy, keepOpen: true },
            { label: "Ver anúncio", icon: <ArrowSquareOutIcon className="size-4" aria-hidden />, onSelect: open },
          ]
        : []),
      { label: "Editar", icon: <PencilSimpleIcon className="size-4" aria-hidden />, href: editHref },
      remove,
    ];
  } else if (phase === "paused") {
    primary = (
      <button type="button" disabled={isPending} onClick={() => run(resumeListing)} className={`${buttonClasses("secondary", "sm")} disabled:opacity-60`}>
        {isPending ? spinner : <PlayIcon className="size-4" weight="fill" aria-hidden />}
        Reativar
      </button>
    );
    items = [{ label: "Editar", icon: <PencilSimpleIcon className="size-4" aria-hidden />, href: editHref }, remove];
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {primary}
      <Menu label={`Mais opções para ${listing.title}`} items={items} />
      <DeleteDialog dialogRef={deleteRef} listing={listing} canPause={phase === "live" || phase === "due"} />
      <DraftDialog dialogRef={draftRef} listing={listing} />
    </div>
  );
}

type MenuItem = {
  label: string;
  icon: ReactNode;
  onSelect?: () => void;
  href?: string;
  danger?: boolean;
  /** Mantém o menu aberto depois do clique, para mostrar a confirmação (ex.: link copiado). */
  keepOpen?: boolean;
};

/** Menu "…": abre abaixo do botão, fecha com Esc, clique fora ou ao escolher uma opção. */
function Menu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
    // Foco na primeira opção, para navegar pelo teclado.
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

  const danger = items.filter((item) => item.danger);
  const regular = items.filter((item) => !item.danger);
  const itemClass = (item: MenuItem) =>
    `flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left text-sm outline-none transition-colors focus-visible:bg-ink-100 ${
      item.danger ? "text-danger-600 hover:bg-danger-600/8 focus-visible:bg-danger-600/8" : "text-ink-800 hover:bg-ink-100"
    }`;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`${buttonClasses("ghost", "sm")} px-2.5 ${open ? "bg-ink-100" : ""}`}
      >
        <DotsThreeIcon className="size-5" weight="bold" aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKey}
          className="absolute top-full right-0 z-30 mt-1.5 w-52 animate-fade-up rounded-card bg-white p-1.5 shadow-raised ring-1 ring-ink-900/8 [animation-duration:0.2s]"
        >
          {[regular, danger].map(
            (group, index) =>
              group.length > 0 && (
                <div key={index} className={index === 1 && regular.length > 0 ? "mt-1.5 border-t border-ink-200 pt-1.5" : ""}>
                  {group.map((item) =>
                    item.href ? (
                      <Link key={item.label} href={item.href} role="menuitem" tabIndex={-1} onClick={() => setOpen(false)} className={itemClass(item)}>
                        {item.icon}
                        {item.label}
                      </Link>
                    ) : (
                      <button
                        key={item.label}
                        type="button"
                        role="menuitem"
                        tabIndex={-1}
                        onClick={() => {
                          item.onSelect?.();
                          if (!item.keepOpen) setOpen(false);
                        }}
                        className={itemClass(item)}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ),
                  )}
                </div>
              ),
          )}
        </div>
      )}
    </div>
  );
}

/** Rascunho nunca foi ao ar: confirmação simples, sem pesquisa. */
function DraftDialog({ dialogRef, listing }: { dialogRef: React.RefObject<HTMLDialogElement | null>; listing: ActionListing }) {
  const [isPending, startTransition] = useTransition();
  const close = () => dialogRef.current?.close();
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`draft-${listing.id}`}
      onClick={(event) => event.target === event.currentTarget && close()}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-panel bg-white p-0 text-left text-ink-800 shadow-raised backdrop:bg-ink-900/60 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 sm:p-8">
        <h2 id={`draft-${listing.id}`} className="text-h3 font-bold text-ink-900">
          Excluir rascunho?
        </h2>
        <p className="mt-2 text-sm text-ink-600">“{listing.title}”. O texto e as fotos saem de vez.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={close} className={buttonClasses("secondary")}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => deleteDraft(listing.id).then(close))}
            className={`${buttonClasses("primary")} bg-danger-600 hover:bg-danger-600/90 disabled:opacity-70`}
          >
            {isPending && <CircleNotchIcon className="size-4 animate-spin" weight="bold" aria-hidden />}
            Excluir rascunho
          </button>
        </div>
      </div>
    </dialog>
  );
}

const REASONS: { value: RemovalSurvey["reason"]; label: string }[] = [
  { value: "alugado", label: "Aluguei a sala" },
  { value: "indisponivel", label: "A sala não está mais disponível" },
  { value: "sem_procura", label: "Não recebi contatos suficientes" },
  { value: "outra_plataforma", label: "Vou anunciar em outro lugar" },
  { value: "outro", label: "Outro motivo" },
];

const VIA: { value: NonNullable<RemovalSurvey["rented_via_subleasy"]>; label: string }[] = [
  { value: "sim", label: "Sim, pelo Subleasy" },
  { value: "nao", label: "Não, por outro meio" },
  { value: "nao_sei", label: "Não sei dizer" },
];

/** Antes de excluir, uma pergunta rápida: o motivo ajuda o Subleasy a medir o que funciona. */
function DeleteDialog({ dialogRef, listing, canPause }: { dialogRef: React.RefObject<HTMLDialogElement | null>; listing: ActionListing; canPause: boolean }) {
  const [reason, setReason] = useState<RemovalSurvey["reason"] | null>(null);
  const [via, setVia] = useState<RemovalSurvey["rented_via_subleasy"]>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const close = () => dialogRef.current?.close();
  const ready = reason !== null && (reason !== "alugado" || via !== null);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`delete-${listing.id}`}
      onClick={(event) => event.target === event.currentTarget && close()}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(34rem,calc(100vw-2rem))] overflow-y-auto rounded-panel bg-white p-0 text-left text-ink-800 shadow-raised backdrop:bg-ink-900/60 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={`delete-${listing.id}`} className="text-h3 font-bold text-ink-900">
              Excluir anúncio
            </h2>
            <p className="mt-1 text-sm text-ink-600">“{listing.title}”. O anúncio, as fotos, as métricas e as mensagens saem de vez.</p>
          </div>
          <button type="button" onClick={close} aria-label="Fechar" className="focus-ring grid size-10 shrink-0 place-items-center rounded-full text-ink-500 hover:bg-ink-100">
            <XIcon className="size-5" aria-hidden />
          </button>
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-bold text-ink-800">Por que você está excluindo?</legend>
          <div className="mt-3 space-y-2">
            {REASONS.map((item) => (
              <Choice key={item.value} name={`reason-${listing.id}`} checked={reason === item.value} onChange={() => setReason(item.value)}>
                {item.label}
              </Choice>
            ))}
          </div>
        </fieldset>

        {reason === "alugado" && (
          <fieldset className="mt-6 animate-fade-up [animation-duration:0.3s]">
            <legend className="text-sm font-bold text-ink-800">Quem alugou encontrou a sala no Subleasy?</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {VIA.map((item) => (
                <Choice key={item.value} name={`via-${listing.id}`} checked={via === item.value} onChange={() => setVia(item.value)}>
                  {item.label}
                </Choice>
              ))}
            </div>
          </fieldset>
        )}

        <label className="mt-6 block text-sm font-bold text-ink-800">
          Quer contar mais? <span className="font-normal text-ink-500">(opcional)</span>
          <textarea
            rows={3}
            maxLength={1000}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="mt-2 w-full rounded-control border border-ink-300 bg-white px-4 py-3 text-base font-normal text-ink-900 shadow-xs outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15"
          />
        </label>

        {error && (
          <p role="alert" className="mt-4 text-sm text-danger-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          {canPause && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => pauseListing(listing.id).then(close))}
              className={`${buttonClasses("ghost")} mr-auto`}
            >
              <PauseIcon className="size-4" aria-hidden />
              Só pausar
            </button>
          )}
          <button type="button" onClick={close} className={buttonClasses("secondary")}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={!ready || isPending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const result = await deleteListing(listing.id, { reason: reason!, rented_via_subleasy: via, comment });
                if (result && !result.ok) setError(result.error);
              })
            }
            className={`${buttonClasses("primary")} bg-danger-600 hover:bg-danger-600/90 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {isPending && <CircleNotchIcon className="size-4 animate-spin" weight="bold" aria-hidden />}
            Excluir anúncio
          </button>
        </div>
      </div>
    </dialog>
  );
}

function Choice({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-control px-4 py-3 text-sm ring-1 transition focus-within:ring-2 focus-within:ring-brand-600/40 ${
        checked ? "bg-brand-50 font-bold text-brand-800 ring-brand-600" : "text-ink-800 ring-ink-300 hover:ring-ink-500"
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span className={`grid size-4 shrink-0 place-items-center rounded-full ring-1 ${checked ? "ring-brand-600" : "ring-ink-400"}`} aria-hidden>
        {checked && <span className="size-2 rounded-full bg-brand-600" />}
      </span>
      {children}
    </label>
  );
}
