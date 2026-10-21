"use client";

import { FormEvent, useId, useState } from "react";
import { ArrowRightIcon, SearchIcon, SparkleIcon, buttonClasses } from "./ui";

const SUGGESTIONS = [
  "Sala para psicologia na Zona 7, terça à tarde",
  "Consultório com maca para fisioterapia, manhãs",
  "Sala de estética com pia no Centro, por hora",
];

type Filter = { group: string; value: string };

// Prévia local da conversão de frase em filtros. Na fase 2 a IA faz isso no
// backend; aqui a regra é a mesma: mostrar o que foi entendido, nunca adivinhar.
const RULES: { group: string; value: string; pattern: RegExp }[] = [
  { group: "Atendimento", value: "Psicologia", pattern: /psic|terapia\b|terapeut/ },
  { group: "Atendimento", value: "Fisioterapia", pattern: /fisio/ },
  { group: "Atendimento", value: "Nutrição", pattern: /nutri/ },
  { group: "Atendimento", value: "Estética", pattern: /est[eé]tic/ },
  { group: "Atendimento", value: "Odontologia", pattern: /odonto|dentist/ },
  { group: "Atendimento", value: "Medicina", pattern: /m[eé]dic/ },
  { group: "Turno", value: "Manhã", pattern: /manh[ãa]/ },
  { group: "Turno", value: "Tarde", pattern: /tarde/ },
  { group: "Turno", value: "Noite", pattern: /noite/ },
  { group: "Dia", value: "Segunda", pattern: /segunda/ },
  { group: "Dia", value: "Terça", pattern: /ter[çc]a/ },
  { group: "Dia", value: "Quarta", pattern: /quarta/ },
  { group: "Dia", value: "Quinta", pattern: /quinta/ },
  { group: "Dia", value: "Sexta", pattern: /sexta/ },
  { group: "Dia", value: "Sábado", pattern: /s[áa]bado/ },
  { group: "Cobrança", value: "Por hora", pattern: /por hora|\bhora\b/ },
  { group: "Cobrança", value: "Por mês", pattern: /por m[eê]s|mensal/ },
  { group: "Bairro", value: "Zona 7", pattern: /zona 7/ },
  { group: "Bairro", value: "Zona 1", pattern: /zona 1\b/ },
  { group: "Bairro", value: "Centro", pattern: /centro/ },
  { group: "Bairro", value: "Gleba Palhano", pattern: /palhano/ },
  { group: "Estrutura", value: "Maca", pattern: /maca/ },
  { group: "Estrutura", value: "Pia", pattern: /\bpia\b/ },
];

function parseQuery(query: string): Filter[] {
  const text = query.toLowerCase();
  return RULES.filter((rule) => rule.pattern.test(text)).map(({ group, value }) => ({
    group,
    value,
  }));
}

export function RoomSearch() {
  const inputId = useId();
  const resultId = useId();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filter[] | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters(parseQuery(query));
  }

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-describedby={filters ? resultId : undefined}
        className="rounded-panel bg-white p-2 shadow-raised ring-1 ring-ink-900/8"
      >
        <label htmlFor={inputId} className="sr-only">
          Descreva a sala que você procura
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-400" />
            <input
              id={inputId}
              type="search"
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex.: sala para psicologia na Zona 7, terça à tarde"
              className="h-13 w-full rounded-card bg-ink-50 pr-4 pl-12 text-base text-ink-900 outline-none placeholder:text-ink-500 focus:bg-white focus:ring-2 focus:ring-brand-600/40 sm:h-14"
            />
          </div>
          <button type="submit" className={`${buttonClasses("primary", "lg")} sm:h-14`}>
            Buscar salas
          </button>
        </div>
      </form>

      {filters ? (
        <div
          id={resultId}
          role="status"
          className="mt-4 rounded-card border border-brand-100 bg-brand-50/60 p-4"
        >
          <p className="flex items-center gap-1.5 text-sm font-bold text-brand-700">
            <SparkleIcon className="size-4" />
            {filters.length > 0 ? "Entendemos assim" : "Não encontramos filtros nessa frase"}
          </p>
          {filters.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {filters.map((filter) => (
                <li
                  key={`${filter.group}-${filter.value}`}
                  className="rounded-full bg-white px-3 py-1 text-sm text-ink-800 ring-1 ring-ink-200"
                >
                  <span className="text-ink-500">{filter.group}:</span> {filter.value}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-ink-600">
              Tente dizer o tipo de atendimento, o bairro e o turno.
            </p>
          )}
          <a
            href="#salas"
            className="focus-ring mt-4 inline-flex items-center gap-1 rounded-control text-sm font-bold text-brand-600 hover:text-brand-500"
          >
            Ver salas em Maringá
            <ArrowRightIcon />
          </a>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink-500">Experimente:</span>
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuery(suggestion)}
              className="focus-ring min-h-11 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-left text-sm text-ink-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
