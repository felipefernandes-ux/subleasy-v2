import type { Metadata } from "next";
import { SoonPage } from "@/components/superadmin/soon-page";

export const metadata: Metadata = { title: "Destaques e patrocinados" };

export default function Page() {
  return <SoonPage href="/superadmin/anuncios/destaques" />;
}
