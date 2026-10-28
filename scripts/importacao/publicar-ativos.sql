-- Publica os anúncios que estavam ativos no WordPress no dia da exportação (listing_imports.wp_status = 'active').
-- Entram no ar por 30 dias a partir de agora (o prazo começa na migração, não na data original).
-- Não envia e-mail: o aviso ao anunciante vai pela campanha do Brevo.
-- Uso: supabase db query --linked -f scripts/importacao/publicar-ativos.sql
-- O trigger guard_listing_status só deixa um admin logado publicar, então ele é desligado só durante este UPDATE.
begin;

alter table public.listings disable trigger guard_listing_status;

update public.listings l
set status = 'active',
    published_at = now(),
    expires_at = now() + interval '30 days'
from public.listing_imports i
where i.listing_id = l.id
  and i.wp_status = 'active'
  and l.status = 'draft'
  and l.published_at is null;

alter table public.listings enable trigger guard_listing_status;

commit;

select i.source_id, l.slug, l.status, l.published_at, l.expires_at
from public.listing_imports i
join public.listings l on l.id = i.listing_id
where i.wp_status = 'active'
order by i.source_id;
