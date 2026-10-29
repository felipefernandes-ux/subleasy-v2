"use client";

import { useEffect, useState } from "react";

const MODES = [
  { id: "hora", label: "Hora", price: "R$ 35", unit: "por hora", note: "Para quem está começando e atende poucas horas." },
  { id: "turno", label: "Turno", price: "R$ 120", unit: "por turno", note: "Manhã, tarde ou noite fixas na semana." },
  { id: "dia", label: "Dia", price: "R$ 220", unit: "por dia", note: "O dia inteiro, para quem concentra os atendimentos." },
  { id: "mes", label: "Mês", price: "R$ 1.800", unit: "por mês", note: "A sala reservada o mês todo, sem reajustar a cada semana." },
] as const;

const STEP_MS = 2600;

/** Alterna hora, turno, dia e mês sozinho; ao tocar numa opção, para e deixa a pessoa explorar. */
export function BillingModes() {
  const [index, setIndex] = useState(1);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (manual || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((current) => (current + 1) % MODES.length), STEP_MS);
    return () => window.clearInterval(id);
  }, [manual]);

  const mode = MODES[index];

  return (
    <div className="rounded-card bg-white p-5 shadow-card ring-1 ring-ink-900/8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-ink-900">Sala 204 · Zona 7</p>
        <span className="text-xs text-ink-500">Exemplo</span>
      </div>

      <div role="group" aria-label="Como cobrar pelo espaço" className="mt-4 grid grid-cols-4 gap-1 rounded-control bg-ink-100 p-1">
        {MODES.map((item, i) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={i === index}
            onClick={() => {
              setManual(true);
              setIndex(i);
            }}
            className={`focus-ring h-9 rounded-[7px] text-sm font-bold transition-colors ${
              i === index ? "bg-white text-brand-700 shadow-xs" : "text-ink-600 hover:text-ink-900"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div key={mode.id} className="mt-5 animate-pop" aria-live="polite">
        <p className="text-h1 font-bold tracking-tight text-ink-900 tabular-nums">
          {mode.price}
          <span className="ml-2 text-base font-semibold text-ink-500">{mode.unit}</span>
        </p>
        <p className="mt-1 text-sm text-ink-600">{mode.note}</p>
      </div>
    </div>
  );
}
