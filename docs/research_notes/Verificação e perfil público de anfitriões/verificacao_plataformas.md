# Verificação de identidade e de contas em marketplaces (Airbnb, OLX Brasil e similares), 2024-2026

Notas de pesquisa para o sistema de verificação do Subleasy 2.0. Pesquisa feita em 2026-10-26. Toda afirmação tem URL. O que não tem fonte foi para "Gaps".

## 1. O que o Airbnb verifica (anfitriões)

### Takeaway
Para anfitriões, a verificação de identidade é obrigatória antes de publicar: o anúncio não vai ao ar até ela ser concluída. Ela começa com checagem de dados (nome legal, endereço, telefone) contra fontes de terceiros. Se isso não basta, o Airbnb pede foto de documento oficial e, às vezes, selfie. Residentes no Brasil também precisam verificar informações de contribuinte. Os documentos são processados por fornecedores terceirizados não nomeados e guardados por anos.

### Cited Findings
- "Every host, new co-host, and booking guest must be identity verified to use our platform." — [Airbnb Help 1237](https://www.airbnb.com/help/article/1237)
- Para anfitriões não há prazo, mas os anúncios não são publicados e as reservas não podem ser aceitas até a verificação ser concluída. Para hóspedes, o prazo é de 1 h (check-in em menos de 12 h) ou de 12 h, e a reserva fica pendente até lá. — [Airbnb Help 1237](https://www.airbnb.com/help/article/1237)
- Primeira etapa: nome legal, endereço, telefone e contatos são checados contra "trusted third-party sources" ou contra um documento oficial. Dependendo do país, ou se não houver anomalias, isso pode bastar. — [Airbnb Help 1237](https://www.airbnb.com/help/article/1237)
- Foto de documento oficial (carteira de motorista, passaporte ou identidade nacional) é pedida quando a etapa anterior falha ou não está disponível no país. Uma selfie pode ser pedida junto com o documento, e ela não aparece no perfil. Alguns usuários têm reconhecimento facial e leitura de chip NFC, esta só em alguns países. — [Airbnb Help 1237](https://www.airbnb.com/help/article/1237)
- **Específico do Brasil:** "Brazilian residents must verify taxpayer information", ou seja, dados fiscais (CPF/CNPJ). Anfitriões que operam como empresa podem ter de verificar endereço residencial ou cidadania. — [Airbnb Help 1237](https://www.airbnb.com/help/article/1237)
- Os dados de identificação são compartilhados com "authorized third-party service providers" para verificar identidade, autenticar documentos e fazer checagem de antecedentes onde a lei permite. O fornecedor não é nomeado. — [Airbnb Help 1237](https://www.airbnb.com/help/article/1237)
- Retenção: em muitas regiões, incluindo a UE, documentos oficiais ficam guardados por 3 anos a partir do recebimento. Selfies ficam pela vida da conta, salvo se a lei exigir prazo maior. Alguns dados derivados, como a data de nascimento, continuam guardados depois que o documento é apagado. — [Airbnb Help 1237](https://www.airbnb.com/help/article/1237)
- O processamento costuma levar menos de 1 hora. — [Airbnb Help 1237](https://www.airbnb.com/help/article/1237)
- Selo: ícone vermelho com check ao lado da foto, mais um link "Identity verified" no perfil que mostra o mês e o ano da primeira verificação. O selo cai se o usuário mudar o nome legal ou remover o documento, e aí precisa verificar de novo. Contas ligadas a grandes empresas anfitriãs podem não exibir o selo. — [Airbnb Help 1237](https://www.airbnb.com/help/article/1237)
- O anfitrião pode ter de verificar de novo ao mudar nome legal ou dados da conta, ou quando o Airbnb detecta risco. — resumo da busca citando [Airbnb Help 336](https://www.airbnb.com/help/article/336) / [Airbnb Help 269](https://www.airbnb.com/help/article/269) (não lidos na íntegra)
- Verificação do anúncio (não da pessoa), segundo um fornecedor terceiro: anfitriões individuais casam fotos externas com 2 imagens fornecidas pelo Airbnb ou enviam 3 vídeos curtos (porta de entrada, arredores, placa de rua próxima). Quem não conclui após o e-mail pode ter o calendário bloqueado. — [Chekin blog](https://chekin.com/en/blog/new-airbnb-listing-verification-process-what-does-it-mean/) (fonte secundária)
- Histórico: o esforço de verificar todos os anúncios começou após reportagens de 2020. A Travel Weekly noticiou o plano de verificar todos os ~7 milhões de anúncios, e o TechCrunch citou fotos com GPS para imóveis novos. — [Travel Weekly](https://travelweekly.co.uk/news/airbnb-acts-to-verify-all-seven-million-listings); [TechCrunch](https://techcrunch.com/?p=2603149) (histórico, pré-2024)
- Critérios de Superhost (fontes de terceiros que batem entre si), avaliados por trimestre (1/jan, 1/abr, 1/jul, 1/out) sobre os últimos 12 meses:
  - pelo menos 10 estadias, ou 3 estadias somando 100 noites;
  - taxa de resposta de 90% ou mais;
  - nota média de 4,8 ou mais;
  - cancelamentos abaixo de 1%.
  — [Guesty/GuestReady](https://guestready.com/blog/airbnb-superhost/); [Hostfully](https://www.hostfully.com/blog/airbnb-superhost/); página oficial: [Airbnb Resources](https://www.airbnb.com/resources/hosting-homes/a/how-to-become-a-superhost-702) (os limites não apareceram no trecho)

### Inferences
- O modelo do Airbnb é escalonado: começa com checagem de dados, de baixo atrito, e só pede documento + selfie quando algo não fecha. Isso cabe bem num classificado gratuito.
- No Brasil, o "taxpayer info" provavelmente é a validação de CPF. Isso mostra que CPF é o identificador mínimo esperado pelo mercado brasileiro.
- O selo do Airbnb marca uma data ("verificado desde mês/ano") e pode ser perdido. É um bom padrão de UX para o Subleasy.

### Gaps
- O Airbnb não divulga quais fornecedores de identidade usa no Brasil.
- Não encontrei documento oficial de 2024-2026 sobre o selo "Verified listing", e não confirmei se ele está ativo no Brasil.
- Não li na íntegra a página oficial com os limites de Superhost.

## 2. O que a OLX Brasil verifica

### Takeaway
A OLX tem duas camadas. A primeira são selos por dado de contato: e-mail, telefone, Facebook, CPF. A segunda é a "Identidade verificada": CPF + selfie com biometria facial, às vezes também RG/CNH, feita pela Unico, com aprovação em até 24 h. Há ainda um "Perfil profissional verificado" para CNPJ e um "Anunciante verificado" biométrico para imobiliárias e corretores no ZAP/VivaReal, também pela Unico. Os selos não impedem golpes, e a Justiça já isentou a OLX de indenizar.

### Cited Findings
- "Perfil verificado" = perfil com selos de autenticidade (✔). O usuário adiciona nome, CPF, e-mail, telefone e Facebook em "Meu cadastro"/"Minha conta" e verifica os contatos. "Quanto mais verificações, mais confiável é a oferta." (artigo de 29/05/2024) — [OLX Dicas](https://dicas.olx.com.br/seguranca/perfil-verificado-na-olx-o-que-e-e-como-ter/)
- O comprador sempre vê, sem opção de desativar:
  - nome, último acesso, região, tempo de atividade, "nível de cadastro", histórico de anúncios e anúncios ativos;
  - com Garantia OLX: vendas realizadas, vendas canceladas, tempo de envio e avaliação;
  - em perfis profissionais: endereço, telefone, WhatsApp, rede social, descrição e serviços.
  — [OLX Dicas](https://dicas.olx.com.br/seguranca/perfil-verificado-na-olx-o-que-e-e-como-ter/)
- Verificação de identidade:
  - CPF + selfie com reconhecimento facial, e às vezes também RG ou CNH (só esses dois);
  - aprovação em até 24 h;
  - o CPF verificado não pode ser editado nem trocado por CNPJ;
  - a selfie passa a servir de método de login;
  - a verificação tem de ser feita pelo titular, senão a conta é bloqueada;
  - dados e imagens não são compartilhados com outros usuários.
  — [OLX Ajuda](https://ajuda.olx.com.br/s/article/como-e-por-que-verificar-o-seu-perfil-na-OLX)
- Motivos comuns de recusa: pouca luz, rosto fora da moldura, boné ou óculos, documento borrado, pessoa que não é o titular. — [OLX Ajuda](https://ajuda.olx.com.br/s/article/como-e-por-que-verificar-o-seu-perfil-na-OLX)
- O CPF pode ser transferido entre contas com regras: intervalo de 30 dias, sem saldo na carteira OLX, sem transações em curso. O histórico não é transferido. — [OLX Ajuda](https://ajuda.olx.com.br/s/article/como-e-por-que-verificar-o-seu-perfil-na-OLX)
- Fornecedor: segundo a OLX, a Unico "apoia e processa a nossa verificação de identidade". O selo aparece como "Identidade" no app e "Identidade Verificada" na web, dentro de "Nível de cadastro". — [OLX Dicas: Identidade verificada](https://dicas.olx.com.br/seguranca/seguranca-na-olx/identidade-verificada-na-olx/) (conteúdo via resumo da busca; a página de ajuda que li não nomeia a Unico)
- "Perfil Verificado" para anúncios de automóveis em todo o Brasil: documento com foto + selfie pelo app. — [Garagem360](https://garagem360.com.br/anuncios-de-automoveis/)
- Grupo OLX, dez/2024 — "Anunciante verificado" para imobiliárias e corretores:
  - biometria facial da Unico, só no ZAP e no VivaReal, com investimento de R$ 2 milhões em 2024;
  - mais de 80 pontos faciais, 4 camadas incluindo prova de vida e score de risco, autenticação em até 3 s;
  - gratuito e opcional, mas "fortemente recomendado"; feito no CanalPro, botão "Iniciar Verificação";
  - a OLX estima +15% de cliques em anúncios com o selo;
  - perfis verificados ganham mais visibilidade e ficam protegidos contra uso dos dados do corretor por terceiros.
  — [TI Inside](https://tiinside.com.br/16/12/2024/olx-investe-r-2-milhoes-em-biometria-facial-para-aumentar-seguranca-das-imobiliarias/); [Conecta Imobi](https://blog.conectaimobi.com.br/verificacao-de-conta-por-biometria-facial/)
- "Loja oficial verificada" é um selo e filtro para concessionárias e revendas em Autos. — [OLX listagem autos](https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/2025/estado-ap)
- Golpe mais comum na OLX em 2024: o "falso pagamento". O golpista manda comprovante falso por WhatsApp, SMS ou e-mail, ou um e-mail falso imitando a OLX para roubar o login. — [Serasa](https://www.serasa.com.br/premium/blog/golpe-olx/)
- Recomendação: manter a conversa no chat da plataforma, não passar telefone pessoal e denunciar anúncios estranhos. Golpe do "aluguel de conta": o golpista paga ao vendedor para usar a conta dele. — [Serasa](https://www.serasa.com.br/premium/blog/golpe-olx-voce-sabe-como-se-proteger-na-plataforma/); [Tecnoblog](https://tecnoblog.net/responde/5-dicas-de-seguranca-para-comprar-na-olx-evite-golpes/)
- O TJDFT decidiu que a OLX não tem de indenizar vítimas de golpe. — [Tecnoblog](https://tecnoblog.net/noticias/cuidado-com-golpes-na-olx-justica-decide-que-a-empresa-nao-tem-que-indenizar/)
- No Reclame Aqui, consumidores relatam golpes vindos de perfis com selo verificado, e também casos de "não recebi o selo". — [Reclame Aqui 1](https://www.reclameaqui.com.br/olx/em-negociacao-via-olx-pay-utilizando-perfil-verificado_C0Bz2u6QSpuFrNEj/); [Reclame Aqui 2](https://www.reclameaqui.com.br/olx/nao-recebi-o-selo-de-conta-verificada-na-olx_LEkTejkdXvTgfCug/)
- Golpes em anúncios de carros usados tiveram queda de quase 50%, segundo a mídia automotiva. — [Autoo](https://www.autoo.com.br/golpes-em-anuncios-de-carros-usados-tem-queda-de-quase-50-saiba-como-se-proteger/) (não li a metodologia)

### Inferences
- O padrão brasileiro de classificados é um "nível de cadastro" progressivo: e-mail → telefone → CPF → biometria. Ele fica visível ao comprador junto com sinais passivos como tempo de conta, último acesso e anúncios. O Subleasy pode copiar essa estrutura.
- A verificação biométrica opcional, que dá selo e mais visibilidade, é o incentivo que a OLX usa em vez de tornar obrigatória. Isso serve para o caso do Subleasy, que é gratuito e de baixo atrito.
- O selo não elimina golpes, inclusive por aluguel de conta. A selfie usada como login ajuda contra isso.

### Gaps
- Não achei regras oficiais atualizadas de bloqueio de links e números no chat da OLX, nem detalhes da "Garantia da OLX"/OLX Pay de 2025-2026.
- Não sei se a OLX valida conta bancária como sinal de verificação.

## 3. Outras plataformas

### Takeaway
O Mercado Livre usa reputação transacional: o termômetro de cores e o MercadoLíder. ZAP e VivaReal (Grupo OLX) usam biometria Unico para corretores. O Booking foi duramente criticado em 2025 por não checar identidade de anfitriões na hora de publicar. O CFM vende um webservice de consulta de CRM a empresas. Para QuintoAndar, Doctoralia, Workana e Enjoei não achei política oficial.

### Cited Findings
- **Mercado Livre:**
  - Termômetro de reputação, do vermelho ao verde escuro, baseado em reclamações, cancelamentos pelo vendedor e atrasos de envio. Usa as vendas dos últimos 60 dias, ou dos últimos 365 dias se houver menos de 60 vendas.
  - Metas: menos de 2% de reclamações, até 1% de cancelamentos, pelo menos 90% dos envios no prazo.
  - Medalhas MercadoLíder / Gold / Platinum: exigem estar no verde mais volume e faturamento.
  — [Nubimetrics](https://academia.nubimetrics.com/br/reputacao-mercado-livre); [Tray](https://tray.com.br/escola/loja-oficial-mercado-livre/) (fontes secundárias)
  - Loja Oficial: tempo de cadastro acima de 4 meses, RG e comprovação fiscal, segundo terceiros, possivelmente desatualizado. — [Tray](https://tray.com.br/escola/loja-oficial-mercado-livre/)
- **ZAP/VivaReal:** "Anunciante verificado" biométrico para corretores e imobiliárias (ver seção 2). — [TI Inside](https://tiinside.com.br/16/12/2024/olx-investe-r-2-milhoes-em-biometria-facial-para-aumentar-seguranca-das-imobiliarias/)
  - Em golpe noticiado envolvendo ZAP e QuintoAndar, o falso corretor deu um CRECI inexistente. — [IstoÉ](https://istoe.com.br/falso-corretor-usa-zap-quintoandar-e-imobiliarias-conhecidas-para-aplicar-golpe)
  - Golpes de falso aluguel citados em 2025:
    - anúncio clonado com preço abaixo do mercado;
    - "proprietário no exterior" que não pode mostrar o imóvel;
    - pedido de sinal para "reservar".
  — [O Povo, nov/2025](https://mais.opovo.com.br/jornal/economia/2025/11/29/golpe-do-falso-corretor-cresce-no-ceara-e-usa-anuncios-clonados.html); [Jornal Opção](https://www.jornalopcao.com.br/ultimas-noticias/golpe-do-falso-aluguel-preocupa-imobiliarias-em-goiania-entenda-861567/)
  - Segundo advogado ouvido pelo O Povo, a responsabilidade da plataforma depende da diligência na autenticidade do cadastro, na validação de documentos e na rapidez em remover anúncios falsos. — [O Povo](https://mais.opovo.com.br/jornal/economia/2025/11/29/golpe-do-falso-corretor-cresce-no-ceara-e-usa-anuncios-clonados.html)
- **Booking.com:**
  - Teste da Which? (2025): anúncio publicado em menos de 15 minutos, sem pedido de documento.
  - Foto de documento e prova de propriedade só são exigidas cerca de 3 meses depois do anúncio entrar no ar.
  - Um anúncio falso do "10 Downing Street" levou 18 meses até a identidade ser pedida.
  - O Booking diz restringir pré-pagamentos para anfitriões novos.
  — [Which?](https://www.which.co.uk/policy-and-insight/article/lack-of-proper-checks-is-leaving-booking.com-wide-open-to-scammers-which-warns-arv5l3b8k7t6); [Which? Downing St](https://www.which.co.uk/policy-and-insight/article/fake-10-downing-street-listing-exposes-dangerous-fraud-failings-at-booking.com-which-reveals-aCeZJ9m8zrkF)
- **GetNinjas:** segundo o CEO (entrevista, data incerta), a verificação do prestador é baseada em fotos: uma do rosto, uma do documento e uma segurando o documento. — [Na Prática](https://www.napratica.org.br/dicas-freelancer-profissional-getninjas/)
- **Conselhos profissionais (relevante para consultórios):**
  - **CFM:**
    - Webservice "Listagem de médicos" (Resolução CFM 2.309/2022) que retorna nome, CRM, UF, tipo e situação da inscrição e especialidade. Não retorna CPF nem contatos.
    - Para empresas privadas custa R$ 948,00 por ano; para entes públicos é grátis.
    - Contratação via SEI-Medicina, com pagamento feito a partir da conta da PJ.
    — [CFM Webservice](https://sistemas.cfm.org.br/listamedicos/informacoes)
    - Busca pública gratuita "Busca por Médicos". O CRM tem 6 dígitos + UF. O RQE comprova especialidade. — [CFM](https://portal.cfm.org.br/noticias/voce-sabe-se-quem-esta-te-atendendo-e-mesmo-medico-veja-como-se-proteger); [Quero Bolsa](https://querobolsa.com.br/revista/crm-medico-significado)
  - **CFP:** Cadastro Nacional de Psicólogos criado em 2011, unifica os CRPs, e há consulta pública. Não achei API para empresas. — [CFP](https://site.cfp.org.br/cadastro-nacional-de-psiclogos-busca-unificar-dados-dos-profissionais-inscritos-nos-crps/)
- **Outros:** LinkedIn verifica com Persona via passaporte NFC, e Tinder com fotos analisadas por IA mais revisão humana. — [Olhar Digital](https://olhardigital.com.br/2024/08/10/dicas-e-tutoriais/como-verificar-perfil-no-linkedin-com-o-persona/); [Tecnoblog](https://tecnoblog.net/responde/como-ter-um-perfil-verificado-no-tinder/)

### Inferences
- Para o Subleasy, o caso do Booking é um contra-exemplo: deixar publicar sem checagem nenhuma gera manchetes ruins. Um meio-termo é publicar após OTP de telefone + CPF válido, e reservar biometria para o selo.
- Os anfitriões do Subleasy costumam ser profissionais de saúde. Validar CRM (webservice do CFM, R$ 948/ano) ou CRP/CRO/CREFITO por consulta pública daria um selo diferenciado de "profissional registrado".

### Gaps
- Não achei política oficial de verificação de anunciantes do QuintoAndar, nem de verificação de CRM/CRP do Doctoralia, Workana ou Enjoei.
- Não achei API do CFP, CRO ou CREFITO.

## 4. Métodos proporcionais e custos

### Takeaway
Os preços públicos encontrados:
- **SERPRO Consulta CPF:** cerca de R$ 0,66 por consulta até 999 consultas/mês, e cerca de R$ 0,56 de 1.000 a 9.999.
- **Veriff (documento + liveness):** US$ 0,80 a 1,89 por verificação, com mínimo mensal de US$ 49 a 209.
- **Persona:** plano gratuito com cota mensal; pagos a partir de cerca de US$ 250/mês.
- **CFM:** R$ 948/ano.

Unico, idwall e SERPRO Datavalid não publicam preço; é preciso pedir proposta.

### Cited Findings
- **SERPRO Consulta CPF** (loja oficial, página sem data): R$ 0,6591 por consulta na faixa de 0 a 999/mês e R$ 0,5649 de 1.000 a 9.999, com valores menores em volumes maiores. Contratos públicos antigos (2018 e 2023) mostram cerca de R$ 0,34 por consulta com franquia fixa de cerca de R$ 575/mês. — [Loja SERPRO](https://www.loja.serpro.gov.br/consultacpf?lang=en); [Contrato 2018](https://www.gov.br/imprensanacional/pt-br/arquivos/arquivos-contratos/2018/integra-do-contrato_n__22_2018.pdf/@@display-file/file); [ANP TR 2023](https://www.gov.br/anp/pt-br/acesso-a-informacao/aquisicoes-licitacoes-contratos/arquivos-termos-de-referencia/tr223_2023.pdf)
- **SERPRO Datavalid:**
  - API que valida dados e biometria facial contra bases oficiais; contratação online.
  - A versão 2.0 teve 99,9% de acurácia em testes internos (2020).
  - A base AIBio tem cerca de 300 milhões de faces e mais de 700 clientes, incluindo a Uber.
  - Não achei preço público.
  — [SERPRO 2020](https://serpro.gov.br/menu/noticias/noticias-2020/rosto-reconhecido-confirmado-verdadeiro-falso-quatro-segundos); [Convergência Digital](https://convergenciadigital.com.br/governo/com-nova-carteira-de-identidade-serpro-tera-biometria-e-ia-na-maior-base-de-dados-do-brasil/)
- **Veriff** (página oficial de preços):

  | Plano | Por verificação | Mínimo mensal | O que inclui |
  |---|---|---|---|
  | Essential | US$ 0,80 | US$ 49 | decisão por IA, liveness iBeta, extração de dados |
  | Plus | US$ 1,39 | US$ 99 | adiciona revisão humana e ferramentas antifraude |
  | Premium | US$ 1,89 | US$ 209 | adiciona personalização e exclusão via API |

  - Teste grátis de 15 dias com 50 verificações. Só se paga pela decisão, não pelas novas tentativas.
  - Adicionais: retenção de 2 anos +US$ 0,30; PEP/sanções +US$ 0,64.
  - Checagem em bases governamentais só no plano Enterprise (mais de 5 mil verificações/mês).
  - A calculadora da própria página e a TrustRadius mostram valores maiores (US$ 1,49 a 2,05), então há conflito.
  — [Veriff Pricing](https://www.veriff.com/pricing); [Veriff Help](https://help.veriff.com/en/articles/10853865-veriff-plans-description); [TrustRadius](https://www.trustradius.com/products/veriff/pricing)
- **Persona:**
  - Plano Starter gratuito com cota mensal de verificações por documento, com selfie opcional. Em 2020 eram até 500/mês; o número atual não foi confirmado.
  - Plano Essential a partir de cerca de US$ 250/mês, com excedente de cerca de US$ 1,50.
  - Consultas a bases custam cerca de US$ 0,10 a 0,75.
  - Cobra só por serviço concluído com sucesso.
  — [apis.io resumo](https://apis.io/plans/withpersona/withpersona-plans-pricing/); [DestinationCRM 2020](https://www.destinationcrm.com/Articles/CRM-News/CRM-Across-the-Wire/Persona-Launches-Free-Identity-Verification-144503.aspx) (secundárias, possivelmente desatualizadas)
- **Unico:**
  - Fornecedora da OLX, do ZAP e do VivaReal.
  - Na documentação do IDUnico + IDCheck, o resultado é "sim" ou "inconclusivo"; quando inconclusivo, retorna um score de autenticação.
  - Rodada Série C de US$ 120 milhões, avaliação de US$ 1,02 bilhão.
  - Sem preço público.
  — [Unico Docs](https://developers.unico.io/en/docs/IDunico/Integracao/fluxoBiometria); [Brazil Journal](https://braziljournal.com/?p=39639)
- **idwall:**
  - Facelink (2022) compara CPF + selfie com bases públicas e privadas.
  - Faz verificação de endereço pela localização do aparelho.
  - Certificação iBeta nível 2 de prova de vida (ago/2024).
  - Segundo a empresa, a biometria barrou 13% das tentativas de fraude em cadastros em 2021.
  - Sem preço público.
  — [O Povo 2022](https://www.opovo.com.br/noticias/tecnologia/opovotecnologia/2022/05/04/idwall-lanca-nova-solucao-para-verificacao-biometrica.html); [CQCS 2024](https://cqcs.com.br/noticia/idwall-ganha-certificacao-ibeta-2-e-se-torna-pioneira-no-brasil-em-prova-de-vida-digital/)
- **CFM webservice:** R$ 948,00 por ano para empresas privadas. — [CFM](https://sistemas.cfm.org.br/listamedicos/informacoes)

### Inferences
Uma escada proporcional para o Subleasy, com estimativa de custo por etapa:
- **Nível 0:** confirmação de e-mail. Custo de envio desprezível.
- **Nível 1:** OTP de telefone/WhatsApp, obrigatório para publicar. Custa centavos por SMS; o preço não foi pesquisado.
- **Nível 2:** CPF validado. Checagem local do dígito verificador grátis, mais consulta SERPRO de nome e situação a cerca de R$ 0,66.
- **Nível 3 (opcional, dá selo):** documento + selfie com liveness. Custa cerca de US$ 0,80 a 1,89 na Veriff, mais o mínimo mensal; Unico e idwall sob proposta.
- **Nível 4 (opcional, para profissionais):** CRM/CRP/CRO. CRM via webservice do CFM a R$ 948/ano; os demais por checagem manual nas buscas públicas.

Com baixo volume, o mínimo mensal da Veriff (US$ 49) pesa mais que o preço unitário.

### Gaps
- Preços de Unico, idwall, Datavalid e Didit não foram encontrados publicamente.
- Não pesquisei custo de SMS/WhatsApp OTP (Twilio, Zenvia).
- Faltam detalhes de LGPD sobre biometria, que é dado sensível pelo art. 11 da LGPD. Não pesquisado nesta rodada.

## 5. Sinais contínuos (pós-cadastro)

### Takeaway
As plataformas combinam a verificação pontual com sinais públicos e contínuos:
- tempo de conta;
- último acesso;
- taxa e tempo de resposta;
- avaliações;
- histórico de anúncios;
- cancelamentos.

Também usam moderação, denúncias e nova verificação quando há mudança de dados ou risco.

### Cited Findings
- O perfil OLX exibe sempre nome, último acesso, região, tempo de atividade, nível de cadastro, histórico e anúncios ativos. Quem usa a Garantia OLX também mostra vendas, cancelamentos, tempo de envio e avaliação. — [OLX Dicas](https://dicas.olx.com.br/seguranca/perfil-verificado-na-olx-o-que-e-e-como-ter/)
- Os limites do Superhost do Airbnb (resposta de 90% ou mais, nota de 4,8 ou mais, cancelamentos abaixo de 1%) são reavaliados por trimestre. — [GuestReady](https://guestready.com/blog/airbnb-superhost/)
- O selo do Airbnb mostra a data da verificação e pode cair com a troca do nome legal. — [Airbnb Help 1237](https://www.airbnb.com/help/article/1237)
- O termômetro do Mercado Livre usa uma janela móvel de 60 ou 365 dias. — [Nubimetrics](https://academia.nubimetrics.com/br/reputacao-mercado-livre)
- No Grupo OLX, perfis biometricamente verificados ganham mais visibilidade nos resultados de ZAP e VivaReal. — [TI Inside](https://tiinside.com.br/16/12/2024/olx-investe-r-2-milhoes-em-biometria-facial-para-aumentar-seguranca-das-imobiliarias/)
- O Booking restringe pré-pagamentos de anfitriões novos, um limite de risco por idade da conta. — [Which?](https://www.which.co.uk/policy-and-insight/article/lack-of-proper-checks-is-leaving-booking.com-wide-open-to-scammers-which-warns-arv5l3b8k7t6)
- A velocidade em remover anúncios falsos após alerta pesa na responsabilidade da plataforma, segundo advogado. — [O Povo](https://mais.opovo.com.br/jornal/economia/2025/11/29/golpe-do-falso-corretor-cresce-no-ceara-e-usa-anuncios-clonados.html)

### Inferences
- O contato do Subleasy é direto por WhatsApp, fora da plataforma. Isso o aproxima do modelo de classificado da OLX, em que o sinal mais útil é o perfil público: membro desde, verificações, tempo de resposta, avaliações. Também valem alertas contra pedido de sinal/Pix antes da visita, que é o golpe típico do falso aluguel.
- Usar a selfie como reautenticação, como faz a OLX, mitiga aluguel e tomada de conta.

### Gaps
- Não achei dados públicos sobre a eficácia de cada sinal (por exemplo, queda de fraude por selo), além das alegações dos próprios fornecedores: +15% de cliques na OLX e 13% de fraudes barradas na idwall.
- Não pesquisei sistemas de denúncia ou moderação de anúncios por plataforma.
