import random
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = sys.argv[1]
SAT = "/Users/felipefernandes/Desktop/Fonts/Satoshi_Complete/Fonts/OTF/"
CF = "/Users/felipefernandes/.claude/skills/canvas-design/canvas-fonts/"
def sat(w, s): return ImageFont.truetype(SAT + f"Satoshi-{w}.otf", s)
def mono(s, b=False): return ImageFont.truetype(CF + ("GeistMono-Bold.ttf" if b else "GeistMono-Regular.ttf"), s)

W, H = 2400, 2720
M = 160                       # margem; unidade base U = 8
BRAND6, BRAND5, BRAND1, BRAND9 = "#3818d9", "#583be9", "#e9e3fe", "#1a0b66"
MINT = "#25edb1"
INK = ["#f9fafb", "#f2f4f7", "#eaecf0", "#d0d5dd", "#98a2b3", "#667085", "#475467", "#344054", "#1d2939", "#101828"]

im = Image.new("RGB", (W, H), "#ffffff")
d = ImageDraw.Draw(im)

def label(x, y, t, f=None, fill=INK[5], anchor="la"):
    d.text((x, y), t, font=f or mono(22), fill=fill, anchor=anchor)

# ── cabeçalho ───────────────────────────────────────────────
label(M, M, "SUBLEASY 2.0  /  ANUNCIAR", mono(22, True), INK[9])
label(W - M, M, "FOLHA 02  ·  22.10.2026", mono(22), INK[5], "ra")
d.line((M, M + 56, W - M, M + 56), fill=INK[2], width=2)

d.text((M - 6, M + 136), "Prosa em grade", font=sat("Black", 132), fill=INK[9])
label(M, M + 320, "Fig. 1  ·  da fala à estrutura", sat("Medium", 36), INK[5])

# ── campo principal ────────────────────────────────────────
SEAM = 1208                   # costura, levemente à direita do centro
TOP, ROW = 760, 248           # seis linhas de destino, mesmo passo
FIELDS = ["TIPO", "LOCAL", "PREÇO", "TURNOS", "COMODIDADES", "REGRAS"]
ROMAN = ["I", "II", "III", "IV", "V", "VI"]
CELLS = [2, 3, 2, 7, 5, 3]    # cada traço do lado cru tem uma célula de destino

random.seed(22)
LX0, LX1 = M + 72, SEAM - 120
STROKE, LEAD = 12, 30

# régua vertical na margem esquerda
for i in range(0, 6 * ROW + 1, 24):
    y = TOP - 40 + i
    long = i % ROW == 0
    d.line((M, y, M + (28 if long else 12), y), fill=INK[3] if long else INK[2], width=2)

for r, n in enumerate(CELLS):
    cy = TOP + r * ROW + ROW // 2 - 40

    # lado cru: n traços de comprimento desigual, centrados na linha de destino
    y0 = cy - (n - 1) * LEAD / 2
    for i in range(n):
        y = y0 + i * LEAD
        indent = random.choice([0, 0, 0, 40, 88])
        length = random.uniform(0.38, 0.97) * (LX1 - LX0 - indent)
        x0 = LX0 + indent
        d.rounded_rectangle((x0, y - STROKE / 2, x0 + length, y + STROKE / 2), radius=STROKE / 2, fill=INK[3])
    label(LX0 - 40, cy, f"{r + 1:02d}", mono(18), INK[4], "rm")

    # marca de passagem na costura
    d.line((SEAM - 56, cy, SEAM - 20, cy), fill=INK[3], width=2)
    d.line((SEAM + 20, cy, SEAM + 56, cy), fill=BRAND1, width=2)

    # lado assentado: células iguais, mesmo módulo
    RX0 = SEAM + 140
    cw, gap, ch = 112, 12, 72
    label(RX0, cy - ch / 2 - 44, f"{ROMAN[r]}.  {FIELDS[r]}", mono(20, True), INK[8])
    label(W - M, cy - ch / 2 - 44, f"{n:02d}", mono(20), INK[4], "ra")
    for i in range(n):
        x = RX0 + i * (cw + gap)
        last = r == len(CELLS) - 1 and i == n - 1
        fill = MINT if last else (BRAND6 if (i + r) % 4 else BRAND5)
        d.rounded_rectangle((x, cy - ch / 2, x + cw, cy + ch / 2), radius=10, fill=fill)
    # trilho vazio até a margem: espaço que ainda pode ser preenchido
    x_end = RX0 + n * (cw + gap)
    while x_end + cw <= W - M:
        d.rounded_rectangle((x_end, cy - ch / 2, x_end + cw, cy + ch / 2), radius=10, outline=INK[2], width=2)
        x_end += cw + gap

# ── costura: degradê roxo → menta com brilho ───────────────
seam_top, seam_bot = TOP - 40, TOP + 6 * ROW - 40
glow = Image.new("RGB", (W, H), "#ffffff")
gd = ImageDraw.Draw(glow)

def lerp(a, b, t):
    a, b = int(a[1:], 16), int(b[1:], 16)
    ch = [((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t for s in (16, 8, 0)]
    return tuple(int(c) for c in ch)

for y in range(seam_top, seam_bot):
    t = (y - seam_top) / (seam_bot - seam_top)
    gd.line((SEAM - 22, y, SEAM + 22, y), fill=lerp(BRAND6, MINT, t))
glow = glow.filter(ImageFilter.GaussianBlur(26))
mask = Image.new("L", (W, H), 0)
ImageDraw.Draw(mask).rectangle((SEAM - 64, seam_top - 48, SEAM + 64, seam_bot + 48), fill=110)
mask = mask.filter(ImageFilter.GaussianBlur(40))
im.paste(glow, (0, 0), mask)
d = ImageDraw.Draw(im)
for y in range(seam_top, seam_bot):
    t = (y - seam_top) / (seam_bot - seam_top)
    d.line((SEAM - 3, y, SEAM + 3, y), fill=lerp(BRAND6, MINT, t))

label(SEAM, seam_top - 40, "IA", mono(20, True), BRAND6, "mb")
label(LX0, seam_top - 40, "TEXTO LIVRE", mono(20, True), INK[6], "lb")
label(SEAM + 140, seam_top - 40, "CAMPOS DO ANÚNCIO", mono(20, True), INK[6], "lb")

# ── rodapé ─────────────────────────────────────────────────
fy = H - M - 220
d.line((M, fy, W - M, fy), fill=INK[2], width=2)
d.text((M - 4, fy + 56), "Descreva sua sala. A IA monta o anúncio.", font=sat("Bold", 56), fill=INK[9])
label(M, fy + 152, "6 GRUPOS  ·  22 CÉLULAS  ·  1 PONTO DE MENTA, ONDE A ÚLTIMA PEÇA SE ENCAIXA", mono(20), INK[5])
label(W - M, fy + 152, "U = 8 PX", mono(20), INK[4], "ra")

im.save(OUT)
