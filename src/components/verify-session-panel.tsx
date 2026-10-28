"use client";

import { useActionState, useEffect, useRef, useState, startTransition } from "react";
import { sendSessionCode, signOut, verifySessionCode, type CodeFormState } from "@/app/actions/auth";
import { CodeStep } from "./code-step";

/**
 * Segunda etapa de quem entrou pelo Google: o código de 6 dígitos chega por e-mail ao abrir a tela.
 * O envio é pedido uma vez; o servidor ignora pedidos repetidos em menos de 30 segundos.
 */
export function VerifySessionPanel({ email, next, canTrust }: { email: string; next: string; canTrust: boolean }) {
  const [state, action, pending] = useActionState<CodeFormState, FormData>(verifySessionCode, { status: "idle" });
  const [sendError, setSendError] = useState<string | null>(null);
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    sendSessionCode().then((result) => result.status === "error" && setSendError(result.error));
  }, []);

  return (
    <CodeStep
      email={email}
      title="Confirme que é você"
      description="Para proteger sua conta, enviamos um código de 6 dígitos para"
      formAction={action}
      pending={pending}
      error={state.status === "error" ? state.error : (sendError ?? undefined)}
      hidden={{ next }}
      submitLabel="Confirmar"
      onResend={() => sendSessionCode().then((result) => setSendError(result.status === "error" ? result.error : null))}
      onBack={() => startTransition(() => signOut())}
      backLabel="Usar outra conta"
    >
      {canTrust && (
        <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-ink-700">
          <input type="checkbox" name="trust" className="mt-0.5 size-4 accent-brand-600" />
          <span>
            Confiar neste aparelho por 30 dias
            <span className="block text-ink-500">Não pedimos o código de novo neste navegador.</span>
          </span>
        </label>
      )}
    </CodeStep>
  );
}
