"use client";

import { useState, useTransition } from "react";
import { CheckIcon, CopyIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import {
  createProspectPreview,
  logProspectAction,
  markClaimHandled,
  markProspectSent,
  revokeProspectPreview,
  saveProspectNotes,
  setProspectStatus,
  type ActionResult,
} from "@/app/superadmin/prospeccao/actions";
import { Button, Card, CardHeader } from "@/components/superadmin/ui";
import { PROSPECT_STATUSES, PROSPECT_STATUS_KEYS } from "@/lib/prospecting/status";

type Kind = "pergunta" | "previa";

const TAB = "sa-btn sa-btn-sm";

/** Roda uma ação do servidor e mostra o erro dela, se houver. */
function useRun() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (action: () => Promise<ActionResult | void>) =>
    start(async () => {
      setError(null);
      const result = await action();
      if (result && !result.ok) setError(result.error);
    });
  return { pending, error, run };
}

export function MessagePanel({
  prospectId,
  optedOut,
  messages,
  whatsappLinks,
  hasWhatsApp,
}: {
  prospectId: string;
  optedOut: boolean;
  /** Texto de cada mensagem; a da prévia é nulo enquanto não houver prévia. */
  messages: Record<Kind, string | null>;
  whatsappLinks: Record<Kind, string | null>;
  hasWhatsApp: boolean;
}) {
  const [kind, setKind] = useState<Kind>(messages.previa ? "previa" : "pergunta");
  const [copied, setCopied] = useState(false);
  const { pending, error, run } = useRun();
  const text = messages[kind];
  const link = whatsappLinks[kind];

  async function copy() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    run(() => logProspectAction(prospectId, "message_copied", kind));
  }

  return (
    <Card>
      <CardHeader title="Mensagem" description="Primeiro toque: a pergunta. Segundo toque: a prévia do anúncio, com o link." />
      <div className="space-y-4 p-5">
        <div role="tablist" aria-label="Qual mensagem" className="flex gap-1.5">
          <button type="button" role="tab" aria-selected={kind === "pergunta"} onClick={() => setKind("pergunta")} className={`${TAB} ${kind === "pergunta" ? "sa-btn-outline" : "sa-btn-ghost"}`}>
            Pergunta
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={kind === "previa"}
            disabled={!messages.previa}
            onClick={() => setKind("previa")}
            className={`${TAB} ${kind === "previa" ? "sa-btn-outline" : "sa-btn-ghost"}`}
          >
            Com a prévia
          </button>
        </div>

        {optedOut ? (
          <p className="rounded-sa-card bg-[#fde4e1] px-4 py-3 text-sa-base text-[#7a1b12]">Este contato está como Não contatar. Nenhuma mensagem deve ser enviada.</p>
        ) : text ? (
          <pre className="max-h-96 overflow-auto rounded-sa-card border border-sa-line bg-sa-paper p-4 font-sans text-sa-base whitespace-pre-wrap text-sa-ink">{text}</pre>
        ) : (
          <p className="text-sa-base text-sa-muted">Crie a prévia do anúncio para gerar esta mensagem.</p>
        )}

        {!optedOut && text && (
          <div className="flex flex-wrap items-center gap-2">
            {link && hasWhatsApp ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => run(() => logProspectAction(prospectId, "whatsapp_opened", kind))}
                className="sa-btn sa-btn-primary"
              >
                <WhatsappLogoIcon className="size-4" weight="fill" aria-hidden />
                Enviar no WhatsApp
              </a>
            ) : (
              <span className="text-sa-sm text-sa-muted">Sem celular cadastrado: copie a mensagem e envie por outro canal.</span>
            )}
            <Button onClick={copy}>
              {copied ? <CheckIcon className="size-4" weight="bold" aria-hidden /> : <CopyIcon className="size-4" aria-hidden />}
              {copied ? "Copiado" : "Copiar (Instagram e outros)"}
            </Button>
            <Button disabled={pending} onClick={() => run(() => markProspectSent(prospectId, kind, "whatsapp"))}>
              Marcar como enviada
            </Button>
          </div>
        )}
        {error && (
          <p role="alert" className="text-sa-sm text-danger-600">
            {error}
          </p>
        )}
        <p className="text-sa-xs text-sa-muted">
          O botão só abre o WhatsApp com o texto pronto; você confere e envia. Depois de enviar, use “Marcar como enviada” para o status e a contagem de toques.
        </p>
      </div>
    </Card>
  );
}

export function PreviewPanel({
  prospectId,
  preview,
  url,
}: {
  prospectId: string;
  preview: { title: string; summary: string | null; generatedBy: string; expiresAt: string; revoked: boolean; views: number; firstViewed: string; lastViewed: string } | null;
  url: string | null;
}) {
  const { pending, error, run } = useRun();
  const [copied, setCopied] = useState(false);

  return (
    <Card>
      <CardHeader
        title="Prévia do anúncio"
        description="Página com o anúncio como ficaria, aberta só por link: não aparece na busca, nas listas nem no sitemap. As fotos são ilustrativas."
      />
      <div className="space-y-4 p-5">
        {!preview ? (
          <>
            <p className="text-sa-base text-sa-muted">
              O texto sai da área e do bairro da planilha. Preço, turnos e comodidades ficam “a definir” até a pessoa preencher.
            </p>
            <Button variant="primary" disabled={pending} onClick={() => run(() => createProspectPreview(prospectId))}>
              {pending ? "Criando…" : "Criar prévia do anúncio"}
            </Button>
          </>
        ) : (
          <>
            <div>
              <p className="font-semibold text-sa-ink">{preview.title}</p>
              {preview.summary && <p className="mt-0.5 text-sa-base text-sa-muted">{preview.summary}</p>}
              <p className="mt-2 text-sa-xs text-sa-muted">
                Texto: {preview.generatedBy === "ia" ? "gerado por IA" : "padrão"} ・ vale até {preview.expiresAt}
                {preview.revoked && " ・ link derrubado"}
              </p>
            </div>
            <p className="text-sa-base text-sa-body">
              {preview.views === 0 ? "Ninguém abriu o link ainda." : `${preview.views} visita(s), a primeira em ${preview.firstViewed} e a última em ${preview.lastViewed}.`}
            </p>
            {url && (
              <div className="flex flex-wrap items-center gap-2">
                <input readOnly value={url} aria-label="Link da prévia" className="sa-input min-w-0 flex-1 text-sa-sm" onFocus={(event) => event.currentTarget.select()} />
                <a href={url} target="_blank" rel="noopener noreferrer" className="sa-btn sa-btn-outline">
                  Abrir
                </a>
                <Button
                  onClick={async () => {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? "Copiado" : "Copiar link"}
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button disabled={pending} onClick={() => run(() => createProspectPreview(prospectId))}>
                Refazer texto e renovar validade
              </Button>
              {!preview.revoked && (
                <Button variant="danger" disabled={pending} onClick={() => run(() => revokeProspectPreview(prospectId))}>
                  Derrubar o link
                </Button>
              )}
            </div>
          </>
        )}
        {error && (
          <p role="alert" className="text-sa-sm text-danger-600">
            {error}
          </p>
        )}
      </div>
    </Card>
  );
}

export function StatusNotes({ prospectId, status, notes }: { prospectId: string; status: string; notes: string }) {
  const { pending, error, run } = useRun();
  const [text, setText] = useState(notes);
  const [saved, setSaved] = useState(false);

  return (
    <Card>
      <CardHeader title="Acompanhamento" />
      <div className="space-y-4 p-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sa-sm font-semibold text-sa-ink">Status</span>
          <select
            value={status}
            disabled={pending}
            onChange={(event) => run(() => setProspectStatus(prospectId, event.target.value))}
            className="sa-input"
          >
            {PROSPECT_STATUS_KEYS.map((key) => (
              <option key={key} value={key}>
                {PROSPECT_STATUSES[key]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sa-sm font-semibold text-sa-ink">Anotações</span>
          <textarea
            value={text}
            maxLength={2000}
            rows={4}
            onChange={(event) => {
              setText(event.target.value);
              setSaved(false);
            }}
            className="sa-input h-auto py-2"
          />
        </label>
        <div className="flex items-center gap-3">
          <Button
            disabled={pending || text === notes}
            onClick={() =>
              run(async () => {
                const result = await saveProspectNotes(prospectId, text);
                if (result.ok) setSaved(true);
                return result;
              })
            }
          >
            Salvar anotação
          </Button>
          {saved && <span className="text-sa-sm text-sa-muted">Salvo</span>}
        </div>
        {error && (
          <p role="alert" className="text-sa-sm text-danger-600">
            {error}
          </p>
        )}
      </div>
    </Card>
  );
}

export function ClaimHandledButton({ claimId, prospectId }: { claimId: string; prospectId: string }) {
  const { pending, error, run } = useRun();
  return (
    <>
      <Button small disabled={pending} onClick={() => run(() => markClaimHandled(claimId, prospectId))}>
        Marcar como tratado
      </Button>
      {error && <span className="ml-2 text-sa-xs text-danger-600">{error}</span>}
    </>
  );
}
