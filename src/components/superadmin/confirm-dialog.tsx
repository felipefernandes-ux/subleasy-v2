"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Button } from "./ui";

/**
 * Ação sensível com motivo obrigatório, como pede o plano (tudo deixa rastro).
 * Só visual: confirmar fecha o diálogo e não grava nada.
 */
export function ConfirmDialog({
  trigger,
  triggerVariant = "outline",
  triggerSmall,
  title,
  description,
  confirmLabel,
  danger,
  reasonLabel = "Motivo (vai para o registro de auditoria)",
  children,
}: {
  trigger: ReactNode;
  triggerVariant?: "outline" | "ghost" | "danger" | "primary";
  triggerSmall?: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  reasonLabel?: string;
  children?: ReactNode;
}) {
  const uid = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");

  const close = () => {
    ref.current?.close();
    setReason("");
  };

  return (
    <>
      <Button variant={triggerVariant} small={triggerSmall} onClick={() => ref.current?.showModal()}>
        {trigger}
      </Button>
      <dialog
        ref={ref}
        aria-labelledby={`${uid}-title`}
        onClose={() => setReason("")}
        className="sa-root m-auto w-[min(28rem,calc(100vw-2rem))] rounded-sa-panel bg-sa-canvas p-0 text-sa-ink shadow-sa-raised backdrop:bg-sa-ink/30"
      >
        <form method="dialog" onSubmit={(event) => { event.preventDefault(); close(); }} className="flex flex-col gap-4 p-6">
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
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={close}>
              Cancelar
            </Button>
            <Button type="submit" variant={danger ? "danger" : "primary"} disabled={reason.trim().length < 3}>
              {confirmLabel}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
