#!/usr/bin/env node
/**
 * Importa o arquivo `subleasy-import` v1 (docs/importacao/formato-anuncios.md) para o Supabase.
 *
 *   node scripts/importacao/importar.mjs imports/<arquivo>.json                 simulação (padrão)
 *   node scripts/importacao/importar.mjs imports/<arquivo>.json --check-photos  simulação + confere as fotos
 *   node scripts/importacao/importar.mjs imports/<arquivo>.json --apply --confirm-host=<host>
 *
 * Regras:
 * - Todo anúncio entra como rascunho. Quem publica é o anunciante (envia para análise) e o admin (aprova).
 * - Cada anunciante com anúncio importável ganha uma conta no Supabase Auth, com o e-mail já confirmado e
 *   sem nenhum e-mail enviado. Não cria perfil: no primeiro login a pessoa passa pelo cadastro e aceita os Termos.
 * - `removed` não vira anúncio. Anúncio que não cumpre as regras do banco é pulado e vai para o relatório.
 * - Pode rodar de novo: o que já foi importado (listing_imports.source_id) é atualizado, não duplicado.
 *
 * `--apply` precisa de NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.
 */
import { readFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

const args = process.argv.slice(2);
const file = args.find((arg) => !arg.startsWith("--"));
const flag = (name) => args.find((arg) => arg === `--${name}` || arg.startsWith(`--${name}=`));
const apply = Boolean(flag("apply"));
const checkPhotos = Boolean(flag("check-photos"));
const confirmHost = flag("confirm-host")?.split("=")[1];

if (!file || !existsSync(file)) {
  console.error("Uso: node scripts/importacao/importar.mjs imports/<arquivo>.json [--check-photos] [--apply --confirm-host=<host>]");
  process.exit(1);
}

const data = JSON.parse(readFileSync(file, "utf8"));
if (data.format !== "subleasy-import" || data.version !== 1) {
  console.error("Arquivo fora do formato subleasy-import v1.");
  process.exit(1);
}

const MAX_PHOTOS = 8; // src/lib/listing-options.ts
const PHOTOS_BUCKET = "listing-photos";

// ---------- Plano: o que cada registro vira ----------

const advertisers = new Map(data.advertisers.map((a) => [a.source_id, a]));
const skipped = []; // { source_id, title, reason }
const notes = []; // { source_id, note }
const plans = [];

function cut(title) {
  if (title.length <= 70) return title;
  const head = title.slice(0, 70);
  const space = head.lastIndexOf(" ");
  return (space > 40 ? head.slice(0, space) : head).replace(/[\s\-–|,:]+$/, "");
}

function toWhatsapp(digits) {
  if (!digits) return null;
  const only = String(digits).replace(/\D/g, "");
  const national = only.startsWith("55") && only.length > 11 ? only.slice(2) : only;
  return /^[0-9]{10,11}$/.test(national) ? `+55${national}` : null;
}

function slugOf(title) {
  const base = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base}-${randomUUID().slice(0, 6)}`;
}

for (const l of data.listings) {
  const skip = (reason) => skipped.push({ source_id: l.source_id, title: l.title, reason });
  if (l.status === "removed") {
    skip("excluído no WordPress (só entra nas métricas da plataforma)");
    continue;
  }
  const advertiser = advertisers.get(l.advertiser_source_id);
  if (!advertiser?.email) {
    skip("anunciante sem e-mail");
    continue;
  }

  const problems = [];
  if (!l.title || l.title.trim().length < 10) problems.push("título com menos de 10 caracteres");
  if (!(l.price >= 10)) problems.push("preço ausente ou abaixo de R$ 10");
  if (!l.billing_type) problems.push("sem tipo de cobrança");
  if (!l.address.city) problems.push("sem cidade");
  if (!/^[A-Z]{2}$/.test(l.address.state ?? "")) problems.push("sem UF");
  if (!l.address.neighborhood) problems.push("sem bairro");
  const whatsapp = toWhatsapp(l.contact.whatsapp) ?? toWhatsapp(advertiser.whatsapp);
  if (!l.photos.length) notes.push({ source_id: l.source_id, note: "sem foto; o anunciante envia ao editar" });
  if (!whatsapp) notes.push({ source_id: l.source_id, note: "sem WhatsApp; entra sem contato e o anunciante informa ao editar" });
  if (problems.length) {
    skip(problems.join("; "));
    continue;
  }

  if (l.title.length > 70) notes.push({ source_id: l.source_id, note: `título cortado de ${l.title.length} para ${cut(l.title).length} caracteres` });
  if (l.photos.length > MAX_PHOTOS) notes.push({ source_id: l.source_id, note: `${l.photos.length} fotos; entram as ${MAX_PHOTOS} primeiras` });
  if (l.space_type_labels.length > 1 || l.issues.includes("sem_tipo")) {
    notes.push({ source_id: l.source_id, note: `tipo "${l.space_type}" (WordPress: ${l.space_type_labels.join(", ") || "nenhum"})` });
  }

  const wa = l.metrics.whatsapp_clicks_monthly ?? [];
  const views = (l.metrics.views_daily ?? []).map((d) => ({ day: d.date, n: d.visits > 0 ? d.visits : d.views })).filter((d) => d.n > 0);
  plans.push({ l, advertiser, whatsapp, title: cut(l.title.trim()), photos: l.photos.slice(0, MAX_PHOTOS), views, clicks: wa.filter((m) => m.clicks > 0) });
}

const owners = new Map(); // e-mail → anunciante
for (const p of plans) owners.set(p.advertiser.email.toLowerCase(), p.advertiser);

// ---------- Relatório ----------

const sum = (items, pick) => items.reduce((total, item) => total + pick(item), 0);
console.log(`\nArquivo: ${file}  (exportado em ${data.source.exported_at})`);
console.log(`Modo: ${apply ? "IMPORTAÇÃO REAL" : "simulação (nada é gravado)"}\n`);
console.log(`Anúncios no arquivo: ${data.listings.length}`);
console.log(`  entram como rascunho: ${plans.length}`);
console.log(`  pulados: ${skipped.length}`);
for (const s of skipped) console.log(`    - ${s.source_id} "${s.title.slice(0, 50)}": ${s.reason}`);
console.log(`Contas a criar ou reaproveitar: ${owners.size} (de ${data.advertisers.length} anunciantes no arquivo)`);
console.log(`Fotos a copiar: ${sum(plans, (p) => p.photos.length)}`);
console.log(`Eventos de visualização: ${sum(plans, (p) => sum(p.views, (v) => v.n))}   cliques no WhatsApp: ${sum(plans, (p) => sum(p.clicks, (c) => c.clicks))}`);
if (notes.length) {
  console.log("\nAjustes automáticos (o anunciante corrige na revisão):");
  for (const n of notes) console.log(`  - ${n.source_id}: ${n.note}`);
}

if (checkPhotos) {
  console.log("\nConferindo as fotos no WordPress...");
  const urls = plans.flatMap((p) => p.photos.map((url) => ({ id: p.l.source_id, url })));
  const broken = [];
  for (let i = 0; i < urls.length; i += 6) {
    await Promise.all(
      urls.slice(i, i + 6).map(async ({ id, url }) => {
        try {
          const res = await fetch(url, { method: "HEAD" });
          if (!res.ok) broken.push(`${id} ${res.status} ${url}`);
        } catch (error) {
          broken.push(`${id} ${error.message} ${url}`);
        }
      }),
    );
  }
  console.log(broken.length ? `  ${broken.length} foto(s) com problema:\n    ${broken.join("\n    ")}` : `  as ${urls.length} fotos respondem.`);
}

if (!apply) {
  console.log("\nSimulação concluída. Nada foi gravado.");
  process.exit(0);
}

// ---------- Importação real ----------

loadEnv(".env.local");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("\nFaltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.");
  process.exit(1);
}
const host = new URL(url).hostname;
if (confirmHost !== host) {
  console.error(`\nO destino é ${host}. Para confirmar, rode de novo com --confirm-host=${host}`);
  process.exit(1);
}

const { createClient } = await import("@supabase/supabase-js");
const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const must = (result, what) => {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data;
};

// 1. Contas: reaproveita quem já existe e cria as outras sem enviar e-mail.
const existing = new Map();
for (let page = 1; ; page++) {
  const { data: batch, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw new Error(`listUsers: ${error.message}`);
  for (const user of batch.users) if (user.email) existing.set(user.email.toLowerCase(), user.id);
  if (batch.users.length < 200) break;
}
const userIds = new Map();
let created = 0;
for (const [email, advertiser] of owners) {
  if (existing.has(email)) {
    userIds.set(email, existing.get(email));
    continue;
  }
  const { data: made, error } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { imported_from: "wordpress", source_id: advertiser.source_id, full_name: advertiser.name },
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  userIds.set(email, made.user.id);
  created++;
}
console.log(`\nContas: ${created} criadas, ${owners.size - created} já existiam.`);

// 2. Anúncios.
const known = new Map(
  must(await db.from("listing_imports").select("source_id, listing_id"), "listing_imports").map((row) => [row.source_id, row.listing_id]),
);
let inserted = 0;
let updated = 0;
for (const p of plans) {
  const { l } = p;
  const owner = userIds.get(p.advertiser.email.toLowerCase());
  const listingId = known.get(l.source_id) ?? randomUUID();
  const isNew = !known.has(l.source_id);

  // Fotos só na primeira importação: copia, mede e guarda os caminhos.
  const photoFields = {};
  if (isNew) {
    const paths = [];
    const sizes = {};
    for (const photoUrl of p.photos) {
      const res = await fetch(photoUrl);
      if (!res.ok) {
        console.warn(`  ${l.source_id}: foto ${res.status}, ignorada: ${photoUrl}`);
        continue;
      }
      const bytes = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(bytes).metadata();
      const type = res.headers.get("content-type")?.split(";")[0] ?? `image/${meta.format}`;
      const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[type];
      if (!ext) {
        console.warn(`  ${l.source_id}: formato ${type} não aceito, ignorada: ${photoUrl}`);
        continue;
      }
      const path = `${owner}/${listingId}/${randomUUID()}.${ext}`;
      must(await db.storage.from(PHOTOS_BUCKET).upload(path, bytes, { contentType: type }), `upload ${path}`);
      paths.push(path);
      sizes[path] = [meta.width, meta.height];
    }
    photoFields.photos = paths;
    photoFields.photo_sizes = sizes;
  }

  const row = {
    id: listingId,
    owner_id: owner,
    title: p.title,
    description: l.description || null,
    space_type: l.space_type,
    billing_type: l.billing_type,
    price: l.price,
    city: l.address.city,
    state: l.address.state,
    neighborhood: l.address.neighborhood,
    zip_code: l.address.zip_code,
    amenities: l.amenities,
    status: "draft",
    created_at: l.dates.created_at,
    ...(isNew ? { slug: slugOf(p.title) } : {}),
    ...photoFields,
  };
  // upsert não serve para quem já existe: sem slug ele tenta inserir e o banco recusa.
  if (isNew) must(await db.from("listings").insert(row), `anúncio ${l.source_id}`);
  else must(await db.from("listings").update(row).eq("id", listingId), `anúncio ${l.source_id}`);

  // whatsapp_number é obrigatório no banco: sem número, o anúncio entra sem linha de contato.
  if (p.whatsapp) {
    must(
      await db.from("listing_contacts").upsert(
        { listing_id: listingId, whatsapp_number: p.whatsapp, street_address: [l.address.street, l.address.number, l.address.complement].filter(Boolean).join(", ") || null },
        { onConflict: "listing_id" },
      ),
      `contato ${l.source_id}`,
    );
  }

  must(
    await db.from("listing_imports").upsert(
      {
        source_id: l.source_id,
        listing_id: listingId,
        source_url: l.source_url,
        source_slug: l.seo?.post_name ?? null,
        source_status: l.source_status,
        wp_status: l.status,
        extras: l.extras,
      },
      { onConflict: "source_id" },
    ),
    `listing_imports ${l.source_id}`,
  );

  // Métricas: troca as importadas antes pelas do arquivo (visitor_id começa com "wp-import:").
  must(await db.from("listing_events").delete().eq("listing_id", listingId).like("visitor_id", "wp-import:%"), `limpar eventos ${l.source_id}`);
  const events = [
    ...p.views.flatMap((v) => Array.from({ length: v.n }, (_, i) => ({ listing_id: listingId, kind: "view", visitor_id: `wp-import:${v.day}:${i}`, day: v.day }))),
    ...p.clicks.flatMap((c) => Array.from({ length: c.clicks }, (_, i) => ({ listing_id: listingId, kind: "whatsapp_click", visitor_id: `wp-import:${c.month}:${i}`, day: `${c.month}-01` }))),
  ];
  for (let i = 0; i < events.length; i += 500) must(await db.from("listing_events").insert(events.slice(i, i + 500)), `eventos ${l.source_id}`);

  isNew ? inserted++ : updated++;
  console.log(`  ${l.source_id} → ${isNew ? "criado" : "atualizado"} (${listingId})`);
}
console.log(`\nConcluído: ${inserted} anúncios criados, ${updated} atualizados.`);

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}
