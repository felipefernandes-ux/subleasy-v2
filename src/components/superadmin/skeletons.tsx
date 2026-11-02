import type { CSSProperties, ReactNode } from "react";
import { Card } from "./ui";

/** Bloco base do esqueleto: cinza claro pulsando. Sem `animate-pulse` para quem reduz movimento. */
export function Bone({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden className={`block animate-pulse rounded-sa-badge bg-sa-haze motion-reduce:animate-none ${className}`} style={style} />;
}

/** Envolve um esqueleto para leitores de tela: anuncia "carregando" uma vez e esconde as barras. */
function Loading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      {children}
    </div>
  );
}

const TAB_WIDTHS = [56, 64, 88, 80, 84, 128];

export function TabsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-4 border-b border-sa-line pb-3">
      {TAB_WIDTHS.slice(0, count).map((width, index) => (
        <Bone key={index} className="h-5 shrink-0" style={{ width }} />
      ))}
    </div>
  );
}

export function FiltersSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-4">
      <Bone className="h-9 w-full sm:w-80" />
      {[88, 104, 96, 112].slice(0, count).map((width, index) => (
        <Bone key={index} className="h-9" style={{ width }} />
      ))}
    </div>
  );
}

/** Linhas de tabela com avatar/miniatura, duas linhas de texto e colunas de apoio. */
export function RowsSkeleton({ rows = 8, thumb = true }: { rows?: number; thumb?: boolean }) {
  return (
    <ul className="divide-y divide-sa-haze">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="flex items-center gap-3 px-3 py-2.5">
          {thumb && <Bone className="size-10 shrink-0" />}
          <span className="min-w-0 flex-1 space-y-2">
            <Bone className="h-3.5 w-2/3 max-w-72" />
            <Bone className="h-3 w-24" />
          </span>
          <Bone className="hidden h-4 w-28 md:block" />
          <Bone className="hidden h-4 w-20 lg:block" />
          <Bone className="h-5 w-16 shrink-0" />
        </li>
      ))}
    </ul>
  );
}

export function TableSkeleton({
  label = "Carregando",
  tabs,
  filters,
  rows = 8,
  thumb = true,
}: {
  label?: string;
  /** Quantidade de abas; omita para não mostrar a barra de abas. */
  tabs?: number;
  /** Quantidade de filtros além da busca; omita para não mostrar a linha de filtros. */
  filters?: number;
  rows?: number;
  thumb?: boolean;
}) {
  return (
    <Loading label={label}>
      {tabs ? <TabsSkeleton count={tabs} /> : null}
      {filters !== undefined ? <FiltersSkeleton count={filters} /> : null}
      <Card className="overflow-hidden">
        <div className="h-9 border-b border-sa-line bg-sa-paper" />
        <RowsSkeleton rows={rows} thumb={thumb} />
        <div className="flex items-center justify-between border-t border-sa-line px-4 py-3">
          <Bone className="h-4 w-32" />
          <span className="flex gap-1.5">
            <Bone className="h-7 w-20" />
            <Bone className="h-7 w-20" />
          </span>
        </div>
      </Card>
    </Loading>
  );
}

/** Cards de número, do tamanho do StatCard/QueueCard. */
export function StatCardsSkeleton({ count = 4, className = "grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" }: { count?: number; className?: string }) {
  return (
    <div className={className} role="status" aria-busy="true" aria-label="Carregando números">
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} className="space-y-3 p-5">
          <Bone className="h-4 w-1/2" />
          <Bone className="h-8 w-1/3" />
          <Bone className="h-3 w-2/3" />
        </Card>
      ))}
    </div>
  );
}

/** Ficha: bloco principal à esquerda e dois cards laterais, como nas telas de detalhe. */
export function DetailSkeleton({ label = "Carregando" }: { label?: string }) {
  return (
    <Loading label={label}>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_24rem]">
        <Card className="space-y-5 p-5">
          <Bone className="h-6 w-1/3" />
          <Bone className="aspect-[2/1] w-full" />
          {[0, 1, 2, 3].map((line) => (
            <span key={line} className="block space-y-2">
              <Bone className="h-3.5 w-24" />
              <Bone className="h-4 w-full max-w-md" />
            </span>
          ))}
        </Card>
        <div className="space-y-6">
          {[0, 1].map((card) => (
            <Card key={card} className="space-y-3 p-5">
              <Bone className="h-5 w-1/2" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-4/5" />
              <Bone className="h-9 w-32" />
            </Card>
          ))}
        </div>
      </div>
    </Loading>
  );
}

/** Esqueleto genérico de página, para o loading.tsx na troca de rota. */
export function PageSkeleton() {
  return (
    <Loading label="Carregando página">
      <div className="mb-6 space-y-2">
        <Bone className="h-7 w-48" />
        <Bone className="h-4 w-full max-w-md" />
      </div>
      <StatCardsSkeleton count={4} />
      <div className="mt-8">
        <TableSkeleton rows={6} />
      </div>
    </Loading>
  );
}

/** Os quatro cards da fila do dia (QueueCard): ícone, número grande e duas linhas de texto. */
export function QueueSkeleton() {
  return (
    <>
      {[0, 1, 2, 3].map((index) => (
        <Card key={index} className="flex flex-col gap-3 p-5">
          <Bone className="size-8" />
          <span className="block space-y-2">
            <Bone className="h-8 w-1/3" />
            <Bone className="h-4 w-2/3" />
            <Bone className="h-3 w-3/4" />
          </span>
        </Card>
      ))}
    </>
  );
}

/** "Números do dia": título e três cards, em carrossel no mobile como a tela carregada. */
export function DailyNumbersSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando números do dia">
      <Bone className="mb-3 h-6 w-40" />
      <div className="-mx-4 flex gap-3 overflow-hidden px-4 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:px-0">
        {[0, 1, 2].map((index) => (
          <Card key={index} className="w-[calc(50%-0.375rem)] shrink-0 space-y-3 p-5 md:w-auto">
            <Bone className="h-4 w-1/2" />
            <Bone className="h-8 w-1/3" />
            <Bone className="h-3 w-2/3" />
          </Card>
        ))}
      </div>
    </div>
  );
}
