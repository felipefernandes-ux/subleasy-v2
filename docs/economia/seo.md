# Calculadora sala própria x sala por hora: palavra-chave e SEO

Fontes: Planejador de Palavras-chave do Google (Brasil, português, 06/11/2026), Google Search Console, pesquisa de SERP e leitura das páginas citadas com o Firecrawl (arquivos locais em `.firecrawl/`, fora do git). O Semrush ficou sem unidades de API.

## Público e objetivo

Esta página é para quem **procura** sala: o profissional que paga aluguel fixo ou hesita em montar um consultório e quer saber se pagar só as horas usadas compensa. É o lado da demanda; a calculadora de renda (`/quanto-cobrar-sublocacao-consultorio`) é o lado da oferta. As duas se ligam por links.

## Palavra-chave principal

**vale a pena alugar consultório por hora**

- É a dúvida de decisão, com a intenção de quem está comparando e ainda não escolheu.
- O Planejador não mostra volume para essa busca nem para as irmãs ("consultório próprio ou alugado", "consultório compartilhado vale a pena", "custo de manter um consultório"). A aposta é no grupo.
- Buscas com volume no grupo: aluguel de consultório por hora (170 por mês), alugar consultório por hora (90), consultório compartilhado (110), alugar consultório (390), coworking para psicólogos (30).
- A busca transacional "alugar consultório por hora" fica com `/espacos` e com os anúncios pagos; esta página é a decisão antes da busca.

## SERP e concorrência (lido com o Firecrawl)

- Há muito texto sobre o tema: guias de "quando compensa" de espaços que alugam salas (Sublocando, Integrale Hub, Sua Clínica Psi, LocaClinic, Instituto Hiraki) e artigos de gestão (Dr. Thiago Perfeito, PJMED, Livance).
- Ferramentas encontradas: a **Darwin Saúde** tem uma calculadora de preço da hora para quem aluga a sala (lado da oferta, concorrente da nossa calculadora de renda). O **Sublocando** tem uma calculadora de ROI para clínicas (também lado da oferta). A **ByDoctor** tem uma calculadora de custo de abrir consultório.
- Não encontrei uma ferramenta interativa que compare a sala própria com a sala por hora e mostre o ponto de virada. Os textos explicam a conta; nenhum a faz com os números do leitor. É o espaço da página.
- O modelo de cálculo (ponto de virada, custo por hora usada) é o do Dr. Thiago Perfeito, citado na página.

## Dados usados na página (todos com fonte)

| Dado | Fonte | Observação |
|---|---|---|
| Exemplo ilustrativo: custo fixo R$ 6.000, hora a R$ 60, ponto de virada de 100 h por mês | Dr. Thiago Perfeito | Cenário fictício, dito na página |
| Hora usada a R$ 75 contra R$ 37,50 na divisão ingênua | Dr. Thiago Perfeito | Mesmo exemplo |
| Simulação em BH: custo fixo R$ 10.000, hora a partir de R$ 40, valores de 2024 | Instituto Hiraki | A empresa aluga salas por hora: a página avisa o interesse comercial |
| Mediana das salas por hora anunciadas no Subleasy | Banco do Subleasy | Só com 3 anúncios ou mais |

Nenhum número foi inventado. Onde a fonte é de um fornecedor interessado, a página diz.

## Página

- URL: `/vale-a-pena-alugar-consultorio-por-hora`
- Title: "Vale a pena alugar consultório por hora? | Subleasy"
- H1 com a pergunta e a promessa ("Calcule quanto você economiza"), resposta curta logo abaixo
- Calculadora: custo fixo (aluguel, condomínio e IPTU, contas, secretária, outros e montagem diluída em 60 meses), horas por semana e preço da hora. Resultado: economia ou custo a mais, barras, gráfico de cruzamento, ponto de virada e custo da hora usada. Diz quando a sala própria compensa.
- Seções: como a conta funciona, tabela com os dois exemplos publicados, quando a sala própria ainda compensa, FAQ de sete perguntas e chamada final com a economia calculada
- Dados estruturados: `WebPage`, `WebApplication`, `BreadcrumbList` e `FAQPage`
- Links internos: rodapé (Profissionais), a calculadora de renda e esta página linkam entre si; a chamada final leva a `/espacos?cobranca=hora`
- Entrou no `sitemap.xml`

## Medição

- Eventos do GA4 e do PostHog: `calculator_started`, `calculator_result` e `calculator_cta_click`, agora com o parâmetro `tool` (`economia` ou `renda`) para separar as duas calculadoras.
- Conversão que importa: cliques em "Ver salas por hora" e contatos nos anúncios depois.

## Depois de publicar

- Pedir indexação da URL no Search Console.
- Em 4 a 6 semanas, comparar impressões e posição do grupo "vale a pena", "consultório próprio ou alugado" e "coworking" com a base zero de hoje.
- Usar a página como destino de campanhas para profissionais, junto com `/espacos`.
- Revisar os dois exemplos publicados a cada seis meses, porque os valores envelhecem.
