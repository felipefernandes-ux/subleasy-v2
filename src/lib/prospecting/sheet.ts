/**
 * Baixa uma aba do Google Sheets como CSV pelo link de compartilhamento. Funciona quando a planilha
 * está como “qualquer pessoa com o link pode ver”; planilha privada devolve a tela de login do Google.
 */
export type SheetFetch = { ok: true; csv: string } | { ok: false; error: string };

export function parseSheetUrl(url: string): { id: string; gid: string } | null {
  const match = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;
  const gid = url.match(/[#&?]gid=(\d+)/)?.[1] ?? "0";
  return { id: match[1]!, gid };
}

export async function fetchSheetCsv(url: string): Promise<SheetFetch> {
  const sheet = parseSheetUrl(url.trim());
  if (!sheet) return { ok: false, error: "O endereço não parece ser de uma planilha do Google Sheets." };

  try {
    const response = await fetch(`https://docs.google.com/spreadsheets/d/${sheet.id}/export?format=csv&gid=${sheet.gid}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || type.includes("text/html")) {
      return {
        ok: false,
        error:
          "O Google não deixou ler a planilha. Em Compartilhar, deixe “Qualquer pessoa com o link” como leitor, ou baixe a aba em CSV e envie o arquivo.",
      };
    }
    return { ok: true, csv: await response.text() };
  } catch {
    return { ok: false, error: "Não foi possível baixar a planilha agora. Tente de novo ou envie o CSV." };
  }
}
