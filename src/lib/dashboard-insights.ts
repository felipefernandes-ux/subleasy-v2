import { formatPrice } from "./listing-options";
import { BANDS, WEEKDAYS, contactsOf, percentChange, priceGap, rateOf, type Market, type Pattern, type Period, type Totals } from "./dashboard-metrics";

export type InsightAction = { label: string; href: string };

export type Insight = {
  /** Regra + alvo ("sem-contato:<id>"). Serve para dispensar. */
  key: string;
  kind: "alert" | "tip" | "success" | "info";
  /** Linha acima do título: o anúncio, "Seu perfil", "Seus contatos" ou "Dica de sublocação". */
  scope: string;
  listing: { id: string; title: string; photo: string | null } | null;
  title: string;
  body: string;
  action: InsightAction;
};

/** Anúncio no ar com o que o motor precisa para opinar sobre ele. */
export type InsightListing = {
  id: string;
  title: string;
  slug: string;
  photo: string | null;
  price: number;
  daysLeft: number | null;
  expiresOn: string | null;
  daysSincePublished: number | null;
  photoCount: number;
  descriptionLength: number;
  current: Totals;
  previous: Totals;
  favoritesTotal: number;
  market: Market | null;
};

export type InsightInput = {
  period: Period;
  listings: InsightListing[];
  expired: { id: string; title: string; photo: string | null; expiresOn: string | null }[];
  total: { current: Totals; previous: Totals };
  pattern: Pattern;
  profile: { hasAvatar: boolean; hasBio: boolean };
  dismissed: Set<string>;
  /** Para girar as dicas gerais ao longo do ano. */
  weekOfYear: number;
};

const MAX_INSIGHTS = 8;
const MIN_PHOTOS_TIP = 4;
const SHORT_DESCRIPTION = 200;
const pct = (value: number) => `${(value * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const plural = (count: number, one: string, many: string) => `${count.toLocaleString("pt-BR")} ${count === 1 ? one : many}`;
const RANK: Record<Insight["kind"], number> = { alert: 0, tip: 1, success: 2, info: 3 };
const PROFILE = "/configuracoes/informacoes-pessoais";
const NOTIFICATIONS = "/configuracoes/notificacoes";

/**
 * Insights em uma lista só, do mais urgente ao mais leve. Cada regra exige amostra mínima, para não
 * opinar em cima de dois cliques. Quando sobram poucos, entram dicas de sublocação.
 */
export function generateInsights(input: InsightInput): Insight[] {
  const { period, listings, expired, total, pattern, profile } = input;
  const found: Insight[] = [];
  const last = `nos últimos ${period} dias`;

  const about = (listing: { id: string; title: string; photo: string | null }) => ({
    scope: listing.title,
    listing: { id: listing.id, title: listing.title, photo: listing.photo },
  });
  const edit = (id: string, label = "Editar anúncio") => ({ label, href: `/painel/anuncios/${id}/editar` });
  const manage = (id: string, label: string) => ({ label, href: `/painel/anuncios/${id}` });

  for (const listing of listings) {
    const { current, previous } = listing;
    const views = current.views;
    const contacts = contactsOf(current);
    const gap = priceGap(listing.price, listing.market);
    const market = listing.market;
    const marketNote = market ? ` A mediana de ${market.count} salas parecidas na cidade é ${formatPrice(market.median)}.` : "";

    if (listing.daysLeft !== null && listing.daysLeft <= 14) {
      found.push({
        key: `expira:${listing.id}:${listing.expiresOn}`,
        kind: "alert",
        ...about(listing),
        title: listing.daysLeft <= 1 ? "Expira amanhã" : `Expira em ${listing.daysLeft} dias`,
        body: "Depois disso o anúncio sai das buscas e para de receber contatos. Renove para manter a sala visível.",
        action: manage(listing.id, "Renovar anúncio"),
      });
    }

    if (views === 0 && listing.daysSincePublished !== null && listing.daysSincePublished >= 3) {
      found.push({
        key: `sem-visitas:${listing.id}`,
        kind: "tip",
        ...about(listing),
        title: "Ainda sem visitas",
        body: `Ninguém abriu este anúncio ${last}. Divulgue o link para colegas e grupos da sua área e confira se a primeira foto mostra bem a sala.`,
        action: { label: "Abrir anúncio", href: `/sala/${listing.slug}` },
      });
    } else if (views >= 20 && contacts === 0) {
      found.push({
        key: `sem-contato:${listing.id}`,
        kind: "tip",
        ...about(listing),
        title: `${plural(views, "visita", "visitas")} e nenhum contato`,
        body:
          gap !== null && gap >= 10
            ? `O preço está ${gap}% acima do mercado e pode estar afastando quem visita.${marketNote}`
            : "Quem abre não está chamando. Revise a primeira foto, o preço e se a descrição responde às dúvidas mais comuns.",
        action: edit(listing.id, gap !== null && gap >= 10 ? "Revisar preço" : "Editar anúncio"),
      });
    } else if (gap !== null && gap >= 15 && views >= 10 && rateOf(current) < 0.05) {
      found.push({
        key: `preco-alto:${listing.id}`,
        kind: "tip",
        ...about(listing),
        title: `Preço ${gap}% acima do mercado`,
        body: `Só ${pct(rateOf(current))} das visitas viram contato.${marketNote}`,
        action: edit(listing.id, "Revisar preço"),
      });
    } else if (gap !== null && gap <= -20 && contacts >= 3) {
      found.push({
        key: `preco-baixo:${listing.id}`,
        kind: "info",
        ...about(listing),
        title: "Há espaço para subir o preço",
        body: `O preço está ${Math.abs(gap)}% abaixo do mercado e o anúncio recebeu ${plural(contacts, "contato", "contatos")} ${last}.${marketNote}`,
        action: edit(listing.id, "Revisar preço"),
      });
    }

    const viewChange = percentChange(views, previous.views);
    if (previous.views >= 10 && viewChange !== null && viewChange <= -30) {
      found.push({
        key: `queda:${listing.id}`,
        kind: "alert",
        ...about(listing),
        title: `Visitas caíram ${Math.abs(viewChange)}%`,
        body: `${plural(views, "visita", "visitas")} ${last}, contra ${previous.views.toLocaleString("pt-BR")} nos ${period} dias anteriores. Fotos novas e uma descrição atualizada ajudam a retomar o ritmo.`,
        action: edit(listing.id, "Atualizar anúncio"),
      });
    } else if (previous.views >= 10 && viewChange !== null && viewChange >= 30) {
      found.push({
        key: `alta:${listing.id}`,
        kind: "success",
        ...about(listing),
        title: `Visitas subiram ${viewChange}%`,
        body: `${plural(views, "visita", "visitas")} ${last}, contra ${previous.views.toLocaleString("pt-BR")} antes. Bom momento para manter os horários livres em dia.`,
        action: edit(listing.id, "Atualizar horários"),
      });
    }

    if (views >= 10 && listing.photoCount < MIN_PHOTOS_TIP) {
      found.push({
        key: `fotos:${listing.id}`,
        kind: "tip",
        ...about(listing),
        title: listing.photoCount === 1 ? "Só 1 foto" : `Só ${listing.photoCount} fotos`,
        body: `Quem compara salas decide pelas imagens. Com ${MIN_PHOTOS_TIP} ou mais dá para mostrar a recepção, o consultório e os detalhes.`,
        action: edit(listing.id, "Adicionar fotos"),
      });
    }

    if (listing.descriptionLength < SHORT_DESCRIPTION) {
      found.push({
        key: `descricao:${listing.id}`,
        kind: "tip",
        ...about(listing),
        title: "Descrição curta",
        body: `São ${listing.descriptionLength} caracteres. Conte quais especialidades cabem, o que está incluso (recepção, limpeza, equipamentos) e como funcionam os horários.`,
        action: edit(listing.id, "Completar descrição"),
      });
    }

    if (listing.favoritesTotal >= 3 && contacts === 0) {
      found.push({
        key: `favoritos:${listing.id}`,
        kind: "tip",
        ...about(listing),
        title: "Salvaram, mas não chamaram",
        body: `${plural(listing.favoritesTotal, "pessoa salvou", "pessoas salvaram")} este anúncio sem entrar em contato. Costuma faltar uma resposta: preço, horários livres ou regras.`,
        action: edit(listing.id, "Deixar mais claro"),
      });
    }
  }

  // Cruzamento entre anúncios: o insight fica no que rende menos, citando o que rende mais.
  const comparable = listings.filter((listing) => listing.current.views >= 10);
  if (comparable.length >= 2) {
    const ranked = [...comparable].sort((a, b) => rateOf(b.current) - rateOf(a.current));
    const best = ranked[0];
    const worst = ranked[ranked.length - 1];
    if (contactsOf(best.current) >= 2 && (contactsOf(worst.current) === 0 || rateOf(best.current) >= 2 * rateOf(worst.current))) {
      const photoHint = best.photoCount > worst.photoCount ? ` "${best.title}" tem ${best.photoCount} fotos; este tem ${worst.photoCount}.` : "";
      found.push({
        key: `comparacao:${worst.id}`,
        kind: "tip",
        ...about(worst),
        title: `Converte menos que "${best.title}"`,
        body: `${pct(rateOf(worst.current))} das visitas viram contato aqui, contra ${pct(rateOf(best.current))} no seu melhor anúncio.${photoHint} Leve o que funciona lá para cá.`,
        action: edit(worst.id),
      });
    }
  }

  for (const listing of expired) {
    found.push({
      key: `expirado:${listing.id}:${listing.expiresOn}`,
      kind: "alert",
      ...about(listing),
      title: "Anúncio expirado",
      body: "Ele não aparece nas buscas e não recebe contatos. Renove para voltar ao ar.",
      action: manage(listing.id, "Renovar anúncio"),
    });
  }

  // Sobre os contatos em geral, não sobre um anúncio.
  const { whatsapp, messages } = total.current;
  if (pattern.total >= 5) {
    found.push({
      key: `horario:${pattern.peakWeekday}-${pattern.peakBand}`,
      kind: "info",
      scope: "Seus contatos",
      listing: null,
      title: `Mais procurado ${WEEKDAYS[pattern.peakWeekday].phrase}, ${BANDS[pattern.peakBand].phrase}`,
      body: "É quando chega a maior parte dos contatos nos últimos 90 dias. Deixe os avisos ligados para responder na hora.",
      action: { label: "Ajustar avisos", href: NOTIFICATIONS },
    });
  }
  if (whatsapp + messages >= 5 && messages / (whatsapp + messages) >= 0.6) {
    found.push({
      key: "canal:mensagens",
      kind: "info",
      scope: "Seus contatos",
      listing: null,
      title: "A maioria escreve pelo formulário",
      body: `${plural(messages, "mensagem chegou", "mensagens chegaram")} por e-mail ${last}. Confira a caixa de spam e responda no mesmo dia.`,
      action: { label: "Ajustar avisos", href: NOTIFICATIONS },
    });
  }

  if (!profile.hasAvatar) {
    found.push({
      key: "perfil:foto",
      kind: "tip",
      scope: "Seu perfil",
      listing: null,
      title: "Coloque uma foto no perfil",
      body: "A foto aparece nos seus anúncios e no seu perfil público. Ajuda quem procura sala a confiar em quem está do outro lado.",
      action: { label: "Adicionar foto", href: PROFILE },
    });
  }
  if (!profile.hasBio) {
    found.push({
      key: "perfil:apresentacao",
      kind: "tip",
      scope: "Seu perfil",
      listing: null,
      title: "Conte quem você é",
      body: "Uma apresentação curta, com a sua área ou o nome da clínica, ajuda quem procura sala a escolher com mais segurança.",
      action: { label: "Escrever apresentação", href: PROFILE },
    });
  }

  const visible = found.filter((insight) => !input.dismissed.has(insight.key)).sort((a, b) => RANK[a.kind] - RANK[b.kind]);
  const tips = generalTips(listings).filter((tip) => !input.dismissed.has(tip.key));
  const rotated = tips.map((_, index) => tips[(input.weekOfYear + index) % tips.length]);
  return [...visible, ...rotated.slice(0, Math.max(0, 3 - visible.length))].slice(0, MAX_INSIGHTS);
}

// Boas práticas de sublocação, sem números inventados. A ação leva ao anúncio que mais precisa dela.
function generalTips(listings: InsightListing[]): Insight[] {
  const fewestPhotos = [...listings].sort((a, b) => a.photoCount - b.photoCount)[0];
  const first = listings[0];
  const editHref = (listing: InsightListing | undefined) => (listing ? `/painel/anuncios/${listing.id}/editar` : "/anunciar");
  const tip = (key: string, title: string, body: string, action: InsightAction): Insight => ({
    key: `dica:${key}`,
    kind: "info",
    scope: "Dica de sublocação",
    listing: null,
    title,
    body,
    action,
  });

  return [
    tip("primeira-foto", "A primeira foto decide o clique", "Luz natural, sala arrumada e nada pessoal à vista. Mostre o ambiente inteiro antes dos detalhes.", {
      label: fewestPhotos ? "Revisar fotos" : "Anunciar sala",
      href: editHref(fewestPhotos),
    }),
    tip("responda-rapido", "Responda no mesmo dia", "Quem procura sala fala com vários anunciantes ao mesmo tempo. Responder rápido, com horários e valores claros, coloca você na frente.", {
      label: "Ajustar avisos",
      href: NOTIFICATIONS,
    }),
    tip("modalidade", "Hora, turno ou mês", "Hora e turno atraem quem está começando ou atende poucos dias; mensal atrai quem quer rotina. Escolha a que combina com a sua agenda livre.", {
      label: first ? "Revisar preço" : "Anunciar sala",
      href: editHref(first),
    }),
    tip("incluso", "Diga o que está incluso", "Recepção, limpeza, internet, maca, armário e estacionamento pesam na decisão. Quanto mais claro, menos perguntas repetidas.", {
      label: first ? "Editar descrição" : "Anunciar sala",
      href: editHref(first),
    }),
    tip("por-escrito", "Combine tudo por escrito", "Horários, rateio de despesas, limpeza, uso de equipamentos e aviso prévio para sair evitam conflito. Um contrato simples protege os dois lados.", {
      label: "Ver como funciona",
      href: "/como-funciona",
    }),
    tip("divulgue", "Divulgue o link da sua sala", "Envie para colegas de profissão e grupos da sua área. A indicação de quem conhece você é um dos caminhos mais curtos para dividir a sala.", {
      label: first ? "Abrir anúncio" : "Anunciar sala",
      href: first ? `/sala/${first.slug}` : "/anunciar",
    }),
  ];
}
