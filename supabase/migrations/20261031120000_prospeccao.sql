-- Subleasy 2.0 — Prospecção: contatos frios (clínicas e centros médicos) e prévias de anúncio por link
-- Fluxo: o admin importa a planilha, cria uma prévia do anúncio para o prospect e envia o link pelo WhatsApp.
-- As prévias ficam em tabelas próprias, nunca em public.listings: assim nenhuma busca, sitemap, e-mail
-- ou contagem do site as enxerga. Quem abre o link vê a prévia e pode pedir o anúncio; publicar continua
-- sendo o fluxo normal (conta, fotos reais, revisão do admin).
-- Só o service role lê e grava: RLS ligado e nenhuma policy.

-- 1. Prospects: um por local. place_id (Google Places) evita duplicar na reimportação.
create table public.prospects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,

  place_id text unique,
  name text not null check (char_length(name) between 1 and 200),
  address text,
  phone text,
  -- Só dígitos, com 55 na frente (ex.: 5544997571999). Nulo quando o local não tem WhatsApp conhecido.
  whatsapp_number text check (whatsapp_number ~ '^[0-9]{12,13}$'),
  instagram text,
  website text,
  email text,
  priority smallint,

  -- Modelo da primeira mensagem: A (centro médico), B (clínica ou consultório).
  message_model text check (message_model in ('A', 'B')),
  -- Como chamar a pessoa ("Dra. Ana") e o destinatário do modelo A ("do Centro Médico do Bosque").
  treatment text,
  recipient text,
  specialty text check (specialty in ('odonto', 'psi', 'est', 'med', 'fisio', 'centro')),
  link_note text,

  status text not null default 'novo' check (status in (
    'novo', 'mensagem_enviada', 'previa_enviada', 'respondeu', 'quer_anuncio',
    'dados_enviados', 'publicado', 'sem_resposta', 'nao_contatar'
  )),
  touches smallint not null default 0,
  last_contact_at timestamp with time zone,
  notes text check (char_length(notes) <= 2000),
  source text
);

create index prospects_status_idx on public.prospects (status);
create index prospects_priority_idx on public.prospects (priority);

create trigger update_prospects_updated_at
  before update on public.prospects
  for each row
  execute function public.update_updated_at_column();

-- 2. Prévia do anúncio: no máximo uma por prospect. O token do link é sorteado e fica aqui,
--    então dá para revogar ou deixar vencer. Preço e turnos ficam "a definir" até o anfitrião preencher.
create table public.prospect_previews (
  prospect_id uuid primary key references public.prospects(id) on delete cascade,
  token text not null unique check (char_length(token) >= 20),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,

  title text not null check (char_length(title) between 10 and 70),
  short_summary text check (char_length(short_summary) <= 120),
  description text,
  space_type text not null,
  neighborhood text not null,
  city text not null,
  state char(2) not null check (state ~ '^[A-Z]{2}$'),
  amenities text[] not null default '{}',
  generated_by text not null default 'template' check (generated_by in ('ia', 'template', 'admin')),

  expires_at timestamp with time zone not null,
  revoked_at timestamp with time zone,
  -- Visitas reais: leitores de link (WhatsApp, Instagram) não executam o script que conta.
  view_count integer not null default 0,
  first_viewed_at timestamp with time zone,
  last_viewed_at timestamp with time zone
);

create trigger update_prospect_previews_updated_at
  before update on public.prospect_previews
  for each row
  execute function public.update_updated_at_column();

-- 3. Linha do tempo do prospect: o que o admin fez e o que o contato fez.
create table public.prospect_events (
  id bigint generated always as identity primary key,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  kind text not null check (kind in (
    'imported', 'status_changed', 'whatsapp_opened', 'message_copied', 'preview_created',
    'preview_viewed', 'claim_requested', 'opted_out', 'note'
  )),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default now() not null
);

create index prospect_events_prospect_idx on public.prospect_events (prospect_id, created_at desc);

-- 4. Pedido do anúncio pela prévia ("Quero esse anúncio grátis"). Não cria conta nem publica nada:
--    o admin confere se a pessoa é mesmo do local e segue o fluxo normal de anúncio.
create table public.prospect_claims (
  id uuid default gen_random_uuid() primary key,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  created_at timestamp with time zone default now() not null,
  contact_name text not null check (char_length(contact_name) between 2 and 120),
  contact_email text not null check (char_length(contact_email) between 5 and 200),
  contact_phone text not null check (char_length(contact_phone) between 8 and 30),
  handled_at timestamp with time zone
);

create index prospect_claims_prospect_idx on public.prospect_claims (prospect_id, created_at desc);

alter table public.prospects enable row level security;
alter table public.prospect_previews enable row level security;
alter table public.prospect_events enable row level security;
alter table public.prospect_claims enable row level security;
