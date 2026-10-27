import Image from "next/image";
import { photoUrl } from "@/lib/listing-options";

/** Foto do perfil; sem foto, a inicial do nome no roxo da marca. */
export function ProfileAvatar({
  name,
  path,
  size,
  className = "",
}: {
  name: string;
  path: string | null;
  size: number;
  className?: string;
}) {
  const base = `relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand-600 font-bold text-white ${className}`;
  return (
    <span className={base} style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden>
      {path ? <Image src={photoUrl(path)} alt="" fill sizes={`${size}px`} className="object-cover" /> : name.charAt(0).toUpperCase()}
    </span>
  );
}
