/** Dados fictícios só para o visual do Super Admin. Nada aqui vem do banco. */

export type ListingStatus = "rascunho" | "em_revisao" | "no_ar" | "pausado" | "devolvido" | "convite_pendente" | "removido";
export type ListingOrigin = "anunciante" | "admin" | "importado";

export type Listing = {
  id: string;
  title: string;
  owner: string;
  ownerEmail: string;
  city: string;
  neighborhood: string;
  type: string;
  price: string;
  status: ListingStatus;
  origin: ListingOrigin;
  createdBy: string;
  submitted: string;
  expires: string;
  views: number;
  contacts: number;
  authorization?: string;
};

export const LISTINGS: Listing[] = [
  { id: "a1", title: "Sala de psicologia com divã e sofá", owner: "Marina Albuquerque", ownerEmail: "marina.a@exemplo.com", city: "Maringá", neighborhood: "Zona 7", type: "Psicologia", price: "R$ 35 / hora", status: "em_revisao", origin: "anunciante", createdBy: "Marina Albuquerque", submitted: "há 3 horas", expires: "—", views: 0, contacts: 0 },
  { id: "a2", title: "Consultório odontológico completo, cadeira Kavo", owner: "Dr. Rafael Tonin", ownerEmail: "rafael@tonin.odonto.br", city: "Londrina", neighborhood: "Centro", type: "Odontologia", price: "R$ 180 / turno", status: "em_revisao", origin: "anunciante", createdBy: "Dr. Rafael Tonin", submitted: "há 7 horas", expires: "—", views: 0, contacts: 0 },
  { id: "a3", title: "Sala ampla para fisioterapia e pilates", owner: "Clínica Movimento", ownerEmail: "contato@clinicamovimento.com.br", city: "Curitiba", neighborhood: "Batel", type: "Fisioterapia", price: "R$ 60 / hora", status: "em_revisao", origin: "anunciante", createdBy: "Clínica Movimento", submitted: "ontem", expires: "—", views: 0, contacts: 0 },
  { id: "a4", title: "Consultório de nutrição, recepção compartilhada", owner: "Beatriz Lemos", ownerEmail: "bia.lemos@exemplo.com", city: "Maringá", neighborhood: "Zona 1", type: "Nutrição", price: "R$ 120 / turno", status: "no_ar", origin: "anunciante", createdBy: "Beatriz Lemos", submitted: "há 5 dias", expires: "em 25 dias", views: 214, contacts: 9 },
  { id: "a5", title: "Sala de atendimento para terapia e coaching", owner: "Paulo Henrique Matos", ownerEmail: "paulo.matos@exemplo.com", city: "Cascavel", neighborhood: "Centro", type: "Psicologia", price: "R$ 30 / hora", status: "no_ar", origin: "admin", createdBy: "Felipe Fernandes", submitted: "há 12 dias", expires: "em 18 dias", views: 389, contacts: 14, authorization: "WhatsApp, 14/10/2026" },
  { id: "a6", title: "Consultório de dermatologia com maca e foco", owner: "Dra. Camila Ferraz", ownerEmail: "camila.ferraz@exemplo.com", city: "Maringá", neighborhood: "Zona 3", type: "Medicina", price: "R$ 220 / turno", status: "no_ar", origin: "anunciante", createdBy: "Dra. Camila Ferraz", submitted: "há 20 dias", expires: "em 10 dias", views: 502, contacts: 21 },
  { id: "a7", title: "Sala de estética facial equipada", owner: "Studio Pele Viva", ownerEmail: "oi@pelevivastudio.com.br", city: "Sarandi", neighborhood: "Centro", type: "Estética", price: "R$ 90 / turno", status: "pausado", origin: "anunciante", createdBy: "Studio Pele Viva", submitted: "há 31 dias", expires: "—", views: 148, contacts: 3 },
  { id: "a8", title: "Consultório de fonoaudiologia", owner: "Larissa Prado", ownerEmail: "larissa.prado@exemplo.com", city: "Londrina", neighborhood: "Gleba Palhano", type: "Fonoaudiologia", price: "R$ 45 / hora", status: "devolvido", origin: "anunciante", createdBy: "Larissa Prado", submitted: "há 2 dias", expires: "—", views: 0, contacts: 0 },
  { id: "a9", title: "Sala de psiquiatria no centro de Maringá", owner: "Antônio C. Veloso", ownerEmail: "antonio.veloso@exemplo.com", city: "Maringá", neighborhood: "Centro", type: "Medicina", price: "R$ 150 / turno", status: "convite_pendente", origin: "importado", createdBy: "Importação WordPress", submitted: "há 9 dias", expires: "convite vence em 21 dias", views: 0, contacts: 0, authorization: "Importação, 18/10/2026" },
  { id: "a10", title: "Consultório com duas salas de atendimento", owner: "Juliana Mori", ownerEmail: "ju.mori@exemplo.com", city: "Paiçandu", neighborhood: "Centro", type: "Psicologia", price: "R$ 28 / hora", status: "convite_pendente", origin: "importado", createdBy: "Importação WordPress", submitted: "há 9 dias", expires: "convite vence em 21 dias", views: 0, contacts: 0, authorization: "Importação, 18/10/2026" },
  { id: "a11", title: "Sala de acupuntura e massagem", owner: "Ricardo Sato", ownerEmail: "ricardo.sato@exemplo.com", city: "Maringá", neighborhood: "Zona 2", type: "Terapias", price: "R$ 50 / hora", status: "convite_pendente", origin: "importado", createdBy: "Importação WordPress", submitted: "há 9 dias", expires: "convite vence em 3 dias", views: 0, contacts: 0, authorization: "Importação, 18/10/2026" },
  { id: "a12", title: "Clínica pequena com sala de ultrassom", owner: "Dra. Helena Duarte", ownerEmail: "helena.duarte@exemplo.com", city: "Foz do Iguaçu", neighborhood: "Centro", type: "Medicina", price: "R$ 260 / turno", status: "removido", origin: "anunciante", createdBy: "Dra. Helena Duarte", submitted: "há 40 dias", expires: "—", views: 77, contacts: 1 },
];

export type UserStatus = "ativo" | "convite_pendente" | "suspenso";
export type Role = "anunciante" | "cliente" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  city: string;
  roles: Role[];
  status: UserStatus;
  joined: string;
  listings: number;
  marketing: boolean;
};

export const USERS: User[] = [
  { id: "u1", name: "Marina Albuquerque", email: "marina.a@exemplo.com", whatsapp: "(44) 99812-3344", city: "Maringá", roles: ["anunciante"], status: "ativo", joined: "26/10/2026", listings: 1, marketing: true },
  { id: "u2", name: "Dr. Rafael Tonin", email: "rafael@tonin.odonto.br", whatsapp: "(43) 99120-8821", city: "Londrina", roles: ["anunciante"], status: "ativo", joined: "26/10/2026", listings: 1, marketing: false },
  { id: "u3", name: "Beatriz Lemos", email: "bia.lemos@exemplo.com", whatsapp: "(44) 99705-1290", city: "Maringá", roles: ["anunciante"], status: "ativo", joined: "21/10/2026", listings: 1, marketing: true },
  { id: "u4", name: "Paulo Henrique Matos", email: "paulo.matos@exemplo.com", whatsapp: "(45) 99933-4410", city: "Cascavel", roles: ["anunciante"], status: "convite_pendente", joined: "14/10/2026", listings: 1, marketing: false },
  { id: "u5", name: "Camila Ferraz", email: "camila.ferraz@exemplo.com", whatsapp: "(44) 99660-7782", city: "Maringá", roles: ["anunciante", "cliente"], status: "ativo", joined: "07/10/2026", listings: 1, marketing: true },
  { id: "u6", name: "Studio Pele Viva", email: "oi@pelevivastudio.com.br", whatsapp: "(44) 99144-0021", city: "Sarandi", roles: ["anunciante"], status: "ativo", joined: "25/09/2026", listings: 1, marketing: true },
  { id: "u7", name: "Gustavo Ribeiro", email: "gu.ribeiro@exemplo.com", whatsapp: "(41) 99877-6001", city: "Curitiba", roles: ["cliente"], status: "ativo", joined: "19/10/2026", listings: 0, marketing: true },
  { id: "u8", name: "Perfil suspeito 4471", email: "contato4471@exemplo.net", whatsapp: "(11) 90000-0000", city: "São Paulo", roles: ["anunciante"], status: "suspenso", joined: "02/10/2026", listings: 0, marketing: false },
  { id: "u9", name: "Felipe Fernandes", email: "felipefernandes.com@gmail.com", whatsapp: "(44) 99999-0000", city: "Maringá", roles: ["admin"], status: "ativo", joined: "01/09/2026", listings: 0, marketing: false },
];

export type DataRequest = {
  id: string;
  person: string;
  email: string;
  kind: "Excluir conta" | "Exportar dados" | "Corrigir dados";
  received: string;
  dueIn: number;
  status: "aberto" | "em_andamento" | "concluido";
};

export const DATA_REQUESTS: DataRequest[] = [
  { id: "r1", person: "Roberta Nunes", email: "roberta.nunes@exemplo.com", kind: "Excluir conta", received: "20/10/2026", dueIn: 8, status: "aberto" },
  { id: "r2", person: "Cláudio Bastos", email: "claudio.b@exemplo.com", kind: "Exportar dados", received: "14/10/2026", dueIn: 2, status: "em_andamento" },
  { id: "r3", person: "Elisa Contreiras", email: "elisa.c@exemplo.com", kind: "Excluir conta", received: "02/10/2026", dueIn: -9, status: "concluido" },
];

export type LeadOrigin = "Cadastro com aceite" | "Cadastro sem aceite" | "WordPress atual" | "Formulário Avise-me" | "Mensagem a anúncio";

export type Lead = {
  id: string;
  name: string;
  email: string;
  city: string;
  origin: LeadOrigin;
  legalBasis: string;
  campaign: boolean;
  date: string;
};

export const LEADS: Lead[] = [
  { id: "l1", name: "Antônio C. Veloso", email: "antonio.veloso@exemplo.com", city: "Maringá", origin: "WordPress atual", legalBasis: "Legítimo interesse (art. 7º, IX)", campaign: true, date: "18/10/2026" },
  { id: "l2", name: "Juliana Mori", email: "ju.mori@exemplo.com", city: "Paiçandu", origin: "WordPress atual", legalBasis: "Legítimo interesse (art. 7º, IX)", campaign: true, date: "18/10/2026" },
  { id: "l3", name: "Ricardo Sato", email: "ricardo.sato@exemplo.com", city: "Maringá", origin: "WordPress atual", legalBasis: "Legítimo interesse (art. 7º, IX)", campaign: true, date: "18/10/2026" },
  { id: "l4", name: "Marina Albuquerque", email: "marina.a@exemplo.com", city: "Maringá", origin: "Cadastro com aceite", legalBasis: "Consentimento (art. 7º, I)", campaign: true, date: "26/10/2026" },
  { id: "l5", name: "Dr. Rafael Tonin", email: "rafael@tonin.odonto.br", city: "Londrina", origin: "Cadastro sem aceite", legalBasis: "Execução do contrato (art. 7º, V)", campaign: false, date: "26/10/2026" },
  { id: "l6", name: "Letícia Andrade", email: "leticia.a@exemplo.com", city: "Curitiba", origin: "Formulário Avise-me", legalBasis: "Consentimento, duplo opt-in", campaign: true, date: "23/10/2026" },
  { id: "l7", name: "Thiago Ramos", email: "thiago.r@exemplo.com", city: "Londrina", origin: "Mensagem a anúncio", legalBasis: "Finalidade (art. 6º, I)", campaign: false, date: "22/10/2026" },
  { id: "l8", name: "Sandra Oliveira", email: "sandra.o@exemplo.com", city: "Cascavel", origin: "Formulário Avise-me", legalBasis: "Consentimento, aguardando confirmação", campaign: false, date: "25/10/2026" },
];

export const ADMINS = [
  { id: "ad1", name: "Felipe Fernandes", email: "felipefernandes.com@gmail.com", role: "Super admin", twoFactor: true, lastSeen: "agora", since: "01/09/2026" },
];

export type AuditEntry = {
  id: string;
  when: string;
  who: string;
  action: string;
  target: string;
  reason: string;
  area: "Anúncios" | "Usuários" | "Leads" | "Configurações";
};

export const AUDIT: AuditEntry[] = [
  { id: "e1", when: "hoje, 09:42", who: "Felipe Fernandes", action: "Aprovou anúncio", target: "Sala de nutrição, Zona 1 (Beatriz Lemos)", reason: "—", area: "Anúncios" },
  { id: "e2", when: "hoje, 09:38", who: "Felipe Fernandes", action: "Devolveu anúncio", target: "Consultório de fonoaudiologia (Larissa Prado)", reason: "Fotos escuras; pedir a recepção e a sala de frente", area: "Anúncios" },
  { id: "e3", when: "ontem, 17:10", who: "Felipe Fernandes", action: "Criou anúncio em nome de", target: "Paulo Henrique Matos", reason: "Pedido por WhatsApp em 14/10/2026", area: "Anúncios" },
  { id: "e4", when: "ontem, 16:55", who: "Felipe Fernandes", action: "Convidou usuário", target: "Paulo Henrique Matos", reason: "Pedido de ajuda por telefone", area: "Usuários" },
  { id: "e5", when: "25/10, 11:20", who: "Felipe Fernandes", action: "Suspendeu conta", target: "Perfil suspeito 4471", reason: "Anúncio com contato de terceiros, suspeita de golpe", area: "Usuários" },
  { id: "e6", when: "24/10, 15:02", who: "Felipe Fernandes", action: "Consultou a ficha", target: "Roberta Nunes", reason: "Pedido de exclusão recebido por e-mail", area: "Usuários" },
  { id: "e7", when: "18/10, 10:14", who: "Felipe Fernandes", action: "Importou lista de leads", target: "WordPress atual (318 contatos)", reason: "Teste de legítimo interesse anexado", area: "Leads" },
  { id: "e8", when: "01/09, 08:00", who: "Felipe Fernandes", action: "Ativou 2FA", target: "Felipe Fernandes", reason: "—", area: "Configurações" },
];

export const DAILY_NUMBERS = {
  signups: { value: 11, delta: "+4 vs. ontem", series: [3, 5, 4, 7, 6, 9, 11] },
  liveListings: { value: 142, delta: "+6 esta semana", series: [128, 131, 133, 135, 137, 139, 142] },
  contacts: { value: 87, delta: "últimos 7 dias", series: [9, 12, 10, 14, 11, 16, 15] },
};
