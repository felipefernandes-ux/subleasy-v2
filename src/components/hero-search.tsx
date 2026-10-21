"use client";

import { FormEvent, useId, useState } from "react";

const SUGGESTIONS = [
  "Consultório de psicologia em Pinheiros, 2 tardes por semana",
  "Sala odontológica com cadeira, centro de São Paulo",
  "Box de fisioterapia perto do metrô, manhãs",
];

export function HeroSearch() {
  const inputId = useId();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <div className="w-full max-w-3xl">
      <form
        onSubmit={handleSubmit}
        className="relative rounded-2xl bg-white p-2 shadow-[0_24px_60px_-28px_rgba(11,58,91,0.45)] ring-1 ring-navy/10 sm:p-2.5"
        role="search"
      >
        <label htmlFor={inputId} className="sr-only">
          Buscar consultório em linguagem natural
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <div className="relative min-w-0 flex-1">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-clinic sm:left-4"
            >
              <SearchIcon />
            </span>
            <input
              id={inputId}
              type="search"
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex.: consultório de psicologia em Pinheiros, 2 tardes por semana"
              className="h-13 w-full rounded-xl bg-ice/70 py-3.5 pr-4 pl-11 text-base text-navy placeholder:text-slate-ink/55 outline-none ring-clinic/0 transition focus:bg-white focus:ring-2 focus:ring-clinic/40 sm:h-14 sm:pl-12"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-13 shrink-0 items-center justify-center rounded-xl bg-clinic px-6 text-sm font-semibold tracking-wide text-white transition hover:bg-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic sm:h-14 sm:px-8"
          >
            Buscar salas
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
        <span className="text-xs font-medium tracking-wide text-slate-ink/70 uppercase">
          Experimente
        </span>
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setQuery(suggestion)}
            className="max-w-full truncate rounded-full border border-mist bg-white/80 px-3 py-1.5 text-left text-xs text-navy transition hover:border-clinic/40 hover:bg-ice focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="9" cy="9" r="6.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M13.5 13.5 17 17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
