-- Largura e altura de cada foto do anúncio: {"<caminho no Storage>": [largura, altura]}.
-- Serve para exibir fotos verticais inteiras (sem corte) e para medir, mais tarde,
-- se a orientação das fotos muda os cliques no WhatsApp.
alter table public.listings
  add column photo_sizes jsonb not null default '{}'::jsonb
    check (jsonb_typeof(photo_sizes) = 'object');
