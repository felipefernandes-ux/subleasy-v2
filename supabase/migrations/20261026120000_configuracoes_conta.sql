-- Subleasy 2.0 — configurações da conta
-- Preferências de notificação (as novidades por e-mail já existiam: marketing_opt_in)
-- e o encerramento da conta pela própria pessoa, como pede a LGPD.

alter table public.profiles
  add column notify_messages boolean not null default true,
  add column notify_listing_updates boolean not null default true,
  add column notify_expiration boolean not null default true;

-- Encerra a conta de quem chama. Apagar o usuário apaga em cascata o perfil, os
-- anúncios (com contatos, métricas e mensagens) e as listas de favoritos.
-- As fotos no Storage saem antes, pelo servidor, porque o Storage não está em cascata.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sem sessão' using errcode = '42501';
  end if;
  delete from auth.users where id = (select auth.uid());
end;
$$;

revoke execute on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
