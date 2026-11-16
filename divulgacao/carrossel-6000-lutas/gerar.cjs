// Carrossel "6.000 lutas": capa + um slide por mapa (1080x1350, 4:5)
const { chromium } = require('playwright'); const fs = require('fs');
const SP = __dirname;
const EST = '/home/user/jogo/divulgacao/estatisticas';
const OUT = '/home/user/jogo/divulgacao/carrossel-6000-lutas';
fs.mkdirSync(OUT, { recursive: true });
const MAPS = [['caldeira', 'Caldeira'], ['pico', 'Pico dos Ventos'], ['campo', 'Campo'], ['gelo', 'Lago Congelado'], ['coliseu', 'Coliseu'], ['navio', 'Navio Voador']];
const data = Object.fromEntries(MAPS.map(([m]) => [m, JSON.parse(fs.readFileSync(`${EST}/resultado-${m}.json`))]));
const bgs = Object.fromEntries(MAPS.map(([m]) => [m, 'data:image/png;base64,' + fs.readFileSync(`${SP}/bg-${m}.png`).toString('base64')]));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await p.goto('http://localhost:3996/'); await p.waitForTimeout(400);
  await p.evaluate(() => { document.head.insertAdjacentHTML('beforeend', '<style>body{margin:0}</style>'); });
  const shoot = async (file, html, args) => {
    await p.evaluate(async ({ html, args }) => {
      document.body.innerHTML = html;
      const { drawPortrait } = await import('/js/render/portrait.js');
      for (const c of document.querySelectorAll('canvas[data-el]')) {
        const r = c.getBoundingClientRect();
        c.width = r.width * 2; c.height = r.height * 2;
        const ctx = c.getContext('2d'); ctx.scale(2, 2);
        const s = Number(c.dataset.s || 1);
        drawPortrait(ctx, c.dataset.el, r.width / 2, r.height - 4, s * (c.dataset.el === 'mortal' ? 1.15 : 1), { facing: c.dataset.flip ? -1 : 1, time: Number(c.dataset.t || 0) });
      }
    }, { html, args });
    await p.waitForTimeout(150);
    await p.screenshot({ path: `${OUT}/${file}` });
  };

  // paleta validada (dataviz: CVD ΔE 8.7, visão normal ΔE 20.1 no fundo #140a20)
  const COL = { fogo: '#ff7f2a', agua: '#2f7dff', terra: '#80511f', ar: '#5fe6c8', mortal: '#d0b8ff' };
  const NAME = { fogo: 'Fogo', agua: 'Água', terra: 'Terra', ar: 'Ar', mortal: 'Mortal' };
  const FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";
  const INK = '#f4effa';
  const MUTED = '#b9b0cc';
  const GOLD = '#ffd25a';
  const frame = (inner, bg, fade = 0.55) => `<div style="position:fixed;inset:0;width:1080px;height:1350px;overflow:hidden;font-family:${FONT};background:#140a20;color:${INK}">
    ${bg ? `<div style="position:absolute;inset:0 0 auto 0;height:520px;background:url(${bg}) 50% 55%/cover"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,10,32,${fade}) 0px,rgba(20,10,32,.92) 330px,#140a20 470px)"></div>` : ''}
    ${inner}
    <div style="position:absolute;left:56px;right:56px;bottom:34px;display:flex;justify-content:space-between;font:600 21px ${FONT};color:${MUTED}"><span>jogaelementum.com.br</span><span>@jogaelementum</span></div>
  </div>`;
  const pill = (t) => `<span style="display:inline-block;padding:7px 16px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);font:700 20px ${FONT};letter-spacing:.06em;color:${INK}">${t}</span>`;

  // ---------------------------------------------------------------- capa
  const example = { a: 'fogo', b: 'agua', x: 53 };
  const cover = frame(`
    <div style="position:absolute;top:60px;left:56px;right:56px">
      <div style="display:flex;justify-content:space-between;align-items:center">${pill('ELEMENTUM · ESTATÍSTICAS')}<span style="font:700 22px ${FONT};color:${MUTED}">1/8</span></div>
      <div style="margin-top:56px;font:800 30px ${FONT};letter-spacing:.2em;color:${GOLD}">SIMULEI</div>
      <div style="font:italic 900 150px/0.92 ${FONT};letter-spacing:-.03em;margin-top:6px">6.000<br>LUTAS</div>
      <div style="font:700 40px/1.25 ${FONT};margin-top:26px;max-width:880px">Quem ganha de quem em cada mapa?</div>
      <div style="font:500 26px/1.45 ${FONT};color:${MUTED};margin-top:14px;max-width:900px">Cada dupla lutou <b style="color:${INK}">100 vezes</b> em cada um dos 6 mapas (50 de cada lado). Bots no nível mais difícil, 3 vidas.</div>
    </div>
    <div style="position:absolute;top:150px;right:40px;width:470px;height:360px">
      <canvas data-el="ar" data-s="1.7" data-t="0.3" style="position:absolute;left:250px;top:0;width:200px;height:190px"></canvas>
      <canvas data-el="agua" data-s="1.7" data-t="0.9" style="position:absolute;left:40px;top:10px;width:200px;height:190px"></canvas>
      <canvas data-el="mortal" data-s="1.7" data-t="1.5" data-flip="1" style="position:absolute;left:290px;top:160px;width:200px;height:190px"></canvas>
      <canvas data-el="terra" data-s="1.7" data-t="2.1" style="position:absolute;left:150px;top:150px;width:200px;height:200px"></canvas>
      <canvas data-el="fogo" data-s="1.7" data-t="2.7" style="position:absolute;left:0;top:165px;width:200px;height:190px"></canvas>
    </div>
    <div style="position:absolute;top:735px;left:56px;right:56px;padding:30px 32px 34px;border-radius:24px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12)">
      <div style="font:800 22px ${FONT};letter-spacing:.18em;color:${GOLD};margin-bottom:22px">COMO LER</div>
      ${barRow(example.a, example.b, example.x, true)}
      <div style="display:flex;justify-content:space-between;margin-top:16px;font:500 23px/1.35 ${FONT};color:${MUTED}">
        <span style="max-width:430px">O <b style="color:${INK}">Fogo</b> venceu <b style="color:${INK}">53 de 100</b> lutas contra a Água</span>
        <span style="max-width:330px;text-align:right">A Água venceu as outras <b style="color:${INK}">47</b></span>
      </div>
    </div>
    <div style="position:absolute;top:1110px;left:56px;right:56px;display:flex;justify-content:space-between;align-items:center">
      <span style="font:600 26px/1.35 ${FONT};color:${INK};max-width:640px">Em um dos mapas, um personagem venceu <b style="color:${GOLD}">92 de 100</b> lutas…</span>
      <span style="font:800 30px ${FONT};color:${GOLD};white-space:nowrap">Arrasta →</span>
    </div>`, null);

  function barRow(a, b, x, big = false) {
    const y = 100 - x;
    const h = big ? 64 : 46;
    const win = x > y ? 'a' : y > x ? 'b' : null;
    // número escuro nas barras claras (Ar, Mortal) e branco nas escuras
    const LIGHT = { ar: true, mortal: true };
    const val = (v, w, el) => `<span style="font:${w ? 900 : 700} ${big ? 34 : 26}px ${FONT};color:${LIGHT[el] ? '#140a20' : '#fff'}">${v}%</span>`;
    const label = (el, side) => `<div style="display:flex;align-items:center;gap:8px;width:${big ? 190 : 168}px;${side === 'r' ? 'flex-direction:row-reverse;' : ''}">
        <canvas data-el="${el}" ${side === 'r' ? 'data-flip="1"' : ''} data-s="${big ? 0.95 : 0.72}" style="width:${big ? 100 : 80}px;height:${big ? 100 : 80}px;flex:none;margin:${big ? '-14px -20px' : '-14px -17px'}"></canvas>
        <span style="font:800 ${big ? 28 : 23}px ${FONT};color:${INK};${side === 'r' ? 'text-align:right;' : ''}">${NAME[el]}</span></div>`;
    return `<div style="display:flex;align-items:center;gap:14px">
      ${label(a, 'l')}
      <div style="flex:1;display:flex;gap:3px;height:${h}px">
        <div style="flex:${x} 0 0;min-width:70px;background:${COL[a]};border-radius:${h / 2}px 6px 6px ${h / 2}px;display:flex;align-items:center;padding-left:16px;${win === 'a' ? `box-shadow:0 0 0 3px ${GOLD} inset` : ''}">${val(x, win === 'a', a)}</div>
        <div style="flex:${y} 0 0;min-width:70px;background:${COL[b]};border-radius:6px ${h / 2}px ${h / 2}px 6px;display:flex;align-items:center;justify-content:flex-end;padding-right:16px;${win === 'b' ? `box-shadow:0 0 0 3px ${GOLD} inset` : ''}">${val(y, win === 'b', b)}</div>
      </div>
      ${label(b, 'r')}
    </div>`;
  }

  await shoot('1-capa.png', cover);

  // ---------------------------------------------------------------- mapas
  let n = 2;
  for (const [m, title] of MAPS) {
    const d = data[m];
    const rows = d.duplas.map((r) => {
      const total = r.vitoriasA + r.vitoriasB || 1;
      const x = Math.round((r.vitoriasA / total) * 100);
      return { a: r.a, b: r.b, x };
    }).sort((p1, p2) => Math.abs(p2.x - 50) - Math.abs(p1.x - 50));
    const tot = {};
    for (const r of d.duplas) { tot[r.a] = (tot[r.a] || 0) + r.vitoriasA; tot[r.b] = (tot[r.b] || 0) + r.vitoriasB; }
    const rank = Object.entries(tot).map(([k, v]) => [k, Math.round(v / 4)]).sort((p1, p2) => p2[1] - p1[1]);
    const [bestEl, bestPct] = rank[0];
    const html = frame(`
      <div style="position:absolute;top:56px;left:56px;right:56px">
        <div style="display:flex;justify-content:space-between;align-items:center">${pill('MAPA')}<span style="font:700 22px ${FONT};color:${MUTED}">${n}/8</span></div>
        <div style="font:italic 900 92px/1 ${FONT};letter-spacing:-.02em;margin-top:22px;text-shadow:0 4px 18px rgba(0,0,0,.6)">${title.toUpperCase()}</div>
      </div>
      <div style="position:absolute;top:250px;left:56px;right:56px;display:flex;align-items:center;gap:20px;padding:18px 26px;border-radius:22px;background:rgba(20,10,32,.78);border:1px solid rgba(255,210,90,.45)">
        <canvas data-el="${bestEl}" data-s="1.25" style="width:140px;height:130px;flex:none;margin:-20px -30px -14px -34px"></canvas>
        <div style="flex:1"><div style="font:800 20px ${FONT};letter-spacing:.18em;color:${GOLD}">MAIS FORTE AQUI</div>
          <div style="font:italic 900 52px/1.05 ${FONT}">${NAME[bestEl].toUpperCase()}</div></div>
        <div style="text-align:right"><div style="font:900 64px/1 ${FONT}">${bestPct}%</div><div style="font:600 20px ${FONT};color:${MUTED}">das lutas vencidas</div></div>
      </div>
      <div style="position:absolute;top:410px;left:56px;right:56px;display:grid;gap:22px">${rows.map((r) => barRow(r.a, r.b, r.x)).join('')}</div>
      <div style="position:absolute;top:1218px;left:56px;right:56px;font:600 21px ${FONT};color:${MUTED}">Ranking: ${rank.map(([k, v], i) => `<b style="color:${i === 0 ? GOLD : INK}">${i + 1}º ${NAME[k]}</b> ${v}%`).join(' · ')}</div>`, bgs[m]);
    await shoot(`${n}-${m}.png`, html);
    n++;
  }

  // ---------------------------------------------------------------- final
  const crest = fs.readFileSync(SP + '/crest.svg', 'utf8').replace('<svg', '<svg width="100%" height="100%"');
  const step = (num, icon, title, sub) => `<div style="display:flex;align-items:center;gap:24px;padding:22px 28px;border-radius:22px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12)">
      <div style="width:64px;height:64px;flex:none;border-radius:50%;background:${GOLD};color:#140a20;display:grid;place-items:center;font:900 34px ${FONT}">${num}</div>
      <div style="flex:1"><div style="font:800 36px/1.15 ${FONT}">${title}</div><div style="font:500 23px/1.35 ${FONT};color:${MUTED};margin-top:4px">${sub}</div></div>
      <div style="width:56px;height:56px;flex:none;color:${INK}">${icon}</div>
    </div>`;
  const svg = (d) => `<svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const heart = svg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>');
  const person = svg('<path d="M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/><path d="M3.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5"/><path d="M19 8v6M16 11h6"/>');
  const pad = svg('<path d="M7.5 8h9a4 4 0 0 1 3.9 3.2l1 5a2.2 2.2 0 0 1-3.8 1.9L15.5 16h-7l-2.1 2.1a2.2 2.2 0 0 1-3.8-1.9l1-5A4 4 0 0 1 7.5 8z"/><path d="M8 10.5v3M6.5 12h3"/>');
  const finalHtml = frame(`
    <div style="position:absolute;top:60px;left:56px;right:56px">
      <div style="display:flex;justify-content:space-between;align-items:center">${pill('ELEMENTUM')}<span style="font:700 22px ${FONT};color:${MUTED}">8/8</span></div>
      <div style="font:700 34px/1.3 ${FONT};margin-top:56px;color:${MUTED};max-width:600px">Agora você já sabe o <b style="color:${INK}">melhor personagem</b> pra cada mapa.</div>
      <div style="font:italic 900 120px/0.95 ${FONT};letter-spacing:-.03em;margin-top:22px">BORA<br>PROVAR?</div>
    </div>
    <div style="position:absolute;top:175px;right:50px;width:300px;height:330px;filter:drop-shadow(0 18px 30px rgba(0,0,0,.55))">${crest}</div>
    <div style="position:absolute;top:560px;left:56px;right:56px;display:grid;gap:18px">
      ${step(1, heart, 'Curte', 'Ajuda o post a chegar em mais gente')}
      ${step(2, person, 'Segue @jogaelementum', 'Vem mais estatística, luta e novidade')}
      ${step(3, pad, 'Joga de graça', 'No navegador, no PC ou no celular')}
    </div>
    <div style="position:absolute;top:1040px;left:56px;right:56px;padding:30px 20px;border-radius:26px;background:linear-gradient(90deg,#ff6a1f,#ffb03a);text-align:center;box-shadow:0 14px 40px rgba(255,106,31,.35)">
      <div style="font:800 22px ${FONT};letter-spacing:.2em;color:#3a1500">JOGUE EM</div>
      <div style="font:900 66px/1.05 ${FONT};color:#1a0a00;margin-top:6px">jogaelementum.com.br</div>
    </div>`, null);
  await shoot('8-final.png', finalHtml);
  await b.close();
})();
