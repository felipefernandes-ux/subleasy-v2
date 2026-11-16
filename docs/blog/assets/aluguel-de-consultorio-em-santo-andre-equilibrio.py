"""Fig. 2: horas por semana em que alugar por hora custa menos que manter sala própria."""
import sys
from PIL import Image, ImageDraw, ImageFont
OUT = sys.argv[1]
FONTS = "/Users/felipefernandes/.claude/skills/canvas-design/canvas-fonts/"
S = 2
W, H = 1200 * S, 900 * S
M = 64 * S
BG, IDLE, INK, INK_DARK = (255, 255, 255), (214, 218, 225), (95, 105, 120), (28, 29, 31)
BRAND, BRAND_SOFT, MINT, GRID = (56, 24, 217), (138, 110, 244), (17, 208, 150), (228, 231, 236)
mono = lambda size: ImageFont.truetype(FONTS + "DMMono-Regular.ttf", size * S)
img = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(img)

d.text((M, M), "FIG. 2", font=mono(19), fill=INK)
d.text((M + 96 * S, M), "HORAS DE ATENDIMENTO POR SEMANA", font=mono(19), fill=INK_DARK)
r = "SALA PRÓPRIA R$ 3.300/MÊS · HORA R$ 35"
d.text((W - M - d.textlength(r, font=mono(19)), M), r, font=mono(19), fill=INK)

COLS, ROWS, BREAK = 10, 5, 22
X0, Y0 = M, M + 110 * S
X1, Y1 = W - M, H - M - 150 * S
step_x = (X1 - X0) / COLS
step_y = (Y1 - Y0) / ROWS
cell = min(step_x, step_y) * 0.62
for n in range(COLS * ROWS):
    i, j = n % COLS, n // COLS
    cx, cy = X0 + step_x * (i + 0.5), Y0 + step_y * (j + 0.5)
    box = [cx - cell / 2, cy - cell / 2, cx + cell / 2, cy + cell / 2]
    hour = n + 1
    if hour <= BREAK:
        d.rectangle(box, fill=BRAND)
    else:
        d.rectangle(box, fill=BG, outline=IDLE, width=3 * S)
    if hour in (1, 10, 20, 22, 30, 40, 50):
        lab = f"{hour}h"
        f = mono(15)
        col = (255, 255, 255) if hour <= BREAK else INK
        d.text((cx - d.textlength(lab, font=f) / 2, cy - 9 * S), lab, font=f, fill=col)

# marcador do ponto de equilíbrio: depois da hora 22 (linha 3, coluna 2)
bi, bj = BREAK % COLS, BREAK // COLS
mx = X0 + step_x * bi
d.line([(mx, Y0 + step_y * bj + 6 * S), (mx, Y0 + step_y * (bj + 1) - 6 * S)], fill=MINT, width=5 * S)
d.ellipse([mx - 9 * S, Y0 + step_y * bj - 3 * S, mx + 9 * S, Y0 + step_y * bj + 15 * S], fill=MINT)

# legenda
fy = Y1 + 70 * S
f = mono(20)
items = [("fill", BRAND, "por hora custa menos"), ("line", MINT, "≈ 22 h: empate"), ("outline", IDLE, "sala própria compensa")]
lx = M
for kind, color, text in items:
    if kind == "fill":
        d.rectangle([lx, fy, lx + 22 * S, fy + 22 * S], fill=color)
    elif kind == "outline":
        d.rectangle([lx, fy, lx + 22 * S, fy + 22 * S], outline=color, width=3 * S)
    else:
        d.line([(lx + 11 * S, fy - 2 * S), (lx + 11 * S, fy + 24 * S)], fill=color, width=5 * S)
    d.text((lx + 34 * S, fy - 1 * S), text, font=f, fill=INK)
    lx += 34 * S + d.textlength(text, font=f) + 54 * S
d.line([(M, Y1 + 30 * S), (W - M, Y1 + 30 * S)], fill=GRID, width=2 * S)
img.resize((W // S, H // S), Image.LANCZOS).save(OUT); print("ok")
