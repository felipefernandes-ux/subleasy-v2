/**
 * Versão dos Termos e da Política. Mude a data a cada alteração relevante:
 * o cadastro grava a versão aceita em profiles.terms_version.
 */
export const TERMS_VERSION = "2026-10-23";
export const TERMS_UPDATED_LABEL = "23 de outubro de 2026";

// Dados do responsável pelo Subleasy. Os que começam com [PREENCHER] aparecem
// destacados nas páginas até serem trocados pelos dados reais.
export const LEGAL = {
  controller: "[PREENCHER: nome ou razão social do responsável pelo Subleasy]",
  document: "[PREENCHER: CPF ou CNPJ]",
  address: "[PREENCHER: endereço para correspondência]",
  contactEmail: "[PREENCHER: e-mail de contato, ex.: contato@subleasy.com.br]",
  privacyEmail: "[PREENCHER: e-mail do encarregado, ex.: privacidade@subleasy.com.br]",
  dpoName: "[PREENCHER: nome do encarregado pelo tratamento de dados]",
};

export function isPlaceholder(value: string) {
  return value.startsWith("[PREENCHER");
}
