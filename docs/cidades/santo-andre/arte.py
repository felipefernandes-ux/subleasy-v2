"""Cartografia Ociosa: prancha de Santo André. Renderiza em 2x e reduz para antialias."""
import math
import random
import sys
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1]
FONTS = "/Users/felipefernandes/.claude/skills/canvas-design/canvas-fonts/"
S = 2  # supersample
W, H = 1200 * S, 1000 * S
M = 48 * S  # margem

BG = (255, 255, 255)
GRID = (228, 231, 236)      # ink-200
IDLE = (214, 218, 225)
INK = (95, 105, 120)        # ink-600
INK_DARK = (28, 29, 31)     # ink-900
CONTOUR = (232, 234, 238)
BRAND = (56, 24, 217)       # brand-600
BRAND_SOFT = (138, 110, 244)  # brand-400
MINT = (17, 208, 150)       # mint-500
RIVER = (180, 186, 196)

mono = lambda size: ImageFont.truetype(FONTS + "DMMono-Regular.ttf", size * S)
sans = lambda size: ImageFont.truetype(FONTS + "InstrumentSans-Regular.ttf", size * S)
sans_b = lambda size: ImageFont.truetype(FONTS + "InstrumentSans-Bold.ttf", size * S)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)
rng = random.Random(4)  # determinístico

# Área útil do mapa
X0, Y0, X1, Y1 = M, M + 52 * S, W - M, H - M - 92 * S
LAT0, LAT1 = -23.638, -23.688
LNG0, LNG1 = -46.572, -46.498


def proj(lat, lng):
    x = X0 + (lng - LNG0) / (LNG1 - LNG0) * (X1 - X0)
    y = Y0 + (lat - LAT0) / (LAT1 - LAT0) * (Y1 - Y0)
    return x, y


# Bairros com sala no ar (posição aproximada do bairro, não do endereço)
PLACES = [
    ("CENTRO", -23.6560, -46.5330, 1.00, (1, -1)),
    ("VILA GUIOMAR", -23.6612, -46.5420, 0.80, (-1, -1)),
    ("CASA BRANCA", -23.6640, -46.5235, 0.80, (1, 1)),
    ("JD. BELA VISTA", -23.6705, -46.5440, 0.70, (-1, 1)),
]
centers = [(proj(lat, lng), w) for _, lat, lng, w, _ in PLACES]

# ── Linhas de nível: sobem da base, como a serra ao sul ──────────────
cx, cy = (X0 + X1) * 0.58, Y1 + 900 * S
for k in range(14):
    r0 = 520 * S + k * 74 * S
    pts = []
    for a in range(0, 3601):
        t = math.radians(a / 10)
        wob = 26 * S * math.sin(3 * t + k * 0.7) + 14 * S * math.sin(7 * t + k * 1.3) + 6 * S * math.sin(13 * t + k)
        r = r0 + wob
        x, y = cx + r * math.cos(t) * 1.55, cy + r * math.sin(t)
        if X0 <= x <= X1 and Y0 <= y <= Y1:
            pts.append((x, y))
        elif pts:
            if len(pts) > 1:
                d.line(pts, fill=CONTOUR, width=2 * S)
            pts = []
    if len(pts) > 1:
        d.line(pts, fill=CONTOUR, width=2 * S)

def river_y(x):
    t = (x - X0) / (X1 - X0)
    return Y0 + (0.20 + 0.10 * t) * (Y1 - Y0) + 30 * S * math.sin(t * 5.2 + 0.6) + 10 * S * math.sin(t * 13)


# ── Malha de horas ───────────────────────────────────────────────────
STEP = 36 * S
CELL = 16 * S
cols = int((X1 - X0) // STEP)
rows = int((Y1 - Y0) // STEP)
ox = X0 + ((X1 - X0) - (cols - 1) * STEP - CELL) / 2
oy = Y0 + ((Y1 - Y0) - (rows - 1) * STEP - CELL) / 2
SIGMA = 104 * S

for j in range(rows):
    for i in range(cols):
        x, y = ox + i * STEP, oy + j * STEP
        mx, my = x + CELL / 2, y + CELL / 2
        p = 0.0
        for (px, py), w in centers:
            dist2 = (mx - px) ** 2 + (my - py) ** 2
            p = max(p, w * math.exp(-dist2 / (2 * SIGMA ** 2)))
        roll = rng.random()
        ry = river_y(mx)
        if abs(my - ry) < STEP * 0.62:
            continue
        box = [x, y, x + CELL, y + CELL]
        if roll < p ** 0.8:
            color = MINT if rng.random() < 0.07 else (BRAND if roll < p ** 0.8 * 0.7 else BRAND_SOFT)
            d.rectangle(box, fill=color)
        else:
            d.rectangle(box, fill=BG, outline=IDLE, width=2 * S)

# ── Rio: uma linha que organiza a cidade ─────────────────────────────
river = []
for n in range(0, 401):
    t = n / 400
    x = X0 + t * (X1 - X0)
    river.append((x, river_y(x)))
d.line(river, fill=RIVER, width=2 * S)

# ── Marcadores dos bairros ───────────────────────────────────────────
label_font = mono(24)
for (name, lat, lng, _, (sx, sy)), ((px, py), _) in zip(PLACES, centers):
    r = 12 * S
    d.ellipse([px - r, py - r, px + r, py + r], fill=BG, outline=INK_DARK, width=2 * S)
    d.ellipse([px - 3 * S, py - 4 * S, px + 4 * S, py + 4 * S], fill=INK_DARK)
    ex, ey = px + sx * 64 * S, py + sy * 62 * S
    d.line([(px + sx * r * 0.75, py + sy * r * 0.75), (ex, ey)], fill=INK_DARK, width=S * 2)
    tw = d.textlength(name, font=label_font)
    coord = f"{abs(lat):.3f}°S  {abs(lng):.3f}°W"
    cf = mono(17)
    cw = d.textlength(coord, font=cf)
    pad = 14 * S
    bw = max(tw, cw) + 2 * pad
    bh = 74 * S
    bx = ex if sx > 0 else ex - bw
    by = ey - bh / 2
    d.rectangle([bx, by, bx + bw, by + bh], fill=BG, outline=INK_DARK, width=S * 2)
    d.text((bx + pad, by + 12 * S), name, font=label_font, fill=INK_DARK)
    d.text((bx + pad, by + 44 * S), coord, font=cf, fill=INK)

# ── Moldura, réguas e textos ─────────────────────────────────────────
d.rectangle([X0, Y0, X1, Y1], outline=GRID, width=2 * S)
tick = mono(15)
for k in range(0, 5):
    x = X0 + k * (X1 - X0) / 4
    d.line([(x, Y1), (x, Y1 + 8 * S)], fill=INK, width=S * 2)
    lng = LNG0 + k * (LNG1 - LNG0) / 4
    label = f"{abs(lng):.3f}"
    lw = d.textlength(label, font=tick)
    lx_ = min(max(x - lw / 2, X0), X1 - lw)
    d.text((lx_, Y1 + 14 * S), label, font=tick, fill=INK)

# Cabeçalho
d.text((X0, M), "FIG. 1", font=mono(19), fill=INK)
d.text((X0 + 96 * S, M), "HORAS DE ATENDIMENTO · SANTO ANDRÉ, SP", font=mono(19), fill=INK_DARK)
right = "23.66°S  46.53°W"
d.text((X1 - d.textlength(right, font=mono(19)), M), right, font=mono(19), fill=INK)

# Legenda no rodapé
fy = Y1 + 62 * S
lx = X0
items = [("outline", IDLE, "hora livre"), ("fill", BRAND, "hora em uso"), ("fill", MINT, "recém-ocupada")]
lf = mono(19)
for kind, color, text in items:
    box = [lx, fy, lx + CELL, fy + CELL]
    if kind == "fill":
        d.rectangle(box, fill=color)
    else:
        d.rectangle(box, outline=color, width=S * 2)
    d.text((lx + CELL + 10 * S, fy - 4 * S), text, font=lf, fill=INK)
    lx += CELL + 10 * S + d.textlength(text, font=lf) + 40 * S


img = img.resize((W // S, H // S), Image.LANCZOS)
img.save(OUT)
print("ok", OUT)
