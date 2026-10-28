import type { Metadata } from "next";
import { SoonPage } from "@/components/superadmin/soon-page";

export const metadata: Metadata = { title: "Modelos de e-mail" };

export default function Page() {
  return <SoonPage href="/configuracoes/emails" />;
}
