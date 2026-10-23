-- Subleasy 2.0 — revisão, aprovação e fotos dos anúncios
-- Fluxo: rascunho (draft) → em análise (pending_approval) → no ar (active).
-- Só um admin coloca um anúncio no ar pela primeira vez.

-- 1. Admins. Sem políticas: ninguém lê a tabela pela API; o acesso é pela função.
--    Para tornar alguém admin, rode no SQL Editor:
--    insert into public.admin_users (user_id) select id from auth.users where email = '...';
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now() not null
);
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 2. Datas do fluxo e o recado do admin quando o anúncio volta para ajustes.
alter table public.listings
  add column submitted_at timestamp with time zone,
  add column published_at timestamp with time zone,
  add column review_note text check (char_length(review_note) <= 1000);

-- 3. Admin lê e edita qualquer anúncio e lê o contato (para conferir antes de aprovar).
create policy "Admin lê todos os anúncios"
  on public.listings for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admin edita todos os anúncios"
  on public.listings for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admin lê o contato dos anúncios"
  on public.listing_contacts for select
  to authenticated
  using ((select public.is_admin()));

-- 4. Trava: o dono não publica sozinho. Ele só envia para análise, pausa ou
--    reativa um anúncio que já foi aprovado antes.
create or replace function public.guard_listing_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' and new.status <> 'draft' then
    raise exception 'Novo anúncio começa como rascunho' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and new.status = 'active' and old.status <> 'active'
     and not (old.status = 'paused' and old.published_at is not null) then
    raise exception 'Só a equipe do Subleasy publica um anúncio novo' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and (new.published_at is distinct from old.published_at
     or new.review_note is distinct from old.review_note) then
    raise exception 'Campo reservado à revisão' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger guard_listing_status
  before insert or update on public.listings
  for each row
  execute function public.guard_listing_status();

-- 5. Fotos: bucket público para leitura; cada usuário grava só na própria pasta
--    (listing-photos/<user_id>/<arquivo>).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Usuário envia fotos para a própria pasta"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Usuário apaga fotos da própria pasta"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
