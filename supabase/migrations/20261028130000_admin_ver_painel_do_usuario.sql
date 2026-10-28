-- Subleasy 2.0 — Super Admin vê o painel de um usuário (só leitura)
-- As funções do painel (owner_*) leem os anúncios de auth.uid(). Estas são as mesmas consultas com
-- o dono por parâmetro, e só a service role pode chamá-las: o Super Admin as usa depois de
-- requireAdmin(). Nenhum usuário, nem o próprio dono, consegue chamá-las pelo navegador.

create function public.admin_owner_listing_favorites(p_owner uuid, p_since timestamp with time zone default null)
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
  where l.owner_id = p_owner
  group by fi.listing_id;
$$;

create function public.admin_owner_daily_metrics(p_owner uuid, p_since date)
returns table (listing_id uuid, day date, kind text, total bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select e.listing_id, e.day, e.kind, count(*)
  from public.listing_events e
  join public.listings l on l.id = e.listing_id
  where l.owner_id = p_owner and e.day >= p_since
  group by e.listing_id, e.day, e.kind
  union all
  select fi.listing_id, (fi.created_at at time zone 'America/Sao_Paulo')::date, 'favorite', count(*)
  from public.favorite_items fi
  join public.listings l on l.id = fi.listing_id
  where l.owner_id = p_owner
    and (fi.created_at at time zone 'America/Sao_Paulo')::date >= p_since
  group by fi.listing_id, (fi.created_at at time zone 'America/Sao_Paulo')::date;
$$;

create function public.admin_owner_contact_pattern(p_owner uuid, p_since date)
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
  where l.owner_id = p_owner
    and e.kind in ('whatsapp_click', 'email_click')
    and e.day >= p_since
  group by 1, 2;
$$;

revoke execute on function public.admin_owner_listing_favorites(uuid, timestamp with time zone) from public, anon, authenticated;
revoke execute on function public.admin_owner_daily_metrics(uuid, date) from public, anon, authenticated;
revoke execute on function public.admin_owner_contact_pattern(uuid, date) from public, anon, authenticated;
grant execute on function public.admin_owner_listing_favorites(uuid, timestamp with time zone) to service_role;
grant execute on function public.admin_owner_daily_metrics(uuid, date) to service_role;
grant execute on function public.admin_owner_contact_pattern(uuid, date) to service_role;
