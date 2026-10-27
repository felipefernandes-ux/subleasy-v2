import type { Metadata } from "next";
import { SoonPage } from "@/components/superadmin/soon-page";

export const metadata: Metadata = { title: "Lista de supressão" };

export default function Page() {
  return <SoonPage href="/superadmin/leads/supressao" />;
}
