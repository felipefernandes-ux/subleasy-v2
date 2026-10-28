-- Subleasy 2.0 — verificação em duas etapas por e-mail
-- Todo login novo passa por um código de 6 dígitos enviado ao e-mail da conta. O código nunca é
-- guardado em claro: só um HMAC dele. A tabela fica sem políticas de RLS, então só a service
-- role (as Server Actions) lê e grava.

create table public.login_codes (
  id uuid primary key default gen_random_uuid(),
  -- login: entrar com e-mail; signup: criar conta com e-mail; session: segunda etapa do Google.
  purpose text not null check (purpose in ('login', 'signup', 'session')),
  email text not null,
  user_id uuid references auth.users (id) on delete cascade,
  code_hash text not null,
  expires_at timestamp with time zone not null,
  attempts smallint not null default 0,
  consumed_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create index login_codes_email_created_idx on public.login_codes (email, created_at desc);

alter table public.login_codes enable row level security;

-- Quando a pessoa pediu para encerrar a confiança nos aparelhos: cookies de confiança mais
-- antigos que isto deixam de valer.
alter table public.profiles
  add column trusted_devices_reset_at timestamp with time zone not null default 'epoch';

-- Procura o usuário pelo e-mail (a API de admin não tem essa busca). Só a service role chama.
create function public.auth_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

revoke execute on function public.auth_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.auth_user_id_by_email(text) to service_role;
