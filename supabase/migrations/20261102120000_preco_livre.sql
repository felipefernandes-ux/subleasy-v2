-- Anúncio importado do WordPress pode ter qualquer preço, inclusive 0. Para ser fiel ao cadastro original,
-- a regra de preço mínimo de R$ 10 sai do banco; só continua proibido preço negativo.
alter table public.listings drop constraint listings_price_check;
alter table public.listings add constraint listings_price_check check (price >= 0);
