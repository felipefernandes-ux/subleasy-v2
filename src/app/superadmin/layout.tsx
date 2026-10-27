import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SuperAdminShell } from "@/components/superadmin/shell";

// Mesma família do Attio: Inter para a interface e InterDisplay para títulos.
// O InterDisplay é o eixo óptico (opsz) da Inter, então uma única fonte variável cobre as duas.
const inter = Inter({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-sa-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Super Admin", template: "%s | Super Admin" },
  robots: { index: false, follow: false },
};

export default function SuperAdminLayout({ children }: LayoutProps<"/superadmin">) {
  return (
    <div className={inter.variable}>
      <SuperAdminShell>{children}</SuperAdminShell>
    </div>
  );
}
