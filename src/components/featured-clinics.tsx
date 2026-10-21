import Image from "next/image";
import { RoomSearch } from "./room-search";
import { ArrowRightIcon, Eyebrow, buttonClasses } from "./ui";

// Exemplos até a migração dos anúncios do WordPress (fase 0).
const ROOMS = [
  {
    slug: "sala-psicologia-zona-7-maringa",
    neighborhood: "Zona 7",
    title: "Sala para psicologia com janela ampla",
    for: "Psicologia e terapias",
    shifts: "Ter e Qui à tarde",
    price: "R$ 60",
    unit: "/hora",
    confirmed: "há 3 dias",
    image: "/salas/sala-psicologia-maringa.webp",
    alt: "Sala de atendimento com sofá cinza, poltronas, mesa de centro de vidro e plantas",
  },
  {
    slug: "consultorio-odontologico-centro-maringa",
    neighborhood: "Centro",
    title: "Consultório odontológico equipado",
    for: "Odontologia",
    shifts: "Seg a Sex de manhã",
    price: "R$ 280",
    unit: "/turno",
    confirmed: "há 6 dias",
    image: "/salas/consultorio-odontologico-maringa.jpg",
    alt: "Consultório odontológico com cadeira, equipo, pia e bancada com armários brancos",
  },
  {
    slug: "sala-procedimentos-novo-centro-maringa",
    neighborhood: "Novo Centro",
    title: "Sala de procedimentos com foco cirúrgico",
    for: "Medicina e estética",
    shifts: "Sáb de manhã",
    price: "R$ 350",
    unit: "/turno",
    confirmed: "há 2 dias",
    image: "/salas/sala-procedimentos-maringa.jpg",
    alt: "Sala de procedimentos branca com maca, foco cirúrgico no teto e carrinho auxiliar",
  },
] as const;

export function FeaturedClinics() {
  return (
    <section id="buscar" aria-labelledby="buscar-titulo" className="scroll-mt-16 bg-ink-50">
      <div className="container-page py-20 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Para quem procura sala</Eyebrow>
          <h2
            id="buscar-titulo"
            className="mt-3 text-[2rem] leading-tight font-bold tracking-[-0.02em] text-ink-900 sm:text-h1"
          >
            Encontre sala para atender por turno em Maringá
          </h2>
          <p className="mt-4 text-lg text-ink-600">
            Descreva o que você precisa do seu jeito. Mostramos os filtros que
            entendemos e você fala direto com o dono da sala.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <RoomSearch />
        </div>

        <div id="salas" className="mt-16 scroll-mt-24">
          <div className="flex items-end justify-between gap-4">
            <h3 className="text-h3 font-bold text-ink-900">Salas disponíveis</h3>
            <a
              href="/salas/maringa"
              className="focus-ring hidden items-center gap-1 rounded-control text-sm font-bold text-brand-600 hover:text-brand-500 sm:inline-flex"
            >
              Ver todas em Maringá
              <ArrowRightIcon />
            </a>
          </div>

          <ul className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ROOMS.map((room) => (
              <li key={room.slug}>
                <RoomCard room={room} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function RoomCard({ room }: { room: (typeof ROOMS)[number] }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card bg-white shadow-card ring-1 ring-ink-200 transition hover:shadow-raised">
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-100">
        <Image
          src={room.image}
          alt={room.alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink-800 shadow-xs">
          {room.neighborhood}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm text-brand-600">{room.for}</p>
        <h4 className="mt-1 text-lg leading-snug font-bold tracking-[-0.01em] text-ink-900">
          <a href={`/salas/${room.slug}`} className="focus-ring rounded-sm after:absolute after:inset-0">
            {room.title}
          </a>
        </h4>

        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-ink-200 pt-4 text-sm">
          <div>
            <dt className="text-ink-500">Turnos livres</dt>
            <dd className="mt-0.5 text-ink-800">{room.shifts}</dd>
          </div>
          <div>
            <dt className="text-ink-500">A partir de</dt>
            <dd className="mt-0.5 text-ink-800">
              <span className="font-bold text-ink-900 tabular-nums">{room.price}</span>
              {room.unit}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <p className="flex items-center gap-1.5 text-xs text-ink-500">
            <span className="size-1.5 rounded-full bg-mint-500" aria-hidden="true" />
            Disponibilidade confirmada {room.confirmed}
          </p>
          <span className={buttonClasses("secondary", "sm")} aria-hidden="true">
            Ver sala
          </span>
        </div>
      </div>
    </article>
  );
}
