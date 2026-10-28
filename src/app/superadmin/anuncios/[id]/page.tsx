import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowSquareOutIcon, CheckIcon, PauseIcon, ArrowClockwiseIcon, PencilSimpleIcon } from "@phosphor-icons/react/ssr";
import { ConfirmDialog } from "@/components/superadmin/confirm-dialog";
import { DeleteListingsDialog } from "@/components/superadmin/delete-listings-dialog";
import {
  Avatar,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  DefinitionList,
  ListingStatusBadge,
  OriginLabel,
  PageHeader,
} from "@/components/superadmin/ui";
import { requireAdmin } from "@/lib/superadmin/auth";
import { AMENITIES, BILLING_TYPES, HIGHLIGHTS, OFFERS, SPACE_TYPES, formatWhatsApp } from "@/lib/listing-options";
import { getPublicOrigin } from "@/lib/origin";
import { loadListingFull } from "@/lib/superadmin/listing-detail";
import { loadAdminListings } from "@/lib/superadmin/listings";

export const metadata: Metadata = { title: "Anúncio" };

export default function ListingDetailPage({ params, searchParams }: PageProps<"/superadmin/anuncios/[id]">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-sa-muted">Carregando anúncio…</p>}>
      <ListingDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const dateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }) : "—";
const list = (items: string[], labels: Record<string, string>) => (items.length ? items.map((key) => labels[key] ?? key).join(", ") : "—");

async function ListingDetail({
  params,
  searchParams,
}: {
  params: PageProps<"/superadmin/anuncios/[id]">["params"];
  searchParams: PageProps<"/superadmin/anuncios/[id]">["searchParams"];
}) {
  const { id } = await params;
  const saved = (await searchParams).salvo === "1";
  await requireAdmin(`/anuncios/${id}`);
  const [[listing], full] = await Promise.all([loadAdminListings(id), loadListingFull(id)]);
  if (!listing || !full) notFound();
  const { listing: row, contact, imported, counts, inquiries } = full;
  const noWhatsapp = !contact?.whatsapp_number;
  const publicOrigin = await getPublicOrigin();

  const inReview = listing.status === "em_revisao";

  return (
    <>
      <PageHeader
        eyebrow={<ListingStatusBadge status={listing.status} />}
        title={listing.title}
        description={`${listing.type} · ${listing.neighborhood}, ${listing.city} · ${listing.price}`}
        actions={
          <>
            <ButtonLink href="/anuncios" variant="ghost">
              Voltar
            </ButtonLink>
            {/* /sala/[slug] mostra uma prévia para o admin mesmo se o anúncio não estiver no ar. */}
            <ButtonLink href={`${publicOrigin}/sala/${listing.slug}`} target="_blank" rel="noopener">
              <ArrowSquareOutIcon className="size-4" weight="bold" aria-hidden />
              Ver ao vivo
            </ButtonLink>
            <ButtonLink href={`/anuncios/${id}/editar`} variant="primary">
              <PencilSimpleIcon className="size-4" weight="bold" aria-hidden />
              Editar
            </ButtonLink>
          </>
        }
      />

      {saved && (
        <p role="status" className="mb-6 rounded-sa-card bg-mint-100 p-4 text-sa-base text-[#064e3b]">
          Anúncio salvo.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            {listing.photoUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-1 bg-sa-haze p-1 sm:grid-cols-4">
                {listing.photoUrls.map((url, index) => (
                  // eslint-disable-next-line @next/next/no-img-element -- miniatura de revisão do admin, sem otimização
                  <img
                    key={url}
                    src={url}
                    alt={`Foto ${index + 1} de ${listing.photoUrls.length}`}
                    loading="lazy"
                    className={`aspect-[4/3] w-full rounded-sa-badge object-cover ${index === 0 ? "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2" : ""}`}
                  />
                ))}
              </div>
            ) : (
              <p className="bg-sa-paper px-5 py-8 text-center text-sa-sm text-sa-muted">Este anúncio não tem fotos.</p>
            )}
            <div className="space-y-3 p-5 text-sa-base text-sa-body">
              {listing.summary && <p className="font-semibold text-sa-ink">{listing.summary}</p>}
              <p className="whitespace-pre-line">{listing.description || "Sem descrição."}</p>
              {listing.reviewNote && (
                <p className="rounded-sa-card bg-sa-paper p-3 text-sa-sm text-sa-muted">Nota da revisão: {listing.reviewNote}</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Dados do anúncio" description="Tudo o que está gravado. Para mudar qualquer campo, use Editar." />
            <DefinitionList
              items={[
                ["Área de atuação", SPACE_TYPES[row.space_type as keyof typeof SPACE_TYPES] ?? row.space_type],
                ...(row.space_type_other ? ([["Outro espaço", row.space_type_other]] as Array<[string, string]>) : []),
                ["Cobrança", BILLING_TYPES[row.billing_type as keyof typeof BILLING_TYPES] ?? row.billing_type],
                ["Preço", listing.price],
                ["Período mínimo", row.min_rental_period ?? "—"],
                ["Bairro", row.neighborhood],
                ["Cidade / UF", `${row.city} / ${row.state.trim()}`],
                ["CEP", row.zip_code ?? "—"],
                ["Endereço completo (privado)", contact?.street_address ?? "—"],
                ["Mapa", row.latitude != null ? `${row.latitude}, ${row.longitude} (${row.show_exact_location ? "ponto exato" : "área aproximada"})` : "Sem coordenadas"],
                ["Comodidades", list(row.amenities, AMENITIES)],
                ["Destaques", list(row.highlights, HIGHLIGHTS)],
                ["Ofertas", list(row.offers, Object.fromEntries(Object.entries(OFFERS).map(([key, offer]) => [key, offer.title])))],
                ["Regras", row.rules.length ? row.rules.join(" · ") : "—"],
                ["Fotos", String(row.photos.length)],
              ]}
            />
          </Card>

          <Card>
            <CardHeader
              title="Contato"
              description={
                noWhatsapp
                  ? "Sem WhatsApp: a página pública esconde o botão e mostra o formulário de mensagem."
                  : "Com WhatsApp: o botão abre a conversa. O formulário só aparece se o e-mail estiver ligado."
              }
            />
            <DefinitionList
              items={[
                ["WhatsApp do anúncio", contact?.whatsapp_number ? formatWhatsApp(contact.whatsapp_number) : "Sem WhatsApp"],
                ["E-mail de contato", contact?.contact_email ?? "—"],
                ["Formulário para quem tem WhatsApp", row.email_contact ? "Ligado" : "Desligado"],
                ["Mensagens vão para", contact?.contact_email || listing.ownerEmail || "—"],
                ["Visualizações", String(counts.view)],
                ["Cliques no WhatsApp", String(counts.whatsapp_click)],
                ["Mensagens pelo formulário", String(counts.email_click)],
              ]}
            />
          </Card>

          <Card>
            <CardHeader title="Contatos recebidos" description="Visão completa do Super Admin, com e-mail e telefone. O anunciante vê só nome, mensagem e horário." />
            {inquiries.length === 0 ? (
              <p className="px-5 py-6 text-sa-sm text-sa-muted">Nenhuma mensagem pelo formulário ainda.</p>
            ) : (
              <ul className="divide-y divide-sa-haze">
                {inquiries.map((inquiry) => (
                  <li key={inquiry.id} className="space-y-1 px-5 py-4 text-sa-base">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <p className="font-semibold text-sa-ink">{inquiry.name}</p>
                      <p className="text-sa-xs text-sa-muted">{dateTime(inquiry.created_at)}</p>
                    </div>
                    <p className="text-sa-sm text-sa-muted">
                      {inquiry.email}
                      {inquiry.phone && ` · ${inquiry.phone}`}
                    </p>
                    <p className="whitespace-pre-line text-sa-body">{inquiry.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {imported && (
            <Card>
              <CardHeader title="Origem: importação do WordPress" />
              <DefinitionList
                items={[
                  ["Anúncio original", <a key="u" href={imported.source_url} target="_blank" rel="noopener noreferrer" className="underline">{imported.source_url}</a>],
                  ["ID de origem", imported.source_id],
                  ["Status no WordPress", `${imported.source_status} (${imported.wp_status})`],
                  ["Importado em", dateTime(imported.imported_at)],
                ]}
              />
              {imported.extras && typeof imported.extras === "object" && Object.keys(imported.extras).length > 0 && (
                <pre className="overflow-x-auto border-t border-sa-haze px-5 py-4 text-sa-xs text-sa-muted">{JSON.stringify(imported.extras, null, 2)}</pre>
              )}
            </Card>
          )}

          <Card>
            <CardHeader title="Histórico" />
            <ol className="divide-y divide-sa-haze text-sa-base">
              {[
                ["Criado em", dateTime(row.created_at)],
                ["Enviado para revisão", dateTime(row.submitted_at)],
                ["Publicado em", dateTime(row.published_at)],
                ["Válido até", dateTime(row.expires_at)],
                ["Última alteração", dateTime(row.updated_at)],
                ["Criado por", listing.createdBy],
                ["Endereço da página", `/sala/${row.slug}`],
              ].map(([label, meta]) => (
                <li key={label} className="flex justify-between gap-4 px-5 py-3">
                  <span>{label}</span>
                  <span className="text-sa-muted">{meta}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Ações" description="Remover apaga o anúncio e as fotos de vez, e pede confirmação." />
            <div className="flex flex-col gap-2 p-5">
              {inReview && (
                <>
                  <Button variant="primary">
                    <CheckIcon className="size-4" weight="bold" aria-hidden />
                    Aprovar e colocar no ar
                  </Button>
                  <ConfirmDialog
                    trigger="Devolver com nota"
                    title="Devolver com nota"
                    description="O anunciante recebe a nota por e-mail e pode ajustar o anúncio."
                    confirmLabel="Devolver anúncio"
                    reasonLabel="Nota para o anunciante"
                  />
                </>
              )}
              <ConfirmDialog
                trigger={
                  <>
                    <PauseIcon className="size-4" weight="bold" aria-hidden />
                    Pausar
                  </>
                }
                title="Pausar anúncio"
                description="O anúncio sai das buscas até ser reativado."
                confirmLabel="Pausar"
              />
              <Button>
                <ArrowClockwiseIcon className="size-4" weight="bold" aria-hidden />
                Renovar por 30 dias
              </Button>
              <DeleteListingsDialog
                listings={[listing]}
                label="Remover anúncio"
                small={false}
                redirectTo="/anuncios"
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Anunciante" />
            <Link href={`/usuarios/${listing.ownerId}`} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-sa-paper">
              <Avatar name={listing.owner} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{listing.owner}</p>
                <p className="truncate text-sa-sm text-sa-muted">{listing.ownerEmail}</p>
              </div>
              <span className="shrink-0 text-sa-sm font-semibold text-brand-600">Ver dados</span>
            </Link>
            <DefinitionList
              items={[
                ["Origem", <OriginLabel key="o" origin={listing.origin} />],
                ["Criado por", listing.createdBy],
                ["Autorização", listing.authorization ?? "Pelo próprio anunciante"],
                ["Validade", listing.expires],
                ["Visualizações", listing.views],
                ["Contatos", listing.contacts],
              ]}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
