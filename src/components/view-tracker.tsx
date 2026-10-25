"use client";

import { useEffect } from "react";
import { recordView } from "@/app/actions/listing";

/** Conta a visita depois que a página abre. A página da sala fica em cache, então não dá para contar no servidor. */
export function ViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    recordView(listingId);
  }, [listingId]);
  return null;
}
