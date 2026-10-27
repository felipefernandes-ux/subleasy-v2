import type { Metadata } from "next";
import Link from "next/link";
import { Fill, LegalPage } from "@/components/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Termos de uso",
  description:
    "Regras para anunciar e procurar salas no Subleasy: o que cabe a você, o que cabe a nós e como funciona o contato direto pelo WhatsApp.",
  alternates: { canonical: "/termos" },
};

export default function TermosPage() {
  return (
    <LegalPage
      title="Termos de uso"
      summary={
        <ul>
          <li>O Subleasy é um classificado. Ele aproxima quem tem uma sala de quem precisa de uma.</li>
          <li>Publicar anúncio é grátis e não cobramos comissão sobre a locação.</li>
          <li>O acordo, o contrato e o pagamento são combinados direto entre anunciante e profissional.</li>
          <li>Quem anuncia responde pelas informações do anúncio e pela autorização para sublocar.</li>
          <li>O texto que a IA escreve é uma sugestão. Você revisa antes de publicar.</li>
        </ul>
      }
    >
      <p>
        Estes termos valem para quem usa o site subleasy.com.br, com ou sem conta. Ao criar uma
        conta, você confirma que leu e aceita estes termos e a{" "}
        <Link href="/privacidade">Política de privacidade</Link>.
      </p>
      <p>
        O Subleasy é mantido por <Fill value={LEGAL.controller} />, inscrito no CPF/CNPJ{" "}
        <Fill value={LEGAL.document} />, com endereço em <Fill value={LEGAL.address} />. Nestes
        termos, &quot;nós&quot; somos o Subleasy e &quot;você&quot; é quem usa o site.
      </p>

      <h2 id="o-que-e">1. O que o Subleasy faz</h2>
      <p>
        O Subleasy publica anúncios de consultórios, salas terapêuticas e espaços de bem-estar
        para locação por hora, turno, dia ou mês. Chamamos de <strong>anunciante</strong> quem
        anuncia a sala e de <strong>profissional</strong> quem procura uma.
      </p>
      <p>
        Nós exibimos os anúncios e levamos o profissional até o WhatsApp do anunciante. A partir
        daí, a negociação, o contrato de locação e o pagamento ficam entre os dois. O Subleasy
        também não administra as salas anunciadas.
      </p>

      <h2 id="conta">2. Sua conta</h2>
      <ul>
        <li>Você precisa ter 18 anos ou mais para criar uma conta.</li>
        <li>
          Você entra com sua conta Google ou com um link enviado ao seu e-mail. Não guardamos
          senha.
        </li>
        <li>
          Os dados do cadastro precisam ser verdadeiros. O WhatsApp informado precisa ser seu ou
          da clínica que você representa.
        </li>
        <li>
          Você responde pelo que acontece na sua conta. Se perceber um acesso que não foi seu,
          escreva para <Fill value={LEGAL.contactEmail} />.
        </li>
      </ul>

      <h2 id="anunciante">3. Regras para quem anuncia</h2>
      <p>Ao publicar um anúncio, você declara que:</p>
      <ul>
        <li>
          Tem o direito de sublocar a sala. Se o imóvel for alugado ou ficar em condomínio, o
          contrato e as regras do prédio permitem a sublocação.
        </li>
        <li>
          A sala tem as licenças que a atividade exige, como alvará e licença sanitária, quando
          for o caso. Essa verificação é sua: o Subleasy não confere documentos.
        </li>
        <li>Preço, endereço, turnos livres, regras e comodidades do anúncio são verdadeiros.</li>
        <li>
          As fotos são suas ou você tem autorização para usá-las. Elas não mostram pacientes,
          documentos ou pessoas que não autorizaram a imagem.
        </li>
        <li>Vai manter o anúncio atualizado e pausá-lo quando a sala deixar de estar livre.</li>
      </ul>

      <h3>Prazo do anúncio</h3>
      <p>
        Cada anúncio fica no ar por 30 dias a partir da publicação. Antes do fim do prazo, você
        pode renovar por mais 30 dias, sem custo. Sem renovação, o anúncio sai da busca e deixa de
        receber contatos. Ele continua salvo no seu painel e volta ao ar quando você renovar.
      </p>

      <h2 id="ia">4. Textos escritos pela IA</h2>
      <p>
        O cadastro usa inteligência artificial para transformar a sua descrição em título,
        resumo e campos do anúncio. Tudo o que a IA gera aparece marcado como sugestão. Você
        revisa, corrige e decide o que publicar. Depois de publicado, o texto é seu e você
        responde por ele.
      </p>
      <p>
        A IA pode errar. Ela não define preço, endereço nem disponibilidade: esses dados sempre
        vêm de você.
      </p>

      <h2 id="profissional">5. Regras para quem procura</h2>
      <ul>
        <li>
          Use o contato do anunciante só para tratar da locação da sala. Enviar propaganda ou
          repassar o número a terceiros é proibido.
        </li>
        <li>
          Antes de fechar negócio, visite a sala, confira as condições e combine tudo por
          escrito. Recomendamos um contrato simples com valor, turnos, prazo e regras de uso.
        </li>
        <li>
          Pagamentos são combinados direto com o anunciante. O Subleasy não recebe nem repassa
          valores.
        </li>
      </ul>

      <h2 id="proibido">6. O que não é permitido</h2>
      <ul>
        <li>Anunciar sala que não existe, que não está disponível ou que não é sua para sublocar.</li>
        <li>Usar o anúncio para oferecer outro produto ou serviço.</li>
        <li>Publicar conteúdo discriminatório, ofensivo ou que viole direitos de outras pessoas.</li>
        <li>Incluir no anúncio dados pessoais de terceiros, como nome e telefone de pacientes.</li>
        <li>
          Copiar anúncios ou contatos em massa com robôs, ou tentar acessar áreas do site sem
          autorização.
        </li>
      </ul>
      <p>
        Se um anúncio descumprir estes termos, podemos pausá-lo ou removê-lo e, em casos graves,
        encerrar a conta. Sempre que possível, avisamos você por e-mail e explicamos o motivo.
      </p>

      <h2 id="conteudo">7. Seu conteúdo</h2>
      <p>
        Fotos e textos do anúncio continuam sendo seus. Ao publicar, você autoriza o Subleasy a
        exibi-los no site, em prévias de compartilhamento (como WhatsApp e Instagram) e em
        resultados de busca, enquanto o anúncio existir. Essa autorização não é exclusiva: você
        pode anunciar a mesma sala em outros lugares.
      </p>

      <h2 id="preco">8. Preço do serviço</h2>
      <p>
        Criar conta, publicar anúncio, ver o painel básico e receber contatos pelo WhatsApp são
        gratuitos. Se criarmos recursos pagos, eles serão opcionais e apresentados com preço
        antes de qualquer cobrança.
      </p>

      <h2 id="responsabilidade">9. Responsabilidades</h2>
      <p>
        Nós cuidamos para que o site funcione e para que os anúncios sigam estas regras. Como não
        participamos da negociação, não respondemos pelo estado da sala, pelo cumprimento do que
        foi combinado entre as partes nem por pagamentos feitos fora do Subleasy, na medida em que
        a lei permite.
      </p>
      <p>
        O site pode ficar fora do ar por manutenção ou por falhas de serviços que usamos. Quando a
        parada for planejada, avisamos com antecedência sempre que possível.
      </p>

      <h2 id="encerramento">10. Encerrar a conta</h2>
      <p>
        Você pode pedir a exclusão da sua conta a qualquer momento pelo e-mail{" "}
        <Fill value={LEGAL.privacyEmail} />. Em breve, a opção também estará no painel. Ao
        excluir a conta, seus anúncios saem do ar. O que acontece com seus dados está na{" "}
        <Link href="/privacidade">Política de privacidade</Link>.
      </p>

      <h2 id="mudancas">11. Mudanças nestes termos</h2>
      <p>
        Quando mudarmos algo importante, avisamos por e-mail com pelo menos 15 dias de
        antecedência e pedimos um novo aceite no próximo acesso. A data da última atualização
        fica no topo desta página.
      </p>

      <h2 id="lei">12. Lei e foro</h2>
      <p>
        Estes termos seguem a lei brasileira, incluindo o Código de Defesa do Consumidor, o Marco
        Civil da Internet e a Lei Geral de Proteção de Dados. Conflitos são resolvidos no foro do
        seu domicílio.
      </p>

      <h2 id="contato">13. Contato</h2>
      <p>
        Dúvidas sobre estes termos: <Fill value={LEGAL.contactEmail} />.
      </p>
    </LegalPage>
  );
}
