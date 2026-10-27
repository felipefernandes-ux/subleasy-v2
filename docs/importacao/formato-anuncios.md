# Formato de importação de anúncios (`subleasy-import` v1)

Um arquivo JSON por exportação, com os anunciantes e os anúncios do Subleasy atual (WordPress), prontos para o 2.0.
A exportação é repetível: o Subleasy atual continua no ar, e cada nova exportação traz o estado de hoje.
O importador usa `source_id` para atualizar o que já importou, sem duplicar.

- **Arquivo:** `imports/subleasy-wp-anuncios-AAAAMMDD-HHMM.json` (pasta fora do Git: tem e-mail e telefone).
- **Gerado por:** `scripts/wordpress/exportar.sh` (só leitura no WordPress).
- **Contrato validável:** `docs/importacao/subleasy-import.schema.json`.

## Estrutura

```json
{
  "format": "subleasy-import",
  "version": 1,
  "source": { "system": "wordpress", "site": "https://subleasy.com.br", "exported_at": "2026-10-26T22:40:00-03:00" },
  "summary": { "advertisers": 22, "listings": 26, "by_status": { "active": 6, "...": 0 } },
  "advertisers": [ ... ],
  "listings": [ ... ]
}
```

### `advertisers[]`

O anunciante é identificado pelo e-mail de contato do anúncio, não pelo autor do post: alguns anúncios foram criados pela conta admin em nome de outra pessoa.

| Campo | Tipo | Origem no WordPress | Observação |
| --- | --- | --- | --- |
| `source_id` | texto | `wp-user-<ID>` ou `wp-email-<hash>` | Chave estável entre exportações |
| `name` | texto | `first_name` + `last_name`, senão `display_name` | |
| `email` | texto | `user_email`, senão `email-do-usuario` do anúncio | Minúsculo; chave para casar com a conta no 2.0 |
| `whatsapp` | texto | `celular-do-usuario` ou `billing_cellphone` | Só dígitos, com DDD, sem +55 |
| `registered_at` | data ISO | `user_registered` | |
| `wp_role` | texto | papel do usuário | `um_anunciante`, `subscriber`, `administrator` |

### `listings[]`

| Campo | Tipo | Origem no WordPress | Regra |
| --- | --- | --- | --- |
| `source_id` | texto | `wp-<post ID>` | Chave estável |
| `source_url` | texto | permalink | |
| `advertiser_source_id` | texto | | Liga ao anunciante |
| `status` | `active` · `expired` · `pending_approval` · `draft` · `removed` | ver abaixo | Já no vocabulário do 2.0 |
| `source_status` | texto | `post_status` | Valor original, para auditoria |
| `title` | texto | `post_title` | Pode passar de 70 caracteres (ver `issues`) |
| `description` | texto | `post_content` sem HTML | Quebras de linha preservadas |
| `space_type` | chave do 2.0 | termo `tipo` | Primeiro tipo que existe no 2.0; senão `outro` |
| `space_type_labels` | lista | termos `tipo` | Todos os tipos marcados no WordPress |
| `billing_type` | `hora` · `turno` · `dia` · `mes` | `tipo_de_aluguel` | |
| `price` | número | `valor` (`"600,00"`) | Em reais |
| `address` | objeto | `cep`, `endereco`, `numero`, `complemento`, `bairro`, cidade, UF | UF de 2 letras; cidade e UF normalizadas |
| `amenities` | lista de chaves | termos `comodidades` | Chaves do 2.0 quando existem (`wifi`, `ar_condicionado`...), senão a chave gerada do nome |
| `photos` | lista de URLs | `galeria_de_imagens` | Na ordem do WordPress; a primeira é a capa |
| `contact` | objeto | `celular-do-usuario`, `email-do-usuario` | WhatsApp e e-mail do anúncio |
| `extras` | objeto | área, capacidade, banheiros, vagas, condomínio, IPTU, público, períodos, recursos | Sem coluna no 2.0 hoje; guardados para não perder |
| `dates` | objeto | `created_at`, `published_at`, `updated_at`, `removed_at` | ISO 8601, fuso de São Paulo |
| `metrics` | objeto | Post Views Counter e `wa_clicks_*` | Ver abaixo |
| `seo` | objeto | `post_name`, `rank_math_description` | |
| `issues` | lista | calculado | O que o importador precisa resolver (título longo, sem foto, sem preço...) |

### Status

| No WordPress | No arquivo | Por quê |
| --- | --- | --- |
| `publish` | `active` | No ar hoje |
| `pending` | `pending_approval` | Esperando revisão |
| `draft` com visitas ou com 30 dias entre criação e última edição | `expired` | Saiu do ar pela automação "Expirar anúncio após 30 dias" |
| `draft` sem sinais de publicação | `draft` | Nunca foi ao ar |
| `trash` | `removed` | Excluído; vai no arquivo só pelo histórico de métricas |

### Métricas

```json
"metrics": {
  "views_total": 68,
  "visits_total": 61,
  "whatsapp_clicks_total": 1,
  "views_daily": [ { "date": "2026-10-08", "views": 2, "visits": 2 } ],
  "whatsapp_clicks_monthly": [ { "month": "2026-10", "clicks": 1 } ]
}
```

- **Visualizações:** Post Views Counter, tabela `wp_post_views`. `views` = aberturas da página no dia; `visits` = visitantes do dia, como o plugin conta. Histórico diário desde maio de 2025.
- **Cliques no WhatsApp:** plugin `subleasy-wa-tracking` (um clique por IP, por anúncio, por dia). Só existe por mês, desde outubro de 2026.
- **No 2.0:** o importador grava cada dia como eventos `view` em `listing_events` (um por visitante do dia) e os cliques do mês no primeiro dia do mês. Assim o painel do anunciante mostra o histórico sem mudar nenhuma consulta.

## Regras do importador

- Casar o anunciante pelo e-mail: conta existente no 2.0 é reaproveitada; sem conta, nasce como convite pendente.
- Atualizar pelo `source_id`: anúncio já importado recebe os dados e métricas novos; nada é duplicado.
- Baixar as fotos das URLs e enviá-las ao Storage do 2.0.
- O prazo de 30 dias de um anúncio `active` começa quando ele vai ao ar no 2.0, não na data do WordPress.
- `removed` não vira anúncio; as métricas entram só nos números da plataforma.
- Nenhum anúncio importado vai ao ar sem a decisão do Felipe (ver Plano de Execução › Super admin).
