import { connection } from "next/server";

export type TrafficPair = { current: number; previous: number };
export type TrafficNumbers = {
  users: TrafficPair;
  firstTimeUsers: TrafficPair;
  live: number;
  sessionSeconds: TrafficPair;
};
export type TrafficResult = { ok: true; data: TrafficNumbers } | { ok: false; reason: string };

// Pessoas marcadas como admin pelo PostHogIdentify ficam de fora, para o seu uso do painel não inflar os números.
const NOT_ADMIN = "ifNull(toString(person.properties.is_admin), '') != 'true'";

async function hogql(query: string): Promise<number[]> {
  const host = process.env.POSTHOG_API_HOST ?? "https://us.posthog.com";
  const response = await fetch(`${host}/api/projects/${process.env.POSTHOG_PROJECT_ID}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.POSTHOG_PERSONAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`PostHog respondeu ${response.status}`);
  const { results } = (await response.json()) as { results: Array<Array<number | null>> };
  return (results[0] ?? []).map((value) => Number(value ?? 0));
}

/** Os números dos quatro cards de tráfego, direto do PostHog. Chame só depois de requireAdmin(). */
export async function loadTrafficNumbers(): Promise<TrafficResult> {
  await connection();
  if (!process.env.POSTHOG_PERSONAL_API_KEY || !process.env.POSTHOG_PROJECT_ID) {
    return { ok: false, reason: "Faltam POSTHOG_PERSONAL_API_KEY e POSTHOG_PROJECT_ID no ambiente." };
  }
  try {
    const [visits, firstTime, sessions] = await Promise.all([
      hogql(`
        select
          uniqIf(person_id, timestamp >= now() - interval 7 day),
          uniqIf(person_id, timestamp < now() - interval 7 day),
          uniqIf(person_id, timestamp >= now() - interval 5 minute)
        from events
        where event = '$pageview' and timestamp >= now() - interval 14 day and ${NOT_ADMIN}`),
      hogql(`
        select
          countIf(first_seen >= now() - interval 7 day),
          countIf(first_seen < now() - interval 7 day and first_seen >= now() - interval 14 day)
        from (
          select person_id, min(timestamp) as first_seen
          from events
          where event = '$pageview' and ${NOT_ADMIN}
          group by person_id
        )`),
      hogql(`
        select
          avgIf(seconds, started >= now() - interval 7 day),
          avgIf(seconds, started < now() - interval 7 day)
        from (
          select min(timestamp) as started, dateDiff('second', min(timestamp), max(timestamp)) as seconds
          from events
          where timestamp >= now() - interval 14 day and $session_id != '' and ${NOT_ADMIN}
          group by $session_id
        )`),
    ]);
    return {
      ok: true,
      data: {
        users: { current: visits[0], previous: visits[1] },
        live: visits[2],
        firstTimeUsers: { current: firstTime[0], previous: firstTime[1] },
        sessionSeconds: { current: sessions[0], previous: sessions[1] },
      },
    };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "Erro ao consultar o PostHog." };
  }
}
