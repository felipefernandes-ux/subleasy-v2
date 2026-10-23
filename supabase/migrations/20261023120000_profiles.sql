-- Subleasy 2.0 — perfil do usuário (cadastro após o primeiro login)
-- Mínimo pela LGPD: nome, WhatsApp, aceite dos termos e escolha de marketing.
-- Sem CPF: só entra quando houver cobrança (plano Pro) ou pagamento (fase 4).

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,

  -- Nome exibido no anúncio como anfitrião (pode ser o nome da clínica).
  display_name text not null check (char_length(display_name) between 2 and 80),

  -- WhatsApp padrão dos anúncios. Privado: só o dono lê.
  whatsapp_number varchar(20) not null check (whatsapp_number ~ '^\+?[0-9]{10,15}$'),

  -- Prova do aceite: versão dos Termos/Política (src/lib/legal.ts) e quando.
  terms_version text not null,
  terms_accepted_at timestamp with time zone not null,

  -- Consentimento separado para novidades por e-mail (desmarcado por padrão).
  marketing_opt_in boolean not null default false,
  marketing_opt_in_at timestamp with time zone
);

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at_column();

alter table public.profiles enable row level security;

-- Só o próprio usuário lê, cria e edita o perfil. A exclusão vem em cascata
-- quando a conta é apagada em auth.users.
create policy "Usuário lê o próprio perfil"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Usuário cria o próprio perfil"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "Usuário edita o próprio perfil"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
