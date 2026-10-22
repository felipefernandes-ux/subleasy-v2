-- Subleasy 2.0 — busca semântica de anúncios
-- Embedding de 1536 dimensões gerado pelo text-embedding-3-small (OpenAI).

create extension if not exists vector with schema extensions;

alter table public.listings
  add column embedding extensions.vector(1536);

-- Índice HNSW para busca por similaridade de cosseno.
create index listings_embedding_idx on public.listings
  using hnsw (embedding extensions.vector_cosine_ops);
