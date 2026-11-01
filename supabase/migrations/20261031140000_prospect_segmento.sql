-- Subleasy 2.0 — Prospecção: segmento do prospect (centro médico, clínica, clínica de psicologia, hospital…)
-- Texto livre, porque os segmentos vão crescer: cada planilha importada traz a coluna "segmento"
-- (ou o admin escolhe um segmento padrão na importação) e o Super Admin filtra por ele.

alter table public.prospects
  add column segment text check (char_length(segment) between 1 and 60);

create index prospects_segment_idx on public.prospects (segment);

-- Quem já estava na base entra com o segmento que a planilha dá hoje: mesma regra da coluna "segmento" da aba Maringá.
update public.prospects
set segment = case
  when specialty = 'centro' or lower(name) ~ '^(centro m|condom|policl)' then 'Centro médico'
  when specialty = 'psi' or (specialty is null and lower(name) ~ 'psic') then 'Clínica de psicologia'
  else 'Clínica'
end
where segment is null;
