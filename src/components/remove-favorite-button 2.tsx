"use client";

import { useTransition } from "react";
import { CircleNotchIcon, HeartIcon } from "@phosphor-icons/react";
import { removeFromList } from "@/app/actions/favorites";

/** Coração cheio no cartão da lista: um clique tira a sala da lista. */
export function RemoveFavoriteButton({ listId, listingId, title }: { listId: string; listingId: string; title: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => removeFromList(listId, listingId))}
      aria-label={`Tirar “${title}” da lista`}
      title="Tirar da lista"
      className="focus-ring grid size-9 place-items-center rounded-full bg-white/95 text-danger-600 shadow-xs transition-transform hover:scale-105 disabled:opacity-70"
    >
      {isPending ? <CircleNotchIcon className="size-4.5 animate-spin" weight="bold" aria-hidden /> : <HeartIcon className="size-5" weight="fill" aria-hidden />}
    </button>
  );
}
