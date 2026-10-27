import type { Metadata } from "next";
import Link from "next/link";
import { GuidePaths } from "@/components/guide-paths";
import { Reveal } from "@/components/reveal";
import { SharedWeek } from "@/components/shared-week";
import { ShiftEarnings } from "@/components/shift-earnings";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowRightIcon, CheckIcon, Eyebrow, SearchIcon, buttonClasses } from "@/components/ui";
import { SITE_URL } from "@/lib/site";

// Palavra-chave principal: "como funciona a sublocação de consultório" (ver docs/como-funciona/seo.md).
const TITLE = "Como funciona a sublocação de consultório";
const DESCRIPTION =
  "Entenda como funciona a sublocação de consultório por hora, turno ou mês: o passo a passo para anunciar sua sala grátis e para achar onde atender.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/como-funciona" },
  openGraph: {
    type: "article",
    url: "/como-funciona",
    title: `${TITLE} | Subleasy`,
    description: DESCRIPTION,
  },
  twitter: { title: `${TITLE} | Subleasy`, description: DESCRIPTION },
};

const FACTS = [
  { big: "Hora, turno, dia ou mês", body: "Quem anuncia escolhe como cobrar. Quem aluga paga só pela parte da agenda que usa." },
  { big: "R$ 0", body: "para anunciar. O Subleasy não cobra comissão sobre o aluguel." },
  { big: "Direto", body: "Você fala com o anunciante pelo WhatsApp ou por mensagem e combina contrato e pagamento com ele." },
  { big: "Revisado", body: "Antes de entrar na busca, cada anúncio passa pela equipe do Subleasy." },
];

const HOST_STEPS = [
  {
    title: "Fotografe a sala pelo celular",
    body: "Um guia mostra o que fotografar: a sala inteira, a mesa ou a maca, a janela e a recepção.",
    meta: "4 a 8 fotos",
  },
  {
    title: "Responda 5 perguntas",
    body: "Para quem a sala serve, o que ela tem, o que o prédio oferece e quais são as regras. Responda por texto ou por áudio.",
    meta: "Cerca de 2 minutos",
  },
  {
    title: "Revise o texto que a IA escreveu",
    body: "A IA sugere título e descrição e mostra a origem de cada dado, como “Vimos na foto 3”. Preço, endereço e regras são os que você informou.",
    meta: "Você aprova",
  },
  {
    title: "A equipe confere e publica",
    body: "O anúncio passa por uma revisão do Subleasy e entra na busca com fotos, turnos livres e preço.",
    meta: "Grátis",
  },
  {
    title: "Receba contatos e acompanhe",
    body: "Profissionais chamam no WhatsApp ou mandam mensagem. No painel, você vê quantas pessoas abriram a sala e quantas entraram em contato.",
    meta: "30 dias no ar",
  },
] as const;

const SEEKER_STEPS = [
  {
    title: "Descreva a sala que você precisa",
    body: "Escreva do seu jeito, como “sala de psicologia na Zona 7, terça à tarde”. A busca entende a frase inteira.",
    meta: "Busca por frase",
  },
  {
    title: "Compare no mapa",
    body: "Veja fotos, turnos livres, o preço por hora, turno ou mês e o que cada sala oferece. Salve as favoritas.",
    meta: "Fotos e turnos",
  },
  {
    title: "Fale com o anunciante",
    body: "Chame no WhatsApp ou envie uma mensagem que já vem escrita com os dados da sala.",
    meta: "Contato direto",
  },
  {
    title: "Visite e combine",
    body: "Conheça a sala, confira o que precisa para o seu atendimento e acerte turnos, valor e contrato com o anunciante.",
    meta: "Sem taxa",
  },
] as const;

// Células acesas na mini agenda (7 dias × 3 turnos, contadas por linha: manhãs, tardes, noites).
const MODELS = [
  {
    name: "Por hora",
    cells: [1],
    body: "Para quem está começando ou atende poucos pacientes. Você paga só o tempo de atendimento.",
  },
  {
    name: "Por turno",
    cells: [0, 1, 2, 3],
    body: "Manhã, tarde ou noite fixas na semana. Funciona bem para quem tem agenda recorrente.",
  },
  {
    name: "Por dia",
    cells: [2, 9, 16],
    body: "Para procedimentos, mutirões ou atendimentos concentrados num dia da semana.",
  },
  {
    name: "Por mês",
    cells: [0, 1, 2, 3, 4, 7, 8, 9, 10, 11],
    body: "Os turnos combinados ficam reservados para você, com um valor fixo no mês.",
  },
];

const COMPARE = [
  { topic: "Compromisso", rent: "Contrato de anos, com multa para sair antes", sublet: "Combinado por hora, turno, dia ou mês" },
  { topic: "Custo fixo", rent: "Aluguel, condomínio, IPTU e contas todo mês", sublet: "Você paga o tempo de agenda que usa" },
  { topic: "Montagem", rent: "Mobiliar, equipar e decorar antes de abrir", sublet: "A sala já está pronta para atender" },
  { topic: "Endereço", rent: "Um endereço por vez", sublet: "Dá para atender em mais de um bairro" },
];

const CHECKLIST = [
  {
    who: "Para quem tem sala",
    items: [
      "Confira se o seu contrato permite sublocar. A Lei do Inquilinato (Lei 8.245/1991, art. 13) exige consentimento prévio e por escrito do proprietário.",
      "Defina as regras de uso: limpeza, materiais, chaves e horários de entrada e saída.",
      "Peça o registro no conselho da profissão (CRP, CRM, CRO, Crefito) quando fizer sentido para o atendimento.",
      "Registre o combinado num contrato simples, com turnos, valor, reajuste e aviso prévio.",
    ],
  },
  {
    who: "Para quem procura sala",
    items: [
      "Visite antes de fechar e confira acústica, ventilação, acessibilidade e privacidade.",
      "Pergunte o que está incluído: recepção, internet, limpeza e materiais.",
      "Confirme se a sala atende às exigências da vigilância sanitária e do seu conselho para o seu tipo de atendimento.",
      "Combine tudo por escrito: turnos, valor, forma de pagamento e cancelamento.",
    ],
  },
];

const FAQ = [
  {
    question: "O que é sublocação de consultório?",
    answer:
      "É quando quem aluga ou é dono de uma sala cede os horários que não usa para outro profissional, por hora, turno, dia ou mês. O dono da sala ganha com o tempo vago, e quem atende paga só pela parte da agenda que usa.",
  },
  {
    question: "Sublocar consultório é permitido?",
    answer:
      "Sim, desde que haja autorização. Se você aluga a sala, a Lei do Inquilinato (Lei 8.245/1991, art. 13) exige consentimento prévio e por escrito do proprietário para sublocar. Se a sala é sua, basta seguir as regras do condomínio e da vigilância sanitária.",
  },
  {
    question: "Quanto custa anunciar uma sala no Subleasy?",
    answer:
      "Nada. Publicar o anúncio, usar o painel e receber contatos é gratuito, e o Subleasy não cobra comissão sobre o aluguel.",
  },
  {
    question: "Como é feito o pagamento da sublocação?",
    answer:
      "O pagamento é combinado direto entre anunciante e profissional, assim como o contrato. O Subleasy aproxima as duas partes e não intermedeia o pagamento.",
  },
  {
    question: "Qual a diferença entre alugar consultório por hora e por turno?",
    answer:
      "Por hora, você paga só o tempo de atendimento, bom para quem está começando. Por turno, você reserva manhã, tarde ou noite fixas na semana, o formato de quem já tem agenda recorrente.",
  },
  {
    question: "Por quanto tempo o anúncio fica no ar?",
    answer:
      "Por 30 dias a partir da publicação. Antes do fim do prazo, você renova grátis com um clique. Se não renovar, o anúncio sai da busca e continua salvo no seu painel.",
  },
  {
    question: "Preciso de contrato para sublocar uma sala?",
    answer:
      "É o mais seguro para os dois lados. Um contrato simples com turnos, valor, regras de uso, reajuste e aviso prévio evita mal-entendidos. O Subleasy não participa do contrato.",
  },
  {
    question: "Em quais cidades o Subleasy funciona?",
    answer:
      "Estamos concentrando os anúncios em Maringá (PR), e salas de outras cidades continuam publicadas. Você pode anunciar a sua de qualquer lugar do Brasil.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/como-funciona#webpage`,
      url: `${SITE_URL}/como-funciona`,
      name: `${TITLE} | Subleasy`,
      description: DESCRIPTION,
      inLanguage: "pt-BR",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@type": "Thing", name: "Sublocação de consultório" },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Como funciona", item: `${SITE_URL}/como-funciona` },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};

const H2 = "text-[2rem] leading-tight font-bold tracking-[-0.02em] text-balance text-ink-900 sm:text-h1";

export default function ComoFuncionaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <SiteHeader />
      <main className="flex-1">
        {/* ── Abertura ─────────────────────────────────────────── */}
        <section className="relative isolate overflow-hidden border-b border-ink-200 bg-white">
          <AgendaTexture />
          <div className="container-page grid items-center gap-16 pt-12 pb-20 sm:pt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:pt-20 lg:pb-28">
            <div className="max-w-[36rem]">
              <nav aria-label="Você está em" className="text-sm text-ink-500">
                <Link href="/" className="focus-ring rounded-control hover:text-ink-900">
                  Início
                </Link>
                <span className="mx-2 text-ink-300" aria-hidden>
                  /
                </span>
                <span aria-current="page" className="text-ink-700">
                  Como funciona
                </span>
              </nav>

              <p className="mt-8 inline-flex animate-fade-up items-center gap-2 text-sm font-bold text-brand-600">
                <span className="size-2 rounded-full bg-mint-400" aria-hidden />
                Uma sala, muitas agendas
              </p>
              <h1
                className="mt-4 animate-fade-up text-[2.5rem] leading-[1.06] font-bold tracking-[-0.025em] text-ink-900 sm:text-5xl lg:text-[3.5rem]"
                style={{ animationDelay: "80ms" }}
              >
                Como funciona a sublocação de consultório
              </h1>
              <p className="mt-6 animate-fade-up text-lg leading-relaxed text-ink-600" style={{ animationDelay: "160ms" }}>
                Na sublocação de consultório, quem tem uma sala cede os horários que não usa para outro profissional, por hora,
                turno, dia ou mês. A sala vazia vira renda, e quem atende paga só pela parte da agenda que usa. O Subleasy junta
                os dois lados sem cobrar comissão.
              </p>

              <div className="mt-8 flex animate-fade-up flex-col gap-3 sm:flex-row" style={{ animationDelay: "240ms" }}>
                <a href="#anunciante" className={buttonClasses("primary", "lg")}>
                  Tenho uma sala
                  <ArrowRightIcon />
                </a>
                <a href="#profissional" className={buttonClasses("secondary", "lg")}>
                  <SearchIcon className="size-4.5 text-ink-500" />
                  Procuro uma sala
                </a>
              </div>
            </div>

            <SharedWeek />
          </div>
        </section>

        {/* ── Em 30 segundos ───────────────────────────────────── */}
        <section aria-labelledby="resumo-titulo" className="bg-white">
          <div className="container-page py-20 sm:py-24">
            <Reveal className="mx-auto max-w-2xl text-center">
              <Eyebrow>Em 30 segundos</Eyebrow>
              <h2 id="resumo-titulo" className={`${H2} mt-3`}>
                O que você precisa saber antes de sublocar uma sala
              </h2>
            </Reveal>
            <dl className="mt-12 grid gap-px overflow-hidden rounded-panel bg-ink-200 ring-1 ring-ink-200 sm:grid-cols-2 lg:grid-cols-4">
              {FACTS.map((fact, index) => (
                <Reveal key={fact.big} delay={index * 90} className="flex flex-col bg-white p-6 sm:p-7">
                  <dt className="text-2xl leading-tight font-bold tracking-tight text-brand-600">{fact.big}</dt>
                  <dd className="mt-3 text-[15px] leading-relaxed text-ink-600">{fact.body}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Os dois caminhos ─────────────────────────────────── */}
        <section aria-labelledby="passos-titulo" className="relative scroll-mt-16 border-y border-ink-200 bg-ink-50">
          <span id="anunciante" className="absolute -top-16" aria-hidden />
          <span id="profissional" className="absolute -top-16" aria-hidden />
          <div className="container-page py-20 sm:py-24">
            <Reveal className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <Eyebrow>Passo a passo</Eyebrow>
                <h2 id="passos-titulo" className={`${H2} mt-3 max-w-2xl`}>
                  Dois lados da mesma sala
                </h2>
                <p className="mt-4 max-w-xl text-lg text-ink-600">
                  Quem subloca o consultório e quem procura onde atender seguem caminhos diferentes, que se encontram numa
                  conversa direta.
                </p>
              </div>
            </Reveal>
            <div className="mt-10">
              <GuidePaths
                paths={[
                  {
                    id: "anunciante",
                    tab: "Tenho uma sala",
                    title: "Como sublocar seu consultório no Subleasy",
                    steps: HOST_STEPS,
                    cta: { href: "/anunciar", label: "Anunciar minha sala grátis" },
                  },
                  {
                    id: "profissional",
                    tab: "Procuro uma sala",
                    title: "Como encontrar uma sala para sublocação",
                    steps: SEEKER_STEPS,
                    cta: { href: "/salas", label: "Buscar salas" },
                  },
                ]}
              />
            </div>
          </div>
        </section>

        {/* ── Calculadora ──────────────────────────────────────── */}
        <section aria-labelledby="renda-titulo" className="bg-white">
          <div className="container-page py-20 sm:py-24">
            <Reveal className="mx-auto max-w-2xl text-center">
              <Eyebrow>Para quem tem sala</Eyebrow>
              <h2 id="renda-titulo" className={`${H2} mt-3`}>
                Quanto rende um turno vago?
              </h2>
              <p className="mt-4 text-lg text-balance text-ink-600">
                Arraste e veja quanto a sua sala pode render com os turnos que hoje ficam fechados.
              </p>
            </Reveal>
            <Reveal delay={120} className="mt-10">
              <ShiftEarnings />
            </Reveal>
          </div>
        </section>

        {/* ── Formas de cobrança ───────────────────────────────── */}
        <section aria-labelledby="cobranca-titulo" className="bg-white">
          <div className="container-page pb-20 sm:pb-24">
            <Reveal className="max-w-2xl">
              <Eyebrow>Formas de cobrança</Eyebrow>
              <h2 id="cobranca-titulo" className={`${H2} mt-3`}>
                Consultório por hora, turno, dia ou mês
              </h2>
              <p className="mt-4 text-lg text-ink-600">
                Cada anúncio mostra o preço numa dessas quatro formas. A escolha depende do ritmo da sua agenda.
              </p>
            </Reveal>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {MODELS.map((model, index) => (
                <Reveal
                  as="li"
                  key={model.name}
                  delay={index * 90}
                  className="group rounded-card border border-ink-200 p-6 transition-[border-color,box-shadow] duration-300 hover:border-brand-200 hover:shadow-raised"
                >
                  <div className="grid grid-cols-7 gap-1" aria-hidden>
                    {Array.from({ length: 21 }, (_, cell) => (
                      <span
                        key={cell}
                        className={`aspect-square rounded-[3px] transition-colors duration-500 ${
                          model.cells.includes(cell) ? "bg-brand-600 group-hover:bg-brand-500" : "bg-ink-100"
                        }`}
                        style={{ transitionDelay: `${cell * 15}ms` }}
                      />
                    ))}
                  </div>
                  <h3 className="mt-6 text-h3 font-bold text-ink-900">{model.name}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{model.body}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Sublocação × aluguel ─────────────────────────────── */}
        <section aria-labelledby="comparar-titulo" className="overflow-hidden bg-brand-900 text-white">
          <div className="container-page grid gap-12 py-20 sm:py-24 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
            <Reveal>
              <p className="text-sm font-bold text-mint-400">Antes de decidir</p>
              <h2 id="comparar-titulo" className="mt-3 text-[2rem] leading-tight font-bold tracking-[-0.02em] sm:text-h1">
                Sublocação ou aluguel tradicional?
              </h2>
              <p className="mt-4 text-lg text-brand-100">
                Alugar uma sala inteira faz sentido com a agenda cheia. Para quem está começando, abrindo um segundo endereço ou
                testando uma região, sublocar custa menos e prende menos.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <table className="w-full text-left text-[15px]">
                <caption className="sr-only">Comparação entre aluguel tradicional e sublocação de consultório</caption>
                <thead>
                  <tr className="border-b border-white/15 text-sm">
                    <th scope="col" className="py-3 pr-4 font-normal text-brand-200">
                      <span className="sr-only">Critério</span>
                    </th>
                    <th scope="col" className="py-3 pr-4 font-bold text-brand-200">
                      Aluguel tradicional
                    </th>
                    <th scope="col" className="py-3 font-bold text-mint-400">
                      Sublocação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((row) => (
                    <tr key={row.topic} className="border-b border-white/10 align-top">
                      <th scope="row" className="py-4 pr-4 font-bold whitespace-nowrap">
                        {row.topic}
                      </th>
                      <td className="py-4 pr-4 text-brand-200">{row.rent}</td>
                      <td className="py-4 text-white">{row.sublet}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          </div>
        </section>

        {/* ── Antes de fechar ──────────────────────────────────── */}
        <section aria-labelledby="checklist-titulo" className="bg-white">
          <div className="container-page py-20 sm:py-24">
            <Reveal className="mx-auto max-w-2xl text-center">
              <Eyebrow>Antes de fechar</Eyebrow>
              <h2 id="checklist-titulo" className={`${H2} mt-3`}>
                O que conferir para sublocar com segurança
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {CHECKLIST.map((group, index) => (
                <Reveal key={group.who} delay={index * 120} className="rounded-panel border border-ink-200 p-6 sm:p-8">
                  <h3 className="text-h3 font-bold text-ink-900">{group.who}</h3>
                  <ul className="mt-6 space-y-4">
                    {group.items.map((item) => (
                      <li key={item} className="flex gap-3 leading-relaxed text-ink-700">
                        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-mint-50 text-mint-700 ring-1 ring-mint-100">
                          <CheckIcon className="size-3.5" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Perguntas ────────────────────────────────────────── */}
        <section aria-labelledby="duvidas-titulo" className="border-t border-ink-200 bg-white">
          <div className="container-page grid gap-10 py-20 sm:py-24 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <Reveal>
              <Eyebrow>Perguntas frequentes</Eyebrow>
              <h2 id="duvidas-titulo" className={`${H2} mt-3`}>
                Dúvidas sobre sublocação de consultório
              </h2>
            </Reveal>
            <div className="divide-y divide-ink-200 border-y border-ink-200">
              {FAQ.map((item) => (
                <details key={item.question} className="group">
                  <summary className="focus-ring flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-lg font-bold text-ink-900 [&::-webkit-details-marker]:hidden">
                    <h3>{item.question}</h3>
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

        {/* ── Chamada final para os dois lados ─────────────────── */}
        <section aria-labelledby="final-titulo" className="bg-white pb-20 sm:pb-24">
          <div className="container-page">
            <h2 id="final-titulo" className="sr-only">
              Comece pela sua parte da agenda
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <Reveal className="relative isolate overflow-hidden rounded-panel bg-brand-600 p-8 text-white sm:p-12">
                <AgendaTexture tone="dark" />
                <p className="text-sm font-bold text-mint-400">Tenho uma sala</p>
                <p className="mt-3 text-[1.75rem] leading-tight font-bold tracking-[-0.02em] sm:text-h2">
                  Sua sala tem horários livres na semana?
                </p>
                <p className="mt-3 max-w-md text-brand-100">Publique em 3 minutos, de graça, e receba contatos de profissionais da sua cidade.</p>
                <a href="/anunciar" className={`${buttonClasses("inverse", "lg")} mt-8`}>
                  Anunciar minha sala grátis
                  <ArrowRightIcon />
                </a>
              </Reveal>
              <Reveal delay={120} className="relative overflow-hidden rounded-panel bg-ink-50 p-8 ring-1 ring-ink-200 sm:p-12">
                <p className="text-sm font-bold text-brand-600">Procuro uma sala</p>
                <p className="mt-3 text-[1.75rem] leading-tight font-bold tracking-[-0.02em] text-ink-900 sm:text-h2">
                  Precisa de um lugar para atender?
                </p>
                <p className="mt-3 max-w-md text-ink-600">Busque por bairro, tipo de sala ou turno e fale direto com quem anuncia.</p>
                <a href="/salas" className={`${buttonClasses("primary", "lg")} mt-8`}>
                  <SearchIcon className="size-4.5" />
                  Buscar salas
                </a>
              </Reveal>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

/** Grade de agenda ao fundo, sumindo para baixo. A mesma textura do blog. */
function AgendaTexture({ tone = "light" }: { tone?: "light" | "dark" }) {
  const line = tone === "light" ? "var(--color-ink-200)" : "rgb(255 255 255 / 0.09)";
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
      style={{
        backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
        backgroundSize: "56px 56px",
      }}
    />
  );
}
