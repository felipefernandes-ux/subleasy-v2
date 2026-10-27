-- Subleasy 2.0 — perfil público de cada usuário
-- Todo cadastro ganha uma página pública em /u/<public_id>. A tabela profiles
-- continua privada: a página lê só o que as funções abaixo entregam (nome público,
-- foto, bio, data de entrada, papéis, verificações e, para anunciantes, os anúncios
-- no ar). O WhatsApp só sai com consentimento, no clique.
-- Pesquisa e base legal: docs/reports/Verificação e perfil público de anfitriões.md

-- 1. Campos novos no perfil
alter table public.profiles
  -- ID da URL pública. Aleatório e sem relação com o login, para não expor o id da conta.
  add column public_id text not null unique
    default left(replace(gen_random_uuid()::text, '-', ''), 12)
    check (public_id ~ '^[a-f0-9]{12}$'),
  -- Papéis na plataforma. Hoje só "anunciante"; "cliente" fica reservado para
  -- agendamento ou locação online. Marcados pelo sistema, nunca pelo próprio usuário.
  add column roles text[] not null default '{}'
    check (roles <@ array['anunciante', 'cliente']::text[]),
  -- Foto opcional, em listing-photos/<usuário>/perfil/.
  add column avatar_path text check (char_length(avatar_path) <= 300),
  -- Apresentação opcional. Sem telefone, e-mail ou link (validado no servidor).
  add column bio text check (char_length(bio) <= 400),
  -- Consentimento para mostrar o WhatsApp a qualquer visitante do perfil (LGPD, art. 7º, I e art. 8º).
  -- Desligado por padrão; o histórico fica em consent_events.
  add column show_whatsapp boolean not null default false,
  add column show_whatsapp_at timestamp with time zone,
  -- Preenchido só pela equipe, depois de conferir documento e selfie. A imagem não fica guardada.
  add column identity_verified_at timestamp with time zone;

-- Quem já criou anúncio é anunciante.
update public.profiles p
set roles = array['anunciante']
where exists (select 1 from public.listings l where l.owner_id = p.id);

-- 2. O próprio usuário não altera id público, papéis nem data de verificação.
--    Pela API, só admin muda esses campos; o painel do Supabase (postgres/service_role) também pode.
create or replace function public.guard_profile_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;
  new.public_id := old.public_id;
  new.roles := old.roles;
  new.identity_verified_at := old.identity_verified_at;
  return new;
end;
$$;

create trigger guard_profile_fields
  before update on public.profiles
  for each row
  execute function public.guard_profile_fields();

-- 3. O primeiro anúncio torna o usuário anunciante. Roda como dono da função,
--    para passar pela trava acima.
create or replace function public.mark_advertiser()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set roles = array_append(roles, 'anunciante')
  where id = new.owner_id and not ('anunciante' = any(roles));
  return new;
end;
$$;

create trigger mark_advertiser
  after insert on public.listings
  for each row
  execute function public.mark_advertiser();

-- 4. Registro de consentimentos (prova exigida pelo art. 8º, §2º). Só cresce: sem update nem delete.
create table public.consent_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null check (purpose in ('show_whatsapp_profile')),
  granted boolean not null,
  -- Onde a pessoa decidiu: no cadastro ou nas configurações.
  channel text not null check (channel in ('cadastro', 'configuracoes')),
  -- Versão do texto que a pessoa leu (src/lib/public-profile.ts).
  text_version text not null,
  ip inet,
  user_agent text check (char_length(user_agent) <= 400),
  created_at timestamp with time zone default now() not null
);

create index consent_events_user_idx on public.consent_events (user_id, created_at desc);

alter table public.consent_events enable row level security;

create policy "Usuário registra o próprio consentimento"
  on public.consent_events for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Usuário lê os próprios consentimentos"
  on public.consent_events for select
  to authenticated
  using (user_id = (select auth.uid()));

-- 5. Nome público: primeiro nome e inicial do último ("Felipe Fernandes" vira "Felipe F.").
create or replace function public.public_name(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when position(' ' in trim(p_name)) = 0 then trim(p_name)
    else split_part(trim(p_name), ' ', 1) || ' ' || upper(left(regexp_replace(trim(p_name), '^.*\s', ''), 1)) || '.'
  end;
$$;

-- 6. Perfil público de qualquer usuário. Anúncios, cidades e WhatsApp só contam para anunciantes
--    com anúncio no ar.
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
  group by p.id;
$$;

revoke execute on function public.public_profile(text) from public;
grant execute on function public.public_profile(text) to anon, authenticated;

-- 7. Anúncios no ar do usuário, com os campos do cartão.
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
  order by l.published_at desc nulls last;
$$;

revoke execute on function public.public_profile_listings(text) from public;
grant execute on function public.public_profile_listings(text) to anon, authenticated;

-- 8. WhatsApp do perfil: só com consentimento ligado e anúncio no ar, e só no clique
--    (o número não vai no HTML da página).
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
    and exists (
      select 1 from public.listings l
      where l.owner_id = p.id and l.status = 'active' and l.expires_at > now()
    );
$$;

revoke execute on function public.get_profile_whatsapp(text) from public;
grant execute on function public.get_profile_whatsapp(text) to anon, authenticated;

-- 9. O bloco do anunciante na página da sala passa a levar ao perfil pelo id público,
--    e ganha a foto e a verificação. Muda o retorno, então a função é recriada.
drop function public.listing_host(uuid);

create function public.listing_host(p_listing_id uuid)
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
    public.public_name(p.display_name),
    p.avatar_path,
    (
      select count(*)
      from public.listings o
      where o.owner_id = l.owner_id and o.status = 'active' and o.expires_at > now()
    ),
    p.created_at,
    p.identity_verified_at
  from public.listings l
  join public.profiles p on p.id = l.owner_id
  where l.id = p_listing_id
    and ((l.status = 'active' and l.expires_at > now()) or l.owner_id = (select auth.uid()) or public.is_admin());
$$;

revoke execute on function public.listing_host(uuid) from public;
grant execute on function public.listing_host(uuid) to anon, authenticated;
