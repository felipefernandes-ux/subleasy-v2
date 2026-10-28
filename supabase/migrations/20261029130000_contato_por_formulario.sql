-- Subleasy 2.0 — anúncio sem WhatsApp recebe contato só pelo formulário
-- Anúncios importados do WordPress podem não ter WhatsApp. Nesse caso a página some com o botão
-- do WhatsApp e mostra o formulário (nome, e-mail e mensagem). A mensagem chega por e-mail ao
-- anfitrião e fica na lista de contatos do painel dele.

-- 1. A página pública precisa saber se há WhatsApp sem ler o número (que fica fora da tabela pública).
--    A marca é mantida por trigger a partir de listing_contacts; a função de envio não confia nela.
alter table public.listings
  add column if not exists whatsapp_contact boolean not null default false;

update public.listings l
set whatsapp_contact = exists (
  select 1 from public.listing_contacts c
  where c.listing_id = l.id and c.whatsapp_number is not null
);

create or replace function public.sync_whatsapp_contact()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Em DELETE o registro new não existe; o CASE só lê o que se aplica.
  v_listing uuid := case when tg_op = 'DELETE' then old.listing_id else new.listing_id end;
begin
  update public.listings
  set whatsapp_contact = exists (
    select 1 from public.listing_contacts c
    where c.listing_id = v_listing and c.whatsapp_number is not null
  )
  where id = v_listing;
  return null;
end;
$$;

drop trigger if exists sync_whatsapp_contact on public.listing_contacts;
create trigger sync_whatsapp_contact
  after insert or update of whatsapp_number or delete on public.listing_contacts
  for each row execute function public.sync_whatsapp_contact();

-- 2. O contato passa a existir sem número: o admin guarda endereço e e-mail de um anúncio sem WhatsApp.
alter table public.listing_contacts alter column whatsapp_number drop not null;

-- 3. Destino da mensagem: o e-mail de contato do anúncio ou, se não houver, o e-mail da conta do dono.
--    Aceita a mensagem quando o anunciante liga o contato por e-mail ou quando o anúncio não tem WhatsApp.
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
  select coalesce(nullif(c.contact_email, ''), u.email::text) into v_email
  from public.listings l
  join auth.users u on u.id = l.owner_id
  left join public.listing_contacts c on c.listing_id = l.id
  where l.id = p_listing_id
    and l.status = 'active' and l.expires_at > now()
    and (l.email_contact or c.whatsapp_number is null);

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
