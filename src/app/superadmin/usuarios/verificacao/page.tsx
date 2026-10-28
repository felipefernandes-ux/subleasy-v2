import type { Metadata } from "next";
import { SoonPage } from "@/components/superadmin/soon-page";

export const metadata: Metadata = { title: "Identidade verificada" };

export default function Page() {
  return <SoonPage href="/usuarios/verificacao" />;
}
