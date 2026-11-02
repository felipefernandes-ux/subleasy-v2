"use client";

import Link from "next/link";
import { useState } from "react";
import type { AdminUser } from "@/lib/superadmin/users";
import { Avatar, Pagination, RoleBadges, SearchInput, Segmented, Select, TableCard, UserStatusBadge } from "./ui";

const TABS: Array<{ label: string; status: string | null }> = [
  { label: "Todos", status: null },
  { label: "Ativos", status: "ativo" },
  { label: "Convite pendente", status: "convite_pendente" },
  { label: "Suspensos", status: "suspenso" },
];

/** Lista de usuários com abas por status. O filtro roda no navegador e a tabela reentra com fade a cada troca. */
export function UsersView({ users }: { users: AdminUser[] }) {
  const [active, setActive] = useState("Todos");
  const status = TABS.find((tab) => tab.label === active)?.status ?? null;
  const visible = status ? users.filter((user) => user.status === status) : users;

  return (
    <>
      <Segmented
        active={active}
        onChange={setActive}
        items={TABS.map((tab) => ({
          label: tab.label,
          count: tab.status ? users.filter((user) => user.status === tab.status).length : users.length,
        }))}
      />
      <div className="flex flex-wrap items-center gap-2 py-4">
        <SearchInput placeholder="Buscar por nome, e-mail ou WhatsApp" className="w-full sm:w-80" />
        <Select label="Papel" options={["Anunciante", "Cliente", "Admin"]} />
        <Select label="Cidade" options={[...new Set(users.map((user) => user.city).filter((city) => city !== "—"))].sort()} />
        <Select label="Cadastro" options={["Hoje", "Últimos 7 dias", "Últimos 30 dias"]} />
      </div>
      <div key={active} className="animate-[sa-tab-in_0.28s_cubic-bezier(0.2,0.7,0.2,1)_both] motion-reduce:animate-none">
        <TableCard footer={<Pagination total={visible.length} shown={visible.length} />}>
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
              {visible.map((user) => (
                <tr key={user.id}>
                  <td>
                    <Link href={`/usuarios/${user.id}`} className="flex items-center gap-3">
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
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sa-muted">
                    Nenhum usuário nesta aba.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableCard>
      </div>
    </>
  );
}
