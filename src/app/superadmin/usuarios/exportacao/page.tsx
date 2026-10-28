import type { Metadata } from "next";
import { SoonPage } from "@/components/superadmin/soon-page";

export const metadata: Metadata = { title: "Exportar dados" };

export default function Page() {
  return <SoonPage href="/usuarios/exportacao" />;
}
