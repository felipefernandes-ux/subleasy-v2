-- Subleasy 2.0 — schema inicial (fase 0)
-- Referência: "Subleasy 2.0: estratégia, posicionamento e plano de negócio" v1.1

-- 1. Tabela principal de anúncios (listings): só dados públicos.
--    Telefone e endereço completo ficam em listing_contacts (LGPD).
create table public.listings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  owner_id uuid not null references auth.users(id) on delete cascade,

  -- Informações principais
  title text not null check (char_length(title) between 10 and 70),
  slug text not null unique,
  description text,
  short_summary varchar(120), -- Resumo para cards e prévia de WhatsApp
  space_type text not null check (space_type in (
    'consultorio_medico', 'psicologia', 'nutricao', 'fisioterapia',
    'odontologia', 'estetica', 'terapias', 'estudio', 'reuniao'
  )),

  -- Precificação e cobrança (o preço vale para a unidade de billing_type)
  billing_type text not null default 'turno'
    check (billing_type in ('hora', 'turno', 'dia', 'mes')),
  price numeric(10, 2) not null check (price >= 10),

  -- Localização estruturada (cidade e bairro vêm do CEP no cadastro)
  city text not null,
  state char(2) not null check (state ~ '^[A-Z]{2}$'),
  neighborhood text not null,
  zip_code varchar(9) check (zip_code ~ '^[0-9]{5}-?[0-9]{3}$'),

  -- Disponibilidade por turno: {"seg": ["manha", "tarde"], "ter": ["noite"]}
  shifts_available jsonb not null default '{}'::jsonb
    check (jsonb_typeof(shifts_available) = 'object'),
  min_rental_period text, -- Ex: "1 turno/semana"
  rules text[] not null default '{}', -- Regras de uso (ex: sem procedimentos invasivos)

  -- Comodidades e mídia
  amenities text[] not null default '{}', -- Ex: ['ar_condicionado', 'maca', 'pia', 'recepcao', 'wifi']
  photos text[] not null default '{}', -- Caminhos das fotos no Supabase Storage

  -- Status e ciclo de confirmação: lembrete a cada 30 dias, 60 após 3 confirmações seguidas
  status text not null default 'draft'
    check (status in ('draft', 'pending_approval', 'active', 'paused')),
  last_confirmed_at timestamp with time zone default now() not null,
  confirmation_interval_days smallint not null default 30
    check (confirmation_interval_days in (30, 60)),
  consecutive_confirmations smallint not null default 0
);

-- 2. Contato privado: só o dono lê e edita. O buscador recebe o número
--    pela função get_listing_whatsapp, que registra o clique.
create table public.listing_contacts (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  whatsapp_number varchar(20) not null check (whatsapp_number ~ '^\+?[0-9]{10,15}$'),
  street_address text
);

-- 3. Eventos para o painel do anunciante (visualizações e cliques no WhatsApp).
--    Um evento por visitante, por anúncio, por dia.
create table public.listing_events (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings(id) on delete cascade,
  kind text not null check (kind in ('view', 'whatsapp_click')),
  visitor_id text not null, -- Hash anônimo do visitante (cookie), nunca dado pessoal
  day date not null default (now() at time zone 'America/Sao_Paulo')::date,
  created_at timestamp with time zone default now() not null,
  unique (listing_id, kind, visitor_id, day)
);

-- 4. Índices de performance para filtros, localização e RLS
create index listings_owner_id_idx on public.listings (owner_id);
create index listings_city_neighborhood_idx on public.listings (city, neighborhood);
create index listings_space_type_idx on public.listings (space_type);
create index listings_status_idx on public.listings (status);
create index listings_shifts_available_idx on public.listings using gin (shifts_available);
create index listing_events_listing_day_idx on public.listing_events (listing_id, day);

-- 5. Atualiza updated_at automaticamente
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_listings_updated_at
  before update on public.listings
  for each row
  execute function public.update_updated_at_column();

-- 6. Segurança por linha (RLS)
alter table public.listings enable row level security;
alter table public.listing_contacts enable row level security;
alter table public.listing_events enable row level security;

-- listings: qualquer pessoa vê anúncios ativos; o dono vê e gerencia os próprios.
create policy "Anúncios ativos são públicos"
  on public.listings for select
  to anon, authenticated
  using (status = 'active' or owner_id = (select auth.uid()));

create policy "Dono cria os próprios anúncios"
  on public.listings for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Dono edita os próprios anúncios"
  on public.listings for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Dono apaga os próprios anúncios"
  on public.listings for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- listing_contacts: só o dono do anúncio.
create policy "Dono gerencia o contato do anúncio"
  on public.listing_contacts for all
  to authenticated
  using (exists (
    select 1 from public.listings l
    where l.id = listing_id and l.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.listings l
    where l.id = listing_id and l.owner_id = (select auth.uid())
  ));

-- listing_events: o dono lê as métricas dos seus anúncios. Ninguém grava
-- direto; a gravação passa pelas funções abaixo.
create policy "Dono lê as métricas dos seus anúncios"
  on public.listing_events for select
  to authenticated
  using (exists (
    select 1 from public.listings l
    where l.id = listing_id and l.owner_id = (select auth.uid())
  ));

-- 7. Funções públicas de métricas e contato
create or replace function public.record_listing_view(p_listing_id uuid, p_visitor_id text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.listing_events (listing_id, kind, visitor_id)
  select l.id, 'view', p_visitor_id
  from public.listings l
  where l.id = p_listing_id and l.status = 'active'
  on conflict do nothing;
$$;

-- Devolve o WhatsApp só de anúncios ativos e registra o clique.
create or replace function public.get_listing_whatsapp(p_listing_id uuid, p_visitor_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_number text;
begin
  select c.whatsapp_number into v_number
  from public.listing_contacts c
  join public.listings l on l.id = c.listing_id
  where c.listing_id = p_listing_id and l.status = 'active';

  if v_number is not null then
    insert into public.listing_events (listing_id, kind, visitor_id)
    values (p_listing_id, 'whatsapp_click', p_visitor_id)
    on conflict do nothing;
  end if;

  return v_number;
end;
$$;

revoke execute on function public.record_listing_view(uuid, text) from public;
revoke execute on function public.get_listing_whatsapp(uuid, text) from public;
grant execute on function public.record_listing_view(uuid, text) to anon, authenticated;
grant execute on function public.get_listing_whatsapp(uuid, text) to anon, authenticated;
