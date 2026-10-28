"""Folha 05: estado vazio do painel do anunciante (Primeiro Pulso).
A geometria é a mesma do componente PainelEmptyArt (src/components/dashboard-empty-art.tsx).
Gera HTML e fotografa com Chrome headless:
  python3 docs/painel/empty-state/render.py docs/painel/empty-state/subleasy-painel-vazio.png"""
import subprocess, sys, pathlib

OUT = pathlib.Path(sys.argv[1]).resolve()
SAT = "/Users/felipefernandes/Desktop/Fonts/Satoshi_Complete/Fonts/OTF/"
CF = "/Users/felipefernandes/.claude/skills/canvas-design/canvas-fonts/"
W, H = 2400, 2700

BRAND_900, BRAND_600, BRAND_300 = "#1a0b66", "#3818d9", "#b19ffb"
MINT = "#25edb1"
INK_100, INK_200 = "#eeeff1", "#e4e7ec"


def art():
    """Desenho em viewBox 240x152, idêntico ao do componente."""
    cells = []
    for row in range(4):
        for col in range(7):
            x, y = 132 + col * 13, 99.5 + row * 10
            if (row, col) == (1, 3):
                cells.append(f'<rect x="{x + .75}" y="{y + .75}" width="8.5" height="5.5" rx="1.75" fill="#fff" stroke="{BRAND_600}" stroke-width="1.5"/>')
            else:
                cells.append(f'<rect x="{x}" y="{y}" width="10" height="7" rx="2" fill="{INK_100}"/>')
    return f'''<svg viewBox="0 0 240 152" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="8" width="224" height="76" rx="14" fill="{BRAND_900}"/>
  <rect x="22" y="22" width="36" height="5" rx="2.5" fill="#fff" fill-opacity=".22"/>
  <path d="M22 40h196M22 53h196" stroke="#fff" stroke-opacity=".08"/>
  <path d="M22 66h128" stroke="{BRAND_300}" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>
  <path d="M162 66h54" stroke="#fff" stroke-opacity=".28" stroke-width="2" stroke-linecap="round" stroke-dasharray="0 6"/>
  <circle cx="150" cy="66" r="9" fill="{MINT}" fill-opacity=".18"/>
  <circle cx="150" cy="66" r="4" fill="{MINT}" stroke="{BRAND_900}" stroke-width="2"/>
  <rect x="8.5" y="92.5" width="103" height="51" rx="11.5" fill="#fff" stroke="{INK_200}"/>
  <rect x="20" y="103" width="36" height="5" rx="2.5" fill="{INK_200}"/>
  <rect x="20" y="114" width="26" height="10" rx="3" fill="{INK_100}"/>
  <path d="M20 134h80" stroke="{INK_200}" stroke-width="2" stroke-linecap="round"/>
  <rect x="120.5" y="92.5" width="111" height="51" rx="11.5" fill="#fff" stroke="{INK_200}"/>
  {"".join(cells)}
</svg>'''


html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:Sat;src:url(file://{SAT}Satoshi-Regular.otf);font-weight:400}}
@font-face{{font-family:Sat;src:url(file://{SAT}Satoshi-Black.otf);font-weight:900}}
@font-face{{font-family:Mono;src:url(file://{CF}GeistMono-Regular.ttf);font-weight:400}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{width:{W}px;height:{H}px;background:#fff;font-family:Sat;color:#1c1d1f;padding:160px;position:relative;-webkit-font-smoothing:antialiased}}
.mono{{font-family:Mono;font-size:22px;letter-spacing:.04em;color:#646e7d}}
.top{{display:flex;justify-content:space-between;border-bottom:2px solid {INK_200};padding-bottom:30px}}
.top b{{color:#1c1d1f;font-weight:400}}
h1{{font-weight:900;font-size:150px;line-height:.95;letter-spacing:-.035em;margin-top:110px}}
h1 em{{font-style:normal;color:{BRAND_600}}}
.lede{{margin-top:36px;font-size:34px;color:#505967;max-width:1040px;line-height:1.4}}
.stage{{margin-top:110px;height:1360px;border-radius:40px;background:#f4f5f6;box-shadow:0 0 0 1px rgba(28,29,31,.05) inset;display:grid;place-items:center;position:relative}}
.stage svg{{width:1680px;height:auto}}
.stage .c{{position:absolute;font-family:Mono;font-size:18px;color:#9fa1a7;letter-spacing:.06em}}
.legend{{margin-top:56px;display:grid;grid-template-columns:repeat(4,1fr);gap:40px}}
.legend p{{font-size:26px;line-height:1.4;color:#505967}}
.legend span{{display:block;font-family:Mono;font-size:20px;color:#9fa1a7;margin-bottom:14px;letter-spacing:.06em}}
.sw{{display:inline-block;width:18px;height:18px;border-radius:5px;vertical-align:-2px;margin-right:12px}}
.foot{{position:absolute;left:160px;right:160px;bottom:120px;display:flex;justify-content:space-between;border-top:2px solid {INK_200};padding-top:30px}}
</style></head><body>
<div class="top mono"><span><b>SUBLEASY 2.0</b> · PAINEL DO ANUNCIANTE</span><span>FOLHA 05 · ESTADO VAZIO</span></div>
<h1>Primeiro<br><em>pulso.</em></h1>
<p class="lede">O instrumento já está ligado. A linha segue reta até o agora; dali em diante, o tempo que ainda vai acontecer.</p>
<div class="stage">
  <span class="c" style="top:40px;left:48px">240 × 152</span>
  <span class="c" style="top:40px;right:48px">MÓDULO 13</span>
  <span class="c" style="bottom:40px;left:48px">7 DIAS · 4 TURNOS</span>
  <span class="c" style="bottom:40px;right:48px">1 PONTO DE MENTA</span>
  {art()}
</div>
<div class="legend">
  <p><span>01</span><i class="sw" style="background:{BRAND_900}"></i>Campo do pulso, ainda plano.</p>
  <p><span>02</span><i class="sw" style="background:{MINT}"></i>Agora: onde o traço firme vira tracejado.</p>
  <p><span>03</span><i class="sw" style="background:{INK_100}"></i>Números e turnos à espera.</p>
  <p><span>04</span><i class="sw" style="background:#fff;box-shadow:0 0 0 3px {BRAND_600} inset"></i>Onde a primeira marca deve cair.</p>
</div>
<div class="foot mono"><span>violeta = atenção · menta = agora · cinza = livre</span><span>PRIMEIRO PULSO</span></div>
</body></html>"""

src = pathlib.Path("/tmp/painel-canvas/empty.html"); src.write_text(html)
subprocess.run(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "--headless=new", "--disable-gpu", "--hide-scrollbars",
                "--allow-file-access-from-files", f"--window-size={W},{H}", "--force-device-scale-factor=1",
                f"--screenshot={OUT}", f"file://{src}"], check=True, capture_output=True)
print(OUT)
