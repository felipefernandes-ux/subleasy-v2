// Comparação entre duas versões de um anúncio (antes e depois de uma edição). Funções puras, sem banco.
import { AMENITIES, BILLING_TYPES, HIGHLIGHTS, OFFERS, SPACE_TYPES, formatPrice, formatWhatsApp } from "./listing-options";

/** Retrato de um anúncio num momento: o que o anunciante edita e o admin precisa conferir. */
export type ListingSnapshot = {
  title: string;
  short_summary: string | null;
  description: string | null;
  space_type: string;
  space_type_other: string | null;
  billing_type: string;
  price: number;
  min_rental_period: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string | null;
  show_exact_location: boolean;
  amenities: string[];
  highlights: string[];
  offers: string[];
  rules: string[];
  photos: string[];
  whatsapp_number: string | null;
  contact_email: string | null;
  street_address: string | null;
};

export type FieldChange = {
  label: string;
  before: string;
  after: string;
  /** Em campos de lista: o que entrou e o que saiu, em vez das duas listas inteiras. */
  added?: string[];
  removed?: string[];
};

export type PhotoChange = {
  added: string[];
  removed: string[];
  /** A primeira foto (capa do card e da página) mudou. */
  coverChanged: boolean;
  /** As mesmas fotos, em outra ordem. */
  reordered: boolean;
};

export type ListingDiff = {
  fields: FieldChange[];
  description: { before: string; after: string } | null;
  photos: PhotoChange;
  /** Nada mudou: a edição foi enviada igual à versão no ar. */
  empty: boolean;
};

const EMPTY = "—";
const text = (value: string | null | undefined) => (value ?? "").trim();
const shown = (value: string | null | undefined) => text(value) || EMPTY;
const label = (labels: Record<string, string>) => (key: string) => labels[key] ?? key;
const OFFER_LABELS = Object.fromEntries(Object.entries(OFFERS).map(([key, offer]) => [key, offer.title]));

type Scalar = { label: string; read: (snapshot: ListingSnapshot) => string };
type ListField = { label: string; read: (snapshot: ListingSnapshot) => string[]; name: (key: string) => string };

// Na ordem em que o admin confere: o que o visitante vê primeiro, depois localização e contato.
const SCALARS: Scalar[] = [
  { label: "Título", read: (s) => shown(s.title) },
  { label: "Resumo", read: (s) => shown(s.short_summary) },
  { label: "Área de atuação", read: (s) => label(SPACE_TYPES)(s.space_type) },
  { label: "Outro espaço", read: (s) => shown(s.space_type_other) },
  { label: "Preço", read: (s) => `${formatPrice(Number(s.price))} · ${label(BILLING_TYPES)(s.billing_type).toLowerCase()}` },
  { label: "Período mínimo", read: (s) => shown(s.min_rental_period) },
  { label: "Bairro", read: (s) => shown(s.neighborhood) },
  { label: "Cidade / UF", read: (s) => `${text(s.city)} / ${text(s.state)}` },
  { label: "CEP", read: (s) => shown(s.zip_code) },
  { label: "Mapa", read: (s) => (s.show_exact_location ? "Ponto exato" : "Área aproximada") },
  { label: "Endereço completo (privado)", read: (s) => shown(s.street_address) },
  { label: "WhatsApp", read: (s) => (s.whatsapp_number ? formatWhatsApp(s.whatsapp_number) : EMPTY) },
  { label: "E-mail de contato", read: (s) => shown(s.contact_email) },
];

const LISTS: ListField[] = [
  { label: "Comodidades", read: (s) => s.amenities ?? [], name: label(AMENITIES) },
  { label: "Destaques", read: (s) => s.highlights ?? [], name: label(HIGHLIGHTS) },
  { label: "Ofertas", read: (s) => s.offers ?? [], name: label(OFFER_LABELS) },
  { label: "Regras", read: (s) => (s.rules ?? []).map((rule) => rule.trim()).filter(Boolean), name: (rule) => rule },
];

export function diffListing(before: ListingSnapshot, after: ListingSnapshot): ListingDiff {
  const fields: FieldChange[] = [];
  for (const field of SCALARS) {
    const [a, b] = [field.read(before), field.read(after)];
    if (a !== b) fields.push({ label: field.label, before: a, after: b });
  }
  for (const field of LISTS) {
    const [a, b] = [field.read(before), field.read(after)];
    const added = b.filter((key) => !a.includes(key));
    const removed = a.filter((key) => !b.includes(key));
    if (added.length || removed.length) {
      const join = (keys: string[]) => (keys.length ? keys.map(field.name).join(", ") : EMPTY);
      fields.push({ label: field.label, before: join(a), after: join(b), added: added.map(field.name), removed: removed.map(field.name) });
    }
  }

  const description = text(before.description) === text(after.description) ? null : { before: text(before.description), after: text(after.description) };

  const [old, now] = [before.photos ?? [], after.photos ?? []];
  const added = now.filter((path) => !old.includes(path));
  const removed = old.filter((path) => !now.includes(path));
  const sameSet = added.length === 0 && removed.length === 0;
  const photos: PhotoChange = {
    added,
    removed,
    coverChanged: (old[0] ?? null) !== (now[0] ?? null),
    reordered: sameSet && old.some((path, index) => now[index] !== path),
  };

  const empty = fields.length === 0 && !description && added.length === 0 && removed.length === 0 && !photos.reordered;
  return { fields, description, photos, empty };
}

export type WordPart = { kind: "same" | "added" | "removed"; text: string };

// Acima disso a tabela de comparação fica pesada; a descrição tem de 80 a 160 palavras, então quase nunca chega lá.
const MAX_CELLS = 600_000;

/**
 * Diferença palavra a palavra entre duas versões de um texto (maior subsequência comum).
 * Devolve as partes de cada lado: no antes, o que saiu; no depois, o que entrou. Espaços e quebras de linha são preservados.
 */
export function diffWords(before: string, after: string): { before: WordPart[]; after: WordPart[] } {
  const a = before.split(/(\s+)/).filter(Boolean);
  const b = after.split(/(\s+)/).filter(Boolean);
  if (a.length * b.length > MAX_CELLS) {
    return { before: [{ kind: "removed", text: before }], after: [{ kind: "added", text: after }] };
  }

  // lcs[i][j]: tamanho da maior subsequência comum entre a[i..] e b[j..].
  const lcs = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const left: WordPart[] = [];
  const right: WordPart[] = [];
  const push = (parts: WordPart[], kind: WordPart["kind"], token: string) => {
    // Espaço entre duas palavras trocadas não precisa de destaque.
    const effective = /^\s+$/.test(token) ? "same" : kind;
    const last = parts.at(-1);
    if (last && last.kind === effective) last.text += token;
    else parts.push({ kind: effective, text: token });
  };

  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push(left, "same", a[i++]);
      push(right, "same", b[j++]);
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      push(left, "removed", a[i++]);
    } else {
      push(right, "added", b[j++]);
    }
  }
  while (i < a.length) push(left, "removed", a[i++]);
  while (j < b.length) push(right, "added", b[j++]);
  return { before: joinRuns(left), after: joinRuns(right) };
}

/** "[-profissionais] [-da] [-saúde]" vira um destaque só: o espaço entre duas trocas do mesmo tipo entra na troca. */
function joinRuns(parts: WordPart[]): WordPart[] {
  const out: WordPart[] = [];
  for (let k = 0; k < parts.length; k++) {
    const part = parts[k];
    const prev = out.at(-1);
    const next = parts[k + 1];
    const gap = part.kind === "same" && /^[ \t]+$/.test(part.text);
    if (gap && prev && next && prev.kind !== "same" && prev.kind === next.kind) {
      prev.text += part.text + next.text;
      k++;
    } else if (prev && prev.kind === part.kind) {
      prev.text += part.text;
    } else {
      out.push({ ...part });
    }
  }
  return out;
}
