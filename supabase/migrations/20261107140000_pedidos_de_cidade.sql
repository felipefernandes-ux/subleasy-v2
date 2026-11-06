-- Subleasy 2.0: pedidos de cidade ("Não encontrou a cidade que buscava?").
-- Quem busca sala numa cidade sem anúncio no ar pode registrar o pedido, com e-mail opcional para
-- ser avisado quando a primeira sala da cidade entrar. Alimenta o relatório "Cidades buscando anúncios"
-- do Super Admin. Sem política de leitura nem de escrita: só a service role (ações do servidor) acessa.

create table public.city_requests (
  id bigint generated always as identity primary key,
  -- Hash anônimo do visitante (cookie): uma pessoa conta uma vez por cidade.
  visitor_id text not null,
  city text not null check (char_length(city) between 2 and 80),
  -- Cidade sem acento e em minúsculas, para agrupar "Maringá", "maringa" e "MARINGÁ".
  city_key text not null,
  state char(2) not null check (state ~ '^[A-Z]{2}$'),
  space_type text,
  email text,
  -- De onde veio o pedido: o filtro de cidade ou a página de resultado sem salas.
  source text not null default 'filtro' check (source in ('filtro', 'sem_resultado')),
  requests smallint not null default 1,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  -- Preenchido quando o aviso "já tem sala na sua cidade" é enviado, para nunca repetir.
  notified_at timestamp with time zone,
  unique (visitor_id, city_key, state)
);
alter table public.city_requests enable row level security;
create index city_requests_city_idx on public.city_requests (city_key, state);
create index city_requests_waiting_idx on public.city_requests (city_key, state) where email is not null and notified_at is null;
