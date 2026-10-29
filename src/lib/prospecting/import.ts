import { csvToObjects } from "./csv";
import { SPECIALTIES, type Specialty } from "./status";

/** Linha pronta para gravar em public.prospects. */
export type ProspectRow = {
  place_id: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  instagram: string | null;
  website: string | null;
  email: string | null;
  priority: number | null;
  message_model: "A" | "B" | null;
  treatment: string | null;
  recipient: string | null;
  specialty: Specialty | null;
  link_note: string | null;
};

const text = (value: string | undefined) => (value && value.trim() !== "" ? value.trim() : null);

/** Dígitos de um telefone brasileiro com 55 na frente, só se for celular (WhatsApp). Celular antigo de 8 dígitos ganha o 9. */
export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) digits = digits.slice(2);
  if (digits.length === 10 && digits[2] === "9") digits = `${digits.slice(0, 2)}9${digits.slice(2)}`;
  return digits.length === 11 && digits[2] === "9" ? `55${digits}` : null;
}

/** Celular que a planilha tem: o do site primeiro, o do Maps depois, dando preferência ao DDD 44 (Maringá). */
function pickWhatsApp(...candidates: Array<string | null | undefined>) {
  const numbers = candidates.map(toWhatsAppNumber).filter((n): n is string => n !== null);
  return numbers.find((n) => n.startsWith("5544")) ?? numbers[0] ?? null;
}

/** Sobreloja, sala e andar não são bairro; “Zona 04”, “Centro” e “Jardim Alvorada” são. */
const NOT_NEIGHBORHOOD = /^(sl|sala|lj|loja|sobreloja|cj|conj|andar|\d)/i;

export function parseNeighborhood(address: string | null): string | null {
  if (!address) return null;
  const parts = address.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 1; i--) {
    const part = parts[i]!.replace(/^Maringá\s*-?\s*/i, "");
    if (part && !NOT_NEIGHBORHOOD.test(part) && part.length <= 40) return part.replace(/^Zona\s+(\d)$/i, "Zona 0$1").replace(/^Zona\s+0?(\d{2})$/i, "Zona $1");
  }
  return null;
}

export type ParsedSheet = { rows: ProspectRow[]; skipped: number; error?: string };

/** Lê o CSV da planilha de prospecção pelo nome das colunas (a ordem não importa). */
export function parseProspectSheet(csv: string): ParsedSheet {
  const objects = csvToObjects(csv);
  if (objects.length === 0) return { rows: [], skipped: 0, error: "A planilha está vazia." };
  if (!("nome" in objects[0]!)) return { rows: [], skipped: 0, error: "Não achei a coluna “nome” na primeira linha da aba." };

  const rows: ProspectRow[] = [];
  let skipped = 0;
  for (const row of objects) {
    const name = text(row["nome"]);
    if (!name) {
      skipped++;
      continue;
    }
    const model = text(row["modelo"]);
    const specialty = text(row["especialidade"]);
    const priority = Number.parseInt(row["prioridade"] ?? "", 10);
    rows.push({
      place_id: text(row["place_id"]),
      name: name.slice(0, 200),
      address: text(row["endereço"]),
      phone: text(row["telefone"]),
      // O número que a planilha escolheu, se houver; senão, o melhor celular das duas colunas.
      whatsapp_number: toWhatsAppNumber(row["número whatsapp usado"]) ?? pickWhatsApp(row["whatsapp (site)"], row["celular (maps)"]),
      instagram: text(row["instagram"]),
      website: text(row["site"]),
      email: text(row["e-mail geral"]),
      priority: Number.isFinite(priority) ? priority : null,
      message_model: model === "A" || model === "B" ? model : null,
      treatment: text(row["tratamento"]),
      recipient: text(row["destinatário (modelo a)"]),
      specialty: specialty && specialty in SPECIALTIES ? (specialty as Specialty) : null,
      link_note: text(row["obs. do link"]),
    });
  }
  return { rows, skipped };
}
