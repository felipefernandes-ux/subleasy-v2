"use server";

import { EXTRACTION_MODEL, aiErrorMessage, geminiClient } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";

export type RewriteField = "title" | "short_summary" | "description";
export type RewriteTone = "melhorar" | "encurtar" | "detalhar";

export type RewriteResult = { ok: true; text: string } | { ok: false; error: string };

const LIMITS: Record<RewriteField, { max: number; rule: string }> = {
  title: {
    max: 70,
    rule: 'Título de até 70 caracteres: tipo de sala, diferencial principal e bairro. Ex.: "Sala para psicologia com janela ampla na Zona 7".',
  },
  short_summary: {
    max: 120,
    rule: "Resumo de até 120 caracteres para cards e prévia no WhatsApp. Uma frase.",
  },
  description: {
    max: 1500,
    rule: "Descrição de 80 a 160 palavras em parágrafos curtos: para quem a sala serve, o que tem na sala, o que o prédio oferece e como funciona a locação.",
  },
};

const TONES: Record<RewriteTone, string> = {
  melhorar: "Reescreva com mais clareza, mantendo o tamanho.",
  encurtar: "Reescreva mais curto e direto.",
  detalhar: "Reescreva com mais detalhes, usando só os fatos do anúncio.",
};

const SYSTEM_PROMPT = `Você reescreve textos de anúncios do Subleasy, onde donos de consultórios e salas sublocam o espaço por hora, turno, dia ou mês para profissionais de saúde e bem-estar.

- Português do Brasil, tratando o leitor por "você".
- Use só os fatos do anúncio. Nunca invente comodidade, preço, endereço, disponibilidade, licença ou acessibilidade.
- Sem adjetivos que não podem ser verificados ("incrível", "o melhor", "luxuoso"), sem exclamações e sem emojis.
- Não inclua endereço completo, telefone, e-mail, links ou nomes de pessoas.
- Devolva só o texto pronto, sem aspas e sem comentários.`;

/** Reescreve título, resumo ou descrição com o Gemini, como o "Help me write" do Gmail. */
export async function rewriteField(
  field: RewriteField,
  tone: RewriteTone,
  current: string,
  facts: string,
): Promise<RewriteResult> {
  if (!(field in LIMITS) || !(tone in TONES)) return { ok: false, error: "Pedido inválido." };

  // Só quem está logado usa a IA: evita gasto da cota por robôs.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Entre na sua conta para usar a IA." };

  const ai = geminiClient();
  if (!ai) return { ok: false, error: "Serviço de IA não configurado." };

  const { max, rule } = LIMITS[field];
  try {
    const response = await ai.chat.completions.create({
      model: EXTRACTION_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `<regra>${rule}</regra>\n<pedido>${TONES[tone]}</pedido>\n<fatos>${facts.slice(0, 3000)}</fatos>\n<texto_atual>${current.slice(0, 3000)}</texto_atual>`,
        },
      ],
    });
    const text = (response.choices[0]?.message.content ?? "")
      .trim()
      .replace(/^["“]|["”]$/g, "")
      .trim();
    if (!text) return { ok: false, error: "A IA não devolveu um texto. Tente de novo." };
    return { ok: true, text: text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text };
  } catch (error) {
    return { ok: false, error: aiErrorMessage(error, "reescrita") };
  }
}
