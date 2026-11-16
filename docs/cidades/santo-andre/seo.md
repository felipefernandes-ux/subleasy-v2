# Página de cidade: Santo André

URL: `/consultorios/santo-andre-sp` (modelo para as próximas cidades em `src/lib/city-pages.ts`).

## Por que Santo André (16/11/2026)

- 4 dos 17 anúncios no ar, a cidade com mais anúncios do site.
- 4 dos 14 cliques no WhatsApp do site inteiro, mais que qualquer outra cidade.
- 51 visualizações; 25 só em novembro, contra 12 em outubro.
- Search Console: nenhuma busca com "Santo André" ou "ABC" mostra o site ainda. Nos termos genéricos o site fica entre as posições 50 e 80, então a busca local é a mais fácil de ganhar.
- Regra para criar a próxima cidade: demanda comprovada e pelo menos 3 anúncios no ar.

## Palavras-chave

O volume não foi conferido (Semrush sem créditos de API). Confira antes de mexer no título.

| Papel | Busca | Onde entra |
|---|---|---|
| Principal | consultório para alugar em Santo André | title, H1, URL |
| Secundária | aluguel de consultório por hora em Santo André | title ("por hora"), H1 |
| Secundária | quanto custa alugar consultório em Santo André | H2 e FAQ, com a resposta logo no começo |
| Secundária | sala para psicólogo em Santo André | FAQ (aparece quando há sala de psicologia) |
| Cauda longa | sala para alugar no Centro / Vila Guiomar / Casa Branca / Jardim Bela Vista | H3 de bairros |

## O que a página faz para SEO e SXO

- **Clique no Google:** title com 58 caracteres. Meta description com cerca de 150 caracteres, com o preço inicial, que muda sozinho. A página não mostra quantas salas há: com poucos anúncios, um número baixo afasta mais do que convence. Breadcrumb e FAQ podem aparecer como resultado enriquecido.
- **Primeira tela:** H1 com a busca, os bairros, o preço inicial e o botão "Ver as salas disponíveis". Quem chega vê na hora que está no lugar certo.
- **Resposta primeiro:** a seção de preço começa com a faixa real dos anúncios, no formato que o Google usa em destaques.
- **Dados estruturados:** CollectionPage, ItemList (os anúncios), BreadcrumbList e FAQPage.
- **Canibalização:** `/espacos?local=Santo André` aponta o canonical para esta página. A busca com tipo de sala (`&tipo=psicologia`) mantém o canonical dela.
- **Links internos:** rodapé de todas as páginas, sitemap, links para a busca com mapa, para a calculadora e para as cidades vizinhas com sala.
- **Página rala:** sem nenhuma sala no ar, a página sai do índice (noindex, follow) até voltar a ter anúncio.
- **Desempenho:** a arte do topo é um WebP de 68 KB com `fetchPriority="high"`, sem JavaScript extra.

## Como medir (4 a 8 semanas depois de publicar)

- Search Console, filtro de página `/consultorios/santo-andre-sp`: impressões, posição e CTR das buscas com "santo andré".
- PostHog: cliques no WhatsApp dos anúncios de Santo André e cliques em "Anunciar minha sala grátis" vindos desta página.
- Envie a URL para indexação no Search Console depois do deploy.

## Textos para conferir

- Bairros (`src/lib/city-pages.ts`): estação da Linha 10 no Centro, Shopping ABC perto do Jardim Bela Vista e "ruas mais calmas" na Vila Guiomar.
- `hostProof`: "cidade com mais contatos pelo WhatsApp". Revise se outra cidade passar Santo André.

## Arte

`arte-filosofia.md` (conceito), `arte.py` (gera a imagem) e `arte.png`. Para atualizar os bairros, edite `PLACES` em `arte.py`, rode `python3 arte.py saida.png` e converta com `cwebp -q 88`.
