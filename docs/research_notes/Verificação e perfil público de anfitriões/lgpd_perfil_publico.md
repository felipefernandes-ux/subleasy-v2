# LGPD e perfil público de anfitriões: o que exibir e como colher consentimento para telefone (Subleasy 2.0)

> Nota de pesquisa, não é parecer jurídico. Data de referência: out/2026. Notação: **[LEI]** = exigência legal ou regulatória; **[BOA PRÁTICA]** = recomendação ou inferência. Textos legais citados de: LGPD (Planalto) https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm; Marco Civil (Planalto) https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm; CDC (Planalto) https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm.
> Ressalva sobre o texto da LGPD: a ferramenta que leu a página do Planalto disse que alguns artigos aparecem com redação dada por uma "Lei 15.352/2026". Não confirmei essa lei de forma independente. As citações abaixo usam o sentido do texto vigente na página do Planalto, e qualquer alteração recente deve ser checada.

## 1. Bases legais (art. 7) para cada item do perfil público

### Takeaway
Nenhuma base legal sozinha cobre o perfil inteiro. Os itens que fazem o marketplace funcionar e geram confiança (nome de exibição, "membro desde", nº de anúncios ativos, status de verificação, cidade/bairro do anúncio) cabem de forma defensável em execução de contrato (art. 7, V) e/ou legítimo interesse (art. 7, IX + art. 10), com teste de balanceamento documentado. Já mostrar o **telefone/WhatsApp para qualquer visitante** é uma exposição que vai além do necessário para o serviço. Para esse item, a base mais segura é o **consentimento** (art. 7, I + art. 8), colhido pelo toggle. Foto e bio são conteúdo que o próprio usuário escolhe enviar e publicar, e funcionam melhor como campos opcionais controlados pelo usuário.

### Cited Findings
- [LEI] Art. 7 lista as hipóteses taxativas: I consentimento; V "quando necessário para a execução de contrato ou de procedimentos preliminares relacionados a contrato do qual seja parte o titular, a pedido do titular dos dados"; IX legítimo interesse do controlador ou de terceiro, "exceto no caso de prevalecerem direitos e liberdades fundamentais do titular" — [LGPD art. 7](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [LEI] Art. 10: o legítimo interesse só fundamenta tratamento "para finalidades legítimas, consideradas a partir de situações concretas", incluindo "apoio e promoção de atividades do controlador" e proteção do titular "respeitadas as legítimas expectativas dele". §1: somente dados "estritamente necessários". §2: o controlador deve garantir transparência. §3: a ANPD pode pedir relatório de impacto (RIPD) — [LGPD art. 10](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [LEI] Art. 37: o registro das operações é exigido "especialmente quando baseado no legítimo interesse" — [LGPD art. 37](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [GUIA ANPD] O Guia Orientativo sobre Legítimo Interesse (ANPD, publicado em 2/2/2024) propõe um teste de balanceamento em três fases: (i) finalidade, (ii) necessidade, (iii) balanceamento e salvaguardas. A legítima expectativa do titular é tratada como elemento central. Se o teste for inconclusivo ou faltarem salvaguardas, deve-se usar outra base legal — [Mattos Filho](https://www.mattosfilho.com.br/unico/anpd-legitimo-interesse-lgpd/); [cópia do guia hospedada pelo TCE-PB](https://tce.pb.gov.br/wp-content/uploads/2025/03/guia_legitimo_interesse.pdf)
- O guia descreve o teste como recomendado, não obrigatório. Ainda assim, um escritório avalia que não ter o teste numa fiscalização seria tratado como falha de responsabilização e prestação de contas (art. 6, X) — [BMA](https://www.bmalaw.com.br/conteudo/direito-digital-protecao-de-dados-e-cybersecurity/artigos-e-noticias/o-legitimo-interesse-na-visao-da-anpd/pdf); [Confidata](https://confidata.com.br/blog/legitimo-interesse-lgpd-lia-exemplos-limites)
- [LEI] A LGPD protege apenas a pessoa natural: dado pessoal é "informação relacionada a pessoa natural identificada ou identificável" (art. 5, I). Dados de uma clínica como pessoa jurídica (razão social, CNPJ, telefone comercial) não são, em si, dados pessoais. Já os dados dos sócios ou responsáveis técnicos que aparecem no perfil são — [LGPD art. 5, I](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)

### Inferences
Mapa proposto (as linhas são inferências; os fundamentos estão acima):

| Item exibido | Base sugerida | Precisa de consentimento? | Observação |
|---|---|---|---|
| Nome de exibição (primeiro nome + inicial) | art. 7, V (o anfitrião contratou a publicação do anúncio) e/ou IX | Não | Minimização (ver item 4) |
| Nome completo / razão social da clínica | IX, ou o próprio usuário escolhe exibir | Para PF, preferir escolha do usuário; para PJ, a LGPD não incide sobre o dado da PJ | |
| Foto de perfil | Escolha do usuário (campo opcional, ele mesmo faz o upload e publica); art. 7, V ou I | Na prática, o upload voluntário com aviso claro de que a foto será pública já basta. Não exigir foto real como condição | Não é dado biométrico se não houver processamento facial (item 6) |
| Bio | Conteúdo inserido pelo titular para publicação (V) | Não, desde que o aviso diga que é pública | Alertar para não incluir telefone ou documento na bio |
| "Membro desde" (mês/ano) | IX (sinal de confiança) | Não | Dado de baixo risco |
| Nº de anúncios ativos | V/IX | Não | Já é pública ao listar os anúncios |
| Status de verificação (selo) | IX (prevenção a fraude e segurança de terceiros) | Não | Cuidado com o CDC (item 8) |
| Cidade/bairro | V (é o anúncio da sala) | Não | Nunca mostrar endereço exato do anfitrião PF |
| Telefone/WhatsApp para todos os visitantes | **art. 7, I (consentimento)** | **Sim** — o toggle | Alternativa: mensagem interna (V), sem expor o número |
| Telefone revelado só ao interessado logado, após clique | V (procedimentos preliminares a pedido do titular) + IX, se o anfitrião escolheu "contato por WhatsApp" | Discutível; o consentimento continua sendo a via mais segura | Ver item 7 |

- O telefone exposto a qualquer visitante não é "estritamente necessário" (art. 10, §1) para o contrato de anúncio, porque já existe o canal de mensagem interna. Por isso o legítimo interesse fica fraco para esse item, e o consentimento é a base natural. Exibição pública e indiscriminada também cria um risco previsível de raspagem e spam (item 7), o que pesa contra o titular no balanceamento.

### Gaps
- Não encontrei guia da ANPD tratando especificamente de perfis públicos de marketplaces ou de classificados.
- Não confirmei, no texto do Guia de Legítimo Interesse, exemplos que se apliquem diretamente a exibir dados em perfis.

## 2. Requisitos do consentimento (arts. 8 e 9) e o que isso significa para o toggle

### Takeaway
Para o consentimento ser válido, ele precisa ser livre, informado, inequívoco, dado para uma finalidade determinada, destacado, comprovável pelo controlador e revogável de forma gratuita e fácil. Na interface, isso se traduz em: toggle **desligado por padrão**, texto específico ao lado do toggle, registro auditável (quem, quando, versão do texto, valor), desligar com o mesmo clique e aviso prévio se a finalidade mudar.

### Cited Findings
- [LEI] Art. 5, XII: consentimento é "manifestação livre, informada e inequívoca pela qual o titular concorda com o tratamento de seus dados pessoais para uma finalidade determinada" — [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [LEI] Art. 8, caput: o consentimento deve ser dado "por escrito ou por outro meio que demonstre a manifestação de vontade do titular". §1: se for por escrito, deve "constar de cláusula destacada das demais cláusulas contratuais". §2: "Cabe ao controlador o ônus da prova de que o consentimento foi obtido em conformidade com o disposto nesta Lei". §3: é vedado tratamento "mediante vício de consentimento". §4: o consentimento "deverá referir-se a finalidades determinadas, e as autorizações genéricas para o tratamento de dados pessoais serão nulas". §5: "pode ser revogado a qualquer momento mediante manifestação expressa do titular, por procedimento gratuito e facilitado", e os tratamentos já feitos continuam válidos enquanto não houver pedido de eliminação. §6: se as informações do art. 9 (I, II, III ou V) mudarem, o controlador deve informar o titular "com destaque de forma específica do teor das alterações", e o titular pode revogar — [LGPD art. 8](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [LEI] Art. 9: o titular deve ter acesso facilitado a informações sobre finalidade específica, forma e duração, controlador e contato, uso compartilhado e direitos. §1: o consentimento é nulo se as informações "tenham conteúdo enganoso ou abusivo ou não tenham sido apresentadas previamente com transparência, de forma clara e inequívoca". §2: se a finalidade mudar de forma incompatível, o controlador deve informar antes, e o titular pode revogar. §3: se o tratamento for condição para fornecer o serviço, o titular deve ser informado com destaque — [LGPD art. 9](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [LEI] Art. 18, VIII e IX: o titular tem direito à "informação sobre a possibilidade de não fornecer consentimento e sobre as consequências da negativa" e à revogação nos termos do art. 8, §5 — [LGPD art. 18](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [LEI] Art. 15, III e art. 16: o tratamento termina com a revogação, e os dados são eliminados, salvo exceções como obrigação legal — [LGPD arts. 15–16](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [LEI] Marco Civil art. 7, IX: o usuário tem direito a "consentimento expresso sobre coleta, uso, armazenamento e tratamento de dados pessoais", "que deverá ocorrer de forma destacada das demais cláusulas contratuais" — [Marco Civil art. 7](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm)
- [GUIA ANPD, por analogia] O Guia Orientativo de Cookies (out/2022), segundo fontes secundárias: opções que dependem de consentimento devem vir desativadas por padrão (opt-in), sem caixas pré-marcadas; aceitar e recusar devem ter destaque equivalente; a granularidade é por finalidade — [BMA](https://www.bmalaw.com.br/conteudo/direito-digital-protecao-de-dados-e-cybersecurity/artigos-e-noticias/anpd-emite-recomendacoes-em-relacao-a-coleta-de-cookies-pelo-portal-govbr/pdf); [Securiti](https://securiti.ai/blog/brazil-anpd-guidance-on-cookies/); [Souto Correa](https://www.soutocorrea.com.br/en/client-alerts/anpd-lanca-guia-orientativo-sobre-cookies-e-protecao-de-dados-pessoais/)

### Inferences (tradução para UI e back-end)
- **[LEI → derivado] Default OFF.** Um toggle já ligado não demonstra manifestação de vontade "inequívoca" (art. 5, XII; art. 8, caput), e o ônus da prova é do controlador (art. 8, §2). O guia de cookies da ANPD aponta na mesma direção (opt-in).
- **[LEI → derivado] Finalidade específica no rótulo.** Exemplo: "Exibir meu WhatsApp para todos os visitantes do meu perfil e dos meus anúncios, inclusive quem não tem conta no Subleasy". Logo abaixo, uma linha informando as consequências (art. 9; art. 18, VIII): "Desligado: os interessados falam com você pela mensagem do Subleasy. Seu número continua privado." Também informar o risco: "Números públicos podem receber mensagens de desconhecidos." Isso é exigência de informação "clara" e não enganosa (art. 9, §1).
- **[LEI → derivado] Separado dos Termos.** O consentimento não pode ficar embutido no aceite geral dos Termos (art. 8, §§1 e 4; MCI art. 7, IX). O toggle próprio, ao lado do campo, já atende a esse destaque.
- **[LEI → derivado] Não condicionar o anúncio ao "sim".** Se o anúncio exigisse o telefone público, o consentimento deixaria de ser livre. Pelo art. 9, §3, quem condiciona precisa informar com destaque, e a ANPD tende a ver isso com desconfiança. A mensagem interna precisa ficar sempre disponível como alternativa.
- **[BOA PRÁTICA, para cumprir o ônus da prova do art. 8, §2] Registro de consentimento:** `user_id`, `purpose = "phone_public_display"`, `granted` (true/false), `timestamp` (UTC), `copy_version` (hash ou ID do texto exibido), `channel` (web/app), `ip` / `user_agent` (já guardados pelo art. 15 do MCI) e o número exibido no momento (hash). Guardar o histórico de eventos (append-only), não só o estado atual.
- **[LEI] Revogação** "gratuita e facilitada" (art. 8, §5): basta desligar o mesmo toggle, sem confirmação por e-mail nem atendimento. O número deve sumir na hora das páginas renderizadas, e é boa prática pedir revalidação e purga de cache e CDN. **[BOA PRÁTICA]** Avisar que cópias que terceiros já tenham salvo fogem ao controle da plataforma.
- **[LEI] Mudança de finalidade** (art. 8, §6; art. 9, §2). Exemplos: exibir o número também nos resultados de busca, em parceiros, em feeds ou num app. Nesses casos é preciso avisar antes e, de preferência, colher um novo opt-in. Versionar o texto (`copy_version`) permite saber quem consentiu com qual versão.
- **[BOA PRÁTICA] Trocar o número** com o toggle ligado: pedir reconfirmação, porque o número novo é outro dado e o consentimento era específico.

### Gaps
- Não encontrei guia específico da ANPD sobre consentimento, fora o de cookies. As conclusões sobre opt-in vêm por analogia desse guia e do texto da lei.

## 3. Dados tornados públicos pelo titular (art. 7, §§3, 4, 6, 7)

### Takeaway
Quando o anfitrião liga o toggle, o número passa a ser dado "tornado manifestamente público pelo titular" do ponto de vista de **terceiros**. Para o **Subleasy**, porém, a base do ato de exibir continua sendo o consentimento: é a plataforma que publica. Os §§3, 4 e 7 não autorizam o Subleasy, nem terceiros, a reutilizar o número para outras finalidades, como marketing, venda de listas ou enriquecimento de base, fora da finalidade, da boa-fé e do interesse público que motivaram a publicação.

### Cited Findings
- [LEI] §3: o tratamento de dados de acesso público "deve considerar a finalidade, a boa-fé e o interesse público que justificaram sua disponibilização". §4: "É dispensada a exigência do consentimento ... para os dados tornados manifestamente públicos pelo titular, resguardados os direitos do titular e os princípios previstos nesta Lei". §6: a dispensa de consentimento não dispensa as demais obrigações. §7: o tratamento posterior dos dados dos §§3 e 4 pode ter novas finalidades, desde que haja "propósitos legítimos e específicos" e os direitos do titular sejam preservados — [LGPD art. 7](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- Precedente da ANPD (primeira multa, jul/2023): a Telekall Infoservice (microempresa) foi multada (dois artigos, total de R$ 14.400, mais advertência por não ter encarregado) por usar dados disponíveis na internet para montar e vender listas de contatos de WhatsApp de eleitores. A ANPD entendeu que estar disponível online não legitima reaproveitar o dado para outra finalidade — [Mobile Time](https://www.mobiletime.com.br/noticias/06/07/2023/anpd-aplica-sua-primeira-sancao-com-multa-a-telekall/); [Canaltech](https://canaltech.com.br/governo/governo-federal-aplica-a-primeira-multa-por-violacao-da-lgpd-255670/); [DPL News](https://dplnews.com/?p=201789)

### Inferences
- [LEI → derivado] O Subleasy não pode usar o número público do anfitrião para nada além do contato sobre a sala. Telemarketing de terceiros, venda ou compartilhamento com parceiros exigem base própria. Pelo art. 7, §5, compartilhar dado obtido por consentimento com outros controladores exige consentimento específico.
- [BOA PRÁTICA] Nos Termos de Uso, proibir que visitantes coletem números para outros fins. Isso cria base contratual e ajuda a demonstrar boa-fé.
- O caso Telekall mostra que quem raspa números publicados pode ser responsabilizado. Ainda assim, a plataforma que expôs os dados sem salvaguardas razoáveis pode ser questionada pelo art. 46 (segurança) — ver item 7.

### Gaps
- Não achei decisão da ANPD ou do STJ dizendo se dado publicado via toggle de plataforma é "manifestamente público" para o próprio operador da plataforma.

## 4. Minimização e necessidade (art. 6, III): o que nunca exibir; nome completo ou primeiro nome?

### Takeaway
[LEI] O princípio da necessidade limita o tratamento "ao mínimo necessário". Nada no perfil de aluguel de sala justifica expor CPF, RG, CNH, data de nascimento, e-mail, endereço residencial ou documentos. Para pessoa física, a LGPD não proíbe exibir o nome completo, mas o padrão recomendado é **primeiro nome + inicial do sobrenome**, com nome completo como opção. Para clínicas, exibir o nome fantasia é o normal.

### Cited Findings
- [LEI] Art. 6, III (necessidade): "limitação do tratamento ao mínimo necessário para a realização de suas finalidades, com abrangência dos dados pertinentes, proporcionais e não excessivos". Também se aplicam I (finalidade), II (adequação) e VI (transparência) — [LGPD art. 6](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [LEI] Art. 10, §1: no legítimo interesse, somente dados "estritamente necessários" — [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [LEI] Art. 46 e §2: medidas de segurança desde a concepção do produto (privacy by design) — [LGPD art. 46](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [JURISPRUDÊNCIA] STJ, 2ª Turma, AREsp 2.130.619/SP (rel. Min. Francisco Falcão, j. 7/3/2023, Info 766): o vazamento de dados pessoais comuns, não sensíveis, não gera dano moral presumido; o titular precisa provar o dano. O relator ressalvou que dados sensíveis ou ligados à intimidade mudariam a análise — [Dizer o Direito](https://www.dizerodireito.com.br/2023/03/o-vazamento-de-dados-pessoais-nao-gera.html); [Machado Meyer](https://www.machadomeyer.com.br/pt/imprensa-ij/stj-e-a-ausencia-de-dano-moral-in-re-ipsa-em-vazamentos-de-dados)

### Inferences
- **Nunca exibir (BOA PRÁTICA forte, derivada do art. 6, III):** CPF/CNPJ de pessoa física, RG, CNH, data de nascimento ou idade exata, e-mail, endereço residencial, endereço exato da sala antes do contato (mostrar bairro e, se houver mapa, área aproximada), documentos de verificação, selfies de verificação e o histórico de logins.
- **Nome:** primeiro nome + inicial (ex.: "Mariana S.") é o padrão de Airbnb e de marketplaces e reduz o risco de cruzamento de dados (doxxing). Permitir que o anfitrião mostre o nome completo, com aviso, quando for profissional que quer ser encontrado.
- O AREsp 2.130.619 reduz o risco de indenização automática por exposição de telefone, mas não afasta sanções da ANPD nem ações em que o dano seja provado, como assédio ou golpes.

### Gaps
- Não há norma brasileira que fixe "primeiro nome + inicial". É padrão de mercado e inferência de minimização.

## 5. Registro profissional (CRM, CRP, CRO, CREFITO) pode ser exibido?

### Takeaway
O número de inscrição em conselho é informação de consulta pública nos cadastros dos próprios conselhos. Além disso, as regras de publicidade dos conselhos **exigem** que ele apareça na publicidade do profissional (para médicos, na Resolução CFM 2.336/2023). Exibir no perfil é defensável por legítimo interesse (verificação e confiança) ou por escolha do usuário. A **validação** do registro é que deve ser descrita com precisão no selo.

### Cited Findings
- [NORMA DE CONSELHO] A Resolução CFM 2.336/2023 (vigente desde 11/3/2024, substituiu a 1.974/2011) exige que a publicidade médica traga nome, nº de inscrição no CRM e a palavra "médico", e o RQE quando houver especialidade anunciada. Estabelecimentos devem informar o nº de cadastro no CRM e o nome e CRM do diretor técnico — [CRM-ES (texto)](https://crmes.org.br/wp-content/uploads/2023/09/Resolucao-2336-2023-publicidade-e-propaganda-medica.pdf); [Demarest](https://www.demarest.com.br/publicidade-medica-nas-redes-sociais-resolucao-cfm-traz-atualizacoes/); [CRM-PR](https://crmpr.org.br/uploadAddress/Publicidade-medica-apresentacao-coletiva-12-09-(1)[6052].pdf)
- [LEI] Art. 7, §3: dados de acesso público devem ser tratados considerando a finalidade, a boa-fé e o interesse público da disponibilização. Os cadastros dos conselhos existem justamente para permitir que o público verifique a habilitação — [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)

### Inferences
- Exibir "CRP 06/123456 — verificado em [data]" é compatível com a finalidade pública do cadastro. Recomendação: campo opcional, preenchido pelo anfitrião, mais a checagem no portal do conselho.
- O anúncio de sublocação de sala provavelmente **não** é "publicidade médica". Mas se o anfitrião usar a bio para divulgar seus serviços de saúde, as regras do conselho dele passam a valer, e a responsabilidade é dele. **[BOA PRÁTICA]** Avisar no campo de bio.

### Gaps
- Não verifiquei o texto das normas de publicidade do CFP (Código de Ética, Res. 10/2005), do CFO nem do COFFITO. Presume-se regra análoga (registro obrigatório em anúncios), mas isso não foi confirmado.
- Não confirmei os termos de uso dos portais de busca dos conselhos (se proíbem extração automatizada, como scraping, para validar registros).

## 6. Orientações da ANPD: pequeno porte, foto/biometria, retenção de documentos e selfies

### Takeaway
(a) Se o Subleasy for ME/EPP/startup e **não** fizer tratamento de alto risco, a Res. CD/ANPD 2/2022 dispensa o encarregado (mas exige canal com o titular), simplifica o registro e dá prazos em dobro. Atenção: verificação facial (biometria = dado sensível + tecnologia emergente) pode tirar a empresa desse regime. (b) Uma foto de perfil comum **não** é dado biométrico. Ela vira sensível quando passa por processamento técnico para identificação única, como o match selfie × documento. (c) Documentos e selfies de verificação devem ficar o mínimo de tempo possível, com acesso restrito, e ser eliminados quando a finalidade se cumprir (arts. 15–16).

### Cited Findings
- [REGULAMENTO] Res. CD/ANPD 2/2022, art. 3: não se beneficiam do regime diferenciado os agentes que (I) "realizem tratamento de alto risco para os titulares" ou (II) tenham receita acima do limite da LC 123/2006 — [ANPD](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022)
- [REGULAMENTO] Art. 4: é alto risco o tratamento que reúne cumulativamente ao menos um critério geral (larga escala; ou pode afetar significativamente interesses e direitos fundamentais) **e** ao menos um específico (tecnologias emergentes ou inovadoras; vigilância de zonas acessíveis ao público; decisões unicamente automatizadas; dados sensíveis ou de crianças, adolescentes e idosos) — [ANPD](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022)
- [REGULAMENTO] Art. 11: o agente de pequeno porte não precisa indicar encarregado, mas deve disponibilizar canal de comunicação com o titular. Indicar um encarregado conta como boa prática. Art. 14: prazo em dobro para atender titulares e para comunicar incidentes (redação da Res. 15/2024). Art. 15: declaração simplificada em até 15 dias — [ANPD](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022); [Demarest](https://www.demarest.com.br/conselho-diretor-aprova-regulamento-de-aplicacao-da-lgpd-para-agentes-de-tratamento-de-pequeno-porte/)
- [LEI] Art. 5, II: "dado biométrico, quando vinculado a uma pessoa natural" é dado sensível. Art. 11, II, "g": dispensa consentimento para sensíveis quando o tratamento for indispensável à "garantia da prevenção à fraude e à segurança do titular, nos processos de identificação e autenticação de cadastro em sistemas eletrônicos", salvo se prevalecerem direitos e liberdades fundamentais do titular — [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD — em construção] A ANPD colocou biometria na Agenda Regulatória 2025–2026 e abriu Tomada de Subsídios sobre dados biométricos (jun–ago/2025). A nota técnica que a acompanha observa que a LGPD não define "dado biométrico" e cita a doutrina e o GDPR: dado resultante de "tratamento técnico específico" que permite ou confirma a identificação única. A regulamentação ainda não foi concluída; a previsão é 2026 — [Participa + Brasil](https://www.gov.br/participamaisbrasil/ts-dados-biometricos); [nota da ANPD (PDF)](https://www.gov.br/participamaisbrasil/blob/baixar/68589); [Convergência Digital](https://convergenciadigital.com.br/governo/anpd-reconhecimento-facial-e-inteligencia-artificial-racham-consulta-sobre-biometria/)
- Posição doutrinária: a foto só vira biometria quando processada para identificar alguém de forma única. Se vazar apenas a imagem, o que vaza é dado pessoal comum, não o template biométrico — [Somos Zetta (PDF)](https://somoszetta.org.br/wp-content/uploads/2025/10/VF-Dados-Biometricos-no-Setor-Financeiro-e-de-Pagamentos1.pdf). Em sentido mais cauteloso, o Idec defende tratar a biometria facial com rigor de dado sensível — [Idec (PDF)](https://idec.org.br/sites/default/files/nt_biometria_facial_no_setor_de_saude_-_idec.pdf)
- [LEI] Arts. 15–16: o tratamento termina quando a finalidade é alcançada, e os dados são eliminados, ressalvada a guarda por obrigação legal ou regulatória, entre outras exceções — [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)

### Inferences
- A foto de perfil pública, sem reconhecimento facial, é dado pessoal comum. **Se** o Subleasy fizer match selfie × documento (próprio ou via fornecedor de KYC), haverá tratamento de dado sensível. A base pode ser o art. 11, II, "g" (prevenção a fraude), com RIPD recomendado. O processo também pode ser enquadrado como "alto risco" (dado sensível + tecnologia emergente), o que afasta os benefícios da Res. 2/2022 para esse tratamento. **[BOA PRÁTICA]** Usar fornecedor que não guarde o template, guardar só o resultado (aprovado/reprovado, data, fornecedor, ID da verificação) e apagar as imagens do documento e da selfie em prazo curto (ex.: 30–90 dias após a decisão, ou até resolver disputas). Não usar a selfie de verificação como foto pública.
- Retenção [BOA PRÁTICA]: definir na política o prazo para documentos e selfies. Manter apenas o mínimo para defender a plataforma em fraude (prazo prescricional), de preferência só metadados.

### Gaps
- Não encontrei o "Guia orientativo para agentes de pequeno porte" da ANPD com conteúdo verificado. Também não verifiquei se a regulamentação de biometria saiu em 2026.
- O limite exato da LC 123 citado pela Res. 2/2022 (R$ 4,8 milhões para EPP) vem de fontes secundárias — [Confidata](https://confidata.com.br/blog/lgpd-pequenas-empresas-resolucao-pequeno-porte).

## 7. Raspagem de telefones públicos: risco e mitigação; posições da ANPD e de tribunais

### Takeaway
Não existe norma da ANPD que obrigue "mostrar ao clicar" ou exigir login. Mas o art. 46 obriga a adotar medidas técnicas "aptas a proteger" contra acesso não autorizado e "comunicação ... ilícita", desde a concepção. Incidentes de raspagem em massa (Facebook, 2021) já geraram notificação da Senacon. O padrão defensável é: número fora do HTML inicial, revelado sob demanda, preferencialmente para usuário logado, com limitação de taxa e monitoramento.

### Cited Findings
- [LEI] Art. 46: os agentes devem adotar "medidas de segurança, técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou qualquer forma de tratamento inadequado ou ilícito". §2: isso vale "desde a fase de concepção do produto ou do serviço" — [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- Caso Facebook (2021): a base de 533 milhões de usuários, com cerca de 8 milhões de brasileiros, incluía celular, nome e ID. Ela foi obtida explorando o recurso "Adicionar amigo", que permitia descobrir o número. A Senacon notificou a empresa depois que o Procon-SP abriu apuração — [Tecnoblog](https://tecnoblog.net/noticias/2021/04/05/vazamento-do-facebook-expoe-533-milhoes-de-usuarios-incluindo-brasileiros/); [Consumidor Moderno](https://consumidormoderno.com.br/senacon-facebook-vazamento-dados/)
- ANPD/Telekall (2023): reutilizar contatos de WhatsApp coletados na internet foi sancionado (ver item 3) — [Mobile Time](https://www.mobiletime.com.br/noticias/06/07/2023/anpd-aplica-sua-primeira-sancao-com-multa-a-telekall/)
- Plataformas de classificados (OLX): o STJ vem afastando a responsabilidade da plataforma por golpes de terceiros quando ela apenas hospeda o anúncio e não intermedeia o negócio (REsp 1.444.008, Min. Nancy Andrighi; REsp 1.836.349/SP, 3ª Turma). Nesses casos, a plataforma responde só se houver falha do próprio serviço. Em sentido contrário, há condenação em 1ª instância de portal imobiliário que intermediava (Zap Imóveis) — [Tecnoblog](https://tecnoblog.net/noticias/2022/03/18/cuidado-com-golpes-na-olx-justica-decide-que-a-empresa-nao-tem-que-indenizar/); [Conjur](https://www.conjur.com.br/?p=354041); [Migalhas](https://www.migalhas.com.br/quentes/419213/olx-nao-indenizara-por-fraude-em-negociacao-de-falso-aluguel-de-carro); [Rota Jurídica](https://www.rotajuridica.com.br/?p=171645)
- [LEI] Sanções do art. 52: multa de até 2% do faturamento no Brasil, limitada a R$ 50 milhões por infração, além de advertência, publicização e bloqueio ou eliminação dos dados — [LGPD art. 52](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)

### Inferences (mitigações, todas BOA PRÁTICA, para cumprir o art. 46)
1. Não renderizar o número no HTML, no JSON-LD nem no SSR inicial. Revelar por chamada à API depois do clique em "Ver WhatsApp" ou "Abrir WhatsApp" (link `wa.me` gerado na hora).
2. Exigir login (ou ao menos captcha) para revelar, mesmo com o toggle "todos os visitantes". Se exigir login, o texto do toggle precisa refletir isso ("visitantes com conta"), senão o consentimento descreve outra coisa (art. 9, §1).
3. Limitar revelações por IP, conta e dispositivo. Registrar cada revelação (útil para o art. 15 do MCI e para investigar abusos).
4. Excluir a rota de revelação dos crawlers (robots/noindex) e não incluir o telefone em sitemaps nem em dados estruturados.
5. Oferecer, como alternativa, a mensagem interna, que mantém o número privado.
6. Monitorar picos e bloquear automações. Ter plano de resposta a incidentes (comunicação à ANPD e ao titular, art. 48, com prazo em dobro para pequeno porte).

### Gaps
- Não encontrei nota técnica da ANPD dedicada a raspagem nem decisão do STJ/TJSP sobre exposição de telefone **em perfil de plataforma** causada pelo próprio desenho do produto.
- Não achei ação do Idec nem procedimento da ANPD concluído no caso Facebook 2021.

## 8. CDC e Marco Civil: perfil público e selo "verificado"

### Takeaway
[LEI] Pelo CDC, o Subleasy é fornecedor de serviço para anfitriões e visitantes. O selo "verificado" é informação ou publicidade sobre o serviço: se der a entender mais do que foi checado, pode ser considerado publicidade enganosa (art. 37, §1), inclusive por omissão (§3). Também pode atrair responsabilidade pela falha do serviço (art. 14), afastando a defesa de "mero classificado" usada pela OLX. Pelo Marco Civil: guardar os registros de acesso a aplicações por 6 meses (art. 15), informar com clareza sobre os dados (art. 7, VIII) e colher consentimento destacado (art. 7, IX).

### Cited Findings
- [LEI] CDC art. 6, III (informação adequada e clara) e IV (proteção contra publicidade enganosa); art. 14 (o fornecedor de serviços responde, independentemente de culpa, por defeitos e informações insuficientes ou inadequadas); art. 30 (a informação suficientemente precisa vincula o fornecedor); art. 37, §1 (é enganosa a informação "inteira ou parcialmente falsa, ou, por qualquer outro modo, mesmo por omissão, capaz de induzir em erro o consumidor"); §3 (enganosa por omissão quando deixa de informar dado essencial) — [CDC](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm); resumo do art. 37 em [LegJur](https://www.legjur.com/legislacao/art/lei_00080781990-37)
- STJ: a OLX, ao manter um site de classificados, é prestadora de serviço numa relação de consumo, mas responde por golpes de terceiros só se houver falha do próprio serviço ou intermediação — [Conjur](https://www.conjur.com.br/?p=354041); [Migalhas/TJGO](https://www.migalhas.com.br/quentes/361623/tjgo-olx-atua-como-classificado-virtual-e-nao-responde-por-golpe)
- [LEI] Marco Civil art. 15: o provedor de aplicações constituído como pessoa jurídica, com fins econômicos, deve manter os registros de acesso a aplicações "pelo prazo de 6 (seis) meses". Art. 10: a guarda deve preservar intimidade e vida privada, e a disponibilização depende de ordem judicial (§1). Art. 7, VIII: "informações claras e completas sobre coleta, uso, armazenamento, tratamento e proteção de seus dados pessoais". Art. 7, X: exclusão definitiva ao término da relação, ressalvada a guarda obrigatória. Art. 13 (registros de conexão, 1 ano) vale para provedores de conexão, não para o Subleasy — [Marco Civil](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm)
- STF, Temas 987 e 533 (j. 26/6/2025): o art. 19 do MCI foi declarado parcialmente inconstitucional. Provedores podem responder por conteúdo de terceiros em mais hipóteses além do descumprimento de ordem judicial. O regime continua baseado em culpa, com esquemas distintos por tipo de conteúdo. Houve embargos da Abraji — [Machado Meyer](https://www.machadomeyer.com.br/pt/inteligencia-juridica/publicacoes-ij/direito-digital/stf-muda-regime-de-responsabilizacao-das-plataformas); [Mattos Filho](https://www.mattosfilho.com.br/unico/responsabilizacao-provedores-internet/); [DPL News](https://dplnews.com/?p=299771)

### Inferences
- **Selo [LEI → derivado + BOA PRÁTICA]:** o selo deve dizer exatamente o que foi verificado e quando. Exemplos: "Identidade verificada (documento + selfie) em mar/2026", "Telefone confirmado por SMS", "CRP conferido no cadastro do conselho". Ter uma página "O que significa verificado", ligada ao selo, com o aviso explícito de que a verificação **não** garante a sala, o contrato ou o comportamento do anfitrião (para evitar enganosidade por omissão, art. 37, §3). Não usar "verificado" genérico se só o e-mail foi confirmado. Revalidar ou expirar o selo periodicamente.
- Quanto mais o Subleasy assegura (selo forte, pagamento intermediado), mais se afasta da tese de "mero classificado" e mais se expõe ao art. 14 do CDC. É uma decisão de produto com consequência jurídica.
- Como o STF ampliou a responsabilidade por conteúdo de terceiros, convém ter canal de denúncia e remoção ágil de perfis e anúncios fraudulentos ou com dados de terceiros (ex.: alguém publicando o telefone de outra pessoa na bio).
- Logs: guardar IP, data/hora e porta de origem de cada acesso por 6 meses no mínimo (MCI art. 15). Isso também serve de prova do consentimento (art. 8, §2).

### Gaps
- Não encontrei decisão brasileira específica sobre selo "verificado" enganoso em plataforma.
- Não encontrei a tese do STF aplicada especificamente a marketplaces nem o texto final após os embargos.
- Não verifiquei o Decreto 7.962/2013 (comércio eletrônico), que pode exigir identificação do fornecedor no site.

## Questões em aberto (para advogado)
1. O telefone revelado só a usuários logados após clique pode se apoiar no art. 7, V, ou exige consentimento? (Recomendação conservadora: consentimento.)
2. O Subleasy se enquadra como agente de pequeno porte se adotar verificação facial (alto risco)?
3. Qual o prazo de retenção de documentos e selfies de verificação que equilibra o art. 16 e a defesa em casos de fraude?
4. Qual o texto exato e vigente da LGPD em 2026? Há possível alteração por lei de 2026 a confirmar.
5. Os anúncios feitos por profissionais de saúde atraem regras de publicidade dos conselhos (CFP, CFO, COFFITO)?
