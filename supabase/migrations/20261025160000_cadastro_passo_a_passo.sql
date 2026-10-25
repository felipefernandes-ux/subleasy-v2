-- Subleasy 2.0 — cadastro passo a passo
-- Tipos de espaço iguais aos do Subleasy atual, destaques, ofertas para quem vem
-- pelo Subleasy e o ponto do mapa (exato ou aproximado, à escolha do anfitrião).

-- 1. Tipos de espaço. Estúdio e sala de reunião passam a "outro".
update public.listings set space_type = 'outro' where space_type in ('estudio', 'reuniao');

alter table public.listings drop constraint listings_space_type_check;
alter table public.listings add constraint listings_space_type_check check (space_type in (
  'consultorio_medico', 'odontologia', 'psicologia', 'estetica', 'terapias',
  'fisioterapia', 'nutricao', 'to_fono', 'outro'
));

-- 2. Destaques (até 2), ofertas e mapa.
alter table public.listings
  add column highlights text[] not null default '{}'
    check (cardinality(highlights) <= 2),
  add column offers text[] not null default '{}'
    check (offers <@ array['primeiro_turno_gratis', 'desconto_primeiro_mes', 'sem_caucao', 'sem_fidelidade']::text[]),
  -- false: o mapa mostra uma área aproximada; o ponto gravado já vem arredondado.
  add column show_exact_location boolean not null default false,
  add column latitude double precision check (latitude between -90 and 90),
  add column longitude double precision check (longitude between -180 and 180);
