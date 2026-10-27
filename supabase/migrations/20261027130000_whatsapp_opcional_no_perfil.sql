-- Subleasy 2.0 — WhatsApp opcional no cadastro
-- O WhatsApp deixa de travar o primeiro acesso. Quem pula informa o número ao criar
-- o primeiro anúncio (listing_contacts continua exigindo o número de cada anúncio).

alter table public.profiles alter column whatsapp_number drop not null;
