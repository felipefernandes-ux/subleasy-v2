-- Subleasy 2.0 — todo anúncio mostra o bloco do anunciante
-- Os anúncios importados do WordPress têm dono (conta de login com o nome em
-- user_metadata.full_name), mas o dono só ganha perfil ao aceitar o convite. Até agora, sem
-- perfil, listing_host não devolvia nada para o público e a página ficava sem o bloco do anunciante.
--
-- Agora o bloco aparece em todo anúncio no ar. Sem perfil, o nome vem do metadado do login,
-- já abreviado por public_name (primeiro nome e inicial do sobrenome), e não há link para
-- perfil público (public_id nulo). Sem nome nenhum, aparece "Anunciante".
-- Nenhum perfil é criado, então nenhum aceite de Termos é registrado em nome de quem ainda não entrou.
--
-- Retorno e permissões iguais aos de 20261027140000; por isso create or replace, sem drop.

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
    public.public_name(coalesce(p.display_name, nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), 'Anunciante')),
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
    and ((l.status = 'active' and l.expires_at > now()) or l.owner_id = (select auth.uid()) or public.is_admin());
$$;

revoke execute on function public.listing_host(uuid) from public;
grant execute on function public.listing_host(uuid) to anon, authenticated;
