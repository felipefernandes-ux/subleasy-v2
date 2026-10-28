"use client";

import { useState } from "react";
import { LockKeyIcon } from "@phosphor-icons/react";
import { setUserRoles } from "@/app/superadmin/usuarios/actions";
import { ConfirmDialog } from "./confirm-dialog";

const ROLES = ["anunciante", "cliente", "admin"] as const;
type RoleKey = (typeof ROLES)[number];

/**
 * Papéis da conta. Marcar não grava: "Salvar papéis" abre o diálogo com o motivo, que vai para a auditoria.
 * Anunciante com anúncios não sai (o papel vem dos anúncios), e ninguém muda os próprios papéis.
 */
export function UserRolesCard({ userId, roles, locked, lockedReason }: { userId: string; roles: RoleKey[]; locked: boolean; lockedReason?: string }) {
  const [checked, setChecked] = useState<Set<RoleKey>>(new Set(roles));
  const changed = ROLES.some((role) => checked.has(role) !== roles.includes(role));

  const toggle = (role: RoleKey) =>
    setChecked((current) => {
      const next = new Set(current);
      if (!next.delete(role)) next.add(role);
      return next;
    });

  return (
    <div className="space-y-3 p-5">
      {ROLES.map((role) => (
        <label key={role} className="flex items-center justify-between gap-3 text-sa-base">
          <span className="capitalize">{role}</span>
          <input
            type="checkbox"
            checked={checked.has(role)}
            disabled={locked}
            onChange={() => toggle(role)}
            className="size-4 accent-brand-600"
          />
        </label>
      ))}
      <p className="flex items-start gap-1.5 text-sa-xs text-sa-muted">
        <LockKeyIcon className="mt-px size-3.5 shrink-0" aria-hidden />
        {locked ? lockedReason : "Mudar papel pede motivo e vai para a auditoria. Admin exige o código por e-mail em todo login."}
      </p>
      {!locked && (
        <ConfirmDialog
          trigger="Salvar papéis"
          triggerVariant="primary"
          triggerDisabled={!changed}
          title="Mudar papéis"
          description="A mudança vale na hora. Quem vira admin passa a ver e editar tudo no Super Admin."
          confirmLabel="Salvar papéis"
          onConfirm={(reason) => setUserRoles(userId, [...checked], reason)}
        />
      )}
    </div>
  );
}
