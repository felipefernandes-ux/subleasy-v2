import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminBadge } from "@/components/superadmin/admin-badge";
import { SuperAdminShell } from "@/components/superadmin/shell";

export const metadata: Metadata = {
  title: { default: "Super Admin", template: "%s | Super Admin" },
  robots: { index: false, follow: false },
};

// A Inter vem do layout raiz (--font-inter), a mesma do site público.
export default function SuperAdminLayout({ children }: LayoutProps<"/superadmin">) {
  return (
    <SuperAdminShell
      footer={
        <Suspense>
          <AdminBadge />
        </Suspense>
      }
    >
      {children}
    </SuperAdminShell>
  );
}
