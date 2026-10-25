"use client";

import { useState } from "react";
import Image from "next/image";
import { isPortrait } from "@/lib/listing-options";
import { PhotoBackdrop } from "./photo-backdrop";

/**
 * Foto numa moldura horizontal (o pai define o tamanho e o position). Usa o tamanho
 * gravado em photo_sizes e, sem ele, mede a foto ao carregar: fotos antigas também
 * aparecem inteiras quando são verticais.
 */
export function FramedPhoto({
  src,
  alt,
  size,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  size?: [number, number];
  sizes: string;
  priority?: boolean;
}) {
  const [measured, setMeasured] = useState<[number, number]>();
  const portrait = isPortrait(size ?? measured);
  return (
    <>
      {portrait && <PhotoBackdrop src={src} optimized />}
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        onLoad={(event) => setMeasured([event.currentTarget.naturalWidth, event.currentTarget.naturalHeight])}
        className={portrait ? "object-contain" : "object-cover"}
      />
    </>
  );
}
