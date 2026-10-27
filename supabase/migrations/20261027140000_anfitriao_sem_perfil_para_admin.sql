-- Subleasy 2.0 — anfitrião sem perfil, só para o admin
-- Os dez anúncios importados do WordPress têm dono (conta de login com o nome em
-- user_metadata.full_name), mas o dono só ganha perfil ao aceitar o convite e os Termos.
-- Até lá, listing_host não devolvia nada, e o admin não via o bloco do anunciante na prévia.
--
-- Agora, sem perfil, o admin recebe o nome vindo do metadado do login. Para qualquer outra
-- pessoa nada muda: sem perfil, a função continua devolvendo vazio. Nenhum perfil é criado,
-- então nenhum aceite de Termos é registrado em nome de quem ainda não entrou.
--
-- Retorno e permissões iguais aos de 20261026160000; por isso create or replace, sem drop.
-- Sem perfil, public_id vem nulo (não há página pública para linkar) e member_since é a
-- data da conta de login.

create or replace function public.listing_host(p_listing_id uuid)
returns table (
  public_id text,
  public_name text,
  avatar_path text,
  active_listings bigint,
  member_since timestamp with time zone,
  identity_verified_at timestamp with time zone
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.public_id,
    public.public_name(coalesce(p.display_name, nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''))),
    p.avatar_path,
    (
      select count(*)
      from public.listings o
      where o.owner_id = l.owner_id and o.status = 'active' and o.expires_at > now()
    ),
    coalesce(p.created_at, u.created_at),
    p.identity_verified_at
  from public.listings l
  join auth.users u on u.id = l.owner_id
  left join public.profiles p on p.id = l.owner_id
  where l.id = p_listing_id
    and ((l.status = 'active' and l.expires_at > now()) or l.owner_id = (select auth.uid()) or public.is_admin())
    -- Sem perfil, só o admin vê (o nome do metadado não é público).
    and (p.id is not null or public.is_admin())
    and coalesce(p.display_name, nullif(trim(u.raw_user_meta_data ->> 'full_name'), '')) is not null;
$$;

revoke execute on function public.listing_host(uuid) from public;
grant execute on function public.listing_host(uuid) to anon, authenticated;
