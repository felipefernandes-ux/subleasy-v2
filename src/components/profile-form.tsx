"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { CircleNotchIcon } from "@phosphor-icons/react";
import { signOut } from "@/app/actions/auth";
import { saveProfile, type ProfileState } from "@/app/actions/profile";
import { buttonClasses } from "./ui";

const INPUT_CLASSES =
  "mt-2 h-12 w-full rounded-control border bg-white px-4 text-base text-ink-900 shadow-xs outline-none transition-colors placeholder:text-ink-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15";

/** Cadastro do primeiro acesso: nome, WhatsApp e aceite dos termos. */
export function ProfileForm({
  email,
  defaultName,
  next,
}: {
  email: string;
  defaultName: string;
  next: string;
}) {
  const [state, formAction, isPending] = useActionState<ProfileState, FormData>(saveProfile, {
    status: "idle",
  });
  const errors = state.status === "error" ? state.fields : {};
  const values = state.status === "error" ? state.values : null;
  const [whatsapp, setWhatsapp] = useState(values?.whatsapp ?? "");
  const ids = { name: useId(), nameHint: useId(), phone: useId(), phoneHint: useId(), terms: useId() };

  return (
    <div className="w-full">
      <h1 className="text-center text-h2 font-bold text-ink-900">Complete seu cadastro</h1>
      <p className="mt-2 text-center text-ink-600">Falta pouco para anunciar sua sala.</p>

      {email && (
        <form action={signOut} className="mt-6 flex flex-wrap items-center justify-center gap-x-1 text-sm text-ink-600">
          <span>
            Conectado como <strong className="font-bold [overflow-wrap:anywhere] text-ink-900">{email}</strong>.
          </span>
          <button type="submit" className="focus-ring rounded-sm font-bold text-brand-600 hover:text-brand-500">
            Sair
          </button>
        </form>
      )}

      <form action={formAction} noValidate className="mt-8 space-y-6">
        <input type="hidden" name="next" value={next} />

        {state.status === "error" && state.error && (
          <p role="alert" className="rounded-control bg-danger-600/6 px-3 py-2.5 text-sm text-ink-800">
            {state.error}
          </p>
        )}

        <div>
          <label htmlFor={ids.name} className="block text-sm font-bold text-ink-800">
            Seu nome ou nome da clínica
          </label>
          <input
            id={ids.name}
            name="display_name"
            type="text"
            autoComplete="name"
            required
            maxLength={80}
            defaultValue={values?.display_name ?? defaultName}
            aria-invalid={Boolean(errors.display_name)}
            aria-describedby={ids.nameHint}
            className={`${INPUT_CLASSES} ${errors.display_name ? "border-danger-600" : "border-ink-300"}`}
          />
          <FieldHint id={ids.nameHint} error={errors.display_name}>
            Aparece no anúncio como anfitrião.
          </FieldHint>
        </div>

        <div>
          <label htmlFor={ids.phone} className="block text-sm font-bold text-ink-800">
            WhatsApp
          </label>
          <input
            id={ids.phone}
            name="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            required
            placeholder="(44) 99999-9999"
            value={whatsapp}
            onChange={(event) => setWhatsapp(formatPhone(event.target.value))}
            aria-invalid={Boolean(errors.whatsapp)}
            aria-describedby={ids.phoneHint}
            className={`${INPUT_CLASSES} ${errors.whatsapp ? "border-danger-600" : "border-ink-300"}`}
          />
          <FieldHint id={ids.phoneHint} error={errors.whatsapp}>
            Quem se interessar pela sala fala com você por aqui. O número só aparece quando a pessoa
            clica no botão do anúncio.
          </FieldHint>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-700">
              <input
                name="terms"
                type="checkbox"
                required
                defaultChecked={values?.terms ?? false}
                aria-invalid={Boolean(errors.terms)}
                aria-describedby={errors.terms ? ids.terms : undefined}
                className="mt-0.5 size-5 shrink-0 cursor-pointer accent-brand-600"
              />
              <span>
                Li e aceito os{" "}
                <Link href="/termos" target="_blank" className="font-bold text-brand-600 hover:text-brand-700">
                  Termos de uso
                </Link>{" "}
                e a{" "}
                <Link href="/privacidade" target="_blank" className="font-bold text-brand-600 hover:text-brand-700">
                  Política de privacidade
                </Link>
                .
              </span>
            </label>
            {errors.terms && (
              <p id={ids.terms} role="alert" className="mt-2 pl-8 text-sm text-danger-600">
                {errors.terms}
              </p>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-700">
            <input
              name="marketing"
              type="checkbox"
              defaultChecked={values?.marketing ?? false}
              className="mt-0.5 size-5 shrink-0 cursor-pointer accent-brand-600"
            />
            <span>Quero receber por e-mail dicas para alugar mais rápido e novidades do Subleasy.</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={`${buttonClasses("primary", "lg")} w-full disabled:cursor-wait disabled:bg-brand-500`}
        >
          {isPending ? (
            <>
              <CircleNotchIcon className="size-5 animate-spin" weight="bold" aria-hidden />
              Salvando
            </>
          ) : (
            "Salvar e continuar"
          )}
        </button>
      </form>
    </div>
  );
}

function FieldHint({ id, error, children }: { id: string; error?: string; children: React.ReactNode }) {
  return (
    <p id={id} role={error ? "alert" : undefined} className={`mt-2 text-sm ${error ? "text-danger-600" : "text-ink-500"}`}>
      {error ?? children}
    </p>
  );
}

// Máscara brasileira: (44) 9999-9999 ou (44) 99999-9999, conforme o tamanho.
function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  const split = rest.length > 8 ? 5 : 4;
  if (rest.length <= split) return `(${ddd}) ${rest}`;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}
