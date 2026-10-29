/**
 * Leitor de CSV (RFC 4180): campos entre aspas podem ter vírgula, aspas duplicadas e quebra de linha.
 * A planilha de prospecção tem a mensagem pronta numa coluna, com várias linhas.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^﻿/, "");

  for (let i = 0; i < source.length; i++) {
    const char = source[i]!;
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else field += char;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

/** Primeira linha como cabeçalho; cada linha vira um objeto com o cabeçalho em minúsculas e sem espaços nas pontas. */
export function csvToObjects(text: string): Array<Record<string, string>> {
  const [header, ...rows] = parseCsv(text);
  if (!header) return [];
  const keys = header.map((cell) => cell.trim().toLowerCase());
  return rows.map((cells) => Object.fromEntries(keys.map((key, index) => [key, (cells[index] ?? "").trim()])));
}
