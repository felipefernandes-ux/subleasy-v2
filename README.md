# Subleasy 2.0

**Sua sala no turno certo.**

O Subleasy é um classificado de sublocação de consultórios, salas terapêuticas e espaços de bem-estar por hora, turno, dia ou mês. Quem anuncia não paga nada. Quem procura fala direto com o dono da sala pelo WhatsApp, sem intermediação e sem comissão.

A versão 2.0 substitui o site atual em WordPress ([subleasy.com.br](https://subleasy.com.br)). O foco é o anunciante: ele publica a sala em minutos com ajuda de IA e acompanha quanto interesse o anúncio gera.

## Posicionamento

Para profissionais autônomos de saúde e bem-estar em cidades médias, o Subleasy é o jeito mais simples de alugar e sublocar salas por turno. Diferente dos classificados genéricos, ele organiza a busca por turno e tipo de atendimento e dá ao dono da sala um anúncio pronto com IA e dados sobre o interesse que ele gera.

- **Para quem anuncia:** "Sua sala vazia vira renda. Anúncio pronto em 3 minutos, de graça."
- **Para quem procura:** "Atenda em uma sala pronta, só nos turnos que você precisa. Fale direto com o dono."

O lançamento começa por uma cidade, Maringá (PR), para concentrar a oferta antes de abrir outras.

## O que a 2.0 entrega

**Para o anunciante**
- Cadastro com IA: fotos e 5 perguntas viram título, descrição e comodidades. Todo texto gerado é uma sugestão editável e nada é publicado sem revisão.
- Disponibilidade em grade semanal de turnos (manhã, tarde e noite).
- Página do espaço para compartilhar no WhatsApp e no Instagram.
- Painel com visualizações, cliques no WhatsApp e comparação de preço com a região.
- Anúncio que não expira: a cada 30 dias o anunciante confirma a disponibilidade com um clique.

**Para quem procura**
- Busca por turno e tipo de atendimento ("sala para psicologia, terça à tarde, Zona 7").
- Busca em linguagem natural: a IA converte a frase em filtros e mostra quais aplicou.
- Alerta de nova sala na cidade.
- Contato direto pelo WhatsApp, com mensagem pré-preenchida.

## Status

| Fase | Entregas | Situação |
|---|---|---|
| 0. Fundação | Design System, landing page, modelo de dados, migração dos anúncios, rastreio de cliques no WhatsApp | Em andamento |
| 1. Anunciante | Cadastro com IA, grade de turnos, página compartilhável, painel básico | Próxima |
| 2. Buscador | Páginas por cidade e tipo, busca por turno e em linguagem natural, alerta de nova sala | Planejada |
| 3. Monetização | Plano Pro para anunciantes, relatório semanal da IA | Planejada |
| 4. Transação | Calendário com reserva, pagamento integrado, avaliações | Planejada |

Regra do projeto: nada da fase seguinte começa antes de o critério da fase atual ser atingido.

**Já feito na fase 0**
- Landing page v0.1 (`src/app/page.tsx`), com foco em conversão para anunciar e buscar.
- Design System com tokens, componentes base e documentação (`docs/design-system/`).
- SEO técnico: metadados, Open Graph, `robots.txt`, `sitemap.xml` e dados estruturados (JSON-LD).
- Schema inicial do banco no Supabase, com segurança por linha (RLS).

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack, Cache Components) e React 19
- TypeScript
- Tailwind CSS v4
- [Supabase](https://supabase.com) (Postgres 17, região São Paulo)
- Area Normal via Adobe Fonts

## Como rodar localmente

**Pré-requisitos:** Node.js 20 ou mais recente e a [CLI do Supabase](https://supabase.com/docs/guides/local-development/cli/getting-started).

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Crie o arquivo `.env.local` na raiz com as chaves do projeto no Supabase (**Project Settings → API Keys**):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://SEU_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
   Use só a chave *publishable*. A chave *secret* nunca leva o prefixo `NEXT_PUBLIC_`. O `.env.local` não vai para o Git.
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Abra [http://localhost:3000](http://localhost:3000).

## Estrutura

```
src/
  app/                 Rotas, layout, metadados, robots e sitemap
  components/          Seções da landing page e componentes base (ui.tsx)
  lib/supabase/        Clientes do Supabase e tipos gerados do banco
supabase/
  migrations/          Mudanças no banco, em ordem de data
docs/design-system/    Decisões, tokens e prancha visual
public/                Logo, imagens das salas e imagem de compartilhamento
```

## Design System

A base é o tema atual de subleasy.com.br. Os tokens ficam em `src/app/globals.css` e as decisões em [`docs/design-system/README.md`](docs/design-system/README.md).

| Token | Valor | Uso |
|---|---|---|
| `brand-600` | `#3818d9` | Cor primária (logo, botões). Hover em `brand-500` (`#583be9`) |
| `mint-400` | `#25edb1` | Acento (o ponto do logo). Como fundo, texto `brand-900` |
| `ink-900` / `ink-600` | `#101828` / `#475467` | Títulos / corpo |
| `whatsapp` | `#25d366` | Reservado ao botão de contato |
| Fonte | Area Normal 400 e 700 | Títulos, corpo, botões e menu |
| Raios | 8 / 12 / 20 px | Controles / cards / painéis |

**Princípios**
- Mobile primeiro: o anunciante cadastra a sala pelo celular, de dentro dela.
- Tudo que a IA gera usa o mesmo selo "Sugestão" e mostra a origem de cada informação ("Você informou", "Vimos na foto 3").
- Acessibilidade: contraste AA em todo texto, foco visível e alvos de toque de 44 px.
- Fotos são o produto: grandes no anúncio, com guia de fotografia no cadastro.

## Banco de dados

Schema em [`supabase/migrations/`](supabase/migrations/). Todas as tabelas têm RLS ligado.

| Tabela | Conteúdo | Quem acessa |
|---|---|---|
| `listings` | Anúncios: tipo de espaço, preço, cidade, UF, bairro, turnos, comodidades, status | Público vê os ativos; o dono gerencia os próprios |
| `listing_contacts` | WhatsApp e endereço completo | Só o dono |
| `listing_events` | Visualizações e cliques no WhatsApp, um por visitante por dia | Só o dono lê |

O WhatsApp chega a quem procura pela função `get_listing_whatsapp`, que registra o clique. Assim o telefone só aparece por ação do buscador, como pede a LGPD.

**Para mudar o banco**
```bash
supabase migration new nome_da_mudanca   # cria o arquivo em supabase/migrations/
supabase db push                         # aplica no projeto ligado
supabase gen types typescript --linked --schema public > src/lib/supabase/database.types.ts
```

## Fluxo de trabalho

1. Cada mudança começa numa branch: `git checkout -b feat/nome`.
2. Mudanças visuais são aprovadas no localhost antes do commit.
3. Commit, push e pull request para a `main`.

## Tom de voz

Direto, concreto, profissional sem ser frio e honesto. Frases curtas, sempre "você", números no lugar de adjetivos ("R$ 60 por hora, terças à tarde" em vez de "preço acessível"). Usamos "turno", "sala", "consultório" e "anfitrião", nunca "workspace", "hub" ou "booking".
