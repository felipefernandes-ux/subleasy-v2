# Convite 2.0: o que falta para funcionar

Estado em 28/10/2026. O código, a migração `campaign_invites` e as variáveis `BREVO_API_KEY`,
`INVITE_TOKEN_SECRET` e `INVITE_BASE_URL` já estão em produção. Nenhum e-mail foi enviado.

## Antes de enviar

1. **Confirmar `INVITE_BASE_URL`.** O link do e-mail é `<INVITE_BASE_URL>/convite/<token>`. Hoje o único
   endereço público do 2.0 que abre o convite é `https://subleasy-v2.vercel.app`. `subleasy.com.br` e
   `www.subleasy.com.br` ainda são o WordPress (o `www` redireciona para o domínio raiz), então o link
   cairia em 404. Se o valor cadastrado for outro, troque e faça redeploy.
2. **Brevo, chave sem restrição de IP.** A Vercel não tem IP fixo. Se a conta tiver IPs autorizados,
   desative em app.brevo.com/security/authorised_ips, senão a sincronização retorna erro.
3. **Brevo, domínio remetente autenticado** (SPF, DKIM e DMARC de `subleasy.com.br`). Sem isso o e-mail
   cai em spam ou é recusado. Não dá para conferir pelo código.
4. **Criar o modelo e a campanha no Brevo.** O Super Admin só sincroniza os contatos para a lista
   "Convite 2.0". O envio é feito no Brevo, com o HTML de `docs/email/convite.html` (variáveis
   `FIRSTNAME`, `AD_TITLE` e `INTEREST_URL`). A tela "Campanhas" do Super Admin é Fase 2 e não envia.
5. **Teste de ponta a ponta com o seu usuário**, antes de enviar para a base:
   pré-visualizar no card de `/leads` (mostra quem entra e quem fica de fora, sem enviar) → sincronizar →
   enviar o teste do Brevo para você → abrir o link → conferir `clicked_at` em `campaign_invites` →
   clicar em "Quero participar" → conferir `interested_at`. Um link com token válido ainda não foi testado
   em produção, porque abri-lo grava um clique real.

## Cuidados

- **Não troque `INVITE_TOKEN_SECRET` depois do envio.** O token é assinado com ela; trocar invalida todos
  os links já enviados.
- **Troca de domínio.** Quando o 2.0 assumir `subleasy.com.br`, atualize `INVITE_BASE_URL` e faça redeploy.
  Os links antigos continuam válidos, porque a assinatura não depende do endereço, mas o endereço dentro
  do e-mail já enviado continua o antigo. Mantenha o `vercel.app` no ar até o fim da campanha.
- **Resultados.** Ainda não há tela de resultados (Fase 2). O acompanhamento é consultar
  `campaign_invites` no Supabase: `clicked_at` é o clique no link e `interested_at` é a confirmação.

## Ainda sem código

- O e-mail de ativação (`docs/email/ativacao.html`, "Fotos, texto e endereço já estão lá") não tem envio
  nem automação. Hoje é só modelo.
- Lista de supressão e link de descadastro próprio: o descadastro depende do rodapé do Brevo.
