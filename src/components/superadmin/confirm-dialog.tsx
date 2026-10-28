"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition, type ReactNode } from "react";
import { Button } from "./ui";

export type ConfirmResult = { ok: true } | { ok: false; error: string };

/**
 * Ação sensível com motivo obrigatório, como pede o plano (tudo deixa rastro).
 * Com onConfirm, chama a ação com o motivo, mostra o erro dentro do diálogo e atualiza a página
 * quando dá certo. Sem onConfirm é só visual: confirmar fecha o diálogo e não grava nada.
 */
export function ConfirmDialog({
  trigger,
  triggerVariant = "outline",
  triggerSmall,
  triggerDisabled,
  title,
  description,
  confirmLabel,
  danger,
  reasonLabel = "Motivo (vai para o registro de auditoria)",
  onConfirm,
  redirectTo,
  requireText,
  children,
}: {
  trigger: ReactNode;
  triggerVariant?: "outline" | "ghost" | "danger" | "primary";
  triggerSmall?: boolean;
  triggerDisabled?: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  reasonLabel?: string;
  onConfirm?: (reason: string, typed: string) => Promise<ConfirmResult>;
  /** Para onde ir quando dá certo, se a página atual deixa de existir (ex.: a ficha de uma conta excluída). */
  redirectTo?: string;
  /** Texto que a pessoa precisa digitar igual para liberar o botão (ex.: o e-mail da conta a excluir). */
  requireText?: string;
  children?: ReactNode;
}) {
  const uid = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const close = () => {
    ref.current?.close();
    setReason("");
    setTyped("");
    setError(null);
  };

  const submit = () => {
    if (!onConfirm) return close();
    setError(null);
    startTransition(async () => {
      const result = await onConfirm(reason.trim(), typed.trim());
      if (!result.ok) return setError(result.error);
      close();
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  };

  return (
    <>
      <Button variant={triggerVariant} small={triggerSmall} disabled={triggerDisabled} onClick={() => ref.current?.showModal()}>
        {trigger}
      </Button>
      <dialog
        ref={ref}
        aria-labelledby={`${uid}-title`}
        onClose={() => {
          setReason("");
          setTyped("");
          setError(null);
        }}
        className="sa-root m-auto w-[min(28rem,calc(100vw-2rem))] rounded-sa-panel bg-sa-canvas p-0 text-sa-ink shadow-sa-raised backdrop:bg-sa-ink/30"
      >
        <form method="dialog" onSubmit={(event) => { event.preventDefault(); submit(); }} className="flex flex-col gap-4 p-6">
          <div>
            <h2 id={`${uid}-title`} className="sa-display text-sa-title font-semibold">
              {title}
            </h2>
            <p className="mt-1.5 text-sa-base text-sa-muted">{description}</p>
          </div>
          {children}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${uid}-reason`} className="text-sa-sm font-semibold">
              {reasonLabel}
            </label>
            <textarea
              id={`${uid}-reason`}
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="sa-input"
              placeholder="Escreva em uma frase"
            />
          </div>
          {requireText && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${uid}-confirm`} className="text-sa-sm font-semibold">
                Digite <span className="font-mono">{requireText}</span> para confirmar
              </label>
              <input id={`${uid}-confirm`} value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" className="sa-input" />
            </div>
          )}
          {error && (
            <p role="alert" className="text-sa-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={close} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" variant={danger ? "danger" : "primary"} disabled={reason.trim().length < 3 || isPending || (requireText !== undefined && typed.trim().toLowerCase() !== requireText.toLowerCase())}>
              {confirmLabel}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
