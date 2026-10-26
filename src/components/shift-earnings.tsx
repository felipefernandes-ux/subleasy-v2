"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRightIcon, buttonClasses } from "./ui";

const WEEKS_PER_MONTH = 4.3;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Conta ao vivo: preço do turno × turnos vagos × 4,3 semanas. O número sobe até o valor novo. */
export function ShiftEarnings() {
  const [price, setPrice] = useState(120);
  const [shifts, setShifts] = useState(6);
  const target = Math.round((price * shifts * WEEKS_PER_MONTH) / 10) * 10;
  const shown = useCountUp(target);
  const priceId = useId();
  const shiftsId = useId();

  return (
    <div className="grid overflow-hidden rounded-panel bg-brand-900 text-white lg:grid-cols-[1fr_1.1fr]">
      <div className="p-6 sm:p-10">
        <div className="space-y-8">
          <Slider
            id={priceId}
            label="Preço por turno"
            value={money.format(price)}
            min={40}
            max={400}
            step={10}
            current={price}
            onChange={setPrice}
          />
          <Slider
            id={shiftsId}
            label="Turnos vagos por semana"
            value={`${shifts} ${shifts === 1 ? "turno" : "turnos"}`}
            min={1}
            max={21}
            step={1}
            current={shifts}
            onChange={setShifts}
          />
        </div>

        <div className="mt-10 grid grid-cols-7 gap-1.5" aria-hidden>
          {Array.from({ length: 21 }, (_, index) => (
            <span
              key={index}
              className={`aspect-[5/4] rounded-[5px] transition-[background-color,transform] duration-300 ${
                index < shifts ? "scale-100 bg-mint-400" : "scale-90 bg-white/10"
              }`}
              style={{ transitionDelay: `${index * 12}ms` }}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-brand-200">Cada quadrado é um turno da semana: 7 dias × manhã, tarde e noite.</p>
      </div>

      <div className="relative flex flex-col justify-center gap-4 bg-brand-600 p-6 sm:p-10">
        <p className="text-sm font-bold text-brand-100">Se você alugar esses turnos, sua sala pode render</p>
        <p className="text-[3rem] leading-none font-bold tracking-[-0.03em] tabular-nums sm:text-[4.25rem]" aria-hidden>
          {money.format(shown)}
          <span className="ml-2 align-middle text-lg font-normal tracking-normal text-brand-100">por mês</span>
        </p>
        <p className="sr-only" aria-live="polite">
          {money.format(target)} por mês
        </p>
        <p className="max-w-sm text-sm leading-relaxed text-brand-100">
          {money.format(price)} × {shifts} {shifts === 1 ? "turno" : "turnos"} × 4,3 semanas. É uma estimativa: o valor real depende de
          quantos turnos você fecha e do preço da sua região.
        </p>
        <a href="/anunciar" className={`${buttonClasses("inverse", "lg")} mt-4 self-start`}>
          Anunciar minha sala grátis
          <ArrowRightIcon />
        </a>
      </div>
    </div>
  );
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (value: number) => void;
}) {
  const fill = ((current - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-bold text-brand-100">
          {label}
        </label>
        <span className="text-xl font-bold tabular-nums">{value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(event) => onChange(Number(event.target.value))}
        className="range-mint mt-3 w-full"
        style={{ "--fill": `${fill}%` } as React.CSSProperties}
      />
    </div>
  );
}

// Anima de um valor ao outro em 600ms. Sem animação para quem pede menos movimento.
function useCountUp(target: number) {
  const [value, setValue] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const start = from.current;
    if (start === target) return;
    // Com movimento reduzido, a duração é zero e o valor salta no primeiro quadro.
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 600;
    const began = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = duration ? Math.min(1, (now - began) / duration) : 1;
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(start + (target - start) * eased);
      from.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}
