import {
  AddressBookIcon,
  ArrowsLeftRightIcon,
  BuildingsIcon,
  ChartLineUpIcon,
  ClipboardTextIcon,
  CursorClickIcon,
  DoorOpenIcon,
  DownloadSimpleIcon,
  EnvelopeSimpleIcon,
  FlagIcon,
  GearSixIcon,
  HouseSimpleIcon,
  IdentificationCardIcon,
  ListChecksIcon,
  MegaphoneIcon,
  PaperPlaneTiltIcon,
  PlusCircleIcon,
  ProhibitIcon,
  ReceiptIcon,
  ScrollIcon,
  ShieldCheckIcon,
  SparkleIcon,
  TargetIcon,
  TrayArrowDownIcon,
  UploadSimpleIcon,
  UserPlusIcon,
  UsersIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";

/** MVP vai ao ar agora; "fase2" e "depois" ganham o selo Soon e uma tela de espera. */
export type Phase = "mvp" | "fase2" | "depois";

export type NavItem = {
  href: string;
  label: string;
  icon: Icon;
  phase: Phase;
  /** Resumo do que a função vai fazer, usado na tela "Soon". */
  summary?: string;
  /** Observação do plano de execução. */
  note?: string;
};

export type NavGroup = {
  label: string;
  /** Ícone e página principal da área: é o que aparece no menu lateral. */
  icon: Icon;
  href: string;
  /** Subpáginas, mostradas só no flyout ao passar o mouse. */
  items: NavItem[];
};

// O Super Admin vive na raiz de admin.subleasy.com.br; o proxy reescreve para /superadmin.
const base = "";

export const HOME: NavItem = { href: "/", label: "Início", icon: HouseSimpleIcon, phase: "mvp" };

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Anúncios",
    icon: BuildingsIcon,
    href: `${base}/anuncios`,
    items: [
      { href: `${base}/anuncios`, label: "Todos os anúncios", icon: BuildingsIcon, phase: "mvp" },
      { href: `${base}/anuncios/novo`, label: "Novo anúncio", icon: PlusCircleIcon, phase: "mvp" },
      { href: `${base}/anuncios/revisao`, label: "Em revisão", icon: ListChecksIcon, phase: "mvp" },
      { href: `${base}/anuncios/importados`, label: "Importados sem dono", icon: TrayArrowDownIcon, phase: "mvp" },
      {
        href: `${base}/anuncios/transferir`,
        label: "Transferir",
        icon: ArrowsLeftRightIcon,
        phase: "fase2",
        summary:
          "Passa um anúncio para outro anunciante. As duas contas recebem um aviso por e-mail e a troca entra na auditoria.",
      },
      {
        href: `${base}/anuncios/importar`,
        label: "Importar em lote",
        icon: UploadSimpleIcon,
        phase: "fase2",
        summary:
          "Importa os anúncios do Subleasy atual em lote, cada um com dono pendente até o anunciante aceitar o convite.",
        note: "Depende de criar anúncio em nome de alguém.",
      },
      {
        href: `${base}/anuncios/destaques`,
        label: "Destaques",
        icon: SparkleIcon,
        phase: "depois",
        summary: "Destaca ou patrocina um anúncio manualmente, junto com a monetização.",
      },
    ],
  },
  {
    label: "Usuários",
    icon: UsersIcon,
    href: `${base}/usuarios`,
    items: [
      { href: `${base}/usuarios`, label: "Todos os usuários", icon: UsersIcon, phase: "mvp" },
      { href: `${base}/usuarios/novo`, label: "Convidar usuário", icon: UserPlusIcon, phase: "mvp" },
      { href: `${base}/usuarios/pedidos`, label: "Pedidos do titular", icon: ScrollIcon, phase: "mvp" },
      {
        href: `${base}/usuarios/exportacao`,
        label: "Exportar dados",
        icon: DownloadSimpleIcon,
        phase: "fase2",
        summary:
          "Gera um JSON com tudo que o Subleasy guarda de uma pessoa, para pedidos de acesso e portabilidade (LGPD, art. 18, II e V).",
        note: "A pessoa já exporta sozinha em /configuracoes.",
      },
      {
        href: `${base}/usuarios/verificacao`,
        label: "Verificação",
        icon: IdentificationCardIcon,
        phase: "fase2",
        summary: "Marca a identidade como verificada depois de conferir documento e selfie. A imagem não fica guardada.",
      },
    ],
  },
  {
    label: "Leads",
    icon: AddressBookIcon,
    href: `${base}/leads`,
    items: [
      { href: `${base}/leads`, label: "Base de leads", icon: AddressBookIcon, phase: "mvp" },
      { href: `${base}/leads/importar`, label: "Importar do WordPress", icon: UploadSimpleIcon, phase: "mvp" },
      {
        href: `${base}/leads/segmentos`,
        label: "Segmentos",
        icon: UsersThreeIcon,
        phase: "fase2",
        summary: "Segmentos salvos por cidade, papel, tipo de sala e status do anúncio, com a contagem de quem recebe antes do envio.",
      },
      {
        href: `${base}/leads/campanhas`,
        label: "Campanhas",
        icon: PaperPlaneTiltIcon,
        phase: "fase2",
        summary: "Cria a campanha, envia um teste, agenda e envia pelo Resend, com o modelo visual do Subleasy.",
      },
      {
        href: `${base}/leads/supressao`,
        label: "Lista de supressão",
        icon: ProhibitIcon,
        phase: "fase2",
        summary: "Quem se descadastrou, teve erro permanente ou marcou spam nunca recebe de novo. Obrigatória antes da primeira campanha.",
      },
      {
        href: `${base}/leads/resultados`,
        label: "Resultados",
        icon: ChartLineUpIcon,
        phase: "fase2",
        summary: "Entregues, aberturas, cliques e descadastros por campanha, vindos dos webhooks do Resend.",
      },
      {
        href: `${base}/leads/migracao`,
        label: "Link de migração",
        icon: MegaphoneIcon,
        phase: "fase2",
        summary: "Link com token por contato e acompanhamento do convite: enviado, clicado, migrado.",
        note: "Base da campanha de migração para o 2.0.",
      },
    ],
  },
  {
    label: "Prospecção",
    icon: TargetIcon,
    href: `${base}/prospeccao`,
    items: [
      { href: `${base}/prospeccao`, label: "Prospects", icon: TargetIcon, phase: "mvp" },
      { href: `${base}/prospeccao/importar`, label: "Importar planilha", icon: UploadSimpleIcon, phase: "mvp" },
    ],
  },
  {
    label: "Moderação",
    icon: FlagIcon,
    href: `${base}/moderacao`,
    items: [
      {
        href: `${base}/moderacao`,
        label: "Denúncias",
        icon: FlagIcon,
        phase: "fase2",
        summary: "Denúncias de anúncio e de usuário, com a decisão registrada. Nasce junto com o botão Denunciar da página da sala.",
      },
    ],
  },
  {
    label: "Métricas",
    icon: ChartLineUpIcon,
    href: `${base}/metricas`,
    items: [
      {
        href: `${base}/metricas`,
        label: "Painel da plataforma",
        icon: ChartLineUpIcon,
        phase: "fase2",
        summary: "Funil de cadastro, anúncio, no ar e contato, por cidade. Consulta direto o banco.",
      },
      {
        href: `${base}/metricas/saidas`,
        label: "Motivos de saída",
        icon: DoorOpenIcon,
        phase: "fase2",
        summary: "Por que anúncios e contas foram excluídos. Os dados já existem em listing_removals.",
      },
      {
        href: `${base}/metricas/comportamento`,
        label: "Comportamento",
        icon: CursorClickIcon,
        phase: "fase2",
        summary: "Funis de visita, sala, WhatsApp e publicação no PostHog. O admin mostra o link para os painéis.",
      },
    ],
  },
  {
    label: "Financeiro",
    icon: ReceiptIcon,
    href: `${base}/financeiro`,
    items: [
      {
        href: `${base}/financeiro`,
        label: "Renovações e patrocinados",
        icon: ReceiptIcon,
        phase: "depois",
        summary: "Pedidos, pagamentos e reembolsos das renovações pagas e dos patrocinados. Chega com a monetização.",
      },
    ],
  },
  {
    label: "Configurações",
    icon: GearSixIcon,
    href: `${base}/configuracoes`,
    items: [
      { href: `${base}/configuracoes`, label: "Administradores", icon: ShieldCheckIcon, phase: "mvp" },
      { href: `${base}/configuracoes/auditoria`, label: "Registro de auditoria", icon: ClipboardTextIcon, phase: "mvp" },
      {
        href: `${base}/configuracoes/emails`,
        label: "Modelos de e-mail",
        icon: EnvelopeSimpleIcon,
        phase: "depois",
        summary: "Ver e testar os modelos de e-mail do sistema.",
      },
    ],
  },
];

export const ALL_ITEMS: NavItem[] = [HOME, ...NAV_GROUPS.flatMap((group) => group.items)];

export const isSoon = (item: NavItem) => item.phase !== "mvp";

/** Área inteira ainda não construída: o item do menu leva o selo Soon. */
export const isGroupSoon = (group: NavGroup) => group.items.every(isSoon);

/** Item e grupo mais específicos para um caminho (usado no breadcrumb). */
export function findNav(pathname: string) {
  const clean = pathname.replace(/\/$/, "") || base;
  let best: { item: NavItem; group?: NavGroup } | null = null;
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if ((clean === item.href || clean.startsWith(`${item.href}/`)) && (!best || item.href.length > best.item.href.length)) {
        best = { item, group };
      }
    }
  }
  if (!best && clean === base) return { item: HOME, group: undefined };
  return best;
}
