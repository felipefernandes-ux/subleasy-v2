-- Subleasy 2.0: aceite da versão atualizada dos Termos e da Política.
-- Cada aceite novo vira uma linha em consent_events (a coluna terms_version de profiles guarda só o último).
-- Só amplia o que a tabela aceita: o consentimento do WhatsApp no perfil continua igual.

alter table public.consent_events drop constraint if exists consent_events_purpose_check;
alter table public.consent_events
  add constraint consent_events_purpose_check check (purpose in ('show_whatsapp_profile', 'terms_acceptance'));

alter table public.consent_events drop constraint if exists consent_events_channel_check;
alter table public.consent_events
  add constraint consent_events_channel_check check (channel in ('cadastro', 'configuracoes', 'atualizacao_termos'));
