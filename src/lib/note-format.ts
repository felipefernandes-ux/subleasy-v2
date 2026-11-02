/**
 * Formato simples da nota de devolução do anúncio: parágrafos separados por linha em branco,
 * listas ("- item" ou "1. item") e **negrito**. O mesmo texto vale na caixa de edição, no e-mail
 * e na tela do anunciante; HTML nunca entra (quem desenha escapa o texto).
 */
export type NoteBlock = { type: "p"; text: string } | { type: "ul" | "ol"; items: string[] };
export type NoteSpan = { text: string; bold: boolean };

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

export function parseNote(note: string): NoteBlock[] {
  const blocks: NoteBlock[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ type: "p", text: paragraph.join("\n") });
    paragraph = [];
  };
  for (const raw of note.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    const match = bullet ?? numbered;
    if (match) {
      flush();
      const type = bullet ? "ul" : "ol";
      const last = blocks[blocks.length - 1];
      if (last && last.type === type) last.items.push(match[1]);
      else blocks.push({ type, items: [match[1]] });
    } else if (!line.trim()) {
      flush();
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}

/** Separa o texto em trechos comuns e em negrito (**assim**). */
export function parseInline(text: string): NoteSpan[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) => (part.startsWith("**") && part.endsWith("**") && part.length > 4 ? { text: part.slice(2, -2), bold: true } : { text: part, bold: false }));
}

/** Texto simples (e-mail sem HTML): tira o negrito e deixa as listas com "- ". */
export function noteToPlainText(note: string): string {
  return parseNote(note)
    .map((block) => {
      if (block.type === "p") return parseInline(block.text).map((s) => s.text).join("");
      return block.items.map((item, i) => `${block.type === "ol" ? `${i + 1}.` : "-"} ${parseInline(item).map((s) => s.text).join("")}`).join("\n");
    })
    .join("\n\n");
}
