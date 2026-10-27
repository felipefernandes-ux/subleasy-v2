-- Subleasy 2.0 — painel do anunciante: contagem de favoritos
-- O RLS de favorite_items só deixa o dono da lista ler os próprios itens, então o
-- anunciante não consegue ver quantas vezes seu anúncio foi favoritado. Esta função
-- retorna apenas a contagem agregada — nunca expõe quem favoritou.
-- (Substituída por 20261026190000_painel_metricas.sql, que usa auth.uid().)

create or replace function public.owner_listing_favorites(p_user_id uuid)
returns table (listing_id uuid, favorites bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select fi.listing_id, count(*) as favorites
  from public.favorite_items fi
  join public.listings l on l.id = fi.listing_id
  where l.owner_id = p_user_id
  group by fi.listing_id;
$$;

revoke execute on function public.owner_listing_favorites(uuid) from public;
grant execute on function public.owner_listing_favorites(uuid) to authenticated;
