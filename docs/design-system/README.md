# Subleasy 2.0: Design System

Fonte: tema atual de subleasy.com.br e a seção "Padrões de design" do documento *Subleasy 2.0: estratégia, posicionamento e plano de negócio* (v1.1, 21/10/2026).
Prancha visual: `subleasy-design-system.png` (gerada por `render.py`). Atenção: a prancha ainda mostra a Satoshi, porque o renderizador não tem acesso aos arquivos da Area Normal. Filosofia visual: `philosophy.md`.
Tokens no código: `src/app/globals.css` (bloco `@theme` do Tailwind v4).

## Decisões

| Tema | Decisão | Motivo |
|---|---|---|
| Primária | `brand-600` #3818d9 (hover `brand-500` #583be9) | É a cor do logo e do tema atual. A escala antiga `--brand-*` (#534AB7) foi descartada, como pede o documento. |
| Acento | `mint-400` #25edb1 em pontos, barras, ícones e selos de destaque ("Novo") | É o ponto do logo. Como fundo, use texto `brand-900` (10,77:1, AAA). Texto branco não serve (1,52:1). Nunca como cor de texto; para texto de sucesso, use `mint-700`. |
| WhatsApp | `whatsapp` #25d366, texto `ink-900` | Reservado ao botão de contato. Texto branco sobre esse verde não passa AA. |
| Neutros | `ink-900` títulos, `ink-600` corpo, `ink-300`/`ink-200` bordas | Mesmos valores do tema atual (#101828, #475467, #d0d5dd, #eaecf0). |
| Fonte | **Area Normal** em tudo: títulos, corpo, botões e menu | Fonte primária da marca, a mesma do site atual. Vem do kit do Adobe Fonts `neq4bmy` (carregado em `src/app/layout.tsx`); a licença não permite hospedar os arquivos no projeto. |
| Pesos | Só `font-normal` (400) e `font-bold` (700) | São os únicos pesos da Area Normal no kit. `font-medium`, `font-semibold` e `font-black` não existem nele e o navegador os simularia. |
| Tracking | Títulos com -0.02em (h2 -0.015em) | A Area Normal é mais larga que a Satoshi; valores mais negativos colavam as palavras. |
| Raios | `rounded-control` 8px, `rounded-card` 12px, `rounded-panel` 20px | 8px em botões e campos, como hoje. |
| Layout | `container-page`: 1280px, margem 32px (20px no mobile) | Igual ao tema atual. |

## Componentes (em `src/components/ui.tsx`)

- `buttonClasses(variant, size)`: `primary`, `secondary`, `ghost`, `whatsapp`, `inverse`. Tamanhos `md`/`lg` têm alvo de 44px ou mais; `sm` só em prévias decorativas.
- `AiBadge`: o padrão único para tudo que a IA gera (ícone, fundo `brand-50`, rótulo "Sugestão").
- `Logo`: SVG oficial do site atual (`public/logo-subleasy.svg`), com o ponto menta.
- Ícones: `SparkleIcon`, `ArrowRightIcon`, `CheckIcon`, `SearchIcon`, `WhatsAppIcon`.

Ainda faltam, previstos na fase 0: filtro de turno, seletor de disponibilidade e cartão de métrica como componentes isolados, com os estados vazio, carregando, erro e sucesso. Hoje eles existem apenas como prévias na homepage.

## Regras

1. Use token, nunca hex solto, em componente novo.
2. Todo texto gerado por IA leva `AiBadge` e mostra a origem: "Você informou", "Vimos na foto N" ou "Sugestão da IA".
3. Foco visível com `focus-ring` em todo elemento interativo.
4. Mobile primeiro: o cadastro precisa funcionar com uma mão.
