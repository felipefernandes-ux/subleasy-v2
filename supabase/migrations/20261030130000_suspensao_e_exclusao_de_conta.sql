-- Subleasy 2.0 — suspensão e exclusão de conta pelo Super Admin
-- 1. Excluir uma conta não apaga as estatísticas de saída de anúncios: a pesquisa de exclusão
--    (motivo, cidade, tipo, visitas e contatos) fica sem dono, anonimizada.
-- 2. Conta suspensa (banned_until no futuro) some das páginas públicas de perfil.

alter table public.listing_removals alter column owner_id drop not null;

alter table public.listing_removals drop constraint listing_removals_owner_id_fkey;
alter table public.listing_removals
  add constraint listing_removals_owner_id_fkey
  foreign key (owner_id) references auth.users (id) on delete set null;

-- Perfil público: sem linha para conta suspensa.
create or replace function public.public_profile(p_public_id text)
returns table (
  public_id text,
  public_name text,
  avatar_path text,
  bio text,
  member_since timestamp with time zone,
  roles text[],
  active_listings bigint,
  cities text[],
  identity_verified_at timestamp with time zone,
  show_whatsapp boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.public_id,
    public.public_name(p.display_name),
    p.avatar_path,
    p.bio,
    p.created_at,
    p.roles,
    count(l.id),
    coalesce(array_agg(distinct l.city order by l.city) filter (where l.id is not null), '{}'),
    p.identity_verified_at,
    p.show_whatsapp and count(l.id) > 0
  from public.profiles p
  left join public.listings l on l.owner_id = p.id and l.status = 'active' and l.expires_at > now()
  where p.public_id = p_public_id
    and not exists (select 1 from auth.users u where u.id = p.id and u.banned_until > now())
  group by p.id;
$$;

create or replace function public.public_profile_listings(p_public_id text)
returns table (
  slug text,
  title text,
  space_type text,
  neighborhood text,
  city text,
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
  select l.slug, l.title, l.space_type, l.neighborhood, l.city, l.price, l.billing_type, l.photos, l.photo_sizes
  from public.listings l
  join public.profiles p on p.id = l.owner_id
  where p.public_id = p_public_id and l.status = 'active' and l.expires_at > now()
    and not exists (select 1 from auth.users u where u.id = p.id and u.banned_until > now())
  order by l.published_at desc nulls last;
$$;

create or replace function public.get_profile_whatsapp(p_public_id text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.whatsapp_number::text
  from public.profiles p
  where p.public_id = p_public_id
    and p.show_whatsapp
    and not exists (select 1 from auth.users u where u.id = p.id and u.banned_until > now())
    and exists (
      select 1 from public.listings l
      where l.owner_id = p.id and l.status = 'active' and l.expires_at > now()
    );
$$;
