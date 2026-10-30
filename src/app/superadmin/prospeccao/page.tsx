import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { MagnifyingGlassIcon, UploadSimpleIcon } from "@phosphor-icons/react/ssr";
import { ProspectStatusBadge, dateTime } from "@/components/superadmin/prospect-ui";
import { EmptyState, QueueClearArt } from "@/components/superadmin/empty-state";
import { Badge, ButtonLink, Card, PageHeader, StatCard, TableCard } from "@/components/superadmin/ui";
import { PROSPECT_STATUSES, PROSPECT_STATUS_KEYS, SPECIALTIES, type Specialty } from "@/lib/prospecting/status";
import { requireAdmin } from "@/lib/superadmin/auth";
import { PAGE_SIZE, loadProspects } from "@/lib/superadmin/prospects";

export const metadata: Metadata = { title: "Prospects" };

export default function ProspectsPage({ searchParams }: PageProps<"/superadmin/prospeccao">) {
  return (
    <>
      <PageHeader
        title="Prospects"
        description="Locais que ainda não anunciam. Cada um tem a mensagem pronta para o WhatsApp, uma prévia de anúncio por link e o status do contato."
        actions={
          <ButtonLink href="/prospeccao/importar" variant="primary">
            <UploadSimpleIcon className="size-4" weight="bold" aria-hidden />
            Importar planilha
          </ButtonLink>
        }
      />
      <Suspense fallback={<p className="py-10 text-center text-sa-muted">Carregando…</p>}>
        <Prospects searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function href(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") query.set(key, String(value));
  const text = query.toString();
  return text ? `/prospeccao?${text}` : "/prospeccao";
}

async function Prospects({ searchParams }: { searchParams: PageProps<"/superadmin/prospeccao">["searchParams"] }) {
  await requireAdmin("/prospeccao");
  const query = await searchParams;
  const status = first(query.status);
  const q = first(query.q);
  const channel = first(query.canal);
  const page = Number(first(query.p)) || 1;
  const { items, total, byStatus, all } = await loadProspects({ status, q, channel, page });

  if (all === 0) {
    return (
      <Card>
        <EmptyState
          art={<QueueClearArt />}
          title="Nenhum prospect ainda"
          description="Importe a aba da planilha de prospecção para começar. Os contatos entram como Novo."
          action={
            <ButtonLink href="/prospeccao/importar" variant="primary">
              Importar planilha
            </ButtonLink>
          }
        />
      </Card>
    );
  }

  const pending = items.reduce((sum, item) => sum + item.pendingClaims, 0);
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Na base" value={all} />
        <StatCard label="Mensagem ou prévia enviada" value={(byStatus.mensagem_enviada ?? 0) + (byStatus.previa_enviada ?? 0)} />
        <StatCard label="Responderam" value={byStatus.respondeu ?? 0} />
        <StatCard label="Querem o anúncio" value={byStatus.quer_anuncio ?? 0} hint={pending ? `${pending} pedido(s) por tratar nesta página` : undefined} />
      </div>

      <nav aria-label="Filtrar por status" className="mb-4 flex flex-wrap gap-1.5">
        <Link href={href({ q, canal: channel })} className={`sa-btn sa-btn-sm ${status ? "sa-btn-ghost" : "sa-btn-outline"}`}>
          Todos <span className="text-sa-muted">{all}</span>
        </Link>
        {PROSPECT_STATUS_KEYS.map((key) => (
          <Link key={key} href={href({ status: key, q, canal: channel })} className={`sa-btn sa-btn-sm ${status === key ? "sa-btn-outline" : "sa-btn-ghost"}`}>
            {PROSPECT_STATUSES[key]} <span className="text-sa-muted">{byStatus[key] ?? 0}</span>
          </Link>
        ))}
      </nav>

      <form action="/prospeccao" className="mb-4 flex flex-wrap items-center gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sa-subtle" aria-hidden />
          <input type="search" name="q" defaultValue={q} placeholder="Buscar por nome ou endereço" aria-label="Buscar por nome ou endereço" className="sa-input w-72 pl-9" />
        </div>
        <select name="canal" defaultValue={channel ?? ""} aria-label="Canal" className="sa-input w-auto min-w-40 pr-8">
          <option value="">Todos os canais</option>
          <option value="whatsapp">Com WhatsApp</option>
          <option value="sem_whatsapp">Sem WhatsApp</option>
        </select>
        <button type="submit" className="sa-btn sa-btn-outline">
          Filtrar
        </button>
      </form>

      {items.length === 0 ? (
        <Card>
          <EmptyState art={<QueueClearArt />} title="Nada com esses filtros" description="Tire um filtro ou mude a busca." />
        </Card>
      ) : (
        <TableCard
          footer={
            <>
              <span>
                Mostrando {(page - 1) * PAGE_SIZE + 1} a {(page - 1) * PAGE_SIZE + items.length} de {total}
              </span>
              <span className="flex gap-1.5">
                {page > 1 && (
                  <Link href={href({ status, q, canal: channel, p: page - 1 })} className="sa-btn sa-btn-outline sa-btn-sm">
                    Anterior
                  </Link>
                )}
                {page * PAGE_SIZE < total && (
                  <Link href={href({ status, q, canal: channel, p: page + 1 })} className="sa-btn sa-btn-outline sa-btn-sm">
                    Próxima
                  </Link>
                )}
              </span>
            </>
          }
        >
          <table className="sa-table">
            <thead>
              <tr>
                <th scope="col">Local</th>
                <th scope="col">Área</th>
                <th scope="col">Canal</th>
                <th scope="col">Status</th>
                <th scope="col">Toques</th>
                <th scope="col">Prévia</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="max-w-md">
                    <Link href={`/prospeccao/${item.id}`} className="block truncate font-semibold text-sa-ink hover:text-brand-700">
                      {item.name}
                    </Link>
                    <span className="block truncate text-sa-xs text-sa-muted">{item.address ?? "Sem endereço"}</span>
                  </td>
                  <td className="whitespace-nowrap text-sa-body">{item.specialty ? SPECIALTIES[item.specialty as Specialty] : "—"}</td>
                  <td>{item.whatsapp_number ? <Badge tone="success">WhatsApp</Badge> : <Badge>Sem WhatsApp</Badge>}</td>
                  <td>
                    <ProspectStatusBadge status={item.status} />
                    {item.pendingClaims > 0 && (
                      <span className="ml-1.5">
                        <Badge tone="warning">Pedido novo</Badge>
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-sa-muted">
                    {item.touches}
                    {item.last_contact_at && <span className="block text-sa-xs">{dateTime(item.last_contact_at)}</span>}
                  </td>
                  <td className="whitespace-nowrap text-sa-muted">{item.hasPreview ? `${item.previewViews} visita(s)` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
    </>
  );
}
