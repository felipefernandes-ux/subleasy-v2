-- Subleasy 2.0 — "Outro espaço" com texto livre
-- Quando o anunciante escolhe "Outro espaço", ele descreve o tipo à mão. O texto não é
-- categoria: serve só para análise (ex.: muitos anúncios com o mesmo tipo digitado).

alter table public.listings
  add column space_type_other text
    check (space_type_other is null or char_length(space_type_other) <= 80);
