// Cenário da Torre dos Elementos (modo Torre). O andar (map.towerFloor) muda
// a vista: no andar 0 o chão, os campos e a vila estão logo ali; subindo, o
// chão vai ficando lá embaixo, as nuvens chegam, o céu fica de pôr do sol e,
// lá no alto, vira noite estrelada com a lua.
//
//   céu      cor conforme a altura; estrelas e lua nos andares altos
//   longe    morros, vila e campos (descem com o andar) e o mar de nuvens
//   meio     árvores perto da torre (só embaixo) e nuvens passando
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

// ================================================================ céu

// Cores do céu por andar (em cima, no meio, embaixo)
const SKY_KEYS = [
  [0, ['#4f9ff0', '#8cc8f7', '#d8f1ff']],
  [6, ['#2f78d8', '#78b6f2', '#c6e6ff']],
  [12, ['#2b3f9a', '#9a6bb0', '#ffc28a']],
  [20, ['#141a55', '#4a2f7a', '#c4607e']],
  [30, ['#050720', '#141246', '#3a2466']],
];

function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const c = (sh) => Math.round(((pa >> sh) & 255) + ((((pb >> sh) & 255) - ((pa >> sh) & 255)) * t));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

function skyColors(f) {
  for (let i = 0; i < SKY_KEYS.length - 1; i++) {
    const [f0, c0] = SKY_KEYS[i];
    const [f1, c1] = SKY_KEYS[i + 1];
    if (f <= f1) {
      const t = Math.max(0, (f - f0) / (f1 - f0));
      return c0.map((c, k) => mixHex(c, c1[k], t));
    }
  }
  return SKY_KEYS[SKY_KEYS.length - 1][1].map((c) => mixHex(c, c, 0));
}

// 0 = dia; 1 = noite (estrelas aparecem)
const nightOf = (f) => Math.min(1, Math.max(0, (f - 14) / 14));

function paintSky(ctx, theme) {
  const f = floorOf(theme);
  const [top, mid, bottom] = skyColors(f);
  const sky = ctx.createLinearGradient(0, 0, 0, 720);
  sky.addColorStop(0, top);
  sky.addColorStop(0.55, mid);
  sky.addColorStop(1, bottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1280, 720);
  const night = nightOf(f);
  // sol (de dia, alto; no pôr do sol, baixo e laranja)
  if (night < 1) {
    const sy = 120 + Math.min(1, f / 16) * 330;
    const sun = ctx.createRadialGradient(1010, sy, 6, 1010, sy, 300);
    sun.addColorStop(0, `rgba(255,248,215,${0.95 * (1 - night)})`);
    sun.addColorStop(0.15, `rgba(255,220,150,${0.55 * (1 - night)})`);
    sun.addColorStop(1, 'rgba(255,190,120,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = `rgba(255,246,214,${1 - night})`;
    ctx.beginPath();
    ctx.arc(1010, sy, 44, 0, Math.PI * 2);
    ctx.fill();
  }
  if (night > 0) {
    // estrelas
    const rand = seeded(77);
    for (let i = 0; i < 180; i++) {
      const x = rand() * 1280;
      const y = rand() * 620;
      const r = rand() < 0.08 ? 1.9 : 1.1;
      ctx.globalAlpha = night * (0.3 + rand() * 0.7);
      ctx.fillStyle = rand() < 0.15 ? '#ffe9b8' : '#ffffff';
      ctx.fillRect(x, y, r, r);
    }
    ctx.globalAlpha = 1;
    // lua com crateras
    const mx = 250;
    const my = 150;
    const halo = ctx.createRadialGradient(mx, my, 20, mx, my, 170);
    halo.addColorStop(0, `rgba(220,230,255,${0.35 * night})`);
    halo.addColorStop(1, 'rgba(220,230,255,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, 600, 400);
    ctx.globalAlpha = night;
    ctx.fillStyle = '#eef0ff';
    ctx.beginPath();
    ctx.arc(mx, my, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c9cde8';
    for (const [dx, dy, r] of [[-12, -8, 9], [14, 6, 7], [-4, 16, 5], [16, -16, 4]]) {
      ctx.beginPath();
      ctx.arc(mx + dx, my + dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // faixa da via láctea lá no alto
    if (f >= 26) {
      const band = ctx.createLinearGradient(0, 40, 1280, 380);
      band.addColorStop(0, 'rgba(180,150,255,0)');
      band.addColorStop(0.5, `rgba(190,160,255,${0.16 * night})`);
      band.addColorStop(1, 'rgba(180,150,255,0)');
      ctx.fillStyle = band;
      ctx.beginPath();
      ctx.moveTo(0, 120);
      ctx.lineTo(1280, 300);
      ctx.lineTo(1280, 420);
      ctx.lineTo(0, 230);
      ctx.fill();
    }
  }
}

let skyFloor = 0;
function skyAnimated(ctx, t) {
  // estrelas cadentes nos andares altos; pássaros embaixo
  if (skyFloor >= 18) {
    const k = (t * 0.25) % 1;
    if (k < 0.18) {
      const p = k / 0.18;
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
  ctx.strokeStyle = skyFloor > 10 ? 'rgba(60,30,60,0.6)' : 'rgba(30,40,70,0.55)';
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

function drawFar(ctx, map, rand) {
  const f = floorOf(map);
  const night = nightOf(f);
  // o chão desce conforme a torre sobe
  const ground = 470 + f * 48;
  if (ground < 1500) {
    const tint = (a, b) => mixHex(a, b, Math.min(1, f / 14) * 0.55 + night * 0.35);
    // montanhas azuladas lá no fundo
    const hills = ridgeLine([[-760, ground - 40], [-200, ground - 150], [300, ground - 90], [900, ground - 190], [1500, ground - 70], [2040, ground - 130]], rand, 0.22);
    ctx.fillStyle = tint('#8fb3d6', '#4a4f7a');
    ctx.beginPath();
    ctx.moveTo(-760, 1400);
    for (const [x, y] of hills) ctx.lineTo(x, y);
    ctx.lineTo(2040, 1400);
    ctx.fill();
    // morros verdes
    const green = ridgeLine([[-760, ground + 10], [-100, ground - 50], [500, ground - 10], [1100, ground - 60], [1700, ground], [2040, ground - 30]], rand, 0.12);
    ctx.fillStyle = tint('#6fae5a', '#3a4a4a');
    ctx.beginPath();
    ctx.moveTo(-760, 1400);
    for (const [x, y] of green) ctx.lineTo(x, y);
    ctx.lineTo(2040, 1400);
    ctx.fill();
    // campos em faixas
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = tint(['#8cc06a', '#a9c96a', '#c9c86a'][i % 3], '#3c4848');
      const x = -700 + i * 300 + rand() * 60;
      ctx.beginPath();
      ctx.ellipse(x, ground + 40 + rand() * 30, 150, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // vila: casinhas com telhado vermelho e janelas acesas à noite
    for (let i = 0; i < 16; i++) {
      const x = 80 + i * 70 + rand() * 30 + (i > 7 ? 700 : 0);
      const y = ground + 5 + rand() * 20;
      const w = 26 + rand() * 14;
      ctx.fillStyle = tint('#efe2c8', '#5a5070');
      ctx.fillRect(x, y - 18, w, 18);
      ctx.fillStyle = tint('#c4473a', '#4a2a40');
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 18);
      ctx.lineTo(x + w / 2, y - 32);
      ctx.lineTo(x + w + 4, y - 18);
      ctx.fill();
      if (night > 0.2 || f > 12) {
        ctx.fillStyle = 'rgba(255,214,120,0.9)';
        ctx.fillRect(x + 5, y - 12, 5, 5);
      }
    }
    // pinheiros
    for (let i = 0; i < 30; i++) {
      const x = -700 + rand() * 2700;
      const y = ground + 8 + rand() * 40;
      const h = 22 + rand() * 18;
      ctx.fillStyle = tint('#2f6b3f', '#1f2c34');
      ctx.beginPath();
      ctx.moveTo(x, y - h);
      ctx.lineTo(x + h * 0.35, y);
      ctx.lineTo(x - h * 0.35, y);
      ctx.fill();
    }
  }
  // mar de nuvens: chega a partir do andar 5 e fica logo abaixo da torre
  if (f >= 4) {
    const top = Math.max(600, 1000 - (f - 4) * 60);
    const lit = f < 14 ? ['#ffffff', 'rgba(170,200,235,0.9)'] : f < 24 ? ['#ffd8c8', 'rgba(170,110,150,0.9)'] : ['#8a86c8', 'rgba(50,40,100,0.9)'];
    ctx.fillStyle = lit[1];
    ctx.fillRect(-760, top + 30, 2800, 1400);
    for (let i = 0; i < 22; i++) cloud(ctx, -760 + i * 135 + rand() * 40, top + 30 + rand() * 30, 200 + rand() * 120, lit[0], lit[1]);
  }
  // nuvens soltas
  const puff = f < 14 ? ['rgba(255,255,255,0.92)', 'rgba(180,205,235,0.7)'] : f < 24 ? ['rgba(255,214,200,0.8)', 'rgba(170,110,150,0.6)'] : ['rgba(140,130,200,0.5)', 'rgba(60,50,110,0.5)'];
  for (let i = 0; i < 7; i++) cloud(ctx, -600 + i * 420 + rand() * 120, 80 + rand() * 260, 160 + rand() * 140, puff[0], puff[1]);
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
  // mais alto: torres vizinhas mais baixas (vão sumindo lá embaixo)
  if (f <= 8) {
    for (const [x, w] of [[-380, 140], [1650, 160]]) {
      const y = 620 + f * 70;
      ctx.fillStyle = mixHex('#8d8296', '#4a4466', f / 10);
      ctx.fillRect(x, y, w, 1400);
      ctx.fillStyle = mixHex('#6f3a4a', '#3a2440', f / 10);
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
  // nuvenzinhas passando na frente do fundo (só durante o dia)
  if (midFloor === 0 || midFloor >= 24) return;
  const color = midFloor < 14 ? 'rgba(255,255,255,0.55)' : 'rgba(255,210,200,0.4)';
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
    ctx.fillStyle = f >= 14 ? '#ffcf6a' : '#3a3050';
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
