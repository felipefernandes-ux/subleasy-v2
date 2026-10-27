"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { BellIcon, CircleNotchIcon, HandPalmIcon, ShieldCheckIcon, UserIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import {
  connectGoogle,
  deleteAccount,
  disconnectGoogle,
  setNotification,
  setShowWhatsApp,
  updateBio,
  updateEmail,
  updateName,
  updateWhatsApp,
  type FieldResult,
  type NotificationKey,
} from "@/app/actions/account";
import { buttonClasses } from "./ui";

const NAV = [
  { href: "/configuracoes/informacoes-pessoais", label: "Informações pessoais", icon: UserIcon },
  { href: "/configuracoes/login-e-seguranca", label: "Login e segurança", icon: ShieldCheckIcon },
  { href: "/configuracoes/privacidade", label: "Privacidade", icon: HandPalmIcon },
  { href: "/configuracoes/notificacoes", label: "Notificações", icon: BellIcon },
];

/** Barra lateral das configurações. No celular, vira uma faixa rolável no topo. */
export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Configurações da conta" className="-mx-5 mt-6 overflow-x-auto px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:mt-8 lg:overflow-visible lg:px-0">
      <ul className="flex gap-2 lg:flex-col lg:gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const current = pathname === href;
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`focus-ring flex items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-colors lg:rounded-card lg:px-4 lg:py-3.5 lg:text-base ${
                  current ? "bg-ink-100 font-bold text-ink-900" : "text-ink-700 hover:bg-ink-50"
                }`}
              >
                <Icon className="size-5 shrink-0 lg:size-6" weight={current ? "bold" : "regular"} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const SAVE: Record<"name" | "email" | "whatsapp" | "bio", (value: string) => Promise<FieldResult>> = {
  name: updateName,
  email: updateEmail,
  whatsapp: updateWhatsApp,
  bio: updateBio,
};

/**
 * Linha do Airbnb: rótulo, valor e "Editar" à direita. Ao editar, a linha abre o campo
 * no lugar, e as outras ações ficam esperando.
 */
export function EditableRow({
  field,
  label,
  value,
  hint,
  initial,
  type = "text",
  placeholder,
  maxLength,
}: {
  field: keyof typeof SAVE;
  label: string;
  /** O que aparece fechado (pode vir mascarado, como o e-mail). */
  value: string | null;
  hint?: string;
  /** O que entra no campo ao editar. */
  initial: string;
  /** "textarea" abre um campo de várias linhas, com contador quando há maxLength. */
  type?: "text" | "email" | "tel" | "textarea";
  placeholder?: string;
  maxLength?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initial);
  const [result, setResult] = useState<FieldResult | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="border-b border-ink-200 py-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="font-bold text-ink-900">{label}</p>
          {!editing && <p className="mt-1 whitespace-pre-line text-ink-600">{value || "Não informado"}</p>}
          {editing && hint && <p className="mt-1 text-sm text-ink-600">{hint}</p>}
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing((current) => !current);
            setDraft(initial);
            setResult(null);
          }}
          className="focus-ring shrink-0 rounded-sm font-bold text-ink-900 hover:text-brand-700"
        >
          {editing ? "Cancelar" : value ? "Editar" : "Adicionar"}
        </button>
      </div>

      {editing && (
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const next = await SAVE[field](draft);
              setResult(next);
              if (next.ok && !next.message) setEditing(false);
            });
          }}
        >
          {type === "textarea" ? (
            <>
              <textarea
                autoFocus
                rows={5}
                value={draft}
                maxLength={maxLength}
                placeholder={placeholder}
                onChange={(event) => setDraft(event.target.value)}
                aria-label={label}
                aria-invalid={result?.ok === false}
                className={`w-full resize-y rounded-control border bg-white px-4 py-3 text-base leading-relaxed text-ink-900 shadow-xs outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15 ${
                  result?.ok === false ? "border-danger-600" : "border-ink-300"
                }`}
              />
              {maxLength && (
                <p className="mt-1 text-right text-xs text-ink-500 tabular-nums">
                  {draft.length}/{maxLength}
                </p>
              )}
            </>
          ) : (
            <input
              autoFocus
              type={type}
              value={draft}
              maxLength={maxLength}
              placeholder={placeholder}
              onChange={(event) => setDraft(event.target.value)}
              aria-label={label}
              aria-invalid={result?.ok === false}
              className={`h-12 w-full rounded-control border bg-white px-4 text-base text-ink-900 shadow-xs outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15 ${
                result?.ok === false ? "border-danger-600" : "border-ink-300"
              }`}
            />
          )}
          {result && (
            <p role={result.ok ? "status" : "alert"} className={`mt-2 text-sm ${result.ok ? "text-mint-700" : "text-danger-600"}`}>
              {result.ok ? result.message : result.error}
            </p>
          )}
          <button type="submit" disabled={isPending} className={`${buttonClasses("primary")} mt-4 disabled:opacity-70`}>
            {isPending && <CircleNotchIcon className="size-4 animate-spin" weight="bold" aria-hidden />}
            Salvar
          </button>
        </form>
      )}
    </div>
  );
}

/**
 * Linha com chave liga/desliga, que salva na hora. "show_whatsapp" é o consentimento para
 * mostrar o WhatsApp no perfil público, que fica registrado a cada mudança.
 */
export function ToggleRow({
  setting,
  label,
  description,
  initial,
}: {
  setting: NotificationKey | "show_whatsapp";
  label: string;
  description: string;
  initial: boolean;
}) {
  const [on, setOn] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="border-b border-ink-200 py-6">
      <label className="flex cursor-pointer items-start justify-between gap-6">
        <span>
          <span className="block font-bold text-ink-900">{label}</span>
          <span className="mt-1 block text-ink-600">{description}</span>
          {error && (
            <span role="alert" className="mt-1 block text-sm text-danger-600">
              {error}
            </span>
          )}
        </span>
        <span className="mt-1.5 w-14 shrink-0 text-right text-xs font-bold text-mint-700" aria-live="polite">
          {isPending ? <CircleNotchIcon className="ml-auto size-4 animate-spin text-ink-400" weight="bold" aria-label="Salvando" /> : saved ? "Salvo" : null}
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={on}
          onChange={(event) => {
            const next = event.target.checked;
            setOn(next);
            setError(null);
            startTransition(async () => {
              const result = setting === "show_whatsapp" ? await setShowWhatsApp(next) : await setNotification(setting, next);
              if (!result.ok) {
                setOn(!next);
                setError(result.error);
                return;
              }
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            });
          }}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="relative mt-0.5 h-8 w-13 shrink-0 rounded-full bg-ink-300 transition-colors peer-checked:bg-brand-600 peer-focus-visible:ring-3 peer-focus-visible:ring-brand-600/30 after:absolute after:top-1 after:left-1 after:size-6 after:rounded-full after:bg-white after:shadow-xs after:transition-transform peer-checked:after:translate-x-5"
        />
      </label>
    </div>
  );
}

/** Título grande da aba, como no Airbnb. */
export function SettingsTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-h2 font-bold text-ink-900">{children}</h2>;
}

/** Seção da aba: subtítulo opcional e linhas. */
export function SettingsSection({ title, description, children }: { title?: string; description?: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      {title && <h3 className="text-h3 font-bold text-ink-900">{title}</h3>}
      {description && <p className="mt-1 text-ink-600">{description}</p>}
      <div className={title || description ? "mt-2" : ""}>{children}</div>
    </section>
  );
}

/**
 * Encerrar conta: fica no fim de Login e segurança, discreto, e pede para digitar
 * ENCERRAR antes de apagar tudo.
 */
export function DeleteAccount({ listings }: { listings: number }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const close = () => dialogRef.current?.close();

  return (
    <>
      <div className="flex items-start justify-between gap-6 py-6">
        <div>
          <p className="font-bold text-ink-900">Encerrar conta</p>
          <p className="mt-1 text-ink-600">Apaga sua conta, seus anúncios, mensagens e favoritos. Não dá para desfazer.</p>
        </div>
        <button type="button" onClick={() => dialogRef.current?.showModal()} className="focus-ring shrink-0 rounded-sm font-bold text-danger-600 hover:text-danger-600/80">
          Encerrar
        </button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="encerrar-titulo"
        onClick={(event) => event.target === event.currentTarget && close()}
        className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-panel bg-white p-0 text-left text-ink-800 shadow-raised backdrop:bg-ink-900/60 open:animate-zoom-in"
      >
        <form
          className="p-6 sm:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            startTransition(async () => {
              const result = await deleteAccount(confirmation);
              if (result && !result.ok) setError(result.error);
            });
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <h2 id="encerrar-titulo" className="text-h3 font-bold text-ink-900">
              Encerrar sua conta?
            </h2>
            <button type="button" onClick={close} aria-label="Fechar" className="focus-ring grid size-10 shrink-0 place-items-center rounded-full text-ink-500 hover:bg-ink-100">
              <XIcon className="size-5" aria-hidden />
            </button>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-card bg-danger-600/6 p-4 text-sm text-ink-800 ring-1 ring-danger-600/20">
            <WarningCircleIcon className="mt-0.5 size-5 shrink-0 text-danger-600" weight="fill" aria-hidden />
            <p>
              Saem de vez: seu perfil{listings > 0 ? `, ${listings} ${listings === 1 ? "anúncio" : "anúncios"} com fotos, métricas e mensagens` : ""} e suas
              listas de favoritos. Quem tinha o link dos seus anúncios vai ver uma página não encontrada.
            </p>
          </div>
          <label className="mt-6 block text-sm font-bold text-ink-800">
            Para confirmar, digite ENCERRAR
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              className="mt-2 h-12 w-full rounded-control border border-ink-300 bg-white px-4 text-base font-normal text-ink-900 shadow-xs outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15"
            />
          </label>
          {error && (
            <p role="alert" className="mt-2 text-sm text-danger-600">
              {error}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={close} className={buttonClasses("secondary")}>
              Manter conta
            </button>
            <button
              type="submit"
              disabled={confirmation.trim().toUpperCase() !== "ENCERRAR" || isPending}
              className={`${buttonClasses("primary")} bg-danger-600 hover:bg-danger-600/90 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {isPending && <CircleNotchIcon className="size-4 animate-spin" weight="bold" aria-hidden />}
              Encerrar conta
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

/**
 * Conta Google na aba Login e segurança: conectar leva ao Google e volta;
 * desconectar pede confirmação, porque muda o jeito de entrar.
 */
export function GoogleConnection({ connected, otherLogins }: { connected: boolean; otherLogins: number }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="border-b border-ink-200 py-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="flex items-center gap-2 font-bold text-ink-900">
            Google
            {connected && <span className="rounded-full bg-mint-100 px-2.5 py-0.5 text-xs font-bold text-mint-700">Conectado</span>}
          </p>
          <p className="mt-1 text-ink-600">{connected ? "Você pode entrar com a sua conta Google." : "Conecte para entrar com um clique, sem esperar o e-mail."}</p>
        </div>
        {connected ? (
          !confirming && (
            <button type="button" onClick={() => setConfirming(true)} className="focus-ring shrink-0 rounded-sm font-bold text-ink-900 hover:text-brand-700">
              Desconectar
            </button>
          )
        ) : (
          <form action={connectGoogle}>
            <SubmitText>Conectar</SubmitText>
          </form>
        )}
      </div>

      {confirming && (
        <div role="alert" className="mt-4 rounded-card bg-ink-50 p-4 ring-1 ring-ink-200">
          <p className="text-sm text-ink-800">
            <strong className="font-bold text-ink-900">Desconectar o Google?</strong>{" "}
            {otherLogins > 0 ? "Você continua entrando pelo link enviado ao seu e-mail." : "Hoje o Google é o seu único jeito de entrar."}
          </p>
          {error && <p className="mt-2 text-sm text-danger-600">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => (setConfirming(false), setError(null))} className={buttonClasses("ghost", "sm")}>
              Cancelar
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await disconnectGoogle();
                  if (result.ok) setConfirming(false);
                  else setError(result.error);
                })
              }
              className={`${buttonClasses("secondary", "sm")} disabled:opacity-60`}
            >
              {isPending && <CircleNotchIcon className="size-3.5 animate-spin" weight="bold" aria-hidden />}
              Desconectar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SubmitText({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-sm font-bold text-ink-900 hover:text-brand-700 disabled:opacity-60">
      {pending && <CircleNotchIcon className="size-4 animate-spin" weight="bold" aria-hidden />}
      {children}
    </button>
  );
}
