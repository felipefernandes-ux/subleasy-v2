-- Subleasy 2.0 — mensagens pelo formulário e pesquisa de exclusão
-- O contato por e-mail vira um formulário: a mensagem fica guardada para o anfitrião
-- ver no painel e chega por e-mail para ele. Ao excluir um anúncio publicado, o
-- anfitrião conta o motivo, para o super admin medir a performance do site.

-- 1. Mensagens recebidas. Só o dono do anúncio (e o admin) leem; ninguém grava direto.
create table public.listing_inquiries (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid not null references public.listings(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (char_length(phone) <= 30),
  message text not null check (char_length(message) between 10 and 2000),
  created_at timestamp with time zone default now() not null
);
create index listing_inquiries_listing_idx on public.listing_inquiries (listing_id, created_at desc);
alter table public.listing_inquiries enable row level security;

create policy "Dono lê as mensagens dos seus anúncios"
  on public.listing_inquiries for select
  to authenticated
  using (exists (
    select 1 from public.listings l
    where l.id = listing_id and l.owner_id = (select auth.uid())
  ));

create policy "Admin lê todas as mensagens"
  on public.listing_inquiries for select
  to authenticated
  using ((select public.is_admin()));

-- 2. Recebe a mensagem de um anúncio no ar e no prazo, conta como contato e devolve
--    o e-mail do anfitrião para o servidor avisá-lo. O endereço não vai ao navegador.
create or replace function public.submit_listing_inquiry(
  p_listing_id uuid,
  p_visitor_id text,
  p_name text,
  p_email text,
  p_phone text,
  p_message text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
begin
  select c.contact_email into v_email
  from public.listing_contacts c
  join public.listings l on l.id = c.listing_id
  where c.listing_id = p_listing_id and l.status = 'active' and l.expires_at > now() and l.email_contact;

  if v_email is null then
    return null;
  end if;

  insert into public.listing_inquiries (listing_id, name, email, phone, message)
  values (p_listing_id, p_name, p_email, nullif(p_phone, ''), p_message);

  insert into public.listing_events (listing_id, kind, visitor_id)
  values (p_listing_id, 'email_click', p_visitor_id)
  on conflict do nothing;

  return v_email;
end;
$$;

revoke execute on function public.submit_listing_inquiry(uuid, text, text, text, text, text) from public;
grant execute on function public.submit_listing_inquiry(uuid, text, text, text, text, text) to anon, authenticated;

-- O e-mail não é mais revelado no clique: sai a função antiga.
drop function public.get_listing_email(uuid, text);

-- 3. Pesquisa de exclusão. Guarda um retrato do anúncio, que deixa de existir.
create table public.listing_removals (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  space_type text not null,
  city text not null,
  state text not null,
  status text not null,
  published_at timestamp with time zone,
  reason text not null check (reason in ('alugado', 'indisponivel', 'sem_procura', 'outra_plataforma', 'outro')),
  rented_via_subleasy text check (rented_via_subleasy in ('sim', 'nao', 'nao_sei')),
  comment text check (char_length(comment) <= 1000),
  views integer not null default 0,
  contacts integer not null default 0,
  removed_at timestamp with time zone default now() not null
);
alter table public.listing_removals enable row level security;

create policy "Dono registra a exclusão dos seus anúncios"
  on public.listing_removals for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Admin lê as exclusões"
  on public.listing_removals for select
  to authenticated
  using ((select public.is_admin()));
