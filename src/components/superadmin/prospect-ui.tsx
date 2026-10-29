import { Badge } from "@/components/superadmin/ui";
import { PROSPECT_STATUSES, type ProspectStatus } from "@/lib/prospecting/status";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger";

const TONE: Record<ProspectStatus, Tone> = {
  novo: "neutral",
  mensagem_enviada: "brand",
  previa_enviada: "brand",
  respondeu: "warning",
  quer_anuncio: "success",
  dados_enviados: "success",
  publicado: "success",
  sem_resposta: "neutral",
  nao_contatar: "danger",
};

export function ProspectStatusBadge({ status }: { status: string }) {
  const known = status in PROSPECT_STATUSES;
  return (
    <Badge tone={known ? TONE[status as ProspectStatus] : "neutral"} dot>
      {known ? PROSPECT_STATUSES[status as ProspectStatus] : status}
    </Badge>
  );
}

export const dateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }) : "—";
