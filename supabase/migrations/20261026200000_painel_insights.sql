-- Subleasy 2.0 — painel do anunciante: favoritos por dia e insights dispensados

-- 1. Métricas por dia passam a incluir favoritos (kind = 'favorite'), para tendência e minigráfico.
create or replace function public.owner_daily_metrics(p_since date)
returns table (listing_id uuid, day date, kind text, total bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select e.listing_id, e.day, e.kind, count(*)
  from public.listing_events e
  join public.listings l on l.id = e.listing_id
  where l.owner_id = (select auth.uid()) and e.day >= p_since
  group by e.listing_id, e.day, e.kind
  union all
  select fi.listing_id, (fi.created_at at time zone 'America/Sao_Paulo')::date, 'favorite', count(*)
  from public.favorite_items fi
  join public.listings l on l.id = fi.listing_id
  where l.owner_id = (select auth.uid())
    and (fi.created_at at time zone 'America/Sao_Paulo')::date >= p_since
  group by fi.listing_id, (fi.created_at at time zone 'America/Sao_Paulo')::date;
$$;

-- 2. Insights que o anunciante dispensou. A chave identifica regra e anúncio
--    ("sem-contato:<id>"); o painel esconde a chave por 30 dias.
create table public.insight_dismissals (
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_key text not null check (char_length(insight_key) between 3 and 120),
  dismissed_at timestamp with time zone default now() not null,
  primary key (user_id, insight_key)
);

alter table public.insight_dismissals enable row level security;

create policy "Usuário lê os próprios insights dispensados"
  on public.insight_dismissals for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Usuário dispensa insights"
  on public.insight_dismissals for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Usuário atualiza o próprio registro"
  on public.insight_dismissals for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Usuário desfaz o dispensar"
  on public.insight_dismissals for delete to authenticated
  using (user_id = (select auth.uid()));
