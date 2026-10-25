-- Subleasy 2.0 — contato por e-mail
-- O WhatsApp continua sendo o contato principal. O e-mail é uma segunda opção e,
-- como o número, fica fora da tabela pública: só sai pela função, no clique.

alter table public.listing_contacts
  add column contact_email text check (contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- Diz à página pública se mostra o botão de e-mail, sem expor o endereço.
alter table public.listings
  add column email_contact boolean not null default false;

-- Clique no e-mail entra nas métricas do anfitrião.
alter table public.listing_events drop constraint listing_events_kind_check;
alter table public.listing_events add constraint listing_events_kind_check
  check (kind in ('view', 'whatsapp_click', 'email_click'));

-- Devolve o e-mail só de anúncio no ar e no prazo, e registra o clique.
create or replace function public.get_listing_email(p_listing_id uuid, p_visitor_id text)
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

  if v_email is not null then
    insert into public.listing_events (listing_id, kind, visitor_id)
    values (p_listing_id, 'email_click', p_visitor_id)
    on conflict do nothing;
  end if;

  return v_email;
end;
$$;

revoke execute on function public.get_listing_email(uuid, text) from public;
grant execute on function public.get_listing_email(uuid, text) to anon, authenticated;
