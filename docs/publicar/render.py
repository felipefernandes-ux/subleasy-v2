import random
import sys
from PIL import Image, ImageChops, ImageDraw, ImageFont

OUT = sys.argv[1]
SAT = "/Users/felipefernandes/Desktop/Fonts/Satoshi_Complete/Fonts/OTF/"
CF = "/Users/felipefernandes/.claude/skills/canvas-design/canvas-fonts/"
def sat(w, s): return ImageFont.truetype(SAT + f"Satoshi-{w}.otf", s)
def mono(s, b=False): return ImageFont.truetype(CF + ("GeistMono-Bold.ttf" if b else "GeistMono-Regular.ttf"), s)

W, H = 2400, 2560
M = 160                       # margem; unidade base U = 8
BRAND6, BRAND5, BRAND3, BRAND2, BRAND1, BRAND0 = "#3818d9", "#583be9", "#b19ffb", "#d3c8fd", "#e9e3fe", "#f4f1ff"
MINT = "#25edb1"
INK = ["#f9fafb", "#f2f4f7", "#eaecf0", "#d0d5dd", "#98a2b3", "#667085", "#475467", "#344054", "#1d2939", "#101828"]

im = Image.new("RGB", (W, H), "#ffffff")
d = ImageDraw.Draw(im)

def label(x, y, t, f=None, fill=INK[5], anchor="la"):
    d.text((x, y), t, font=f or mono(22), fill=fill, anchor=anchor)

def bar(x, y, w, h, fill=None, outline=None):
    d.rounded_rectangle((x, y, x + w, y + h), radius=h / 2, fill=fill, outline=outline, width=2)

# ── cabeçalho ───────────────────────────────────────────────
label(M, M, "SUBLEASY 2.0  /  PUBLICAR", mono(22, True), INK[9])
label(W - M, M, "FOLHA 03  ·  23.10.2026", mono(22), INK[5], "ra")
d.line((M, M + 56, W - M, M + 56), fill=INK[2], width=2)

d.text((M - 6, M + 136), "Eclusa", font=sat("Black", 132), fill=INK[9])
label(M, M + 320, "Fig. 2  ·  do rascunho ao ar", sat("Medium", 36), INK[5])

# ── câmaras ────────────────────────────────────────────────
CT, CH = 760, 904             # topo e altura das câmaras
GAP = 64
CW = (W - 2 * M - 3 * GAP) // 4   # 472
STAGES = ["RASCUNHO", "REVISÃO", "EM ANÁLISE", "NO AR"]
ROMAN = ["I", "II", "III", "IV"]
STEPS = ["PASSOS 01–02", "PASSOS 03–04", "PASSOS 05–06", "PASSO 07"]
LEVEL = [0.16, 0.40, 0.64, 1.0]   # a água sobe a cada câmara
WATER = [INK[1], BRAND0, BRAND1, BRAND6]
RADIUS = 24

def col(i): return M + i * (CW + GAP)

for i in range(4):
    x0, x1 = col(i), col(i) + CW
    shape = Image.new("L", (W, H), 0)
    ImageDraw.Draw(shape).rounded_rectangle((x0, CT, x1, CT + CH), radius=RADIUS, fill=255)
    level = Image.new("L", (W, H), 0)
    ImageDraw.Draw(level).rectangle((x0, CT + CH * (1 - LEVEL[i]), x1, CT + CH), fill=255)
    im.paste(Image.new("RGB", (W, H), WATER[i]), (0, 0), ImageChops.multiply(shape, level))
d = ImageDraw.Draw(im)
for i in range(4):
    x0, x1 = col(i), col(i) + CW
    if i < 3:
        d.rounded_rectangle((x0, CT, x1, CT + CH), radius=RADIUS, outline=INK[2], width=2)
    label(x0, CT - 40, f"{ROMAN[i]}.  {STAGES[i]}", mono(20, True), INK[8], "lb")
    label(x1, CT - 40, STEPS[i], mono(18), INK[4], "rb")

# ── o anúncio dentro de cada câmara ────────────────────────
PAD = 48
CARD_T, CARD_H = CT + 72, 664
SLOT_GAP = 12
FIELDS = [0.62, 0.88, 0.46, 0.74, 0.92, 0.54]   # largura de cada valor, igual em todas as câmaras
random.seed(23)

for i in range(4):
    cx0, cx1 = col(i) + PAD, col(i) + CW - PAD
    cw = cx1 - cx0
    d.rounded_rectangle((cx0, CARD_T, cx1, CARD_T + CARD_H), radius=16, fill="#ffffff",
                        outline=None if i == 3 else INK[2], width=2)
    inner0, inner1 = cx0 + 32, cx1 - 32
    iw = inner1 - inner0

    # fotos: quatro espaços no topo do cartão
    slot = (iw - 3 * SLOT_GAP) / 4
    sy = CARD_T + 32
    for s in range(4):
        sx = inner0 + s * (slot + SLOT_GAP)
        box = (sx, sy, sx + slot, sy + slot)
        if i == 0:
            continue
        if i == 1 and s >= 2:
            d.rounded_rectangle(box, radius=10, outline=BRAND2, width=2)
            mx, my = sx + slot / 2, sy + slot / 2
            d.line((mx - 12, my, mx + 12, my), fill=BRAND3, width=2)
            d.line((mx, my - 12, mx, my + 12), fill=BRAND3, width=2)
        elif i == 1:
            d.rounded_rectangle(box, radius=10, fill=INK[3])
        elif i == 2:
            d.rounded_rectangle(box, radius=10, fill=[BRAND2, BRAND3, BRAND2, BRAND3][s])
        else:
            d.rounded_rectangle(box, radius=10, fill=BRAND6 if s % 2 == 0 else BRAND5)

    # campos: no rascunho, prosa solta; depois, seis linhas fixas
    fy0 = sy + slot + 56
    ROW = 64
    if i == 0:
        for k in range(10):
            y = fy0 - 40 + k * 34
            indent = random.choice([0, 0, 0, 24, 56])
            length = random.uniform(0.42, 0.98) * (iw - indent)
            bar(inner0 + indent, y, length, 12, fill=INK[3])
    else:
        for r, wv in enumerate(FIELDS):
            y = fy0 + r * ROW
            bar(inner0, y, 64, 8, fill=INK[2])                     # nome do campo
            vw = (iw - 88) * wv
            vx = inner0 + 88
            if i == 1:
                bar(vx, y - 6, vw, 20, fill=BRAND0, outline=BRAND2)  # sugestão da IA, editável
                d.ellipse((vx + vw - 14, y - 2, vx + vw - 2, y + 10), fill=BRAND5)
            elif i == 2:
                bar(vx, y - 6, vw, 20, fill=INK[7])                 # confirmado pelo anfitrião
            else:
                bar(vx, y - 6, vw, 20, fill=BRAND6)                 # público

    # análise: uma linha de leitura atravessa o cartão
    if i == 2:
        ly = fy0 + 2.5 * ROW + 3
        for x in range(int(cx0 + 8), int(cx1 - 8)):
            t = (x - cx0) / cw
            a = 1 - abs(t - 0.5) * 2
            c = tuple(int(255 - (255 - v) * a) for v in (0x38, 0x18, 0xD9))
            d.line((x, ly - 1, x, ly + 1), fill=c)

    # no ar: link e o único ponto de menta
    if i == 3:
        ly = CARD_T + CARD_H - 72
        d.line((inner0, ly - 32, inner1, ly - 32), fill=INK[2], width=2)
        bar(inner0, ly, iw * 0.56, 12, fill=INK[3])
        d.ellipse((inner1 - 24, ly - 6, inner1, ly + 18), fill=MINT)

# ── comportas ──────────────────────────────────────────────
GATES = ["IA", "PUBLICAR", "APROVAR"]
gy0, gy1 = CT + 160, CT + CH - 160
for g in range(3):
    gx = col(g) + CW + GAP / 2
    live = g == 2
    color = BRAND6 if live else INK[3]
    d.line((gx, gy0, gx, gy1), fill=color, width=4 if live else 2)
    mid = (gy0 + gy1) / 2
    d.rounded_rectangle((gx - 10, mid - 32, gx + 10, mid + 32), radius=10, fill="#ffffff", outline=color, width=2)
    label(gx, CT + CH + 48, GATES[g], mono(18, live), BRAND6 if live else INK[5], "mt")

# ── avisos: duas linhas de trânsito ────────────────────────
LANES = [("ANFITRIÃO", CT + CH + 176), ("ADMIN", CT + CH + 304)]
for name, y in LANES:
    label(M, y, name, mono(18, True), INK[6], "lm")
    d.line((M + 200, y, W - M, y), fill=INK[2], width=2)

def envelope(x, y, fill, ink):
    w, h = 64, 44
    box = (x, y - h / 2, x + w, y + h / 2)
    d.rounded_rectangle(box, radius=6, fill=fill, outline=ink, width=2)
    d.line((x + 6, y - h / 2 + 6, x + w / 2, y + 4, x + w - 6, y - h / 2 + 6), fill=ink if fill == "#ffffff" else "#ffffff", width=2)

NOTICES = [  # (câmara, linha, texto, preenchimento, traço)
    (2, 0, "E-MAIL  ·  EM REVISÃO", "#ffffff", INK[6]),
    (2, 1, "AVISO  ·  NOVO ANÚNCIO", "#ffffff", BRAND6),
    (3, 0, "E-MAIL  ·  NO AR", BRAND6, BRAND6),
]
stacked = set()
for c, lane, text, fill, ink in NOTICES:
    x = col(c) + PAD
    y = LANES[lane][1]
    # o fio sai da câmara; se já há um sinal acima, parte da base dele
    start = LANES[lane - 1][1] + 22 if c in stacked else CT + CH
    d.line((x + 32, start, x + 32, y - 22), fill=INK[3], width=2)
    stacked.add(c)
    d.rectangle((x - 8, y - 4, x + 72, y + 4), fill="#ffffff")       # a linha de trânsito abre para o sinal
    envelope(x, y, fill, ink)
    label(x + 96, y, text, mono(18), INK[7], "lm")

# ── rodapé ─────────────────────────────────────────────────
fy = H - M - 220
d.line((M, fy, W - M, fy), fill=INK[2], width=2)
d.text((M - 4, fy + 56), "Você revisa, nós aprovamos e a sala vai ao ar.", font=sat("Bold", 56), fill=INK[9])
label(M, fy + 152, "4 CÂMARAS  ·  3 COMPORTAS  ·  3 AVISOS  ·  1 PONTO DE MENTA, ONDE O ANÚNCIO FICA PÚBLICO", mono(20), INK[5])
label(W - M, fy + 152, "U = 8 PX", mono(20), INK[4], "ra")

im.save(OUT)
