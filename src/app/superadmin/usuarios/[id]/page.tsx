import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EyeIcon } from "@phosphor-icons/react/ssr";
import { deleteUser, reactivateUser, suspendUser } from "@/app/superadmin/usuarios/actions";
import { ConfirmDialog } from "@/components/superadmin/confirm-dialog";
import { UserRolesCard } from "@/components/superadmin/user-roles-card";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  DefinitionList,
  ListingStatusBadge,
  PageHeader,
  RoleBadges,
  SoonBadge,
  UserStatusBadge,
} from "@/components/superadmin/ui";
import { requireAdmin } from "@/lib/superadmin/auth";
import { loadAdminListings } from "@/lib/superadmin/listings";
import { loadAdminUsers } from "@/lib/superadmin/users";

export const metadata: Metadata = { title: "Ficha do usuário" };

export default function UserDetailPage({ params }: PageProps<"/superadmin/usuarios/[id]">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-sa-muted">Carregando ficha…</p>}>
      <UserDetail params={params} />
    </Suspense>
  );
}

async function UserDetail({ params }: { params: PageProps<"/superadmin/usuarios/[id]">["params"] }) {
  const { id } = await params;
  const viewer = await requireAdmin(`/usuarios/${id}`);
  const [user] = await loadAdminUsers(id);
  if (!user) notFound();

  const listings = (await loadAdminListings()).filter((listing) => listing.ownerId === user.id);
  const suspended = user.status === "suspenso";
  const isSelf = viewer.id === user.id;
  const isAdmin = user.roles.includes("admin");

  return (
    <>
      <PageHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <UserStatusBadge status={user.status} />
            <Badge>
              <EyeIcon className="size-3" aria-hidden />
              Modo leitura
            </Badge>
          </span>
        }
        title={user.name}
        description="Você vê a conta, e o painel dela só em leitura, mas nunca entra como a pessoa nem define a senha dela. A consulta desta ficha entra na auditoria."
        actions={
          <>
            <ButtonLink href={`/admin/ver-como/${user.id}`} variant="primary">
              <EyeIcon className="size-4" weight="bold" aria-hidden />
              Ver painel do usuário
            </ButtonLink>
            <ButtonLink href="/usuarios" variant="ghost">
              Voltar
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-4 border-b border-sa-haze px-5 py-4">
              <Avatar name={user.name} size="lg" />
              <div className="min-w-0">
                <p className="truncate sa-display text-sa-title font-semibold">{user.name}</p>
                <RoleBadges roles={user.roles} />
              </div>
            </div>
            <DefinitionList
              items={[
                ["E-mail", user.email],
                ["WhatsApp", user.whatsapp],
                ["Cidade", user.city],
                ["Cadastro", user.joined],
                ["Anúncios", user.listings],
                ["Último acesso", user.lastSignIn ?? "Nunca entrou"],
                ["Entrada", user.provider === "google" ? "Google" : "Código por e-mail"],
              ]}
            />
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Anúncios" />
            {listings.length > 0 ? (
              <ul className="divide-y divide-sa-haze">
                {listings.map((listing) => (
                  <li key={listing.id}>
                    <Link href={`/anuncios/${listing.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-sa-paper">
                      <span className="min-w-0 flex-1 truncate font-semibold">{listing.title}</span>
                      <ListingStatusBadge status={listing.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sa-base text-sa-muted">Esta pessoa ainda não tem anúncios.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Consentimentos" description="Prova de consentimento, guardada separada do perfil." />
            <DefinitionList
              items={[
                ["Termos de uso", user.termsAcceptedAt ? `Aceitos em ${user.termsAcceptedAt}` : "Ainda não aceitos"],
                [
                  "Novidades por e-mail",
                  user.marketing ? (
                    <Badge tone="success" dot>
                      Aceitou em {user.marketingAt ?? user.joined}
                    </Badge>
                  ) : (
                    <Badge>Não aceitou</Badge>
                  ),
                ],
              ]}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Papéis" description="Admin só com 2FA ativo." />
            <UserRolesCard
              userId={user.id}
              roles={user.roles}
              locked={isSelf}
              lockedReason="Você não muda os próprios papéis. Peça a outro admin."
            />
          </Card>

          <Card>
            <CardHeader title="Ações da conta" />
            <div className="flex flex-col gap-2 p-5">
              <Button disabled className="justify-between">
                Exportar dados do titular <SoonBadge />
              </Button>
              <Button disabled className="justify-between">
                Marcar identidade verificada <SoonBadge />
              </Button>
              {isSelf || isAdmin ? (
                <p className="text-sa-xs text-sa-muted">
                  {isSelf ? "Esta é a sua conta: suspender e excluir ficam com outro admin." : "Conta de admin: tire o papel de admin antes de suspender ou excluir."}
                </p>
              ) : (
                <>
                  {suspended ? (
                    <ConfirmDialog
                      trigger="Reativar conta"
                      title="Reativar conta"
                      description="A pessoa volta a entrar. Os anúncios continuam pausados até você religar cada um na ficha do anúncio."
                      confirmLabel="Reativar"
                      onConfirm={reactivateUser.bind(null, user.id)}
                    />
                  ) : (
                    <ConfirmDialog
                      trigger="Suspender conta"
                      title="Suspender conta"
                      description="Login bloqueado, anúncios pausados e perfil público some. Os dados ficam guardados para defesa. Quem já está logado perde o acesso em até 1 hora."
                      confirmLabel="Suspender"
                      danger
                      onConfirm={suspendUser.bind(null, user.id)}
                    />
                  )}
                  <ConfirmDialog
                    trigger="Excluir conta"
                    triggerVariant="danger"
                    title="Excluir conta"
                    description="Apaga conta, perfil, anúncios, fotos e favoritos. As estatísticas ficam anonimizadas e a prova do pedido é guardada. Não dá para desfazer."
                    confirmLabel="Excluir definitivamente"
                    danger
                    requireText={user.email}
                    onConfirm={deleteUser.bind(null, user.id)}
                    redirectTo="/usuarios"
                  />
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
