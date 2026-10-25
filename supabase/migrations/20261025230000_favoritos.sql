-- Subleasy 2.0 — favoritos
-- Quem procura sala salva anúncios em listas com nome ("Zona 7", "Opções para março").
-- Só o dono vê e mexe nas próprias listas.

create table public.favorite_lists (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 50),
  created_at timestamp with time zone default now() not null
);
create index favorite_lists_owner_idx on public.favorite_lists (owner_id, created_at desc);

create table public.favorite_items (
  list_id uuid not null references public.favorite_lists(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamp with time zone default now() not null,
  primary key (list_id, listing_id)
);
create index favorite_items_listing_idx on public.favorite_items (listing_id);

alter table public.favorite_lists enable row level security;
alter table public.favorite_items enable row level security;

create policy "Dono gerencia as próprias listas"
  on public.favorite_lists for all
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Dono gerencia os itens das próprias listas"
  on public.favorite_items for all
  to authenticated
  using (exists (
    select 1 from public.favorite_lists f
    where f.id = list_id and f.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.favorite_lists f
    where f.id = list_id and f.owner_id = (select auth.uid())
  ));
