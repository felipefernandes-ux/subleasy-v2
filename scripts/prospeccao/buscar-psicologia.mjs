// Busca clínicas e consultórios de psicologia de Maringá no Google Places (New) e grava um CSV
// no formato da importação de prospects (Super Admin → Prospecção → Importar planilha).
// Uso: node scripts/prospeccao/buscar-psicologia.mjs [arquivo.csv]
// Lê GOOGLE_PLACES_KEY e as chaves do Supabase de .env.local. Só lê o banco (para pular quem já está na base).
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs
    .readFileSync(new URL("../../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1).replace(/^"|"$/g, "")]),
);
const out = process.argv[2] ?? new URL("../../imports/psicologia-maringa.csv", import.meta.url).pathname;

const QUERIES = [
  "clínica de psicologia em Maringá PR",
  "psicólogo em Maringá PR",
  "psicóloga clínica em Maringá PR",
  "consultório de psicologia em Maringá PR",
  "psicoterapia em Maringá PR",
  "terapia cognitivo comportamental Maringá PR",
  "neuropsicologia em Maringá PR",
  "psicologia infantil em Maringá PR",
  "terapia de casal em Maringá PR",
  "psicanalista em Maringá PR",
  "espaço terapêutico em Maringá PR",
];
const FIELDS = [
  "places.id", "places.displayName", "places.formattedAddress", "places.nationalPhoneNumber",
  "places.internationalPhoneNumber", "places.websiteUri", "places.businessStatus", "places.primaryType", "places.types",
].join(",");
// Maringá: caixa em volta da cidade, para o Google não trazer cidades vizinhas.
const MARINGA = { rectangle: { low: { latitude: -23.52, longitude: -51.99 }, high: { latitude: -23.33, longitude: -51.84 } } };

async function search(query) {
  const places = [];
  let pageToken;
  for (let page = 0; page < 3; page++) {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": env.GOOGLE_PLACES_KEY, "X-Goog-FieldMask": `${FIELDS},nextPageToken` },
      body: JSON.stringify({ textQuery: query, languageCode: "pt-BR", regionCode: "BR", locationRestriction: MARINGA, pageSize: 20, ...(pageToken && { pageToken }) }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`${query}: ${res.status} ${json.error?.message ?? JSON.stringify(json)}`);
    places.push(...(json.places ?? []));
    pageToken = json.nextPageToken;
    if (!pageToken) break;
  }
  return places;
}

const found = new Map();
for (const query of QUERIES) {
  const places = await search(query);
  let fresh = 0;
  for (const place of places) if (!found.has(place.id)) (found.set(place.id, place), fresh++);
  console.log(`${String(places.length).padStart(2)} resultados, ${String(fresh).padStart(2)} novos — ${query}`);
}

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data: existing, error } = await db.from("prospects").select("place_id").not("place_id", "is", null);
if (error) throw error;
const known = new Set(existing.map((row) => row.place_id));

const PSY = /psic[oó]log|psican|psicoter|neuropsic|terap|cl[ií]nica|instituto|espa[cç]o|centro/i;
const rows = [...found.values()].filter((p) => {
  if (p.businessStatus && p.businessStatus !== "OPERATIONAL") return false;
  if (!/Maring[aá]/i.test(p.formattedAddress ?? "")) return false;
  const typed = (p.types ?? []).some((t) => /psycholog|psychotherap|mental_health|counsel/.test(t)) || /psycholog|psychotherap/.test(p.primaryType ?? "");
  return typed || /psic/i.test(p.displayName?.text ?? "") || PSY.test(p.displayName?.text ?? "") && /psic|terap/i.test(p.displayName?.text ?? "");
});

const csvCell = (v) => (/[",\n]/.test(v ?? "") ? `"${v.replaceAll('"', '""')}"` : (v ?? ""));
const header = ["nome", "endereço", "telefone", "celular (maps)", "instagram", "site", "place_id", "prioridade", "modelo", "especialidade"];
const lines = [header.join(",")];
let skippedKnown = 0;
for (const p of rows) {
  if (known.has(p.id)) { skippedKnown++; continue; }
  const site = p.websiteUri ?? "";
  const insta = /instagram\.com\/([^/?#]+)/i.exec(site)?.[1];
  lines.push([
    p.displayName?.text, p.formattedAddress?.replace(/, Brasil$/, ""), p.nationalPhoneNumber, p.internationalPhoneNumber,
    insta ? `@${insta}` : "", insta ? "" : site, p.id, "4", "B", "psi",
  ].map((v) => csvCell(v ?? "")).join(","));
}
fs.writeFileSync(out, lines.join("\n") + "\n");
console.log(`\n${found.size} lugares únicos, ${rows.length} de psicologia em Maringá, ${skippedKnown} já na base, ${lines.length - 1} novos → ${out}`);
