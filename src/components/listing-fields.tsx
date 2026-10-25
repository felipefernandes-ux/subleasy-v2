"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BroomIcon,
  CameraIcon,
  CheckIcon,
  CircleNotchIcon,
  DeviceMobileCameraIcon,
  DotsSixVerticalIcon,
  LightbulbIcon,
  MagicWandIcon,
  MagnifyingGlassPlusIcon,
  PersonIcon,
  SunIcon,
  TrashIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
  XIcon,
  type Icon,
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
import { MAX_PHOTOS, PHOTO_BUCKET, UFS, isPortrait } from "@/lib/listing-options";
import { createClient } from "@/lib/supabase/client";
import { PhotoBackdrop } from "./photo-backdrop";
import { AiHint, buttonClasses } from "./ui";

// Peças do formulário de anúncio usadas pelo editor (fluxo da IA) e pelo cadastro passo a passo.

export type Photo = { key: string; path: string | null; preview: string; size?: [number, number]; error?: string };

/**
 * Mede toda foto sem tamanho conhecido (salva antes de existir photo_sizes, ou vinda
 * de outra versão da tela). Selo "Vertical", carrossel e alerta da capa dependem disso.
 */
export function usePhotoSizes(photos: Photo[], setPhotos: (update: (current: Photo[]) => Photo[]) => void) {
  useEffect(() => {
    let active = true;
    for (const photo of photos) {
      if (photo.size || photo.error) continue;
      const img = new Image();
      img.onload = () => {
        if (!active || !img.naturalWidth) return;
        const size: [number, number] = [img.naturalWidth, img.naturalHeight];
        setPhotos((current) => current.map((item) => (item.key === photo.key && !item.size ? { ...item, size } : item)));
      };
      img.src = photo.preview;
    }
    return () => {
      active = false;
    };
  }, [photos, setPhotos]);
}

export { AMENITY_ICONS } from "@/lib/amenity-icons";


export const INPUT =
  "mt-2 w-full rounded-control border bg-white px-4 text-base text-ink-900 shadow-xs outline-none transition-colors placeholder:text-ink-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15";


export type FieldProps = { id: string; "aria-invalid": boolean; "aria-describedby"?: string; className: string };

export function Field({
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
  /** Texto do tooltip do ícone da IA. Sem ele, o ícone não aparece. */
  badge?: string;
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
        <span className="flex items-center gap-2">
          <label htmlFor={id} className="text-sm font-bold text-ink-800">
            {label}
            {optional && <span className="font-normal text-ink-500"> (opcional)</span>}
          </label>
          {badge && <AiHint tip={badge} />}
        </span>
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

export type AddressValues = { zip_code: string; street: string; number: string; complement: string; neighborhood: string; city: string; state: string };

/** CEP que completa o endereço sozinho (ViaCEP), rua, número, complemento, bairro, cidade e UF. */
export function AddressFields({
  values,
  set,
  errors,
}: {
  values: AddressValues;
  set: (field: keyof AddressValues, value: string, manual?: boolean) => void;
  errors: Partial<Record<"zip_code" | "neighborhood" | "city" | "state", string>>;
}) {
  const [lookup, setLookup] = useState<"idle" | "loading" | "found" | "missing">("idle");
  const lastCep = useRef("");
  const numberRef = useRef<HTMLInputElement>(null);
  const validUf = UFS.includes(values.state as (typeof UFS)[number]);

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
      <Field label="Rua" hint="Não aparece no anúncio." optional>
        {(props) => (
          <input {...props} type="text" autoComplete="address-line1" value={values.street} onChange={(event) => set("street", event.target.value)} className={`${INPUT} h-12 ${props.className}`} />
        )}
      </Field>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-5">
        <Field label="Número" optional>
          {(props) => (
            <input {...props} ref={numberRef} type="text" inputMode="numeric" value={values.number} onChange={(event) => set("number", event.target.value)} className={`${INPUT} h-12 ${props.className}`} />
          )}
        </Field>
        <Field label="Complemento" optional>
          {(props) => (
            <input {...props} type="text" autoComplete="address-line2" placeholder="Sala, andar, bloco" value={values.complement} onChange={(event) => set("complement", event.target.value)} className={`${INPUT} h-12 ${props.className}`} />
          )}
        </Field>
      </div>
      <Field label="Bairro" error={errors.neighborhood}>
        {(props) => (
          <input {...props} name="neighborhood" type="text" value={values.neighborhood} onChange={(event) => set("neighborhood", event.target.value)} className={`${INPUT} h-12 ${props.className}`} />
        )}
      </Field>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-5">
        <Field label="Cidade" error={errors.city}>
          {(props) => (
            <input {...props} name="city" type="text" autoComplete="address-level2" value={values.city} onChange={(event) => set("city", event.target.value)} className={`${INPUT} h-12 ${props.className}`} />
          )}
        </Field>
        <Field label="UF" error={errors.state}>
          {(props) => (
            <select {...props} name="state" autoComplete="address-level1" value={validUf ? values.state : ""} onChange={(event) => set("state", event.target.value)} className={`${INPUT} h-12 ${props.className}`}>
              {!validUf && (
                <option value="" disabled>
                  Selecione
                </option>
              )}
              {UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
    </>
  );
}


// ── Fotos ──────────────────────────────────────────────────

export function PhotoManager({
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
  const [dragOver, setDragOver] = useState(false);
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
          const { blob, size } = await compressPhoto(file);
          const extension = blob.type === "image/webp" ? "webp" : "jpg";
          const path = `${userId}/${listingId}/${photo.key}.${extension}`;
          const { error: uploadError } = await supabase.storage
            .from(PHOTO_BUCKET)
            .upload(path, blob, { contentType: blob.type, cacheControl: "31536000" });
          if (uploadError) throw uploadError;
          update({ path, size });
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

  const sent = photos.filter((photo) => photo.path).length;
  // A capa aparece em cards e na prévia do link, sempre na horizontal.
  const coverPortrait = Boolean(photos[0]?.path) && isPortrait(photos[0]?.size);
  const hasLandscape = photos.some((photo) => photo.path && photo.size && !isPortrait(photo.size));

  return (
    <div>
      <PhotoTips />

      {room > 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          // Também aceita fotos arrastadas do computador.
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            addFiles(event.dataTransfer.files);
          }}
          className={`focus-ring mt-5 flex w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-4 py-8 text-sm font-bold transition-colors ${
            error
              ? "border-danger-600/50 text-danger-600"
              : dragOver
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-brand-200 text-brand-700 hover:border-brand-400 hover:bg-brand-50"
          }`}
        >
          {photos.length === 0 ? <CameraIcon className="size-7" aria-hidden /> : <UploadSimpleIcon className="size-7" aria-hidden />}
          {photos.length === 0 ? "Adicionar fotos" : "Adicionar mais fotos"}
          <span className="font-normal text-ink-500">
            {room === MAX_PHOTOS ? `Até ${MAX_PHOTOS} fotos, em JPG, PNG ou WebP` : `Cabem mais ${room} ${room === 1 ? "foto" : "fotos"}`}
          </span>
        </button>
      )}

      {coverPortrait && (
        <p role="status" className="mt-5 flex items-start gap-2 rounded-card bg-warning-500/10 p-4 text-sm text-ink-800 ring-1 ring-warning-500/30">
          <WarningCircleIcon className="mt-0.5 size-5 shrink-0 text-warning-500" weight="fill" aria-hidden />
          <span>
            <strong className="font-bold text-ink-900">A capa está na vertical.</strong>{" "}
            {hasLandscape
              ? "Nos cards e na prévia do WhatsApp ela aparece com faixas nas laterais. Arraste uma foto horizontal para o primeiro lugar."
              : "Nos cards e na prévia do WhatsApp ela aparece com faixas nas laterais. Se puder, tire uma foto da sala com o celular deitado e use como capa."}
          </span>
        </p>
      )}

      {photos.length > 0 && (
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={photos.map((photo) => photo.key)} strategy={rectSortingStrategy}>
            <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {photos.map((photo, index) => (
                <SortablePhoto
                  key={photo.key}
                  photo={photo}
                  index={index}
                  onRemove={() => setPhotos((current) => current.filter((item) => item.key !== photo.key))}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

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
        {error ?? `${sent} de ${MAX_PHOTOS} fotos.${photos.length > 1 ? " Arraste para mudar a ordem." : ""}`}
      </p>
    </div>
  );
}

const PHOTO_TIPS: { icon: Icon; title: string; text: string }[] = [
  { icon: SunIcon, title: "Luz natural", text: "Fotografe de dia, com as cortinas abertas e as luzes acesas. Não fotografe de frente para a janela." },
  { icon: CameraIcon, title: "Modo Foto, não Retrato", text: "O modo Retrato desfoca o fundo e esconde a sala. Use o modo Foto padrão do celular." },
  { icon: MagnifyingGlassPlusIcon, title: "Sem zoom", text: "O zoom tira a nitidez. Chegue mais perto. Em salas pequenas, use a lente 0,5× se o celular tiver." },
  { icon: MagicWandIcon, title: "Sem filtros nem efeitos", text: "Quem aluga quer ver a sala como ela é. Deixe cor e brilho no automático." },
  { icon: PersonIcon, title: "Do canto, na altura do peito", text: "Fique num canto da sala e segure o celular reto. Assim a foto mostra o espaço inteiro." },
  { icon: BroomIcon, title: "Arrume antes", text: "Tire objetos pessoais, fios e papéis de vista. Limpe a lente do celular com um pano macio." },
];

const PHOTO_ORDER = ["Sala inteira", "Mesa ou maca", "Janela", "Recepção ou espera", "Banheiro", "Fachada ou corredor"];

/** Guia de fotos com o celular, aberto num overlay (dialog nativo: Esc fecha e o foco fica preso). */
function PhotoTips() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="focus-ring group flex w-full items-center gap-3 rounded-card bg-brand-50 p-4 text-left ring-1 ring-brand-100 transition-colors hover:bg-brand-100"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-brand-600 shadow-xs">
          <LightbulbIcon className="size-5" weight="duotone" aria-hidden />
        </span>
        <span className="flex-1 text-sm">
          <span className="block font-bold text-brand-800">Veja como tirar boas fotos da sua sala</span>
          <span className="block text-ink-600">Dicas rápidas para fotografar com o celular.</span>
        </span>
        <ArrowRightIcon className="size-4.5 text-brand-700 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="photo-tips-title"
        // Clique fora do conteúdo (no fundo escuro) fecha.
        onClick={(event) => event.target === event.currentTarget && close()}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100vw-2rem))] overflow-y-auto rounded-panel bg-white p-0 text-ink-800 shadow-raised backdrop:bg-ink-900/60 backdrop:backdrop-blur-sm open:animate-fade-up open:[animation-duration:0.3s]"
      >
        <div className="p-5 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-brand-600">Guia rápido</p>
              <h2 id="photo-tips-title" className="mt-1 text-h3 font-bold text-ink-900 sm:text-h2">
                Fotos que mostram bem a sua sala
              </h2>
              <p className="mt-2 text-sm text-ink-600">Só com o celular, em poucos minutos.</p>
            </div>
            <button type="button" onClick={close} aria-label="Fechar" className="focus-ring grid size-10 shrink-0 place-items-center rounded-full text-ink-500 hover:bg-ink-100">
              <XIcon className="size-5" aria-hidden />
            </button>
          </div>

          {/* Orientação: o ponto mais importante, em destaque visual. */}
          <div className="mt-6 grid gap-4 rounded-card bg-ink-50 p-5 ring-1 ring-ink-200 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8">
            <div className="flex items-end justify-center gap-5" aria-hidden>
              <figure className="text-center">
                <span className="relative grid h-16 w-28 place-items-center rounded-xl border-[3px] border-ink-800 bg-white">
                  <DeviceMobileCameraIcon className="size-6 -rotate-90 text-brand-600" />
                  <span className="absolute -top-2.5 -right-2.5 grid size-6 place-items-center rounded-full bg-mint-700 text-white">
                    <CheckIcon className="size-3.5" weight="bold" />
                  </span>
                </span>
                <figcaption className="mt-2 text-xs font-bold text-mint-700">Horizontal</figcaption>
              </figure>
              <figure className="text-center">
                <span className="relative grid h-24 w-14 place-items-center rounded-xl border-[3px] border-ink-300 bg-white">
                  <DeviceMobileCameraIcon className="size-6 text-ink-400" />
                  <span className="absolute -top-2.5 -right-2.5 grid size-6 place-items-center rounded-full bg-danger-600 text-white">
                    <XIcon className="size-3.5" weight="bold" />
                  </span>
                </span>
                <figcaption className="mt-2 text-xs font-bold text-danger-600">Vertical</figcaption>
              </figure>
            </div>
            <div>
              <p className="font-bold text-ink-900">Celular deitado, sempre</p>
              <p className="mt-1 text-sm text-ink-600">
                A capa e os cards do Subleasy são horizontais. Uma foto em pé aparece menor, com faixas nas laterais, e mostra menos da sala.
              </p>
            </div>
          </div>

          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PHOTO_TIPS.map(({ icon: TipIcon, title, text }) => (
              <li key={title} className="rounded-card p-4 ring-1 ring-ink-200">
                <span className="grid size-10 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <TipIcon className="size-5" weight="duotone" aria-hidden />
                </span>
                <p className="mt-3 font-bold text-ink-900">{title}</p>
                <p className="mt-1 text-sm text-ink-600">{text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-4 rounded-card bg-brand-50 p-5 ring-1 ring-brand-100">
            <p className="font-bold text-brand-800">O que fotografar, nesta ordem</p>
            <ol className="mt-3 flex flex-wrap gap-2">
              {PHOTO_ORDER.map((item, index) => (
                <li key={item} className="flex items-center gap-2 rounded-full bg-white py-1 pr-3 pl-1 text-sm text-ink-800 ring-1 ring-brand-100">
                  <span className="grid size-6 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{index + 1}</span>
                  {item}
                  {index === 0 && <span className="text-xs font-bold text-brand-600">capa</span>}
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-6 flex justify-end">
            <button type="button" onClick={close} className={buttonClasses("primary")}>
              Entendi
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

function SortablePhoto({ photo, index, onRemove }: { photo: Photo; index: number; onRemove: () => void }) {
  const portrait = isPortrait(photo.size);
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
      {portrait && <PhotoBackdrop src={photo.preview} />}
      {/* eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:) antes do upload */}
      <img
        src={photo.preview}
        alt=""
        draggable={false}
        className={`pointer-events-none relative size-full select-none ${portrait ? "object-contain" : "object-cover"} ${photo.path ? "" : "opacity-60"}`}
      />
      {portrait && photo.path && (
        <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-xs font-bold text-ink-700 shadow-xs">Vertical</span>
      )}
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


/** Carrossel das fotos na revisão: rolagem com snap (arrastar no celular) e setas no desktop. */
export function PhotoCarousel({ photos }: { photos: Photo[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const last = photos.length - 1;
  const index = Math.min(current, last);

  function show(next: number) {
    const track = trackRef.current;
    if (track) track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="group relative bg-ink-100" role="region" aria-roledescription="carrossel" aria-label="Fotos do anúncio">
      <div
        ref={trackRef}
        onScroll={(event) => setCurrent(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))}
        className="flex aspect-[16/9] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] sm:aspect-[16/8] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((photo, position) => (
          <div key={photo.key} className="relative size-full shrink-0 snap-center overflow-hidden" aria-roledescription="slide" aria-label={`Foto ${position + 1} de ${photos.length}`}>
            {isPortrait(photo.size) && <PhotoBackdrop src={photo.preview} />}
            {/* eslint-disable-next-line @next/next/no-img-element -- fotos já enviadas ao Storage */}
            <img src={photo.preview} alt="" draggable={false} className={`relative size-full ${isPortrait(photo.size) ? "object-contain" : "object-cover"}`} />
          </div>
        ))}
      </div>

      {index === 0 && <span className="absolute top-3 left-3 rounded-full bg-ink-900/80 px-2.5 py-1 text-xs font-bold text-white">Capa</span>}
      <span className="absolute right-3 bottom-3 rounded-full bg-ink-900/80 px-2.5 py-1 text-xs font-bold text-white tabular-nums" aria-live="polite">
        {index + 1} / {photos.length}
      </span>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => show(index - 1)}
            disabled={index === 0}
            aria-label="Foto anterior"
            className="focus-ring absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink-800 shadow-raised transition-opacity hover:bg-white disabled:opacity-0 max-sm:hidden"
          >
            <ArrowLeftIcon className="size-4.5" weight="bold" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => show(index + 1)}
            disabled={index === last}
            aria-label="Próxima foto"
            className="focus-ring absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink-800 shadow-raised transition-opacity hover:bg-white disabled:opacity-0 max-sm:hidden"
          >
            <ArrowRightIcon className="size-4.5" weight="bold" aria-hidden />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
            {photos.map((photo, position) => (
              <span key={photo.key} className={`h-1.5 rounded-full transition-all ${position === index ? "w-4 bg-white" : "w-1.5 bg-white/60"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}


// ── Utilitários ────────────────────────────────────────────

// Reduz para no máximo 1920 px no lado maior. Fotos de celular chegam com 4 a 8 MB.
async function compressPhoto(file: File): Promise<{ blob: Blob; size: [number, number] }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const toBlob = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  // Safari antigo não gera WebP e devolve PNG; nesse caso, JPEG.
  const size: [number, number] = [canvas.width, canvas.height];
  const webp = await toBlob("image/webp");
  if (webp?.type === "image/webp") return { blob: webp, size };
  const jpeg = await toBlob("image/jpeg");
  if (!jpeg) throw new Error("Não foi possível converter a foto");
  return { blob: jpeg, size };
}

export function parsePrice(raw: string) {
  const clean = raw.replace(/[^\d.,]/g, "");
  if (!clean) return Number.NaN;
  return Number(clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : /\.\d{3}$/.test(clean) ? clean.replace(/\./g, "") : clean);
}

/** Máscara de moeda: os dígitos entram pelos centavos, como no app do banco. "10000" vira "100,00". */
export function formatMoneyInput(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 9);
  if (!digits) return "";
  const cents = digits.padStart(3, "0");
  const reais = cents.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${reais},${cents.slice(-2)}`;
}

/** Preço do banco no formato da máscara: 70 vira "70,00". */
export function moneyFromNumber(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  const rest = digits.slice(2);
  const split = rest.length > 8 ? 5 : 4;
  if (rest.length <= split) return `(${digits.slice(0, 2)}) ${rest}`;
  return `(${digits.slice(0, 2)}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

