import sys
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1]
SAT = "/Users/felipefernandes/Desktop/Fonts/Satoshi_Complete/Fonts/OTF/"
CF = "/Users/felipefernandes/.claude/skills/canvas-design/canvas-fonts/"
def sat(w, s): return ImageFont.truetype(SAT + f"Satoshi-{w}.otf", s)
def mono(s, b=False): return ImageFont.truetype(CF + ("GeistMono-Bold.ttf" if b else "GeistMono-Regular.ttf"), s)

W, H = 2400, 3144
M = 160                                   # margem; unidade base U = 8
BRAND6, BRAND1, BRAND0 = "#3818d9", "#e9e3fe", "#f4f1ff"
MINT, MINT1, MINT7 = "#11d096", "#cefbea", "#047857"
AMBER, AMBER1 = "#f79009", "#fef0c7"
INK = ["#f9fafb", "#f2f4f7", "#eaecf0", "#d0d5dd", "#98a2b3", "#667085", "#475467", "#344054", "#1d2939", "#101828"]

SS = 2                                    # desenha em 2x e reduz: bordas limpas
im = Image.new("RGB", (W * SS, H * SS), "#ffffff")
d = ImageDraw.Draw(im)
def s(v): return int(round(v * SS))

def text(x, y, t, f, fill, anchor="la"):
    d.text((s(x), s(y)), t, font=f, fill=fill, anchor=anchor)
def rr(x0, y0, x1, y1, r, fill=None, outline=None, w=2):
    d.rounded_rectangle((s(x0), s(y0), s(x1), s(y1)), radius=s(r), fill=fill, outline=outline, width=s(w) if outline else 0)
def line(x0, y0, x1, y1, fill=INK[2], w=2):
    d.line((s(x0), s(y0), s(x1), s(y1)), fill=fill, width=s(w))
def F(kind, size, b=False): return sat(kind, s(size)) if kind != "mono" else mono(s(size), b)
def width(t, f): return d.textlength(t, font=f) / SS
def fit(t, f, maxw):
    if width(t, f) <= maxw: return t
    while width(t + "…", f) > maxw: t = t[:-1]
    return t.rstrip() + "…"

# ── dados: os três estados do prazo ─────────────────────────
LISTINGS = [
    dict(title="Sala de psicologia na Zona 7", place="Zona 7, Maringá  ·  R$ 70 por turno",
         published="24 OUT", ends="23 NOV", total=30, left=29, views=128, clicks=9, state="live",
         photo=("#e8e1d6", "#c9b9a3", "#8a7660")),
    dict(title="Consultório de nutrição em Porto Alegre", place="Moinhos de Vento  ·  R$ 1.800 por mês",
         published="30 SET", ends="30 OUT", total=30, left=5, views=342, clicks=21, state="due",
         photo=("#dfe6ea", "#b5c4cc", "#6d808b")),
    dict(title="Sala de estética no Batel", place="Batel, Curitiba  ·  R$ 60 por hora",
         published="15 SET", ends="15 OUT", total=30, left=0, views=57, clicks=3, state="over",
         photo=("#ebe3e6", "#cdbac1", "#8f7480")),
]
TONE = {"live": BRAND6, "due": AMBER, "over": INK[3]}
CHIP = {"live": ("NO AR", MINT1, MINT7), "due": ("EXPIRA EM 5 DIAS", AMBER1, "#93370d"), "over": ("EXPIRADO", INK[1], INK[6])}

def photo(x0, y0, x1, y1, tones, r, top_only=False):
    """Sala abstrata: parede, janela de luz, piso e o tampo de uma mesa."""
    wall, mid, floor = tones
    layer = Image.new("RGB", (s(x1 - x0), s(y1 - y0)), wall)
    p = ImageDraw.Draw(layer)
    w, h = x1 - x0, y1 - y0
    p.rectangle((0, s(h * 0.72), s(w), s(h)), fill=mid)                               # piso
    p.rectangle((s(w * 0.58), s(h * 0.14), s(w * 0.86), s(h * 0.60)), fill="#ffffff")  # janela
    p.line((s(w * 0.72), s(h * 0.14), s(w * 0.72), s(h * 0.60)), fill=wall, width=s(3))
    p.rectangle((s(w * 0.10), s(h * 0.56), s(w * 0.50), s(h * 0.61)), fill=floor)      # tampo
    p.rectangle((s(w * 0.13), s(h * 0.61), s(w * 0.145), s(h * 0.80)), fill=floor)     # pernas
    p.rectangle((s(w * 0.455), s(h * 0.61), s(w * 0.47), s(h * 0.80)), fill=floor)
    mask = Image.new("L", layer.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, layer.size[0] - 1, layer.size[1] - 1 + (s(r) if top_only else 0)), radius=s(r), fill=255)
    im.paste(layer, (s(x0), s(y0)), mask)

def chip(x, y, state):
    label, bg, fg = CHIP[state]
    f = F("mono", 16, True)
    w = width(label, f) + 28
    rr(x, y, x + w, y + 32, 16, fill=bg)
    text(x + 14, y + 16, label, f, fg, "lm")

def ruler(x0, x1, y, item, h=12):
    """O prazo como régua: trecho vivido apagado, trecho restante na cor do estado."""
    rr(x0, y, x1, y + h, h / 2, fill=INK[1])
    if item["left"] > 0:
        start = x0 + (x1 - x0) * (1 - item["left"] / item["total"])
        rr(start, y, x1, y + h, h / 2, fill=TONE[item["state"]])
    # marca de hoje
    today = x0 + (x1 - x0) * (1 - item["left"] / item["total"])
    line(today, y - 10, today, y + h + 10, INK[8] if item["left"] else INK[4], 2)

def days(x, y, item, size=72):
    n = str(item["left"])
    f = F("Black", size)
    text(x, y, n, f, INK[9] if item["state"] != "over" else INK[4], "ls")
    label = "DIAS RESTANTES" if item["left"] != 1 else "DIA RESTANTE"
    if item["state"] == "over":
        label = "DIAS  ·  FORA DO AR"
    text(x + width(n, f) + 16, y - 8, label, F("mono", 17), INK[5], "ls")

def metric(x, y, value, label, muted=False, size=72):
    text(x, y, f"{value:,}".replace(",", "."), F("Black", size), INK[4] if muted else INK[9], "ls")
    text(x, y + 32, label, F("mono", 17), INK[5], "ls")

def renew(x, y, state):
    """Renovar: menta no estado que pede ação agora; contorno no expirado."""
    f = F("mono", 17, True)
    label = "RENOVAR  →"
    w = width(label, f) + 40
    if state == "due":
        rr(x, y, x + w, y + 44, 22, fill=MINT)
        text(x + w / 2, y + 22, label, f, INK[9], "mm")
    else:
        rr(x, y, x + w, y + 44, 22, outline=INK[3])
        text(x + w / 2, y + 22, label, f, INK[7], "mm")
    return w

# ── cabeçalho ───────────────────────────────────────────────
text(M, M, "SUBLEASY 2.0  /  MEUS ANÚNCIOS", F("mono", 22, True), INK[9])
text(W - M, M, "FOLHA 04  ·  25.10.2026", F("mono", 22), INK[5], "ra")
line(M, M + 56, W - M, M + 56)
text(M - 6, M + 136, "Meia-vida", F("Black", 132), INK[9])
text(M, M + 320, "Fig. 3  ·  o prazo de cada anúncio, medido à vista", F("Medium", 36), INK[5])

# legenda dos estados, à direita do título
lx = W - M - 520
for i, (state, name) in enumerate([("live", "NO AR · PRAZO FOLGADO"), ("due", "A 7 DIAS DO FIM"), ("over", "PRAZO ENCERRADO")]):
    y = M + 176 + i * 56
    rr(lx, y - 6, lx + 64, y + 6, 6, fill=TONE[state])
    text(lx + 88, y, name, F("mono", 18), INK[7], "lm")

# ── A. lista ────────────────────────────────────────────────
AY = 640
text(M, AY, "A.  LISTA", F("mono", 20, True), INK[8], "lb")
text(W - M, AY, "UMA LINHA POR ANÚNCIO  ·  LEITURA DA ESQUERDA PARA A DIREITA", F("mono", 18), INK[4], "rb")
ROW_H, ROW_GAP = 248, 24
COLS = dict(text=256, time=904, views=1536, clicks=1800)   # recuos dentro da linha
for i, item in enumerate(LISTINGS):
    x0, y0 = M, AY + 40 + i * (ROW_H + ROW_GAP)
    x1, y1 = W - M, y0 + ROW_H
    rr(x0, y0, x1, y1, 24, fill="#ffffff", outline=INK[2])
    photo(x0 + 24, y0 + 24, x0 + 224, y0 + 224, item["photo"], 16)
    if item["state"] == "over":                      # foto adormecida
        veil = Image.new("RGBA", (s(200), s(200)), (255, 255, 255, 120))
        vm = Image.new("L", veil.size, 0)
        ImageDraw.Draw(vm).rounded_rectangle((0, 0, s(200) - 1, s(200) - 1), radius=s(16), fill=120)
        im.paste(Image.new("RGB", veil.size, "#ffffff"), (s(x0 + 24), s(y0 + 24)), vm)
    tx = x0 + COLS["text"]
    chip(tx, y0 + 40, item["state"])
    text(tx, y0 + 104, fit(item["title"], F("Bold", 34), COLS["time"] - COLS["text"] - 64), F("Bold", 34), INK[9], "lm")
    text(tx, y0 + 152, item["place"], F("Medium", 24), INK[5], "lm")

    # prazo
    px0, px1 = x0 + COLS["time"], x0 + COLS["views"] - 96
    line(px0 - 48, y0 + 40, px0 - 48, y1 - 40)
    text(px0, y0 + 56, "PUBLICADO " + item["published"], F("mono", 17), INK[6], "lm")
    text(px1, y0 + 56, ("EXPIROU " if item["state"] == "over" else "EXPIRA ") + item["ends"], F("mono", 17), INK[6], "rm")
    ruler(px0, px1, y0 + 92, item)
    days(px0, y0 + 196, item)
    if item["state"] != "live":
        renew(px1 - 182, y0 + 160, item["state"])

    # métricas
    line(x0 + COLS["views"] - 48, y0 + 40, x0 + COLS["views"] - 48, y1 - 40)
    muted = item["state"] == "over"
    metric(x0 + COLS["views"], y0 + 132, item["views"], "VISUALIZAÇÕES", muted)
    metric(x0 + COLS["clicks"], y0 + 132, item["clicks"], "CONTATOS WHATSAPP", muted)
    text(x0 + COLS["views"], y0 + 56, "ÚLTIMOS 30 DIAS", F("mono", 17), INK[4], "lm")

# ── B. grade ────────────────────────────────────────────────
BY = AY + 40 + 3 * ROW_H + 2 * ROW_GAP + 136
text(M, BY, "B.  GRADE", F("mono", 20, True), INK[8], "lb")
text(W - M, BY, "A FOTO PRIMEIRO  ·  AS MEDIÇÕES ABAIXO", F("mono", 18), INK[4], "rb")
GAP = 48
CW = (W - 2 * M - 2 * GAP) // 3
COVER = 440
for i, item in enumerate(LISTINGS):
    x0, y0 = M + i * (CW + GAP), BY + 40
    x1 = x0 + CW
    y1 = y0 + COVER + 536
    rr(x0, y0, x1, y1, 24, fill="#ffffff", outline=INK[2])
    photo(x0 + 1, y0 + 1, x1 - 1, y0 + COVER, item["photo"], 23, top_only=True)
    if item["state"] == "over":
        vm = Image.new("L", (s(CW - 2), s(COVER - 1)), 0)
        ImageDraw.Draw(vm).rounded_rectangle((0, 0, s(CW - 2), s(COVER + 40)), radius=s(23), fill=120)
        im.paste(Image.new("RGB", vm.size, "#ffffff"), (s(x0 + 1), s(y0 + 1)), vm)
    chip(x0 + 24, y0 + 24, item["state"])

    bx0, bx1 = x0 + 32, x1 - 32
    text(bx0, y0 + COVER + 56, fit(item["title"], F("Bold", 34), bx1 - bx0), F("Bold", 34), INK[9], "lm")
    text(bx0, y0 + COVER + 100, item["place"], F("Medium", 24), INK[5], "lm")

    ty = y0 + COVER + 160
    text(bx0, ty, "PUBLICADO " + item["published"], F("mono", 17), INK[6], "lm")
    text(bx1, ty, ("EXPIROU " if item["state"] == "over" else "EXPIRA ") + item["ends"], F("mono", 17), INK[6], "rm")
    ruler(bx0, bx1, ty + 32, item)
    days(bx0, ty + 136, item, 64)

    my = ty + 192
    line(bx0, my, bx1, my)
    muted = item["state"] == "over"
    half = (bx1 - bx0) / 2
    metric(bx0, my + 104, item["views"], "VISUALIZAÇÕES", muted, 64)
    metric(bx0 + half, my + 104, item["clicks"], "CONTATOS WHATSAPP", muted, 64)
    if item["state"] != "live":
        renew(bx1 - 182, ty + 92, item["state"])

# ── rodapé ─────────────────────────────────────────────────
fy = H - M - 200
line(M, fy, W - M, fy)
text(M - 4, fy + 56, "O prazo é a informação. As medições vêm logo depois.", F("Bold", 52), INK[9])
text(M, fy + 140, "3 ESTADOS  ·  2 ARRANJOS  ·  1 RÉGUA POR ANÚNCIO  ·  MENTA SÓ ONDE O CICLO RECOMEÇA", F("mono", 20), INK[5])
text(W - M, fy + 140, "U = 8 PX", F("mono", 20), INK[4], "ra")

im.resize((W, H), Image.LANCZOS).save(OUT)
