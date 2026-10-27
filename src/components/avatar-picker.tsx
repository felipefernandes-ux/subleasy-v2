"use client";

import { useId, useRef, useState, useTransition } from "react";
import { CameraIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { updateAvatar } from "@/app/actions/account";
import { AVATAR_FOLDER, PROFILE_CHANGED_EVENT } from "@/lib/public-profile";
import { PHOTO_BUCKET } from "@/lib/listing-options";
import { createClient } from "@/lib/supabase/client";
import { ProfileAvatar } from "./profile-avatar";

const SIZE = 480;

/**
 * Foto do perfil público: corta no centro em quadrado de 480px, comprime e envia para
 * listing-photos/<usuário>/perfil/. Devolve o caminho em onChange.
 */
export function AvatarPicker({
  name,
  initialPath,
  onChange,
}: {
  name: string;
  initialPath: string | null;
  onChange: (path: string | null) => Promise<string | null> | void;
}) {
  const [path, setPath] = useState(initialPath);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();

  function pick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    startTransition(async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("sem sessão");
        const blob = await squarePhoto(file);
        const target = `${user.id}/${AVATAR_FOLDER}/${Date.now()}.${blob.type === "image/webp" ? "webp" : "jpg"}`;
        const { error: uploadError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(target, blob, { contentType: blob.type, cacheControl: "31536000" });
        if (uploadError) throw uploadError;
        const saveError = await onChange(target);
        if (saveError) return setError(saveError);
        setPath(target);
      } catch (cause) {
        console.error("[AvatarPicker]", cause);
        setError("Não foi possível enviar a foto. Tente outra imagem.");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const saveError = await onChange(null);
      if (saveError) return setError(saveError);
      setPath(null);
    });
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <ProfileAvatar name={name || "?"} path={path} size={80} />
        {isPending && (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-white/70">
            <CircleNotchIcon className="size-6 animate-spin text-brand-600" weight="bold" aria-label="Enviando" />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
            aria-describedby={hintId}
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-control font-bold text-brand-600 hover:text-brand-700 disabled:opacity-60"
          >
            <CameraIcon className="size-5" aria-hidden />
            {path ? "Trocar foto" : "Adicionar foto"}
          </button>
          {path && (
            <button
              type="button"
              onClick={remove}
              disabled={isPending}
              className="focus-ring inline-flex min-h-11 items-center rounded-control font-bold text-ink-600 hover:text-ink-900 disabled:opacity-60"
            >
              Remover
            </button>
          )}
        </div>
        <p id={hintId} className="text-sm text-ink-600">
          Uma foto sua ou o logo da clínica. Aparece no seu perfil público e nos seus anúncios.
        </p>
        {error && (
          <p role="alert" className="mt-1 text-sm text-danger-600">
            {error}
          </p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => pick(event.target.files)}
      />
    </div>
  );
}

/** Versão das configurações: salva na hora e apaga a foto anterior. */
export function AvatarSetting({ name, initialPath }: { name: string; initialPath: string | null }) {
  return (
    <AvatarPicker
      name={name}
      initialPath={initialPath}
      onChange={async (path) => {
        const result = await updateAvatar(path);
        if (!result.ok) return result.error;
        window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));
        return null;
      }}
    />
  );
}

// Corta o maior quadrado central e reduz para 480px. WebP quando o navegador gera, senão JPEG.
async function squarePhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(SIZE, side);
  canvas.height = canvas.width;
  canvas
    .getContext("2d")
    ?.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const toBlob = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  const webp = await toBlob("image/webp");
  if (webp?.type === "image/webp") return webp;
  const jpeg = await toBlob("image/jpeg");
  if (!jpeg) throw new Error("não foi possível converter a foto");
  return jpeg;
}
