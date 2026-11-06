# SEO do post: Quanto Rende a Sublocação de Consultório

Arquivo do conteúdo: `quanto-rende-a-sublocacao-de-consultorio.html` (blocos Gutenberg)
Imagem destacada: `assets/quanto-rende-a-sublocacao-de-consultorio.webp` (1024x1024, para enviar à mídia) e `.png` (1200x1200, original)
Filosofia visual da imagem: `quanto-rende-a-sublocacao-de-consultorio.philosophy.md`

## Campos do Rank Math

| Campo | Valor |
|---|---|
| Palavra-chave principal | `quanto rende a sublocação de consultório` |
| Título SEO (56 car.) | Quanto Rende a Sublocação de Consultório? 3 Contas Reais |
| H1 / título do post | Quanto Rende a Sublocação de Consultório? 3 Contas Reais |
| Slug | `quanto-rende-a-sublocacao-de-consultorio` |
| Meta description (141 car.) | Quanto rende a sublocação de consultório? Veja a conta com 3 cenários, o preço mínimo para cobrir o custo e a calculadora grátis da Subleasy. |
| Categoria | Dicas |
| Palavras-chave secundárias | renda com sublocação de sala, quanto ganhar sublocando consultório, calculadora de sublocação de consultório, quanto cobrar sublocação de consultório, ocupação de consultório |
| Texto alternativo da imagem destacada | Grade de 21 turnos da semana com 8 turnos oferecidos e 4 alugados, mostrando quanto rende a sublocação de consultório: R$ 2.598 por mês |

## Decisão de palavra-chave (evitar canibalização)

- `/quanto-cobrar-sublocacao-consultorio` (a ferramenta) disputa "quanto cobrar" e "calculadora". O post mira a outra pergunta do mesmo público: **quanto rende** (o ganho), com a fórmula e os cenários. O post explica a conta e manda para a ferramenta; não repete a ferramenta.
- A home continua com "sublocação de consultório". O post usa a frase só dentro da expressão maior.
- Volume de busca da frase exata NÃO foi medido (Semrush sem unidades de API, e o Planejador de Palavras-chave não foi consultado nesta sessão). A SERP também não foi analisada. Validar no Search Console depois de 30 dias.

## Ligação com a ferramenta (SXO)

- Dois links para `https://subleasy.com.br/quanto-cobrar-sublocacao-consultorio`: um com a âncora "calculadora de sublocação de consultório" (em negrito, no H2 "Quanto rende a sublocação de consultório na sua sala") e um com a chamada "Abra a calculadora e simule a sua sala".
- Chamada para `/anunciar` e `/espacos` na seção "Como a Subleasy ajuda".
- A resposta curta fica no primeiro parágrafo (quatro números), a fórmula em negrito logo no primeiro H2, e três tabelas respondem a busca sem exigir leitura completa.
- Os números dos exemplos foram calculados com as mesmas regras de `src/lib/sublease-calc.ts` (4,33 semanas por mês, faixa de 20 pontos, preço mínimo arredondado para cima). Estão marcados no texto como exemplos, não como preços de mercado.

## Checklist Rank Math (verificado no texto, não medido no plugin)

- Palavra-chave no início do título SEO: sim
- Palavra-chave na meta description: sim
- Palavra-chave no slug: sim (40 caracteres)
- Palavra-chave nos primeiros 10% do conteúdo: sim (primeiro parágrafo, em negrito)
- Palavra-chave em subtítulos (H2): sim (2 H2)
- Palavra-chave no alt da imagem: sim
- Tamanho: cerca de 2.100 palavras
- Densidade da frase exata: 14 ocorrências em 2.125 palavras = 0,66% (o índice conta 2 dessas ocorrências)
- Índice no bloco do Rank Math (`rank-math-toc`): sim
- Link externo dofollow (planalto.gov.br, Lei 8.245/91): sim
- Links internos: 9 (ferramenta, anunciar, espaços, e 5 posts do blog)
- Número no título: sim ("3 Contas Reais")
- Título com palavra de poder e sentimento positivo: "Reais" (conferir no plugin)
- Sem travessões no texto: sim
- Imagem no conteúdo e destacada: sim

## Auditoria SEO (seo-audit) do conteúdo

Passou: um H1 (o título do post), hierarquia H2 > H3, FAQ em H3 e parágrafo, links com âncora descritiva, tabelas com cabeçalho.
Ficou de fora, por precisar do site publicado ou do plugin: Core Web Vitals, schema renderizado, indexação, nota do Rank Math.

## Pendências antes de publicar

1. **Publicação**: não consegui criar o rascunho. O token do Novamira para `blog-subleasy-com-br` expirou em 26/10 e o `doctor` retorna `server_unsupported` (mesmo problema dos posts anteriores, depois da migração para `/blog`). Colar o HTML no wp-admin como rascunho (editor de código) ou reautorizar.
2. **Imagem destacada**: enviar o `.webp` à biblioteca de mídia com o nome `quanto-rende-a-sublocacao-de-consultorio.webp` (o HTML já aponta para `/wp-content/uploads/2026/11/`) e defini-lo como destacada. Se o mês ou a pasta forem outros, ajustar o `src` da imagem no conteúdo.
3. **Rank Math**: colar os campos acima, definir a palavra-chave principal e conferir a nota 90+ no editor. Ela está estimada pelo checklist, não medida.
4. **FAQ com schema**: as 5 perguntas estão como H3 e parágrafo. Converter para o bloco FAQ do Rank Math no editor para gerar o schema.
5. **Fatos a conferir**: art. 13 da Lei 8.245/91 (mesmo texto do post do contrato e da página da ferramenta). Os valores dos cenários são hipotéticos.
6. **Depois de publicar**: linkar este post a partir de `sua-sala-comercial-esta-vaga-descubra-como-rentabilizar-com-sublocacao`, `sublocacao-de-consultorios-por-hora` e `contrato-de-sublocacao-de-consultorio`, e do texto da página `/quanto-cobrar-sublocacao-consultorio` (a página já recomenda linkar posts de valor). Pedir indexação no Search Console.
