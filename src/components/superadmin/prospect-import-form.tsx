"use client";

import { useActionState } from "react";
import { FileCsvIcon } from "@phosphor-icons/react";
import { importProspects, type ImportState } from "@/app/superadmin/prospeccao/actions";
import { Button, ButtonLink, Card, CardHeader, Field } from "@/components/superadmin/ui";

export function ProspectImportForm() {
  const [state, formAction, isPending] = useActionState<ImportState, FormData>(importProspects, { status: "idle" });
  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader title="1. De onde vêm os contatos" description="Use o link da aba ou o arquivo CSV dela. Um dos dois basta." />
        <div className="space-y-5 p-5">
          <Field
            label="Link do Google Sheets"
            htmlFor="sheet-url"
            hint="Cole o endereço com a aba aberta (o final #gid=… escolhe a aba). A planilha precisa estar com “Qualquer pessoa com o link” como leitor."
          >
            <input id="sheet-url" name="url" type="url" inputMode="url" placeholder="https://docs.google.com/spreadsheets/d/…/edit#gid=0" className="sa-input" />
          </Field>
          <Field label="Ou o arquivo CSV" htmlFor="sheet-file" hint="No Google Sheets: Arquivo, Fazer download, Valores separados por vírgula (.csv), com a aba Maringá aberta.">
            <label
              htmlFor="sheet-file"
              className="flex cursor-pointer items-center gap-3 rounded-sa-card border border-dashed border-sa-line-strong bg-sa-paper px-4 py-3 text-sa-base transition-colors hover:border-brand-400"
            >
              <FileCsvIcon className="size-6 shrink-0 text-sa-subtle" aria-hidden />
              <span className="text-sa-body">Escolher arquivo</span>
              <input id="sheet-file" name="file" type="file" accept=".csv,text/csv" className="min-w-0 text-sa-sm text-sa-muted" />
            </label>
          </Field>
        </div>
      </Card>

      {state.status === "error" && (
        <p role="alert" className="rounded-sa-card border border-danger-600/30 bg-[#fde4e1] px-4 py-3 text-sa-base text-[#7a1b12]">
          {state.error}
        </p>
      )}
      {state.status === "done" && (
        <p role="status" className="rounded-sa-card border border-mint-500/40 bg-mint-100 px-4 py-3 text-sa-base text-[#064e3b]">
          Importação concluída: {state.created} novo(s), {state.updated} atualizado(s), {state.skipped} linha(s) sem nome ignorada(s). {state.withoutWhatsApp} contato(s) sem
          WhatsApp. Quem já estava na base manteve o status e as anotações.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <ButtonLink href="/prospeccao" variant="ghost">
          {state.status === "done" ? "Ver prospects" : "Cancelar"}
        </ButtonLink>
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Importando…" : "Importar contatos"}
        </Button>
      </div>
    </form>
  );
}
