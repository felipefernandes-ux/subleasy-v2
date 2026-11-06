"use client";

import { useSaving } from "@/lib/calculator-store";
import { money } from "@/lib/sublease-calc";
import { useCountUp } from "../shift-earnings";

/**
 * A economia da calculadora, repetida na coluna direita da chamada final. Acompanha o que a pessoa montou acima.
 * Quando a sala própria sai mais barata, o cartão diz isso, sem forçar uma economia que não existe.
 * Antes de a calculadora carregar, fala da conta sem valor.
 */
export function SavingCta() {
  const saving = useSaving();
  const shown = useCountUp(saving === null ? 0 : Math.abs(saving));

  return (
    <div className="rounded-panel bg-white/8 p-6 ring-1 ring-white/15 backdrop-blur-sm sm:p-8">
      {saving === null ? (
        <>
          <p className="text-sm font-bold text-brand-100">Sua conta</p>
          <p className="mt-3 text-h2 font-bold text-white">pode sair mais leve do que você imagina</p>
        </>
      ) : saving > 0 ? (
        <>
          <p className="text-sm font-bold text-brand-100">Você pode economizar</p>
          <p className="mt-3 leading-none font-bold tracking-[-0.03em] text-mint-400 tabular-nums" aria-hidden>
            <span className="text-[3rem] sm:text-[4rem]">{money.format(shown)}</span>
            <span className="ml-2 align-middle text-lg font-normal tracking-normal text-brand-100">por mês</span>
          </p>
          <p className="sr-only">Você pode economizar {money.format(saving)} por mês.</p>
          <p className="mt-4 text-brand-100">
            Pagando só pelas horas que usa. Em um ano, são <strong className="text-white tabular-nums">{money.format(saving * 12)}</strong>.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-bold text-brand-100">Com as horas que você informou</p>
          <p className="mt-3 text-h2 font-bold text-white">a sala própria já compensa</p>
          <p className="mt-4 text-brand-100">
            Ela sai <strong className="text-white tabular-nums">{money.format(Math.abs(saving))}</strong> mais barata por mês. Se a sua agenda for menor, pagar por hora volta a valer.
          </p>
        </>
      )}
      <p className="mt-5 border-t border-white/15 pt-4 text-xs text-brand-200">Estimativa da calculadora acima, com os números que você escolheu. Não inclui impostos.</p>
    </div>
  );
}
