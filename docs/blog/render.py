import sys
from PIL import Image, ImageDraw, ImageFont

# Folha 02: direção visual do blog. Mesma grade e tokens da folha 01.
OUT = sys.argv[1]
SAT = "/Users/felipefernandes/Desktop/Fonts/Satoshi_Complete/Fonts/OTF/"
CF = "/Users/felipefernandes/.claude/skills/canvas-design/canvas-fonts/"
def sat(w, s): return ImageFont.truetype(SAT + f"Satoshi-{w}.otf", s)
def mono(s, b=False): return ImageFont.truetype(CF + ("GeistMono-Bold.ttf" if b else "GeistMono-Regular.ttf"), s)

W, H = 2400, 3760
M = 160
BRAND = ["#f4f1ff","#e9e3fe","#d3c8fd","#b19ffb","#8a6ef4","#583be9","#3818d9","#2c12b3","#22108c","#1a0b66"]
INK = ["#f9fafb","#f2f4f7","#eaecf0","#d0d5dd","#98a2b3","#667085","#475467","#344054","#1d2939","#101828"]
MINT = "#25edb1"

im = Image.new("RGB", (W, H), "#ffffff")
d = ImageDraw.Draw(im)

def label(x, y, t, f=None, fill=INK[5], anchor="la"):
    d.text((x, y), t, font=f or mono(22), fill=fill, anchor=anchor)

def section(y, num, title, right):
    label(M, y, f"{num}.  {title}", mono(22, True), INK[9])
    label(W - M, y, right, mono(22), INK[5], "ra")

# ── cabeçalho ───────────────────────────────────────────────
label(M, M, "SUBLEASY 2.0  /  BLOG", mono(22, True), INK[9])
label(W - M, M, "FOLHA 02  ·  26.10.2026", mono(22), INK[5], "ra")
d.line((M, M + 56, W - M, M + 56), fill=INK[2], width=2)

wm = sat("Black", 300)
y0 = M + 150
d.text((M - 12, y0), "blog", font=wm, fill=BRAND[6], anchor="la")
bb = d.textbbox((M - 12, y0), "blog", font=wm, anchor="la")
# o único menta da folha: o ponto final, como no logo
r = 26
cx, cy = bb[2] + 2 + r, bb[3] - r - 58
d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=MINT)
label(M, y0 + 420, "Leitura para quem aluga por turno.", sat("Medium", 44), INK[6])

# ── I. acervo: cada texto é uma coluna; altura = palavras ──────
posts = [  # data, categoria, palavras (blog.subleasy.com.br, 26.10.2026)
    ("05.05.25", "dicas", 622), ("05.05.25", "dicas", 544), ("05.05.25", "dicas", 655),
    ("26.05.25", "remoto", 432), ("24.06.25", "empreend", 441), ("24.06.25", "empreend", 613),
    ("24.06.25", "empreend", 569), ("25.06.25", "empreend", 563),
    ("14.07.26", "dicas", 924), ("29.07.26", "dicas", 646), ("04.08.26", "dicas", 626),
    ("08.10.26", "dicas", 2103),
]
TONE = {"dicas": BRAND[6], "empreend": BRAND[4], "remoto": BRAND[8]}

gy = 960
section(gy - 64, "I", "ACERVO", "12 TEXTOS  ·  PALAVRAS POR COLUNA")
base = gy + 560                       # linha de base comum
unit = 560 / 2200                     # px por palavra
gap, pause = 24, 96                   # pausa: o ano sem publicar
n = len(posts)
cw = (W - 2 * M - gap * (n - 2) - pause) / n
x = M
for i, (date, cat, words) in enumerate(posts):
    h = round(words * unit / 8) * 8
    top = base - h
    d.rounded_rectangle((x, top, x + cw, base), radius=12, fill=BRAND[0])
    # linhas de texto: uma a cada ~40 palavras, a coluna se preenche como uma página
    line_y = base - 24
    k = 0
    while line_y > top + 24:
        inset = 24 if k % 5 else 24
        right = x + cw - (24 + (k * 37 % 5) * 14 if k % 6 == 5 else 24)
        d.rounded_rectangle((x + inset, line_y - 4, right, line_y), radius=2, fill=TONE[cat])
        line_y -= 16
        k += 1
    label(x, base + 24, date, mono(18), INK[5])
    label(x, base + 52, f"{words}", mono(18, True), INK[9])
    x += cw + (pause if i == 7 else gap)

# a pausa entre 2025 e 2026 recebe só uma legenda
px = M + 8 * cw + 7 * gap + pause / 2
d.line((px, gy + 40, px, base), fill=INK[2], width=2)
label(px, gy, "2025 · 2026", mono(18), INK[4], "ma")

ly = base + 120
for j, (cat, name) in enumerate([("dicas", "dicas"), ("empreend", "empreendedorismo"), ("remoto", "trabalho remoto")]):
    lx = M + j * 360
    d.rounded_rectangle((lx, ly, lx + 22, ly + 22), radius=4, fill=TONE[cat])
    label(lx + 36, ly + 1, name, mono(20), INK[6])

# ── II. medida: a coluna de leitura e o fio de progresso ─────
my = 1820
section(my - 64, "II", "MEDIDA", "68 CARACTERES  ·  ENTRELINHA 1.7  ·  18 PX")
col_x = M + 640
col_w = 920
# título do texto: três barras pesadas
for k, w_ in enumerate([1.0, 0.86, 0.52]):
    d.rounded_rectangle((col_x, my + k * 72, col_x + col_w * w_, my + k * 72 + 48), radius=6, fill=INK[9])
label(col_x, my + 240, "8 MIN DE LEITURA  ·  DICAS", mono(20), INK[5])
# corpo: parágrafos de linhas cinza, comprimentos variados
ty = my + 320
lens = [1, .97, 1, .94, .99, .62, None, 1, .96, 1, .98, .9, .44]
read_until = 8
for k, f in enumerate(lens):
    if f is None:
        ty += 30
        continue
    fill = INK[7] if k < read_until else INK[2]
    d.rounded_rectangle((col_x, ty, col_x + col_w * f, ty + 10), radius=5, fill=fill)
    ty += 31
# fio de progresso à esquerda da coluna
fx = col_x - 72
d.rounded_rectangle((fx - 3, my, fx + 3, ty - 21), radius=3, fill=INK[1])
prog_end = my + 320 + read_until * 31 - 10
d.rounded_rectangle((fx - 3, my, fx + 3, prog_end), radius=3, fill=BRAND[6])
d.ellipse((fx - 10, prog_end - 10, fx + 10, prog_end + 10), fill=BRAND[6])
# sumário na margem esquerda
for k, (t, on) in enumerate([("01", False), ("02", True), ("03", False), ("04", False)]):
    yy = my + 320 + k * 64
    d.rounded_rectangle((M, yy, M + 16, yy + 16), radius=4, fill=BRAND[6] if on else INK[2])
    d.rounded_rectangle((M + 64, yy + 3, M + 64 + (300 - k * 44), yy + 13), radius=5,
                        fill=INK[8] if on else INK[3])
    label(M + 28, yy - 2, t, mono(16), INK[4])
# régua da medida
ry = ty + 24
d.line((col_x, ry, col_x + col_w, ry), fill=INK[3], width=2)
for t_ in (col_x, col_x + col_w):
    d.line((t_, ry - 10, t_, ry + 10), fill=INK[3], width=2)
label(col_x + col_w / 2, ry + 20, "720 px", mono(18), INK[5], "ma")

# ── III. grade: abertura larga, depois três colunas ────────
gy3 = 2760
section(gy3 - 64, "III", "GRADE", "DESTAQUE  ·  3 COLUNAS  ·  RAIO 12")
fw = W - 2 * M
fh = 280
# destaque: imagem à esquerda, texto à direita
img_w = fw * 0.56
d.rounded_rectangle((M, gy3, M + img_w, gy3 + fh), radius=20, fill=BRAND[6])
for s in range(1, 12):                 # trama fina: luz na foto
    xx = M + s * img_w / 12
    d.line((xx, gy3 + 24, xx, gy3 + fh - 24), fill=BRAND[5], width=2)
tx = M + img_w + 64
d.rounded_rectangle((tx, gy3 + 16, tx + 120, gy3 + 44), radius=14, fill=BRAND[1])
for k, w_ in enumerate([1, .92, .6]):
    d.rounded_rectangle((tx, gy3 + 76 + k * 52, tx + (fw - img_w - 64) * w_, gy3 + 76 + k * 52 + 32),
                        radius=5, fill=INK[9])
for k, w_ in enumerate([1, .8]):
    d.rounded_rectangle((tx, gy3 + 232 + k * 26, tx + (fw - img_w - 64) * w_, gy3 + 232 + k * 26 + 8),
                        radius=4, fill=INK[3])
# três cartões
cy3 = gy3 + fh + 48
cgap = 48
cwid = (fw - 2 * cgap) / 3
for c in range(3):
    cx3 = M + c * (cwid + cgap)
    d.rounded_rectangle((cx3, cy3, cx3 + cwid, cy3 + cwid * 0.36), radius=12, fill=BRAND[1 + c])
    for k, w_ in enumerate([1, .7]):
        yy = cy3 + cwid * 0.36 + 28 + k * 40
        d.rounded_rectangle((cx3, yy, cx3 + cwid * w_, yy + 24), radius=5, fill=INK[9])

# ── rodapé ─────────────────────────────────────────────────
fy = H - M - 40
d.line((M, fy - 40, W - M, fy - 40), fill=INK[2], width=2)
label(M, fy, "UNIDADE 8 PX  ·  CONTAINER 1280  ·  LEITURA 720  ·  AREA NORMAL 400 / 700", mono(20), INK[5])
label(W - M, fy, "blog.subleasy.com.br", mono(20), INK[5], "ra")

im.save(OUT)
