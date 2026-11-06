"use server";

import { getMarketStats, type MarketStat } from "@/lib/market-prices";

/**
 * Preços dos anúncios no ar, agrupados (nunca um anúncio isolado), para a calculadora aberta dentro do cadastro.
 * Vêm do cache; só dados públicos, o mesmo que a página da calculadora mostra.
 */
export async function loadMarketStats(): Promise<MarketStat[]> {
  return (await getMarketStats()).stats;
}
