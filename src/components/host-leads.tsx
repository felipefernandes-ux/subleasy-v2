import Link from "next/link";

export type Lead = {
  id: string;
  name: string;
  message: string;
  /** Data e horário do contato, já formatados em horário de São Paulo. */
  sentOn: string;
  /** Preenchido na lista geral do painel, que mistura vários anúncios. */
  listing?: { id: string; title: string };
};

/** Formato único de data e horário dos contatos, no fuso de São Paulo. */
export const formatLeadDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

/**
 * Contatos recebidos pelo formulário do anúncio. O painel mostra só o nome, a mensagem e quando chegou:
 * e-mail e telefone de quem escreveu ficam na mensagem enviada ao anunciante, não aqui.
 */
export function LeadList({ leads, base }: { leads: Lead[]; base?: string }) {
  return (
    <ul className="mt-4 space-y-3">
      {leads.map((lead) => (
        <li key={lead.id} className="rounded-card bg-white p-5 shadow-card ring-1 ring-ink-900/6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="font-bold text-ink-900">{lead.name}</p>
            <p className="text-xs text-ink-500 tabular-nums">{lead.sentOn}</p>
          </div>
          {lead.listing &&
            (base ? (
              <Link href={`${base}/anuncios/${lead.listing.id}`} className="mt-1 block truncate text-sm font-bold text-brand-600 hover:text-brand-700">
                {lead.listing.title}
              </Link>
            ) : (
              <p className="mt-1 truncate text-sm text-ink-600">{lead.listing.title}</p>
            ))}
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink-800">{lead.message}</p>
        </li>
      ))}
    </ul>
  );
}
