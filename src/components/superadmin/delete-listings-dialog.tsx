"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import { TrashIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { deleteListingsAsAdmin } from "@/app/superadmin/actions";
import type { Listing } from "@/lib/superadmin/types";
import { Badge, Button } from "./ui";

/** Exclusão definitiva em lote: mostra o que vai sair e só libera depois de digitar “excluir”. */
export function DeleteListingsDialog({
  listings,
  onDone,
  redirectTo,
  label,
  small = true,
  className,
}: {
  listings: Listing[];
  /** Roda depois de excluir, antes de atualizar a tela (ex.: limpar a seleção). */
  onDone?: () => void;
  /** Para onde ir depois de excluir. Sem isto, só atualiza a página atual. */
  redirectTo?: string;
  /** Texto do botão. Padrão: "Excluir N". */
  label?: string;
  small?: boolean;
  className?: string;
}) {
  const uid = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const live = listings.filter((listing) => listing.status === "no_ar").length;
  const imported = listings.filter((listing) => listing.origin === "importado").length;
  const confirmed = typed.trim().toLowerCase() === "excluir";

  const close = () => {
    ref.current?.close();
    setTyped("");
    setError(null);
  };

  const submit = () =>
    start(async () => {
      const result = await deleteListingsAsAdmin(
        listings.map((listing) => listing.id),
        typed,
      );
      if (!result.ok) return setError(result.error);
      close();
      onDone?.();
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });

  return (
    <>
      <Button small={small} variant="danger" className={className} onClick={() => ref.current?.showModal()}>
        <TrashIcon className="size-4" weight="bold" aria-hidden />
        {label ?? `Excluir ${listings.length}`}
      </Button>
      <dialog
        ref={ref}
        aria-labelledby={`${uid}-title`}
        onClose={() => {
          setTyped("");
          setError(null);
        }}
        className="sa-root m-auto w-[min(32rem,calc(100vw-2rem))] rounded-sa-panel bg-sa-canvas p-0 text-sa-ink shadow-sa-raised backdrop:bg-sa-ink/30"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (confirmed && !pending) submit();
          }}
          className="flex flex-col gap-4 p-6"
        >
          <div>
            <h2 id={`${uid}-title`} className="sa-display text-sa-title">
              Excluir {listings.length} {listings.length === 1 ? "anúncio" : "anúncios"} para sempre?
            </h2>
            <p className="mt-1.5 text-sa-base text-sa-muted">
              Apaga os anúncios, as fotos, as visualizações, as mensagens e os favoritos. Não tem como desfazer.
            </p>
          </div>

          {(live > 0 || imported > 0) && (
            <div className="flex gap-2.5 rounded-sa-card bg-[#fdebd0] p-3 text-sa-sm text-[#6b2a0c]">
              <WarningIcon className="mt-0.5 size-4 shrink-0" weight="fill" aria-hidden />
              <ul className="space-y-1">
                {live > 0 && <li>{live} {live === 1 ? "está no ar" : "estão no ar"} agora e sai do site na hora.</li>}
                {imported > 0 && (
                  <li>
                    {imported} {imported === 1 ? "veio" : "vieram"} da importação do WordPress. Para trazer de volta é preciso rodar a importação de novo.
                  </li>
                )}
              </ul>
            </div>
          )}

          <ul className="max-h-44 divide-y divide-sa-haze overflow-y-auto rounded-sa-card ring-1 ring-sa-line">
            {listings.map((listing) => (
              <li key={listing.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sa-sm font-semibold">{listing.title}</span>
                  <span className="block truncate text-sa-xs text-sa-muted">
                    {listing.owner} · {listing.city}
                  </span>
                </span>
                <Badge tone={listing.status === "no_ar" ? "success" : "neutral"}>{listing.status === "no_ar" ? "No ar" : listing.origin === "importado" ? "Importado" : "Não publicado"}</Badge>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${uid}-confirm`} className="text-sa-sm font-semibold">
              Para confirmar, digite <span className="font-mono">excluir</span>
            </label>
            <input
              id={`${uid}-confirm`}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              className="sa-input"
            />
          </div>

          {error && (
            <p role="alert" className="text-sa-sm text-danger-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={close}>
              Cancelar
            </Button>
            <Button type="submit" variant="danger" disabled={!confirmed || pending}>
              {pending ? "Excluindo…" : "Excluir definitivamente"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
