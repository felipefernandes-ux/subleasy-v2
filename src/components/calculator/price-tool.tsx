"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalculatorIcon, CircleNotchIcon, XIcon } from "@phosphor-icons/react";
import posthog from "posthog-js";
import { loadMarketStats } from "@/app/actions/market";
import { trackCalculator } from "@/lib/analytics";
import type { SpaceType } from "@/lib/listing-options";
import type { MarketStat } from "@/lib/market-prices";
import type { Billing } from "@/lib/sublease-calc";
import { SubleaseCalculator } from "./sublease-calculator";

/**
 * "Não sabe quanto cobrar? Conheça nossa ferramenta": abre a calculadora de renda num painel lateral, em cima do
 * cadastro, sem sair da página. A calculadora já começa com o tipo de sala, a cobrança e a cidade do anúncio, e o botão
 * "Usar este preço" devolve o valor ao campo de preço. Os preços de referência chegam na primeira abertura.
 */
export function PriceToolButton({
  spaceType,
  billing,
  city,
  state,
  onUse,
}: {
  spaceType: SpaceType | "";
  billing: Billing;
  city: string;
  state: string;
  onUse: (price: number, billing: Billing) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          void trackCalculator("calculator_started", { tool: "renda", origin: "cadastro" });
          posthog.capture("price_tool_opened");
        }}
        className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-control px-3 py-2 text-left text-sm font-bold text-brand-600 ring-1 ring-brand-200 transition-colors hover:bg-brand-50 hover:text-brand-700"
      >
        <CalculatorIcon className="size-5 shrink-0" weight="duotone" aria-hidden />
        Não sabe quanto cobrar? Conheça nossa ferramenta
      </button>
      {open && (
        <PriceToolPanel
          initial={{ spaceType: spaceType || undefined, billing, city, state }}
          onClose={() => setOpen(false)}
          onUse={(price, chosen) => {
            onUse(price, chosen);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function PriceToolPanel({
  initial,
  onClose,
  onUse,
}: {
  initial: { spaceType?: SpaceType; billing: Billing; city: string; state: string };
  onClose: () => void;
  onUse: (price: number, billing: Billing) => void;
}) {
  const [stats, setStats] = useState<MarketStat[] | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // O fechamento mais recente, para o ouvinte de Esc e o foco não refazerem a cada renderização do cadastro.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    let alive = true;
    // Sem a referência o cálculo ainda funciona; só não compara com os anúncios.
    loadMarketStats()
      .then((found) => alive && setStats(found))
      .catch(() => alive && setStats([]));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // No body: o cadastro pode ter transformações que prenderiam um painel fixo dentro dele.
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div onClick={onClose} aria-hidden className="absolute inset-0 animate-veil-in bg-ink-900/50" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="price-tool-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-[72rem] animate-drawer-right flex-col bg-ink-50 shadow-raised"
      >
        <header className="flex items-start justify-between gap-4 border-b border-ink-200 bg-white px-5 py-4 sm:px-8">
          <div>
            <h2 id="price-tool-title" className="text-h3 font-bold text-ink-900">
              Quanto cobrar pela sua sala
            </h2>
            <p className="mt-1 text-sm text-ink-600">Veja a renda por mês e use o preço no seu anúncio. Seu cadastro continua aberto.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar e voltar ao anúncio"
            className="focus-ring grid size-11 shrink-0 place-items-center rounded-full text-ink-700 ring-1 ring-ink-300 hover:bg-ink-100"
          >
            <XIcon className="size-5" weight="bold" aria-hidden />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {stats === null ? (
            <div role="status" className="grid h-64 place-items-center text-ink-600">
              <span className="flex items-center gap-2">
                <CircleNotchIcon className="size-5 animate-spin" weight="bold" aria-hidden />
                Carregando a ferramenta
              </span>
            </div>
          ) : (
            <SubleaseCalculator stats={stats} initial={initial} embedded={{ onUse }} />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
