// Confere a cidade de cada prospect no Google Places (New), pelo place_id, e grava em prospects.city.
// Uso: node scripts/prospeccao/verificar-cidade.mjs [--extra ids.txt] [--out cidades.json] [--gravar]
//   --extra  arquivo com place_ids a mais (um por linha), por exemplo os de uma planilha ainda não importada.
//   --out    JSON { place_id: { city, state } } para preencher a coluna "cidade" da planilha.
//   --gravar atualiza prospects.city; sem a flag, só mostra o resumo (não escreve no banco).
// Lê GOOGLE_PLACES_KEY e as chaves do Supabase de .env.local.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs
    .readFileSync(new URL("../../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1).replace(/^"|"$/g, "")]),
);
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const write = process.argv.includes("--gravar");
const out = arg("--out") ?? "/tmp/cidades.json";

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data: prospects, error } = await db.from("prospects").select("id, place_id, city").not("place_id", "is", null);
if (error) throw error;
const extra = arg("--extra") ? fs.readFileSync(arg("--extra"), "utf8").split("\n").map((l) => l.trim()).filter(Boolean) : [];
const ids = [...new Set([...prospects.map((p) => p.place_id), ...extra])];

async function lookup(id) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`https://places.googleapis.com/v1/places/${id}`, {
      headers: { "X-Goog-Api-Key": env.GOOGLE_PLACES_KEY, "X-Goog-FieldMask": "addressComponents" },
    });
    if (res.ok) {
      const { addressComponents = [] } = await res.json();
      const find = (type) => addressComponents.find((c) => c.types?.includes(type));
      const city = (find("locality") ?? find("administrative_area_level_2"))?.longText ?? null;
      return { city, state: find("administrative_area_level_1")?.shortText ?? null };
    }
    if (res.status === 404) return { city: null, state: null, notFound: true };
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }
  return { city: null, state: null, failed: true };
}

const result = {};
let next = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (next < ids.length) {
      const id = ids[next++];
      result[id] = await lookup(id);
    }
  }),
);
fs.writeFileSync(out, JSON.stringify(result, null, 1));

const tally = {};
for (const r of Object.values(result)) {
  const key = r.failed ? "(falhou)" : r.notFound ? "(não encontrado)" : `${r.city ?? "?"} - ${r.state ?? "?"}`;
  tally[key] = (tally[key] ?? 0) + 1;
}
console.log(`${ids.length} lugares conferidos →`, tally, `\nJSON em ${out}`);

if (write) {
  let updated = 0;
  for (const p of prospects) {
    const city = result[p.place_id]?.city;
    if (!city || city === p.city) continue;
    const { error: updateError } = await db.from("prospects").update({ city }).eq("id", p.id);
    if (updateError) throw updateError;
    updated++;
  }
  console.log(`${updated} prospects atualizados.`);
}
