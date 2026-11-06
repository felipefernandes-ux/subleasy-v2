import type { Metadata } from "next";
import Link from "next/link";
import { CalendarBlankIcon, ClockCountdownIcon, KeyIcon } from "@phosphor-icons/react/ssr";
import { EconomyCalculator } from "@/components/economy/economy-calculator";
import { SavingCta } from "@/components/economy/saving-cta";
import { ScaleArt } from "@/components/economy/scale-art";
import { GlowButton } from "@/components/glow-button";
import { Reveal } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ArrowRightIcon, CheckIcon, Eyebrow } from "@/components/ui";
import { getMarketStats } from "@/lib/market-prices";
import { SITE_URL } from "@/lib/site";

// Palavra-chave principal: "vale a pena alugar consultório por hora" (ver docs/economia/seo.md).
// "Alugar consultório por hora" (transacional) fica com /espacos e com os anúncios; esta página é a decisão.
const PATH = "/vale-a-pena-alugar-consultorio-por-hora";
const TITLE = "Vale a pena alugar consultório por hora?";
const DESCRIPTION =
  "Calculadora: compare o custo de uma sala própria com pagar só as horas que você atende e veja quanto economiza e a partir de quantas horas a sala própria compensa.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { type: "website", url: PATH, title: `${TITLE} | Subleasy`, description: DESCRIPTION },
  twitter: { title: `${TITLE} | Subleasy`, description: DESCRIPTION },
};

const SOURCES = {
  thiago: "https://drthiagoperfeito.com.br/gestao/consultorio-proprio-vs-coworking-medico/",
  hiraki: "https://www.institutohiraki.com.br/blog/consultorio-proprio-ou-coworking-medico-comparativo-de-custos",
};

const STEPS = [
  {
    icon: KeyIcon,
    title: "O custo fixo da sala",
    body: "Aluguel, condomínio, IPTU, contas, limpeza, secretária e a montagem diluída. É o que você paga todo mês, atenda 10 horas ou 100.",
  },
  {
    icon: ClockCountdownIcon,
    title: "O custo da hora usada",
    body: "Divida o custo fixo pelas horas que você realmente atende, não pelas horas em que a sala fica aberta. Numa sala de R$ 6.000 aberta 160 horas e usada em 80, a hora custa R$ 75, e não os R$ 37,50 que a divisão ingênua sugere.",
  },
  {
    icon: CalendarBlankIcon,
    title: "O ponto de virada",
    body: "Custo fixo dividido pelo preço da hora em sala por hora. No exemplo de R$ 6.000 e hora a R$ 60, são 100 horas por mês, cerca de 25 por semana. Abaixo disso, pagar por hora custa menos.",
  },
];

// Valores dos dois exemplos publicados (ver SOURCES). Não são médias de mercado.
const EXAMPLE_ROWS: { item: string; a: string; b: string }[] = [
  { item: "Aluguel da sala", a: "R$ 3.000", b: "R$ 3.000" },
  { item: "Condomínio e IPTU", a: "R$ 800", b: "R$ 1.100" },
  { item: "Energia, água, internet, limpeza e copa", a: "R$ 500", b: "R$ 1.200" },
  { item: "Software e telefonia", a: "Não detalhado", b: "R$ 200" },
  { item: "Secretária ou recepção", a: "R$ 1.200", b: "R$ 3.500" },
  { item: "Montagem diluída em 60 meses", a: "R$ 500 (de R$ 30.000)", b: "R$ 1.000 (de R$ 60.000)" },
];

const KEEP = [
  { title: "Sua agenda passa do ponto de virada", body: "Com mais horas por mês do que o custo fixo dividido pelo preço da hora, a sala própria custa menos por hora usada." },
  { title: "Você quer um espaço com a sua marca", body: "Paciente fiel a um lugar, decoração e rotina próprias são ganhos que a conta de custo não mede." },
  { title: "Você precisa de equipamento instalado", body: "Em espaço por hora, pergunte se dá para deixar aparelhos e guardar prontuário no local." },
  { title: "O contrato do espaço limita o que você faz", body: "Confira horários, rotatividade e regras de uso antes de decidir só pelo preço." },
];

const FAQ = [
  {
    question: "Vale a pena alugar consultório por hora?",
    answer:
      "Depende das horas que você atende. Pagar por hora custa menos abaixo do ponto de virada, que é o custo fixo da sala dividido pelo preço da hora. Num exemplo de R$ 6.000 por mês fixos e hora a R$ 60, o ponto de virada é de 100 horas por mês, cerca de 25 por semana.",
  },
  {
    question: "Como calcular o ponto de virada entre sala própria e sala por hora?",
    answer:
      "Some o custo fixo mensal da sala própria, com a montagem diluída, e divida pelo preço da hora da sala por hora. O resultado é o número de horas por mês em que os dois custam o mesmo. Abaixo dele, pagar por hora sai mais barato; acima, a sala própria.",
  },
  {
    question: "Por que não dividir o aluguel pelas horas em que a sala fica aberta?",
    answer:
      "Porque você paga pelas horas vazias. O que compete com a sala por hora é o custo de cada hora usada: custo fixo dividido pelas horas que você atende. Uma sala de R$ 6.000 aberta 160 horas e usada em 80 custa R$ 75 por hora usada, e não R$ 37,50.",
  },
  {
    question: "O que costuma estar incluso no preço da hora?",
    answer:
      "Varia de espaço para espaço. Pergunte se recepção, limpeza, internet e sala de espera estão incluídas e se há taxa para horário de pico ou fim de semana. O custo real da hora é o preço somado ao que fica de fora.",
  },
  {
    question: "Preciso de contrato para atender em sala por hora?",
    answer:
      "É o mais seguro para os dois lados. Um contrato simples com horários, valor, regras de uso e aviso prévio evita mal-entendidos. Se o anunciante também aluga a sala, a Lei do Inquilinato (Lei 8.245/1991, art. 13) exige o consentimento prévio e por escrito do proprietário para sublocar. Peça a confirmação.",
  },
  {
    question: "A calculadora considera impostos?",
    answer:
      "Não. Ela compara os custos que você informa. Impostos e outras taxas dependem do seu regime, então confirme com o seu contador.",
  },
  {
    question: "O Subleasy cobra alguma coisa de quem procura sala?",
    answer:
      "Não. Buscar salas e falar com o anunciante pelo WhatsApp é grátis, e o Subleasy não cobra comissão sobre o aluguel. Contrato e pagamento são combinados direto com o anunciante.",
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
      about: { "@type": "Thing", name: "Aluguel de consultório por hora" },
    },
    {
      "@type": "WebApplication",
      name: "Calculadora: sala própria ou sala por hora",
      url: `${SITE_URL}${PATH}`,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Qualquer navegador",
      inLanguage: "pt-BR",
      description: "Compara o custo fixo de uma sala própria com pagar só as horas usadas e mostra a economia e o ponto de virada.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: TITLE, item: `${SITE_URL}${PATH}` },
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

export default async function EconomiaPage() {
  const { stats } = await getMarketStats();
  const hourStat = stats.find((item) => item.level === "all" && item.billing === "hora") ?? null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <SiteHeader />
      <main className="flex-1">
        {/* ── Resposta e calculadora ───────────────────────────── */}
        <section aria-labelledby="titulo" className="relative isolate overflow-hidden border-b border-ink-200 bg-white">
          <div aria-hidden className="absolute inset-0 -z-10 [background-image:linear-gradient(to_right,var(--color-ink-100)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-ink-100)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_80%_60%_at_30%_0%,black,transparent)]" />
          <div className="container-page pt-10 pb-14 sm:pt-16 sm:pb-24">
            <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
              <div className="max-w-[40rem]">
                <Eyebrow>Calculadora para profissionais da saúde</Eyebrow>
                <h1 id="titulo" className="mt-3 text-display font-bold text-balance text-ink-900">
                  Vale a pena alugar consultório por hora? Calcule quanto você economiza
                </h1>
                <p className="mt-5 text-base leading-relaxed text-ink-600 sm:text-lg">
                  A sala própria custa o mesmo todo mês, com a agenda cheia ou vazia. A sala por hora custa só o que você usa. Informe os custos
                  da sala e as horas que você atende: a calculadora mostra a economia e a partir de quantas horas a sala própria passa a compensar.
                </p>
                <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-600">
                  {["Grátis e sem cadastro", "Mostra o ponto de virada", "Nada do que você digita é enviado"].map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <CheckIcon className="size-4 text-mint-700" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Reveal delay={120}>
                <ScaleArt className="mx-auto w-full max-w-[34rem]" />
              </Reveal>
            </div>

            <div className="mt-10 sm:mt-14">
              <Reveal>
                <EconomyCalculator hourMedian={hourStat ? { median: hourStat.median, n: hourStat.n } : null} />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Como a conta funciona ────────────────────────────── */}
        <section aria-labelledby="como-titulo" className="bg-ink-50 py-16 sm:py-24">
          <div className="container-page">
            <Reveal>
              <Eyebrow>Como a calculadora decide</Eyebrow>
              <h2 id="como-titulo" className={`${H2} mt-3 max-w-[24ch]`}>
                Três números e um ponto de virada
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-ink-600">
                O modelo é o do{" "}
                <a href={SOURCES.thiago} target="_blank" rel="noopener noreferrer" className="font-bold text-brand-600 hover:text-brand-700">
                  Dr. Thiago Perfeito
                </a>
                : comparar duas unidades diferentes, um custo fixo por mês e um custo por hora usada, depois de levar as duas para a mesma base.
              </p>
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

        {/* ── O que entra no custo ─────────────────────────────── */}
        <section aria-labelledby="custo-titulo" className="bg-white py-16 sm:py-24">
          <div className="container-page">
            <Reveal>
              <Eyebrow>Referência de custo</Eyebrow>
              <h2 id="custo-titulo" className={`${H2} mt-3 max-w-[26ch]`}>
                O que entra no custo de uma sala própria: dois exemplos publicados
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-ink-600">
                São exemplos, não médias de mercado. O primeiro é ilustrativo, de um médico que escreve sobre gestão de consultório. O segundo é de uma
                simulação em Belo Horizonte, com valores de 2024, de uma empresa que aluga salas por hora e tem interesse comercial no resultado.
              </p>
            </Reveal>
            <Reveal delay={100} className="mt-8 overflow-hidden rounded-panel ring-1 ring-ink-200">
              <table className="w-full text-left">
                <caption className="sr-only">Custos mensais de uma sala própria em dois exemplos publicados</caption>
                <thead className="bg-ink-50 text-sm text-ink-600">
                  <tr>
                    <th scope="col" className="px-5 py-3.5 font-bold">Item, por mês</th>
                    <th scope="col" className="px-5 py-3.5 font-bold">
                      <a href={SOURCES.thiago} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700">Exemplo ilustrativo</a>
                    </th>
                    <th scope="col" className="px-5 py-3.5 font-bold">
                      <a href={SOURCES.hiraki} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700">Simulação em BH, 2024</a>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {EXAMPLE_ROWS.map((row) => (
                    <tr key={row.item}>
                      <th scope="row" className="px-5 py-3.5 font-bold text-ink-900">{row.item}</th>
                      <td className="px-5 py-3.5 text-ink-700 tabular-nums">{row.a}</td>
                      <td className="px-5 py-3.5 text-ink-700 tabular-nums">{row.b}</td>
                    </tr>
                  ))}
                  <tr className="bg-brand-50">
                    <th scope="row" className="px-5 py-4 font-bold text-ink-900">Custo fixo por mês</th>
                    <td className="px-5 py-4 text-lg font-bold text-brand-700 tabular-nums">R$ 6.000</td>
                    <td className="px-5 py-4 text-lg font-bold text-brand-700 tabular-nums">R$ 10.000</td>
                  </tr>
                  <tr>
                    <th scope="row" className="px-5 py-3.5 font-bold text-ink-900">Preço da hora na sala por hora</th>
                    <td className="px-5 py-3.5 text-ink-700 tabular-nums">R$ 60</td>
                    <td className="px-5 py-3.5 text-ink-700 tabular-nums">A partir de R$ 40</td>
                  </tr>
                </tbody>
              </table>
            </Reveal>
            <p className="mt-4 max-w-2xl text-sm text-ink-600">
              Os botões de exemplo da calculadora usam estes números, para você partir de uma conta real e trocar pelos seus valores.
              {hourStat ? ` No Subleasy, a mediana das salas por hora anunciadas hoje é de R$ ${Math.round(hourStat.median)}, com ${hourStat.n} anúncios.` : ""}{" "}
              <Link href="/espacos?cobranca=hora" className="font-bold text-brand-600 hover:text-brand-700">Ver as salas por hora</Link>.
            </p>
          </div>
        </section>

        {/* ── Quando a sala própria compensa ───────────────────── */}
        <section aria-labelledby="proprio-titulo" className="bg-ink-50 py-16 sm:py-24">
          <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Reveal>
              <Eyebrow>Sem torcer a conta</Eyebrow>
              <h2 id="proprio-titulo" className={`${H2} mt-3`}>Quando a sala própria ainda compensa</h2>
              <p className="mt-4 text-lg text-ink-600">A calculadora também diz quando o aluguel completo é a melhor escolha. Estes quatro pontos ajudam no desempate.</p>
            </Reveal>
            <ul className="grid gap-4 sm:grid-cols-2">
              {KEEP.map((item, index) => (
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
              <h2 id="faq-titulo" className={`${H2} mt-3`}>Dúvidas de quem está decidindo onde atender</h2>
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
            <Reveal className="relative isolate grid items-center gap-10 overflow-hidden rounded-panel bg-brand-600 p-8 text-white shadow-brand sm:p-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:p-16">
              <div aria-hidden className="absolute inset-0 -z-10 [background-image:linear-gradient(to_right,var(--color-brand-500)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-brand-500)_1px,transparent_1px)] [background-size:30px_30px] [mask-image:linear-gradient(to_left,rgb(0_0_0/0.6),transparent_75%)]" />
              <div>
                <h2 id="final-titulo" className="max-w-[24ch] text-h1 font-bold text-balance">Fez a conta? Veja as salas por hora.</h2>
                <p className="mt-4 max-w-xl text-lg text-brand-100">Compare preço e fotos, e fale direto com o anunciante pelo WhatsApp. Buscar é grátis e o Subleasy não cobra comissão sobre o aluguel.</p>
                <GlowButton href="/espacos?cobranca=hora" className="mt-8">
                  Ver salas por hora
                  <ArrowRightIcon />
                </GlowButton>
                <p className="mt-6 text-sm text-brand-100">
                  Tem uma sala com horários livres?{" "}
                  <Link href="/quanto-cobrar-sublocacao-consultorio" className="font-bold text-white underline underline-offset-4 hover:text-mint-400">
                    Calcule quanto ela rende
                  </Link>
                  .
                </p>
              </div>
              <SavingCta />
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
