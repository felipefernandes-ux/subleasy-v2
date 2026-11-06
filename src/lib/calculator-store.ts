"use client";

import { useSyncExternalStore } from "react";

// As calculadoras e as chamadas finais das páginas vivem em pontos diferentes da árvore (a página é de servidor).
// Estes pequenos repositórios levam o número calculado de uma até a outra, sem recarregar nada.
function createStore() {
  let value: number | null = null;
  const listeners = new Set<() => void>();
  return {
    publish(next: number) {
      if (next === value) return;
      value = next;
      listeners.forEach((listener) => listener());
    },
    use() {
      return useSyncExternalStore(
        (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        () => value,
        () => null,
      );
    },
  };
}

const income = createStore();
const saving = createStore();

/** Renda mensal esperada da calculadora de renda; null até ela carregar (e no servidor). */
export const publishExpected = income.publish;
export const useExpectedIncome = income.use;

/** Economia mensal da calculadora de sublocação x aluguel completo (negativa quando o aluguel completo sai mais barato). */
export const publishSaving = saving.publish;
export const useSaving = saving.use;
