import { Fragment } from "react";
import { Badge, Card, CardHeader } from "@/components/superadmin/ui";
import { diffWords, type ListingDiff, type WordPart } from "@/lib/listing-diff";
import { photoUrl } from "@/lib/listing-options";
import type { RevisionView } from "@/lib/listing-revisions";

const dateTime = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

// Cores dos selos de perigo e sucesso (ui.tsx), para o antes e o depois falarem a mesma língua do resto do painel.
const REMOVED = "rounded-[3px] bg-[#fde4e1] text-[#7a1b12] line-through decoration-[#7a1b12]/40";
const ADDED = "rounded-[3px] bg-mint-100 text-[#064e3b]";

/** Edição esperando revisão: o que mudou em relação à versão que estava no ar. */
export function PendingChanges({ revision }: { revision: RevisionView }) {
  return (
    <Card className="ring-2 ring-brand-200">
      <CardHeader
        title="O que mudou nesta edição"
        description={`Anúncio já aprovado, editado e enviado de novo em ${dateTime(revision.submittedAt)}. Compare com a versão que estava no ar antes de aprovar.`}
      />
      <DiffBody diff={revision.diff} />
    </Card>
  );
}

/** Edições aprovadas antes, da mais nova para a mais antiga. Cada uma abre o mesmo antes e depois. */
export function ChangeHistory({ history }: { history: RevisionView[] }) {
  if (history.length === 0) return null;
  return (
    <Card>
      <CardHeader title="Edições aprovadas" description="Cada edição de um anúncio já aprovado, com o que mudou." />
      <ul className="divide-y divide-sa-haze">
        {history.map((revision) => (
          <li key={revision.id}>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-sa-base hover:bg-sa-paper [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">
                  <span className="font-semibold text-sa-ink">Aprovada em {dateTime(revision.approvedAt ?? revision.submittedAt)}</span>
                  <span className="block truncate text-sa-sm text-sa-muted">{changedLabels(revision.diff)}</span>
                </span>
                <span aria-hidden className="shrink-0 text-sa-sm font-semibold text-brand-600 group-open:hidden">Ver</span>
                <span aria-hidden className="hidden shrink-0 text-sa-sm font-semibold text-brand-600 group-open:inline">Fechar</span>
              </summary>
              <div className="border-t border-sa-haze bg-sa-paper/40">
                <DiffBody diff={revision.diff} />
              </div>
            </details>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function changedLabels(diff: ListingDiff) {
  if (diff.empty) return "Reenviado sem mudanças";
  const labels = diff.fields.map((field) => field.label);
  if (diff.description) labels.push("Descrição");
  if (diff.photos.added.length || diff.photos.removed.length || diff.photos.reordered) labels.push("Fotos");
  return labels.join(", ");
}

function DiffBody({ diff }: { diff: ListingDiff }) {
  if (diff.empty) {
    return <p className="px-5 py-6 text-sa-sm text-sa-muted">O anunciante reenviou o anúncio sem mudar nada em relação à versão aprovada.</p>;
  }
  const { photos } = diff;
  const photoChanged = photos.added.length > 0 || photos.removed.length > 0 || photos.reordered;

  return (
    <div className="space-y-6 p-5">
      <div className="flex flex-wrap gap-2">
        {diff.fields.length > 0 && <Badge tone="brand">{plural(diff.fields.length, "campo alterado", "campos alterados")}</Badge>}
        {diff.description && <Badge tone="brand">Descrição alterada</Badge>}
        {photos.added.length > 0 && <Badge tone="success">{plural(photos.added.length, "foto nova", "fotos novas")}</Badge>}
        {photos.removed.length > 0 && <Badge tone="danger">{plural(photos.removed.length, "foto removida", "fotos removidas")}</Badge>}
        {photos.coverChanged && <Badge tone="warning">Capa trocada</Badge>}
        {photos.reordered && !photos.coverChanged && <Badge tone="neutral">Ordem das fotos mudou</Badge>}
      </div>

      {diff.fields.length > 0 && (
        <div className="overflow-x-auto rounded-sa-card ring-1 ring-sa-haze">
          <table className="w-full min-w-[36rem] text-left text-sa-sm">
            <caption className="sr-only">Campos alterados: valor antes e depois da edição</caption>
            <thead className="bg-sa-paper text-sa-muted">
              <tr>
                <th scope="col" className="w-[11rem] px-4 py-2.5 font-semibold">Campo</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Antes</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Depois</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sa-haze align-top">
              {diff.fields.map((field) => (
                <tr key={field.label}>
                  <th scope="row" className="px-4 py-3 font-semibold text-sa-ink">{field.label}</th>
                  <td className="px-4 py-3 text-sa-muted">{field.added ? field.before : <span className={`px-0.5 ${REMOVED}`}>{field.before}</span>}</td>
                  <td className="px-4 py-3 text-sa-body">
                    {field.added ? (
                      <span className="flex flex-wrap gap-1.5">
                        {field.added.map((item) => (
                          <span key={`+${item}`} className={`px-1.5 py-0.5 ${ADDED}`}>+ {item}</span>
                        ))}
                        {(field.removed ?? []).map((item) => (
                          <span key={`-${item}`} className={`px-1.5 py-0.5 ${REMOVED}`}>− {item}</span>
                        ))}
                      </span>
                    ) : (
                      <span className={`px-0.5 ${ADDED}`}>{field.after}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {photoChanged && (
        <section aria-label="Fotos alteradas" className="grid gap-4 sm:grid-cols-2">
          {photos.removed.length > 0 && <PhotoGroup title="Fotos que saíram" paths={photos.removed} tone="removed" />}
          {photos.added.length > 0 && <PhotoGroup title="Fotos novas" paths={photos.added} tone="added" />}
          {photos.coverChanged && <CoverNote />}
        </section>
      )}

      {diff.description && <DescriptionDiff before={diff.description.before} after={diff.description.after} />}
    </div>
  );
}

function CoverNote() {
  return (
    <p className="self-start rounded-sa-card bg-sa-paper p-3 text-sa-sm text-sa-muted sm:col-span-2">
      A capa mudou: é a primeira foto da galeria acima, que aparece nos cards da busca.
    </p>
  );
}

function PhotoGroup({ title, paths, tone }: { title: string; paths: string[]; tone: "added" | "removed" }) {
  return (
    <div>
      <p className="mb-2 text-sa-sm font-semibold text-sa-ink">
        {title} ({paths.length})
      </p>
      <ul className="grid grid-cols-3 gap-1.5">
        {paths.map((path) => (
          <li key={path}>
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de revisão do admin, sem otimização */}
            <img
              src={photoUrl(path)}
              alt={tone === "added" ? "Foto nova" : "Foto que saiu do anúncio"}
              loading="lazy"
              className={`aspect-[4/3] w-full rounded-sa-badge object-cover ring-2 ${tone === "added" ? "ring-mint-500" : "opacity-60 ring-danger-600 grayscale"}`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function DescriptionDiff({ before, after }: { before: string; after: string }) {
  const parts = diffWords(before, after);
  return (
    <section aria-label="Descrição anterior e descrição nova" className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-sa-card ring-1 ring-sa-haze">
        <p className="border-b border-sa-haze px-4 py-2.5 text-sa-sm font-semibold text-sa-ink">Descrição anterior</p>
        <Words parts={parts.before} empty="Sem descrição." className="text-sa-muted" />
      </div>
      <div className="rounded-sa-card ring-1 ring-sa-haze">
        <p className="border-b border-sa-haze px-4 py-2.5 text-sa-sm font-semibold text-sa-ink">Descrição nova</p>
        <Words parts={parts.after} empty="Sem descrição." className="text-sa-body" />
      </div>
    </section>
  );
}

function Words({ parts, empty, className }: { parts: WordPart[]; empty: string; className: string }) {
  if (parts.length === 0) return <p className="px-4 py-3 text-sa-sm text-sa-muted">{empty}</p>;
  return (
    <p className={`whitespace-pre-line px-4 py-3 text-sa-sm leading-relaxed ${className}`}>
      {parts.map((part, index) =>
        part.kind === "same" ? (
          <Fragment key={index}>{part.text}</Fragment>
        ) : part.kind === "removed" ? (
          <del key={index} className={REMOVED}>{part.text}</del>
        ) : (
          <ins key={index} className={`no-underline ${ADDED}`}>{part.text}</ins>
        ),
      )}
    </p>
  );
}
