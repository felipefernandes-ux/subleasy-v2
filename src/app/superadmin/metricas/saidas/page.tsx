import type { Metadata } from "next";
import { SoonPage } from "@/components/superadmin/soon-page";

export const metadata: Metadata = { title: "Motivos de saída" };

export default function Page() {
  return <SoonPage href="/metricas/saidas" />;
}
