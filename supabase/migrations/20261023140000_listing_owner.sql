-- Subleasy 2.0 — dados do anfitrião para a revisão do admin
-- profiles e auth.users não são legíveis pela API; esta função entrega só
-- nome, e-mail e WhatsApp do perfil do dono, e só para admins.

create or replace function public.listing_owner(p_listing_id uuid)
returns table (email text, display_name text, whatsapp_number text)
language sql
stable
security definer
set search_path = ''
as $$
  select u.email::text, p.display_name, p.whatsapp_number::text
  from public.listings l
  join auth.users u on u.id = l.owner_id
  left join public.profiles p on p.id = l.owner_id
  where l.id = p_listing_id and public.is_admin();
$$;

revoke execute on function public.listing_owner(uuid) from public;
grant execute on function public.listing_owner(uuid) to authenticated;
