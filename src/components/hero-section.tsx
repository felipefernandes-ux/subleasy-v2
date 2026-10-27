import Image from "next/image";
import {
  AiBadge,
  ArrowRightIcon,
  CheckIcon,
  SearchIcon,
  buttonClasses,
} from "./ui";

const TRUST = ["Grátis para anunciar", "Sem comissão", "Contato direto pelo WhatsApp"];

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden border-b border-ink-200 bg-white">
      <GridBackdrop />

      <div className="container-page grid items-center gap-10 pt-8 pb-14 sm:gap-14 sm:pt-20 sm:pb-20 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pt-24 lg:pb-28">
        <div className="max-w-[38rem]">
          {/* Compacto no celular: uma linha, texto de 12px. Cresce a partir de sm. */}
          <p className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white py-0.5 pr-2.5 pl-0.5 text-xs text-ink-700 shadow-xs sm:gap-2 sm:py-1 sm:pr-3 sm:pl-1 sm:text-sm">
            <span className="rounded-full bg-mint-400 px-1.5 py-px text-[0.6875rem] font-bold text-brand-900 sm:px-2 sm:py-0.5 sm:text-xs">
              Novo
            </span>
            Anúncio escrito com IA, revisado por você
          </p>

          <h1 className="mt-4 text-display font-bold text-balance text-ink-900 sm:mt-6">
            Sua sala vazia vira renda. Anúncio pronto em 3 minutos.
          </h1>

          <p className="mt-4 text-base leading-relaxed text-ink-600 sm:mt-6 sm:text-lg">
            Sublocação de consultórios e salas de saúde por turno. Envie fotos,
            responda 5 perguntas e a IA escreve o anúncio. Você revisa, publica
            de graça e vê quantas pessoas chamaram no WhatsApp.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
            <a href="/anunciar" className={buttonClasses("primary", "lg")}>
              Anunciar minha sala grátis
              <ArrowRightIcon />
            </a>
            <a href="#buscar" className={buttonClasses("secondary", "lg")}>
              <SearchIcon className="size-4.5 text-ink-500" />
              Procuro uma sala
            </a>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-600 sm:mt-8">
            {TRUST.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckIcon className="size-4 text-mint-700" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <ListingEditorPreview />
      </div>
    </section>
  );
}

/** Prévia do cadastro com IA: mostra a origem de cada campo, como no produto. */
function ListingEditorPreview() {
  return (
    <figure className="relative mx-auto w-full max-w-[34rem] lg:mr-0">
      <figcaption className="sr-only">
        Exemplo de anúncio gerado pela IA do Subleasy, com título sugerido,
        comodidades vistas nas fotos, turnos disponíveis e nota de qualidade.
      </figcaption>

      <div aria-hidden="true" className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand-600/[0.06]" />

      <div className="overflow-hidden rounded-panel bg-white shadow-raised ring-1 ring-ink-900/8">
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3">
          <p className="text-sm font-bold text-ink-900">Revisar anúncio</p>
          <p className="text-xs text-ink-500">Etapa 4 de 4</p>
        </div>

        <div className="grid grid-cols-[7.5rem_1fr] gap-4 p-5 sm:grid-cols-[9rem_1fr]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-ink-100">
            <Image
              src="/salas/sala-psicologia-maringa.webp"
              alt=""
              fill
              priority
              sizes="144px"
              className="object-cover"
            />
            <span className="absolute bottom-2 left-2 rounded-md bg-ink-900/75 px-1.5 py-0.5 text-[11px] text-white">
              Capa · foto 1
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2">
              <AiBadge />
              <span className="text-xs text-ink-500">Editável</span>
            </div>
            <p className="mt-2 text-[15px] leading-snug font-bold text-ink-900">
              Sala para psicologia com janela ampla na Zona 7
            </p>
            <ul className="mt-3 space-y-1.5 text-xs">
              <Source label="Poltronas e mesa de apoio" origin="Vimos na foto 3" />
              <Source label="Ar-condicionado" origin="Vimos na foto 2" />
              <Source label="R$ 60 por hora" origin="Você informou" />
            </ul>
          </div>
        </div>

        <div className="border-t border-ink-200 px-5 py-4">
          <p className="text-xs font-bold text-ink-700">Turnos disponíveis</p>
          <ShiftGrid />
        </div>

        <div className="flex items-center gap-4 border-t border-ink-200 bg-ink-50 px-5 py-4">
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-bold text-ink-700">Qualidade do anúncio</p>
              <p className="text-sm font-bold text-ink-900 tabular-nums">82/100</p>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-ink-200">
              <div className="h-full w-[82%] rounded-full bg-mint-500" />
            </div>
          </div>
          <span className={`${buttonClasses("primary", "sm")} pointer-events-none`}>
            Publicar
          </span>
        </div>
      </div>

      <div className="absolute -bottom-8 -left-4 hidden w-60 rounded-card bg-white p-4 shadow-raised ring-1 ring-ink-900/8 sm:block lg:-left-10">
        <p className="text-xs text-ink-500">Esta semana</p>
        <p className="mt-1 text-sm leading-snug text-ink-900">
          <span className="text-2xl font-bold tracking-tight tabular-nums">12</span>{" "}
          pessoas viram sua sala
        </p>
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-mint-700">
          3 chamaram no WhatsApp
        </p>
      </div>
    </figure>
  );
}

function Source({ label, origin }: { label: string; origin: string }) {
  return (
    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-2">
      <span className="flex min-w-0 items-center gap-1.5 text-ink-800">
        <CheckIcon className="size-3.5 shrink-0 text-mint-700" />
        <span className="sm:truncate">{label}</span>
      </span>
      <span className="shrink-0 pl-5 text-ink-500 sm:pl-0">{origin}</span>
    </li>
  );
}

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const SHIFTS = ["Manhã", "Tarde", "Noite"];
// Turnos livres no exemplo: [dia][turno]
const FREE = [
  [false, true, false],
  [true, true, false],
  [false, true, true],
  [false, false, false],
  [true, true, false],
  [true, false, false],
];

function ShiftGrid() {
  return (
    <div className="mt-2.5 grid grid-cols-[3rem_repeat(6,1fr)] gap-1 text-[11px]">
      <span />
      {DAYS.map((day) => (
        <span key={day} className="text-center text-ink-500">
          {day}
        </span>
      ))}
      {SHIFTS.map((shift, s) => (
        <ShiftRow key={shift} shift={shift} free={FREE.map((day) => day[s])} />
      ))}
    </div>
  );
}

function ShiftRow({ shift, free }: { shift: string; free: boolean[] }) {
  return (
    <>
      <span className="self-center text-ink-500">{shift}</span>
      {free.map((isFree, i) => (
        <span
          key={i}
          className={`h-5 rounded-[5px] ${isFree ? "bg-brand-600" : "bg-ink-100 ring-1 ring-ink-200 ring-inset"}`}
        />
      ))}
    </>
  );
}

function GridBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div
        className="absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_70%_30%,black,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-ink-200) 1px, transparent 1px), linear-gradient(to bottom, var(--color-ink-200) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}
