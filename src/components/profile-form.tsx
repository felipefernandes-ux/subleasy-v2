"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { CaretDownIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { signOut } from "@/app/actions/auth";
import { saveProfile, type ProfileState } from "@/app/actions/profile";
import { BIO_MAX, WHATSAPP_CONSENT } from "@/lib/public-profile";
import { AvatarPicker } from "./avatar-picker";
import { buttonClasses } from "./ui";

const INPUT_CLASSES =
  "mt-2 h-12 w-full rounded-control border bg-white px-4 text-base text-ink-900 shadow-xs outline-none transition-colors placeholder:text-ink-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15";

/** Cadastro do primeiro acesso: nome e WhatsApp (opcional) em destaque; foto e apresentação recolhidas; aceite dos termos. */
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
  const [name, setName] = useState(values?.display_name ?? defaultName);
  const [avatarPath, setAvatarPath] = useState(values?.avatar_path ?? "");
  const [bio, setBio] = useState(values?.bio ?? "");
  const ids = {
    name: useId(),
    nameHint: useId(),
    phone: useId(),
    phoneHint: useId(),
    terms: useId(),
    bio: useId(),
    bioHint: useId(),
    showPhone: useId(),
    showPhoneHint: useId(),
  };

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
        <input type="hidden" name="avatar_path" value={avatarPath} />

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
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(errors.display_name)}
            aria-describedby={ids.nameHint}
            className={`${INPUT_CLASSES} ${errors.display_name ? "border-danger-600" : "border-ink-300"}`}
          />
          <FieldHint id={ids.nameHint} error={errors.display_name}>
            No seu perfil e nos anúncios aparece o primeiro nome e a inicial do último, como “Ana S.”.
          </FieldHint>
        </div>

        <div>
          <label htmlFor={ids.phone} className="block text-sm font-bold text-ink-800">
            WhatsApp <span className="font-normal text-ink-500">(opcional)</span>
          </label>
          <input
            id={ids.phone}
            name="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(44) 99999-9999"
            value={whatsapp}
            onChange={(event) => setWhatsapp(formatPhone(event.target.value))}
            aria-invalid={Boolean(errors.whatsapp)}
            aria-describedby={ids.phoneHint}
            className={`${INPUT_CLASSES} h-14 text-lg ${errors.whatsapp ? "border-danger-600" : "border-ink-300"}`}
          />
          <FieldHint id={ids.phoneHint} error={errors.whatsapp}>
            É por aqui que quem se interessar pela sala fala com você. O número só aparece quando a pessoa
            clica no botão do anúncio. Se preferir, informe depois, ao criar o anúncio.
          </FieldHint>

          {/* Consentimento separado dos Termos e desligado por padrão (LGPD, art. 8º). */}
          {whatsapp && (
          <label htmlFor={ids.showPhone} className="mt-4 flex cursor-pointer items-start gap-4 rounded-card border border-ink-200 p-4">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-ink-900">{WHATSAPP_CONSENT.label}</span>
              <span id={ids.showPhoneHint} className="mt-1 block text-sm text-ink-600">
                {WHATSAPP_CONSENT.description}
              </span>
            </span>
            <input
              id={ids.showPhone}
              name="show_whatsapp"
              type="checkbox"
              role="switch"
              defaultChecked={values?.show_whatsapp ?? false}
              aria-describedby={ids.showPhoneHint}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className="relative mt-0.5 h-8 w-13 shrink-0 rounded-full bg-ink-300 transition-colors peer-checked:bg-brand-600 peer-focus-visible:ring-3 peer-focus-visible:ring-brand-600/30 after:absolute after:top-1 after:left-1 after:size-6 after:rounded-full after:bg-white after:shadow-xs after:transition-transform peer-checked:after:translate-x-5"
            />
          </label>
          )}
        </div>

        {/* Secundário: foto e apresentação ficam recolhidas. Abrem sozinhas se já tiverem conteúdo ou erro. */}
        <details open={Boolean(avatarPath || bio || errors.bio)} className="group rounded-card border border-ink-200">
          <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 rounded-card px-4 py-3.5 [&::-webkit-details-marker]:hidden">
            <span>
              <span className="block text-sm font-bold text-ink-800">Foto e apresentação</span>
              <span className="block text-sm text-ink-500">Opcional. Você pode preencher depois, em Configurações.</span>
            </span>
            <CaretDownIcon className="size-5 shrink-0 text-ink-500 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="space-y-6 border-t border-ink-200 px-4 py-5">
          <fieldset>
            <legend className="block text-sm font-bold text-ink-800">
              Foto <span className="font-normal text-ink-500">(opcional)</span>
            </legend>
            <div className="mt-3">
              <AvatarPicker name={name} initialPath={avatarPath || null} onChange={(path) => setAvatarPath(path ?? "")} />
            </div>
          </fieldset>

          <div>
            <label htmlFor={ids.bio} className="block text-sm font-bold text-ink-800">
              Apresentação <span className="font-normal text-ink-500">(opcional)</span>
            </label>
            <textarea
              id={ids.bio}
              name="bio"
              rows={4}
              maxLength={BIO_MAX}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Ex.: Psicóloga há 8 anos. Divido meu consultório na Zona 7 nos turnos em que não atendo."
              aria-invalid={Boolean(errors.bio)}
              aria-describedby={ids.bioHint}
              className={`mt-2 w-full resize-y rounded-control border bg-white px-4 py-3 text-base leading-relaxed text-ink-900 shadow-xs outline-none transition-colors placeholder:text-ink-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15 ${
                errors.bio ? "border-danger-600" : "border-ink-300"
              }`}
            />
            <div className="flex items-start justify-between gap-4">
              <FieldHint id={ids.bioHint} error={errors.bio}>
                Aparece no seu perfil público. Não coloque telefone, e-mail, documentos nem links. Se divulgar
                serviços de saúde, valem as regras de publicidade do seu conselho.
              </FieldHint>
              <span className="mt-2 shrink-0 text-xs text-ink-500 tabular-nums">
                {bio.length}/{BIO_MAX}
              </span>
            </div>
          </div>
          </div>
        </details>

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
