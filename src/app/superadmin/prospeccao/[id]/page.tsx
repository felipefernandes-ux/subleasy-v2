import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { ClaimHandledButton, MessagePanel, PreviewPanel, StatusNotes } from "@/components/superadmin/prospect-panels";
import { ProspectStatusBadge, dateTime } from "@/components/superadmin/prospect-ui";
import { Card, CardHeader, DefinitionList, PageHeader } from "@/components/superadmin/ui";
import { buildMessage, whatsappLink } from "@/lib/prospecting/messages";
import { SPECIALTIES, type Specialty } from "@/lib/prospecting/status";
import { requireAdmin } from "@/lib/superadmin/auth";
import { loadProspect, previewUrl } from "@/lib/superadmin/prospects";

export const metadata: Metadata = { title: "Prospect" };

export default function ProspectDetailPage({ params }: PageProps<"/superadmin/prospeccao/[id]">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-sa-muted">Carregando…</p>}>
      <ProspectDetail params={params} />
    </Suspense>
  );
}

const EVENT_LABEL: Record<string, string> = {
  imported: "Importado da planilha",
  status_changed: "Status mudou",
  whatsapp_opened: "Abriu o WhatsApp",
  message_copied: "Copiou a mensagem",
  preview_created: "Prévia criada",
  preview_viewed: "Prévia aberta pelo contato",
  claim_requested: "Pediu o anúncio pela prévia",
  opted_out: "Pediu para não ser contatado",
  note: "Anotação",
};

function eventDetail(kind: string, detail: unknown) {
  const d = (detail && typeof detail === "object" ? detail : {}) as Record<string, unknown>;
  if (kind === "status_changed") return `${d.de ?? "—"} → ${d.para ?? "—"}${d.canal ? ` (${d.canal})` : ""}`;
  if (kind === "whatsapp_opened" || kind === "message_copied") return d.mensagem === "previa" ? "mensagem com a prévia" : "mensagem de pergunta";
  if (kind === "preview_created") return d.renovada ? "texto refeito" : d.texto === "ia" ? "texto por IA" : "texto padrão";
  return "";
}

async function ProspectDetail({ params }: { params: PageProps<"/superadmin/prospeccao/[id]">["params"] }) {
  const { id } = await params;
  await requireAdmin(`/prospeccao/${id}`);
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const data = await loadProspect(id);
  if (!data) notFound();
  const { prospect, preview, events, claims } = data;

  const url = preview ? await previewUrl(preview.token) : null;
  const live = preview && !preview.revoked_at && new Date(preview.expires_at) > new Date();
  const messages = {
    pergunta: buildMessage(prospect, "pergunta"),
    previa: live && url ? buildMessage(prospect, "previa", url) : null,
  };
  const number = prospect.whatsapp_number;
  const whatsappLinks = {
    pergunta: number && messages.pergunta ? whatsappLink(number, messages.pergunta) : null,
    previa: number && messages.previa ? whatsappLink(number, messages.previa) : null,
  };

  return (
    <>
      <Link href="/prospeccao" className="mb-3 inline-flex items-center gap-1.5 text-sa-sm text-sa-muted hover:text-sa-ink">
        <ArrowLeftIcon className="size-3.5" aria-hidden />
        Prospects
      </Link>
      <PageHeader
        title={prospect.name}
        description={prospect.address ?? "Sem endereço"}
        eyebrow={<ProspectStatusBadge status={prospect.status} />}
      />

      {claims.some((claim) => !claim.handled_at) && (
        <Card className="mb-6 border-mint-500/50 bg-mint-100/40">
          <CardHeader title="Pedido de anúncio" description="Alguém abriu a prévia e pediu o anúncio. Confirme que a pessoa é do local antes de publicar qualquer coisa." />
          <ul className="divide-y divide-sa-haze">
            {claims.map((claim) => (
              <li key={claim.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sa-base">
                <span>
                  <strong className="font-semibold text-sa-ink">{claim.contact_name}</strong> ・ {claim.contact_email} ・ {claim.contact_phone}
                  <span className="block text-sa-xs text-sa-muted">{dateTime(claim.created_at)}{claim.handled_at && " ・ tratado"}</span>
                </span>
                {!claim.handled_at && <ClaimHandledButton claimId={claim.id} prospectId={prospect.id} />}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <MessagePanel
            prospectId={prospect.id}
            optedOut={prospect.status === "nao_contatar"}
            messages={messages}
            whatsappLinks={whatsappLinks}
            hasWhatsApp={Boolean(number)}
          />
          <PreviewPanel
            prospectId={prospect.id}
            url={url}
            preview={
              preview
                ? {
                    title: preview.title,
                    summary: preview.short_summary,
                    generatedBy: preview.generated_by,
                    expiresAt: dateTime(preview.expires_at),
                    revoked: Boolean(preview.revoked_at),
                    views: preview.view_count,
                    firstViewed: dateTime(preview.first_viewed_at),
                    lastViewed: dateTime(preview.last_viewed_at),
                  }
                : null
            }
          />
          <Card>
            <CardHeader title="Linha do tempo" />
            {events.length === 0 ? (
              <p className="px-5 py-4 text-sa-base text-sa-muted">Nada registrado ainda.</p>
            ) : (
              <ul className="divide-y divide-sa-haze">
                {events.map((event) => (
                  <li key={event.id} className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-2.5 text-sa-base">
                    <span className="text-sa-ink">
                      {EVENT_LABEL[event.kind] ?? event.kind}
                      {eventDetail(event.kind, event.detail) && <span className="text-sa-muted"> ・ {eventDetail(event.kind, event.detail)}</span>}
                    </span>
                    <span className="text-sa-xs text-sa-muted">{dateTime(event.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <StatusNotes prospectId={prospect.id} status={prospect.status} notes={prospect.notes ?? ""} />
          <Card>
            <CardHeader title="Dados da planilha" />
            <DefinitionList
              items={[
                ["Área", prospect.specialty ? SPECIALTIES[prospect.specialty as Specialty] : "—"],
                ["Prioridade", prospect.priority ?? "—"],
                ["WhatsApp", number ? `+${number}` : "Sem celular"],
                ["Telefone", prospect.phone ?? "—"],
                ["Instagram", prospect.instagram ?? "—"],
                ["Site", prospect.website ?? "—"],
                ["E-mail", prospect.email ?? "—"],
                ["Modelo", prospect.message_model ?? "—"],
                ["Tratamento", prospect.treatment ?? "—"],
                ["Observação", prospect.link_note ?? "—"],
                ["Toques", `${prospect.touches}${prospect.last_contact_at ? `, o último em ${dateTime(prospect.last_contact_at)}` : ""}`],
              ]}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
