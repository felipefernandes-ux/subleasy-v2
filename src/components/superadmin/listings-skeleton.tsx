import { Card } from "./ui";

const bar = "animate-pulse rounded-sa-badge bg-sa-haze";

/** Esqueleto da lista de anúncios: abas, filtros e linhas da tabela, com as mesmas medidas da tela carregada. */
export function ListingsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando anúncios" role="status">
      <div className="flex gap-4 border-b border-sa-line pb-3">
        {[56, 64, 88, 80, 84, 128].map((width, index) => (
          <span key={index} className={`${bar} h-5 shrink-0`} style={{ width }} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 py-4">
        <span className={`${bar} h-9 w-full sm:w-80`} />
        {[88, 104, 96].map((width, index) => (
          <span key={index} className={`${bar} h-9`} style={{ width }} />
        ))}
      </div>
      <Card className="overflow-hidden">
        <div className="h-9 border-b border-sa-line bg-sa-paper" />
        <ul className="divide-y divide-sa-haze">
          {Array.from({ length: 8 }, (_, index) => (
            <li key={index} className="flex items-center gap-3 px-3 py-2">
              <span className={`${bar} size-4 shrink-0`} />
              <span className={`${bar} size-12 shrink-0`} />
              <span className="min-w-0 flex-1 space-y-2">
                <span className={`${bar} block h-3.5 w-2/3 max-w-72`} />
                <span className={`${bar} block h-3 w-24`} />
              </span>
              <span className={`${bar} hidden h-4 w-28 md:block`} />
              <span className={`${bar} hidden h-4 w-20 lg:block`} />
              <span className={`${bar} h-5 w-16 shrink-0`} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
