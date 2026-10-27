import { Suspense } from "react";
import type { Metadata } from "next";
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
import { loadAdminListings } from "@/lib/superadmin/listings";

export const metadata: Metadata = { title: "Anúncio" };

export default function ListingDetailPage({ params }: PageProps<"/superadmin/anuncios/[id]">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-sa-muted">Carregando anúncio…</p>}>
      <ListingDetail params={params} />
    </Suspense>
  );
}

async function ListingDetail({ params }: { params: PageProps<"/superadmin/anuncios/[id]">["params"] }) {
  const { id } = await params;
  await requireAdmin(`/superadmin/anuncios/${id}`);
  const [listing] = await loadAdminListings(id);
  if (!listing) notFound();

  const inReview = listing.status === "em_revisao";

  return (
    <>
      <PageHeader
        eyebrow={<ListingStatusBadge status={listing.status} />}
        title={listing.title}
        description={`${listing.type} · ${listing.neighborhood}, ${listing.city} · ${listing.price}`}
        actions={
          <>
            <ButtonLink href="/superadmin/anuncios" variant="ghost">
              Voltar
            </ButtonLink>
            {/* /sala/[slug] mostra uma prévia para o admin mesmo se o anúncio não estiver no ar. */}
            <ButtonLink href={`/sala/${listing.slug}`} target="_blank" rel="noopener">
              <ArrowSquareOutIcon className="size-4" weight="bold" aria-hidden />
              Ver ao vivo
            </ButtonLink>
            <Button>
              <PencilSimpleIcon className="size-4" weight="bold" aria-hidden />
              Editar
            </Button>
          </>
        }
      />

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
            <CardHeader title="Histórico" />
            <ol className="divide-y divide-sa-haze text-sa-base">
              {[
                ["Enviado / criado", listing.submitted],
                ["Anúncio criado", listing.createdBy],
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
                redirectTo="/superadmin/anuncios"
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Anunciante" />
            <div className="flex items-center gap-3 px-5 py-4">
              <Avatar name={listing.owner} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{listing.owner}</p>
                <p className="truncate text-sa-sm text-sa-muted">{listing.ownerEmail}</p>
              </div>
            </div>
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
