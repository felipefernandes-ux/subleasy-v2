import { Suspense } from "react";
import type { Metadata } from "next";
import { UserPlusIcon } from "@phosphor-icons/react/ssr";
import { ButtonLink, PageHeader } from "@/components/superadmin/ui";
import { requireAdmin } from "@/lib/superadmin/auth";
import { loadAdminUsers } from "@/lib/superadmin/users";
import { TableSkeleton } from "@/components/superadmin/skeletons";
import { UsersView } from "@/components/superadmin/users-view";

export const metadata: Metadata = { title: "Usuários" };

export default function UsersPage() {
  return (
    <>
      <PageHeader
        title="Usuários"
        description="Todas as contas de login, direto do banco. Admin fica em tabela própria e exige 2FA."
        actions={
          <ButtonLink href="/usuarios/novo" variant="primary">
            <UserPlusIcon className="size-4" weight="bold" aria-hidden />
            Convidar usuário
          </ButtonLink>
        }
      />
      <Suspense fallback={<TableSkeleton label="Carregando usuários" tabs={4} filters={3} />}>
        <UsersData />
      </Suspense>
    </>
  );
}

async function UsersData() {
  await requireAdmin("/usuarios");
  const users = await loadAdminUsers();
  return <UsersView users={users} />;
}
