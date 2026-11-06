-- Subleasy 2.0: origem de cada contato (utm_*, gclid, fbclid).
-- Guarda de qual campanha veio o visitante que clicou no WhatsApp ou enviou a mensagem, para medir o
-- custo por contato da mídia paga. Fica numa tabela à parte, sem política de leitura: o dono do anúncio
-- lê listing_events, mas não vê de qual campanha cada visitante veio. Só o Super Admin lê, pela service role.

create table public.contact_attribution (
  event_id bigint primary key references public.listing_events(id) on delete cascade,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  gclid text,
  fbclid text,
  landing_path text,
  first_seen_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);
alter table public.contact_attribution enable row level security;

-- Grava a origem de um evento. Interna: só as funções abaixo a chamam. Corta cada valor em 200 caracteres.
create or replace function public.save_contact_attribution(p_event_id bigint, p_attribution jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.contact_attribution
    (event_id, utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, fbclid, landing_path, first_seen_at)
  select
    p_event_id,
    left(p_attribution->>'utm_source', 200),
    left(p_attribution->>'utm_medium', 200),
    left(p_attribution->>'utm_campaign', 200),
    left(p_attribution->>'utm_term', 200),
    left(p_attribution->>'utm_content', 200),
    left(p_attribution->>'gclid', 200),
    left(p_attribution->>'fbclid', 200),
    left(p_attribution->>'landing_path', 200),
    case when (p_attribution->>'first_seen') ~ '^\d{4}-\d{2}-\d{2}T[0-9:.]+Z$' then (p_attribution->>'first_seen')::timestamptz end
  where p_event_id is not null and jsonb_typeof(p_attribution) = 'object'
  on conflict do nothing;
$$;
revoke execute on function public.save_contact_attribution(bigint, jsonb) from public, anon, authenticated;

-- WhatsApp: mesma regra de antes (o admin não conta), agora com a origem.
drop function if exists public.get_listing_whatsapp(uuid, text);
create or replace function public.get_listing_whatsapp(p_listing_id uuid, p_visitor_id text, p_attribution jsonb default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_number text;
  v_event bigint;
begin
  select c.whatsapp_number into v_number
  from public.listing_contacts c
  join public.listings l on l.id = c.listing_id
  where c.listing_id = p_listing_id and l.status = 'active' and l.expires_at > now();

  if v_number is not null and not coalesce(public.is_admin(), false) then
    insert into public.listing_events (listing_id, kind, visitor_id)
    values (p_listing_id, 'whatsapp_click', p_visitor_id)
    on conflict do nothing
    returning id into v_event;
    perform public.save_contact_attribution(v_event, p_attribution);
  end if;

  return v_number;
end;
$$;
revoke execute on function public.get_listing_whatsapp(uuid, text, jsonb) from public;
grant execute on function public.get_listing_whatsapp(uuid, text, jsonb) to anon, authenticated;

-- Formulário: mesma regra de antes (o admin não envia), agora com a origem.
drop function if exists public.submit_listing_inquiry(uuid, text, text, text, text, text);
create or replace function public.submit_listing_inquiry(
  p_listing_id uuid,
  p_visitor_id text,
  p_name text,
  p_email text,
  p_phone text,
  p_message text,
  p_attribution jsonb default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_event bigint;
begin
  if coalesce(public.is_admin(), false) then
    return null;
  end if;

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
  on conflict do nothing
  returning id into v_event;
  perform public.save_contact_attribution(v_event, p_attribution);

  return v_email;
end;
$$;
revoke execute on function public.submit_listing_inquiry(uuid, text, text, text, text, text, jsonb) from public;
grant execute on function public.submit_listing_inquiry(uuid, text, text, text, text, text, jsonb) to anon, authenticated;
