import sys
from PIL import Image, ImageDraw, ImageFont

# Folha 03: direção visual da página Como funciona. Mesma grade e tokens das folhas 01 e 02.
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

S = 3  # supersample para curvas e cantos limpos
im = Image.new("RGB", (W * S, H * S), "#ffffff")
d = ImageDraw.Draw(im)

def P(*v): return tuple(x * S for x in v)
def label(x, y, t, f=None, fill=INK[5], anchor="la"):
    d.text(P(x, y), t, font=f or mono(22 * S), fill=fill, anchor=anchor)
def rect(x0, y0, x1, y1, r, fill=None, outline=None, w=0):
    d.rounded_rectangle(P(x0, y0, x1, y1), radius=r * S, fill=fill, outline=outline, width=w * S)
def section(y, num, title, right):
    label(M, y, f"{num}.  {title}", mono(22 * S, True), INK[9])
    label(W - M, y, right, mono(22 * S), INK[5], "ra")

# ── cabeçalho ───────────────────────────────────────────────
label(M, M, "SUBLEASY 2.0  /  COMO FUNCIONA", mono(22 * S, True), INK[9])
label(W - M, M, "FOLHA 03  ·  26.10.2026", mono(22 * S), INK[5], "ra")
d.line(P(M, M + 56, W - M, M + 56), fill=INK[2], width=2 * S)

# palavra monumental
y0 = M + 150
d.text(P(M - 10, y0), "uma sala,", font=sat("Black", 210 * S), fill=INK[9], anchor="la")
d.text(P(M - 10, y0 + 230), "muitas agendas", font=sat("Black", 210 * S), fill=BRAND[6], anchor="la")
bb = d.textbbox(P(M - 10, y0 + 230), "muitas agendas", font=sat("Black", 210 * S), anchor="la")
r = 22
cx, cy = bb[2] / S + 6 + r, bb[3] / S - r - 44
d.ellipse(P(cx - r, cy - r, cx + r, cy + r), fill=MINT)

# ── I. a semana de uma sala: 7 dias × 3 turnos ─────────────
gy = 1080
section(gy - 64, "I", "A SEMANA DE UMA SALA", "7 DIAS  ×  3 TURNOS  ·  4 PROFISSIONAIS")
DAYS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"]
SHIFTS = ["MANHÃ", "TARDE", "NOITE"]
# quem ocupa cada turno: 0 livre, 1..4 profissionais
OCC = [
    [1, 1, 3, 1, 1, 2, 0],
    [2, 4, 3, 2, 4, 0, 0],
    [0, 3, 0, 3, 0, 0, 0],
]
TONE = {1: BRAND[6], 2: BRAND[4], 3: BRAND[8], 4: BRAND[3]}
TAG = {1: "PSI", 2: "NUT", 3: "FIS", 4: "FONO"}
MATCH = (5, 1)  # o turno que muda de estado: sábado à tarde
lx = M + 150
cols, rows, gap = 7, 3, 16
cw = (W - M - lx - gap * (cols - 1)) / cols
ch = 170
for c, day in enumerate(DAYS):
    label(lx + c * (cw + gap) + cw / 2, gy - 4, day, mono(20 * S), INK[5], "ma")
cells = {}
for rr in range(rows):
    yy = gy + 40 + rr * (ch + gap)
    label(M, yy + ch / 2, SHIFTS[rr], mono(20 * S), INK[5], "lm")
    for c in range(cols):
        x = lx + c * (cw + gap)
        cells[(c, rr)] = (x, yy)
        who = OCC[rr][c]
        if (c, rr) == MATCH:
            rect(x, yy, x + cw, yy + ch, 14, fill=MINT)
            label(x + 20, yy + 20, "NOVO", mono(18 * S, True), BRAND[9])
        elif who:
            rect(x, yy, x + cw, yy + ch, 14, fill=TONE[who])
            label(x + 20, yy + 20, TAG[who], mono(18 * S, True), "#ffffff" if who in (1, 3) else BRAND[9])
        else:
            rect(x, yy, x + cw, yy + ch, 14, fill=INK[0], outline=INK[2], w=2)
grid_bottom = gy + 40 + rows * ch + (rows - 1) * gap

# duas linhas que atravessam a grade e se encontram no turno menta
mx, my = cells[MATCH]
tx, ty = mx + cw / 2, my + ch / 2
def curve(p0, p1, p2, p3, n=240):
    pts = []
    for i in range(n + 1):
        t = i / n
        a = (1 - t) ** 3; b = 3 * (1 - t) ** 2 * t; cc = 3 * (1 - t) * t ** 2; dd = t ** 3
        pts.append((a * p0[0] + b * p1[0] + cc * p2[0] + dd * p3[0], a * p0[1] + b * p1[1] + cc * p2[1] + dd * p3[1]))
    return pts
host = curve((M, grid_bottom + 110), (lx + 4.2 * cw, grid_bottom + 110), (tx - 30, ty + 300), (tx, ty))
seek = curve((W - M, grid_bottom + 110), (W - M - 0.9 * cw, grid_bottom + 110), (tx + 30, ty + 300), (tx, ty))
for pts, col in ((host, BRAND[9]), (seek, BRAND[4])):
    d.line([P(*p) for p in pts], fill=col, width=4 * S, joint="curve")
d.ellipse(P(tx - 13, ty - 13, tx + 13, ty + 13), fill=BRAND[9])
label(M, grid_bottom + 130, "quem tem sala", mono(20 * S), BRAND[9])
label(W - M, grid_bottom + 130, "quem procura", mono(20 * S), BRAND[4], "ra")

ly = grid_bottom + 230
for j, (k, name) in enumerate([(1, "psicologia"), (2, "nutrição"), (3, "fisioterapia"), (4, "fonoaudiologia"), (0, "livre")]):
    x = M + j * 330
    if k:
        rect(x, ly, x + 22, ly + 22, 5, fill=TONE[k])
    else:
        rect(x, ly, x + 22, ly + 22, 5, fill=INK[0], outline=INK[3], w=2)
    label(x + 36, ly + 1, name, mono(20 * S), INK[6])
rect(M + 5 * 330, ly, M + 5 * 330 + 22, ly + 22, 5, fill=MINT)
label(M + 5 * 330 + 36, ly + 1, "encontro", mono(20 * S), INK[6])

# ── II. partitura: a grade se enche em cascata ─────────────
sy = 2300
section(sy - 64, "II", "PARTITURA", "ENTRADA 700 MS  ·  ATRASO 40 MS POR CÉLULA  ·  CUBIC-BEZIER(.2,.7,.2,1)")
frames = 5
fw = (W - 2 * M - 48 * (frames - 1)) / frames
order = [(c, rr) for c in range(cols) for rr in range(rows)]
filled_total = [k for k in order if OCC[k[1]][k[0]] or k == MATCH]
for f in range(frames):
    fx = M + f * (fw + 48)
    rect(fx, sy, fx + fw, sy + 250, 20, fill=INK[0], outline=INK[2], w=2)
    show = round(len(filled_total) * f / (frames - 1))
    on = set(filled_total[:show])
    mcw = (fw - 48 - 6 * 8) / 7
    mch = (250 - 48 - 2 * 8) / 3
    for (c, rr) in order:
        x = fx + 24 + c * (mcw + 8); yy = sy + 24 + rr * (mch + 8)
        if (c, rr) in on:
            col = MINT if (c, rr) == MATCH else TONE[OCC[rr][c]]
            rect(x, yy, x + mcw, yy + mch, 5, fill=col)
        else:
            rect(x, yy, x + mcw, yy + mch, 5, fill="#ffffff", outline=INK[2], w=2)
    label(fx, sy + 276, f"{f * 280} ms", mono(20 * S, True), INK[9])
    label(fx + fw, sy + 276, f"{show}/{len(filled_total)}", mono(20 * S), INK[5], "ra")

# curva de aceleração, desenhada como gráfico de laboratório
ey = 2900
ex0, ex1 = M, M + 620
d.line(P(ex0, ey + 300, ex1, ey + 300), fill=INK[3], width=2 * S)
d.line(P(ex0, ey, ex0, ey + 300), fill=INK[3], width=2 * S)
ease = curve((0, 0), (0.2, 0.7), (0.2, 1), (1, 1), 200)
d.line([P(ex0 + x * 620, ey + 300 - y * 300) for x, y in ease], fill=BRAND[6], width=4 * S, joint="curve")
for i in range(1, 5):
    gx = ex0 + i * 155
    d.line(P(gx, ey + 300, gx, ey + 310), fill=INK[3], width=2 * S)
label(ex0, ey + 330, "tempo", mono(18 * S), INK[5])
label(ex0 - 16, ey, "1", mono(18 * S), INK[5], "ra")
label(ex0 - 16, ey + 300, "0", mono(18 * S), INK[5], "rm")

# o número que fecha a conta da semana
nx = M + 900
d.text(P(nx, ey - 30), "21", font=sat("Black", 300 * S), fill=INK[9], anchor="la")
nb = d.textbbox(P(nx, ey - 30), "21", font=sat("Black", 300 * S), anchor="la")
label(nb[2] / S + 40, ey + 60, "turnos numa semana", mono(22 * S, True), INK[9])
label(nb[2] / S + 40, ey + 100, "13 ocupados  ·  1 novo  ·  7 livres", mono(22 * S), INK[5])
label(nb[2] / S + 40, ey + 180, "preço do turno × turnos livres × 4,3", mono(22 * S), BRAND[6])
label(nb[2] / S + 40, ey + 220, "a conta que a página faz ao vivo", mono(20 * S), INK[5])

# ── rodapé ─────────────────────────────────────────────────
fy = H - M - 40
d.line(P(M, fy - 40, W - M, fy - 40), fill=INK[2], width=2 * S)
label(M, fy, "UNIDADE 8 PX  ·  CONTAINER 1280  ·  MOVIMENTO RESPEITA PREFERS-REDUCED-MOTION", mono(20 * S), INK[5])
label(W - M, fy, "subleasy.com.br/como-funciona", mono(20 * S), INK[5], "ra")

im.resize((W, H), Image.LANCZOS).save(OUT)
