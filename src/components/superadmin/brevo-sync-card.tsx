"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/ssr";
import { previewBrevoSync, syncLeadsToBrevo, type BrevoPreview, type BrevoSyncResult } from "@/app/superadmin/leads/actions";
import { Button, Card, CardHeader } from "./ui";

const SEGMENTS = [
  ["ativo", "Anúncio ativo"],
  ["expirado", "Anúncio expirado"],
  ["rascunho", "Rascunho"],
  ["sem_anuncio", "Sem anúncio, com aceite"],
] as const;

/** Meta de interessados por grupo, da aba “Campanha de lançamento” do plano. */
const TARGET: Record<(typeof SEGMENTS)[number][0], number> = { ativo: 50, expirado: 25, rascunho: 15, sem_anuncio: 10 };

const percent = (part: number, whole: number) => (whole === 0 ? "—" : `${Math.round((part / whole) * 100)}%`);

/** Leva a base de leads para a lista “Convite 2.0” do Brevo: primeiro mostra a conta, depois envia. */
export function BrevoSyncCard() {
  const uid = useId();
  const [preview, setPreview] = useState<BrevoPreview | null>(null);
  const [result, setResult] = useState<BrevoSyncResult | null>(null);
  const [typed, setTyped] = useState("");
  const [pending, start] = useTransition();

  const load = () =>
    start(async () => {
      setResult(null);
      setTyped("");
      setPreview(await previewBrevoSync());
    });

  // Os números do convite aparecem ao abrir a página, sem precisar clicar.
  useEffect(() => {
    load();
  }, []);

  const send = () =>
    start(async () => {
      setResult(await syncLeadsToBrevo(typed));
      setTyped("");
    });

  const ready = preview?.ok && preview.configured && preview.total > 0;
  const confirmed = typed.trim().toLowerCase() === "enviar";

  return (
    <Card className="mb-6">
      <CardHeader
        title="Enviar para o Brevo"
        description="Leva os contatos para a lista “Convite 2.0”. Só envia os contatos, nenhum e-mail sai daqui."
        action={
          <Button small onClick={load} disabled={pending}>
            Atualizar
          </Button>
        }
      />
      {preview && !preview.ok && (
        <p role="alert" className="p-5 text-sa-sm text-danger-600">
          {preview.error}
        </p>
      )}
      {preview?.ok && (
        <div className="space-y-4 p-5">
          <div className="overflow-x-auto">
            <table className="sa-table">
              <thead>
                <tr>
                  <th scope="col">Grupo</th>
                  <th scope="col">No público</th>
                  <th scope="col">Clicaram</th>
                  <th scope="col">Confirmaram</th>
                  <th scope="col">Interessados</th>
                  <th scope="col">Meta</th>
                </tr>
              </thead>
              <tbody>
                {SEGMENTS.map(([key, label]) => {
                  const row = preview.invites[key];
                  return (
                    <tr key={key}>
                      <td className="font-semibold">{label}</td>
                      <td>{preview.bySegment[key]}</td>
                      <td>{row.clicked}</td>
                      <td>{row.confirmed}</td>
                      <td className="font-semibold">{percent(row.confirmed, row.invited)}</td>
                      <td className="text-sa-muted">{TARGET[key]}%</td>
                    </tr>
                  );
                })}
                <tr>
                  <td className="font-semibold">Total</td>
                  <td>{preview.total}</td>
                  <td>{SEGMENTS.reduce((sum, [key]) => sum + preview.invites[key].clicked, 0)}</td>
                  <td>{SEGMENTS.reduce((sum, [key]) => sum + preview.invites[key].confirmed, 0)}</td>
                  <td className="font-semibold">
                    {percent(
                      SEGMENTS.reduce((sum, [key]) => sum + preview.invites[key].confirmed, 0),
                      preview.total,
                    )}
                  </td>
                  <td className="text-sa-muted">30%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sa-xs text-sa-muted">Interessado é quem confirmou na página do convite; só abrir o link conta como clique.</p>
          <p className="text-sa-sm text-sa-muted">
            Ficam de fora: {preview.skipped.admin} admin, {preview.skipped.suspenso} suspensos, {preview.skipped.semEmail} sem e-mail e{" "}
            {preview.skipped.semBaseLegal} sem anúncio e sem aceite de novidades.
          </p>
          {!preview.configured && (
            <p role="alert" className="text-sa-sm text-danger-600">
              Falta BREVO_API_KEY no .env.local. A contagem acima funciona, o envio não.
            </p>
          )}
          {ready && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (confirmed && !pending) send();
              }}
              className="flex flex-wrap items-end gap-3"
            >
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${uid}-confirm`} className="text-sa-sm font-semibold">
                  Para enviar {preview.total} contatos, digite <span className="font-mono">enviar</span>
                </label>
                <input id={`${uid}-confirm`} value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" className="sa-input w-48" />
              </div>
              <Button type="submit" variant="primary" disabled={!confirmed || pending}>
                <PaperPlaneTiltIcon className="size-4" weight="bold" aria-hidden />
                {pending ? "Enviando…" : "Enviar ao Brevo"}
              </Button>
            </form>
          )}
        </div>
      )}
      {result && (
        <p role={result.ok ? "status" : "alert"} className={result.ok ? "border-t border-sa-haze p-5 text-sa-sm" : "border-t border-sa-haze p-5 text-sa-sm text-danger-600"}>
          {result.ok
            ? `${result.sent} contatos enviados para “${result.list}”. Situação da importação: ${result.status}.${result.createdAttributes.length > 0 ? ` Atributos criados: ${result.createdAttributes.join(", ")}.` : ""}`
            : result.error}
        </p>
      )}
    </Card>
  );
}
