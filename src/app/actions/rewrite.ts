"use server";

import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { EXTRACTION_MODEL, aiErrorMessage, geminiClient } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";

export type RewriteField = "title" | "short_summary" | "description" | "rules";
export type RewriteTone = "escrever" | "melhorar" | "encurtar" | "detalhar";

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
  rules: {
    max: 600,
    rule: "Regras de uso da sala: de 3 a 6 frases curtas, uma por linha, sem marcadores nem numeração. Combine o que os fatos dizem com regras comuns de sala compartilhada, como deixar a sala organizada e respeitar o horário reservado.",
  },
};

const TONES: Record<RewriteTone, string> = {
  escrever: "Escreva o texto do zero a partir dos fatos do anúncio.",
  melhorar: "Reescreva com mais clareza, mantendo o tamanho.",
  encurtar: "Reescreva mais curto e direto.",
  detalhar: "Reescreva com mais detalhes, usando só os fatos do anúncio.",
};

const SYSTEM_PROMPT = `Você reescreve textos de anúncios do Subleasy, onde donos de consultórios e salas sublocam o espaço por hora, turno, dia ou mês para profissionais de saúde e bem-estar.

- Português do Brasil, tratando o leitor por "você".
- Use só os fatos do anúncio. Nunca invente comodidade, preço, endereço, disponibilidade, licença ou acessibilidade.
- Sem adjetivos que não podem ser verificados ("incrível", "o melhor", "luxuoso"), sem exclamações e sem emojis.
- Não inclua endereço completo, telefone, e-mail, links ou nomes de pessoas.
- Devolva uma única opção, só o texto pronto, sem aspas, sem alternativas e sem comentários.`;

/** Escreve ou reescreve título, resumo, descrição ou regras com o Gemini, como o "Help me write" do Gmail. */
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
    let text = (response.choices[0]?.message.content ?? "").trim();
    // Título e resumo são de uma linha: se o modelo mandar opções, fica a primeira.
    if (field === "title" || field === "short_summary") text = text.split("\n").find((line) => line.trim()) ?? "";
    text = text
      .replace(/^["“]|["”]$/g, "")
      .trim();
    if (!text) return { ok: false, error: "A IA não devolveu um texto. Tente de novo." };
    return { ok: true, text: text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text };
  } catch (error) {
    return { ok: false, error: aiErrorMessage(error, "reescrita") };
  }
}

export type ListingCopy = { title: string; short_summary: string; description: string };
export type ListingCopyResult = { ok: true; copy: ListingCopy } | { ok: false; error: string };

const copySchema = z.object({ title: z.string(), short_summary: z.string(), description: z.string() });

/**
 * Primeira versão de título, resumo e descrição, numa chamada só, a partir do que o
 * anunciante respondeu no cadastro (tipo, local, comodidades, destaques). Ele edita depois.
 */
export async function suggestListingCopy(facts: string): Promise<ListingCopyResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Entre na sua conta para usar a IA." };

  const ai = geminiClient();
  if (!ai) return { ok: false, error: "Serviço de IA não configurado." };

  try {
    const response = await ai.chat.completions.parse({
      model: EXTRACTION_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Escreva o anúncio a partir dos fatos.\n<regras>\n- title: ${LIMITS.title.rule}\n- short_summary: ${LIMITS.short_summary.rule}\n- description: ${LIMITS.description.rule}\n</regras>\n<fatos>${facts.slice(0, 3000)}</fatos>`,
        },
      ],
      response_format: zodResponseFormat(copySchema, "anuncio"),
    });
    const parsed = response.choices[0]?.message.parsed;
    if (!parsed) return { ok: false, error: "A IA não devolveu um texto. Tente de novo." };

    const clean = (text: string, max: number) => {
      const value = text.trim().replace(/^["“]|["”]$/g, "").trim();
      return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
    };
    return {
      ok: true,
      copy: {
        title: clean(parsed.title.split("\n")[0] ?? "", LIMITS.title.max),
        short_summary: clean(parsed.short_summary.split("\n")[0] ?? "", LIMITS.short_summary.max),
        description: clean(parsed.description, LIMITS.description.max),
      },
    };
  } catch (error) {
    return { ok: false, error: aiErrorMessage(error, "sugestão do anúncio") };
  }
}
