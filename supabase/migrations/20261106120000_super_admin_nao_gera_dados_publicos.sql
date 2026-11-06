-- Subleasy 2.0: Super Admin não gera dado no site público.
-- Visualização, clique no WhatsApp e mensagem do formulário feitos por um admin logado não entram
-- em listing_events nem em listing_inquiries. As métricas do anunciante e as campanhas pagas só
-- podem contar visitantes de verdade. A regra mora no banco: vale para qualquer tela ou rota que chame
-- estas funções. is_admin() lê o login da requisição; sem login (visitante anônimo) devolve false.

-- 1. Visualização: o admin vê a página normalmente, mas não conta.
create or replace function public.record_listing_view(p_listing_id uuid, p_visitor_id text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.listing_events (listing_id, kind, visitor_id)
  select l.id, 'view', p_visitor_id
  from public.listings l
  where l.id = p_listing_id and l.status = 'active' and l.expires_at > now()
    and not coalesce(public.is_admin(), false)
  on conflict do nothing;
$$;

-- 2. WhatsApp: o admin recebe o número (para testar o link), mas o clique não é gravado.
create or replace function public.get_listing_whatsapp(p_listing_id uuid, p_visitor_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_number text;
begin
  select c.whatsapp_number into v_number
  from public.listing_contacts c
  join public.listings l on l.id = c.listing_id
  where c.listing_id = p_listing_id and l.status = 'active' and l.expires_at > now();

  if v_number is not null and not coalesce(public.is_admin(), false) then
    insert into public.listing_events (listing_id, kind, visitor_id)
    values (p_listing_id, 'whatsapp_click', p_visitor_id)
    on conflict do nothing;
  end if;

  return v_number;
end;
$$;

-- 3. Formulário: o admin não envia mensagem. Devolve null, sem gravar a mensagem nem o evento,
--    e o anunciante não recebe e-mail.
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
  on conflict do nothing;

  return v_email;
end;
$$;
