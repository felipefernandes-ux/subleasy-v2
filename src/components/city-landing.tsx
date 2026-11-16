import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPinIcon } from "@phosphor-icons/react/ssr";
import { GlowButton } from "@/components/glow-button";
import { ListingCard } from "@/components/related-listings";
import { Reveal } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ArrowRightIcon, CheckIcon, Eyebrow, buttonClasses } from "@/components/ui";
import { cityPagePath, getCityListings, neighborhoodOf, type CityListing, type CityPage } from "@/lib/city-pages";
import { BILLING_TYPES, BILLING_TYPE_KEYS, BILLING_UNIT, formatPrice, type BillingType } from "@/lib/listing-options";
import { SITE_URL } from "@/lib/site";

/**
 * Página própria de cidade (/consultorios/santo-andre-sp). Cada cidade tem uma rota fixa que só chama
 * cityMetadata e CityLanding: sem params, a página é estática e a navegação é instantânea.
 * Palavra-chave principal: "consultório para alugar em [cidade]" (ver docs/cidades/santo-andre/seo.md).
 * A busca /espacos?local=[cidade] aponta o canonical para cá (src/lib/espacos-landing.ts).
 */

const H2 = "text-h1 font-bold text-balance text-ink-900";

/** Tudo o que a página diz sai dos anúncios no ar: contagem, bairros e faixa de preço mudam sozinhos. */
function summarize(page: CityPage, listings: CityListing[]) {
  const prices = BILLING_TYPE_KEYS.map((billing) => {
    const values = listings.filter((listing) => listing.billing_type === billing).map((listing) => listing.price);
    return values.length ? { billing, count: values.length, min: Math.min(...values), max: Math.max(...values) } : null;
  }).filter((row) => row !== null);

  const neighborhoods = page.neighborhoods
    .map((item) => ({ ...item, count: listings.filter((listing) => neighborhoodOf(page, listing.neighborhood) === item).length }))
    .filter((item) => item.count > 0);

  const cheapest = prices[0] ?? null;
  const psychology = listings.filter((listing) => listing.space_type === "psicologia").length;
  return { prices, neighborhoods, cheapest, psychology };
}

const list = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} e ${items.at(-1)}`);
/** "no bairro Centro" ou "nos bairros Centro, Vila Guiomar e Casa Branca". */
const inHoods = (names: string[]) => (names.length === 0 ? "" : names.length === 1 ? ` no bairro ${names[0]}` : ` nos bairros ${list(names)}`);
const fromPrice = (row: { billing: BillingType; min: number }) => `${formatPrice(row.min)} por ${BILLING_UNIT[row.billing]}`;

async function load(page: CityPage) {
  const data = await getCityListings(page);
  return { page, ...data, ...summarize(page, data.listings) };
}

export async function cityMetadata(city: CityPage): Promise<Metadata> {
  const { page, listings, cheapest } = await load(city);
  const path = cityPagePath(page);
  const title = `Consultório para alugar em ${page.city} por hora`;
  // Até ~155 caracteres: os bairros ficam para a página, aqui vai número, preço e o motivo do clique.
  const description = listings.length
    ? `Salas para atendimento em ${page.city}${cheapest ? `, a partir de ${fromPrice(cheapest)}` : ""}. Veja fotos e preço e fale direto com quem anuncia pelo WhatsApp, sem comissão.`
    : `Consultórios e salas para alugar em ${page.city} por hora, turno, dia ou mês. Fale direto com o anunciante pelo WhatsApp, sem comissão.`;
  return {
    title,
    description,
    alternates: { canonical: path },
    // Sem sala no ar a página fica rala: sai do índice até voltar a ter anúncio.
    robots: listings.length ? undefined : { index: false, follow: true },
    openGraph: { type: "website", url: path, title: `${title} | Subleasy`, description, images: [{ url: page.art.replace(/\.webp$/, ".png"), width: 1200, height: 1000 }] },
    twitter: { title: `${title} | Subleasy`, description },
  };
}

export async function CityLanding({ city }: { city: CityPage }) {
  const { page, listings, nearby, prices, neighborhoods, cheapest, psychology } = await load(city);
  const path = cityPagePath(page);
  const searchHref = `/espacos?${new URLSearchParams({ local: page.city })}`;
  const hood = list(neighborhoods.map((item) => item.name));
  const priceAnswer = prices.length
    ? `Nos anúncios do Subleasy em ${page.city}, ${list(
        prices.map((row) => (row.min === row.max ? `a ${BILLING_UNIT[row.billing]} sai por ${formatPrice(row.min)}` : `a ${BILLING_UNIT[row.billing]} vai de ${formatPrice(row.min)} a ${formatPrice(row.max)}`)),
      )}. O valor muda com o bairro, o tamanho da sala e o que está incluso, como recepção e limpeza.`
    : `Ainda não há sala no ar em ${page.city} para servir de referência. Os anúncios novos aparecem aqui assim que são aprovados.`;

  const faq = [
    { question: `Quanto custa alugar um consultório em ${page.city}?`, answer: priceAnswer },
    {
      question: "Dá para alugar a sala só por algumas horas, um turno ou um dia?",
      answer: `Sim. Cada anunciante escolhe como cobra: por hora, turno, dia ou mês.${
        prices.length ? ` Em ${page.city}, hoje há salas ${list(prices.map((row) => BILLING_TYPES[row.billing].toLowerCase()))}.` : ""
      } Você combina os horários direto com quem anuncia.`,
    },
    ...(psychology
      ? [
          {
            question: `Tem sala para psicólogo em ${page.city}?`,
            answer: `Tem. Há salas anunciadas para psicologia, e outras aceitam profissionais de terapia e bem-estar. Antes de fechar, confira na visita se o isolamento de som atende ao seu atendimento.`,
          },
        ]
      : []),
    {
      question: "Como falo com quem anuncia?",
      answer: "Abra o anúncio e toque em falar pelo WhatsApp. A conversa é direta com o dono da sala. Visita, contrato e pagamento são combinados entre vocês.",
    },
    {
      question: "O Subleasy cobra comissão?",
      answer: "Não. Buscar sala é grátis, anunciar é grátis e o Subleasy não fica com parte do aluguel.",
    },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}${path}#webpage`,
        url: `${SITE_URL}${path}`,
        name: `Consultório para alugar em ${page.city}`,
        inLanguage: "pt-BR",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@type": "City", name: page.city, containedInPlace: { "@type": "State", name: "São Paulo" } },
        mainEntity: { "@id": `${SITE_URL}${path}#salas` },
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}${path}#salas`,
        name: `Salas para alugar em ${page.city}`,
        numberOfItems: listings.length,
        itemListElement: listings.map((listing, index) => ({ "@type": "ListItem", position: index + 1, url: `${SITE_URL}/espaco/${listing.slug}`, name: listing.title })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Salas", item: `${SITE_URL}/espacos` },
          { "@type": "ListItem", position: 3, name: page.city, item: `${SITE_URL}${path}` },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <SiteHeader />
      <main className="flex-1">
        {/* ── Topo: confirma a busca na primeira tela ─────────── */}
        <section aria-labelledby="titulo" className="relative isolate overflow-hidden border-b border-ink-200 bg-white">
          <div aria-hidden className="absolute inset-0 -z-10 [background-image:linear-gradient(to_right,var(--color-ink-100)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-ink-100)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_80%_60%_at_70%_0%,black,transparent)]" />
          <div className="container-page pt-8 pb-14 sm:pt-12 sm:pb-20">
            <nav aria-label="Você está em" className="text-sm text-ink-600">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li><Link href="/" className="hover:text-ink-900">Início</Link></li>
                <li aria-hidden>/</li>
                <li><Link href="/espacos" className="hover:text-ink-900">Salas</Link></li>
                <li aria-hidden>/</li>
                <li aria-current="page" className="font-bold text-ink-900">{page.city}</li>
              </ol>
            </nav>
            <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
              <div className="max-w-[40rem]">
                <Eyebrow>{page.city}, {page.state}</Eyebrow>
                <h1 id="titulo" className="mt-3 text-display font-bold text-balance text-ink-900">
                  Consultório para alugar em {page.city}, por hora, dia ou mês
                </h1>
                <p className="mt-5 text-base leading-relaxed text-ink-600 sm:text-lg">
                  {listings.length ? (
                    <>
                      <strong className="font-bold text-ink-900">Salas para atendimento</strong>
                      {inHoods(neighborhoods.map((item) => item.name))}
                      {cheapest ? <>, a partir de <strong className="font-bold text-ink-900">{fromPrice(cheapest)}</strong></> : null}. Veja fotos e preço e chame quem anuncia pelo WhatsApp.
                    </>
                  ) : (
                    `As salas de ${page.city} aparecem aqui assim que são aprovadas. Enquanto isso, veja as salas das cidades vizinhas.`
                  )}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a href="#salas" className={buttonClasses("primary", "lg")}>
                    {listings.length ? "Ver as salas disponíveis" : "Ver salas"}
                    <ArrowRightIcon />
                  </a>
                  <a href="#anunciar" className={buttonClasses("secondary", "lg")}>Tenho uma sala para sublocar</a>
                </div>
                <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-600">
                  {["Sem comissão", "Contato direto pelo WhatsApp", "Anúncios revisados antes de entrar no ar"].map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <CheckIcon className="size-4 text-mint-700" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Reveal delay={120}>
                <figure className="mx-auto w-full max-w-[36rem] overflow-hidden rounded-panel bg-white ring-1 ring-ink-200">
                  <Image
                    src={page.art}
                    width={1200}
                    height={1000}
                    sizes="(min-width: 1024px) 36rem, 100vw"
                    fetchPriority="high"
                    loading="eager"
                    alt={`Mapa ilustrado de ${page.city} com os bairros que têm sala no ar: ${hood || page.city}.`}
                    className="h-auto w-full"
                  />
                </figure>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Salas no ar ─────────────────────────────────────── */}
        <section id="salas" aria-labelledby="salas-titulo" className="scroll-mt-20 bg-white py-16 sm:py-20">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow>Salas no ar agora</Eyebrow>
                <h2 id="salas-titulo" className={`${H2} mt-3`}>Salas para atendimento em {page.city}</h2>
              </div>
              {listings.length > 0 && (
                <Link href={searchHref} className="inline-flex items-center gap-1.5 font-bold text-brand-600 hover:text-brand-700">
                  Filtrar e ver no mapa
                  <ArrowRightIcon />
                </Link>
              )}
            </div>
            {listings.length ? (
              <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {listings.map((listing) => (
                  <li key={listing.slug}>
                    <ListingCard listing={listing} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-8 max-w-xl rounded-panel bg-ink-50 p-6 text-ink-600 ring-1 ring-ink-200">
                Nenhuma sala no ar em {page.city} neste momento. <a href="#anunciar" className="font-bold text-brand-600 hover:text-brand-700">Tem uma sala livre? Anuncie grátis</a>.
              </p>
            )}
          </div>
        </section>

        {/* ── Preço: a resposta vem primeiro ───────────────────── */}
        <section aria-labelledby="preco-titulo" className="bg-ink-50 py-16 sm:py-20">
          <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <Reveal>
              <Eyebrow>Preço em {page.city}</Eyebrow>
              <h2 id="preco-titulo" className={`${H2} mt-3`}>Quanto custa alugar um consultório em {page.city}</h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-600">{priceAnswer}</p>
            </Reveal>
            {prices.length > 0 && (
              <Reveal delay={100} className="self-start overflow-hidden rounded-panel bg-white ring-1 ring-ink-200">
                <table className="w-full text-left">
                  <caption className="sr-only">Faixa de preço das salas no ar em {page.city}, por tipo de cobrança</caption>
                  <thead className="bg-ink-50 text-sm text-ink-600">
                    <tr>
                      <th scope="col" className="px-5 py-3.5 font-bold">Cobrança</th>
                      <th scope="col" className="px-5 py-3.5 text-right font-bold">Faixa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-200">
                    {prices.map((row) => (
                      <tr key={row.billing}>
                        <th scope="row" className="px-5 py-4 font-bold text-ink-900">{BILLING_TYPES[row.billing]}</th>
                        <td className="px-5 py-4 text-right text-lg font-bold text-brand-700 tabular-nums">
                          {row.min === row.max ? formatPrice(row.min) : `${formatPrice(row.min)} a ${formatPrice(row.max)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-ink-200 px-5 py-3.5 text-sm text-ink-600">
                  Valores dos anúncios no ar hoje. Para comparar com o seu custo,{" "}
                  <Link href="/vale-a-pena-alugar-consultorio-por-hora" className="font-bold text-brand-600 hover:text-brand-700">veja se alugar por hora compensa</Link>.
                </p>
              </Reveal>
            )}
          </div>
        </section>

        {/* ── Bairros ─────────────────────────────────────────── */}
        {neighborhoods.length > 0 && (
          <section aria-labelledby="bairros-titulo" className="bg-white py-16 sm:py-20">
            <div className="container-page">
              <Reveal>
                <Eyebrow>Onde ficam as salas</Eyebrow>
                <h2 id="bairros-titulo" className={`${H2} mt-3`}>Bairros de {page.city} com sala no ar</h2>
              </Reveal>
              <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {neighborhoods.map((item, index) => (
                  <Reveal key={item.name} as="li" delay={index * 80} className="rounded-panel bg-white p-6 ring-1 ring-ink-200">
                    <span className="grid size-10 place-items-center rounded-control bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                      <MapPinIcon className="size-5" weight="duotone" aria-hidden />
                    </span>
                    <h3 className="mt-4 text-h3 font-bold text-ink-900">{item.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.text}</p>
                  </Reveal>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── Perguntas ───────────────────────────────────────── */}
        <section aria-labelledby="faq-titulo" className="bg-ink-50 py-16 sm:py-20">
          <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Reveal>
              <Eyebrow>Perguntas frequentes</Eyebrow>
              <h2 id="faq-titulo" className={`${H2} mt-3`}>Dúvidas de quem procura sala em {page.city}</h2>
              {nearby.length > 0 && (
                <div className="mt-8">
                  <p className="text-sm font-bold text-ink-900">Salas em cidades vizinhas</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {nearby.map((city) => (
                      <li key={city.city}>
                        <Link
                          href={`/espacos?${new URLSearchParams({ local: city.city })}`}
                          className="focus-ring inline-flex h-11 items-center rounded-full bg-white px-4 text-sm font-bold text-ink-800 ring-1 ring-ink-200 hover:ring-ink-400"
                        >
                          {city.city}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Reveal>
            <div className="divide-y divide-ink-200 border-y border-ink-200">
              {faq.map((item) => (
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

        {/* ── Quem tem sala ───────────────────────────────────── */}
        <section id="anunciar" aria-labelledby="anunciar-titulo" className="scroll-mt-20 bg-white py-16 sm:py-20">
          <div className="container-page">
            <Reveal className="relative isolate overflow-hidden rounded-panel bg-brand-600 p-8 text-white shadow-brand sm:p-12 lg:p-16">
              <div aria-hidden className="absolute inset-0 -z-10 [background-image:linear-gradient(to_right,var(--color-brand-500)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-brand-500)_1px,transparent_1px)] [background-size:30px_30px] [mask-image:linear-gradient(to_left,rgb(0_0_0/0.6),transparent_75%)]" />
              <h2 id="anunciar-titulo" className="max-w-[22ch] text-h1 font-bold text-balance">Sua sala em {page.city} fica livre em alguns horários?</h2>
              <p className="mt-4 max-w-2xl text-lg text-brand-100">
                {page.hostProof ? `${page.hostProof} ` : ""}O anúncio é grátis, fica pronto em 3 minutos com ajuda da IA e você não paga comissão sobre o aluguel.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <GlowButton href="/anunciar">
                  Anunciar minha sala grátis
                  <ArrowRightIcon />
                </GlowButton>
                <Link href="/quanto-cobrar-sublocacao-consultorio" className="inline-flex items-center gap-1.5 font-bold text-white underline underline-offset-4 hover:text-mint-400">
                  Calcular quanto cobrar
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
