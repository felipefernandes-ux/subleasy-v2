import { Eyebrow } from "./ui";

export const FAQ_ITEMS = [
  {
    question: "Anunciar no Subleasy é gratuito?",
    answer:
      "Sim. Publicar o anúncio, usar o painel básico e receber contatos pelo WhatsApp é gratuito. O Subleasy não cobra comissão sobre o aluguel.",
  },
  {
    question: "Como funciona a sublocação de um consultório por turno?",
    answer:
      "O dono da sala informa os turnos livres na semana (manhã, tarde ou noite) e o preço por hora, turno, dia ou mês. Quem procura entra em contato direto pelo WhatsApp e combina as condições com o anunciante.",
  },
  {
    question: "A IA publica o anúncio sozinha?",
    answer:
      "Não. A IA sugere título, descrição e comodidades a partir das suas fotos e respostas, e mostra de onde veio cada informação. Preço, endereço e regras são sempre os que você informou. Nada vai ao ar sem a sua revisão.",
  },
  {
    question: "Por quanto tempo o anúncio fica no ar?",
    answer:
      "Por 30 dias a partir da publicação. Antes do fim do prazo, você renova grátis com um clique por mais 30 dias. Se não renovar, o anúncio sai da busca e para de receber contatos, mas continua salvo no seu painel para voltar ao ar quando quiser.",
  },
  {
    question: "Preciso ter CRP, CRM ou CRO para alugar uma sala?",
    answer:
      "Cada anunciante define quem pode usar a sala e quais atendimentos são permitidos. Muitos pedem o registro no conselho da sua profissão antes de fechar o aluguel.",
  },
  {
    question: "Em quais cidades o Subleasy funciona?",
    answer:
      "Estamos concentrando os anúncios em Maringá (PR). Salas de outras cidades continuam publicadas, e você pode anunciar a sua de qualquer lugar do Brasil.",
  },
] as const;

export function Faq() {
  return (
    <section id="perguntas" aria-labelledby="perguntas-titulo" className="scroll-mt-16 bg-white">
      <div className="container-page grid gap-10 py-20 sm:py-24 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <div>
          <Eyebrow>Perguntas frequentes</Eyebrow>
          <h2
            id="perguntas-titulo"
            className="mt-3 text-h1 font-bold text-ink-900"
          >
            Antes de anunciar ou alugar
          </h2>
        </div>

        <div className="divide-y divide-ink-200 border-y border-ink-200">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group">
              <summary className="focus-ring flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-lg font-bold text-ink-900 [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-ink-200 text-ink-500 transition group-open:rotate-45"
                >
                  <svg viewBox="0 0 16 16" fill="none" className="size-4">
                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="max-w-2xl pb-6 leading-relaxed text-ink-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
