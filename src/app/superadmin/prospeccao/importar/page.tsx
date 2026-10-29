import type { Metadata } from "next";
import { ProspectImportForm } from "@/components/superadmin/prospect-import-form";
import { Card, PageHeader } from "@/components/superadmin/ui";

export const metadata: Metadata = { title: "Importar planilha de prospects" };

export default function ImportProspectsPage() {
  return (
    <>
      <PageHeader
        title="Importar planilha"
        description="Traz os locais da planilha de prospecção para a base, cada um como Novo. Importar de novo atualiza os contatos sem apagar status nem anotações."
      />
      <div className="grid max-w-5xl gap-6 lg:grid-cols-[1fr_20rem]">
        <ProspectImportForm />
        <aside>
          <Card className="space-y-3 p-5 text-sa-sm text-sa-muted">
            <h2 className="text-sa-lg font-semibold text-sa-ink">O que a aba precisa ter</h2>
            <p>Colunas pelo nome, em qualquer ordem: nome, endereço, telefone, instagram, site, e-mail geral, place_id, prioridade.</p>
            <p>
              Para a mensagem sair certa: modelo (A ou B), tratamento, destinatário (modelo A), especialidade e número WhatsApp usado. Sem o número, o Subleasy escolhe o melhor celular
              entre “whatsapp (site)” e “celular (Maps)”.
            </p>
            <p>Os locais sem celular entram sem botão de WhatsApp. A decisão de contatar fica com você, um a um.</p>
          </Card>
        </aside>
      </div>
    </>
  );
}
