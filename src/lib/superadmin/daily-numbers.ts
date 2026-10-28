import { connection } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Stat = { value: number; hint: string; series: number[] };

export type DailyNumbers = { signups: Stat; liveListings: Stat; contacts: Stat; updatedAt: string };

const DAY = 864e5;
// São Paulo está em UTC-3 o ano todo (sem horário de verão desde 2019).
const SP_OFFSET = 3 * 36e5;

/** Os últimos n dias no fuso de São Paulo, do mais antigo ao de hoje, como "AAAA-MM-DD". */
function lastDays(n: number) {
  const today = Math.floor((Date.now() - SP_OFFSET) / DAY) * DAY;
  return Array.from({ length: n }, (_, i) => new Date(today - (n - 1 - i) * DAY).toISOString().slice(0, 10));
}

const startOf = (day: string) => `${day}T00:00:00-03:00`;
const dayOf = (iso: string) => new Date(Date.parse(iso) - SP_OFFSET).toISOString().slice(0, 10);
const nextDay = (day: string) => new Date(Date.parse(`${day}T00:00:00Z`) + DAY).toISOString().slice(0, 10);

function diff(delta: number, same: string, unit: string) {
  if (delta === 0) return same;
  return `${delta > 0 ? "+" : "−"}${Math.abs(delta)} ${unit}`;
}

/** Os três números da home, direto do banco. Chame só depois de requireAdmin(). */
export async function loadDailyNumbers(): Promise<DailyNumbers> {
  // Os números dependem do relógio; sem isto o Next tenta pré-renderizar.
  await connection();
  const db = createAdminClient();
  const days = lastDays(7);
  const weekStart = startOf(days[0]);
  const previousWeekStart = startOf(lastDays(14)[0]);

  const [profiles, live, clicks, previousClicks] = await Promise.all([
    db.from("profiles").select("created_at").gte("created_at", weekStart).limit(10000),
    db.from("listings").select("published_at").eq("status", "active").limit(10000),
    db.from("listing_events").select("day").eq("kind", "whatsapp_click").gte("day", days[0]).limit(10000),
    db
      .from("listing_events")
      .select("id", { count: "exact", head: true })
      .eq("kind", "whatsapp_click")
      .gte("day", previousWeekStart.slice(0, 10))
      .lt("day", days[0]),
  ]);
  for (const result of [profiles, live, clicks, previousClicks]) {
    if (result.error) throw new Error(`Não foi possível ler os números do dia: ${result.error.message}`);
  }

  const perDay = (keys: string[]) => days.map((day) => keys.filter((key) => key === day).length);

  const signupSeries = perDay((profiles.data ?? []).map((row) => dayOf(row.created_at)));
  const signupsToday = signupSeries[6];

  // Anúncios hoje no ar, por data de publicação: a última barra é o total de agora.
  // Sem histórico de status, quem já saiu do ar não entra nas barras antigas.
  const published = (live.data ?? []).map((row) => row.published_at);
  const liveSeries = days.map((day) => {
    const end = Date.parse(startOf(nextDay(day)));
    return published.filter((at) => !at || Date.parse(at) < end).length;
  });
  const addedThisWeek = published.filter((at) => at && Date.parse(at) >= Date.parse(weekStart)).length;

  const contactSeries = perDay((clicks.data ?? []).map((row) => row.day));
  const contactsTotal = contactSeries.reduce((sum, count) => sum + count, 0);
  const previousTotal = previousClicks.count ?? 0;

  return {
    signups: {
      value: signupsToday,
      hint: diff(signupsToday - signupSeries[5], "igual a ontem", "vs. ontem"),
      series: signupSeries,
    },
    liveListings: {
      value: published.length,
      hint: addedThisWeek === 0 ? "nenhum novo esta semana" : `+${addedThisWeek} esta semana`,
      series: liveSeries,
    },
    contacts: {
      value: contactsTotal,
      hint:
        contactsTotal === 0 && previousTotal === 0
          ? "últimos 7 dias"
          : diff(contactsTotal - previousTotal, "igual aos 7 dias anteriores", "vs. 7 dias anteriores"),
      series: contactSeries,
    },
    updatedAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }),
  };
}
