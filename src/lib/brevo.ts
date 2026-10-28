/**
 * Cliente do Brevo (API REST v3, sem SDK), só para o Super Admin enviar a base de leads.
 * A chave BREVO_API_KEY (xkeysib-…) fica só no servidor. Se a conta tiver IPs autorizados,
 * a Vercel não tem IP fixo: desative a restrição em app.brevo.com/security/authorised_ips.
 */

const BASE_URL = "https://api.brevo.com/v3";
export const BREVO_LIST_NAME = "Convite 2.0";

/** Atributos que o template de e-mail usa. FIRSTNAME, AD_TITLE e INTEREST_URL aparecem no e-mail; o resto serve para segmentar. */
const ATTRIBUTES = ["FIRSTNAME", "AD_TITLE", "INTEREST_URL", "SEGMENTO", "CIDADE", "SUBLEASY_ID"] as const;
const IMPORT_CHUNK = 1000;

export class BrevoError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export type BrevoContact = {
  email: string;
  attributes: Partial<Record<(typeof ATTRIBUTES)[number], string>>;
};

export type BrevoImportResult = { sent: number; processIds: number[] };

export const brevoConfigured = () => Boolean(process.env.BREVO_API_KEY);

async function call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new BrevoError(0, "Falta BREVO_API_KEY no .env.local.");

  const response = await fetch(`${BASE_URL}${path}`, {
    method: init.method ?? "GET",
    headers: { "api-key": apiKey, accept: "application/json", "content-type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!response.ok) {
    const message = (data as { message?: string } | null)?.message ?? `Brevo respondeu ${response.status}.`;
    throw new BrevoError(response.status, message);
  }
  return data as T;
}

/** Cria no Brevo os atributos que ainda não existem. Pode rodar quantas vezes quiser. */
export async function ensureAttributes() {
  const { attributes } = await call<{ attributes: Array<{ name: string }> }>("/contacts/attributes");
  const existing = new Set(attributes.map((attribute) => attribute.name));
  const created: string[] = [];
  for (const name of ATTRIBUTES) {
    if (existing.has(name)) continue;
    await call(`/contacts/attributes/normal/${name}`, { method: "POST", body: { type: "text" } });
    created.push(name);
  }
  return created;
}

/** Devolve o id da lista "Convite 2.0", criando a lista (na primeira pasta da conta) se não existir. */
export async function ensureList(name = BREVO_LIST_NAME) {
  const { lists } = await call<{ lists: Array<{ id: number; name: string }> }>("/contacts/lists?limit=50");
  const found = lists.find((list) => list.name === name);
  if (found) return found.id;

  const { folders } = await call<{ folders: Array<{ id: number }> }>("/contacts/folders?limit=1");
  const folderId = folders[0]?.id;
  if (!folderId) throw new BrevoError(0, "A conta do Brevo não tem nenhuma pasta de listas.");
  const { id } = await call<{ id: number }>("/contacts/lists", { method: "POST", body: { name, folderId } });
  return id;
}

/**
 * Envia contatos em lote para a lista. Quem já existe é atualizado; quem se descadastrou
 * no Brevo continua descadastrado (a importação não reativa).
 */
export async function importContacts(listId: number, contacts: BrevoContact[]): Promise<BrevoImportResult> {
  const processIds: number[] = [];
  for (let start = 0; start < contacts.length; start += IMPORT_CHUNK) {
    const chunk = contacts.slice(start, start + IMPORT_CHUNK);
    const { processId } = await call<{ processId: number }>("/contacts/import", {
      method: "POST",
      body: {
        listIds: [listId],
        jsonBody: chunk,
        updateExistingContacts: true,
        emptyContactsAttributes: false,
      },
    });
    processIds.push(processId);
  }
  return { sent: contacts.length, processIds };
}

/** Situação de uma importação: o Brevo processa em segundo plano. */
export async function importStatus(processId: number) {
  return call<{ status: string }>(`/processes/${processId}`);
}
