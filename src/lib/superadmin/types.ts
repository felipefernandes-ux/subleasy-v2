/** Tipos do Super Admin. Os dados vêm do banco (src/lib/superadmin/*); nada aqui é fictício. */

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
