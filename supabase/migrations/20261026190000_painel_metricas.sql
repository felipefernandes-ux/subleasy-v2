-- Subleasy 2.0 — painel do anunciante: métricas agregadas
-- As três funções leem só os anúncios de quem está logado (auth.uid()) e devolvem
-- contagens, nunca quem visitou, favoritou ou chamou. O RLS de favorite_items não
-- deixa o anunciante ler favoritos de outras pessoas, por isso security definer.

-- Substitui a versão anterior (que recebia o id do usuário por parâmetro).
drop function if exists public.owner_listing_favorites(uuid);

-- 1. Favoritos por anúncio: total e dentro do período.
create function public.owner_listing_favorites(p_since timestamp with time zone default null)
returns table (listing_id uuid, total bigint, since_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    fi.listing_id,
    count(*),
    count(*) filter (where p_since is not null and fi.created_at >= p_since)
  from public.favorite_items fi
  join public.listings l on l.id = fi.listing_id
  where l.owner_id = (select auth.uid())
  group by fi.listing_id;
$$;

-- 2. Visitas e contatos por anúncio, por dia (um evento por visitante por dia).
create function public.owner_daily_metrics(p_since date)
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
  group by e.listing_id, e.day, e.kind;
$$;

-- 3. Quando as pessoas entram em contato: dia da semana (0 = domingo) e hora, no fuso de São Paulo.
create function public.owner_contact_pattern(p_since date)
returns table (dow integer, hour integer, total bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    extract(dow from e.created_at at time zone 'America/Sao_Paulo')::integer,
    extract(hour from e.created_at at time zone 'America/Sao_Paulo')::integer,
    count(*)
  from public.listing_events e
  join public.listings l on l.id = e.listing_id
  where l.owner_id = (select auth.uid())
    and e.kind in ('whatsapp_click', 'email_click')
    and e.day >= p_since
  group by 1, 2;
$$;

revoke execute on function public.owner_listing_favorites(timestamp with time zone) from public;
revoke execute on function public.owner_daily_metrics(date) from public;
revoke execute on function public.owner_contact_pattern(date) from public;
grant execute on function public.owner_listing_favorites(timestamp with time zone) to authenticated;
grant execute on function public.owner_daily_metrics(date) to authenticated;
grant execute on function public.owner_contact_pattern(date) to authenticated;
