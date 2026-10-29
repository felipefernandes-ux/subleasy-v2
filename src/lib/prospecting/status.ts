/** Status do prospect, na ordem do funil. O texto de cada um é o que aparece no Super Admin. */
export const PROSPECT_STATUSES = {
  novo: "Novo",
  mensagem_enviada: "Mensagem enviada",
  previa_enviada: "Prévia enviada",
  respondeu: "Respondeu",
  quer_anuncio: "Quer o anúncio",
  dados_enviados: "Mandou os dados",
  publicado: "Publicado",
  sem_resposta: "Sem resposta",
  nao_contatar: "Não contatar",
} as const;
export type ProspectStatus = keyof typeof PROSPECT_STATUSES;
export const PROSPECT_STATUS_KEYS = Object.keys(PROSPECT_STATUSES) as [ProspectStatus, ...ProspectStatus[]];

export function isProspectStatus(value: string): value is ProspectStatus {
  return value in PROSPECT_STATUSES;
}

export const SPECIALTIES = {
  odonto: "Odontologia",
  psi: "Psicologia",
  est: "Estética",
  med: "Medicina",
  fisio: "Fisioterapia e nutrição",
  centro: "Centro médico",
} as const;
export type Specialty = keyof typeof SPECIALTIES;

/** Tipo de sala (listings.space_type) que cada especialidade vira na prévia. */
export const SPECIALTY_SPACE_TYPE: Record<Specialty, string> = {
  odonto: "odontologia",
  psi: "psicologia",
  est: "estetica",
  med: "consultorio_medico",
  fisio: "fisioterapia",
  centro: "consultorio_medico",
};
