/**
 * Versão dos Termos e da Política. Mude a data a cada alteração relevante:
 * o cadastro grava a versão aceita em profiles.terms_version.
 */
export const TERMS_VERSION = "2026-11-06";
export const TERMS_UPDATED_LABEL = "6 de novembro de 2026";

/**
 * Quem já tinha conta aceita a versão nova no próximo login, a partir desta data. Os Termos (seção 11)
 * prometem aviso por e-mail com pelo menos 15 dias de antecedência: mande o aviso antes e ajuste a data se precisar.
 * Quem cria conta depois da publicação aceita a versão nova no próprio cadastro.
 */
export const TERMS_EFFECTIVE_AT = "2026-11-22";
export const TERMS_EFFECTIVE_LABEL = "22 de novembro de 2026";

/** A conta aceitou uma versão anterior e a data de vigência da nova já chegou? */
export function needsTermsAcceptance(acceptedVersion: string | null | undefined) {
  return acceptedVersion !== TERMS_VERSION && Date.now() >= Date.parse(`${TERMS_EFFECTIVE_AT}T00:00:00-03:00`);
}

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
