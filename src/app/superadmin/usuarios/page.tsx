import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { UserPlusIcon } from "@phosphor-icons/react/ssr";
import {
  Avatar,
  ButtonLink,
  PageHeader,
  Pagination,
  RoleBadges,
  SearchInput,
  Segmented,
  Select,
  TableCard,
  UserStatusBadge,
} from "@/components/superadmin/ui";
import { requireAdmin } from "@/lib/superadmin/auth";
import { loadAdminUsers } from "@/lib/superadmin/users";

export const metadata: Metadata = { title: "Usuários" };

export default function UsersPage() {
  return (
    <>
      <PageHeader
        title="Usuários"
        description="Todas as contas de login, direto do banco. Admin fica em tabela própria e exige 2FA."
        actions={
          <ButtonLink href="/superadmin/usuarios/novo" variant="primary">
            <UserPlusIcon className="size-4" weight="bold" aria-hidden />
            Convidar usuário
          </ButtonLink>
        }
      />
      <Suspense fallback={<p className="py-10 text-center text-sa-muted">Carregando usuários…</p>}>
        <UsersData />
      </Suspense>
    </>
  );
}

async function UsersData() {
  await requireAdmin("/superadmin/usuarios");
  const users = await loadAdminUsers();

  return (
    <>
      <Segmented
        active="Todos"
        items={[
          { label: "Todos", count: users.length },
          { label: "Ativos", count: users.filter((user) => user.status === "ativo").length },
          { label: "Convite pendente", count: users.filter((user) => user.status === "convite_pendente").length },
          { label: "Suspensos", count: users.filter((user) => user.status === "suspenso").length },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2 py-4">
        <SearchInput placeholder="Buscar por nome, e-mail ou WhatsApp" className="w-full sm:w-80" />
        <Select label="Papel" options={["Anunciante", "Cliente", "Admin"]} />
        <Select label="Cidade" options={[...new Set(users.map((user) => user.city).filter((city) => city !== "—"))].sort()} />
        <Select label="Cadastro" options={["Hoje", "Últimos 7 dias", "Últimos 30 dias"]} />
      </div>
      <TableCard footer={<Pagination total={users.length} shown={users.length} />}>
        <table className="sa-table">
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Papéis</th>
              <th scope="col">Status</th>
              <th scope="col">Cidade</th>
              <th scope="col">Anúncios</th>
              <th scope="col">Cadastro</th>
              <th scope="col">Último acesso</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <Link href={`/superadmin/usuarios/${user.id}`} className="flex items-center gap-3">
                    <Avatar name={user.name} />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-sa-ink hover:text-brand-600">{user.name}</span>
                      <span className="block truncate text-sa-xs text-sa-muted">{user.email}</span>
                    </span>
                  </Link>
                </td>
                <td>
                  <RoleBadges roles={user.roles} />
                </td>
                <td>
                  <UserStatusBadge status={user.status} />
                </td>
                <td className="text-sa-body">{user.city}</td>
                <td className="text-sa-body">{user.listings}</td>
                <td className="whitespace-nowrap text-sa-muted">{user.joined}</td>
                <td className="whitespace-nowrap text-sa-muted">{user.lastSignIn ?? "Nunca entrou"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </>
  );
}
