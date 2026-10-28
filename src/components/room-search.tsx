"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { searchUrl } from "@/lib/search-text";
import { SearchIcon, buttonClasses } from "./ui";

/**
 * Busca da home: escreva do seu jeito ou toque numa sugestão, que preenche o campo para
 * você ajustar. A frase vira os filtros da página de resultados (tipo, cobrança, comodidades e lugar).
 */
export function RoomSearch({ suggestions }: { suggestions: string[] }) {
  const inputId = useId();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const go = (text: string) => router.push(searchUrl(text));
  // A sugestão só preenche o campo: a pessoa pode ajustar antes de buscar.
  const fill = (text: string) => {
    setQuery(text);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          go(query);
        }}
        className="rounded-panel bg-white p-2 shadow-raised ring-1 ring-ink-900/8"
      >
        <label htmlFor={inputId} className="sr-only">
          Que sala você procura?
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-400" />
            <input
              ref={inputRef}
              id={inputId}
              type="search"
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tipo de sala, bairro ou cidade"
              className="h-13 w-full rounded-card bg-ink-50 pr-4 pl-12 text-base text-ink-900 outline-none placeholder:text-ink-500 focus:bg-white focus:ring-2 focus:ring-brand-600/40 sm:h-14"
            />
          </div>
          <button
            type="submit"
            className={`${buttonClasses("primary", "lg")} sm:h-14`}
          >
            Buscar salas
          </button>
        </div>
      </form>

      {suggestions.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink-500">Experimente:</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => fill(suggestion)}
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
