-- Subleasy 2.0 — Prospecção: cidade do prospect.
-- Texto livre, vindo da coluna "cidade" da planilha importada. Até aqui todos os prospects são de Maringá.

alter table public.prospects
  add column city text check (char_length(city) between 1 and 80);

create index prospects_city_idx on public.prospects (city);
