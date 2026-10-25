-- Subleasy 2.0 — anfitrião na página pública do anúncio
-- O perfil é privado (nome completo e WhatsApp). A página pública mostra só o
-- primeiro nome, quantos anúncios no ar ele tem e desde quando está no Subleasy.

create or replace function public.listing_host(p_listing_id uuid)
returns table (host_id uuid, first_name text, active_listings bigint, member_since timestamp with time zone)
language sql
stable
security definer
set search_path = ''
as $$
  select
    l.owner_id,
    split_part(trim(p.display_name), ' ', 1),
    (
      select count(*)
      from public.listings o
      where o.owner_id = l.owner_id and o.status = 'active' and o.expires_at > now()
    ),
    p.created_at
  from public.listings l
  join public.profiles p on p.id = l.owner_id
  where l.id = p_listing_id
    and ((l.status = 'active' and l.expires_at > now()) or l.owner_id = (select auth.uid()) or public.is_admin());
$$;

revoke execute on function public.listing_host(uuid) from public;
grant execute on function public.listing_host(uuid) to anon, authenticated;
