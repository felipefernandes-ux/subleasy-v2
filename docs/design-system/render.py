import sys
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1]
SAT = "/Users/felipefernandes/Desktop/Fonts/Satoshi_Complete/Fonts/OTF/"
CF = "/Users/felipefernandes/.claude/skills/canvas-design/canvas-fonts/"
def sat(w, s): return ImageFont.truetype(SAT + f"Satoshi-{w}.otf", s)
def mono(s, b=False): return ImageFont.truetype(CF + ("GeistMono-Bold.ttf" if b else "GeistMono-Regular.ttf"), s)

W, H = 2400, 3760
M = 160                      # margem; unidade base U = 8
BRAND = ["#f4f1ff","#e9e3fe","#d3c8fd","#b19ffb","#8a6ef4","#583be9","#3818d9","#2c12b3","#22108c","#1a0b66"]
BSTEP = [50,100,200,300,400,500,600,700,800,900]
INK = ["#f9fafb","#f2f4f7","#eaecf0","#d0d5dd","#98a2b3","#667085","#475467","#344054","#1d2939","#101828"]
MINT, MINT7, WA = "#25edb1", "#047857", "#25d366"
PAPER = "#ffffff"

im = Image.new("RGB", (W, H), PAPER)
d = ImageDraw.Draw(im)

def label(x, y, t, f=None, fill=INK[5], anchor="la"):
    d.text((x, y), t, font=f or mono(22), fill=fill, anchor=anchor)

# ── cabeçalho ───────────────────────────────────────────────
label(M, M, "SUBLEASY 2.0  /  SISTEMA DE DESIGN", mono(22, True), INK[9])
label(W - M, M, "FOLHA 01  ·  21.10.2026", mono(22), INK[5], "ra")
d.line((M, M + 56, W - M, M + 56), fill=INK[2], width=2)

# wordmark
wm = sat("Black", 300)
y0 = M + 150
d.text((M - 12, y0), "subleasy", font=wm, fill=BRAND[6], anchor="la")
bbox = d.textbbox((M - 12, y0), "subleasy", font=wm, anchor="la")
d.text((bbox[2] + 2, y0), ".", font=wm, fill=MINT, anchor="la")
label(M, bbox[3] + 48, "Sua sala no turno certo.", sat("Medium", 44), INK[6])

# ── campo de turnos: 6 semanas × 7 dias × 3 turnos ─────────
gy = 960
label(M, gy - 64, "I.  TURNOS", mono(22, True), INK[9])
label(W - M, gy - 64, "MANHÃ · TARDE · NOITE  ×  42 DIAS", mono(22), INK[5], "ra")
cols, rows = 42, 3
gap = 8
cw = (W - 2 * M - gap * (cols - 1)) / cols
ch = 64
# ocupação cresce da esquerda para a direita: a sala vazia vira renda
import random
random.seed(7)
mint_cell = (37, 1)
for c in range(cols):
    p = 0.06 + 0.84 * (c / (cols - 1)) ** 1.35
    for r in range(rows):
        x = M + c * (cw + gap); y = gy + r * (ch + gap)
        if (c, r) == mint_cell:
            fill, outline = MINT, None
        elif random.random() < p:
            fill, outline = BRAND[6], None
        else:
            fill, outline = INK[1], INK[2]
        d.rounded_rectangle((x, y, x + cw, y + ch), radius=8, fill=fill, outline=outline, width=2 if outline else 0)
gb = gy + rows * ch + (rows - 1) * gap
for i, wk in enumerate(range(6)):
    x = M + i * 7 * (cw + gap)
    label(x, gb + 24, f"S{wk+1:02d}", mono(18), INK[4])
lx = M
for kind, txt in (("brand", "ocupado"), ("free", "livre"), ("mint", "mudou de estado")):
    ly = gb + 76
    if kind == "brand": d.rounded_rectangle((lx, ly, lx + 22, ly + 22), radius=5, fill=BRAND[6])
    elif kind == "free": d.rounded_rectangle((lx, ly, lx + 22, ly + 22), radius=5, fill=INK[1], outline=INK[2], width=2)
    else: d.rounded_rectangle((lx, ly, lx + 22, ly + 22), radius=5, fill=MINT)
    d.text((lx + 36, ly + 11), txt, font=mono(18), fill=INK[5], anchor="lm")
    lx += 36 + d.textlength(txt, font=mono(18)) + 56

# ── cores ──────────────────────────────────────────────────
cy = gb + 220
label(M, cy, "II.  COR", mono(22, True), INK[9])
cy += 64
sw_w = (W - 2 * M - 9 * 16) / 10
def strip(y, colors, steps, name, hlt=None, h=300):
    for i, col in enumerate(colors):
        x = M + i * (sw_w + 16)
        d.rounded_rectangle((x, y, x + sw_w, y + h), radius=12, fill=col,
                            outline=INK[2] if i < 2 else None, width=2 if i < 2 else 0)
        tc = "#ffffff" if i >= 5 else INK[9]
        d.text((x + 20, y + h - 64), str(steps[i]), font=mono(20, True), fill=tc)
        d.text((x + 20, y + h - 36), col.upper(), font=mono(18), fill=tc)
        if hlt == i:
            d.ellipse((x + sw_w - 36, y + 20, x + sw_w - 20, y + 36), fill=MINT)
    label(M, y + h + 20, name, mono(18), INK[5])
strip(cy, BRAND, BSTEP, "brand  ·  600 primária (logo, botões)  ·  500 hover  ·  900 superfícies escuras", hlt=6)
cy += 300 + 90
strip(cy, INK, BSTEP, "ink  ·  900 títulos  ·  600 corpo  ·  300 / 200 bordas", h=180)
cy += 180 + 90
# acentos
acc = [(MINT, "mint 400", "#25EDB1", "acento, nunca texto"), (MINT7, "mint 700", "#047857", "texto de sucesso"),
       (WA, "whatsapp", "#25D366", "só o botão de contato")]
aw = (W - 2 * M - 2 * 32) / 3
for i, (col, n, hx, use) in enumerate(acc):
    x = M + i * (aw + 32)
    d.rounded_rectangle((x, cy, x + 120, cy + 120), radius=12, fill=col)
    d.text((x + 148, cy + 14), n, font=sat("Bold", 36), fill=INK[9])
    d.text((x + 148, cy + 62), f"{hx}  ·  {use}", font=mono(18), fill=INK[5])
cy += 120

# ── tipografia ──────────────────────────────────────────────
ty = cy + 160
label(M, ty, "III.  TIPO  —  SATOSHI VARIÁVEL 300–900", mono(22, True), INK[9])
ty += 72
d.text((M - 8, ty), "Aa", font=sat("Black", 300), fill=INK[9], anchor="la")
scale = [("display  56/1.08", "Black", 56, "Sua sala vazia vira renda."),
         ("h1  40/1.12", "Bold", 40, "Publique sua sala em 3 minutos"),
         ("h2  32/1.2", "Bold", 32, "Turnos livres nesta semana"),
         ("h3  20/1.3", "Bold", 24, "Sala para psicologia na Zona 7"),
         ("corpo  16–18/1.6", "Regular", 24, "Você revisa antes de publicar. Fale direto com o dono.")]
sx = M + 640
yy = ty + 16
for tag, wgt, sz, txt in scale:
    d.text((sx, yy), tag, font=mono(18), fill=INK[4])
    d.text((sx, yy + 30), txt, font=sat(wgt, sz), fill=INK[9])
    yy += 30 + sz + 44

# ── forma ───────────────────────────────────────────────────
fy = max(yy, ty + 360) + 80
label(M, fy, "IV.  FORMA", mono(22, True), INK[9])
fy += 72
shapes = [(8, "control  8", 220, 88), (12, "card  12", 220, 220), (20, "panel  20", 220, 220)]
x = M
for r, n, w, h in shapes:
    d.rounded_rectangle((x, fy, x + w, fy + h), radius=r * 2, outline=BRAND[6], width=4)
    d.text((x, fy + 220 + 24), n, font=mono(18), fill=INK[5])
    x += w + 64
# botão primário e selo da IA, como peças do sistema
bx = x + 40
d.rounded_rectangle((bx, fy, bx + 520, fy + 96), radius=16, fill=BRAND[6])
d.text((bx + 260, fy + 48), "Anunciar minha sala grátis", font=sat("Bold", 30), fill="#ffffff", anchor="mm")
d.rounded_rectangle((bx, fy + 124, bx + 520, fy + 220), radius=16, fill="#ffffff", outline=INK[3], width=2)
d.text((bx + 260, fy + 172), "Procuro uma sala", font=sat("Bold", 30), fill=INK[8], anchor="mm")
d.text((bx, fy + 244), "alvo mínimo 44 px  ·  foco visível", font=mono(18), fill=INK[5])
ax = bx + 600
d.rounded_rectangle((ax, fy, ax + 230, fy + 64), radius=32, fill=BRAND[0], outline=BRAND[1], width=2)
cx_, cy_, R, r_ = ax + 44, fy + 32, 15, 4
d.polygon([(cx_, cy_ - R), (cx_ + r_, cy_ - r_), (cx_ + R, cy_), (cx_ + r_, cy_ + r_),
           (cx_, cy_ + R), (cx_ - r_, cy_ + r_), (cx_ - R, cy_), (cx_ - r_, cy_ - r_)], fill=BRAND[7])
d.text((ax + 70, fy + 32), "Sugestão", font=sat("Bold", 28), fill=BRAND[7], anchor="lm")
d.text((ax, fy + 92), "tudo que a IA gera", font=mono(18), fill=INK[5])
d.text((ax, fy + 120), "usa este selo", font=mono(18), fill=INK[5])

# ── rodapé ──────────────────────────────────────────────────
d.line((M, H - M - 56, W - M, H - M - 56), fill=INK[2], width=2)
label(M, H - M - 24, "UNIDADE 8 PX  ·  CONTAINER 1280 / 32 · 20  ·  CONTRASTE AA", mono(18), INK[5])
label(W - M, H - M - 24, "tokens: src/app/globals.css", mono(18), INK[5], "ra")

im.save(OUT, optimize=True)
print("ok", im.size, "last y", fy + 260)
