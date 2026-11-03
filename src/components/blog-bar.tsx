import Link from "next/link";
import { SearchIcon } from "./ui";

// Faixa do blog logo abaixo do cabeçalho do site: a busca daqui pesquisa só os posts do blog
// (/blog/?s=termo), enquanto a do cabeçalho continua procurando salas.
export function BlogBar({ query = "" }: { query?: string }) {
  return (
    <div className="border-b border-ink-200 bg-white">
      <div className="container-page flex min-h-14 flex-wrap items-center justify-between gap-x-6 gap-y-2 py-2">
        <Link href="/blog/" className="focus-ring rounded-control text-sm font-bold text-ink-900">
          Blog da Subleasy
        </Link>
        <form action="/blog/" method="get" role="search" className="relative w-full sm:w-80">
          <label htmlFor="blog-search" className="sr-only">
            Buscar no blog
          </label>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-500" />
          <input
            id="blog-search"
            type="search"
            name="s"
            defaultValue={query}
            placeholder="Buscar no blog"
            className="focus-ring h-10 w-full rounded-control border border-ink-300 bg-white pr-3 pl-9 text-sm text-ink-900 placeholder:text-ink-500"
          />
        </form>
      </div>
    </div>
  );
}
