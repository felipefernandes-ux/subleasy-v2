import type { Metadata } from "next";
import { SoonPage } from "@/components/superadmin/soon-page";

export const metadata: Metadata = { title: "Link de migração" };

export default function Page() {
  return <SoonPage href="/leads/migracao" />;
}
