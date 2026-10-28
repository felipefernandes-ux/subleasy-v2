/**
 * Versão dos Termos e da Política. Mude a data a cada alteração relevante:
 * o cadastro grava a versão aceita em profiles.terms_version.
 */
export const TERMS_VERSION = "2026-10-28";
export const TERMS_UPDATED_LABEL = "28 de outubro de 2026";

// Dados do responsável pelo Subleasy (aparecem nos Termos e na Política de privacidade).
// Valores que começam com [PREENCHER] saem destacados nas páginas até serem trocados.
export const LEGAL = {
  controller: "Lavuh Comunicação Digital Ltda",
  document: "24.216.042/0001-22",
  address: "Avenida Cerro Azul, 864, sala A fundos, Zona 02, Maringá, PR, CEP 87010-000",
  contactEmail: "contato@subleasy.com.br",
  privacyEmail: "privacidade@subleasy.com.br",
  dpoName: "Felipe Fernandes",
};

export function isPlaceholder(value: string) {
  return value.startsWith("[PREENCHER");
}
