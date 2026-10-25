-- Subleasy 2.0 — prazo dos anúncios
-- Cada anúncio fica no ar por 30 dias a partir da aprovação. Depois, sai da busca
-- e para de receber contatos até ser renovado. Substitui o ciclo de confirmação
-- (last_confirmed_at, confirmation_interval_days), que fica sem uso.

-- 1. Fim do prazo. Os anúncios já aprovados ganham 30 dias a partir da publicação.
alter table public.listings add column expires_at timestamp with time zone;

update public.listings
set expires_at = published_at + interval '30 days'
where published_at is not null;

create index listings_expires_at_idx on public.listings (expires_at);

-- 2. Público só vê anúncio no ar e dentro do prazo. O dono continua vendo os seus.
drop policy "Anúncios ativos são públicos" on public.listings;

create policy "Anúncios no ar e no prazo são públicos"
  on public.listings for select
  to anon, authenticated
  using ((status = 'active' and expires_at > now()) or owner_id = (select auth.uid()));

-- 3. Visualização e WhatsApp só contam para anúncio dentro do prazo.
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
  on conflict do nothing;
$$;

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

  if v_number is not null then
    insert into public.listing_events (listing_id, kind, visitor_id)
    values (p_listing_id, 'whatsapp_click', p_visitor_id)
    on conflict do nothing;
  end if;

  return v_number;
end;
$$;

-- 4. Trava: o dono não mexe no prazo direto pela API. Só a função renew_listing
--    (ou um admin) muda expires_at. É o que vai sustentar a renovação paga.
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

  if (tg_op = 'INSERT' and new.expires_at is not null)
     or (tg_op = 'UPDATE' and new.expires_at is distinct from old.expires_at
         and coalesce(current_setting('subleasy.renewing', true), '') <> 'on') then
    raise exception 'O prazo só muda pela renovação' using errcode = '42501';
  end if;

  return new;
end;
$$;

-- 5. Renovação grátis: mais 30 dias, contados do fim do prazo atual (ou de hoje,
--    se já expirou). Renovar antes do fim não faz perder dias.
create or replace function public.renew_listing(p_listing_id uuid)
returns timestamp with time zone
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_expires timestamp with time zone;
begin
  perform set_config('subleasy.renewing', 'on', true);

  update public.listings
  set expires_at = greatest(coalesce(expires_at, now()), now()) + interval '30 days'
  where id = p_listing_id
    and owner_id = (select auth.uid())
    and status in ('active', 'paused')
    and published_at is not null
  returning expires_at into v_expires;

  perform set_config('subleasy.renewing', 'off', true);
  return v_expires;
end;
$$;

revoke execute on function public.renew_listing(uuid) from public;
grant execute on function public.renew_listing(uuid) to authenticated;
