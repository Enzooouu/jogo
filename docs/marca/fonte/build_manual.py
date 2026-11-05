#!/usr/bin/env python3
# Gera manual.html (manual de identidade visual do Elementum, A4 deitado).
import os

HERE = os.path.dirname(os.path.abspath(__file__))
DEFS = open(os.path.join(HERE, 'defs.svg.part')).read()

def rgb(h):
    h = h.lstrip('#')
    return ', '.join(str(int(h[i:i + 2], 16)) for i in (0, 2, 4))

TOTAL = 16
SECTIONS = {}

def page(n, section, body, cls=''):
    head = '' if 'cover' in cls else f'''
  <div class="ph"><span class="ph-mark"><svg viewBox="0 0 200 220"><use href="#crestSmall"/></svg>ELEMENTUM · MANUAL DA MARCA</span><span class="ph-sec">{section}</span></div>'''
    foot = '' if 'cover' in cls else f'''
  <div class="pf"><span>Versão 1.0 · novembro de 2026</span><span class="pf-n">{n:02d} / {TOTAL:02d}</span></div>'''
    return f'<section class="page {cls}">{head}\n  <div class="pc">{body}</div>{foot}\n</section>\n'

# ------------------------------------------------------------------ peças reutilizadas

LOCKUP = '''<svg viewBox="0 0 900 250" class="{cls}" role="img" aria-label="ELEMENTUM">
  <use href="#{crest}" x="0" y="8" width="210" height="231"/>
  <use href="#{word}" x="232" y="38" width="640" height="112"/>
  <text x="252" y="196" textLength="606" lengthAdjust="spacing" font-family="Barlow, sans-serif" font-weight="800" font-size="25" fill="{slogan}"{op}>DERRUBE · DOMINE · SOBREVIVA</text>
</svg>'''

def lockup(cls='', crest='crest', word='wordmark', slogan='#cfc8e6', op=''):
    return LOCKUP.format(cls=cls, crest=crest, word=word, slogan=slogan, op=op)

VERTICAL = '''<svg viewBox="0 0 640 450" class="{cls}" role="img" aria-label="ELEMENTUM vertical">
  <use href="#crest" x="220" y="0" width="200" height="220"/>
  <use href="#wordmark" x="0" y="250" width="640" height="112"/>
  <text x="30" y="420" textLength="590" lengthAdjust="spacing" font-family="Barlow, sans-serif" font-weight="800" font-size="25" fill="#cfc8e6">DERRUBE · DOMINE · SOBREVIVA</text>
</svg>'''

def crest(w, sym='crest', extra=''):
    h = round(w * 1.1)
    return f'<svg viewBox="0 0 200 220" width="{w}" height="{h}" {extra}><use href="#{sym}"/></svg>'

EXTRA_DEFS = '''<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <linearGradient id="gWin" x1="0" x2="1"><stop offset="0" stop-color="#ffd25a"/><stop offset="1" stop-color="#ff6a1f"/></linearGradient>
  <linearGradient id="gLose" x1="0" x2="1"><stop offset="0" stop-color="#ff8a8a"/><stop offset="1" stop-color="#e2364a"/></linearGradient>
</defs></svg>'''

def gtext(text, w, h, size, grad, cls='', anchor='start', weight=900):
    x = {'start': 4, 'middle': w / 2}[anchor]
    return (f'<svg viewBox="0 0 {w} {h}" class="{cls}" role="img" aria-label="{text}"><text x="{x}" y="{h * 0.8}" text-anchor="{anchor}" '
            f'font-family="Barlow, sans-serif" font-style="italic" font-weight="{weight}" font-size="{size}" fill="url(#{grad})" '
            f'stroke="#120c22" stroke-width="{max(1, size / 30):.1f}" paint-order="stroke">{text}</text></svg>')

def rules(items):
    return '<ul class="rules">' + ''.join(f'<li><b>{a}</b><span>{b}</span></li>' for a, b in items) + '</ul>'

pages = []

# ------------------------------------------------------------------ 1. capa
pages.append(page(1, '', f'''
  <div class="cover-glow"></div>
  <div class="cover-top"><span class="label">Manual de identidade visual</span><span class="label">v1.0 · 2026</span></div>
  <div class="cover-center">{VERTICAL.format(cls='cover-logo')}</div>
  <div class="cover-bottom">
    <div><b>Elementum</b><span>Jogo de luta com os quatro elementos</span></div>
    <div class="cover-dots"><i style="background:#4FD1B8"></i><i style="background:#FF6A1F"></i><i style="background:#9A6634"></i><i style="background:#2F86F0"></i></div>
    <div class="right"><b>jogaelementum.com.br</b><span>Referência para telas, site e materiais do jogo</span></div>
  </div>''', 'cover'))

# ------------------------------------------------------------------ 2. sumário e essência
toc = [
  ('01', 'A marca', 'Essência, logo principal e anatomia', '03'),
  ('02', 'Versões da logo', 'Horizontal, vertical, símbolo e reduzida', '05'),
  ('03', 'Construção', 'Área de proteção, proporções e tamanhos mínimos', '06'),
  ('04', 'Cores', 'Paleta oficial, degradê e proporção de uso', '08'),
  ('05', 'Tipografia', 'Família, hierarquia e exemplos', '10'),
  ('06', 'Aplicações', 'Fundo claro, monocromática e uso correto e incorreto', '11'),
  ('07', 'No jogo', 'Telas, componentes, vitória, derrota e ícones', '13'),
]
toc_html = ''.join(f'<li><span class="toc-n">{a}</span><div><b>{b}</b><span>{c}</span></div><span class="toc-p">{d}</span></li>' for a, b, c, d in toc)
pages.append(page(2, 'Sumário', f'''
  <div class="two">
    <div>
      <span class="kicker">Sumário</span>
      <h1 class="h1">O que tem neste manual</h1>
      <ol class="toc">{toc_html}</ol>
    </div>
    <div class="essence">
      <span class="kicker">Essência</span>
      <h2 class="h2">Quatro elementos, uma arena</h2>
      <p class="lead">O Elementum é um jogo de luta em que Fogo, Água, Terra e Ar se enfrentam para derrubar o adversário da arena. A marca junta a energia de um jogo competitivo com um toque de fantasia medieval.</p>
      <div class="ess-art">{crest(96)}<div><b>DERRUBE · DOMINE · SOBREVIVA</b><span>O slogan resume o jogo: tirar o outro da arena, controlar o espaço e continuar de pé.</span></div></div>
      <div class="pillars">
        <div><b>Competitivo</b><span>Brasão de campeonato, nome forte e inclinado para a frente.</span></div>
        <div><b>Estratégico</b><span>Quatro elementos em equilíbrio em volta de uma estrela central.</span></div>
        <div><b>Energético</b><span>Degradê quente para frio, do Fogo ao Ar.</span></div>
        <div><b>Sofisticado</b><span>Ouro metálico contido, fundos marinho e roxo profundo.</span></div>
      </div>
    </div>
  </div>'''))

# ------------------------------------------------------------------ 3. logo principal
pages.append(page(3, '01 · A marca', f'''
  <span class="kicker">01 · Logo principal</span>
  <h1 class="h1">A assinatura do jogo</h1>
  <div class="stage big">{lockup('lock-big')}</div>
  <div class="cols3 notes">
    <p><b>Use a versão horizontal sempre que couber.</b> Ela é a assinatura principal: telas iniciais, site, capas e banners.</p>
    <p><b>Símbolo, nome e slogan andam juntos</b> nesta posição. Não mude a ordem, os tamanhos entre eles nem o alinhamento.</p>
    <p><b>Fundo preferido:</b> azul-marinho ou roxo profundo, com no máximo uma luz ambiente suave atrás da logo.</p>
  </div>'''))

# ------------------------------------------------------------------ 4. anatomia
anat = [
  (98, 33, 'Joia', 'Azul, no centro da coroa.', 'l'),
  (128, 22, 'Coroa', 'Faz parte do contorno do escudo.', 'r'),
  (40, 100, 'Escudo', 'Ouro metálico com contorno escuro.', 'l'),
  (68, 86, 'Ar', 'Esfera verde-água, alto à esquerda.', 'l'),
  (132, 86, 'Fogo', 'Esfera laranja, alto à direita.', 'r'),
  (68, 150, 'Terra', 'Esfera marrom, embaixo à esquerda.', 'l'),
  (132, 150, 'Água', 'Esfera azul, embaixo à direita.', 'r'),
  (100, 118, 'Estrela', 'O centro: equilíbrio entre os quatro.', 'r'),
  (100, 182, 'Campo', 'Marinho com a luz de cada elemento.', 'l'),
]
labels = ''
for side in ('l', 'r'):
    items = [a for a in anat if a[4] == side]
    n = len(items)
    for i, (x, y, t, d, _) in enumerate(items):
        ly = 18 + i * (200 / max(1, n - 1))
        ax = -40 if side == 'l' else 240
        labels += f'<polyline points="{x},{y} {ax + (10 if side == 'l' else -10)},{ly} {ax},{ly}" class="lead-line"/><circle cx="{x}" cy="{y}" r="3" class="lead-dot"/>'
        anchor = 'end' if side == 'l' else 'start'
        tx = ax - 6 if side == 'l' else ax + 6
        labels += f'<text x="{tx}" y="{ly - 1}" text-anchor="{anchor}" class="an-t">{t}</text><text x="{tx}" y="{ly + 11}" text-anchor="{anchor}" class="an-d">{d}</text>'
pages.append(page(4, '01 · A marca', f'''
  <span class="kicker">01 · Anatomia do símbolo</span>
  <h1 class="h1">Cada peça tem um papel</h1>
  <div class="anat">
    <svg viewBox="-250 -6 700 236" class="anat-svg">
      <use href="#crest" x="0" y="0" width="200" height="220"/>
      {labels}
    </svg>
  </div>
  <p class="foot-note">A ordem das esferas é fixa: Ar e Fogo em cima, Terra e Água embaixo. As cores e os ícones de cada esfera nunca trocam de lugar.</p>'''))

# ------------------------------------------------------------------ 5. versões
pages.append(page(5, '02 · Versões da logo', f'''
  <span class="kicker">02 · Versões</span>
  <h1 class="h1">Uma marca, quatro formatos</h1>
  <div class="versions">
    <figure class="v-h"><div class="stage">{lockup('fill')}</div><figcaption><b>Horizontal</b> · principal. Telas iniciais, site, banners.</figcaption></figure>
    <figure class="v-v"><div class="stage">{VERTICAL.format(cls='fill')}</div><figcaption><b>Vertical</b> · tela de carregamento e espaços estreitos.</figcaption></figure>
    <figure class="v-s"><div class="stage center">{crest(140)}</div><figcaption><b>Símbolo</b> · ícone do app, avatar, selo.</figcaption></figure>
    <figure class="v-r"><div class="stage center"><div class="row-px">{crest(64, 'crestSmall')}{crest(32, 'crestSmall')}{crest(16, 'crestSmall')}</div></div><figcaption><b>Reduzida</b> · 32 px ou menos. Sem anel nem ícones.</figcaption></figure>
  </div>'''))

# ------------------------------------------------------------------ 6. área de proteção e proporções
# medidas da versão horizontal (unidades do desenho 900 × 250): X = altura das letras do nome
X = 76
pages.append(page(6, '03 · Construção', f'''
  <span class="kicker">03 · Área de proteção e proporções</span>
  <h1 class="h1">Medida base: X</h1>
  <div class="diagram">
    <svg viewBox="-150 -100 1210 440" class="diag-svg">
      <rect x="-{X}" y="{8 - X}" width="{900 + 2 * X}" height="{231 + 2 * X}" class="safe"/>
      <rect x="0" y="8" width="900" height="231" class="box"/>
      {lockup().replace('<svg viewBox="0 0 900 250" class="" role="img" aria-label="ELEMENTUM">', '<g>').replace('</svg>', '</g>')}
      <line x1="930" y1="56" x2="930" y2="132" class="dim"/><line x1="922" y1="56" x2="938" y2="56" class="dim"/><line x1="922" y1="132" x2="938" y2="132" class="dim"/>
      <line x1="872" y1="56" x2="922" y2="56" class="guide"/><line x1="872" y1="132" x2="922" y2="132" class="guide"/>
      <text x="946" y="104" class="dim-t">X</text>
      <line x1="-40" y1="8" x2="-40" y2="239" class="dim"/><line x1="-48" y1="8" x2="-32" y2="8" class="dim"/><line x1="-48" y1="239" x2="-32" y2="239" class="dim"/>
      <text x="-56" y="132" text-anchor="end" class="dim-t">3X</text>
      <line x1="210" y1="262" x2="250" y2="262" class="dim"/><line x1="210" y1="254" x2="210" y2="270" class="dim"/><line x1="250" y1="254" x2="250" y2="270" class="dim"/>
      <text x="230" y="292" text-anchor="middle" class="dim-t sm">0,5X</text>
      <line x1="930" y1="132" x2="930" y2="196" class="dim alt"/><line x1="922" y1="196" x2="938" y2="196" class="dim alt"/><line x1="858" y1="196" x2="922" y2="196" class="guide"/>
      <text x="946" y="172" class="dim-t sm alt">0,85X</text>
      <text x="{-X + 10}" y="{8 - X + 24}" class="dim-t sm safe-t">área de proteção = 1X em volta</text>
    </svg>
  </div>
  <dl class="specs specs3">
    <div><dt>X</dt><dd>Altura das letras de ELEMENTUM. É a unidade de todas as medidas.</dd></div>
    <div><dt>Proteção</dt><dd>1X livre em volta da logo, sem texto, borda ou outro desenho.</dd></div>
    <div><dt>Escudo</dt><dd>3X de altura, centralizado na altura do bloco de texto.</dd></div>
    <div><dt>Espaço</dt><dd>0,5X entre o escudo e o começo do nome.</dd></div>
    <div><dt>Slogan</dt><dd>Mesma largura do nome, com a linha de base 0,85X abaixo dele.</dd></div>
    <div><dt>Símbolo</dt><dd>Sozinho, deixe 1/4 da largura do escudo livre em volta.</dd></div>
  </dl>'''))

# ------------------------------------------------------------------ 7. tamanhos mínimos
pages.append(page(7, '03 · Construção', f'''
  <span class="kicker">03 · Tamanhos mínimos</span>
  <h1 class="h1">Legível em qualquer tamanho</h1>
  <div class="minsizes">
    <div class="ms"><div class="ms-art">{lockup('w160')}</div><b>Horizontal</b><span>Mínimo 160 px de largura (tela) · 40 mm (impresso). Abaixo disso, tire o slogan.</span></div>
    <div class="ms"><div class="ms-art">{VERTICAL.format(cls='w110')}</div><b>Vertical</b><span>Mínimo 110 px de largura (tela) · 28 mm (impresso).</span></div>
    <div class="ms"><div class="ms-art">{crest(48)}</div><b>Símbolo</b><span>Completo a partir de 48 px · 12 mm.</span></div>
    <div class="ms"><div class="ms-art">{crest(32, 'crestSmall')}{crest(16, 'crestSmall')}</div><b>Reduzida</b><span>De 16 a 47 px. Ícone da aba e atalhos.</span></div>
  </div>
  <table class="tbl">
    <thead><tr><th>Uso</th><th>Versão</th><th>Tamanho</th></tr></thead>
    <tbody>
      <tr><td>Aba do navegador (favicon)</td><td>Reduzida</td><td class="num">16 e 32 px</td></tr>
      <tr><td>Ícone do app / atalho no celular</td><td>Símbolo em quadrado arredondado</td><td class="num">180, 192 e 512 px</td></tr>
      <tr><td>Tela inicial do jogo</td><td>Horizontal</td><td class="num">40–55% da largura da tela</td></tr>
      <tr><td>Tela de carregamento</td><td>Vertical</td><td class="num">até 30% da altura da tela</td></tr>
      <tr><td>Placar e telas internas</td><td>Símbolo</td><td class="num">24–48 px</td></tr>
    </tbody>
  </table>'''))

# ------------------------------------------------------------------ 8. paleta
main = [
  ('Ouro', '#F2C440', 'Metal do escudo, destaques, vitória.'),
  ('Marinho', '#0B0A18', 'Fundo principal.'),
  ('Roxo profundo', '#1D1236', 'Fundo secundário, painéis.'),
  ('Tinta', '#120C22', 'Contornos da logo e do texto.'),
  ('Névoa', '#ECE8F6', 'Texto sobre fundo escuro.'),
  ('Papel', '#F3EEE5', 'Fundo claro.'),
]
elems = [
  ('Fogo', '#FF6A1F', '#FFC061', '#C8360E'),
  ('Água', '#2F86F0', '#9FDCFF', '#1748A8'),
  ('Terra', '#9A6634', '#E2B77A', '#5E3A1A'),
  ('Ar', '#4FD1B8', '#D9FFF4', '#1F8F7C'),
]
def sw(name, h, d, dark=False):
    return f'<div class="sw"><i style="background:{h}"></i><b>{name}</b><span class="code">{h} · RGB {rgb(h)}</span><span>{d}</span></div>'
main_html = ''.join(sw(*c) for c in main)
el_html = ''.join(f'''<div class="el"><div class="el-bar"><i style="background:{lt}"></i><i style="background:{h}"></i><i style="background:{dk}"></i></div><b>{n}</b><span class="code">{h} · RGB {rgb(h)}</span><span class="code dim2">claro {lt} · escuro {dk}</span></div>''' for n, h, lt, dk in elems)
pages.append(page(8, '04 · Cores', f'''
  <span class="kicker">04 · Paleta oficial</span>
  <h1 class="h1">Cores principais e elementais</h1>
  <div class="pal">{main_html}</div>
  <h3 class="h3">Cores dos elementos <span>(cor base, com o tom claro e o escuro usados no volume das esferas)</span></h3>
  <div class="els">{el_html}</div>'''))

# ------------------------------------------------------------------ 9. degradê e proporções
stops = [('0%', '#FFD84A'), ('26%', '#FF8F1F'), ('48%', '#FF4B4B'), ('74%', '#B65CFF'), ('100%', '#4F9BFF')]
golds = [('0%', '#FFF1B8'), ('22%', '#F6CF5A'), ('50%', '#D9A032'), ('62%', '#F3C75A'), ('100%', '#9A6416')]
def grad_bar(st, horiz=True):
    g = ', '.join(f'{c} {p}' for p, c in st)
    marks = ''.join(f'<div class="stop" style="left:{p}"><i style="background:{c}"></i><b>{p}</b><span>{c}</span><span class="dim2">{rgb(c)}</span></div>' for p, c in st)
    return f'<div class="gbar" style="background:linear-gradient(90deg,{g})"></div><div class="gstops">{marks}</div>'
secondary = [('Palco marinho', '#141634'), ('Campo do escudo', '#2C2A66'), ('Slogan', '#CFC8E6'), ('Texto apagado', '#9D97B8'), ('Joia', '#3FA9FF'), ('Derrota', '#E2364A')]
sec_html = ''.join(f'<div class="sec"><i style="background:{h}"></i><b>{n}</b><span class="code">{h}</span><span class="code dim2">{rgb(h)}</span></div>' for n, h in secondary)
pages.append(page(9, '04 · Cores', f'''
  <span class="kicker">04 · Degradês e proporção</span>
  <h1 class="h1">Do quente ao frio</h1>
  <h3 class="h3">Degradê do nome <span>(horizontal, da esquerda para a direita)</span></h3>
  {grad_bar(stops)}
  <h3 class="h3">Ouro metálico do escudo <span>(vertical, de cima para baixo: luz, reflexo e sombra)</span></h3>
  {grad_bar(golds)}
  <div class="two bottom">
    <div><h3 class="h3">Cores de apoio</h3><div class="secs">{sec_html}</div></div>
    <div>
      <h3 class="h3">Proporção de uso</h3>
      <div class="ratio"><i style="flex:60;background:#0B0A18"><b>60%</b>Marinho</i><i style="flex:25;background:#1D1236"><b>25%</b>Roxo</i><i style="flex:10;background:#F2C440;color:#120C22"><b>10%</b>Ouro</i><i style="flex:5;background:linear-gradient(90deg,#4FD1B8,#FF6A1F,#9A6634,#2F86F0)"><b>5%</b></i></div>
      <p class="small">Fundos escuros dominam. O ouro marca o que é importante (botão principal, vitória, seleção). As cores dos elementos aparecem só onde o elemento está: personagens, cartas e efeitos.</p>
    </div>
  </div>'''))

# ------------------------------------------------------------------ 10. tipografia
pages.append(page(10, '05 · Tipografia', f'''
  <span class="kicker">05 · Tipografia</span>
  <h1 class="h1">Barlow, do logo à interface</h1>
  <div class="two wide-left">
    <div class="type-hero">
      <div class="aa">{gtext("Aa", 170, 150, 128, "word")}</div>
      <div>
        <b class="tf">Barlow</b>
        <p class="small">Fonte usada no nome ELEMENTUM (Barlow Black Italic, peso 900) e no slogan (Barlow ExtraBold, 800). Família oficial da marca. Gratuita (Google Fonts, licença Open Font License).</p>
        <p class="glyphs">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz<br>0123456789 · %&amp;!?</p>
        <p class="small dim2">Alternativas compatíveis, se a Barlow não estiver disponível: Barlow Condensed, Saira ou Rajdhani (mesmo estilo esportivo); no sistema, Arial Narrow em negrito.</p>
      </div>
    </div>
    <table class="tbl type-tbl">
      <thead><tr><th>Nível</th><th>Estilo</th><th>Tamanho</th></tr></thead>
      <tbody>
        <tr><td>{gtext("VITÓRIA!", 190, 46, 38, "gWin", "t-d-svg")}</td><td>Black Italic 900, caixa alta</td><td class="num">72–124 px</td></tr>
        <tr><td><span class="t-h1">Escolha o modo</span></td><td>Black Italic 900</td><td class="num">32–44 px</td></tr>
        <tr><td><span class="t-h2">Rei da Ilha</span></td><td>ExtraBold Italic 800</td><td class="num">20–28 px</td></tr>
        <tr><td><span class="t-lb">PASSO 1 DE 4</span></td><td>Bold 700, caixa alta, espaço 0,3em</td><td class="num">11–13 px</td></tr>
        <tr><td><span class="t-b">Fique na área brilhante.</span></td><td>Medium 500</td><td class="num">14–16 px</td></tr>
        <tr><td><span class="t-n">60 · 2:46 · 39%</span></td><td>SemiBold 600, números alinhados</td><td class="num">14–44 px</td></tr>
      </tbody>
    </table>
  </div>
  <p class="foot-note">Hoje o jogo usa a fonte do sistema na interface. Ao atualizar as telas, troque pela Barlow seguindo esta tabela; o nome ELEMENTUM continua sendo sempre o desenho da logo, e nunca texto digitado.</p>'''))

# ------------------------------------------------------------------ 11. fundo claro e monocromática
OP = ' opacity=".8"'
mono = ''.join(f'<div class="mono {c}">{lockup("fill", "crestMono", "wordmarkMono", "currentColor", OP)}<span>{t}</span></div>' for c, t in [('m-white', 'Branca · sobre fundo escuro'), ('m-ink', 'Preta · sobre fundo claro'), ('m-gold', 'Dourada · gravação e selos')])
pages.append(page(11, '06 · Aplicações', f'''
  <span class="kicker">06 · Fundo claro e uma cor</span>
  <h1 class="h1">Quando o fundo muda</h1>
  <div class="paper-box">{lockup('fill', slogan='#3a3150')}</div>
  <p class="small">Em fundo claro, a logo colorida mantém o contorno escuro em volta do nome e do escudo, e o slogan passa para tinta (#3A3150).</p>
  <div class="monos">{mono}</div>'''))

# ------------------------------------------------------------------ 12. uso correto e incorreto
def ex(content, ok, t, bg='dark'):
    mark = '<span class="ok">✓</span>' if ok else '<span class="no">✕</span>'
    return f'<figure class="ex {bg}"><div class="ex-art">{content}</div><figcaption>{mark}{t}</figcaption></figure>'
L = lockup('fill')
wrong_font = '''<svg viewBox="0 0 900 250" class="fill"><use href="#crest" x="0" y="8" width="210" height="231"/><text x="252" y="135" font-family="Georgia, serif" font-size="96" fill="url(#word)">Elementum</text></svg>'''
swap = '''<svg viewBox="0 0 900 250" class="fill"><use href="#wordmark" x="0" y="38" width="640" height="112"/><use href="#crest" x="690" y="8" width="210" height="231"/></svg>'''
examples = ''.join([
  ex(L, True, 'Fundo escuro marinho ou roxo'),
  ex(lockup('fill', slogan='#3a3150'), True, 'Fundo claro, slogan em tinta', 'paper'),
  ex(lockup('fill', 'crestMono', 'wordmarkMono', 'currentColor', OP), True, 'Monocromática em uma cor', 'mono-w'),
  ex(f'<div style="transform:scaleX(1.45) scaleY(.75)">{L}</div>', False, 'Esticar ou achatar'),
  ex(f'<div style="filter:hue-rotate(150deg) saturate(1.4)">{L}</div>', False, 'Trocar as cores'),
  ex(swap, False, 'Mudar a posição do escudo'),
  ex(f'<div style="filter:drop-shadow(0 0 10px #39ff14) drop-shadow(0 0 22px #39ff14)">{L}</div>', False, 'Brilho neon e efeitos'),
  ex(wrong_font, False, 'Trocar a fonte do nome'),
  ex(L, False, 'Fundo agitado ou sem contraste', 'busy'),
])
pages.append(page(12, '06 · Aplicações', f'''
  <span class="kicker">06 · Uso correto e incorreto</span>
  <h1 class="h1">Faça e não faça</h1>
  <div class="exs">{examples}</div>'''))

# ------------------------------------------------------------------ 13. no jogo: tela inicial e carregamento
home = f'''<div class="scr scr-home">
  <div class="scr-bg"></div>
  <div class="home-left">{lockup('home-logo')}
    <div class="home-menu"><div class="hm on">JOGAR</div><div class="hm">TUTORIAL</div><div class="hm">CONTROLES</div><div class="hm">CONFIGURAÇÕES</div></div>
  </div>
  <div class="home-badge">● PARTIDA DE DEMONSTRAÇÃO</div>
</div>'''
loading = f'''<div class="scr scr-load">
  <div class="load-center">{VERTICAL.format(cls='load-logo')}
    <div class="load-bar"><i style="width:64%"></i></div>
    <div class="load-t">Carregando a arena… 64%</div>
    <div class="load-tip"><b>DICA</b> O Fogo atravessa a lava sem se queimar, mas cai fora na água.</div>
  </div>
</div>'''
pages.append(page(13, '07 · No jogo', f'''
  <span class="kicker">07 · Identidade no jogo</span>
  <h1 class="h1">Tela inicial e carregamento</h1>
  <div class="scrs">
    <figure>{home}<figcaption><b>Tela inicial.</b> Logo horizontal no alto à esquerda, menu em itálico com a opção escolhida numa faixa laranja; partida de demonstração escurecida ao fundo.</figcaption>{rules([('Logo', 'Horizontal, 40–55% da largura, com 1X de proteção.'), ('Fundo', 'A partida de demonstração com véu marinho da esquerda para a direita.'), ('Menu', 'Barlow Black Italic; escolhido em faixa laranja inclinada.'), ('Selo', '“Partida de demonstração” em pílula escura, canto superior direito.')])}</figure>
    <figure>{loading}<figcaption><b>Carregamento.</b> Logo vertical no centro, barra de progresso em ouro e uma dica do jogo embaixo.</figcaption>{rules([('Logo', 'Vertical, até 30% da altura da tela.'), ('Barra', 'Ouro (degradê do escudo) sobre trilho translúcido.'), ('Dica', 'Rótulo DICA em ouro; texto em névoa, no máximo 2 linhas.'), ('Fundo', 'Marinho com luz roxa suave atrás da logo.')])}</figure>
  </div>'''))

# ------------------------------------------------------------------ 14. menu e componentes
modes = ''.join(f'<div class="mt{" on" if i == 1 else ""}"><div class="mt-art" style="background:{bg}"></div><b>{t}</b><span>{d}</span></div>' for i, (t, d, bg) in enumerate([
  ('1 × 1', 'Duelo', 'linear-gradient(135deg,#3a1a10,#102040)'),
  ('2 × 2', 'Você + 1 aliado', 'linear-gradient(135deg,#40180c,#0c2a50)'),
  ('REI DA ILHA', 'Fique na área', 'radial-gradient(circle at 50% 70%,#6a5420,#1a1424)'),
  ('TREINO', 'Teste golpes', 'linear-gradient(135deg,#1f3a2a,#0e1a14)'),
]))
menu = f'''<div class="scr scr-menu">
  <div class="mn-head"><span class="mn-back">‹ Voltar</span><div><span class="mn-step">PASSO 1 DE 4</span><b class="mn-title">ESCOLHA O MODO</b></div></div>
  <div class="mn-tiles">{modes}</div>
</div>'''
comps = '''<div class="comps">
  <div class="cg"><span class="cg-l">Botão principal</span><button class="b-fight">LUTAR</button></div>
  <div class="cg"><span class="cg-l">Botão de avançar</span><button class="b-go">CONTINUAR ›</button></div>
  <div class="cg"><span class="cg-l">Botão secundário</span><button class="b-ghost">MENU</button></div>
  <div class="cg"><span class="cg-l">Seleção</span><div class="seg"><span>Fácil</span><span class="on">Normal</span><span>Difícil</span></div></div>
  <div class="cg"><span class="cg-l">Placar do jogador</span><div class="hud"><i></i><div><b>Jogador (você)</b><span>FOGO · ●●●</span></div><em>39%</em></div></div>
  <div class="cg"><span class="cg-l">Etiquetas</span><div class="tags"><span class="tg win">VENCEDOR</span><span class="tg">BOT</span><span class="tg you">VOCÊ</span><span class="tg mvp">MVP</span></div></div>
</div>'''
pages.append(page(14, '07 · No jogo', f'''
  <span class="kicker">07 · Identidade no jogo</span>
  <h1 class="h1">Menu e componentes</h1>
  <div class="scrs">
    <figure>{menu}<figcaption><b>Menu de modos.</b> Cartões escuros com borda fina; o escolhido sobe e ganha borda dourada.</figcaption>{rules([('Cabeçalho', 'Botão Voltar inclinado, passo em caixa alta e título em Black Italic.'), ('Cartões', 'Mesma altura e borda; cada modo com a sua arte.'), ('Seleção', 'Sobe 6 px, borda ouro e brilho dourado discreto.'), ('Modos especiais', 'Rei da Ilha em tom dourado, Treino em tom verde.')])}</figure>
    <figure class="comp-fig">{comps}<figcaption><b>Componentes.</b> Laranja para a ação principal, ouro para avançar e seleção, contorno fino para o resto.</figcaption>{rules([('Ação principal', 'Um só por tela (LUTAR, JOGAR DE NOVO).'), ('Inclinação', 'Botões e seleções inclinados de 8° a 12°, como o nome.'), ('Placar', 'Borda branca no jogador local; cor do elemento no fundo.'), ('Etiquetas', 'Pílulas pequenas; ouro só para VENCEDOR.')])}</figure>
  </div>'''))

# ------------------------------------------------------------------ 15. vitória e derrota
def result(win):
    title = 'VITÓRIA!' if win else 'DERROTA'
    cls = 'win' if win else 'lose'
    sub = 'Time Dourado chegou a 60 pontos na ilha (Dourado 60 × Violeta 41).' if win else 'Time Violeta eliminou o adversário.'
    cards = ''.join(f'<div class="rc{" w" if (win and i < 2) or (not win and i >= 2) else ""}" style="--t:{c}"><b>{n}</b><span>{e}</span><div class="rs"><i>{k}</i><i>{m}</i><i>{d}</i></div></div>' for i, (n, e, c, k, m, d) in enumerate([
        ('Jogador', 'Fogo', '#FFD23F', 4, 1, 239), ('Brasa', 'Fogo', '#FFD23F', 2, 2, 170), ('Gota', 'Água', '#D65BFF', 1, 4, 120), ('Onda', 'Água', '#D65BFF', 2, 3, 151)]))
    return f'''<div class="scr scr-res {cls}">
  <div class="res-in">
    <span class="res-eye">FIM DE PARTIDA · CASTELO DO REI · 2:19</span>
    {gtext(title, 300, 64, 54, 'gWin' if win else 'gLose', 'res-title-svg', 'middle')}
    <span class="res-sub">{sub}</span>
    <div class="res-cards">{cards}</div>
    <div class="res-btns"><span class="b-fight sm">JOGAR DE NOVO</span><span class="b-ghost sm">MENU</span></div>
  </div>
  {crest(70, extra='class="res-crest"') if win else ''}
</div>'''
pages.append(page(15, '07 · No jogo', f'''
  <span class="kicker">07 · Identidade no jogo</span>
  <h1 class="h1">Vitória e derrota</h1>
  <div class="scrs">
    <figure>{result(True)}<figcaption><b>Vitória.</b> Título no degradê dourado-laranja do nome, luz quente no alto e o brasão como selo de campeão.</figcaption>{rules([('Título', 'VITÓRIA! em Black Italic, degradê #FFD25A → #FF6A1F.'), ('Cartões', 'Vencedores primeiro, com borda dourada e a cor do time na lateral.'), ('Selo', 'Símbolo completo no canto, só na vitória.'), ('Som', 'Fanfarra curta; animação de vitória do elemento antes da tela.')])}</figure>
    <figure>{result(False)}<figcaption><b>Derrota.</b> Mesma estrutura, título em vermelho (#E2364A) e luz fria; sem o brasão.</figcaption>{rules([('Título', 'DERROTA em Black Italic, degradê #FF8A8A → #E2364A.'), ('Clima', 'Luz azul fria no alto, em vez da quente.'), ('Tom', 'Frase curta e neutra explicando o que aconteceu.'), ('Próximo passo', 'JOGAR DE NOVO sempre como ação principal.')])}</figure>
  </div>'''))

# ------------------------------------------------------------------ 16. ícones
ICONS = [
  ('Voltar', '<path d="M15 5 L8 12 L15 19"/>'),
  ('Pausar', '<path d="M9 5 V19 M15 5 V19"/>'),
  ('Jogar', '<path d="M8 5 L19 12 L8 19Z" class="f"/>'),
  ('Som', '<path d="M4 9 H8 L13 5 V19 L8 15 H4Z" class="f"/><path d="M16 9 C18 11 18 13 16 15 M18.5 6.5 C22 10 22 14 18.5 17.5"/>'),
  ('Configurações', '<path d="M4 7 H20 M4 12 H20 M4 17 H20"/><circle cx="9" cy="7" r="2" class="f"/><circle cx="15" cy="12" r="2" class="f"/><circle cx="7" cy="17" r="2" class="f"/>'),
  ('Controle', '<path d="M6 8 H18 C21 8 22 17 19 17 C17 17 16 14 14 14 H10 C8 14 7 17 5 17 C2 17 3 8 6 8Z"/><path d="M8 10 V13 M6.5 11.5 H9.5"/><circle cx="16" cy="11" r=".8" class="f"/><circle cx="17.5" cy="12.5" r=".8" class="f"/>'),
  ('Placar', '<path d="M5 19 V11 M12 19 V5 M19 19 V14"/>'),
  ('Troféu', '<path d="M7 4 H17 V9 C17 12 15 14 12 14 C9 14 7 12 7 9Z"/><path d="M7 6 H4 C4 9 5 10 7 10 M17 6 H20 C20 9 19 10 17 10 M12 14 V17 M8 20 H16 L15 17 H9Z"/>'),
  ('Coroa (Rei da Ilha)', '<path d="M4 17 L3 7 L8 11 L12 5 L16 11 L21 7 L20 17Z"/><path d="M4 20 H20"/>'),
  ('Perfil', '<circle cx="12" cy="8" r="4"/><path d="M4 20 C5 15 8 13 12 13 C16 13 19 15 20 20"/>'),
  ('Fechar', '<path d="M6 6 L18 18 M18 6 L6 18"/>'),
  ('Vidas', '<circle cx="6" cy="12" r="2.5" class="f"/><circle cx="12" cy="12" r="2.5" class="f"/><circle cx="18" cy="12" r="2.5" class="f"/>'),
]
icons = ''.join(f'<div class="ic"><div class="ic-box"><svg viewBox="0 0 24 24">{p}</svg></div><div class="ic-box on"><svg viewBox="0 0 24 24">{p}</svg></div><span>{n}</span></div>' for n, p in ICONS)
AR_ATTR = 'fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"'
WH_ATTR = 'fill="#fff"'
orbs = ''.join(f'<div class="orb-i"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="url(#o{k})" stroke="#120C22" stroke-width="3"/><use href="#i{k}" transform="translate(20 21)" {AR_ATTR if k == "Ar" else WH_ATTR}/></svg><span>{n}</span></div>' for k, n in [('Fogo', 'Fogo'), ('Agua', 'Água'), ('Terra', 'Terra'), ('Ar', 'Ar')])
pages.append(page(16, '07 · No jogo', f'''
  <span class="kicker">07 · Ícones e navegação</span>
  <h1 class="h1">Traço simples, ponta redonda</h1>
  <div class="two wide-left">
    <div>
      <div class="icons">{icons}</div>
      <p class="small">Grade de 24 × 24, traço de 2 px com pontas e cantos redondos. Normal em névoa (#ECE8F6); escolhido ou em foco em ouro, com fundo roxo profundo.</p>
      <h3 class="h3">Na partida</h3>
      <div class="topbar">
        <div class="tb-l">{crest(22, 'crestSmall')}<span>REI DA ILHA · CASTELO DO REI</span></div>
        <div class="tb-c">2:46</div>
        <div class="tb-r"><span class="tb-i"><svg viewBox="0 0 24 24"><path d="M5 19 V11 M12 19 V5 M19 19 V14"/></svg></span><span class="tb-i"><svg viewBox="0 0 24 24"><path d="M4 9 H8 L13 5 V19 L8 15 H4Z" class="f"/><path d="M16 9 C18 11 18 13 16 15"/></svg></span><span class="tb-i on"><svg viewBox="0 0 24 24"><path d="M9 5 V19 M15 5 V19"/></svg></span></div>
      </div>
      <p class="small">Ícones de navegação ficam no canto superior direito, em caixas de 42 px; o ícone em uso fica em ouro.</p>
    </div>
    <div>
      <h3 class="h3">Esferas dos elementos</h3>
      <div class="orbs">{orbs}</div>
      <p class="small">As esferas do brasão também servem de ícone de cada elemento: cartas, placar e filtros. Sempre com o contorno em tinta e o ícone branco.</p>
      <div class="checklist">
        <b>Antes de publicar uma tela nova</b>
        <span>□ Fundo marinho ou roxo profundo</span>
        <span>□ Ouro só no que é importante</span>
        <span>□ Títulos em Barlow Black Italic</span>
        <span>□ Logo com área de proteção de 1X</span>
        <span>□ Cores dos elementos só onde o elemento está</span>
      </div>
    </div>
  </div>'''))

CSS = open(os.path.join(HERE, 'manual.css')).read()
html = f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Manual da marca Elementum</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700;1,800;1,900&display=swap">
<style>{CSS}</style></head><body>
{DEFS}
{EXTRA_DEFS}
{''.join(pages)}
</body></html>'''
open(os.path.join(HERE, 'manual.html'), 'w').write(html)
print('ok', len(pages), 'páginas')
