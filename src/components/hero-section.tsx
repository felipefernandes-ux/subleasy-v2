import { HeroSearch } from "./hero-search";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-paper">
      <FloorPlanBackdrop />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <a href="/" className="flex items-baseline gap-2 text-navy">
          <span className="font-display text-2xl font-medium tracking-tight">
            Subleasy
          </span>
          <span className="rounded-full bg-ice px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-clinic uppercase">
            2.0
          </span>
        </a>
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-ink sm:flex">
          <a href="#salas" className="transition hover:text-navy">
            Salas
          </a>
          <a href="#como-funciona" className="transition hover:text-navy">
            Como funciona
          </a>
          <a href="#anunciar" className="transition hover:text-navy">
            Anunciar
          </a>
        </nav>
        <a
          href="#entrar"
          className="rounded-full border border-mist bg-white/80 px-4 py-2 text-sm font-semibold text-navy transition hover:border-clinic/40 hover:bg-ice"
        >
          Entrar
        </a>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-5 pt-10 pb-20 text-center sm:px-8 sm:pt-16 sm:pb-28">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-mist bg-white/70 px-3 py-1 text-xs font-medium tracking-[0.16em] text-clinic uppercase">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clinic/50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-clinic" />
          </span>
          Consultórios disponíveis agora
        </p>

        <h1 className="max-w-3xl font-display text-[2.35rem] leading-[1.12] font-medium tracking-tight text-navy sm:text-5xl lg:text-[3.5rem]">
          O consultório certo, no horário que a sua prática pede.
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-ink sm:text-lg">
          Sublocação de salas para médicos, dentistas, psicólogos e demais
          profissionais da saúde. Diga o que precisa em linguagem natural —
          especialidade, bairro, equipamentos, dias da semana — e encontre
          espaços prontos para atender.
        </p>

        <div className="mt-10 w-full lg:mt-12">
          <HeroSearch />
        </div>

        <ul className="mt-10 flex w-full max-w-3xl flex-col gap-4 border-t border-mist/80 pt-6 text-left sm:flex-row sm:gap-8">
          <Stat label="Especialidades" value="40+" />
          <Stat label="Reserva" value="Por hora ou período" />
          <Stat label="Pronto para atender" value="Mobília e equipamentos" />
        </ul>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex flex-1 flex-col gap-0.5">
      <span className="text-[11px] font-semibold tracking-[0.14em] text-clinic uppercase">
        {label}
      </span>
      <span className="text-sm font-medium text-navy">{value}</span>
    </li>
  );
}

function FloorPlanBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #c5d6e4 1px, transparent 1px),
            linear-gradient(to bottom, #c5d6e4 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,143,207,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(11,58,91,0.08),transparent_50%)]" />
      <div className="absolute top-24 right-[-4rem] hidden h-72 w-72 rounded-[2rem] border border-mist/80 bg-white/40 lg:block" />
      <div className="absolute right-24 bottom-16 hidden h-40 w-56 rounded-[1.5rem] border border-clinic/20 bg-ice/50 lg:block" />
    </div>
  );
}
