"""Folha 04: direção visual do painel do anunciante (Pulso de Turno).
Gera HTML e fotografa com Chrome headless:  python3 docs/painel/render.py docs/painel/subleasy-painel.png"""
import subprocess, sys, pathlib

OUT = pathlib.Path(sys.argv[1]).resolve()
SAT = "/Users/felipefernandes/Desktop/Fonts/Satoshi_Complete/Fonts/OTF/"
CF = "/Users/felipefernandes/.claude/skills/canvas-design/canvas-fonts/"
W, H = 2400, 3420

views = [3,5,4,6,8,5,4,7,9,12,10,8,6,9,11,14,12,9,8,10,13,16,15,12,11,14,18,17,15,19]
contacts = {9:1, 15:2, 21:1, 22:2, 26:3, 29:2}

def smooth(points):
    d = f"M{points[0][0]:.1f},{points[0][1]:.1f}"
    for i in range(len(points) - 1):
        p0 = points[max(i - 1, 0)]; p1 = points[i]; p2 = points[i + 1]; p3 = points[min(i + 2, len(points) - 1)]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f" C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}"
    return d

CW, CH, PAD = 1258, 360, 14
mx = max(views) * 1.15
pts = [(PAD + i * (CW - 2 * PAD) / (len(views) - 1), CH - 24 - v / mx * (CH - 60)) for i, v in enumerate(views)]
line = smooth(pts)
area = line + f" L{pts[-1][0]:.1f},{CH} L{pts[0][0]:.1f},{CH} Z"
grid = "".join(f'<line x1="0" x2="{CW}" y1="{y}" y2="{y}" stroke="rgba(255,255,255,.07)" stroke-width="1"/>' for y in (60, 150, 240, 330))
dots = "".join(
    f'<circle cx="{pts[i][0]:.1f}" cy="{pts[i][1]:.1f}" r="{7 + n * 3}" fill="rgba(37,237,177,.18)"/>'
    f'<circle cx="{pts[i][0]:.1f}" cy="{pts[i][1]:.1f}" r="{4 + n}" fill="#25edb1" stroke="#1a0b66" stroke-width="3"/>'
    for i, n in contacts.items())
spark = lambda vals, color: (lambda m: '<polyline fill="none" stroke="%s" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="%s"/>' % (
    color, " ".join(f"{i * 300 / (len(vals) - 1):.1f},{48 - v / m * 40:.1f}" for i, v in enumerate(vals))))(max(vals))

# turnos: 7 dias x 4 faixas
heat = [[0,0,0,0,0,0,0],[1,3,4,3,5,2,0],[0,4,6,5,3,3,1],[0,1,2,2,1,0,0]]
cells = []
for r, row in enumerate(heat):
    for c, v in enumerate(row):
        alpha = 0.06 if v == 0 else 0.18 + v / 6 * 0.82
        bg = f"rgba(17,208,150,{alpha:.2f})" if v else "#f2f4f7"
        ring = "box-shadow:0 0 0 3px #fff,0 0 0 5px #047857;" if v == 6 else ""
        cells.append(f'<span style="background:{bg};{ring}"></span>')

comps = [45, 50, 55, 55, 60, 60, 62, 65, 65, 68, 75, 80, 85, 95]
lo, hi = 40, 100
pos = lambda v: (v - lo) / (hi - lo) * 100
marks = "".join(f'<span class="cp" style="left:{pos(v):.1f}%;bottom:{18 + 26 * comps[:i].count(v)}px"></span>' for i, v in enumerate(comps))
strip = f'''<div class="strip">{marks}<span class="med" style="left:{pos(65):.1f}%"><em>mediana R$ 65</em></span>
<span class="you" style="left:{pos(70):.1f}%"><em>você · R$ 70</em></span></div>
<div class="scale"><span>R$ 40</span><span>R$ 70</span><span>R$ 100</span></div>
<p class="big2"><b>8%</b> acima da mediana</p>'''

html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:Sat;src:url(file://{SAT}Satoshi-Regular.otf);font-weight:400}}
@font-face{{font-family:Sat;src:url(file://{SAT}Satoshi-Medium.otf);font-weight:500}}
@font-face{{font-family:Sat;src:url(file://{SAT}Satoshi-Bold.otf);font-weight:700}}
@font-face{{font-family:Sat;src:url(file://{SAT}Satoshi-Black.otf);font-weight:900}}
@font-face{{font-family:Mono;src:url(file://{CF}GeistMono-Regular.ttf);font-weight:400}}
@font-face{{font-family:Mono;src:url(file://{CF}GeistMono-Bold.ttf);font-weight:700}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{width:{W}px;height:{H}px;background:#fff;font-family:Sat;color:#101828;padding:160px;position:relative;-webkit-font-smoothing:antialiased}}
.mono{{font-family:Mono;font-size:22px;letter-spacing:.04em;color:#667085}}
.top{{display:flex;justify-content:space-between;border-bottom:2px solid #eaecf0;padding-bottom:30px}}
.top b{{color:#101828}}
h1{{font-weight:900;font-size:150px;line-height:.95;letter-spacing:-.035em;margin-top:110px}}
h1 em{{font-style:normal;color:#3818d9}}
.lede{{margin-top:36px;font-size:34px;color:#475467;max-width:1100px;line-height:1.4}}
.frame{{margin-top:90px;background:#f9fafb;border-radius:40px;padding:56px;box-shadow:0 1px 0 #eaecf0 inset,0 40px 80px -40px rgba(26,11,102,.25),0 0 0 1px rgba(16,24,40,.06)}}
.bar{{display:flex;justify-content:space-between;align-items:end}}
.bar h2{{font-weight:700;font-size:56px;letter-spacing:-.02em}}
.bar p{{font-size:24px;color:#667085;margin-top:6px}}
.seg{{display:flex;background:#fff;border-radius:999px;padding:6px;box-shadow:0 0 0 1px #eaecf0}}
.seg span{{font-weight:700;font-size:22px;padding:12px 26px;border-radius:999px;color:#344054}}
.seg .on{{background:#101828;color:#fff}}
.card{{background:#fff;border-radius:28px;box-shadow:0 0 0 1px rgba(16,24,40,.06),0 1px 2px rgba(16,24,40,.04);position:relative}}
.tag{{position:absolute;top:22px;right:24px;font-family:Mono;font-size:18px;color:#98a2b3}}
.kpis{{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:44px}}
.kpi{{padding:30px 32px}}
.kpi .l{{font-size:22px;color:#475467;font-weight:500}}
.kpi .v{{display:flex;align-items:baseline;gap:14px;margin-top:12px}}
.kpi .v b{{font-size:64px;font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums}}
.pill{{font-weight:700;font-size:19px;padding:5px 12px;border-radius:999px;background:#ecfdf6;color:#047857}}
.kpi svg{{margin-top:18px;display:block}}
.row{{display:grid;gap:24px;margin-top:24px}}
.pulse{{background:linear-gradient(160deg,#22108c,#1a0b66 60%);color:#fff;padding:36px 36px 28px;border-radius:28px;position:relative;overflow:hidden}}
.pulse .tag{{color:rgba(255,255,255,.35)}}
.pulse .h{{display:flex;justify-content:space-between;align-items:end}}
.pulse .l{{font-size:22px;color:#d3c8fd;font-weight:500}}
.pulse .big{{font-size:96px;font-weight:700;letter-spacing:-.04em;line-height:1;margin-top:10px}}
.legend{{display:flex;gap:28px;font-size:20px;color:#d3c8fd}}
.legend i{{display:inline-block;width:14px;height:14px;border-radius:999px;margin-right:10px;vertical-align:-1px}}
.axis{{display:flex;justify-content:space-between;font-family:Mono;font-size:17px;color:rgba(255,255,255,.4);margin-top:10px}}
.conv{{padding:36px;display:flex;flex-direction:column}}
.ring{{position:relative;width:260px;height:260px;margin:22px auto 0}}
.ring b{{position:absolute;inset:0;display:grid;place-items:center;font-size:64px;font-weight:700;letter-spacing:-.03em}}
.ring small{{position:absolute;left:0;right:0;top:170px;text-align:center;font-size:19px;color:#667085}}
.steps{{margin-top:auto;display:grid;gap:16px}}
.step{{display:grid;grid-template-columns:1fr auto;font-size:21px;color:#344054;row-gap:8px}}
.step b{{font-variant-numeric:tabular-nums}}
.track{{grid-column:1/-1;height:10px;border-radius:99px;background:#f2f4f7}}
.track span{{display:block;height:100%;border-radius:99px}}
.h3{{font-size:28px;font-weight:700}}
.sub{{font-size:21px;color:#667085;margin-top:6px}}
.heat{{display:grid;grid-template-columns:110px repeat(7,1fr);gap:12px;margin-top:30px;align-items:center}}
.heat span{{height:58px;border-radius:14px}}
.heat .rl{{font-size:19px;color:#667085;height:auto}}
.heat .cl{{font-family:Mono;font-size:18px;color:#98a2b3;text-align:center;height:auto}}
.gauge{{position:relative;height:14px;border-radius:99px;background:linear-gradient(90deg,#cefbea,#f2f4f7 50%,#fde7cc);margin-top:64px}}
.gauge .mid{{position:absolute;left:50%;top:-14px;bottom:-14px;width:2px;background:#98a2b3}}
.gauge .me{{position:absolute;left:58%;top:50%;width:34px;height:34px;border-radius:99px;background:#3818d9;transform:translate(-50%,-50%);box-shadow:0 0 0 6px #fff,0 8px 20px rgba(56,24,217,.35)}}
.gauge .lbl{{position:absolute;top:-58px;left:58%;transform:translateX(-50%);background:#101828;color:#fff;font-weight:700;font-size:19px;padding:6px 14px;border-radius:10px;white-space:nowrap}}
.strip{{position:relative;height:150px;margin-top:40px;border-bottom:2px solid #eaecf0}}
.cp{{position:absolute;width:20px;height:20px;border-radius:99px;background:#d0d5dd;transform:translateX(-50%)}}
.med{{position:absolute;bottom:0;top:-6px;width:2px;background:#98a2b3}}
.med em{{position:absolute;top:-30px;left:10px;font-style:normal;font-family:Mono;font-size:17px;color:#667085;white-space:nowrap}}
.you{{position:absolute;bottom:14px;width:30px;height:30px;border-radius:99px;background:#3818d9;transform:translateX(-50%);box-shadow:0 0 0 6px #fff,0 8px 20px rgba(56,24,217,.35)}}
.you em{{position:absolute;bottom:46px;left:50%;transform:translateX(-50%);font-style:normal;font-weight:700;font-size:19px;background:#101828;color:#fff;padding:6px 14px;border-radius:10px;white-space:nowrap}}
.big2{{margin-top:26px;font-size:24px;color:#475467}}.big2 b{{font-size:48px;color:#101828;letter-spacing:-.03em;margin-right:6px}}
.scale{{display:flex;justify-content:space-between;font-family:Mono;font-size:17px;color:#98a2b3;margin-top:22px}}
.ins{{display:grid;grid-template-columns:72px 1fr auto;gap:24px;align-items:center;padding:26px 28px}}
.thumb{{width:72px;height:72px;border-radius:18px;background:linear-gradient(135deg,#e9e3fe,#b19ffb)}}
.ins .k{{font-family:Mono;font-size:17px;color:#98a2b3;letter-spacing:.04em}}
.ins .t{{font-size:26px;font-weight:700;margin-top:4px}}
.ins .d{{font-size:21px;color:#475467;margin-top:6px;line-height:1.45}}
.act{{display:flex;gap:12px;align-items:center}}
.btn{{font-weight:700;font-size:20px;padding:14px 22px;border-radius:14px;background:#3818d9;color:#fff}}
.x{{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;color:#98a2b3;box-shadow:0 0 0 1px #eaecf0;font-size:26px}}
.dot{{width:12px;height:12px;border-radius:99px;display:inline-block;margin-right:10px}}
.foot{{position:absolute;left:160px;right:160px;bottom:120px;display:flex;justify-content:space-between;border-top:2px solid #eaecf0;padding-top:28px}}
</style></head><body>
<div class="top mono"><span><b>SUBLEASY 2.0</b>  /  PAINEL DO ANUNCIANTE</span><span>FOLHA 04  ·  PULSO DE TURNO  ·  26.10.2026</span></div>
<h1>o pulso<br><em>da sua sala.</em></h1>
<p class="lede">Visitas, contatos e o momento em que alguém decide chamar. Um campo escuro para o ritmo, menta para o acontecimento, o resto em silêncio.</p>

<div class="frame">
  <div class="bar"><div><p class="mono" style="font-size:19px">BOA NOITE, FELIPE</p><h2>Painel</h2></div>
    <div class="seg"><span>7 dias</span><span class="on">30 dias</span><span>90 dias</span></div></div>

  <div class="kpis">
    <div class="card kpi"><span class="tag">01</span><p class="l">Visitas</p><div class="v"><b>312</b><span class="pill">↗ 24%</span></div><svg width="300" height="52">{spark(views,'#583be9')}</svg></div>
    <div class="card kpi"><span class="tag">02</span><p class="l">Contatos</p><div class="v"><b>11</b><span class="pill">↗ 38%</span></div><svg width="300" height="52">{spark([0,0,1,0,0,1,0,2,1,0,1,3,2,2],'#11d096')}</svg></div>
    <div class="card kpi"><span class="tag">03</span><p class="l">Conversão</p><div class="v"><b>3,5%</b><span class="pill">↗ 0,4 p.p.</span></div><svg width="300" height="52">{spark([2,2.5,2.2,3,2.8,3.1,3.4,3.2,3.5],'#101828')}</svg></div>
    <div class="card kpi"><span class="tag">04</span><p class="l">Favoritos</p><div class="v"><b>27</b><span class="pill" style="background:#f2f4f7;color:#475467">igual</span></div><svg width="300" height="52">{spark([2,3,3,4,3,5,4,4,5,4],'#b19ffb')}</svg></div>
  </div>

  <div class="row" style="grid-template-columns:2.15fr 1fr">
    <div class="pulse"><span class="tag">05</span>
      <div class="h"><div><p class="l">Visitas e contatos por dia</p><p class="big">312</p></div>
        <div class="legend"><span><i style="background:#8a6ef4"></i>Visitas</span><span><i style="background:#25edb1"></i>Dia com contato</span></div></div>
      <svg width="{CW}" height="{CH}" style="display:block;margin-top:18px;overflow:visible">
        <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6ef4" stop-opacity=".55"/><stop offset="1" stop-color="#8a6ef4" stop-opacity="0"/></linearGradient></defs>
        {grid}<path d="{area}" fill="url(#g)"/><path d="{line}" fill="none" stroke="#b19ffb" stroke-width="4" stroke-linecap="round"/>{dots}
      </svg>
      <div class="axis"><span>27/09</span><span>04/10</span><span>11/10</span><span>18/10</span><span>hoje</span></div>
    </div>
    <div class="card conv"><span class="tag">06</span><p class="h3">Conversão</p><p class="sub">Visitas que viraram contato</p>
      <div class="ring"><svg width="260" height="260" viewBox="0 0 260 260"><circle cx="130" cy="130" r="108" fill="none" stroke="#f2f4f7" stroke-width="22"/>
        <circle cx="130" cy="130" r="108" fill="none" stroke="#11d096" stroke-width="22" stroke-linecap="round" stroke-dasharray="{0.35*678.6:.1f} 678.6" transform="rotate(-90 130 130)"/></svg><b>3,5%</b><small>11 de 312</small></div>
      <div class="steps">
        <div class="step"><span>Abriram o anúncio</span><b>312</b><div class="track"><span style="width:100%;background:#3818d9"></span></div></div>
        <div class="step"><span>Salvaram</span><b>27</b><div class="track"><span style="width:28%;background:#8a6ef4"></span></div></div>
        <div class="step"><span>Chamaram</span><b>11</b><div class="track"><span style="width:12%;background:#11d096"></span></div></div>
      </div></div>
  </div>

  <div class="row" style="grid-template-columns:1.25fr 1fr">
    <div class="card" style="padding:36px"><span class="tag">07</span><p class="h3">Quando te procuram</p><p class="sub">Contatos por dia e turno, últimos 90 dias</p>
      <div class="heat"><i></i>{''.join(f'<span class="cl">{d}</span>' for d in 'DSTQQSS')}
        {''.join(f'<span class="rl">{label}</span>' + cells_row for label, cells_row in zip(['Madrugada','Manhã','Tarde','Noite'], [''.join(cells[i*7:(i+1)*7]) for i in range(4)]))}
      </div></div>
    <div class="card" style="padding:36px;display:flex;flex-direction:column"><span class="tag">08</span><p class="h3">Preço no mercado</p><p class="sub">Sala de psicologia na Zona 7 · R$ 70 por turno</p>
      {strip}
      <p class="sub" style="margin-top:auto">Mediana de 14 salas do mesmo tipo em Maringá.</p></div>
  </div>

  <div class="row" style="margin-top:44px"><div class="bar"><div><h2 style="font-size:38px">Insights</h2><p>3 sugestões para esta semana</p></div></div></div>
  <div class="row" style="gap:16px">
    <div class="card ins"><span class="thumb"></span><div><p class="k"><span class="dot" style="background:#f79009"></span>SALA DE PSICOLOGIA NA ZONA 7</p><p class="t">Expira em 5 dias</p><p class="d">Renove para continuar recebendo contatos sem interrupção.</p></div><div class="act"><span class="btn">Renovar anúncio</span><span class="x">×</span></div></div>
    <div class="card ins"><span class="thumb" style="background:linear-gradient(135deg,#cefbea,#25edb1)"></span><div><p class="k"><span class="dot" style="background:#583be9"></span>CONSULTÓRIO NO CENTRO</p><p class="t">Converte metade da Zona 7</p><p class="d">Mesmas visitas, metade dos contatos. A Zona 7 tem 6 fotos; esta tem 2.</p></div><div class="act"><span class="btn">Adicionar fotos</span><span class="x">×</span></div></div>
    <div class="card ins"><span class="thumb" style="background:linear-gradient(135deg,#f2f4f7,#d0d5dd)"></span><div><p class="k"><span class="dot" style="background:#11d096"></span>SEU PERFIL</p><p class="t">Coloque uma foto no perfil</p><p class="d">A foto aparece nos anúncios e ajuda quem procura sala a confiar em você.</p></div><div class="act"><span class="btn">Adicionar foto</span><span class="x">×</span></div></div>
  </div>
</div>
<div class="foot mono"><span>01–04 resumo · 05 pulso · 06 conversão · 07 turnos · 08 mercado</span><span>violeta = atenção   ·   menta = alguém chamou</span></div>
</body></html>"""

src = pathlib.Path("/tmp/painel-canvas/sheet.html"); src.write_text(html)
subprocess.run(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "--headless=new", "--disable-gpu", "--hide-scrollbars",
                "--allow-file-access-from-files", f"--window-size={W},{H}", "--force-device-scale-factor=1",
                f"--screenshot={OUT}", f"file://{src}"], check=True, capture_output=True)
print(OUT)
