"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeftIcon, CheckCircleIcon, CircleNotchIcon, PencilSimpleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { saveListing, type ListingField, type ListingFormState } from "@/app/actions/listing";
import {
  AMENITIES,
  BILLING_TYPES,
  BILLING_UNIT,
  MAX_PHOTOS,
  MIN_PHOTOS,
  SPACE_TYPES,
  UFS,
  amenityLabel,
  formatWhatsApp,
  photoUrl,
  type BillingType,
  type PhotoSizes,
  type SpaceType,
} from "@/lib/listing-options";
import { AiRewrite } from "./ai-rewrite";
import {
  AMENITY_ICONS,
  AddressFields,
  Field,
  INPUT,
  PhotoCarousel,
  PhotoManager,
  formatCep,
  formatMoneyInput,
  formatPhoneInput,
  moneyFromNumber,
  parsePrice,
  usePhotoSizes,
  type Photo,
} from "./listing-fields";
import { AiHint, buttonClasses } from "./ui";

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
  photos: string[];
  photo_sizes: PhotoSizes;
  whatsapp: string;
  contact_email: string;
  street_address: string | null;
  review_note: string | null;
};

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
  contact_email: string;
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
  photos: 1,
  zip_code: 2,
  neighborhood: 2,
  city: 2,
  state: 2,
  whatsapp: 4,
  contact_email: 4,
};

/** Revisão do anúncio em 5 passos: o anfitrião confere o que a IA preencheu, adiciona fotos e envia. */
/**
 * Com published, edita um anúncio que já estava no ar: não há rascunho, e as
 * alterações voltam para a revisão da equipe antes de aparecerem.
 */
export function ListingEditor({ listing, userId, published = false }: { listing: EditableListing; userId: string; published?: boolean }) {
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
    price: moneyFromNumber(listing.price),
    zip_code: formatCep(listing.zip_code ?? ""),
    street: listing.street_address ?? "",
    number: "",
    complement: "",
    neighborhood: listing.neighborhood,
    city: listing.city,
    state: listing.state.trim().toUpperCase(),
    rules: listing.rules.join("\n"),
    min_rental_period: listing.min_rental_period ?? "",
    whatsapp: formatWhatsApp(listing.whatsapp),
    contact_email: listing.contact_email,
  }));
  const [photos, setPhotos] = useState<Photo[]>(() =>
    listing.photos.map((path) => ({ key: path, path, preview: photoUrl(path), size: listing.photo_sizes[path] })),
  );
  const [amenities, setAmenities] = useState<string[]>(listing.amenities);
  // Campos que a pessoa editou à mão: o ícone da IA sai deles.
  const [edited, setEdited] = useState<Set<string>>(new Set());
  const [clientErrors, setClientErrors] = useState<Errors>({});

  const serverErrors = state.status === "error" ? state.fields : {};
  const errors = { ...serverErrors, ...clientErrors };
  const set = (field: keyof Values, value: string, manual = true) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (manual) setEdited((current) => (current.has(field) ? current : new Set(current).add(field)));
    setClientErrors((current) => ({ ...current, [field]: undefined }));
  };
  // Texto do tooltip quando o campo ainda tem o que a IA preencheu.
  const suggested = (field: string, hasValue: boolean, tip: string) => (!published && hasValue && !edited.has(field) ? tip : undefined);

  usePhotoSizes(photos, setPhotos);

  const uploading = photos.some((photo) => !photo.path && !photo.error);
  const ready = photos.filter((photo) => photo.path);
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
    }
    if (current === 2) {
      if (values.zip_code && !/^\d{5}-\d{3}$/.test(values.zip_code)) found.zip_code = "Digite o CEP no formato 00000-000.";
      if (!values.neighborhood.trim()) found.neighborhood = "Informe o bairro.";
      if (!values.city.trim()) found.city = "Informe a cidade.";
      if (!UFS.includes(values.state as (typeof UFS)[number])) found.state = "Escolha a UF.";
    }
    return found;
  }

  function next() {
    const found = validate(step);
    setClientErrors(found);
    if (Object.keys(found).length === 0) goTo(step + 1);
  }

  const amenitiesTip = suggested("amenities", listing.amenities.length > 0, "Comodidades marcadas pela IA a partir do seu texto.");
  const facts = [
    `Área de atuação: ${SPACE_TYPES[values.space_type as SpaceType] ?? values.space_type}`,
    `Preço: R$ ${values.price} por ${BILLING_UNIT[values.billing_type as BillingType] ?? values.billing_type}`,
    `Local: ${values.neighborhood}, ${values.city} - ${values.state}`,
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
      <input type="hidden" name="photo_sizes" value={JSON.stringify(Object.fromEntries(ready.filter((photo) => photo.size).map((photo) => [photo.path, photo.size])))} />
      <input type="hidden" name="street_address" value={streetAddress} />

      <Stepper step={step} onSelect={goTo} />

      {published && (
        <div className="mb-6 flex items-start gap-2 rounded-card bg-brand-50 p-4 text-sm text-ink-800 ring-1 ring-brand-100">
          <WarningCircleIcon className="mt-0.5 size-5 shrink-0 text-brand-600" weight="fill" aria-hidden />
          <p>
            <strong className="font-bold text-ink-900">As alterações passam por revisão.</strong> Ao enviar, o anúncio sai do ar até a equipe do
            Subleasy aprovar as mudanças, em até 1 dia útil. A data de publicação e o prazo continuam os mesmos.
          </p>
        </div>
      )}

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
        <Section title="Sobre a sala" description={published ? "Título, resumo e descrição. Ajuste à mão ou peça para a IA reescrever." : "A IA escreveu a partir do seu texto. Ajuste à mão ou peça para ela reescrever."}>
          <Field
            label="Título"
            error={errors.title}
            badge={suggested("title", Boolean(listing.title), "Título sugerido pela IA a partir do seu texto.")}
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
            badge={suggested("short_summary", Boolean(listing.short_summary), "Resumo sugerido pela IA a partir do seu texto.")}
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
            badge={suggested("description", Boolean(listing.description), "Descrição sugerida pela IA a partir do seu texto.")}
            tool={<AiRewrite field="description" value={values.description} facts={facts} onApply={(text) => set("description", text, false)} />}
          >
            {(props) => (
              <textarea {...props} name="description" rows={7} value={values.description} onChange={(event) => set("description", event.target.value)} className={`${INPUT} py-3 leading-relaxed ${props.className}`} />
            )}
          </Field>
          <Field
            label="Área de atuação"
            hint="O público para quem a sala é indicada."
            error={errors.space_type}
            badge={suggested("space_type", true, "Área sugerida pela IA a partir do seu texto.")}
          >
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

        <Section title="Preço" description="O valor que aparece no anúncio.">
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
                  <input {...props} name="price" type="text" inputMode="decimal" value={values.price} onChange={(event) => set("price", formatMoneyInput(event.target.value))} placeholder="0,00" className={`${INPUT} h-12 pl-11 ${props.className}`} />
                </div>
              )}
            </Field>
          </div>
        </Section>
      </div>

      <div hidden={step !== 1}>
        <Section title="Mídia" description={`Envie até ${MAX_PHOTOS} fotos. A primeira é a capa do anúncio.`}>
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

      <div hidden={step !== 3} className="space-y-6">
        <Section
          title="Comodidades"
          description="Marque só o que a sala tem de verdade."
          aside={amenitiesTip && <AiHint tip={amenitiesTip} />}
        >
          <fieldset>
            <legend className="sr-only">Comodidades</legend>
            <div className="flex flex-wrap gap-2">
              {[...new Set([...Object.keys(AMENITIES), ...listing.amenities])].map((key) => {
                const checked = amenities.includes(key);
                const AmenityIcon = AMENITY_ICONS[key] ?? CheckCircleIcon;
                return (
                  <label
                    key={key}
                    className={`flex h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-sm ring-1 transition-colors focus-within:ring-2 focus-within:ring-brand-600/40 ${
                      // Mesmo peso de fonte nos dois estados: o pill não muda de largura ao marcar.
                      checked ? "bg-brand-50 text-brand-800 ring-brand-300" : "bg-white text-ink-700 ring-ink-300 hover:ring-ink-400"
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
                    <AmenityIcon className={`size-4.5 ${checked ? "text-brand-600" : "text-ink-500"}`} weight={checked ? "fill" : "regular"} aria-hidden />
                    {amenityLabel(key)}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </Section>

        <Section title="Regras" description="Como a sala deve ser usada. Aparece no anúncio.">
          <Field
            label="Regras de uso"
            hint="Uma regra por linha."
            optional
            tool={<AiRewrite field="rules" label="Escrever com IA" value={values.rules} facts={facts} onApply={(text) => set("rules", text, false)} />}
          >
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
        <ReviewSummary values={values} photos={ready} amenities={amenities} onEdit={goTo} />
        <Section title="Contato" description="O WhatsApp é o contato principal. O e-mail recebe as mensagens de quem prefere escrever.">
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
          <Field label="E-mail" hint="Recebe as mensagens do formulário do anúncio. O endereço não aparece para ninguém." error={errors.contact_email}>
            {(props) => (
              <input
                {...props}
                name="contact_email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="nome@exemplo.com"
                value={values.contact_email}
                onChange={(event) => set("contact_email", event.target.value.trim())}
                className={`${INPUT} h-12 ${props.className}`}
              />
            )}
          </Field>
        </Section>
      </div>

      <ActionBar step={step} isPending={isPending} uploading={uploading} published={published} onBack={() => goTo(step - 1)} onNext={next} />
    </form>
  );
}

// ── Navegação ──────────────────────────────────────────────

function Stepper({ step, onSelect }: { step: number; onSelect: (step: number) => void }) {
  return (
    // Só as barras: o título de cada passo já está no bloco abaixo. O nome fica para leitores de tela.
    <nav aria-label="Passos do anúncio" className="mb-6">
      <ol className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {STEPS.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={index === step ? "step" : undefined}
              aria-label={`Passo ${index + 1} de ${STEPS.length}: ${label}`}
              title={label}
              // py-2 aumenta a área de clique sem engrossar a barra.
              className="focus-ring group block w-full rounded-sm py-2"
            >
              <span className={`block h-1.5 rounded-full transition-colors ${index <= step ? "bg-brand-600" : "bg-ink-200 group-hover:bg-ink-300"}`} />
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
  published,
  onBack,
  onNext,
}: {
  step: number;
  isPending: boolean;
  uploading: boolean;
  published: boolean;
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
        {!published && (
          <button type="submit" name="intent" value="save" disabled={isPending || uploading} className={`${buttonClasses("secondary")} disabled:opacity-60 max-sm:px-3`}>
            Salvar <span className="max-sm:hidden">rascunho</span>
          </button>
        )}
        {last ? (
          // key diferente: sem ela, o React reaproveitaria o botão "Continuar", trocaria o
          // type para submit durante o clique e o anúncio seria enviado sem querer.
          <button key="submit" type="submit" name="intent" value="submit" disabled={isPending || uploading} className={`${buttonClasses("primary")} disabled:cursor-wait disabled:bg-brand-500`}>
            {isPending && <CircleNotchIcon className="size-4.5 animate-spin" weight="bold" aria-hidden />}
            {published ? (
              <>
                Enviar <span className="max-sm:hidden">alterações </span>para revisão
              </>
            ) : (
              "Enviar para revisão"
            )}
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

function Section({ title, description, aside, children }: { title: string; description: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-panel bg-white p-5 shadow-card ring-1 ring-ink-900/6 sm:p-8">
      <div className="flex items-center gap-2">
        <h2 className="text-h3 font-bold text-ink-900">{title}</h2>
        {aside}
      </div>
      <p className="mt-1 text-sm text-ink-600">{description}</p>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

// ── Revisão ────────────────────────────────────────────────

function ReviewSummary({
  values,
  photos,
  amenities,
  onEdit,
}: {
  values: Values;
  photos: Photo[];
  amenities: string[];
  onEdit: (step: number) => void;
}) {
  const rules = values.rules.split("\n").map((line) => line.trim()).filter(Boolean);
  return (
    <section className="overflow-hidden rounded-panel bg-white shadow-card ring-1 ring-ink-900/6">
      {photos.length > 0 && <PhotoCarousel photos={photos} />}
      <div className="divide-y divide-ink-200 px-5 sm:px-8">
        <SummaryRow title="Sobre a sala" onEdit={() => onEdit(0)}>
          <p className="font-bold text-ink-900">{values.title}</p>
          {values.short_summary && <p className="mt-1">{values.short_summary}</p>}
          <p className="mt-2 text-ink-500">
            {SPACE_TYPES[values.space_type as SpaceType]} · R$ {values.price} por {BILLING_UNIT[values.billing_type as BillingType]}
          </p>
        </SummaryRow>
        <SummaryRow title="Mídia" onEdit={() => onEdit(1)}>
          {photos.length >= MIN_PHOTOS
            ? `${photos.length} ${photos.length === 1 ? "foto" : "fotos"}. A primeira é a capa.`
            : "Nenhuma foto ainda. Adicione pelo menos uma para a capa."}
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
