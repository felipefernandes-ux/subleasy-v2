import type { Metadata } from "next";
import Link from "next/link";
import { CalendarBlankIcon, ChartLineUpIcon, ScalesIcon } from "@phosphor-icons/react/ssr";
import { RoomArt } from "@/components/calculator/room-art";
import { SubleaseCalculator } from "@/components/calculator/sublease-calculator";
import { Reveal } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ArrowRightIcon, CheckIcon, Eyebrow, buttonClasses } from "@/components/ui";
import { MIN_SAMPLE, getMarketStats } from "@/lib/market-prices";
import { BILLING_UNITS, money, type Billing } from "@/lib/sublease-calc";
import { SITE_URL } from "@/lib/site";

// Palavra-chave principal: "quanto cobrar sublocação de consultório" (ver docs/calculadora/seo.md).
// A busca "sublocação de consultório" fica com a home, e esta página não disputa com ela.
const PATH = "/quanto-cobrar-sublocacao-consultorio";
const TITLE = "Quanto cobrar na sublocação de consultório";
const DESCRIPTION =
  "Calculadora de sublocação de consultório: escolha o tipo de sala, a cidade e as horas livres e veja quanto cobrar e quanto sua sala rende por mês.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { type: "website", url: PATH, title: `${TITLE} | Subleasy`, description: DESCRIPTION },
  twitter: { title: `${TITLE} | Subleasy`, description: DESCRIPTION },
};

const STEPS = [
  {
    icon: CalendarBlankIcon,
    title: "Sua agenda",
    body: "Horas, turnos ou dias livres por semana, somados em um mês de 4,33 semanas. A semana vira uma grade de 21 turnos, e você vê quais a sua sala oferece.",
  },
  {
    icon: ChartLineUpIcon,
    title: "Sua ocupação",
    body: "Nem todo horário livre é alugado. Você escolhe o percentual, e a calculadora mostra a renda esperada e uma faixa de 20 pontos a menos e a mais.",
  },
  {
    icon: ScalesIcon,
    title: "Seu preço no mercado",
    body: "Comparamos o seu valor com a mediana dos anúncios do Subleasy na sua cidade. Sem anúncios suficientes ali, usamos o estado, depois o Brasil, e avisamos qual nível entrou na conta.",
  },
];

const BEFORE = [
  {
    title: "Autorização do proprietário",
    body: "Se você aluga a sala, a Lei do Inquilinato (Lei 8.245/1991, art. 13) exige consentimento prévio e por escrito do locador para sublocar, total ou parcialmente.",
  },
  {
    title: "Contrato por escrito",
    body: "Um contrato simples com horários, valor, regras de uso, reajuste e aviso prévio evita mal-entendidos com quem aluga.",
  },
  {
    title: "Licenças da atividade",
    body: "Alvará e licença sanitária, quando a atividade exige, valem para a sala e continuam sendo seus. O Subleasy não confere documentos.",
  },
  {
    title: "Imposto sobre a renda",
    body: "A renda da sublocação costuma entrar na declaração, como pessoa física ou como receita da empresa. Confirme o seu caso com um contador.",
  },
];

const FAQ = [
  {
    question: "Quanto cobrar pela sublocação de um consultório por hora?",
    answer:
      "Não existe tabela oficial. Comece pelo seu custo: some aluguel, condomínio, luz, internet e limpeza do mês e divida pelas horas em que a sala fica livre. Esse é o piso. Depois compare com os anúncios da sua cidade e ajuste. Na calculadora, o campo de custo mostra esse piso.",
  },
  {
    question: "Qual é uma ocupação realista para uma sala sublocada?",
    answer:
      "Depende da cidade, do tipo de sala e dos horários. O Subleasy ainda tem poucos anúncios para cravar um número, então a calculadora começa em 50% e deixa você ajustar. Teste 30%, 50% e 70% para ver quanto a renda muda.",
  },
  {
    question: "Posso sublocar o consultório que eu alugo?",
    answer:
      "Depende do contrato e do proprietário. Pela Lei do Inquilinato (Lei 8.245/1991, art. 13), a sublocação total ou parcial exige consentimento prévio e por escrito do locador. Peça essa autorização antes de anunciar.",
  },
  {
    question: "Preciso pagar imposto sobre a renda da sublocação?",
    answer:
      "Em geral, sim. A renda de aluguel entra na declaração de quem é pessoa física, e quem tem CNPJ trata o valor como receita da empresa. A regra muda conforme o caso, então confirme com um contador antes de fechar.",
  },
  {
    question: "Cobrar por hora, turno, dia ou mês: qual rende mais?",
    answer:
      "Hora e turno costumam render mais por horário ocupado, mas pedem mais gestão. O mês traz renda previsível com menos trabalho. A calculadora deixa você comparar as quatro cobranças com os mesmos dados.",
  },
  {
    question: "A calculadora garante esse valor?",
    answer:
      "Não. É uma estimativa feita com os números que você digita e com os anúncios do Subleasy. O valor real depende de quantos horários você fecha e do preço que o mercado aceita na sua região.",
  },
  {
    question: "O Subleasy cobra comissão sobre a sublocação?",
    answer:
      "Não. Anunciar é grátis e o Subleasy não cobra comissão sobre o aluguel. Contrato e pagamento são combinados direto entre você e o profissional.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}${PATH}#webpage`,
      url: `${SITE_URL}${PATH}`,
      name: `${TITLE} | Subleasy`,
      description: DESCRIPTION,
      inLanguage: "pt-BR",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@type": "Thing", name: "Sublocação de consultório" },
    },
    {
      "@type": "WebApplication",
      name: "Calculadora de sublocação de consultório",
      url: `${SITE_URL}${PATH}`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Qualquer navegador",
      inLanguage: "pt-BR",
      description: "Calcula a renda mensal de uma sala sublocada por hora, turno, dia ou mês e compara o preço com os anúncios do Subleasy.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Quanto cobrar na sublocação de consultório", item: `${SITE_URL}${PATH}` },
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

const H2 = "text-h1 font-bold text-balance text-ink-900";
const dateLabel = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });

export default async function CalculadoraPage() {
  const { stats, updatedAt } = await getMarketStats();
  const national = (Object.keys(BILLING_UNITS) as Billing[]).map((billing) => ({
    billing,
    stat: stats.find((item) => item.level === "all" && item.billing === billing) ?? null,
  }));
  const hasData = national.some((row) => row.stat);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <SiteHeader />
      <main className="flex-1">
        {/* ── Resposta e calculadora ───────────────────────────── */}
        <section aria-labelledby="titulo" className="relative isolate overflow-hidden border-b border-ink-200 bg-white">
          <div aria-hidden className="absolute inset-0 -z-10 [background-image:linear-gradient(to_right,var(--color-ink-100)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-ink-100)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_80%_60%_at_70%_0%,black,transparent)]" />
          <div className="container-page pt-10 pb-14 sm:pt-16 sm:pb-24">
            <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
              <div className="max-w-[40rem]">
                <Eyebrow>Calculadora para quem tem sala</Eyebrow>
                <h1 id="titulo" className="mt-3 text-display font-bold text-balance text-ink-900">
                  Quanto cobrar na sublocação de consultório e quanto sua sala rende
                </h1>
                <p className="mt-5 text-base leading-relaxed text-ink-600 sm:text-lg">
                  Para saber quanto cobrar, some o custo mensal da sala, divida pelas horas livres e compare com os anúncios da sua cidade. A
                  calculadora faz essa conta e mostra a renda por mês, por hora, turno, dia ou mês.
                </p>
                <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-600">
                  {["Grátis e sem cadastro", "Compara com anúncios reais", "Nada do que você digita é enviado"].map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <CheckIcon className="size-4 text-mint-700" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Reveal delay={120}>
                <RoomArt className="mx-auto w-full max-w-[34rem]" />
              </Reveal>
            </div>

            <div className="mt-10 sm:mt-14">
              <Reveal>
                <SubleaseCalculator stats={stats} />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Como a conta é feita ─────────────────────────────── */}
        <section aria-labelledby="como-titulo" className="bg-ink-50 py-16 sm:py-24">
          <div className="container-page">
            <Reveal>
              <Eyebrow>Como a calculadora chega no número</Eyebrow>
              <h2 id="como-titulo" className={`${H2} mt-3 max-w-[22ch]`}>
                Três dados seus e uma referência do mercado
              </h2>
            </Reveal>
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <Reveal key={step.title} as="li" delay={index * 100} className="rounded-panel bg-white p-6 ring-1 ring-ink-200 sm:p-8">
                  <span className="grid size-11 place-items-center rounded-control bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    <step.icon className="size-6" weight="duotone" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-h3 font-bold text-ink-900">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-600">{step.body}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ── O que os anúncios cobram hoje ────────────────────── */}
        <section aria-labelledby="mercado-titulo" className="bg-white py-16 sm:py-24">
          <div className="container-page">
            <Reveal>
              <Eyebrow>Referência de preço</Eyebrow>
              <h2 id="mercado-titulo" className={`${H2} mt-3 max-w-[24ch]`}>
                O que os anúncios do Subleasy cobram hoje
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-ink-600">
                Medianas dos anúncios no ar, por tipo de cobrança, em {dateLabel.format(new Date(updatedAt))}. Só mostramos uma faixa quando há {MIN_SAMPLE} ou mais
                anúncios, para não expor ninguém nem tirar conclusão de um caso isolado.
              </p>
            </Reveal>
            <Reveal delay={100} className="mt-8 overflow-hidden rounded-panel ring-1 ring-ink-200">
              <table className="w-full text-left">
                <caption className="sr-only">Preços medianos dos anúncios do Subleasy por tipo de cobrança</caption>
                <thead className="bg-ink-50 text-sm text-ink-600">
                  <tr>
                    <th scope="col" className="px-5 py-3.5 font-bold">Cobrança</th>
                    <th scope="col" className="px-5 py-3.5 font-bold">Mediana</th>
                    <th scope="col" className="hidden px-5 py-3.5 font-bold sm:table-cell">Faixa comum</th>
                    <th scope="col" className="px-5 py-3.5 text-right font-bold">Anúncios</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {national.map(({ billing, stat }) => (
                    <tr key={billing}>
                      <th scope="row" className="px-5 py-4 font-bold text-ink-900">{BILLING_UNITS[billing].label}</th>
                      <td className="px-5 py-4 text-lg font-bold text-brand-700 tabular-nums">{stat ? money.format(Math.round(stat.median)) : "Sem base ainda"}</td>
                      <td className="hidden px-5 py-4 text-ink-600 tabular-nums sm:table-cell">{stat ? `${money.format(Math.round(stat.p25))} a ${money.format(Math.round(stat.p75))}` : "Menos de 3 anúncios"}</td>
                      <td className="px-5 py-4 text-right text-ink-600 tabular-nums">{stat ? stat.n : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
            <p className="mt-4 max-w-2xl text-sm text-ink-600">
              {hasData
                ? "A base ainda é pequena e cresce a cada anúncio publicado. Na calculadora, a referência passa a ser da sua cidade assim que ela tiver anúncios suficientes."
                : "A base ainda é pequena. A referência aparece aqui e na calculadora assim que houver anúncios suficientes."}{" "}
              <Link href="/espacos" className="font-bold text-brand-600 hover:text-brand-700">Ver as salas anunciadas</Link>.
            </p>
          </div>
        </section>

        {/* ── Antes de sublocar ────────────────────────────────── */}
        <section aria-labelledby="antes-titulo" className="bg-ink-50 py-16 sm:py-24">
          <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Reveal>
              <Eyebrow>Antes de anunciar</Eyebrow>
              <h2 id="antes-titulo" className={`${H2} mt-3`}>Quatro cuidados para sublocar com segurança</h2>
              <p className="mt-4 text-lg text-ink-600">Conferir isto antes evita o problema mais comum: anunciar uma sala que o contrato não deixa sublocar.</p>
            </Reveal>
            <ul className="grid gap-4 sm:grid-cols-2">
              {BEFORE.map((item, index) => (
                <Reveal key={item.title} as="li" delay={index * 80} className="rounded-panel bg-white p-6 ring-1 ring-ink-200">
                  <span className="grid size-8 place-items-center rounded-full bg-mint-100 text-mint-700"><CheckIcon className="size-4" /></span>
                  <h3 className="mt-4 font-bold text-ink-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{item.body}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Perguntas ────────────────────────────────────────── */}
        <section aria-labelledby="faq-titulo" className="bg-white py-16 sm:py-24">
          <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Reveal>
              <Eyebrow>Perguntas frequentes</Eyebrow>
              <h2 id="faq-titulo" className={`${H2} mt-3`}>Dúvidas de quem vai cobrar pela sala</h2>
            </Reveal>
            <div className="divide-y divide-ink-200 border-y border-ink-200">
              {FAQ.map((item) => (
                <details key={item.question} className="group">
                  <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-bold text-ink-900 [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full ring-1 ring-ink-300 transition-transform duration-300 group-open:rotate-45">+</span>
                  </summary>
                  <p className="max-w-2xl pb-6 leading-relaxed text-ink-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Chamada final ────────────────────────────────────── */}
        <section aria-labelledby="final-titulo" className="bg-white pb-20 sm:pb-24">
          <div className="container-page">
            <Reveal className="relative isolate overflow-hidden rounded-panel bg-brand-600 p-8 text-white shadow-brand sm:p-12 lg:p-16">
              <div aria-hidden className="absolute inset-0 -z-10 [background-image:linear-gradient(to_right,var(--color-brand-500)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-brand-500)_1px,transparent_1px)] [background-size:30px_30px] [mask-image:linear-gradient(to_left,rgb(0_0_0/0.6),transparent_75%)]" />
              <h2 id="final-titulo" className="max-w-[24ch] text-h1 font-bold text-balance">Fez a conta? Coloque a sala no ar.</h2>
              <p className="mt-4 max-w-xl text-lg text-brand-100">Anúncio grátis, pronto em 3 minutos com ajuda da IA e sem comissão sobre o aluguel. Quem procura sala fala direto com você pelo WhatsApp.</p>
              <a href="/anunciar" className={`${buttonClasses("inverse", "lg")} mt-8`}>
                Anunciar minha sala grátis
                <ArrowRightIcon />
              </a>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
