import type { Metadata } from "next";
import Link from "next/link";
import { Fill, LegalPage } from "@/components/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description:
    "Quais dados o Subleasy coleta, para que usa, com quem compartilha e como você exerce seus direitos pela LGPD.",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacidadePage() {
  return (
    <LegalPage
      title="Política de privacidade"
      summary={
        <ul>
          <li>Pedimos só nome, e-mail e WhatsApp para criar sua conta. Não pedimos CPF.</li>
          <li>Seu WhatsApp aparece apenas quando alguém clica em &quot;Falar no WhatsApp&quot; no seu anúncio, ou no seu perfil público se você ligar essa opção.</li>
          <li>Seu perfil público mostra o primeiro nome com a inicial do último, a foto e a apresentação que você escolher e, se você anuncia, os seus anúncios no ar.</li>
          <li>O endereço completo da sala fica guardado e não é publicado.</li>
          <li>Não vendemos seus dados. Só mandamos novidades por e-mail se você autorizar.</li>
          <li>Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento.</li>
        </ul>
      }
    >
      <p>
        Esta política explica como o Subleasy trata dados pessoais, de acordo com a Lei Geral de
        Proteção de Dados (Lei 13.709/2018, a LGPD). Ela vale junto com os{" "}
        <Link href="/termos">Termos de uso</Link>.
      </p>

      <h2 id="controlador">1. Quem cuida dos seus dados</h2>
      <p>
        O controlador dos dados é <Fill value={LEGAL.controller} />, CPF/CNPJ{" "}
        <Fill value={LEGAL.document} />, com endereço em <Fill value={LEGAL.address} />.
      </p>
      <p>
        O encarregado pelo tratamento de dados é <Fill value={LEGAL.dpoName} />, que atende pelo
        e-mail <Fill value={LEGAL.privacyEmail} />.
      </p>

      <h2 id="dados">2. Quais dados coletamos</h2>
      <h3>Quando você cria a conta</h3>
      <ul>
        <li>
          <strong>E-mail</strong>, para você entrar e receber avisos da conta.
        </li>
        <li>
          <strong>Nome</strong>, que aparece no anúncio como anunciante. Pode ser o nome da
          clínica.
        </li>
        <li>
          <strong>WhatsApp</strong>, o contato dos seus anúncios e o canal do lembrete de
          disponibilidade.
        </li>
        <li>
          <strong>Data e versão dos termos aceitos</strong>, como registro do seu aceite.
        </li>
        <li>
          <strong>Sua escolha sobre receber novidades</strong> por e-mail, com a data da escolha.
        </li>
      </ul>
      <p>
        Se você entrar com o Google, ele nos envia seu nome, e-mail e foto de perfil. Usamos o
        nome para preencher o cadastro. A foto não aparece no site.
      </p>

      <h3>Quando você anuncia uma sala</h3>
      <ul>
        <li>
          Descrição, fotos, tipo de sala, preço, bairro, cidade, turnos livres, regras e
          comodidades. Esses dados ficam públicos quando o anúncio é publicado.
        </li>
        <li>
          Endereço completo e WhatsApp do anúncio. Ficam guardados à parte e não são publicados.
          O WhatsApp é entregue a quem clica no botão de contato.
        </li>
      </ul>

      <h3>Seu perfil público</h3>
      <p>
        Cada conta tem uma página pública, com endereço formado por um código aleatório, sem seu
        nome. Ela só é encontrada por quem tem o link (fica fora dos buscadores) e mostra:
      </p>
      <ul>
        <li>
          <strong>Primeiro nome e inicial do último</strong> (como &quot;Ana S.&quot;) e o mês e o ano em
          que você entrou no Subleasy.
        </li>
        <li>
          <strong>Se você anuncia</strong>: quantos anúncios tem no ar, as cidades deles e os próprios
          anúncios. O link para o seu perfil aparece nas páginas das suas salas.
        </li>
        <li>
          <strong>Foto e apresentação</strong>, se você preencher. As duas são opcionais e você muda
          ou apaga quando quiser em Configurações.
        </li>
        <li>
          <strong>O que o Subleasy confirmou</strong>: e-mail confirmado, revisão dos anúncios pela
          equipe e, quando houver, a data em que conferimos sua identidade com documento e selfie.
          Não guardamos as imagens dessa conferência depois da análise.
        </li>
        <li>
          <strong>Seu WhatsApp</strong>, só se você ligar &quot;Exibir meu WhatsApp a todos os visitantes do
          meu perfil&quot;. A opção vem desligada. Guardamos quando você ligou ou desligou, com a versão
          do texto que você leu. Desligar vale na hora.
        </li>
      </ul>
      <p>O perfil não mostra e-mail, CPF, endereço da sala nem endereço pessoal.</p>

      <h3>Quando você visita o site</h3>
      <ul>
        <li>
          Cookies de sessão, que mantêm você conectado. Sem eles, o login não funciona.
        </li>
        <li>
          Um identificador aleatório, guardado em cookie, que conta visualizações e cliques no
          WhatsApp de cada anúncio. Ele não está ligado ao seu nome nem ao seu e-mail, e cada
          pessoa conta uma vez por anúncio por dia.
        </li>
        <li>
          Registros de acesso (endereço IP, data e hora), que a lei exige guardar por 6 meses.
        </li>
      </ul>
      <p>
        Não pedimos CPF, data de nascimento, endereço pessoal nem registro em conselho
        profissional.
      </p>

      <h2 id="finalidades">3. Para que usamos e com qual base legal</h2>
      <p>A LGPD exige uma base legal para cada uso. Estas são as nossas:</p>
      <ul>
        <li>
          <strong>Executar o serviço que você pediu</strong> (art. 7º, V): criar sua conta,
          publicar seus anúncios, levar profissionais até o seu WhatsApp e enviar o lembrete de
          disponibilidade.
        </li>
        <li>
          <strong>Legítimo interesse</strong> (art. 7º, IX): mostrar no seu painel quantas
          pessoas viram e contataram cada anúncio, mostrar no seu perfil público o nome, a data de
          entrada, os anúncios no ar e o que confirmamos sobre a conta, para que quem procura sala
          confie em quem anuncia, melhorar o site e prevenir fraude e abuso.
        </li>
        <li>
          <strong>Cumprir a lei</strong> (art. 7º, II): guardar registros de acesso, como manda o
          Marco Civil da Internet.
        </li>
        <li>
          <strong>Consentimento</strong> (art. 7º, I): enviar novidades e dicas por e-mail e mostrar
          seu WhatsApp no perfil público. Você pode retirar o consentimento quando quiser, pela
          chave em Configurações, pelo link em cada e-mail ou escrevendo para nós.
        </li>
      </ul>

      <h2 id="ia">4. Inteligência artificial</h2>
      <p>
        O texto que você escreve no cadastro com IA é enviado à API Gemini, do Google, que
        organiza a descrição em campos e escreve título e resumo. Nesse uso, o Google pode
        processar o texto em servidores fora do Brasil e, no plano que usamos hoje, pode usá-lo
        para melhorar os próprios produtos.
      </p>
      <p>
        Por isso, não escreva na descrição nomes de pacientes, telefones ou outros dados pessoais.
        A IA também é instruída a retirar telefone, e-mail e endereço completo do texto do
        anúncio.
      </p>

      <h2 id="compartilhamento">5. Com quem compartilhamos</h2>
      <p>Não vendemos dados pessoais. Compartilhamos só o necessário com quem nos ajuda a operar:</p>
      <ul>
        <li>
          <strong>Supabase</strong>: banco de dados, login e armazenamento de fotos, em servidores
          em São Paulo.
        </li>
        <li>
          <strong>Google</strong>: login com Google e processamento do texto pela IA.
        </li>
        <li>
          <strong>Serviço de envio de e-mail</strong>: links de acesso, lembretes e, se você
          autorizar, novidades.
        </li>
        <li>
          <strong>Hospedagem do site</strong>: entrega das páginas e registros de acesso.
        </li>
      </ul>
      <p>
        Quando um profissional clica em &quot;Falar no WhatsApp&quot;, a conversa acontece no
        WhatsApp, que segue a política de privacidade da Meta.
      </p>
      <p>
        Também podemos entregar dados a autoridades quando houver ordem judicial ou obrigação
        legal.
      </p>

      <h2 id="internacional">6. Transferência para fora do Brasil</h2>
      <p>
        Alguns desses serviços, como o Google, podem tratar dados em outros países. Nesses casos,
        usamos fornecedores que oferecem proteção compatível com a LGPD, conforme o art. 33.
      </p>

      <h2 id="retencao">7. Por quanto tempo guardamos</h2>
      <ul>
        <li>Dados da conta e dos anúncios: enquanto a conta existir.</li>
        <li>Anúncios pausados: ficam guardados para você reativar com um clique.</li>
        <li>
          Depois de um pedido de exclusão: apagamos em até 30 dias, exceto o que a lei manda
          guardar.
        </li>
        <li>Registros de acesso: 6 meses, pelo Marco Civil da Internet.</li>
      </ul>

      <h2 id="seguranca">8. Como protegemos</h2>
      <ul>
        <li>Todo acesso ao site usa conexão criptografada (HTTPS).</li>
        <li>Não guardamos senhas: o login é feito pelo Google ou por link de uso único.</li>
        <li>
          O banco de dados libera cada registro só para quem tem permissão. Seu WhatsApp e o
          endereço completo da sala só podem ser lidos por você.
        </li>
        <li>As chaves de acesso aos serviços ficam no servidor, fora do navegador.</li>
      </ul>
      <p>
        Se houver um incidente de segurança que possa trazer risco a você, avisamos você e a
        Autoridade Nacional de Proteção de Dados (ANPD).
      </p>

      <h2 id="direitos">9. Seus direitos</h2>
      <p>Pela LGPD (art. 18), você pode pedir a qualquer momento:</p>
      <ul>
        <li>Confirmação de que tratamos seus dados e acesso a eles.</li>
        <li>Correção de dados incompletos ou errados.</li>
        <li>Anonimização, bloqueio ou eliminação de dados desnecessários.</li>
        <li>Portabilidade dos dados para outro serviço.</li>
        <li>Informação sobre com quem compartilhamos seus dados.</li>
        <li>Retirada do consentimento para receber novidades.</li>
        <li>Exclusão da conta e dos dados ligados a ela.</li>
      </ul>
      <p>
        Escreva para <Fill value={LEGAL.privacyEmail} />. Respondemos em até 15 dias. Se não
        ficar satisfeito, você pode reclamar à ANPD em{" "}
        <a href="https://www.gov.br/anpd" rel="noopener noreferrer" target="_blank">
          gov.br/anpd
        </a>
        .
      </p>

      <h2 id="idade">10. Menores de idade</h2>
      <p>O Subleasy é feito para maiores de 18 anos. Não criamos conta para menores.</p>

      <h2 id="mudancas">11. Mudanças nesta política</h2>
      <p>
        Quando mudarmos algo importante, avisamos por e-mail antes de a mudança valer. A data da
        última atualização fica no topo desta página.
      </p>
    </LegalPage>
  );
}
