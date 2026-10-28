-- Subleasy 2.0 — acompanhamento do convite da campanha de lançamento
-- Uma linha por pessoa e campanha: clicou no link do e-mail (clicked_at) e confirmou que quer
-- participar (interested_at). Os dois passos são separados porque leitores de link de alguns
-- provedores abrem o endereço sozinhos; só a confirmação conta como interesse.
-- Só o service role lê e grava: RLS ligado e nenhuma policy.

create table public.campaign_invites (
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign text not null default 'convite-2-0',
  clicked_at timestamp with time zone,
  interested_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  primary key (user_id, campaign)
);

create trigger update_campaign_invites_updated_at
  before update on public.campaign_invites
  for each row
  execute function public.update_updated_at_column();

alter table public.campaign_invites enable row level security;
