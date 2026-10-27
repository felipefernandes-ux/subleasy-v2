"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import {
  ArrowsOutIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleNotchIcon,
  CoffeeIcon,
  EnvelopeSimpleIcon,
  GiftIcon,
  HandshakeIcon,
  LockOpenIcon,
  LockSimpleIcon,
  MapPinIcon,
  PaintRollerIcon,
  PercentIcon,
  SpeakerSimpleSlashIcon,
  SunIcon,
  WarningCircleIcon,
  type Icon,
} from "@phosphor-icons/react";
import { createListing, discardDraftPhotos } from "@/app/actions/create-listing";
import { suggestListingCopy } from "@/app/actions/rewrite";
import {
  AMENITIES,
  BILLING_TYPES,
  BILLING_UNIT,
  HIGHLIGHTS,
  MAX_HIGHLIGHTS,
  OFFERS,
  SPACE_TYPES,
  UFS,
  amenityLabel,
  formatPrice,
  photoUrl,
  toBrazilianWhatsApp,
  type BillingType,
  type Highlight,
  type Offer,
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
  formatMoneyInput,
  formatPhoneInput,
  parsePrice,
  usePhotoSizes,
  type AddressValues,
  type Photo,
} from "./listing-fields";
import { SPACE_ICONS } from "@/lib/space-type-icons";
import { LocationMap } from "./location-map";
import { Logo, SparkleIcon, WhatsAppIcon, buttonClasses } from "./ui";


const HIGHLIGHT_ICONS: Record<Highlight, Icon> = {
  silenciosa: SpeakerSimpleSlashIcon,
  bem_localizada: MapPinIcon,
  luz_natural: SunIcon,
  reformada: PaintRollerIcon,
  ampla: ArrowsOutIcon,
  aconchegante: CoffeeIcon,
};

const OFFER_ICONS: Record<Offer, Icon> = {
  primeiro_turno_gratis: GiftIcon,
  desconto_primeiro_mes: PercentIcon,
  sem_caucao: LockOpenIcon,
  sem_fidelidade: HandshakeIcon,
};

// 9 passos em 3 fases, como no Airbnb: a barra de cada fase enche aos poucos.
const STEPS = [
  { phase: 0, title: "Para que tipo de atendimento é a sala?", text: "Escolha a opção que mais se parece com o seu espaço." },
  { phase: 0, title: "Onde fica a sala?", text: "Digite o CEP e o endereço se completa sozinho. Rua e número não aparecem no anúncio." },
  { phase: 0, title: "O que a sala oferece?", text: "Marque só o que a sala tem de verdade. Dá para mudar depois." },
  { phase: 0, title: "Adicione fotos da sala", text: "Até 8 fotos. A primeira é a capa do anúncio." },
  { phase: 1, title: "Como você descreveria a sala?", text: `Escolha até ${MAX_HIGHLIGHTS} destaques. A IA usa para começar a descrição.` },
  { phase: 1, title: "Dê um título e uma descrição", text: "A IA escreveu uma sugestão com o que você contou até aqui. Ajuste do seu jeito." },
  { phase: 2, title: "Quanto custa e como funciona?", text: "O valor aparece no anúncio. Regras ajudam a atrair quem combina com a sala." },
  { phase: 2, title: "Ofereça algo para quem vem pelo Subleasy", text: "A oferta aparece em destaque no anúncio e vai escrita na mensagem do WhatsApp. É opcional." },
  { phase: 2, title: "Como os interessados falam com você?", text: "O WhatsApp é o contato principal. O e-mail fica como segunda opção, para quem preferir." },
  { phase: 2, title: "Confira e envie", text: "A equipe do Subleasy aprova em até 1 dia útil. Nada vai ao ar antes disso." },
];
const PHASES = ["A sala", "O anúncio", "Condições"];

type CopyField = "title" | "short_summary" | "description";
const COPY_FIELDS: Record<CopyField, { label: string; hint?: string; max?: number; placeholder?: string }> = {
  title: { label: "Título", max: 70, placeholder: "Ex.: Sala de psicologia com janela ampla na Zona 7" },
  short_summary: { label: "Resumo", hint: "Aparece nos cards e na prévia do link no WhatsApp.", max: 120 },
  description: { label: "Descrição", hint: "Para quem a sala serve, o que tem dentro, o que o prédio oferece e como funciona a locação." },
};

type Draft = AddressValues & {
  id: string;
  step: number;
  space_type: SpaceType | "";
  latitude: number | null;
  longitude: number | null;
  show_exact_location: boolean;
  amenities: string[];
  photos: { path: string; size?: [number, number] }[];
  highlights: Highlight[];
  title: string;
  short_summary: string;
  description: string;
  billing_type: BillingType;
  price: string;
  min_rental_period: string;
  rules: string;
  offers: Offer[];
  whatsapp: string;
  contact_email: string;
  /** Campos que ainda têm o texto da IA: mostram o ícone de sugestão. */
  ai_fields: CopyField[];
};
type Errors = Partial<Record<keyof Draft | "photos", string>>;

type Profile = { whatsapp: string; email: string };

function emptyDraft({ whatsapp, email }: Profile): Draft {
  return {
    id: crypto.randomUUID(),
    step: 0,
    space_type: "",
    zip_code: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    latitude: null,
    longitude: null,
    show_exact_location: false,
    amenities: [],
    photos: [],
    highlights: [],
    title: "",
    short_summary: "",
    description: "",
    billing_type: "turno",
    price: "",
    min_rental_period: "",
    rules: "",
    offers: [],
    whatsapp,
    contact_email: email,
    ai_fields: [],
  };
}

const noop = () => () => {};

/**
 * Cadastro tradicional, um assunto por tela. O rascunho fica salvo no navegador a cada
 * mudança: dá para sair e voltar. Só vira anúncio (e vai para análise) no último passo.
 */
export function ListingWizard({ userId, profile }: { userId: string; profile: Profile }) {
  const key = `subleasy:cadastro:${userId}`;
  // localStorage só existe no navegador: no servidor, mostra o esqueleto.
  const saved = useSyncExternalStore(noop, () => localStorage.getItem(key) ?? "", () => null);
  if (saved === null) return <div className="min-h-dvh bg-white" aria-busy="true" />;

  // "Anunciar sala" sempre começa do zero. Um rascunho salvo vira só um convite para continuar.
  let resume: Draft | null = null;
  try {
    const parsed = saved ? ({ ...emptyDraft(profile), ...(JSON.parse(saved) as Partial<Draft>) } as Draft) : null;
    if (parsed && (parsed.step > 0 || parsed.space_type)) resume = parsed;
  } catch {
    resume = null;
  }
  return <Wizard storageKey={key} userId={userId} profile={profile} fresh={emptyDraft(profile)} resume={resume} />;
}

function Wizard({
  storageKey,
  userId,
  profile,
  fresh,
  resume,
}: {
  storageKey: string;
  userId: string;
  profile: Profile;
  fresh: Draft;
  resume: Draft | null;
}) {
  // Guarda o rascunho vazio da primeira renderização: é com ele que "nada foi tocado" se compara.
  const [blank] = useState(fresh);
  const [draft, setDraft] = useState(blank);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [saved, setSaved] = useState(resume);
  // Enquanto nada foi tocado, o formulário limpo não sobrescreve o rascunho salvo.
  const pristine = draft === blank && photos.length === 0;
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  usePhotoSizes(photos, setPhotos);

  const ready = photos.filter((photo): photo is Photo & { path: string } => Boolean(photo.path));
  const uploading = photos.some((photo) => !photo.path && !photo.error);
  const step = draft.step;

  // Salva a cada mudança. As fotos entram só depois de enviadas ao Storage.
  useEffect(() => {
    if (pristine) return;
    localStorage.setItem(storageKey, JSON.stringify({ ...draft, photos: ready.map(({ path, size }) => ({ path, size })) }));
  }, [storageKey, draft, ready, pristine]);

  function continueSaved() {
    if (!saved) return;
    setDraft(saved);
    setPhotos(saved.photos.map(({ path, size }) => ({ key: path, path, preview: photoUrl(path), size })));
    setSaved(null);
  }

  function discardSaved() {
    if (!saved) return;
    localStorage.removeItem(storageKey);
    // As fotos do rascunho já estavam no Storage: saem junto.
    if (saved.photos.length > 0) discardDraftPhotos(saved.id);
    setSaved(null);
  }

  const set = <K extends keyof Draft>(field: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  // Texto da IA (sugestão ou "Escrever com IA") mantém o ícone; digitar à mão tira.
  const fill = (field: CopyField, text: string) => {
    setDraft((current) => ({ ...current, [field]: text, ai_fields: [...new Set([...current.ai_fields, field])] }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const edit = (field: CopyField, text: string) => {
    setDraft((current) => ({ ...current, [field]: text, ai_fields: current.ai_fields.filter((item) => item !== field) }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const [copyStatus, setCopyStatus] = useState<"idle" | "loading" | "error">("idle");
  // Ao chegar no passo do texto com tudo vazio, a IA escreve a primeira versão com as respostas anteriores.
  function suggestCopy() {
    if (copyStatus === "loading" || draft.title.trim() || draft.short_summary.trim() || draft.description.trim()) return;
    setCopyStatus("loading");
    suggestListingCopy(facts).then((result) => {
      if (!result.ok) return setCopyStatus("error");
      setDraft((current) => {
        // Não passa por cima do que a pessoa começou a escrever enquanto a IA trabalhava.
        const filled = (["title", "short_summary", "description"] as const).filter((field) => !current[field].trim() && result.copy[field]);
        const next = { ...current, ai_fields: [...new Set([...current.ai_fields, ...filled])] };
        for (const field of filled) next[field] = result.copy[field];
        return next;
      });
      setCopyStatus("idle");
    });
  }

  const toggle = <K extends "amenities" | "highlights" | "offers">(field: K, item: Draft[K][number], max = Infinity) =>
    setDraft((current) => {
      const list = current[field] as string[];
      if (list.includes(item)) return { ...current, [field]: list.filter((value) => value !== item) };
      if (list.length >= max) return current;
      return { ...current, [field]: [...list, item] };
    });

  const topRef = useRef<HTMLDivElement>(null);
  function goTo(next: number) {
    setDraft((current) => ({ ...current, step: next }));
    if (next === 5) suggestCopy();
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));
  }

  function validate(current: number): Errors {
    const found: Errors = {};
    if (current === 0 && !draft.space_type) found.space_type = "Escolha uma opção para continuar.";
    if (current === 1) {
      if (draft.zip_code && !/^\d{5}-\d{3}$/.test(draft.zip_code)) found.zip_code = "Digite o CEP no formato 00000-000.";
      if (!draft.neighborhood.trim()) found.neighborhood = "Informe o bairro.";
      if (!draft.city.trim()) found.city = "Informe a cidade.";
      if (!UFS.includes(draft.state as (typeof UFS)[number])) found.state = "Escolha a UF.";
    }
    if (current === 3 && ready.length === 0) found.photos = "Adicione pelo menos uma foto da sala.";
    if (current === 5) {
      const title = draft.title.trim();
      if (title.length < 10 || title.length > 70) found.title = "O título precisa ter entre 10 e 70 caracteres.";
      if (draft.description.trim().length < 40) found.description = "Escreva uma descrição com pelo menos 40 caracteres.";
    }
    if (current === 6 && !(parsePrice(draft.price) >= 10)) found.price = "Informe o preço em reais, a partir de R$ 10.";
    if (current === 8) {
      if (!toBrazilianWhatsApp(draft.whatsapp)) found.whatsapp = "Digite o WhatsApp com DDD, como (44) 99999-9999.";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.contact_email)) found.contact_email = "Digite um e-mail válido, como nome@exemplo.com.";
    }
    return found;
  }

  function next() {
    const found = validate(step);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (step < STEPS.length - 1) return goTo(step + 1);
    submit();
  }

  function submit() {
    setSubmitError(null);
    const street = [draft.street.trim(), draft.number.trim()].filter(Boolean).join(", ") + (draft.complement.trim() ? ` - ${draft.complement.trim()}` : "");
    startTransition(async () => {
      // Se der certo, a ação redireciona para o painel: o rascunho local sai antes.
      localStorage.removeItem(storageKey);
      const result = await createListing({
        id: draft.id,
        space_type: draft.space_type as SpaceType,
        zip_code: draft.zip_code,
        street_address: street,
        neighborhood: draft.neighborhood,
        city: draft.city,
        state: draft.state,
        latitude: draft.latitude,
        longitude: draft.longitude,
        show_exact_location: draft.show_exact_location,
        amenities: draft.amenities,
        photos: ready.map((photo) => photo.path),
        photo_sizes: Object.fromEntries(ready.filter((photo) => photo.size).map((photo) => [photo.path, photo.size])),
        highlights: draft.highlights,
        title: draft.title,
        short_summary: draft.short_summary,
        description: draft.description,
        billing_type: draft.billing_type,
        price: parsePrice(draft.price),
        min_rental_period: draft.min_rental_period,
        rules: draft.rules.split("\n").map((line) => line.replace(/^[-•*]\s*/, "").trim()).filter(Boolean),
        offers: draft.offers,
        whatsapp: draft.whatsapp,
        contact_email: draft.contact_email,
      });
      if (result && !result.ok) {
        localStorage.setItem(storageKey, JSON.stringify({ ...draft, photos: ready.map(({ path, size }) => ({ path, size })) }));
        setSubmitError(result.error);
        if (result.step !== undefined) goTo(result.step);
      }
    });
  }

  // O que a IA sabe para escrever: tudo o que a pessoa já respondeu.
  const facts = [
    draft.space_type && `Tipo de espaço: ${SPACE_TYPES[draft.space_type]}`,
    draft.neighborhood && `Local: ${draft.neighborhood}, ${draft.city} - ${draft.state}`,
    draft.amenities.length > 0 && `Comodidades: ${draft.amenities.map(amenityLabel).join(", ")}`,
    draft.highlights.length > 0 && `Destaques: ${draft.highlights.map((key) => HIGHLIGHTS[key]).join(", ")}`,
    draft.price && `Preço: R$ ${draft.price} por ${BILLING_UNIT[draft.billing_type]}`,
    draft.min_rental_period && `Período mínimo: ${draft.min_rental_period}`,
    draft.description && `Descrição atual: ${draft.description}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <Link href="/" aria-label="Subleasy, página inicial" className="focus-ring rounded-control">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/anunciar/ia" className={`${buttonClasses("ghost")} max-sm:px-3`}>
              <SparkleIcon className="size-4 text-brand-600" />
              <span className="max-sm:hidden">Preencher com IA</span>
              <span className="sm:hidden">IA</span>
            </Link>
            <Link href="/painel/anuncios" className={`${buttonClasses("secondary")} max-sm:px-3`}>
              Salvar e sair
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-6 pb-40 sm:px-8 sm:pt-10">
        <div ref={topRef} className="mx-auto w-full max-w-2xl scroll-mt-24">
          <p className="text-sm font-bold text-brand-600">
            {PHASES[STEPS[step].phase]}
          </p>
          <h1 className="mt-2 text-h1 font-bold text-ink-900">{STEPS[step].title}</h1>
          <p className="mt-2 text-ink-600">{STEPS[step].text}</p>

          {step === 0 && saved && pristine && (
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-card bg-brand-50 p-4 ring-1 ring-brand-100">
              <p className="min-w-56 flex-1 text-sm text-ink-800">
                <strong className="font-bold text-ink-900">Você tem um anúncio em andamento</strong>
                {saved.title ? `: “${saved.title}”.` : "."} Seu progresso ficou salvo.
              </p>
              <button type="button" onClick={discardSaved} className={buttonClasses("ghost", "sm")}>
                Descartar
              </button>
              <button type="button" onClick={continueSaved} className={buttonClasses("primary", "sm")}>
                Continuar de onde parou
              </button>
            </div>
          )}

          {submitError && (
            <p role="alert" className="mt-6 flex items-start gap-2 rounded-card bg-danger-600/6 p-4 text-ink-800 ring-1 ring-danger-600/20">
              <WarningCircleIcon className="mt-0.5 size-5 shrink-0 text-danger-600" weight="fill" aria-hidden />
              {submitError}
            </p>
          )}

          <div className="mt-8">
            {step === 0 && (
              <ChoiceGrid error={errors.space_type}>
                {(Object.keys(SPACE_TYPES) as SpaceType[]).map((type) => {
                  const TypeIcon = SPACE_ICONS[type];
                  const checked = draft.space_type === type;
                  return (
                    <ChoiceCard key={type} type="radio" name="space_type" checked={checked} onChange={() => set("space_type", type)}>
                      <TypeIcon className={`size-8 ${checked ? "text-brand-600" : "text-ink-700"}`} weight={checked ? "duotone" : "regular"} aria-hidden />
                      <span className="mt-4 block font-bold text-ink-900">{SPACE_TYPES[type]}</span>
                    </ChoiceCard>
                  );
                })}
              </ChoiceGrid>
            )}

            {step === 1 && <LocationStep draft={draft} set={set} errors={errors} />}

            {step === 2 && (
              <ChoiceGrid>
                {Object.keys(AMENITIES).map((amenity) => {
                  const AmenityIcon = AMENITY_ICONS[amenity] ?? CheckCircleIcon;
                  const checked = draft.amenities.includes(amenity);
                  return (
                    <ChoiceCard key={amenity} type="checkbox" checked={checked} onChange={() => toggle("amenities", amenity)}>
                      <AmenityIcon className={`size-7 ${checked ? "text-brand-600" : "text-ink-700"}`} weight={checked ? "duotone" : "regular"} aria-hidden />
                      <span className="mt-3 block font-bold text-ink-900">{amenityLabel(amenity)}</span>
                    </ChoiceCard>
                  );
                })}
              </ChoiceGrid>
            )}

            {step === 3 && (
              <PhotoManager
                photos={photos}
                setPhotos={(update) => {
                  setPhotos(update);
                  setErrors((current) => ({ ...current, photos: undefined }));
                }}
                userId={userId}
                listingId={draft.id}
                error={errors.photos}
              />
            )}

            {step === 4 && (
              <fieldset>
                <legend className="sr-only">Destaques da sala</legend>
                <div className="flex flex-wrap gap-3">
                  {(Object.keys(HIGHLIGHTS) as Highlight[]).map((highlight) => {
                    const HighlightIcon = HIGHLIGHT_ICONS[highlight];
                    const checked = draft.highlights.includes(highlight);
                    const full = !checked && draft.highlights.length >= MAX_HIGHLIGHTS;
                    return (
                      <label
                        key={highlight}
                        className={`flex h-14 cursor-pointer items-center gap-2.5 rounded-full px-5 ring-1 transition focus-within:ring-2 focus-within:ring-brand-600/40 ${
                          checked ? "bg-brand-50 text-brand-800 ring-2 ring-brand-600" : full ? "cursor-not-allowed text-ink-400 ring-ink-200" : "text-ink-800 ring-ink-300 hover:ring-ink-500"
                        }`}
                      >
                        <input type="checkbox" checked={checked} disabled={full} onChange={() => toggle("highlights", highlight, MAX_HIGHLIGHTS)} className="sr-only" />
                        <HighlightIcon className="size-5" weight={checked ? "duotone" : "regular"} aria-hidden />
                        <span className="font-bold">{HIGHLIGHTS[highlight]}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-4 text-sm text-ink-500" aria-live="polite">
                  {draft.highlights.length} de {MAX_HIGHLIGHTS} escolhidos.
                </p>
              </fieldset>
            )}

            {step === 5 && (
              <div className="space-y-6">
                {copyStatus === "loading" && (
                  <div role="status" className="rounded-card bg-brand-50 p-4 ring-1 ring-brand-100">
                    <p className="flex items-center gap-2 text-sm font-bold text-brand-800">
                      <SparkleIcon className="size-4 animate-pulse text-brand-600" />
                      Escrevendo uma sugestão com o que você contou…
                    </p>
                    <span className="mt-3 block h-2.5 w-full animate-shimmer rounded-full bg-[linear-gradient(90deg,var(--color-brand-100)_25%,var(--color-brand-200)_50%,var(--color-brand-100)_75%)] bg-[length:200%_100%]" />
                    <span className="mt-2 block h-2.5 w-3/5 animate-shimmer rounded-full bg-[linear-gradient(90deg,var(--color-brand-100)_25%,var(--color-brand-200)_50%,var(--color-brand-100)_75%)] bg-[length:200%_100%]" />
                  </div>
                )}
                {copyStatus === "error" && (
                  <p role="alert" className="flex items-start gap-2 rounded-card bg-warning-500/10 p-4 text-sm text-ink-800 ring-1 ring-warning-500/30">
                    <WarningCircleIcon className="mt-0.5 size-5 shrink-0 text-warning-500" weight="fill" aria-hidden />
                    Não foi possível sugerir os textos agora. Escreva do seu jeito ou use Escrever com IA em cada campo.
                  </p>
                )}
                {(["title", "short_summary", "description"] as const).map((field) => {
                  const config = COPY_FIELDS[field];
                  const value = draft[field];
                  const loading = copyStatus === "loading" && !value;
                  return (
                    <Field
                      key={field}
                      label={config.label}
                      hint={config.hint}
                      error={errors[field]}
                      optional={field === "short_summary"}
                      counter={config.max ? `${value.length}/${config.max}` : undefined}
                      badge={draft.ai_fields.includes(field) ? "Sugerido pela IA com base no que você contou. Ajuste à vontade." : undefined}
                      tool={
                        <AiRewrite
                          field={field}
                          label={value.trim() ? "Reescrever com IA" : "Escrever com IA"}
                          value={value}
                          facts={facts}
                          onApply={(text) => fill(field, text)}
                        />
                      }
                    >
                      {(props) =>
                        field === "description" ? (
                          <textarea
                            {...props}
                            rows={8}
                            readOnly={loading}
                            placeholder={loading ? "Escrevendo…" : undefined}
                            value={value}
                            onChange={(event) => edit(field, event.target.value)}
                            className={`${INPUT} py-3 leading-relaxed ${props.className}`}
                          />
                        ) : (
                          <input
                            {...props}
                            type="text"
                            maxLength={config.max}
                            readOnly={loading}
                            placeholder={loading ? "Escrevendo…" : config.placeholder}
                            value={value}
                            onChange={(event) => edit(field, event.target.value)}
                            className={`${INPUT} h-12 ${props.className}`}
                          />
                        )
                      }
                    </Field>
                  );
                })}
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6">
                <fieldset>
                  <legend className="text-sm font-bold text-ink-800">Forma de cobrança</legend>
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {(Object.keys(BILLING_TYPES) as BillingType[]).map((type) => {
                      const checked = draft.billing_type === type;
                      return (
                        <label
                          key={type}
                          className={`grid h-14 cursor-pointer place-items-center rounded-card px-3 text-center font-bold transition focus-within:ring-3 focus-within:ring-brand-600/30 ${
                            checked ? "bg-brand-50 text-brand-800 ring-2 ring-brand-600" : "bg-white text-ink-800 ring-1 ring-ink-300 hover:ring-ink-500"
                          }`}
                        >
                          <input type="radio" name="billing_type" checked={checked} onChange={() => set("billing_type", type)} className="sr-only" />
                          {BILLING_TYPES[type]}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <Field label={`Preço por ${BILLING_UNIT[draft.billing_type]}`} error={errors.price}>
                  {(props) => (
                    <div className="relative sm:w-72">
                      <span className="pointer-events-none absolute top-1/2 left-4 mt-1 -translate-y-1/2 text-ink-500">R$</span>
                      <input
                        {...props}
                        type="text"
                        inputMode="numeric"
                        placeholder="0,00"
                        value={draft.price}
                        onChange={(event) => set("price", formatMoneyInput(event.target.value))}
                        className={`${INPUT} h-12 pl-11 tabular-nums ${props.className}`}
                      />
                    </div>
                  )}
                </Field>
                <Field label="Período mínimo" hint="Ex.: 1 turno por semana, 3 meses." optional>
                  {(props) => (
                    <input {...props} type="text" value={draft.min_rental_period} onChange={(event) => set("min_rental_period", event.target.value)} className={`${INPUT} h-12 ${props.className}`} />
                  )}
                </Field>
                <Field
                  label="Regras de uso"
                  hint="Uma regra por linha."
                  optional
                  tool={<AiRewrite field="rules" label="Escrever com IA" value={draft.rules} facts={facts} onApply={(text) => set("rules", text)} />}
                >
                  {(props) => (
                    <textarea {...props} rows={4} value={draft.rules} onChange={(event) => set("rules", event.target.value)} placeholder={"Sem procedimentos invasivos\nDeixar a sala como encontrou"} className={`${INPUT} py-3 leading-relaxed ${props.className}`} />
                  )}
                </Field>
              </div>
            )}

            {step === 7 && (
              <fieldset className="space-y-3">
                <legend className="sr-only">Ofertas para quem vem pelo Subleasy</legend>
                {(Object.keys(OFFERS) as Offer[]).map((offer) => {
                  const OfferIcon = OFFER_ICONS[offer];
                  const checked = draft.offers.includes(offer);
                  return (
                    <label
                      key={offer}
                      className={`flex cursor-pointer items-center gap-4 rounded-card p-4 ring-1 transition focus-within:ring-2 focus-within:ring-brand-600/40 sm:p-5 ${
                        checked ? "bg-brand-50 ring-2 ring-brand-600" : "bg-white ring-ink-300 hover:ring-ink-500"
                      }`}
                    >
                      <span className={`grid size-12 shrink-0 place-items-center rounded-full ${checked ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700"}`}>
                        <OfferIcon className="size-6" weight={checked ? "fill" : "regular"} aria-hidden />
                      </span>
                      <span className="flex-1">
                        <span className="block font-bold text-ink-900">{OFFERS[offer].title}</span>
                        <span className="block text-sm text-ink-600">{OFFERS[offer].text}</span>
                      </span>
                      <input type="checkbox" checked={checked} onChange={() => toggle("offers", offer)} className="sr-only" />
                      <span className={`grid size-6 shrink-0 place-items-center rounded-md ring-1 ${checked ? "bg-brand-600 text-white ring-brand-600" : "bg-white ring-ink-300"}`} aria-hidden>
                        {checked && <CheckIcon className="size-4" weight="bold" />}
                      </span>
                    </label>
                  );
                })}
                <p className="pt-2 text-sm text-ink-500">
                  Ao escolher uma oferta, você se compromete a cumpri-la com quem chegar pelo Subleasy.
                </p>
              </fieldset>
            )}

            {step === 8 && (
              <div className="space-y-6">
                <Field
                  label="WhatsApp"
                  hint={
                    draft.whatsapp && draft.whatsapp === profile.whatsapp
                      ? "Do seu cadastro. Confira se é o número que atende os interessados."
                      : "O contato principal do anúncio. O número só aparece quando a pessoa clica em Falar no WhatsApp."
                  }
                  error={errors.whatsapp}
                >
                  {(props) => (
                    <div className="relative">
                      <WhatsAppIcon className="pointer-events-none absolute top-1/2 left-4 mt-1 size-5 -translate-y-1/2 text-[#128c4a]" />
                      <input
                        {...props}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        placeholder="(44) 99999-9999"
                        value={draft.whatsapp}
                        onChange={(event) => set("whatsapp", formatPhoneInput(event.target.value))}
                        className={`${INPUT} h-12 pl-12 ${props.className}`}
                      />
                    </div>
                  )}
                </Field>
                <Field
                  label="E-mail"
                  hint={
                    draft.contact_email && draft.contact_email === profile.email
                      ? "O e-mail da sua conta. Pode trocar por outro, se preferir receber em outro endereço."
                      : "Recebe as mensagens de quem prefere escrever. O endereço não aparece no anúncio."
                  }
                  error={errors.contact_email}
                >
                  {(props) => (
                    <div className="relative">
                      <EnvelopeSimpleIcon className="pointer-events-none absolute top-1/2 left-4 mt-1 size-5 -translate-y-1/2 text-ink-500" aria-hidden />
                      <input
                        {...props}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="nome@exemplo.com"
                        value={draft.contact_email}
                        onChange={(event) => set("contact_email", event.target.value.trim())}
                        className={`${INPUT} h-12 pl-12 ${props.className}`}
                      />
                    </div>
                  )}
                </Field>
                <p className="flex items-start gap-2 rounded-card bg-ink-50 p-4 text-sm text-ink-600 ring-1 ring-ink-200">
                  <LockSimpleIcon className="mt-0.5 size-4.5 shrink-0 text-ink-500" aria-hidden />
                  Nenhum dos dois fica visível na página. O WhatsApp só é revelado quando alguém clica para falar com você. O e-mail
                  nunca aparece: quem prefere escrever usa um formulário, e a mensagem chega na sua caixa de entrada e no seu painel.
                </p>
              </div>
            )}

            {step === 9 && <Review draft={draft} photos={ready} onEdit={goTo} />}
          </div>
        </div>
      </main>

      <BottomBar
        step={step}
        isPending={isPending}
        uploading={uploading}
        onBack={() => goTo(step - 1)}
        onNext={next}
      />
    </div>
  );
}

// ── Passo 2: localização ───────────────────────────────────

function LocationStep({ draft, set, errors }: { draft: Draft; set: <K extends keyof Draft>(field: K, value: Draft[K]) => void; errors: Errors }) {
  const [status, setStatus] = useState<"idle" | "loading" | "missing">("idle");
  const query = [draft.street && `${draft.street}${draft.number ? `, ${draft.number}` : ""}`, draft.neighborhood, draft.city, draft.state].filter(Boolean).join(", ");

  // Endereço completo: acha o ponto no mapa (Nominatim, do OpenStreetMap) depois de uma pausa na digitação.
  useEffect(() => {
    if (!draft.city || !draft.state || !(draft.street || draft.neighborhood)) return;
    let active = true;
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&accept-language=pt-BR&q=${encodeURIComponent(query)}`;
        const [place] = (await fetch(url).then((response) => response.json())) as { lat: string; lon: string }[];
        if (!active) return;
        if (!place) return setStatus("missing");
        set("latitude", Number(place.lat));
        set("longitude", Number(place.lon));
        setStatus("idle");
      } catch {
        if (active) setStatus("missing");
      }
    }, 900);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // set é estável na prática (só chama setState); o ponto muda quando o endereço muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="space-y-5">
      <AddressFields values={draft} set={(field, value) => set(field, value)} errors={errors} />

      <div className="border-t border-ink-200 pt-6">
        <label className="flex cursor-pointer items-start justify-between gap-6">
          <span>
            <span className="block font-bold text-ink-900">Mostrar a localização exata</span>
            <span className="mt-1 block text-sm text-ink-600">
              Deixa claro onde a sala fica. Desligado, o anúncio mostra só uma área aproximada do bairro. A rua e o número nunca aparecem.
            </span>
          </span>
          <input type="checkbox" role="switch" checked={draft.show_exact_location} onChange={(event) => set("show_exact_location", event.target.checked)} className="peer sr-only" />
          <span
            aria-hidden
            className="relative mt-1 h-8 w-13 shrink-0 rounded-full bg-ink-300 transition-colors peer-checked:bg-brand-600 peer-focus-visible:ring-3 peer-focus-visible:ring-brand-600/30 after:absolute after:top-1 after:left-1 after:size-6 after:rounded-full after:bg-white after:shadow-xs after:transition-transform peer-checked:after:translate-x-5"
          />
        </label>

        <div className="mt-5">
          {draft.latitude !== null && draft.longitude !== null ? (
            <>
              <LocationMap
                latitude={draft.latitude}
                longitude={draft.longitude}
                exact={draft.show_exact_location}
                onMove={(latitude, longitude) => {
                  set("latitude", latitude);
                  set("longitude", longitude);
                }}
              />
              <p className="mt-2 text-sm text-ink-500">
                {draft.show_exact_location ? "Arraste o pino se ele não estiver no lugar certo." : "Quem procura vê esta área, sem o endereço."}
              </p>
            </>
          ) : (
            <div className="grid h-40 place-items-center rounded-card bg-ink-50 text-center text-sm text-ink-500 ring-1 ring-ink-200">
              {status === "loading" ? (
                <span className="flex items-center gap-2">
                  <CircleNotchIcon className="size-4 animate-spin" aria-hidden /> Procurando no mapa…
                </span>
              ) : status === "missing" ? (
                "Não achamos o endereço no mapa. O anúncio mostra só bairro e cidade."
              ) : (
                "O mapa aparece quando o endereço estiver completo."
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Revisão ────────────────────────────────────────────────

function Review({ draft, photos, onEdit }: { draft: Draft; photos: Photo[]; onEdit: (step: number) => void }) {
  const rules = draft.rules.split("\n").map((line) => line.trim()).filter(Boolean);
  const rows: { step: number; title: string; body: ReactNode }[] = [
    { step: 0, title: "Tipo de espaço", body: draft.space_type ? SPACE_TYPES[draft.space_type] : "Não escolhido" },
    {
      step: 1,
      title: "Localização",
      body: `${draft.neighborhood}, ${draft.city} - ${draft.state}${draft.show_exact_location ? " · localização exata no mapa" : " · área aproximada no mapa"}`,
    },
    { step: 2, title: "Comodidades", body: draft.amenities.length ? draft.amenities.map(amenityLabel).join(", ") : "Nenhuma marcada" },
    { step: 4, title: "Destaques", body: draft.highlights.length ? draft.highlights.map((key) => HIGHLIGHTS[key]).join(", ") : "Nenhum" },
    {
      step: 5,
      title: "Título e descrição",
      body: (
        <>
          <span className="block font-bold text-ink-900">{draft.title}</span>
          <span className="mt-1 line-clamp-2 block">{draft.description}</span>
        </>
      ),
    },
    {
      step: 6,
      title: "Preço e regras",
      body: (
        <>
          {formatPrice(parsePrice(draft.price) || 0)} por {BILLING_UNIT[draft.billing_type]}
          {draft.min_rental_period && ` · mínimo ${draft.min_rental_period}`}
          {rules.length > 0 && <span className="mt-1 block text-ink-500">{rules.join("; ")}</span>}
        </>
      ),
    },
    { step: 7, title: "Oferta Subleasy", body: draft.offers.length ? draft.offers.map((key) => OFFERS[key].title).join(", ") : "Nenhuma" },
    { step: 8, title: "Contato", body: `WhatsApp ${draft.whatsapp} · e-mail ${draft.contact_email}` },
  ];

  return (
    <section className="overflow-hidden rounded-panel bg-white shadow-card ring-1 ring-ink-900/8">
      {photos.length > 0 && <PhotoCarousel photos={photos} />}
      <dl className="divide-y divide-ink-200 px-5 sm:px-6">
        {rows.map((row) => (
          <div key={row.title} className="flex items-start justify-between gap-4 py-4">
            <div className="min-w-0 text-sm text-ink-700">
              <dt className="text-xs font-bold tracking-wide text-ink-500 uppercase">{row.title}</dt>
              <dd className="mt-1">{row.body}</dd>
            </div>
            <button type="button" onClick={() => onEdit(row.step)} className={`${buttonClasses("ghost", "sm")} shrink-0`}>
              Editar
            </button>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ── Peças ──────────────────────────────────────────────────

function ChoiceGrid({ error, children }: { error?: string; children: ReactNode }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** Cartão de escolha grande, como no Airbnb: o input fica escondido e o cartão inteiro é clicável. */
function ChoiceCard({
  type,
  name,
  checked,
  onChange,
  children,
}: {
  type: "radio" | "checkbox";
  name?: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label
      className={`relative flex min-h-32 cursor-pointer flex-col justify-between rounded-card p-4 text-left transition focus-within:ring-3 focus-within:ring-brand-600/30 sm:p-5 ${
        checked ? "bg-brand-50 ring-2 ring-brand-600" : "bg-white ring-1 ring-ink-300 hover:ring-ink-500"
      }`}
    >
      <input type={type} name={name} checked={checked} onChange={onChange} className="sr-only" />
      {children}
      {checked && (
        <span className="absolute top-3 right-3 grid size-6 place-items-center rounded-full bg-brand-600 text-white" aria-hidden>
          <CheckIcon className="size-3.5" weight="bold" />
        </span>
      )}
    </label>
  );
}

function BottomBar({
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
    <div className="fixed inset-x-0 bottom-0 z-30 bg-white">
      {/* Uma barra por fase; cada uma enche conforme os passos dela. */}
      <div className="grid grid-cols-3 gap-1" aria-hidden>
        {PHASES.map((phase, index) => {
          const steps = STEPS.map((item, position) => ({ ...item, position })).filter((item) => item.phase === index);
          const done = steps.filter((item) => item.position < step).length;
          const current = steps.some((item) => item.position === step) ? 0.5 : 0;
          return (
            <span key={phase} className="h-1.5 bg-ink-200">
              <span className="block h-full bg-brand-600 transition-[width] duration-500" style={{ width: `${((done + current) / steps.length) * 100}%` }} />
            </span>
          );
        })}
      </div>
      <div className="container-page flex items-center justify-between gap-3 py-3 sm:py-4">
        {step > 0 ? (
          <button type="button" onClick={onBack} className="focus-ring rounded-sm font-bold text-ink-900 hover:text-brand-700">
            Voltar
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={isPending || (uploading && step === 3)}
          className={`${buttonClasses("primary", "lg")} min-w-36 disabled:opacity-70`}
        >
          {isPending && <CircleNotchIcon className="size-5 animate-spin" weight="bold" aria-hidden />}
          {last ? "Enviar para revisão" : uploading && step === 3 ? "Enviando fotos…" : "Continuar"}
        </button>
      </div>
    </div>
  );
}
