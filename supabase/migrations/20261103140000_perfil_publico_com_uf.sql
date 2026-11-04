-- As listagens mostram "Cidade, UF" no lugar do bairro (como o Marketplace do Facebook). O perfil público
-- lia os anúncios por esta função, que não devolvia o UF. Troca só as colunas devolvidas (acrescenta state);
-- o filtro continua o da migração de suspensão de conta: anúncio no ar, não vencido, dono não suspenso.
-- Mudar as colunas de retorno exige recriar a função, então os grants voltam como na migração do perfil público.
drop function public.public_profile_listings(text);

create function public.public_profile_listings(p_public_id text)
returns table (
  slug text,
  title text,
  space_type text,
  neighborhood text,
  city text,
  state text,
  price numeric,
  billing_type text,
  photos text[],
  photo_sizes jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.slug, l.title, l.space_type, l.neighborhood, l.city, l.state, l.price, l.billing_type, l.photos, l.photo_sizes
  from public.listings l
  join public.profiles p on p.id = l.owner_id
  where p.public_id = p_public_id and l.status = 'active' and l.expires_at > now()
    and not exists (select 1 from auth.users u where u.id = p.id and u.banned_until > now())
  order by l.published_at desc nulls last;
$$;

revoke execute on function public.public_profile_listings(text) from public;
grant execute on function public.public_profile_listings(text) to anon, authenticated;
