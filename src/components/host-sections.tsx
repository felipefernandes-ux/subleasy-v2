import { AiBadge, ArrowRightIcon, CheckIcon, Eyebrow, buttonClasses } from "./ui";

const STEPS = [
  {
    title: "Fotografe a sala",
    body: "Pelo celular, de dentro da sala. Um guia mostra o que fotografar: sala inteira, mesa ou maca, janela, recepção.",
    meta: "4 a 8 fotos",
  },
  {
    title: "Responda 5 perguntas",
    body: "Para quem a sala serve, o que tem nela, o que o prédio oferece e quais são as regras. Por texto ou áudio.",
    meta: "Cerca de 2 minutos",
  },
  {
    title: "Revise e publique",
    body: "A IA escreve título e descrição e marca de onde veio cada informação. Nada vai ao ar sem a sua revisão.",
    meta: "Grátis",
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-titulo"
      className="scroll-mt-16 bg-white"
    >
      <div className="container-page py-20 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div className="max-w-md">
            <Eyebrow>Para quem tem sala</Eyebrow>
            <h2
              id="como-funciona-titulo"
              className="mt-3 text-[2rem] leading-tight font-bold tracking-[-0.02em] text-ink-900 sm:text-h1"
            >
              Publique sua sala em 3 minutos, pelo celular
            </h2>
            <p className="mt-4 text-lg text-ink-600">
              Você informa preço, endereço e turnos. A IA cuida da redação e lê
              as fotos. O que ela não tem como saber, ela pergunta.
            </p>
            <div className="mt-8 flex flex-col items-start gap-4">
              <a href="/anunciar" className={buttonClasses("primary", "lg")}>
                Começar meu anúncio
                <ArrowRightIcon />
              </a>
              <a href="/como-funciona" className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-control text-sm font-bold text-brand-600 hover:text-brand-700">
                Como funciona a sublocação de consultório
                <ArrowRightIcon />
              </a>
            </div>
          </div>

          <ol className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-5 rounded-card border border-ink-200 p-5 sm:flex-col sm:gap-4 lg:flex-row lg:gap-5"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-600 text-sm font-bold text-white tabular-nums">
                  {index + 1}
                </span>
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h3 className="text-lg font-bold text-ink-900">{step.title}</h3>
                    <span className="text-sm text-mint-700">{step.meta}</span>
                  </div>
                  <p className="mt-1.5 text-ink-600">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

const METRICS = [
  { label: "Visualizações", value: "48", note: "+12 nesta semana" },
  { label: "Cliques no WhatsApp", value: "7", note: "Taxa de contato de 15%" },
  { label: "Seu preço por hora", value: "R$ 60", note: "Na faixa da Zona 7" },
];

const HOST_BENEFITS = [
  "Veja quantas pessoas abriram sua sala e quantas chamaram no WhatsApp.",
  "Compare seu preço com salas parecidas da região.",
  "Receba uma recomendação por semana do que mudar no anúncio.",
  "Seu anúncio fica no ar por 30 dias e renova grátis com um clique.",
];

export function HostDashboard() {
  return (
    <section
      id="painel"
      aria-labelledby="painel-titulo"
      className="scroll-mt-16 overflow-hidden bg-brand-900 text-white"
    >
      <div className="container-page grid items-center gap-14 py-20 sm:py-24 lg:grid-cols-2">
        <div className="max-w-lg">
          <p className="text-sm font-bold text-mint-400">Painel do anunciante</p>
          <h2
            id="painel-titulo"
            className="mt-3 text-[2rem] leading-tight font-bold tracking-[-0.02em] sm:text-h1"
          >
            Saiba quantas pessoas viram sua sala e chamaram no WhatsApp
          </h2>
          <ul className="mt-8 space-y-4">
            {HOST_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex gap-3 text-brand-100">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-mint-400 text-brand-900">
                  <CheckIcon className="size-3.5" />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
          <a href="/anunciar" className={`${buttonClasses("inverse", "lg")} mt-10`}>
            Anunciar minha sala grátis
            <ArrowRightIcon />
          </a>
        </div>

        <figure className="rounded-panel bg-white p-5 text-ink-900 shadow-brand sm:p-6">
          <figcaption className="sr-only">
            Exemplo do painel do anunciante com visualizações, cliques no
            WhatsApp, comparação de preço e uma recomendação da IA.
          </figcaption>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Sala para psicologia, Zona 7</p>
              <p className="text-xs text-ink-500">Últimos 30 dias</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-50 px-2.5 py-1 text-xs font-bold text-mint-700 ring-1 ring-mint-100">
              <span className="size-1.5 rounded-full bg-mint-500" aria-hidden="true" />
              No ar
            </span>
          </div>

          <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {METRICS.map((metric) => (
              <div key={metric.label} className="rounded-card border border-ink-200 p-4">
                <dt className="text-xs text-ink-500">{metric.label}</dt>
                <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
                  {metric.value}
                </dd>
                <dd className="mt-1 text-xs text-ink-600">{metric.note}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 rounded-card bg-brand-50 p-4 ring-1 ring-brand-100">
            <AiBadge label="Recomendação da semana" />
            <p className="mt-2 text-sm leading-relaxed text-ink-800">
              Adicione uma foto da recepção. Anúncios com recepção recebem mais
              contatos na sua região.
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-ink-200 pt-4 text-xs text-ink-500">
            <span>Publicado em 14/10</span>
            <span>Expira em 13/11</span>
          </div>
        </figure>
      </div>
    </section>
  );
}
