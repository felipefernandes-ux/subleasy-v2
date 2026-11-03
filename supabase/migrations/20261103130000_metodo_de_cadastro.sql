-- Como a pessoa cadastrou o anúncio, registrado sem perguntar nada a ela:
--   'ia'            descreveu a sala em texto livre (/anunciar/ia) e a IA montou o rascunho;
--   'campo_a_campo' preencheu o passo a passo (/anunciar) do começo.
-- Fica null em anúncio importado e em anúncio criado antes desta coluna. Serve para comparar os dois
-- caminhos (conversão, tempo até aprovar, nota de facilidade) e para escolher quem recebe a pesquisa
-- de feedback do primeiro anúncio.
alter table public.listings
  add column creation_method text
  check (creation_method in ('ia', 'campo_a_campo'));

comment on column public.listings.creation_method is
  'Caminho do cadastro: ia (texto livre) ou campo_a_campo (passo a passo). Null: importado ou anterior à coluna.';
