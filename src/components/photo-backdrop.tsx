import Image from "next/image";

/**
 * Fundo para foto vertical numa moldura horizontal: a própria foto, ampliada e
 * desfocada, preenche as laterais. A foto de verdade vai por cima com object-contain,
 * inteira, em vez de cortada ao meio.
 */
export function PhotoBackdrop({ src, optimized = false }: { src: string; optimized?: boolean }) {
  const className = "pointer-events-none scale-125 object-cover opacity-80 blur-2xl";
  // Com next/image, o fundo baixa uma versão minúscula: o desfoque esconde a resolução.
  if (optimized) return <Image src={src} alt="" aria-hidden fill sizes="64px" className={className} />;
  // eslint-disable-next-line @next/next/no-img-element -- prévias locais (blob:) não passam pelo next/image
  return <img src={src} alt="" aria-hidden draggable={false} className={`absolute inset-0 size-full ${className}`} />;
}
