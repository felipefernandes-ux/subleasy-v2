-- Subleasy 2.0: histórico de edições de anúncio já aprovado.
-- Quando o anunciante edita um anúncio publicado (ou pausado), ele volta para a revisão. Antes de gravar a edição,
-- o servidor guarda aqui a versão aprovada ("before"), para o Super Admin ver o que mudou: campos, fotos e descrição.
-- Na aprovação, a versão nova vai para "after" e a edição sai da fila. As fotos tiradas na edição só saem do Storage
-- na aprovação: até lá o admin precisa vê-las no "antes".
-- Sem política de leitura nem de escrita: só a service role (ações do servidor) acessa.

create table public.listing_revisions (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings(id) on delete cascade,
  -- Retrato da versão aprovada: campos do anúncio e o contato (WhatsApp, e-mail e endereço privado).
  before jsonb not null,
  -- Retrato da versão aprovada depois da edição. Fica vazio enquanto a edição espera revisão.
  after jsonb,
  submitted_at timestamp with time zone default now() not null,
  approved_at timestamp with time zone
);
alter table public.listing_revisions enable row level security;

-- No máximo uma edição esperando revisão por anúncio: devolver e reenviar continua comparando com a versão no ar.
create unique index listing_revisions_pending_idx on public.listing_revisions (listing_id) where approved_at is null;
create index listing_revisions_listing_idx on public.listing_revisions (listing_id, submitted_at desc);
