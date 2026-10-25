"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CaretLeftIcon, CaretRightIcon, SquaresFourIcon, XIcon } from "@phosphor-icons/react";
import { FramedPhoto } from "./framed-photo";

type GalleryPhoto = { src: string; size?: [number, number] };

// Como a grade se arranja conforme o número de fotos (até 5 aparecem; o resto fica no overlay).
// A primeira sempre ocupa a metade esquerda, como no Airbnb.
const LAYOUT: Record<number, string[]> = {
  1: ["col-span-4 row-span-2"],
  2: ["col-span-2 row-span-2", "col-span-2 row-span-2"],
  3: ["col-span-2 row-span-2", "col-span-2", "col-span-2"],
  4: ["col-span-2 row-span-2", "col-span-2", "", ""],
  5: ["col-span-2 row-span-2", "", "", "", ""],
};

/**
 * Fotos do anúncio no topo da página: grade com a principal e mais 4, e um overlay
 * com a foto ampliada ao clicar em qualquer uma. No celular, só a capa com o contador.
 */
export function PhotoGallery({ photos, title }: { photos: GalleryPhoto[]; title: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const shown = photos.slice(0, 5);
  const layout = LAYOUT[shown.length] ?? LAYOUT[5];

  function open(at: number) {
    setIndex(at);
    dialogRef.current?.showModal();
    // A página atrás do overlay não rola.
    document.documentElement.style.overflow = "hidden";
  }

  if (photos.length === 0) return null;

  return (
    <>
      <div className="relative">
        {/* Celular: só a capa, com o contador. */}
        <button
          type="button"
          onClick={() => open(0)}
          aria-label={`Ampliar a foto 1 de ${photos.length}`}
          className="group relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-panel bg-ink-100 sm:hidden"
        >
          <FramedPhoto src={photos[0].src} alt={`Foto principal: ${title}`} size={photos[0].size} priority sizes="100vw" />
          <span className="absolute right-3 bottom-3 rounded-full bg-ink-900/75 px-2.5 py-1 text-xs font-bold text-white tabular-nums">
            1 / {photos.length}
          </span>
        </button>

        {/* A partir do tablet: a grade. */}
        <div className="hidden h-[clamp(20rem,38vw,30rem)] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-panel sm:grid">
          {shown.map((photo, position) => (
            <button
              key={photo.src}
              type="button"
              onClick={() => open(position)}
              aria-label={`Ampliar a foto ${position + 1} de ${photos.length}`}
              className={`group relative cursor-zoom-in overflow-hidden bg-ink-100 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white ${layout[position]}`}
            >
              <FramedPhoto
                src={photo.src}
                alt={position === 0 ? `Foto principal: ${title}` : `Foto ${position + 1} da sala`}
                size={photo.size}
                priority={position === 0}
                sizes={position === 0 ? "(min-width: 1120px) 560px, 50vw" : "(min-width: 1120px) 280px, 25vw"}
              />
              {/* Escurece de leve ao passar o mouse, como no Airbnb. */}
              <span className="pointer-events-none absolute inset-0 bg-ink-900/0 transition-colors duration-200 group-hover:bg-ink-900/12" aria-hidden />
            </button>
          ))}
        </div>

        {photos.length > 5 && (
          <button
            type="button"
            onClick={() => open(0)}
            className="focus-ring absolute right-4 bottom-4 hidden items-center gap-2 rounded-control bg-white px-3.5 py-2 text-sm font-bold text-ink-900 shadow-raised ring-1 ring-ink-900/10 transition-colors hover:bg-ink-50 sm:inline-flex"
          >
            <SquaresFourIcon className="size-4.5" aria-hidden />
            Mostrar todas as {photos.length} fotos
          </button>
        )}
      </div>

      <Lightbox dialogRef={dialogRef} photos={photos} title={title} index={index} setIndex={setIndex} />
    </>
  );
}

function Lightbox({
  dialogRef,
  photos,
  title,
  index,
  setIndex,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  photos: GalleryPhoto[];
  title: string;
  index: number;
  setIndex: (update: (current: number) => number) => void;
}) {
  const touchX = useRef<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const go = (step: number) => setIndex((current) => (current + step + photos.length) % photos.length);
  const close = () => dialogRef.current?.close();
  const photo = photos[index];

  // A miniatura da foto atual fica sempre à vista na faixa de baixo.
  useEffect(() => {
    thumbsRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [index]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={`Fotos: ${title}`}
      onClose={() => (document.documentElement.style.overflow = "")}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") go(1);
        if (event.key === "ArrowLeft") go(-1);
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink-900 p-0 text-white backdrop:bg-ink-900"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between px-3 sm:px-6">
          <button type="button" onClick={close} className="focus-ring inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-bold hover:bg-white/10">
            <XIcon className="size-5" aria-hidden />
            Fechar
          </button>
          <p className="text-sm font-bold tabular-nums" aria-live="polite">
            {index + 1} / {photos.length}
          </p>
          <span className="w-24" aria-hidden />
        </div>

        <div
          className="relative min-h-0 flex-1"
          onTouchStart={(event) => (touchX.current = event.touches[0].clientX)}
          onTouchEnd={(event) => {
            if (touchX.current === null) return;
            const delta = event.changedTouches[0].clientX - touchX.current;
            if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          {photo && (
            // key: cada foto nova entra com o zoom.
            <div key={photo.src} className="absolute inset-0 animate-zoom-in px-4 sm:px-24">
              <div className="relative size-full">
                <Image
                  src={photo.src}
                  alt={`Foto ${index + 1} de ${photos.length}: ${title}`}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
            </div>
          )}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Foto anterior"
                className="focus-ring absolute top-1/2 left-3 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20 max-sm:hidden sm:left-6"
              >
                <CaretLeftIcon className="size-5" weight="bold" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Próxima foto"
                className="focus-ring absolute top-1/2 right-3 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20 max-sm:hidden sm:right-6"
              >
                <CaretRightIcon className="size-5" weight="bold" aria-hidden />
              </button>
            </>
          )}
        </div>

        {photos.length > 1 && (
          <div ref={thumbsRef} className="flex shrink-0 justify-center-safe gap-2 overflow-x-auto px-4 py-4 [scrollbar-width:none]">
            {photos.map((item, position) => (
              <button
                key={item.src}
                type="button"
                data-index={position}
                onClick={() => setIndex(() => position)}
                aria-label={`Ver foto ${position + 1}`}
                aria-current={position === index}
                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-control transition ${
                  position === index ? "opacity-100 ring-2 ring-white" : "opacity-50 hover:opacity-80"
                }`}
              >
                <Image src={item.src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </dialog>
  );
}
