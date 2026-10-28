"use client";

import Link from "next/link";
import { startTransition, useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { CircleNotchIcon, WarningCircleIcon } from "@phosphor-icons/react";
import {
  requestLoginCode,
  signInWithGoogle,
  verifyLoginCode,
  type AuthMode,
  type CodeFormState,
  type LoginCodeState,
} from "@/app/actions/auth";
import { safeNextPath } from "@/lib/auth-redirect";
import { CodeStep } from "./code-step";
import { buttonClasses } from "./ui";

const COPY: Record<
  AuthMode,
  {
    title: string;
    subtitle: string;
    google: string;
    submit: string;
    switchText: string;
    switchLabel: string;
    switchHref: string;
  }
> = {
  signin: {
    title: "Entre no Subleasy",
    subtitle: "Para anunciar e acompanhar suas salas.",
    google: "Fazer login com o Google",
    submit: "Entrar com email",
    switchText: "Ainda não tem conta?",
    switchLabel: "Criar conta",
    switchHref: "/criar-conta",
  },
  signup: {
    title: "Crie sua conta",
    subtitle: "Grátis. Seu anúncio fica pronto em minutos.",
    google: "Continuar com o Google",
    submit: "Criar conta com e-mail",
    switchText: "Já tem conta?",
    switchLabel: "Entrar",
    switchHref: "/entrar",
  },
};

// Erros que chegam pela URL, vindos do /auth/callback ou do Google.
const URL_ERRORS: Record<string, string> = {
  link: "Este link expirou ou já foi usado. Peça um código novo abaixo.",
  google: "Não foi possível entrar com o Google. Tente de novo.",
};

/** Lê ?next=, ?erro= e ?email= da URL. Fica dentro de um <Suspense>. */
export function AuthFormFromUrl({ mode }: { mode: AuthMode }) {
  const params = useSearchParams();
  return (
    <AuthForm
      mode={mode}
      next={safeNextPath(params.get("next"))}
      urlError={URL_ERRORS[params.get("erro") ?? ""]}
      defaultEmail={params.get("email") ?? ""}
    />
  );
}

export function AuthForm({
  mode,
  next = "/",
  urlError,
  defaultEmail = "",
}: {
  mode: AuthMode;
  next?: string;
  urlError?: string;
  defaultEmail?: string;
}) {
  const copy = COPY[mode];
  const [state, formAction, isPending] = useActionState<LoginCodeState, FormData>(
    requestLoginCode,
    { status: "idle" },
  );
  const [codeState, codeAction, codePending] = useActionState<CodeFormState, FormData>(verifyLoginCode, { status: "idle" });
  // Ao clicar em "Usar outro e-mail", volta ao formulário sem perder o texto.
  const [dismissed, setDismissed] = useState<LoginCodeState | null>(null);
  const emailId = useId();
  const errorId = useId();

  const sent = state.status === "sent" && dismissed !== state;
  const fieldError = state.status === "error" ? state : null;
  const switchHref = withParams(copy.switchHref, next, fieldError?.email);

  if (sent) {
    const resend = () => {
      const data = new FormData();
      data.set("email", state.email);
      data.set("mode", mode);
      data.set("next", next);
      startTransition(() => formAction(data));
    };
    return (
      <CodeStep
        email={state.email}
        title="Confira seu e-mail"
        description={mode === "signup" ? "Enviamos um código de 6 dígitos para confirmar o e-mail" : "Enviamos um código de 6 dígitos para"}
        formAction={codeAction}
        pending={codePending}
        error={codeState.status === "error" ? codeState.error : undefined}
        hidden={{ email: state.email, mode, next }}
        submitLabel={mode === "signup" ? "Confirmar e criar conta" : "Entrar"}
        onResend={resend}
        onBack={() => setDismissed(state)}
        backLabel="Usar outro e-mail"
      />
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-center text-h2 font-bold text-ink-900">{copy.title}</h1>
      <p className="mt-2 text-center text-ink-600">{copy.subtitle}</p>

      {urlError && !fieldError && (
        <p
          role="alert"
          className="mt-6 flex items-start gap-2 rounded-control bg-danger-600/6 px-3 py-2.5 text-sm text-ink-800"
        >
          <WarningCircleIcon className="mt-px size-4.5 shrink-0 text-danger-600" weight="fill" aria-hidden />
          {urlError}
        </p>
      )}

      <form action={signInWithGoogle} className="mt-8">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="mode" value={mode} />
        <GoogleButton label={copy.google} />
      </form>

      <div className="my-6 flex items-center gap-3 text-sm text-ink-500" role="separator" aria-label="ou">
        <span className="h-px flex-1 bg-ink-200" />
        ou
        <span className="h-px flex-1 bg-ink-200" />
      </div>

      <form action={formAction} noValidate>
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="mode" value={mode} />
        <label htmlFor={emailId} className="block text-sm font-bold text-ink-800">
          E-mail
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={fieldError?.email ?? defaultEmail}
          key={fieldError?.email ?? defaultEmail}
          placeholder="nome@exemplo.com"
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? errorId : undefined}
          className={`mt-2 h-12 w-full rounded-control border bg-white px-4 text-base text-ink-900 shadow-xs outline-none transition-colors placeholder:text-ink-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15 ${
            fieldError ? "border-danger-600" : "border-ink-300"
          }`}
        />
        {fieldError && (
          <p id={errorId} role="alert" className="mt-2 text-sm text-danger-600">
            {fieldError.error}
            {fieldError.code === "no_account" && (
              <Link href={switchHref} className="focus-ring mt-1 block w-fit rounded-sm font-bold text-brand-600 hover:text-brand-700">
                Criar conta com este e-mail
              </Link>
            )}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className={`${buttonClasses("primary", "lg")} mt-4 w-full disabled:cursor-wait disabled:bg-brand-500`}
        >
          {isPending ? (
            <>
              <CircleNotchIcon className="size-5 animate-spin" weight="bold" aria-hidden />
              Enviando código
            </>
          ) : (
            copy.submit
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-600">
        {copy.switchText}{" "}
        <Link href={switchHref} className="focus-ring rounded-sm font-bold text-brand-600 hover:text-brand-500">
          {copy.switchLabel}
        </Link>
      </p>
    </div>
  );
}

function GoogleButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonClasses("secondary", "lg")} w-full disabled:cursor-wait disabled:opacity-70`}
    >
      {pending ? (
        <CircleNotchIcon className="size-5 animate-spin text-ink-500" weight="bold" aria-hidden />
      ) : (
        <GoogleIcon />
      )}
      {label}
    </button>
  );
}

// Mantém o destino (e o e-mail digitado) ao trocar entre Entrar e Criar conta.
function withParams(path: string, next: string, email?: string) {
  const params = new URLSearchParams();
  if (next !== "/") params.set("next", next);
  if (email) params.set("email", email);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/** "G" oficial do Google, nas cores da marca. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3.02c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.11A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28V6.61H1.28a12 12 0 0 0 0 10.78l4.01-3.11Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4.01 3.11C6.23 6.88 8.88 4.77 12 4.77Z" />
    </svg>
  );
}
