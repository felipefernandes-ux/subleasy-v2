import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader, TableCard } from "@/components/superadmin/ui";
import { EmptyState, QuietTimelineArt } from "@/components/superadmin/empty-state";
import { createClient } from "@/lib/supabase/server";
import { AUDIT_ACTIONS } from "@/lib/superadmin/audit";
import { requireAdmin } from "@/lib/superadmin/auth";

export const metadata: Metadata = { title: "Registro de auditoria" };

const PAGE_SIZE = 200;

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

export default function AuditPage() {
  return (
    <>
      <PageHeader
        title="Registro de auditoria"
        description="Cada ação do admin grava quem fez, quando, o quê e o motivo. O registro só cresce: não tem edição nem exclusão, nem para você."
      />
      <Suspense fallback={<p className="py-10 text-center text-sa-muted">Carregando registro…</p>}>
        <AuditData />
      </Suspense>
    </>
  );
}

async function AuditData() {
  await requireAdmin("/configuracoes/auditoria");
  // Lê com a sessão do admin: a política da tabela só libera a leitura para quem é admin.
  const { data, count } = await (await createClient())
    .from("admin_audit_log")
    .select("id, created_at, admin_email, action, target_type, target_id, target_label, reason, details", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);
  const rows = data ?? [];

  if (rows.length === 0) {
    return (
      <Card>
        <EmptyState
          art={<QuietTimelineArt />}
          title="Nenhuma ação registrada"
          description="Aprovações, devoluções, remoções e convites feitos no painel aparecem aqui, com quem fez, quando e o motivo."
        />
      </Card>
    );
  }

  return (
    <TableCard footer={<span>Mostrando {rows.length} de {count ?? rows.length}, das mais recentes para as mais antigas.</span>}>
      <table className="sa-table">
        <thead>
          <tr>
            <th scope="col">Quando</th>
            <th scope="col">Quem</th>
            <th scope="col">Ação</th>
            <th scope="col">Alvo</th>
            <th scope="col">Motivo e detalhes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            // Anúncio excluído não tem mais ficha: só mostra o nome que ele tinha.
            const href =
              row.target_id && row.action !== "listing.delete"
                ? row.target_type === "listing"
                  ? `/anuncios/${row.target_id}`
                  : row.target_type === "user"
                    ? `/usuarios/${row.target_id}`
                    : null
                : null;
            const label = row.target_label ?? row.target_id ?? "—";
            const details = Object.entries((row.details ?? {}) as Record<string, unknown>).map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`);
            return (
              <tr key={row.id}>
                <td className="whitespace-nowrap text-sa-muted">{dateTime(row.created_at)}</td>
                <td>{row.admin_email}</td>
                <td className="font-semibold text-sa-ink">{AUDIT_ACTIONS[row.action] ?? row.action}</td>
                <td className="max-w-64 truncate">
                  {href ? (
                    <Link href={href} className="hover:text-brand-600">
                      {label}
                    </Link>
                  ) : (
                    label
                  )}
                </td>
                <td className="max-w-96 text-sa-muted">
                  {row.reason && <span className="block whitespace-pre-line text-sa-ink">{row.reason}</span>}
                  {details.length > 0 && <span className="block text-sa-xs">{details.join(" · ")}</span>}
                  {!row.reason && details.length === 0 && "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableCard>
  );
}
