-- Subleasy 2.0 — registro de auditoria do Super Admin
-- Cada ação sensível do admin grava quem fez, quando, o quê e o motivo. O registro só cresce:
-- nenhum papel (nem a service role) consegue editar ou apagar uma linha.

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  -- Sem chave estrangeira: o registro sobrevive à exclusão da conta do admin ou do alvo.
  admin_id uuid not null,
  admin_email text not null,
  action text not null check (char_length(action) between 3 and 60),
  target_type text not null check (target_type in ('listing', 'user', 'lead', 'system')),
  target_id text,
  -- Nome do alvo na hora da ação (título do anúncio, e-mail da conta): fica legível depois que o alvo some.
  target_label text,
  reason text check (char_length(reason) <= 1000),
  details jsonb not null default '{}'::jsonb
);

create index admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;

-- Admin só lê. Quem grava é a service role, no servidor, depois de conferir que é admin.
create policy "Admin lê o registro de auditoria"
  on public.admin_audit_log for select
  to authenticated
  using ((select public.is_admin()));

revoke all on public.admin_audit_log from anon, authenticated;
grant select on public.admin_audit_log to authenticated;

-- A service role ignora o RLS, mas não os gatilhos: eles garantem que o registro só cresce.
create or replace function public.admin_audit_log_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'O registro de auditoria só cresce: não aceita edição nem exclusão.';
end;
$$;

create trigger admin_audit_log_no_change
  before update or delete on public.admin_audit_log
  for each row
  execute function public.admin_audit_log_append_only();

create trigger admin_audit_log_no_truncate
  before truncate on public.admin_audit_log
  for each statement
  execute function public.admin_audit_log_append_only();
