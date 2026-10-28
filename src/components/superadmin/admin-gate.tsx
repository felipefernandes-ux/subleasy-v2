import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/superadmin/auth";

/** Barra quem não é admin em páginas que não leem dados. Use dentro de um <Suspense>. */
export async function AdminGate({ next, children }: { next: string; children: ReactNode }) {
  await requireAdmin(next);
  return children;
}
