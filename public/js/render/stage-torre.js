// Cenário da Torre dos Elementos (modo Torre). O andar (map.towerFloor) muda
// a vista em 5 fases: dia (0–10), entardecer (11–20), noite (21–40), quase
// no espaço (41–50) e espaço (51+). Ver "fases do céu" abaixo.
//
//   campo    o topo da torre com ameias, sacadas de madeira, o patamar de
//            pedra com a runa dos 4 elementos e uma faixa com o número do andar
//
// Mesmo formato dos outros cenários (ver stage.js).

import { roundRect, seeded, ridgeLine, glowSprite } from './stage-util.js';

const INK = '#1a1222';
const STONE = { top: '#d9cbb4', light: '#bfae94', mid: '#9c8b74', dark: '#75675a', deep: '#4f453d', mortar: '#3b322c' };
const WOOD = { light: '#c98b52', mid: '#9c6635', dark: '#6b4322', deep: '#432a16' };
const EL = { fogo: '#ff6a1f', agua: '#2f8cff', terra: '#b07a40', ar: '#4fd1b8' };

const floorOf = (o) => Math.max(0, o?.towerFloor ?? o?.floor ?? 0);

// ================================================================ fases do céu
//
//   0–10   dia        campos, vila e árvores; o chão vai descendo e as
//                     nuvens chegam perto do andar 10
//   11–20  entardecer sol baixo e laranja, mar de nuvens cor-de-rosa
//   21–40  noite      lua, estrelas e o mar de nuvens escuro lá embaixo
//   41–50  borda      quase no espaço: o céu fica preto, a Terra aparece
//                     curvada lá embaixo com a faixa azul da atmosfera
//   51+    espaço     preto com nebulosa, a Terra redonda bem longe, um
//                     planeta com anéis e um satélite passando

export function phaseOf(f) {
  if (f <= 10) return 'dia';
  if (f <= 20) return 'tarde';
  if (f <= 40) return 'noite';
  if (f <= 50) return 'borda';
  return 'espaco';
}

function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const c = (sh) => Math.round(((pa >> sh) & 255) + ((((pb >> sh) & 255) - ((pa >> sh) & 255)) * t));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

// cores do céu (em cima, no meio, embaixo) de cada fase
const SKY = {
  dia: ['#4f9ff0', '#8cc8f7', '#d8f1ff'],
  tarde: ['#2b3f9a', '#b06a98', '#ffb46e'],
  noite: ['#060a2a', '#141a4e', '#2c2a66'],
  borda: ['#000006', '#050a24', '#0e2a6a'],
  espaco: ['#000000', '#05030f', '#0b0820'],
};

function stars(ctx, n, seed, alpha, maxY = 720) {
  const rand = seeded(seed);
  for (let i = 0; i < n; i++) {
    const x = rand() * 1280;
    const y = rand() * maxY;
    const big = rand() < 0.07;
    ctx.globalAlpha = alpha * (0.3 + rand() * 0.7);
    ctx.fillStyle = rand() < 0.15 ? '#ffe9b8' : rand() < 0.2 ? '#bcd4ff' : '#ffffff';
    ctx.fillRect(x, y, big ? 2 : 1.1, big ? 2 : 1.1);
  }
  ctx.globalAlpha = 1;
}

function sun(ctx, x, y, r, core, glow, a = 1) {
  const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 6);
  g.addColorStop(0, `rgba(${glow},${0.9 * a})`);
  g.addColorStop(0.2, `rgba(${glow},${0.35 * a})`);
  g.addColorStop(1, `rgba(${glow},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function moon(ctx, x, y, r) {
  const halo = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 4);
  halo.addColorStop(0, 'rgba(220,230,255,0.35)');
  halo.addColorStop(1, 'rgba(220,230,255,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
  ctx.fillStyle = '#eef0ff';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c9cde8';
  for (const [dx, dy, k] of [[-0.3, -0.2, 0.22], [0.35, 0.15, 0.17], [-0.1, 0.4, 0.12], [0.4, -0.4, 0.1]]) {
    ctx.beginPath();
    ctx.arc(x + dx * r, y + dy * r, k * r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function nebula(ctx) {
  for (const [x, y, r, rgb, a] of [[300, 220, 380, '150,70,220', 0.22], [980, 160, 320, '60,120,255', 0.18], [760, 420, 260, '255,80,160', 0.12]]) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

function paintSky(ctx, theme) {
  const f = floorOf(theme);
  const phase = phaseOf(f);
  const [top, mid, bottom] = SKY[phase];
  const sky = ctx.createLinearGradient(0, 0, 0, 720);
  sky.addColorStop(0, top);
  sky.addColorStop(0.55, mid);
  sky.addColorStop(1, bottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1280, 720);
  if (phase === 'dia') {
    // o sol vai baixando um pouco até o andar 10
    sun(ctx, 1010, 110 + f * 8, 44, '#fff6d6', '255,238,190');
  } else if (phase === 'tarde') {
    // pôr do sol: cada andar o sol desce mais
    sun(ctx, 1000, 330 + (f - 11) * 14, 56, '#ffe6a8', '255,170,90');
    stars(ctx, 40, 21, 0.4, 200);
  } else if (phase === 'noite') {
    stars(ctx, 200, 77, 1, 640);
    moon(ctx, 250, 150, 40);
    if (f >= 30) {
      // via láctea
      const band = ctx.createLinearGradient(0, 40, 1280, 380);
      band.addColorStop(0, 'rgba(180,150,255,0)');
      band.addColorStop(0.5, 'rgba(190,160,255,0.16)');
      band.addColorStop(1, 'rgba(180,150,255,0)');
      ctx.fillStyle = band;
      ctx.beginPath();
      ctx.moveTo(0, 120);
      ctx.lineTo(1280, 300);
      ctx.lineTo(1280, 420);
      ctx.lineTo(0, 230);
      ctx.fill();
    }
  } else if (phase === 'borda') {
    stars(ctx, 320, 91, 1);
    // o sol branco e forte (sem ar, ele não fica amarelo)
    sun(ctx, 1080, 140, 30, '#ffffff', '220,235,255', 0.8);
    moon(ctx, 220, 130, 30);
  } else {
    nebula(ctx);
    stars(ctx, 420, 5, 1);
    sun(ctx, 1120, 110, 26, '#ffffff', '210,230,255', 0.7);
    // planeta com anéis
    const px = 260;
    const py = 190;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-0.35);
    ctx.strokeStyle = 'rgba(230,200,150,0.55)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(0, 0, 110, 26, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    const pg = ctx.createRadialGradient(-18, -18, 6, 0, 0, 58);
    pg.addColorStop(0, '#f4d9a8');
    pg.addColorStop(0.6, '#c98f5a');
    pg.addColorStop(1, '#5a3a2a');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(0, 0, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(120,70,40,0.35)';
    ctx.fillRect(-56, -10, 112, 8);
    ctx.fillRect(-52, 12, 104, 6);
    ctx.strokeStyle = 'rgba(240,215,170,0.75)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 110, 26, 0, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  }
}

let skyFloor = 0;
function skyAnimated(ctx, t) {
  const phase = phaseOf(skyFloor);
  if (phase === 'noite' || phase === 'borda') {
    // estrela cadente de vez em quando
    const k = (t * 0.22) % 1;
    if (k < 0.16) {
      const p = k / 0.16;
      const x = 200 + p * 520;
      const y = 60 + p * 160;
      const g = ctx.createLinearGradient(x - 90, y - 28, x, y);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, `rgba(255,255,255,${0.9 * (1 - p)})`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 90, y - 28);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    return;
  }
  if (phase === 'espaco') {
    // satélite cruzando o céu devagar, com a luz piscando
    const x = ((t * 18) % 1700) - 200;
    const y = 300 - x * 0.08;
    ctx.fillStyle = '#c8cfdc';
    ctx.fillRect(x - 4, y - 3, 8, 6);
    ctx.fillStyle = '#3a6fd8';
    ctx.fillRect(x - 18, y - 2, 12, 4);
    ctx.fillRect(x + 6, y - 2, 12, 4);
    if (Math.sin(t * 6) > 0.6) {
      ctx.fillStyle = '#ff4a4a';
      ctx.fillRect(x - 1, y - 6, 2, 2);
    }
    return;
  }
  // pássaros (de dia e no entardecer)
  ctx.strokeStyle = phase === 'tarde' ? 'rgba(60,30,60,0.6)' : 'rgba(30,40,70,0.55)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 4; i++) {
    const x = ((t * 26 + i * 330) % 1600) - 160;
    const y = 110 + i * 41 + Math.sin(t * 0.8 + i) * 8;
    const flap = Math.sin(t * 9 + i * 2) * 3;
    ctx.beginPath();
    ctx.moveTo(x - 7, y - flap);
    ctx.quadraticCurveTo(x - 3, y - 3, x, y);
    ctx.quadraticCurveTo(x + 3, y - 3, x + 7, y - flap);
    ctx.stroke();
  }
}

// ================================================================ longe

function cloud(ctx, x, y, w, color, shade) {
  const puffs = Math.max(3, Math.round(w / 55));
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.ellipse(x, y + w * 0.06, w * 0.55, w * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  for (let i = 0; i < puffs; i++) {
    const px = x - w / 2 + (i + 0.5) * (w / puffs);
    const r = w * (0.11 + 0.07 * Math.sin(i * 1.7 + x));
    ctx.beginPath();
    ctx.arc(px, y - r * 0.4, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.52, w * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
}

// chão do andar 0 ao 10: morros, campos, vila e pinheiros (vai descendo)
function landscape(ctx, f, rand) {
  const ground = 470 + f * 48;
  const tint = (a, b) => mixHex(a, b, (f / 10) * 0.35);
  const hills = ridgeLine([[-760, ground - 40], [-200, ground - 150], [300, ground - 90], [900, ground - 190], [1500, ground - 70], [2040, ground - 130]], rand, 0.22);
  ctx.fillStyle = tint('#8fb3d6', '#6f86b0');
  ctx.beginPath();
  ctx.moveTo(-760, 1400);
  for (const [x, y] of hills) ctx.lineTo(x, y);
  ctx.lineTo(2040, 1400);
  ctx.fill();
  const green = ridgeLine([[-760, ground + 10], [-100, ground - 50], [500, ground - 10], [1100, ground - 60], [1700, ground], [2040, ground - 30]], rand, 0.12);
  ctx.fillStyle = tint('#6fae5a', '#5a8a6a');
  ctx.beginPath();
  ctx.moveTo(-760, 1400);
  for (const [x, y] of green) ctx.lineTo(x, y);
  ctx.lineTo(2040, 1400);
  ctx.fill();
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = tint(['#8cc06a', '#a9c96a', '#c9c86a'][i % 3], '#7a9a7a');
    ctx.beginPath();
    ctx.ellipse(-700 + i * 300 + rand() * 60, ground + 40 + rand() * 30, 150, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 16; i++) {
    const x = 80 + i * 70 + rand() * 30 + (i > 7 ? 700 : 0);
    const y = ground + 5 + rand() * 20;
    const w = 26 + rand() * 14;
    ctx.fillStyle = '#efe2c8';
    ctx.fillRect(x, y - 18, w, 18);
    ctx.fillStyle = '#c4473a';
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 18);
    ctx.lineTo(x + w / 2, y - 32);
    ctx.lineTo(x + w + 4, y - 18);
    ctx.fill();
  }
  for (let i = 0; i < 30; i++) {
    const x = -700 + rand() * 2700;
    const y = ground + 8 + rand() * 40;
    const h = 22 + rand() * 18;
    ctx.fillStyle = '#2f6b3f';
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + h * 0.35, y);
    ctx.lineTo(x - h * 0.35, y);
    ctx.fill();
  }
}

// mar de nuvens logo abaixo da torre
function cloudSea(ctx, top, light, dark, rand) {
  ctx.fillStyle = dark;
  ctx.fillRect(-760, top + 30, 2800, 1400);
  for (let i = 0; i < 22; i++) cloud(ctx, -760 + i * 135 + rand() * 40, top + 30 + rand() * 30, 200 + rand() * 120, light, dark);
}

// a Terra curvada lá embaixo; `r` maior = mais perto (borda), menor = espaço
function planetEarth(ctx, cx, cy, r) {
  // atmosfera (faixa azul brilhando na borda)
  const atm = ctx.createRadialGradient(cx, cy, r * 0.97, cx, cy, r * 1.06);
  atm.addColorStop(0, 'rgba(120,190,255,0.95)');
  atm.addColorStop(0.4, 'rgba(70,140,255,0.45)');
  atm.addColorStop(1, 'rgba(60,120,255,0)');
  ctx.fillStyle = atm;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.06, 0, Math.PI * 2);
  ctx.fill();
  // oceano
  const sea = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.6, r * 0.1, cx, cy, r);
  sea.addColorStop(0, '#4aa3ff');
  sea.addColorStop(0.7, '#1f5fc4');
  sea.addColorStop(1, '#0c2a6a');
  ctx.fillStyle = sea;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // continentes e nuvens (só na parte que aparece)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const rand = seeded(404);
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI / 2 + (rand() - 0.5) * 1.6;
    const d = r * (0.55 + rand() * 0.4);
    ctx.fillStyle = rand() < 0.5 ? '#3f8a4a' : '#8a7a4a';
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * (0.05 + rand() * 0.09), r * (0.02 + rand() * 0.04), a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 20; i++) {
    const a = -Math.PI / 2 + (rand() - 0.5) * 1.8;
    const d = r * (0.5 + rand() * 0.48);
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * (0.04 + rand() * 0.07), r * 0.012, a + 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // lado da noite (sombra)
  const night = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
  night.addColorStop(0, 'rgba(0,0,20,0.55)');
  night.addColorStop(0.45, 'rgba(0,0,20,0)');
  ctx.fillStyle = night;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}

function drawFar(ctx, map, rand) {
  const f = floorOf(map);
  const phase = phaseOf(f);
  if (phase === 'dia') {
    landscape(ctx, f, rand);
    // as nuvens chegam perto do andar 10
    if (f >= 5) cloudSea(ctx, Math.max(640, 1000 - (f - 5) * 70), '#ffffff', 'rgba(170,200,235,0.95)', rand);
    for (let i = 0; i < 7; i++) cloud(ctx, -600 + i * 420 + rand() * 120, 80 + rand() * 260, 160 + rand() * 140, 'rgba(255,255,255,0.92)', 'rgba(180,205,235,0.7)');
  } else if (phase === 'tarde') {
    cloudSea(ctx, 640, '#ffd2bf', 'rgba(190,110,140,0.95)', rand);
    for (let i = 0; i < 6; i++) cloud(ctx, -600 + i * 470 + rand() * 120, 100 + rand() * 240, 180 + rand() * 140, 'rgba(255,200,180,0.8)', 'rgba(170,100,140,0.55)');
  } else if (phase === 'noite') {
    cloudSea(ctx, 660, '#4a4f8a', 'rgba(24,26,64,0.97)', rand);
    for (let i = 0; i < 4; i++) cloud(ctx, -600 + i * 700 + rand() * 120, 160 + rand() * 200, 200 + rand() * 120, 'rgba(110,110,180,0.35)', 'rgba(40,40,90,0.3)');
  } else if (phase === 'borda') {
    // a Terra bem grande e curvada lá embaixo (cada andar mais longe)
    // (o topo da Terra fica logo abaixo da torre e vai descendo um pouco)
    const r = 3400 - (f - 41) * 150;
    planetEarth(ctx, 640, 560 + (f - 41) * 12 + r, r);
  } else {
    // espaço: a Terra pequena e redonda lá longe
    const r = Math.max(320, 760 - (f - 51) * 30);
    planetEarth(ctx, 720, 520 + r, r);
  }
}

function farAnimated() {}

// ================================================================ meio

function drawMid(ctx, map, rand) {
  const f = floorOf(map);
  if (f === 0) {
    // andar 0: as árvores do pátio aparecem logo atrás da torre
    for (let i = 0; i < 14; i++) {
      const x = -500 + i * 230 + rand() * 80;
      if (x > 300 && x < 980) continue;
      const y = 900 + rand() * 40;
      ctx.fillStyle = '#4e6b33';
      ctx.fillRect(x - 6, y - 60, 12, 60);
      ctx.fillStyle = ['#5d9a45', '#4f8a3c', '#6aa84f'][i % 3];
      for (const [dx, dy, r] of [[0, -90, 46], [-30, -70, 34], [30, -70, 34]]) {
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return;
  }
  // andares baixos: torres vizinhas mais baixas (vão sumindo lá embaixo)
  if (f <= 8) {
    for (const [x, w] of [[-380, 140], [1650, 160]]) {
      const y = 620 + f * 70;
      ctx.fillStyle = '#8d8296';
      ctx.fillRect(x, y, w, 1400);
      ctx.fillStyle = '#6f3a4a';
      ctx.beginPath();
      ctx.moveTo(x - 14, y);
      ctx.lineTo(x + w / 2, y - 110);
      ctx.lineTo(x + w + 14, y);
      ctx.fill();
    }
  }
}

let midFloor = 0;
function midAnimated(ctx, t) {
  // nuvenzinhas passando (de dia e no entardecer)
  const phase = phaseOf(midFloor);
  if (midFloor === 0 || (phase !== 'dia' && phase !== 'tarde')) return;
  const color = phase === 'dia' ? 'rgba(255,255,255,0.55)' : 'rgba(255,210,200,0.4)';
  for (let i = 0; i < 3; i++) {
    const x = ((t * (10 + i * 4) + i * 900) % 2800) - 600;
    cloud(ctx, x, 100 + i * 140, 220, color, 'rgba(0,0,0,0)');
  }
}

// ================================================================ campo

function stoneFace(ctx, x, y, w, h, rand, bw = 48, bh = 26) {
  ctx.fillStyle = STONE.mortar;
  ctx.fillRect(x, y, w, h);
  for (let row = 0, yy = y; yy < y + h; row++, yy += bh) {
    const off = row % 2 ? bw / 2 : 0;
    for (let xx = x - off; xx < x + w; xx += bw) {
      const bx = Math.max(x, xx + 1.5);
      const bxe = Math.min(x + w, xx + bw - 1.5);
      if (bxe <= bx) continue;
      ctx.fillStyle = [STONE.mid, STONE.light, STONE.dark, STONE.mid][Math.floor(rand() * 4)];
      ctx.fillRect(bx, yy + 1.5, bxe - bx, Math.min(bh - 3, y + h - yy - 1.5));
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(bx, yy + 1.5, bxe - bx, 3);
    }
  }
}

// faixa pendurada com o número do andar
function floorBanner(ctx, x, y, f) {
  const w = 132;
  const h = 132;
  ctx.fillStyle = INK;
  ctx.fillRect(x - w / 2 - 10, y - 8, w + 20, 10);
  ctx.fillStyle = '#7a1f2e';
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.lineTo(x, y + h - 26);
  ctx.lineTo(x - w / 2, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f0c04a';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#f0c04a';
  ctx.textAlign = 'center';
  ctx.font = '800 16px system-ui, sans-serif';
  ctx.fillText('ANDAR', x, y + 30);
  ctx.font = `900 ${f >= 100 ? 38 : 50}px system-ui, sans-serif`;
  ctx.fillText(String(f), x, y + 80);
}

function balcony(ctx, p, side) {
  // tábuas
  ctx.fillStyle = INK;
  roundRect(ctx, p.x - 3, p.y - 3, p.w + 6, 22, 6);
  ctx.fill();
  ctx.fillStyle = WOOD.mid;
  roundRect(ctx, p.x, p.y, p.w, 16, 4);
  ctx.fill();
  ctx.fillStyle = WOOD.light;
  ctx.fillRect(p.x + 3, p.y + 2, p.w - 6, 4);
  ctx.fillStyle = WOOD.dark;
  for (let x = p.x + 30; x < p.x + p.w; x += 34) ctx.fillRect(x, p.y + 3, 2, 12);
  // mão-francesa presa na parede da torre
  const wallX = side < 0 ? p.x + p.w - 10 : p.x + 10;
  const outX = side < 0 ? p.x + 30 : p.x + p.w - 30;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(outX, p.y + 16);
  ctx.lineTo(wallX, p.y + 96);
  ctx.stroke();
  ctx.strokeStyle = WOOD.dark;
  ctx.lineWidth = 7;
  ctx.stroke();
  // corrimão
  ctx.fillStyle = WOOD.deep;
  for (let x = p.x + 8; x < p.x + p.w - 4; x += 24) ctx.fillRect(x, p.y - 26, 4, 26);
  ctx.fillStyle = WOOD.mid;
  roundRect(ctx, p.x + 4, p.y - 30, p.w - 8, 7, 3);
  ctx.fill();
}

// patamar de pedra flutuando, com a runa dos 4 elementos embaixo
function floatingSlab(ctx, p) {
  const cx = p.x + p.w / 2;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(p.x - 4, p.y - 3);
  ctx.lineTo(p.x + p.w + 4, p.y - 3);
  ctx.lineTo(p.x + p.w - 30, p.y + 34);
  ctx.lineTo(cx + 26, p.y + 62);
  ctx.lineTo(cx - 26, p.y + 62);
  ctx.lineTo(p.x + 30, p.y + 34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = STONE.dark;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + p.w, p.y);
  ctx.lineTo(p.x + p.w - 32, p.y + 31);
  ctx.lineTo(cx + 24, p.y + 57);
  ctx.lineTo(cx - 24, p.y + 57);
  ctx.lineTo(p.x + 32, p.y + 31);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = STONE.top;
  ctx.fillRect(p.x, p.y, p.w, 9);
  ctx.fillStyle = STONE.light;
  ctx.fillRect(p.x + 6, p.y + 9, p.w - 12, 7);
  // pedras dos 4 elementos
  const els = ['fogo', 'agua', 'terra', 'ar'];
  els.forEach((e, i) => {
    const x = cx - 54 + i * 36;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(x, p.y + 30, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = EL[e];
    ctx.beginPath();
    ctx.arc(x, p.y + 30, 6.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawTerrain(ctx, map, rand) {
  const f = floorOf(map);
  const [top] = map.solids;
  const [balL, balR, slab] = map.platforms;
  // corpo da torre (desce até sumir lá embaixo)
  const bodyY = top.y + 24;
  stoneFace(ctx, top.x + 10, bodyY, top.w - 20, 1000, rand);
  // sombra dos lados (dá volume de cilindro)
  const shade = ctx.createLinearGradient(top.x, 0, top.x + top.w, 0);
  shade.addColorStop(0, 'rgba(20,10,30,0.55)');
  shade.addColorStop(0.18, 'rgba(20,10,30,0.08)');
  shade.addColorStop(0.6, 'rgba(255,240,210,0.05)');
  shade.addColorStop(0.85, 'rgba(20,10,30,0.15)');
  shade.addColorStop(1, 'rgba(20,10,30,0.6)');
  ctx.fillStyle = shade;
  ctx.fillRect(top.x + 10, bodyY, top.w - 20, 1000);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.strokeRect(top.x + 10, bodyY, top.w - 20, 1000);
  // janelas em arco com luz
  for (const x of [top.x + 120, top.x + top.w - 160]) {
    ctx.fillStyle = INK;
    roundRect(ctx, x - 4, bodyY + 86, 48, 78, 22);
    ctx.fill();
    ctx.fillStyle = f > 10 ? '#ffcf6a' : '#3a3050';
    roundRect(ctx, x, bodyY + 90, 40, 70, 19);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.fillRect(x + 18, bodyY + 90, 4, 70);
  }
  // andar 0: porta de entrada e grama na base
  if (f === 0) {
    const dx = top.x + top.w / 2;
    ctx.fillStyle = INK;
    roundRect(ctx, dx - 64, bodyY + 210, 128, 200, 60);
    ctx.fill();
    ctx.fillStyle = WOOD.dark;
    roundRect(ctx, dx - 56, bodyY + 218, 112, 192, 54);
    ctx.fill();
    ctx.fillStyle = WOOD.deep;
    for (let x = dx - 40; x < dx + 50; x += 26) ctx.fillRect(x, bodyY + 230, 4, 180);
  }
  // borda do topo (onde se pisa) com ameias para baixo, como uma coroa da torre
  ctx.fillStyle = INK;
  ctx.fillRect(top.x - 6, top.y - 4, top.w + 12, 36);
  ctx.fillStyle = STONE.light;
  ctx.fillRect(top.x - 2, top.y, top.w + 4, 28);
  ctx.fillStyle = STONE.top;
  ctx.fillRect(top.x - 2, top.y, top.w + 4, 9);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  for (let x = top.x + 30; x < top.x + top.w; x += 60) ctx.fillRect(x, top.y + 9, 3, 19);
  // pedras grandes em balanço embaixo da borda (mata-cães)
  for (let x = top.x + 6; x < top.x + top.w - 20; x += 52) {
    ctx.fillStyle = INK;
    ctx.fillRect(x - 2, top.y + 28, 30, 24);
    ctx.fillStyle = STONE.dark;
    ctx.fillRect(x, top.y + 28, 26, 20);
  }
  floorBanner(ctx, top.x + top.w / 2, bodyY + 40, f);
  balcony(ctx, balL, -1);
  balcony(ctx, balR, 1);
  floatingSlab(ctx, slab);
}

// tochas acesas no topo da torre
function torch(ctx, x, y, time) {
  ctx.fillStyle = INK;
  ctx.fillRect(x - 5, y - 30, 10, 32);
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(x - 3, y - 28, 6, 28);
  const flick = Math.sin(time * 13 + x) * 2;
  ctx.drawImage(glowSprite('255,170,70'), x - 34, y - 70, 68, 68);
  ctx.fillStyle = '#ff7a1f';
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 30);
  ctx.quadraticCurveTo(x - 6 + flick, y - 52, x + flick, y - 60);
  ctx.quadraticCurveTo(x + 6, y - 46, x + 8, y - 30);
  ctx.fill();
  ctx.fillStyle = '#ffd25a';
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 30);
  ctx.quadraticCurveTo(x - 3 + flick, y - 44, x + flick * 0.6, y - 48);
  ctx.quadraticCurveTo(x + 3, y - 40, x + 4, y - 30);
  ctx.fill();
}

// brilho das pedras dos elementos no patamar
function runeGlow(ctx, p, time) {
  const cx = p.x + p.w / 2;
  ['fogo', 'agua', 'terra', 'ar'].forEach((e, i) => {
    const a = 0.35 + 0.35 * Math.sin(time * 2 + i * 1.6);
    ctx.globalAlpha = a;
    const rgb = { fogo: '255,120,40', agua: '70,150,255', terra: '220,160,90', ar: '110,240,210' }[e];
    ctx.drawImage(glowSprite(rgb), cx - 54 + i * 36 - 20, p.y + 10, 40, 40);
  });
  ctx.globalAlpha = 1;
}

export const TORRE_ART = {
  sky(ctx, theme) {
    skyFloor = floorOf(theme);
    paintSky(ctx, theme);
  },
  skyAnimated,
  far: drawFar,
  farAnimated,
  mid(ctx, map, rand) {
    midFloor = floorOf(map);
    drawMid(ctx, map, rand);
  },
  midAnimated,
  terrain: drawTerrain,
  behind() {},
  front(ctx, map, time, platforms) {
    const [top] = map.solids;
    torch(ctx, top.x + 18, top.y, time);
    torch(ctx, top.x + top.w - 18, top.y, time + 1.3);
    const slab = platforms?.[2] ?? map.platforms[2];
    runeGlow(ctx, { x: slab.px ?? slab.x, y: slab.py ?? slab.y, w: slab.w }, time);
  },
  terrainRect: { x: -200, y: -200, w: 1680, h: 1300 },
  haze: ['rgba(255,255,255,0)', 'rgba(220,235,255,0.12)'],
  vignette: 0.35,
};
