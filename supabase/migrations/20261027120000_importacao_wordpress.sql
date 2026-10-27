-- Subleasy 2.0 — origem dos anúncios importados do WordPress
-- Guarda a chave estável de cada anúncio importado (source_id), para que uma nova
-- exportação atualize o que já entrou sem duplicar, e para montar os 301 das URLs antigas.
-- Só o service role lê e grava: RLS ligado e nenhuma policy.

create table public.listing_imports (
  source_id text primary key check (source_id ~ '^wp-[0-9]+$'),
  listing_id uuid not null unique references public.listings(id) on delete cascade,
  source_url text not null,
  source_slug text, -- post_name do WordPress, base do 301
  source_status text not null,
  wp_status text not null, -- status do arquivo de exportação (active, expired...)
  extras jsonb not null default '{}'::jsonb, -- área, capacidade etc., sem coluna no 2.0
  imported_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create trigger update_listing_imports_updated_at
  before update on public.listing_imports
  for each row
  execute function public.update_updated_at_column();

alter table public.listing_imports enable row level security;
