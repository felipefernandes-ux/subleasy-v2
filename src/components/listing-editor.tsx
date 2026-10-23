"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeftIcon,
  CameraIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleNotchIcon,
  DotsSixVerticalIcon,
  ImageIcon,
  PencilSimpleIcon,
  TrashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { saveListing, type ListingField, type ListingFormState } from "@/app/actions/listing";
import {
  AMENITIES,
  BILLING_TYPES,
  BILLING_UNIT,
  MAX_PHOTOS,
  MIN_PHOTOS,
  PHOTO_BUCKET,
  RECOMMENDED_PHOTOS,
  SHIFTS,
  SHIFT_KEYS,
  SPACE_TYPES,
  WEEKDAYS,
  WEEKDAY_KEYS,
  amenityLabel,
  formatWhatsApp,
  photoUrl,
  type BillingType,
  type ShiftGrid,
  type SpaceType,
} from "@/lib/listing-options";
import { createClient } from "@/lib/supabase/client";
import { AiRewrite } from "./ai-rewrite";
import { AiBadge, buttonClasses } from "./ui";

export type EditableListing = {
  id: string;
  title: string;
  short_summary: string | null;
  description: string | null;
  space_type: string;
  billing_type: string;
  price: number;
  zip_code: string | null;
  city: string;
  state: string;
  neighborhood: string;
  min_rental_period: string | null;
  rules: string[];
  amenities: string[];
  shifts: ShiftGrid;
  photos: string[];
  whatsapp: string;
  street_address: string | null;
  review_note: string | null;
};

type Photo = { key: string; path: string | null; preview: string; error?: string };
type Values = {
  title: string;
  short_summary: string;
  description: string;
  space_type: string;
  billing_type: string;
  price: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  rules: string;
  min_rental_period: string;
  whatsapp: string;
};
type Errors = Partial<Record<ListingField, string>>;

const STEPS = ["Sobre a sala", "Mídia", "Localização", "Comodidades e regras", "Revisão e publicação"];

// Em qual passo cada campo vive, para levar a pessoa até o erro.
const FIELD_STEP: Record<ListingField, number> = {
  title: 0,
  short_summary: 0,
  description: 0,
  space_type: 0,
  billing_type: 0,
  price: 0,
  shifts: 0,
  photos: 1,
  zip_code: 2,
  neighborhood: 2,
  city: 2,
  state: 2,
  whatsapp: 4,
};

const PHOTO_GUIDE = ["Sala inteira", "Mesa ou maca", "Janela", "Recepção", "Corredor ou fachada", "Banheiro"];

const INPUT =
  "mt-2 w-full rounded-control border bg-white px-4 text-base text-ink-900 shadow-xs outline-none transition-colors placeholder:text-ink-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15";

/** Revisão do anúncio em 5 passos: o anfitrião confere o que a IA preencheu, adiciona fotos e envia. */
export function ListingEditor({ listing, userId }: { listing: EditableListing; userId: string }) {
  const [state, formAction, isPending] = useActionState<ListingFormState, FormData>(
    saveListing.bind(null, listing.id),
    { status: "idle" },
  );

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(() => ({
    title: listing.title,
    short_summary: listing.short_summary ?? "",
    description: listing.description ?? "",
    space_type: listing.space_type,
    billing_type: listing.billing_type,
    price: listing.price.toLocaleString("pt-BR"),
    zip_code: formatCep(listing.zip_code ?? ""),
    street: listing.street_address ?? "",
    number: "",
    complement: "",
    neighborhood: listing.neighborhood,
    city: listing.city,
    state: listing.state,
    rules: listing.rules.join("\n"),
    min_rental_period: listing.min_rental_period ?? "",
    whatsapp: formatWhatsApp(listing.whatsapp),
  }));
  const [photos, setPhotos] = useState<Photo[]>(() =>
    listing.photos.map((path) => ({ key: path, path, preview: photoUrl(path) })),
  );
  const [shifts, setShifts] = useState<ShiftGrid>(listing.shifts);
  const [amenities, setAmenities] = useState<string[]>(listing.amenities);
  // Campos que a pessoa editou à mão: o selo "Sugestão" sai deles.
  const [edited, setEdited] = useState<Set<string>>(new Set());
  const [clientErrors, setClientErrors] = useState<Errors>({});

  const serverErrors = state.status === "error" ? state.fields : {};
  const errors = { ...serverErrors, ...clientErrors };
  const set = (field: keyof Values, value: string, manual = true) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (manual) setEdited((current) => (current.has(field) ? current : new Set(current).add(field)));
    setClientErrors((current) => ({ ...current, [field]: undefined }));
  };
  const suggested = (field: string, hasValue: boolean) => hasValue && !edited.has(field);

  const uploading = photos.some((photo) => !photo.path && !photo.error);
  const ready = photos.filter((photo) => photo.path);
  const shiftCount = Object.values(shifts).reduce((sum, list) => sum + (list?.length ?? 0), 0);
  const streetAddress = [values.street.trim(), values.number.trim()].filter(Boolean).join(", ") + (values.complement.trim() ? ` - ${values.complement.trim()}` : "");

  // Erro do servidor: abre o passo do primeiro campo marcado (ajuste durante a renderização,
  // quando chega um resultado novo) e rola até o topo do formulário.
  const topRef = useRef<HTMLDivElement>(null);
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    const fields = state.status === "error" ? (Object.keys(state.fields) as ListingField[]) : [];
    if (fields.length > 0) setStep(Math.min(...fields.map((field) => FIELD_STEP[field])));
  }
  useEffect(() => {
    if (state.status === "error") topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state]);

  function goTo(next: number) {
    setStep(next);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  // Confere só o passo atual antes de avançar. O servidor confere tudo de novo no envio.
  function validate(current: number): Errors {
    const found: Errors = {};
    if (current === 0) {
      const title = values.title.trim();
      if (title.length < 10 || title.length > 70) found.title = "O título precisa ter entre 10 e 70 caracteres.";
      if (values.description.trim().length < 40) found.description = "Escreva uma descrição com pelo menos 40 caracteres.";
      if (!(parsePrice(values.price) >= 10)) found.price = "Informe o preço em reais, a partir de R$ 10.";
      if (shiftCount === 0) found.shifts = "Marque pelo menos um turno livre.";
    }
    if (current === 1 && ready.length < MIN_PHOTOS) found.photos = `Adicione pelo menos ${MIN_PHOTOS} fotos da sala.`;
    if (current === 2) {
      if (values.zip_code && !/^\d{5}-\d{3}$/.test(values.zip_code)) found.zip_code = "Digite o CEP no formato 00000-000.";
      if (!values.neighborhood.trim()) found.neighborhood = "Informe o bairro.";
      if (!values.city.trim()) found.city = "Informe a cidade.";
      if (!/^[A-Za-z]{2}$/.test(values.state.trim())) found.state = "Informe a UF com 2 letras, como PR.";
    }
    return found;
  }

  function next() {
    const found = validate(step);
    setClientErrors(found);
    if (Object.keys(found).length === 0) goTo(step + 1);
  }

  const facts = [
    `Tipo: ${SPACE_TYPES[values.space_type as SpaceType] ?? values.space_type}`,
    `Preço: R$ ${values.price} por ${BILLING_UNIT[values.billing_type as BillingType] ?? values.billing_type}`,
    `Local: ${values.neighborhood}, ${values.city} - ${values.state}`,
    `Turnos livres: ${describeShifts(shifts) || "não informado"}`,
    amenities.length > 0 && `Comodidades: ${amenities.map(amenityLabel).join(", ")}`,
    values.rules.trim() && `Regras: ${values.rules.trim().replace(/\n/g, "; ")}`,
    values.min_rental_period && `Período mínimo: ${values.min_rental_period}`,
    `Descrição atual: ${values.description}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <form
      noValidate
      className="pb-40"
      // Sem action={}: o React limparia os campos a cada envio. O botão clicado (intent) vai pelo submitter.
      onSubmit={(event) => {
        event.preventDefault();
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        // Enviar para revisão só vale no último passo (Enter num campo não pula etapas).
        if (submitter?.value !== "save" && step !== STEPS.length - 1) return;
        const formData = new FormData(event.currentTarget, submitter);
        startTransition(() => formAction(formData));
      }}
    >
      <div ref={topRef} className="scroll-mt-6" />
      <input type="hidden" name="photos" value={JSON.stringify(ready.map((photo) => photo.path))} />
      <input type="hidden" name="street_address" value={streetAddress} />

      <Stepper step={step} onSelect={goTo} />

      {listing.review_note && (
        <div className="mb-6 rounded-card bg-warning-500/10 p-5 ring-1 ring-warning-500/30">
          <p className="flex items-center gap-2 font-bold text-ink-900">
            <WarningCircleIcon className="size-5 text-warning-500" weight="fill" aria-hidden />
            A equipe do Subleasy pediu um ajuste
          </p>
          <p className="mt-2 text-ink-700">{listing.review_note}</p>
        </div>
      )}
      {state.status === "error" && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-card bg-danger-600/6 p-4 text-ink-800 ring-1 ring-danger-600/20">
          <WarningCircleIcon className="mt-0.5 size-5 shrink-0 text-danger-600" weight="fill" aria-hidden />
          {state.error}
        </div>
      )}
      {state.status === "saved" && (
        <p role="status" className="mb-6 flex items-center gap-2 rounded-card bg-mint-50 p-4 text-ink-800 ring-1 ring-mint-500/30">
          <CheckCircleIcon className="size-5 text-mint-700" weight="fill" aria-hidden />
          Rascunho salvo. Você pode voltar e terminar depois.
        </p>
      )}

      {/* Todos os passos ficam montados (hidden) para o formulário enviar todos os campos. */}
      <div hidden={step !== 0} className="space-y-6">
        <Section title="Sobre a sala" description="A IA escreveu a partir do seu texto. Ajuste à mão ou peça para ela reescrever.">
          <Field
            label="Título"
            error={errors.title}
            badge={suggested("title", Boolean(listing.title))}
            counter={`${values.title.length}/70`}
            tool={<AiRewrite field="title" value={values.title} facts={facts} onApply={(text) => set("title", text, false)} />}
          >
            {(props) => (
              <input {...props} name="title" type="text" maxLength={70} value={values.title} onChange={(event) => set("title", event.target.value)} className={`${INPUT} h-12 ${props.className}`} />
            )}
          </Field>
          <Field
            label="Resumo"
            hint="Aparece nos cards e na prévia do link no WhatsApp."
            error={errors.short_summary}
            badge={suggested("short_summary", Boolean(listing.short_summary))}
            counter={`${values.short_summary.length}/120`}
            tool={<AiRewrite field="short_summary" value={values.short_summary} facts={facts} onApply={(text) => set("short_summary", text, false)} />}
          >
            {(props) => (
              <input {...props} name="short_summary" type="text" maxLength={120} value={values.short_summary} onChange={(event) => set("short_summary", event.target.value)} className={`${INPUT} h-12 ${props.className}`} />
            )}
          </Field>
          <Field
            label="Descrição"
            hint="Para quem a sala serve, o que tem dentro, o que o prédio oferece e como funciona a locação."
            error={errors.description}
            badge={suggested("description", Boolean(listing.description))}
            tool={<AiRewrite field="description" value={values.description} facts={facts} onApply={(text) => set("description", text, false)} />}
          >
            {(props) => (
              <textarea {...props} name="description" rows={7} value={values.description} onChange={(event) => set("description", event.target.value)} className={`${INPUT} py-3 leading-relaxed ${props.className}`} />
            )}
          </Field>
          <Field label="Tipo de sala" error={errors.space_type} badge={suggested("space_type", true)}>
            {(props) => (
              <select {...props} name="space_type" value={values.space_type} onChange={(event) => set("space_type", event.target.value)} className={`${INPUT} h-12 ${props.className}`}>
                {Object.entries(SPACE_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </Section>

        <Section title="Preço e turnos" description="O valor e os horários que aparecem no anúncio.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Forma de cobrança" error={errors.billing_type}>
              {(props) => (
                <select {...props} name="billing_type" value={values.billing_type} onChange={(event) => set("billing_type", event.target.value)} className={`${INPUT} h-12 ${props.className}`}>
                  {Object.entries(BILLING_TYPES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Preço" error={errors.price}>
              {(props) => (
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-4 mt-1 -translate-y-1/2 text-ink-500">R$</span>
                  <input {...props} name="price" type="text" inputMode="decimal" value={values.price} onChange={(event) => set("price", event.target.value)} className={`${INPUT} h-12 pl-11 ${props.className}`} />
                </div>
              )}
            </Field>
          </div>
          <div>
            <p className="text-sm font-bold text-ink-800">Turnos livres</p>
            <p className="mt-1 text-sm text-ink-500">Toque nos turnos em que a sala fica livre durante a semana.</p>
            <div className="mt-3">
              <ShiftPicker
                shifts={shifts}
                setShifts={(update) => {
                  setShifts(update);
                  setClientErrors((current) => ({ ...current, shifts: undefined }));
                }}
                error={errors.shifts}
              />
            </div>
          </div>
        </Section>
      </div>

      <div hidden={step !== 1}>
        <Section title="Mídia" description={`Envie pelo menos ${MIN_PHOTOS} fotos. O ideal são ${RECOMMENDED_PHOTOS}. A primeira é a capa do anúncio.`}>
          <PhotoManager
            photos={photos}
            setPhotos={(update) => {
              setPhotos(update);
              setClientErrors((current) => ({ ...current, photos: undefined }));
            }}
            userId={userId}
            listingId={listing.id}
            error={errors.photos}
          />
        </Section>
      </div>

      <div hidden={step !== 2}>
        <Section title="Localização" description="Digite o CEP e o endereço se completa sozinho. O anúncio mostra só bairro e cidade.">
          <AddressFields values={values} set={set} errors={errors} />
        </Section>
      </div>

      <div hidden={step !== 3}>
        <Section title="Comodidades e regras" description="Marque só o que a sala tem de verdade.">
          <fieldset>
            <legend className="flex items-center gap-2 text-sm font-bold text-ink-800">
              Comodidades
              {suggested("amenities", listing.amenities.length > 0) && <AiBadge />}
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {[...new Set([...Object.keys(AMENITIES), ...listing.amenities])].map((key) => {
                const checked = amenities.includes(key);
                return (
                  <label
                    key={key}
                    className={`flex h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm ring-1 transition-colors focus-within:ring-2 focus-within:ring-brand-600/40 ${
                      checked ? "bg-brand-50 font-bold text-brand-800 ring-brand-300" : "bg-white text-ink-700 ring-ink-300 hover:ring-ink-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="amenity"
                      value={key}
                      checked={checked}
                      onChange={() => {
                        setEdited((current) => new Set(current).add("amenities"));
                        setAmenities((current) => (checked ? current.filter((item) => item !== key) : [...current, key]));
                      }}
                      className="sr-only"
                    />
                    {checked && <CheckIcon className="size-4 text-brand-600" weight="bold" aria-hidden />}
                    {amenityLabel(key)}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <Field label="Regras de uso" hint="Uma regra por linha." badge={suggested("rules", listing.rules.length > 0)} optional>
            {(props) => (
              <textarea
                {...props}
                name="rules"
                rows={4}
                value={values.rules}
                onChange={(event) => set("rules", event.target.value)}
                placeholder={"Sem procedimentos invasivos\nDeixar a sala como encontrou"}
                className={`${INPUT} py-3 leading-relaxed ${props.className}`}
              />
            )}
          </Field>
          <Field label="Período mínimo" hint="Ex.: 1 turno por semana, 3 meses." optional>
            {(props) => (
              <input {...props} name="min_rental_period" type="text" value={values.min_rental_period} onChange={(event) => set("min_rental_period", event.target.value)} className={`${INPUT} h-12 ${props.className}`} />
            )}
          </Field>
        </Section>
      </div>

      <div hidden={step !== 4} className="space-y-6">
        <ReviewSummary values={values} photos={ready} shifts={shifts} amenities={amenities} onEdit={goTo} />
        <Section title="Contato" description="Quem se interessar fala com você por este número.">
          <Field label="WhatsApp" hint="O número só aparece quando a pessoa clica em Falar no WhatsApp." error={errors.whatsapp}>
            {(props) => (
              <input
                {...props}
                name="whatsapp"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(44) 99999-9999"
                value={values.whatsapp}
                onChange={(event) => set("whatsapp", formatPhoneInput(event.target.value))}
                className={`${INPUT} h-12 ${props.className}`}
              />
            )}
          </Field>
        </Section>
      </div>

      <ActionBar step={step} isPending={isPending} uploading={uploading} onBack={() => goTo(step - 1)} onNext={next} />
    </form>
  );
}

// ── Navegação ──────────────────────────────────────────────

function Stepper({ step, onSelect }: { step: number; onSelect: (step: number) => void }) {
  return (
    <nav aria-label="Passos do anúncio" className="mb-6">
      <p className="text-sm text-ink-600 sm:hidden">
        Passo {step + 1} de {STEPS.length} · <strong className="font-bold text-ink-900">{STEPS[step]}</strong>
      </p>
      <ol className="mt-3 grid grid-cols-5 gap-1.5 sm:mt-0 sm:gap-2">
        {STEPS.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={index === step ? "step" : undefined}
              className="focus-ring group block w-full rounded-sm text-left"
            >
              <span className={`block h-1.5 rounded-full transition-colors ${index <= step ? "bg-brand-600" : "bg-ink-200 group-hover:bg-ink-300"}`} />
              <span className={`mt-2 hidden text-sm sm:block ${index === step ? "font-bold text-ink-900" : "text-ink-500"}`}>{label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function ActionBar({
  step,
  isPending,
  uploading,
  onBack,
  onNext,
}: {
  step: number;
  isPending: boolean;
  uploading: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const last = step === STEPS.length - 1;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-5 py-3 sm:px-8 sm:py-4">
        {step > 0 && (
          <button type="button" onClick={onBack} className={`${buttonClasses("ghost")} max-sm:px-3`}>
            <ArrowLeftIcon className="size-4" aria-hidden />
            <span className="max-sm:sr-only">Voltar</span>
          </button>
        )}
        <span className="flex-1 text-sm text-ink-500" aria-live="polite">
          {uploading ? "Enviando fotos…" : null}
        </span>
        <button type="submit" name="intent" value="save" disabled={isPending || uploading} className={`${buttonClasses("secondary")} disabled:opacity-60 max-sm:px-3`}>
          Salvar <span className="max-sm:hidden">rascunho</span>
        </button>
        {last ? (
          // key diferente: sem ela, o React reaproveitaria o botão "Continuar", trocaria o
          // type para submit durante o clique e o anúncio seria enviado sem querer.
          <button key="submit" type="submit" name="intent" value="submit" disabled={isPending || uploading} className={`${buttonClasses("primary")} disabled:cursor-wait disabled:bg-brand-500`}>
            {isPending && <CircleNotchIcon className="size-4.5 animate-spin" weight="bold" aria-hidden />}
            Enviar para revisão
          </button>
        ) : (
          <button key="next" type="button" onClick={onNext} disabled={uploading && step === 1} className={`${buttonClasses("primary")} disabled:opacity-60`}>
            Continuar
          </button>
        )}
      </div>
    </div>
  );
}

// ── Peças ──────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-panel bg-white p-5 shadow-card ring-1 ring-ink-900/6 sm:p-8">
      <h2 className="text-h3 font-bold text-ink-900">{title}</h2>
      <p className="mt-1 text-sm text-ink-600">{description}</p>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

type FieldProps = { id: string; "aria-invalid": boolean; "aria-describedby"?: string; className: string };

function Field({
  label,
  hint,
  error,
  badge,
  counter,
  optional,
  tool,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  badge?: boolean;
  counter?: string;
  optional?: boolean;
  tool?: ReactNode;
  children: (props: FieldProps) => ReactNode;
}) {
  const id = useId();
  const hintId = useId();
  return (
    <div>
      <div className="flex min-h-8 items-center justify-between gap-3">
        <label htmlFor={id} className="flex items-center gap-2 text-sm font-bold text-ink-800">
          {label}
          {optional && <span className="font-normal text-ink-500">(opcional)</span>}
          {badge && <AiBadge />}
        </label>
        <span className="flex items-center gap-3">
          {counter && <span className="text-xs text-ink-500 tabular-nums">{counter}</span>}
          {tool}
        </span>
      </div>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": hint || error ? hintId : undefined,
        className: error ? "border-danger-600" : "border-ink-300",
      })}
      {(error || hint) && (
        <p id={hintId} role={error ? "alert" : undefined} className={`mt-2 text-sm ${error ? "text-danger-600" : "text-ink-500"}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

function ShiftPicker({
  shifts,
  setShifts,
  error,
}: {
  shifts: ShiftGrid;
  setShifts: (update: (current: ShiftGrid) => ShiftGrid) => void;
  error?: string;
}) {
  return (
    <div>
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <table className="w-full min-w-[30rem] border-separate border-spacing-1.5">
          <thead>
            <tr>
              <th className="w-16" />
              {WEEKDAY_KEYS.map((day) => (
                <th key={day} scope="col" className="text-center text-xs font-bold text-ink-600">
                  {WEEKDAYS[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFT_KEYS.map((shift) => (
              <tr key={shift}>
                <th scope="row" className="pr-1 text-left text-xs font-bold text-ink-600">
                  {SHIFTS[shift]}
                </th>
                {WEEKDAY_KEYS.map((day) => {
                  const on = shifts[day]?.includes(shift) ?? false;
                  return (
                    <td key={day}>
                      {on && <input type="hidden" name="shift" value={`${day}:${shift}`} />}
                      <button
                        type="button"
                        aria-pressed={on}
                        aria-label={`${WEEKDAYS[day]}, ${SHIFTS[shift]}`}
                        onClick={() =>
                          setShifts((current) => {
                            const list = current[day] ?? [];
                            return { ...current, [day]: on ? list.filter((item) => item !== shift) : [...list, shift] };
                          })
                        }
                        className={`focus-ring grid h-11 w-full place-items-center rounded-control transition-colors ${
                          on ? "bg-brand-600 text-white hover:bg-brand-500" : "bg-ink-100 text-ink-400 hover:bg-ink-200"
                        }`}
                      >
                        {on ? <CheckIcon className="size-4.5" weight="bold" aria-hidden /> : <span className="size-1.5 rounded-full bg-current" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}

function AddressFields({
  values,
  set,
  errors,
}: {
  values: Values;
  set: (field: keyof Values, value: string, manual?: boolean) => void;
  errors: Errors;
}) {
  const [lookup, setLookup] = useState<"idle" | "loading" | "found" | "missing">("idle");
  const lastCep = useRef("");
  const numberRef = useRef<HTMLInputElement>(null);

  // CEP completo: busca rua, bairro, cidade e UF no ViaCEP e leva o foco para o número.
  async function findCep(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8 || digits === lastCep.current) return;
    lastCep.current = digits;
    setLookup("loading");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = (await response.json()) as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (data.erro) {
        setLookup("missing");
        return;
      }
      if (data.logradouro) set("street", data.logradouro);
      if (data.bairro) set("neighborhood", data.bairro);
      if (data.localidade) set("city", data.localidade);
      if (data.uf) set("state", data.uf);
      setLookup("found");
      numberRef.current?.focus();
    } catch {
      setLookup("missing");
    }
  }

  return (
    <>
      <Field
        label="CEP"
        error={errors.zip_code}
        hint={
          lookup === "loading"
            ? "Buscando endereço…"
            : lookup === "found"
              ? "Endereço encontrado. Confira e complete com o número."
              : lookup === "missing"
                ? "Não achamos este CEP. Preencha o endereço abaixo."
                : undefined
        }
      >
        {(props) => (
          <div className="relative sm:w-56">
            <input
              {...props}
              name="zip_code"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              value={values.zip_code}
              onChange={(event) => {
                const cep = formatCep(event.target.value);
                set("zip_code", cep);
                findCep(cep);
              }}
              className={`${INPUT} h-12 ${props.className}`}
            />
            {lookup === "loading" && <CircleNotchIcon className="absolute top-1/2 right-4 mt-1 size-4.5 -translate-y-1/2 animate-spin text-brand-600" aria-hidden />}
          </div>
        )}
      </Field>
      <div className="grid gap-5 sm:grid-cols-[1fr_10rem]">
        <Field label="Rua" hint="Não aparece no anúncio." optional>
          {(props) => (
            <input {...props} type="text" autoComplete="address-line1" value={values.street} onChange={(event) => set("street", event.target.value)} className={`${INPUT} h-12 ${props.className}`} />
          )}
        </Field>
        <Field label="Número" optional>
          {(props) => (
            <input {...props} ref={numberRef} type="text" inputMode="numeric" value={values.number} onChange={(event) => set("number", event.target.value)} className={`${INPUT} h-12 ${props.className}`} />
          )}
        </Field>
      </div>
      <Field label="Complemento" optional>
        {(props) => (
          <input {...props} type="text" autoComplete="address-line2" placeholder="Sala, andar, bloco" value={values.complement} onChange={(event) => set("complement", event.target.value)} className={`${INPUT} h-12 ${props.className}`} />
        )}
      </Field>
      <Field label="Bairro" error={errors.neighborhood}>
        {(props) => (
          <input {...props} name="neighborhood" type="text" value={values.neighborhood} onChange={(event) => set("neighborhood", event.target.value)} className={`${INPUT} h-12 ${props.className}`} />
        )}
      </Field>
      <div className="grid gap-5 sm:grid-cols-[1fr_6rem]">
        <Field label="Cidade" error={errors.city}>
          {(props) => (
            <input {...props} name="city" type="text" autoComplete="address-level2" value={values.city} onChange={(event) => set("city", event.target.value)} className={`${INPUT} h-12 ${props.className}`} />
          )}
        </Field>
        <Field label="UF" error={errors.state}>
          {(props) => (
            <input {...props} name="state" type="text" maxLength={2} autoComplete="address-level1" value={values.state} onChange={(event) => set("state", event.target.value.toUpperCase())} className={`${INPUT} h-12 uppercase ${props.className}`} />
          )}
        </Field>
      </div>
    </>
  );
}

// ── Fotos ──────────────────────────────────────────────────

function PhotoManager({
  photos,
  setPhotos,
  userId,
  listingId,
  error,
}: {
  photos: Photo[];
  setPhotos: (update: (current: Photo[]) => Photo[]) => void;
  userId: string;
  listingId: string;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // id estável: sem ele a dnd-kit gera ids diferentes no servidor e no navegador (erro de hidratação).
  const dndId = useId();
  const room = MAX_PHOTOS - photos.length;
  // Mouse arrasta após 6 px; no toque, segurar 200 ms para não brigar com a rolagem.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const supabase = createClient();
    const picked = Array.from(files).slice(0, Math.max(room, 0));
    const items = picked.map((file) => ({ file, photo: { key: crypto.randomUUID(), path: null, preview: URL.createObjectURL(file) } as Photo }));
    setPhotos((current) => [...current, ...items.map((item) => item.photo)]);

    await Promise.all(
      items.map(async ({ file, photo }) => {
        const update = (patch: Partial<Photo>) =>
          setPhotos((current) => current.map((item) => (item.key === photo.key ? { ...item, ...patch } : item)));
        try {
          const blob = await compressPhoto(file);
          const extension = blob.type === "image/webp" ? "webp" : "jpg";
          const path = `${userId}/${listingId}/${photo.key}.${extension}`;
          const { error: uploadError } = await supabase.storage
            .from(PHOTO_BUCKET)
            .upload(path, blob, { contentType: blob.type, cacheControl: "31536000" });
          if (uploadError) throw uploadError;
          update({ path });
        } catch (uploadError) {
          console.error("[PhotoManager]", uploadError);
          update({ error: "Não foi possível enviar. Use uma foto JPG, PNG ou WebP." });
        }
      }),
    );
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setPhotos((current) => {
      const from = current.findIndex((photo) => photo.key === active.id);
      const to = current.findIndex((photo) => photo.key === over.id);
      return arrayMove(current, from, to);
    });
  }

  return (
    <div>
      <ul className="flex flex-wrap gap-2" aria-label="O que fotografar">
        {PHOTO_GUIDE.map((item) => (
          <li key={item} className="rounded-full bg-ink-100 px-3 py-1 text-xs text-ink-700">
            {item}
          </li>
        ))}
      </ul>

      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={photos.map((photo) => photo.key)} strategy={rectSortingStrategy}>
          <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo, index) => (
              <SortablePhoto
                key={photo.key}
                photo={photo}
                index={index}
                onRemove={() => setPhotos((current) => current.filter((item) => item.key !== photo.key))}
              />
            ))}
            {room > 0 && (
              <li className="aspect-[4/3]">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className={`focus-ring flex size-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed text-sm font-bold transition-colors ${
                    error ? "border-danger-600/50 text-danger-600" : "border-brand-200 text-brand-700 hover:border-brand-400 hover:bg-brand-50"
                  }`}
                >
                  {photos.length === 0 ? <CameraIcon className="size-7" aria-hidden /> : <ImageIcon className="size-7" aria-hidden />}
                  {photos.length === 0 ? "Adicionar fotos" : "Adicionar mais"}
                </button>
              </li>
            )}
          </ol>
        </SortableContext>
      </DndContext>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <p className={`mt-3 text-sm ${error ? "text-danger-600" : "text-ink-500"}`} role={error ? "alert" : undefined}>
        {error ??
          (photos.length > 1
            ? `Arraste as fotos para mudar a ordem. ${photos.filter((photo) => photo.path).length} de ${MIN_PHOTOS} obrigatórias, até ${MAX_PHOTOS}.`
            : `${photos.filter((photo) => photo.path).length} de ${MIN_PHOTOS} fotos obrigatórias. Até ${MAX_PHOTOS} no total.`)}
      </p>
    </div>
  );
}

function SortablePhoto({ photo, index, onRemove }: { photo: Photo; index: number; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.key, disabled: !photo.path });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative aspect-[4/3] touch-manipulation overflow-hidden rounded-card bg-ink-100 ring-1 ring-ink-200 ${
        isDragging ? "z-10 scale-[1.03] shadow-raised ring-2 ring-brand-600" : ""
      } ${photo.path ? "cursor-grab active:cursor-grabbing" : ""}`}
      {...attributes}
      {...listeners}
      aria-label={`Foto ${index + 1}${index === 0 ? ", capa" : ""}. Arraste para mudar a ordem.`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:) antes do upload */}
      <img src={photo.preview} alt="" draggable={false} className={`pointer-events-none size-full object-cover select-none ${photo.path ? "" : "opacity-60"}`} />
      {index === 0 && photo.path && <span className="absolute top-2 left-2 rounded-full bg-ink-900/80 px-2.5 py-1 text-xs font-bold text-white">Capa</span>}
      {photo.path && (
        <span className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-white/90 text-ink-600" aria-hidden>
          <DotsSixVerticalIcon className="size-4" weight="bold" />
        </span>
      )}
      {!photo.path && !photo.error && (
        <span className="absolute inset-0 grid place-items-center">
          <CircleNotchIcon className="size-7 animate-spin text-brand-600" weight="bold" aria-label="Enviando foto" />
        </span>
      )}
      {photo.error && <span className="absolute inset-0 grid place-items-center bg-white/90 p-3 text-center text-xs text-danger-600">{photo.error}</span>}
      {(photo.path || photo.error) && (
        <button
          type="button"
          aria-label={`Remover a foto ${index + 1}`}
          title="Remover"
          // O clique no botão não pode começar um arraste.
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onClick={onRemove}
          className="focus-ring absolute right-2 bottom-2 grid size-9 place-items-center rounded-full bg-white/95 text-ink-800 shadow-xs hover:bg-white"
        >
          <TrashIcon className="size-4" weight="bold" />
        </button>
      )}
    </li>
  );
}

// ── Revisão ────────────────────────────────────────────────

function ReviewSummary({
  values,
  photos,
  shifts,
  amenities,
  onEdit,
}: {
  values: Values;
  photos: Photo[];
  shifts: ShiftGrid;
  amenities: string[];
  onEdit: (step: number) => void;
}) {
  const rules = values.rules.split("\n").map((line) => line.trim()).filter(Boolean);
  return (
    <section className="overflow-hidden rounded-panel bg-white shadow-card ring-1 ring-ink-900/6">
      {photos[0] && (
        <div className="relative aspect-[16/7] bg-ink-100">
          {/* eslint-disable-next-line @next/next/no-img-element -- capa já enviada ao Storage */}
          <img src={photos[0].preview} alt="Capa do anúncio" className="size-full object-cover" />
          <span className="absolute bottom-3 left-3 rounded-full bg-ink-900/80 px-2.5 py-1 text-xs font-bold text-white">
            {photos.length} {photos.length === 1 ? "foto" : "fotos"}
          </span>
        </div>
      )}
      <div className="divide-y divide-ink-200 px-5 sm:px-8">
        <SummaryRow title="Sobre a sala" onEdit={() => onEdit(0)}>
          <p className="font-bold text-ink-900">{values.title}</p>
          {values.short_summary && <p className="mt-1">{values.short_summary}</p>}
          <p className="mt-2 text-ink-500">
            {SPACE_TYPES[values.space_type as SpaceType]} · R$ {values.price} por {BILLING_UNIT[values.billing_type as BillingType]}
          </p>
          <p className="mt-1 text-ink-500">Turnos: {describeShifts(shifts) || "nenhum marcado"}</p>
        </SummaryRow>
        <SummaryRow title="Mídia" onEdit={() => onEdit(1)}>
          {photos.length >= MIN_PHOTOS ? `${photos.length} fotos. A primeira é a capa.` : `Faltam ${MIN_PHOTOS - photos.length} fotos.`}
        </SummaryRow>
        <SummaryRow title="Localização" onEdit={() => onEdit(2)}>
          {values.neighborhood}, {values.city} - {values.state}
          {values.zip_code && <span className="text-ink-500"> · CEP {values.zip_code}</span>}
        </SummaryRow>
        <SummaryRow title="Comodidades e regras" onEdit={() => onEdit(3)}>
          {amenities.length > 0 ? amenities.map(amenityLabel).join(", ") : "Nenhuma comodidade marcada."}
          {rules.length > 0 && <p className="mt-1 text-ink-500">Regras: {rules.join("; ")}</p>}
        </SummaryRow>
      </div>
    </section>
  );
}

function SummaryRow({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-5">
      <div className="min-w-0 text-sm text-ink-700">
        <p className="mb-1 text-xs font-bold tracking-wide text-ink-500 uppercase">{title}</p>
        {children}
      </div>
      <button type="button" onClick={onEdit} className={`${buttonClasses("ghost")} shrink-0 max-sm:px-3`}>
        <PencilSimpleIcon className="size-4" aria-hidden />
        <span className="max-sm:sr-only">Editar</span>
      </button>
    </div>
  );
}

// ── Utilitários ────────────────────────────────────────────

function describeShifts(shifts: ShiftGrid) {
  return WEEKDAY_KEYS.flatMap((day) => (shifts[day] ?? []).map((shift) => `${WEEKDAYS[day]} ${SHIFTS[shift].toLowerCase()}`)).join(", ");
}

// Reduz para no máximo 1920 px no lado maior. Fotos de celular chegam com 4 a 8 MB.
async function compressPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const toBlob = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  // Safari antigo não gera WebP e devolve PNG; nesse caso, JPEG.
  const webp = await toBlob("image/webp");
  if (webp?.type === "image/webp") return webp;
  const jpeg = await toBlob("image/jpeg");
  if (!jpeg) throw new Error("Não foi possível converter a foto");
  return jpeg;
}

function parsePrice(raw: string) {
  const clean = raw.replace(/[^\d.,]/g, "");
  if (!clean) return Number.NaN;
  return Number(clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : /\.\d{3}$/.test(clean) ? clean.replace(/\./g, "") : clean);
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  const rest = digits.slice(2);
  const split = rest.length > 8 ? 5 : 4;
  if (rest.length <= split) return `(${digits.slice(0, 2)}) ${rest}`;
  return `(${digits.slice(0, 2)}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}
