import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowSquareOutIcon, CheckIcon, PauseIcon, ArrowClockwiseIcon, PencilSimpleIcon } from "@phosphor-icons/react/ssr";
import { ConfirmDialog } from "@/components/superadmin/confirm-dialog";
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
import { LISTINGS, USERS } from "../../_data/mock";

export const metadata: Metadata = { title: "Anúncio" };

// Slug fictício a partir do título; no banco é o slug real do anúncio.
const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Ids conhecidos em tempo de build: a rota é pré-renderizada em vez de esperar o runtime.
export function generateStaticParams() {
  return LISTINGS.map(({ id }) => ({ id }));
}

export default async function ListingDetailPage({ params }: PageProps<"/superadmin/anuncios/[id]">) {
  const { id } = await params;
  const listing = LISTINGS.find((item) => item.id === id);
  if (!listing) notFound();

  const owner = USERS.find((user) => user.email === listing.ownerEmail);
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
            <ButtonLink href={`/sala/${slugify(listing.title)}`} target="_blank" rel="noopener">
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
            <div className="grid grid-cols-4 grid-rows-2 gap-1 bg-sa-haze p-1">
              <div className="col-span-2 row-span-2 aspect-[4/3] rounded-sa-badge bg-sa-line" />
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="aspect-[4/3] rounded-sa-badge bg-sa-line/70" />
              ))}
            </div>
            <div className="space-y-3 p-5 text-sa-base text-sa-body">
              <p>
                Sala silenciosa e bem iluminada, com mobiliário completo, ar-condicionado e recepção compartilhada. Atendimento
                por turno ou por hora, de segunda a sábado. Estacionamento conveniado na esquina.
              </p>
              <p className="text-sa-sm text-sa-muted">Texto de exemplo. O conteúdo real do anúncio aparece aqui.</p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Histórico" />
            <ol className="divide-y divide-sa-haze text-sa-base">
              {[
                ["Enviado para revisão", listing.submitted],
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
            <CardHeader title="Ações" description="Remover e devolver pedem motivo e vão para a auditoria." />
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
              <ConfirmDialog
                trigger="Remover anúncio"
                triggerVariant="danger"
                title="Remover anúncio"
                description="O anúncio sai do ar e o anunciante é avisado. O motivo fica no registro de auditoria."
                confirmLabel="Remover"
                danger
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
              {owner && (
                <ButtonLink href={`/superadmin/usuarios/${owner.id}`} small className="ml-auto">
                  Ficha
                </ButtonLink>
              )}
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
