"use client";

import { useExpectedIncome } from "@/lib/calculator-store";
import { money } from "@/lib/sublease-calc";
import { useCountUp } from "../shift-earnings";

/**
 * A renda da calculadora, repetida na coluna direita da chamada final. O número acompanha o que a pessoa montou
 * acima e sobe até o valor novo. Antes de a calculadora carregar, o cartão
 * fala de renda extra, sem valor.
 */
export function CtaValue() {
  const expected = useExpectedIncome();
  const shown = useCountUp(expected ?? 0);

  return (
    <div className="rounded-panel bg-white/8 p-6 ring-1 ring-white/15 backdrop-blur-sm sm:p-8">
      <p className="text-sm font-bold text-brand-100">Sua sala pode render</p>
      {expected === null ? (
        <p className="mt-3 text-h2 font-bold text-white">uma renda extra agora mesmo</p>
      ) : (
        <>
          <p className="mt-3 leading-none font-bold tracking-[-0.03em] text-mint-400 tabular-nums" aria-hidden>
            <span className="text-[3rem] sm:text-[4rem]">{money.format(shown)}</span>
            <span className="ml-2 align-middle text-lg font-normal tracking-normal text-brand-100">por mês</span>
          </p>
          <p className="sr-only">
            Sua sala pode render {money.format(expected)} por mês agora mesmo.
          </p>
          <p className="mt-4 text-brand-100">
            Agora mesmo, com os horários que hoje ficam vazios. Em um ano, são <strong className="text-white tabular-nums">{money.format(expected * 12)}</strong>.
          </p>
        </>
      )}
      <p className="mt-5 border-t border-white/15 pt-4 text-xs text-brand-200">
        Estimativa da calculadora acima, com os números que você escolheu. O valor real depende de quantos horários você fecha.
      </p>
    </div>
  );
}
