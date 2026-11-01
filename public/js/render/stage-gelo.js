// Cenário do Lago Congelado: noite de neve com aurora boreal.
//
//   céu      azul bem escuro, estrelas, lua e a aurora (faixas verdes e
//            roxas ondulando devagar)
//   longe    montanhas com neve iluminadas pela lua e floresta escura
//   meio     morros de neve com pinheiros nevados e uma cabana com a
//            janela acesa e fumaça saindo da chaminé
//   campo    margens de neve (firmes) e o gelo do lago (escorrega):
//            transparente, com rachaduras, bolhas e pingentes nas bordas
//
// Mesmo formato de TREINO_ART/PICO_ART (ver stage.js).

import { roundRect, seeded } from './stage-util.js';

const VIEW_W = 1280;
const VIEW_H = 720;
const MOON = { x: 1060, y: 105, r: 34 };
const DEEP = 2600; // até onde a terra e o gelo descem
const INK = '#0a1020';
const SNOW = { light: '#ffffff', mid: '#e3eefc', shade: '#b4c8e8', deep: '#8aa4cc' };
const ICE = { top: '#d8f6ff', light: '#a8e4f7', mid: '#5fb4dc', deep: '#1f5a8a', dark: '#0e2c4e' };

// ================================================================ céu

function paintSky(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, '#040818');
  sky.addColorStop(0.45, '#0b1838');
  sky.addColorStop(0.8, '#1d3462');
  sky.addColorStop(1, '#2c4a7c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // estrelas (umas maiores, com brilho em cruz)
  const rand = seeded(17);
  for (let i = 0; i < 260; i++) {
    const x = rand() * VIEW_W;
    const y = rand() * VIEW_H * 0.7;
    const r = rand() < 0.08 ? 1.6 : 0.5 + rand() * 0.8;
    ctx.globalAlpha = 0.35 + rand() * 0.65;
    ctx.fillStyle = rand() < 0.15 ? '#cfe0ff' : '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    if (r > 1.5) {
      ctx.fillRect(x - 5, y - 0.4, 10, 0.8);
      ctx.fillRect(x - 0.4, y - 5, 0.8, 10);
    }
  }
  ctx.globalAlpha = 1;
  // lua com brilho e crateras
  const glow = ctx.createRadialGradient(MOON.x, MOON.y, MOON.r * 0.5, MOON.x, MOON.y, MOON.r * 6);
  glow.addColorStop(0, 'rgba(210,225,255,0.35)');
  glow.addColorStop(1, 'rgba(210,225,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(MOON.x - MOON.r * 6, MOON.y - MOON.r * 6, MOON.r * 12, MOON.r * 12);
  const disc = ctx.createRadialGradient(MOON.x - 10, MOON.y - 10, 4, MOON.x, MOON.y, MOON.r);
  disc.addColorStop(0, '#ffffff');
  disc.addColorStop(1, '#cdd8ee');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(MOON.x, MOON.y, MOON.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(150,165,200,0.45)';
  for (const [dx, dy, r] of [[-10, -6, 7], [9, 8, 5], [12, -12, 4], [-4, 14, 3.5]]) {
    ctx.beginPath();
    ctx.arc(MOON.x + dx, MOON.y + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Aurora boreal: cortinas de luz verde e roxa ondulando
const AURORA = [
  { base: 120, amp: 40, k: 0.006, speed: 0.25, h: 170, color: [90, 255, 170], alpha: 0.22, phase: 0 },
  { base: 160, amp: 55, k: 0.0045, speed: 0.18, h: 140, color: [120, 220, 255], alpha: 0.16, phase: 2 },
  { base: 90, amp: 30, k: 0.008, speed: 0.32, h: 120, color: [190, 120, 255], alpha: 0.14, phase: 4 },
];

function skyAnimated(ctx, time) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const a of AURORA) {
    const [r, g, b] = a.color;
    for (let x = -20; x < VIEW_W + 20; x += 6) {
      const y = a.base + Math.sin(x * a.k + time * a.speed + a.phase) * a.amp + Math.sin(x * a.k * 2.7 - time * a.speed * 1.6) * a.amp * 0.35;
      const shimmer = 0.6 + 0.4 * Math.sin(x * 0.05 + time * 1.3 + a.phase);
      const grad = ctx.createLinearGradient(0, y - 10, 0, y + a.h);
      grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
      grad.addColorStop(0.15, `rgba(${r},${g},${b},${a.alpha * shimmer})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(x, y - 10, 7, a.h + 10);
    }
  }
  ctx.restore();
  // algumas estrelas piscando
  for (let i = 0; i < 14; i++) {
    const x = (i * 197) % VIEW_W;
    const y = 20 + ((i * 89) % 300);
    const tw = 0.5 + 0.5 * Math.sin(time * (2 + (i % 3)) + i);
    ctx.fillStyle = `rgba(255,255,255,${tw * 0.9})`;
    ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
  }
}

// ================================================================ fundo distante

function mountain(ctx, x, base, h, w, body, shade, rand) {
  const left = [];
  const right = [];
  for (let i = 1; i < 8; i++) {
    const u = i / 8;
    left.push([x - w * u + (rand() - 0.5) * w * 0.07, base - h * (1 - u) + (rand() - 0.5) * h * 0.06]);
    right.push([x + w * u + (rand() - 0.5) * w * 0.07, base - h * (1 - u) + (rand() - 0.5) * h * 0.06]);
  }
  const top = [x, base - h];
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(x - w, base + 400);
    ctx.lineTo(x - w, base);
    for (const p of [...left].reverse()) ctx.lineTo(p[0], p[1]);
    ctx.lineTo(top[0], top[1]);
    for (const p of right) ctx.lineTo(p[0], p[1]);
    ctx.lineTo(x + w, base);
    ctx.lineTo(x + w, base + 400);
    ctx.closePath();
  };
  ctx.fillStyle = body;
  path();
  ctx.fill();
  ctx.save();
  path();
  ctx.clip();
  // neve cobrindo quase toda a montanha, com o lado da lua (esquerda) claro
  ctx.fillStyle = 'rgba(220,232,255,0.75)';
  ctx.beginPath();
  ctx.moveTo(top[0], top[1]);
  ctx.lineTo(x - w * 0.55, top[1] + h * 0.6);
  for (let i = 1; i <= 7; i++) ctx.lineTo(x - w * 0.55 + (i / 8) * w * 1.1, top[1] + h * (i % 2 ? 0.42 : 0.62));
  ctx.lineTo(x + w * 0.55, top[1] + h * 0.6);
  ctx.closePath();
  ctx.fill();
  // lado de sombra (direita, longe da lua)
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(top[0], top[1]);
  for (const p of right) ctx.lineTo(p[0], p[1]);
  ctx.lineTo(x + w, base + 400);
  ctx.lineTo(x + w * 0.05, base + 400);
  ctx.lineTo(x - w * 0.05, base - h * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFar(ctx, map, rand) {
  for (const [x, h, w] of [[-520, 260, 320], [20, 330, 380], [560, 280, 330], [1100, 350, 400], [1640, 300, 350], [2060, 260, 300]]) {
    mountain(ctx, x, 470, h, w, '#3a4e7a', 'rgba(14,24,52,0.55)', rand);
  }
  for (const [x, h, w] of [[-280, 180, 250], [300, 210, 270], [820, 170, 240], [1360, 200, 270], [1880, 180, 250]]) {
    mountain(ctx, x, 500, h, w, '#2c3e66', 'rgba(10,18,40,0.6)', rand);
  }
  // floresta escura no pé das montanhas
  ctx.fillStyle = '#16233f';
  ctx.beginPath();
  ctx.moveTo(-800, 1400);
  for (let x = -800; x <= 2100; x += 14) {
    const h = 16 + rand() * 22;
    ctx.lineTo(x, 412);
    ctx.lineTo(x + 7, 412 - h);
  }
  ctx.lineTo(2100, 1400);
  ctx.closePath();
  ctx.fill();
  // neblina fria
  const fog = ctx.createLinearGradient(0, 360, 0, 460);
  fog.addColorStop(0, 'rgba(160,190,240,0)');
  fog.addColorStop(1, 'rgba(160,190,240,0.3)');
  ctx.fillStyle = fog;
  ctx.fillRect(-800, 360, 2900, 1040);
}

function farAnimated() {}

// ================================================================ fundo médio

const HILL = (x) => 480 - Math.sin(x * 0.0045 + 0.6) * 34 - Math.sin(x * 0.011 + 1.4) * 10;
const CABIN = { x: 1120 };

function snowyPine(ctx, x, y, s) {
  ctx.fillStyle = '#3a2a1e';
  ctx.fillRect(x - 2 * s, y - 8 * s, 4 * s, 8 * s);
  for (let i = 0; i < 4; i++) {
    const w = (17 - i * 3.6) * s;
    const yy = y - (6 + i * 11) * s;
    ctx.fillStyle = '#183a32';
    ctx.beginPath();
    ctx.moveTo(x - w, yy);
    ctx.lineTo(x, yy - 18 * s);
    ctx.lineTo(x + w, yy);
    ctx.closePath();
    ctx.fill();
    // neve em cima de cada camada
    ctx.fillStyle = SNOW.mid;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.75, yy - 3 * s);
    ctx.quadraticCurveTo(x - w * 0.3, yy - 12 * s, x, yy - 17 * s);
    ctx.quadraticCurveTo(x + w * 0.2, yy - 10 * s, x + w * 0.5, yy - 5 * s);
    ctx.quadraticCurveTo(x, yy - 7 * s, x - w * 0.75, yy - 3 * s);
    ctx.fill();
  }
}

function cabin(ctx, x, y) {
  ctx.fillStyle = '#4a2e1c';
  ctx.fillRect(x - 40, y - 34, 80, 34);
  ctx.strokeStyle = '#2e1c10';
  ctx.lineWidth = 1.5;
  for (let k = 0; k < 5; k++) {
    ctx.beginPath();
    ctx.moveTo(x - 40, y - 30 + k * 7);
    ctx.lineTo(x + 40, y - 30 + k * 7);
    ctx.stroke();
  }
  // janela acesa
  const win = ctx.createRadialGradient(x + 14, y - 18, 1, x + 14, y - 18, 40);
  win.addColorStop(0, 'rgba(255,200,110,0.55)');
  win.addColorStop(1, 'rgba(255,200,110,0)');
  ctx.fillStyle = win;
  ctx.fillRect(x - 26, y - 58, 80, 80);
  ctx.fillStyle = '#ffcf6a';
  ctx.fillRect(x + 6, y - 25, 16, 13);
  ctx.fillStyle = '#4a2e1c';
  ctx.fillRect(x + 13, y - 25, 2, 13);
  ctx.fillRect(x + 6, y - 19.5, 16, 2);
  ctx.fillStyle = '#2e1c10';
  ctx.fillRect(x - 26, y - 22, 14, 22);
  // chaminé e telhado de neve
  ctx.fillStyle = '#5a4a44';
  ctx.fillRect(x + 18, y - 64, 10, 22);
  ctx.fillStyle = SNOW.mid;
  ctx.beginPath();
  ctx.moveTo(x - 52, y - 30);
  ctx.lineTo(x, y - 62);
  ctx.lineTo(x + 52, y - 30);
  ctx.quadraticCurveTo(x, y - 38, x - 52, y - 30);
  ctx.fill();
  ctx.fillStyle = SNOW.shade;
  ctx.beginPath();
  ctx.moveTo(x, y - 62);
  ctx.lineTo(x + 52, y - 30);
  ctx.lineTo(x + 20, y - 34);
  ctx.closePath();
  ctx.fill();
}

function drawMid(ctx, map, rand) {
  // morro de neve
  const g = ctx.createLinearGradient(0, 430, 0, 720);
  g.addColorStop(0, '#c7d8f2');
  g.addColorStop(1, '#7f98c4');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-600, 1400);
  for (let x = -600; x <= 1900; x += 16) ctx.lineTo(x, HILL(x));
  ctx.lineTo(1900, 1400);
  ctx.closePath();
  ctx.fill();
  // brilho da lua na borda de cima
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = -600; x <= 1900; x += 16) ctx.lineTo(x, HILL(x) + 1);
  ctx.stroke();
  // pinheiros nevados
  for (let i = 0; i < 40; i++) {
    const x = -560 + i * 62 + rand() * 30;
    if (Math.abs(x - CABIN.x) < 70) continue;
    snowyPine(ctx, x, HILL(x) + 6, 0.65 + rand() * 0.5);
  }
  cabin(ctx, CABIN.x, HILL(CABIN.x) + 6);
  // lago congelado lá embaixo refletindo a lua
  const lake = ctx.createLinearGradient(0, 520, 0, 620);
  lake.addColorStop(0, '#5f88b8');
  lake.addColorStop(1, '#2a4a78');
  ctx.fillStyle = lake;
  ctx.beginPath();
  ctx.ellipse(640, 560, 900, 46, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(230,240,255,0.35)';
  for (let i = 0; i < 6; i++) ctx.fillRect(MOON.x - 20 + i * 4, 528 + i * 7, 40 - i * 6, 2);
}

function midAnimated(ctx, time) {
  const base = HILL(CABIN.x) + 6;
  // janela piscando como fogo de lareira
  const f = 0.75 + 0.15 * Math.sin(time * 7.3) + 0.1 * Math.sin(time * 17.1) + 0.05 * Math.sin(time * 31);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const wx = CABIN.x + 14;
  const wy = base - 18;
  const glow = ctx.createRadialGradient(wx, wy, 1, wx, wy, 46 * f);
  glow.addColorStop(0, `rgba(255,170,80,${0.42 * f})`);
  glow.addColorStop(1, 'rgba(255,170,80,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(wx - 50, wy - 50, 100, 100);
  ctx.restore();
  ctx.fillStyle = `rgb(255,${Math.round(170 + 50 * f)},${Math.round(80 + 40 * f)})`;
  ctx.fillRect(CABIN.x + 6, base - 25, 16, 13);
  ctx.fillStyle = '#4a2e1c';
  ctx.fillRect(CABIN.x + 13, base - 25, 2, 13);
  ctx.fillRect(CABIN.x + 6, base - 19.5, 16, 2);
  // fumaça da chaminé: sobe devagar e deita com a nevasca
  const bz = GAME?.map?.art === 'gelo' ? GAME.lake?.blizzard : null;
  const wind = bz?.state === 'ativo' ? bz.dir * 4 : bz ? bz.dir * 1.5 : 0.6;
  const cx = CABIN.x + 23;
  const cy = base - 66;
  for (let i = 0; i < 8; i++) {
    const u = (time * 0.25 + i / 8) % 1;
    ctx.fillStyle = `rgba(200,210,230,${0.35 * (1 - u)})`;
    ctx.beginPath();
    ctx.arc(cx + u * 40 * wind + Math.sin(time + i) * 4, cy - u * 70 / (1 + Math.abs(wind) * 0.25), 4 + u * 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ================================================================ campo (mundo)

// Pingentes de gelo pendurados numa borda
function icicles(ctx, x0, x1, y, rand, big = 1) {
  for (let x = x0 + 4; x < x1 - 4; x += 7 + rand() * 9) {
    const len = (6 + rand() * 18) * big;
    const w = 2.5 + rand() * 2;
    icicle(ctx, x, y, w, len);
  }
}

function icicle(ctx, x, y, w, len) {
  const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, ICE.light);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.lineTo(x, y + len);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,70,110,0.5)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

// Margem: barranco de pedra congelada em camadas, pedras com geada e uma
// camada grossa de neve em cima (com sombra azulada por baixo)
function snowBank(ctx, s, rand) {
  const bottom = 1000;
  const g = ctx.createLinearGradient(0, s.y, 0, s.y + 300);
  g.addColorStop(0, '#4b4f6e');
  g.addColorStop(0.5, '#2e3049');
  g.addColorStop(1, '#1b1b2c');
  ctx.fillStyle = g;
  ctx.fillRect(s.x, s.y, s.w, bottom - s.y);
  ctx.save();
  ctx.beginPath();
  ctx.rect(s.x, s.y, s.w, bottom - s.y);
  ctx.clip();
  // camadas de rocha (faixas onduladas)
  for (let k = 0; k < 5; k++) {
    const y0 = s.y + 46 + k * 52 + rand() * 10;
    ctx.fillStyle = k % 2 ? 'rgba(120,140,190,0.10)' : 'rgba(10,10,25,0.18)';
    ctx.beginPath();
    ctx.moveTo(s.x - 5, y0);
    for (let x = s.x; x <= s.x + s.w + 10; x += 20) ctx.lineTo(x, y0 + Math.sin(x * 0.05 + k) * 4);
    for (let x = s.x + s.w + 10; x >= s.x - 5; x -= 20) ctx.lineTo(x, y0 + 22 + Math.sin(x * 0.04 + k * 2) * 5);
    ctx.closePath();
    ctx.fill();
  }
  // pedras arredondadas, iluminadas pela lua por cima
  for (let i = 0; i < s.w / 22; i++) {
    const x = s.x + 10 + rand() * (s.w - 20);
    const y = s.y + 40 + rand() * 230;
    const rx = 6 + rand() * 12;
    const ry = rx * (0.55 + rand() * 0.25);
    ctx.fillStyle = rand() < 0.5 ? '#3d4160' : '#353855';
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(200,220,255,0.22)';
    ctx.beginPath();
    ctx.ellipse(x - rx * 0.15, y - ry * 0.4, rx * 0.65, ry * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(8,10,24,0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // geada brilhando perto da neve
  for (let i = 0; i < s.w / 6; i++) {
    const x = s.x + rand() * s.w;
    const y = s.y + 24 + rand() * rand() * 90;
    ctx.fillStyle = `rgba(210,235,255,${0.25 + rand() * 0.4})`;
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  // sombra azul embaixo da neve
  const sh = ctx.createLinearGradient(0, s.y + 10, 0, s.y + 50);
  sh.addColorStop(0, 'rgba(40,60,120,0.55)');
  sh.addColorStop(1, 'rgba(40,60,120,0)');
  ctx.fillStyle = sh;
  ctx.fillRect(s.x, s.y + 10, s.w, 40);
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(s.x, bottom);
  ctx.lineTo(s.x, s.y);
  ctx.moveTo(s.x + s.w, s.y);
  ctx.lineTo(s.x + s.w, bottom);
  ctx.stroke();
  // neve: camada fofa caindo pelas bordas
  const top = s.y;
  ctx.fillStyle = SNOW.shade;
  ctx.beginPath();
  ctx.moveTo(s.x - 8, top - 4);
  ctx.lineTo(s.x + s.w + 8, top - 4);
  ctx.quadraticCurveTo(s.x + s.w + 12, top + 16, s.x + s.w - 2, top + 34);
  for (let x = s.x + s.w - 14; x > s.x + 8; x -= 14 + rand() * 12) ctx.quadraticCurveTo(x + 8, top + 26 + rand() * 10, x, top + 16 + rand() * 8);
  ctx.quadraticCurveTo(s.x - 12, top + 18, s.x - 8, top - 4);
  ctx.closePath();
  ctx.fill();
  const sg = ctx.createLinearGradient(0, top - 10, 0, top + 16);
  sg.addColorStop(0, SNOW.light);
  sg.addColorStop(1, SNOW.mid);
  ctx.fillStyle = sg;
  roundRect(ctx, s.x - 8, top - 10, s.w + 16, 22, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,60,100,0.7)';
  ctx.lineWidth = 1.6;
  roundRect(ctx, s.x - 8, top - 10, s.w + 16, 22, 10);
  ctx.stroke();
  // montinhos e brilhos na neve
  for (let i = 0; i < s.w / 20; i++) {
    const x = s.x + rand() * s.w;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x, top - 9, 6 + rand() * 9, 3 + rand() * 2.5, 0, Math.PI, 0);
    ctx.fill();
  }
  for (let i = 0; i < s.w / 9; i++) {
    ctx.fillStyle = `rgba(170,215,255,${0.5 + rand() * 0.5})`;
    ctx.fillRect(s.x + rand() * s.w, top - 6 + rand() * 12, 1.4, 1.4);
  }
  icicles(ctx, s.x - 6, s.x + 12, top + 26, rand, 1.4);
  icicles(ctx, s.x + s.w - 12, s.x + s.w + 6, top + 26, rand, 1.4);
}

// ---------------------------------------------------------------- presos no gelo

function frozenFish(ctx, s, color) {
  const g = ctx.createLinearGradient(0, -8 * s, 0, 8 * s);
  g.addColorStop(0, color[0]);
  g.addColorStop(1, color[1]);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-18 * s, 0);
  ctx.quadraticCurveTo(-4 * s, -11 * s, 12 * s, -2 * s);
  ctx.lineTo(22 * s, -9 * s);
  ctx.lineTo(20 * s, 0);
  ctx.lineTo(22 * s, 9 * s);
  ctx.lineTo(12 * s, 2 * s);
  ctx.quadraticCurveTo(-4 * s, 11 * s, -18 * s, 0);
  ctx.fill();
  ctx.strokeStyle = 'rgba(10,30,50,0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc(-11 * s, -2 * s, 2 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a1020';
  ctx.beginPath();
  ctx.arc(-11 * s, -2 * s, 1 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.moveTo(-4 * s, -6 * s);
  ctx.quadraticCurveTo(0, 0, -4 * s, 6 * s);
  ctx.stroke();
}

function fishBones(ctx, s) {
  ctx.strokeStyle = '#e8e2cf';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-16 * s, 0);
  ctx.lineTo(16 * s, 0);
  for (let i = -2; i <= 3; i++) {
    const x = i * 4.5 * s;
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 3 * s, -8 * s + Math.abs(i) * s);
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 3 * s, 8 * s - Math.abs(i) * s);
  }
  ctx.moveTo(16 * s, 0);
  ctx.lineTo(23 * s, -6 * s);
  ctx.moveTo(16 * s, 0);
  ctx.lineTo(23 * s, 6 * s);
  ctx.stroke();
  ctx.fillStyle = '#e8e2cf';
  ctx.beginPath();
  ctx.moveTo(-26 * s, 0);
  ctx.lineTo(-15 * s, -6 * s);
  ctx.lineTo(-14 * s, 6 * s);
  ctx.closePath();
  ctx.fill();
}

function ammonite(ctx, s) {
  ctx.fillStyle = '#b89a6e';
  ctx.beginPath();
  ctx.arc(0, 0, 13 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#6e5636';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 6; a += 0.2) {
    const r = 1.2 * s + a * 0.62 * s;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.stroke();
  for (let a = 0; a < Math.PI * 2; a += 0.45) {
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 8 * s, Math.sin(a) * 8 * s);
    ctx.lineTo(Math.cos(a) * 12.5 * s, Math.sin(a) * 12.5 * s);
    ctx.stroke();
  }
}

function skull(ctx, s) {
  ctx.fillStyle = '#ece5d0';
  ctx.strokeStyle = 'rgba(60,50,40,0.7)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, -3 * s, 10 * s, Math.PI, 0);
  ctx.lineTo(8 * s, 6 * s);
  ctx.lineTo(-8 * s, 6 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(-5 * s, 6 * s, 10 * s, 4 * s);
  ctx.fillStyle = '#2a2430';
  ctx.beginPath();
  ctx.ellipse(-4 * s, 0, 3 * s, 3.4 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(4 * s, 0, 3 * s, 3.4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 3 * s);
  ctx.lineTo(-1.5 * s, 6 * s);
  ctx.lineTo(1.5 * s, 6 * s);
  ctx.fill();
  ctx.strokeStyle = '#2a2430';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 2 * s, 6.5 * s);
    ctx.lineTo(i * 2 * s, 9.5 * s);
    ctx.stroke();
  }
}

function bone(ctx, len) {
  ctx.strokeStyle = '#ece5d0';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-len / 2, 0);
  ctx.lineTo(len / 2, 0);
  ctx.stroke();
  ctx.fillStyle = '#ece5d0';
  for (const x of [-len / 2, len / 2]) {
    ctx.beginPath();
    ctx.arc(x, -2.5, 3, 0, Math.PI * 2);
    ctx.arc(x, 2.5, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineCap = 'butt';
}

function ribs(ctx, s) {
  ctx.strokeStyle = '#ece5d0';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-22 * s, 0);
  ctx.lineTo(22 * s, 0);
  ctx.stroke();
  ctx.lineWidth = 1.8;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 6 * s, 0);
    ctx.quadraticCurveTo(i * 6 * s + 8 * s, 10 * s, i * 6 * s + 2 * s, 20 * s - Math.abs(i) * 2 * s);
    ctx.stroke();
  }
}

function oldSword(ctx, s) {
  const g = ctx.createLinearGradient(0, -3 * s, 0, 3 * s);
  g.addColorStop(0, '#e8eef6');
  g.addColorStop(1, '#8a98aa');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-6 * s, -3 * s);
  ctx.lineTo(40 * s, -2.5 * s);
  ctx.lineTo(46 * s, 0);
  ctx.lineTo(40 * s, 2.5 * s);
  ctx.lineTo(-6 * s, 3 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(-9 * s, -9 * s, 4 * s, 18 * s);
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(-21 * s, -2.5 * s, 12 * s, 5 * s);
  ctx.fillStyle = '#c9a24a';
  ctx.beginPath();
  ctx.arc(-22 * s, 0, 3.4 * s, 0, Math.PI * 2);
  ctx.fill();
}

function oldSpear(ctx, s) {
  ctx.fillStyle = '#6a4a2c';
  ctx.fillRect(-36 * s, -1.8 * s, 60 * s, 3.6 * s);
  ctx.fillStyle = '#b8c4d2';
  ctx.beginPath();
  ctx.moveTo(24 * s, -5 * s);
  ctx.lineTo(40 * s, 0);
  ctx.lineTo(24 * s, 5 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c94a3a';
  ctx.fillRect(20 * s, -3 * s, 4 * s, 6 * s);
}

function helmet(ctx, s) {
  ctx.fillStyle = '#8a7a5a';
  ctx.beginPath();
  ctx.arc(0, 0, 11 * s, Math.PI, 0);
  ctx.lineTo(11 * s, 4 * s);
  ctx.lineTo(-11 * s, 4 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a4a32';
  ctx.fillRect(-1.5 * s, -11 * s, 3 * s, 15 * s);
  ctx.fillStyle = '#d8d0b0';
  ctx.beginPath();
  ctx.moveTo(-11 * s, -2 * s);
  ctx.quadraticCurveTo(-20 * s, -6 * s, -18 * s, -16 * s);
  ctx.quadraticCurveTo(-14 * s, -6 * s, -9 * s, -5 * s);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(11 * s, -2 * s);
  ctx.quadraticCurveTo(20 * s, -6 * s, 18 * s, -16 * s);
  ctx.quadraticCurveTo(14 * s, -6 * s, 9 * s, -5 * s);
  ctx.fill();
}

const FISH_COLORS = [['#ffb070', '#e0602a'], ['#9fd8ff', '#3a7ab8'], ['#ffe08a', '#d89a2a'], ['#c0f0d0', '#4a9a7a']];

// O que ficou preso no gelo: [tipo, x (0..1 da largura), fundura, giro, tamanho]
const FROZEN = [
  ['peixe', 0.05, 40, 0.2, 0.9, 0], ['espada', 0.13, 92, -0.35, 1], ['ossos', 0.23, 46, 0.5, 1],
  ['peixe', 0.3, 118, -0.15, 0.7, 1], ['amonite', 0.36, 62, 0, 1], ['caveira', 0.44, 128, -0.2, 1],
  ['osso', 0.47, 150, 0.6, 1], ['peixe', 0.53, 52, -0.25, 1.05, 2], ['costelas', 0.6, 104, 0.15, 1],
  ['elmo', 0.69, 58, 0.3, 1], ['peixe', 0.74, 140, 0.35, 0.75, 3], ['lanca', 0.8, 96, 0.12, 1],
  ['espinha', 0.88, 44, -0.4, 0.9], ['peixe', 0.95, 108, 0.1, 0.8, 1], ['amonite', 0.66, 150, 0, 0.7],
  ['espinha', 0.17, 150, 0.25, 0.75],
];

function drawFrozen(ctx, s) {
  for (const [type, fx, depth, rot, sc, c] of FROZEN) {
    ctx.save();
    ctx.translate(s.x + 24 + fx * (s.w - 48), s.y + depth);
    ctx.rotate(rot);
    ctx.globalAlpha = Math.max(0.35, 0.85 - depth / 260);
    if (type === 'peixe') frozenFish(ctx, sc, FISH_COLORS[c]);
    else if (type === 'espinha') fishBones(ctx, sc);
    else if (type === 'amonite') ammonite(ctx, sc);
    else if (type === 'caveira') skull(ctx, sc);
    else if (type === 'osso') bone(ctx, 26 * sc);
    else if (type === 'ossos') {
      bone(ctx, 24 * sc);
      ctx.rotate(1.2);
      bone(ctx, 20 * sc);
    } else if (type === 'costelas') ribs(ctx, sc);
    else if (type === 'espada') oldSword(ctx, sc);
    else if (type === 'lanca') oldSpear(ctx, sc);
    else if (type === 'elmo') helmet(ctx, sc);
    // bolhinhas de ar presas em volta
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = 'rgba(230,250,255,0.8)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(14 + i * 5, -12 - i * 6, 1.4 + i * 0.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// Gelo do lago: placa grossa e transparente, com coisas presas dentro,
// camadas, bolhas, rachaduras e o brilho liso em cima
function iceSheet(ctx, s, rand) {
  const bottom = 1000;
  ctx.save();
  ctx.beginPath();
  ctx.rect(s.x, s.y, s.w, bottom - s.y);
  ctx.clip();
  const g = ctx.createLinearGradient(0, s.y, 0, s.y + 230);
  g.addColorStop(0, ICE.light);
  g.addColorStop(0.12, '#7cc8ea');
  g.addColorStop(0.45, ICE.deep);
  g.addColorStop(1, ICE.dark);
  ctx.fillStyle = g;
  ctx.fillRect(s.x, s.y, s.w, bottom - s.y);
  // brilho da lua atravessando o gelo
  const moon = ctx.createRadialGradient(s.x + s.w * 0.72, s.y + 30, 10, s.x + s.w * 0.72, s.y + 30, 260);
  moon.addColorStop(0, 'rgba(220,245,255,0.3)');
  moon.addColorStop(1, 'rgba(220,245,255,0)');
  ctx.fillStyle = moon;
  ctx.fillRect(s.x, s.y, s.w, 300);
  // coisas presas no gelo, com uma camada de gelo azulado por cima
  drawFrozen(ctx, s);
  const veil = ctx.createLinearGradient(0, s.y, 0, s.y + 200);
  veil.addColorStop(0, 'rgba(150,215,240,0.18)');
  veil.addColorStop(1, 'rgba(20,70,120,0.4)');
  ctx.fillStyle = veil;
  ctx.fillRect(s.x, s.y, s.w, 220);
  // camadas do congelamento (linhas finas e onduladas)
  ctx.strokeStyle = 'rgba(200,240,255,0.16)';
  ctx.lineWidth = 1;
  for (let k = 0; k < 5; k++) {
    const y0 = s.y + 26 + k * 34;
    ctx.beginPath();
    for (let x = s.x; x <= s.x + s.w; x += 12) ctx.lineTo(x, y0 + Math.sin(x * 0.03 + k * 1.7) * 3);
    ctx.stroke();
  }
  // reflexos diagonais
  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  for (let x = s.x - 100; x < s.x + s.w; x += 80 + rand() * 60) {
    ctx.beginPath();
    ctx.moveTo(x, s.y + 170);
    ctx.lineTo(x + 85, s.y);
    ctx.lineTo(x + 108, s.y);
    ctx.lineTo(x + 23, s.y + 170);
    ctx.closePath();
    ctx.fill();
  }
  // bolhas presas no gelo
  for (let i = 0; i < s.w / 10; i++) {
    const x = s.x + rand() * s.w;
    const y = s.y + 16 + rand() * 150;
    const r = 0.8 + rand() * 2.6;
    ctx.strokeStyle = 'rgba(230,250,255,0.55)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // rachaduras velhas (finas)
  ctx.strokeStyle = 'rgba(240,252,255,0.45)';
  ctx.lineWidth = 1;
  for (let i = 0; i < s.w / 90; i++) {
    let x = s.x + 20 + rand() * (s.w - 40);
    let y = s.y + 6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 4; k++) {
      x += (rand() - 0.5) * 26;
      y += 8 + rand() * 12;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(s.x, bottom);
  ctx.lineTo(s.x, s.y);
  ctx.moveTo(s.x + s.w, s.y);
  ctx.lineTo(s.x + s.w, bottom);
  ctx.stroke();
  // superfície lisa e brilhante (é aqui que escorrega)
  const top = ctx.createLinearGradient(0, s.y - 4, 0, s.y + 8);
  top.addColorStop(0, '#ffffff');
  top.addColorStop(1, ICE.top);
  ctx.fillStyle = top;
  ctx.fillRect(s.x, s.y - 3, s.w, 9);
  ctx.strokeStyle = 'rgba(30,70,110,0.8)';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(s.x, s.y - 3, s.w, 9);
  // marcas de patins
  ctx.strokeStyle = 'rgba(140,190,220,0.6)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < s.w / 55; i++) {
    const x = s.x + rand() * (s.w - 50);
    ctx.beginPath();
    ctx.moveTo(x, s.y + 1 + rand() * 3);
    ctx.quadraticCurveTo(x + 25, s.y + 4, x + 50, s.y + 1 + rand() * 3);
    ctx.stroke();
  }
}

// Plataforma de gelo com pingentes embaixo (vira imagem: derrete e volta)
function icePlatform(ctx, p, rand) {
  const h = 14;
  const g = ctx.createLinearGradient(0, p.y, 0, p.y + h);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.4, ICE.light);
  g.addColorStop(1, ICE.mid);
  ctx.fillStyle = g;
  roundRect(ctx, p.x, p.y, p.w, h, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,50,90,0.85)';
  ctx.lineWidth = 2;
  roundRect(ctx, p.x, p.y, p.w, h, 5);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1;
  for (let x = p.x + 20; x < p.x + p.w - 10; x += 34 + rand() * 20) {
    ctx.beginPath();
    ctx.moveTo(x, p.y + 3);
    ctx.lineTo(x + 8, p.y + h - 3);
    ctx.stroke();
  }
  icicles(ctx, p.x + 4, p.x + p.w - 4, p.y + h - 1, rand, 1.1);
  // neve em cima
  ctx.fillStyle = SNOW.light;
  for (let i = 0; i < 3; i++) {
    const x = p.x + 16 + rand() * (p.w - 50);
    ctx.beginPath();
    ctx.ellipse(x, p.y, 10 + rand() * 12, 4, 0, Math.PI, 0);
    ctx.fill();
  }
}

const PLAT_SPRITES = new Map();

function platformSprite(pl, index) {
  const key = `${index}:${pl.w}`;
  if (PLAT_SPRITES.has(key)) return PLAT_SPRITES.get(key);
  const res = 2;
  const c = document.createElement('canvas');
  c.width = (pl.w + 20) * res;
  c.height = 60 * res;
  const x = c.getContext('2d');
  x.scale(res, res);
  icePlatform(x, { x: 10, y: 8, w: pl.w }, seeded(300 + index));
  PLAT_SPRITES.set(key, c);
  return c;
}

function drawPlatforms(ctx, platforms, time) {
  platforms.forEach((pl, i) => {
    if (!pl.ice) return;
    const sprite = platformSprite(pl, i);
    if (pl.goneTime > 0) {
      // marca de geada onde ela vai voltar
      ctx.globalAlpha = 0.12 + 0.06 * Math.sin(time * 4);
      ctx.strokeStyle = '#dff6ff';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;
      roundRect(ctx, pl.x, pl.y, pl.w, 14, 5);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      return;
    }
    const m = pl.melt ?? 0;
    const back = pl.backTime > 0 ? 1 - pl.backTime / 0.6 : 1;
    // derretendo: fica mais fina, transparente e treme no fim
    const shake = m > 0.65 ? Math.sin(time * 60 + i) * (m - 0.65) * 4 : 0;
    ctx.globalAlpha = back * (1 - m * 0.35);
    ctx.drawImage(sprite, pl.x - 10 + shake, pl.y - 8, pl.w + 20, 60 * (1 - m * 0.18));
    ctx.globalAlpha = 1;
    if (m > 0.05) {
      // molhada (mais escura) e pingando
      ctx.fillStyle = `rgba(40,110,170,${m * 0.5})`;
      roundRect(ctx, pl.x + shake, pl.y, pl.w, 14, 5);
      ctx.fill();
      const drops = Math.ceil(m * 7);
      for (let k = 0; k < drops; k++) {
        const dx = pl.x + 14 + ((k * 53 + i * 31) % (pl.w - 28));
        const u = (time * (0.9 + (k % 3) * 0.2) + k * 0.37) % 1;
        ctx.fillStyle = `rgba(190,235,255,${1 - u * 0.8})`;
        ctx.beginPath();
        ctx.ellipse(dx, pl.y + 24 + u * 80, 2.4, 3.8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (back < 1) {
      // voltando: brilho de gelo novo
      ctx.globalAlpha = 1 - back;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, pl.x, pl.y, pl.w, 14, 5);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  });
}

// Bonecos de neve e pinheirinhos nas margens
function snowman(ctx, x, y) {
  for (const [dy, r] of [[-12, 13], [-33, 10], [-50, 7.5]]) {
    const g = ctx.createRadialGradient(x - r * 0.4, y + dy - r * 0.4, 1, x, y + dy, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, SNOW.shade);
    ctx.fillStyle = g;
    ctx.strokeStyle = 'rgba(40,60,100,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y + dy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#1a1a22';
  for (const dy of [-38, -32, -26]) {
    ctx.beginPath();
    ctx.arc(x, y + dy, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x - 2.5, y - 52, 1.2, 0, Math.PI * 2);
  ctx.arc(x + 2.5, y - 52, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff7a1a';
  ctx.beginPath();
  ctx.moveTo(x, y - 49);
  ctx.lineTo(x + 9, y - 48);
  ctx.lineTo(x, y - 47);
  ctx.closePath();
  ctx.fill();
  // cachecol vermelho e chapéu
  ctx.fillStyle = '#d6372e';
  ctx.fillRect(x - 8, y - 44, 16, 4);
  ctx.fillRect(x + 3, y - 44, 4, 11);
  ctx.fillStyle = '#1a1a22';
  ctx.fillRect(x - 7, y - 59, 14, 3);
  ctx.fillRect(x - 5, y - 70, 10, 11);
  // braços de graveto
  ctx.strokeStyle = '#4a2e1c';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 34);
  ctx.lineTo(x - 22, y - 44);
  ctx.moveTo(x + 9, y - 34);
  ctx.lineTo(x + 21, y - 40);
  ctx.stroke();
}

// Poste com lampião nas pontas das margens (a chama é animada em front)
const LAMPS = (map) => {
  const banks = map.solids.filter((s) => !s.ice);
  return banks.map((s, i) => ({ x: i === 0 ? s.x + 26 : s.x + s.w - 26, y: s.y - 8 }));
};

function lampPost(ctx, x, y) {
  ctx.fillStyle = '#2a2230';
  ctx.fillRect(x - 2.5, y - 74, 5, 74);
  ctx.fillRect(x - 7, y - 4, 14, 5);
  ctx.strokeStyle = '#2a2230';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - 70);
  ctx.quadraticCurveTo(x + 2, y - 82, x + 14, y - 80);
  ctx.stroke();
  // lampião
  ctx.fillStyle = '#1e1822';
  ctx.fillRect(x + 7, y - 79, 14, 4);
  ctx.fillRect(x + 8, y - 60, 12, 3);
  ctx.fillStyle = 'rgba(255,214,140,0.85)';
  ctx.fillRect(x + 9, y - 75, 10, 15);
  ctx.strokeStyle = '#1e1822';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 9, y - 75, 10, 15);
  // neve no topo
  ctx.fillStyle = SNOW.light;
  ctx.beginPath();
  ctx.ellipse(x + 14, y - 79, 9, 3, 0, Math.PI, 0);
  ctx.fill();
}

function drawTerrain(ctx, map, rand) {
  // pinheirinhos nevados atrás das margens
  for (const s of map.solids) {
    if (s.ice) continue;
    for (let i = 0; i < 3; i++) snowyPine(ctx, s.x + 40 + i * (s.w - 80) / 2, s.y + 4, 1.2 + rand() * 0.45);
  }
  for (const s of map.solids) {
    if (s.ice) iceSheet(ctx, s, rand);
    else snowBank(ctx, s, rand);
  }
  for (const l of LAMPS(map)) lampPost(ctx, l.x, l.y + 8);
  // bonecos de neve nas margens
  const banks = map.solids.filter((s) => !s.ice && s.h > 170);
  if (banks[0]) snowman(ctx, banks[0].x + banks[0].w * 0.62, banks[0].y - 6);
  if (banks[1]) snowman(ctx, banks[1].x + banks[1].w * 0.38, banks[1].y - 6);
}

// ---------------------------------------------------------------- o que muda na luta

let GAME = null;
const lakeOf = (map) => (GAME && GAME.map === map ? GAME.lake : null);

// rachaduras (desenho fixo para cada pedaço e nível)
function drawCrack(ctx, c, y, level) {
  const rand = seeded(900 + c.i * 7);
  const cx = c.x + c.w / 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 1.6;
  ctx.shadowColor = '#bff0ff';
  ctx.shadowBlur = 6;
  const arms = 3 + level * 3;
  for (let a = 0; a < arms; a++) {
    let x = cx + (rand() - 0.5) * 8;
    let yy = y + 2;
    const ang = (a / arms) * Math.PI + rand() * 0.3;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    const steps = 2 + level * 2;
    for (let k = 0; k < steps; k++) {
      x += Math.cos(ang) * (8 + rand() * 8) * (rand() < 0.5 ? -1 : 1);
      yy += Math.abs(Math.sin(ang)) * (6 + rand() * 9) + 2;
      ctx.lineTo(Math.max(c.x - 10, Math.min(c.x + c.w + 10, x)), yy);
    }
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

// buraco aberto: cavidade escura, bordas de gelo quebrado (a água é
// desenhada junto com os outros perigos)
function drawHole(ctx, c, y, time) {
  const g = ctx.createLinearGradient(0, y, 0, y + 200);
  g.addColorStop(0, '#0d3558');
  g.addColorStop(1, '#03101f');
  ctx.fillStyle = g;
  ctx.fillRect(c.x, y - 4, c.w, 980 - y);
  ctx.fillStyle = 'rgba(220,245,255,0.95)';
  for (const side of [0, 1]) {
    const x0 = side ? c.x + c.w : c.x;
    const d = side ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(x0, y - 4);
    ctx.lineTo(x0 + d * 7, y + 2);
    ctx.lineTo(x0 + d * 3, y + 8);
    ctx.lineTo(x0 + d * 9, y + 16);
    ctx.lineTo(x0, y + 26);
    ctx.closePath();
    ctx.fill();
  }
  // pedacinhos de gelo boiando
  for (let k = 0; k < 3; k++) {
    const x = c.x + 10 + k * 18 + Math.sin(time * 1.3 + k * 2) * 3;
    ctx.fillStyle = 'rgba(235,250,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 11);
    ctx.lineTo(x + 4, y + 9);
    ctx.lineTo(x + 6, y + 12);
    ctx.lineTo(x - 3, y + 14);
    ctx.closePath();
    ctx.fill();
  }
}

function drawLakeFloor(ctx, lake, time) {
  const y = lake.ice.y;
  for (const c of lake.cells) {
    if (c.open > 0) drawHole(ctx, c, y, time);
    else if (c.cracks > 0) drawCrack(ctx, c, y, c.cracks);
  }
  // montinhos de neve com bolas em cima
  for (const pile of lake.piles) {
    const x = pile.x + pile.w / 2;
    const by = pile.y + pile.h;
    const g = ctx.createRadialGradient(x - 4, by - 10, 1, x, by - 4, 20);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, SNOW.shade);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, by, 19, 13, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,60,100,0.6)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    for (const [dx, dy] of [[-6, -12], [5, -13], [0, -20]]) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + dx, by + dy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    const tw = 0.5 + 0.5 * Math.sin(time * 5 + pile.id);
    ctx.fillStyle = `rgba(255,255,255,${tw})`;
    ctx.fillRect(x + 9, by - 22, 1.5, 6);
    ctx.fillRect(x + 6.75, by - 19.75, 6, 1.5);
  }
}

// chama dos lampiões tremendo
function drawLamps(ctx, map, time) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [i, l] of LAMPS(map).entries()) {
    const f = 0.85 + 0.1 * Math.sin(time * 9 + i * 2) + 0.05 * Math.sin(time * 23 + i);
    const x = l.x + 14;
    const y = l.y - 59;
    const g = ctx.createRadialGradient(x, y, 2, x, y, 90 * f);
    g.addColorStop(0, `rgba(255,190,100,${0.35 * f})`);
    g.addColorStop(1, 'rgba(255,190,100,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 90, y - 90, 180, 180);
    ctx.fillStyle = `rgba(255,230,160,${0.8 * f})`;
    ctx.beginPath();
    ctx.ellipse(x, y + 1, 2.5, 4.5 * f, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- por cima de tudo

// nevasca: risquinhos de neve na diagonal (fraquinha no aviso, forte quando sopra)
function drawBlizzard(ctx, bz, time) {
  const strong = bz.state === 'ativo';
  const n = strong ? 260 : 70;
  const dir = bz.dir;
  const area = { x: -500, y: -600, w: 2300, h: 1700 };
  ctx.save();
  if (strong) {
    ctx.fillStyle = 'rgba(220,235,255,0.14)';
    ctx.fillRect(area.x, area.y, area.w, area.h);
  }
  ctx.strokeStyle = `rgba(255,255,255,${strong ? 0.75 : 0.45})`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const speed = strong ? 900 : 420;
  for (let i = 0; i < n; i++) {
    const sx = (i * 977) % area.w;
    const sy = (i * 613) % area.h;
    const t = time * speed * (0.7 + (i % 5) * 0.12);
    const x = area.x + ((((sx + dir * t) % area.w) + area.w) % area.w);
    const y = area.y + ((sy + t * 0.75) % area.h);
    const len = strong ? 22 : 10;
    ctx.moveTo(x, y);
    ctx.lineTo(x - dir * len, y - len * 0.75);
  }
  ctx.stroke();
  ctx.restore();
  // aviso: NEVASCA com a seta da direção
  if (!strong || bz.time > 3.6) {
    const blink = bz.state === 'aviso' ? 0.55 + 0.45 * Math.sin(time * 10) : 1;
    ctx.save();
    ctx.globalAlpha = blink;
    ctx.font = 'italic 900 30px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(10,20,50,0.85)';
    const text = dir > 0 ? 'NEVASCA  ↘' : '↙  NEVASCA';
    ctx.strokeText(text, 640, 118);
    ctx.fillStyle = '#e6f6ff';
    ctx.fillText(text, 640, 118);
    ctx.restore();
  }
}

// pingentes tremendo e caindo
function drawIcicles(ctx, lake, time) {
  for (const ic of lake.icicles) {
    const wob = ic.state === 'treme' ? Math.sin(time * 70 + ic.id) * 1.5 : 0;
    ctx.save();
    ctx.translate(ic.x + wob, ic.y);
    if (ic.state === 'cai') {
      ctx.strokeStyle = 'rgba(220,245,255,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(0, -16 - Math.min(40, ic.vy * 0.04));
      ctx.stroke();
    }
    icicle(ctx, 0, -22, 5, 30);
    ctx.restore();
  }
}

// vapor da respiração saindo de vez em quando (está frio!)
function drawBreath(ctx, players, time, alpha) {
  for (const p of players) {
    if (p.state !== 'alive') continue;
    const phase = (time * 0.42 + p.id * 0.37) % 1;
    if (phase > 0.3) continue;
    const u = phase / 0.3;
    const x = p.px + (p.x - p.px) * alpha + p.w / 2 + p.facing * (12 + u * 16);
    const y = p.py + (p.y - p.py) * alpha + 15 - u * 7;
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = `rgba(240,248,255,${0.7 * (1 - u) * (1 - k * 0.22)})`;
      ctx.beginPath();
      ctx.arc(x + p.facing * k * 5, y - k * 2.5, 3 + u * 7 + k * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export const GELO_ART = {
  sky: paintSky,
  skyAnimated,
  far: drawFar,
  farAnimated,
  mid: drawMid,
  midAnimated,
  terrain: drawTerrain,
  setGame(game) {
    GAME = game;
  },
  // o terreno guardado em imagem vai até y 980: daqui para baixo a terra e o
  // gelo continuam até o fim da tela, mesmo com a câmera afastada
  behind(ctx, map) {
    for (const s of map.solids) {
      ctx.fillStyle = s.ice ? ICE.dark : '#1b1b2c';
      ctx.fillRect(s.x, 970, s.w, DEEP - 970);
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (const s of map.solids) {
      ctx.moveTo(s.x, 970);
      ctx.lineTo(s.x, DEEP);
      ctx.moveTo(s.x + s.w, 970);
      ctx.lineTo(s.x + s.w, DEEP);
    }
    ctx.stroke();
  },
  front(ctx, map, time, platforms) {
    const lake = lakeOf(map);
    // brilhinhos piscando na superfície do gelo
    for (const s of map.solids) {
      if (!s.ice) continue;
      for (let i = 0; i < 6; i++) {
        const x = s.x + ((i * 97 + Math.floor(time * 0.7 + i) * 53) % s.w);
        const tw = Math.max(0, Math.sin(time * 3 + i * 1.7));
        if (tw < 0.2) continue;
        ctx.fillStyle = `rgba(255,255,255,${tw})`;
        ctx.fillRect(x - 4 * tw, s.y - 1, 8 * tw, 1);
        ctx.fillRect(x - 0.5, s.y - 4 * tw - 1, 1, 8 * tw);
      }
    }
    if (lake) drawLakeFloor(ctx, lake, time);
    drawLamps(ctx, map, time);
    drawPlatforms(ctx, platforms ?? map.platforms, time);
  },
  // por cima dos lutadores
  overlay(ctx, time, game, alpha) {
    if (game.map.art !== 'gelo') return;
    drawBreath(ctx, game.players, time, alpha);
    if (game.lake) {
      drawIcicles(ctx, game.lake, time);
      if (game.lake.blizzard) drawBlizzard(ctx, game.lake.blizzard, time);
    }
  },
  // efeitos do que acontece na luta
  onEvent(e, P, r) {
    switch (e.type) {
      case 'iceCrack':
        P.burst(e.x, e.y, { type: 'spark', count: 8 + e.level * 4, speed: 260, angle: -Math.PI / 2, spread: 2.4, life: 0.35, size: 2, color: '#e8fbff', drag: 3 });
        P.add({ type: 'ring', x: e.x, y: e.y, size: 6, grow: 120, life: 0.25, color: 'rgba(220,250,255,0.9)' });
        r?.shake(3 + e.level * 2, 0.15);
        break;
      case 'iceBreak': {
        const x = e.x + e.w / 2;
        P.burst(x, e.y, { count: 22, speed: 420, angle: -Math.PI / 2, spread: 2, life: 0.9, size: 4, color: '#dff6ff', gravity: 1300 });
        P.burst(x, e.y + 6, { count: 18, speed: 300, angle: -Math.PI / 2, spread: 1.4, life: 0.8, size: 3, color: '#7fd0ff', gravity: 900 });
        P.add({ type: 'ring', x, y: e.y, size: 10, grow: 260, life: 0.35, color: '#ffffff' });
        P.add({ type: 'text', text: 'CRACK!', x, y: e.y - 40, vy: -50, life: 0.9, size: 26, color: '#e6f8ff' });
        r?.shake(9, 0.3);
        break;
      }
      case 'iceFreeze':
        P.burst(e.x + e.w / 2, e.y, { type: 'spark', count: 14, speed: 160, life: 0.6, size: 2, color: '#ffffff', drag: 3 });
        P.add({ type: 'ring', x: e.x + e.w / 2, y: e.y, size: 8, grow: 90, life: 0.4, color: 'rgba(200,245,255,0.9)' });
        break;
      case 'platformMelt':
        for (let k = 0; k < 6; k++) {
          P.burst(e.x + (k + 0.5) * (e.w / 6), e.y + 6, { count: 3, speed: 80, angle: Math.PI / 2, spread: 1, life: 1, size: 5, color: '#bfeaff', gravity: 1400 });
        }
        P.burst(e.x + e.w / 2, e.y + 6, { count: 16, speed: 160, angle: Math.PI / 2, spread: 2.4, life: 0.8, size: 2.4, color: '#9fe3ff', gravity: 1100 });
        break;
      case 'platformBack':
        P.burst(e.x + e.w / 2, e.y + 6, { type: 'spark', count: 16, speed: 200, life: 0.5, size: 2, color: '#ffffff', drag: 3 });
        break;
      case 'icicleBreak':
        P.burst(e.x, e.y, { count: 12, speed: 260, angle: -Math.PI / 2, spread: 2.4, life: 0.6, size: 2.6, color: '#e8fbff', gravity: 1300 });
        break;
      case 'snowPile':
        P.burst(e.x, e.y - 8, { count: 10, speed: 120, angle: -Math.PI / 2, spread: 2, life: 0.6, size: 3, color: '#ffffff', gravity: 400 });
        break;
      case 'snowPickup':
        P.burst(e.x, e.y - 10, { count: 12, speed: 160, angle: -Math.PI / 2, spread: 2.4, life: 0.5, size: 3, color: '#ffffff', gravity: 500 });
        P.add({ type: 'text', text: '+3 bolas de neve', x: e.x, y: e.y - 50, vy: -40, life: 1.1, size: 15, color: '#e6f8ff' });
        break;
      case 'snowHit':
        P.burst(e.x, e.y, { count: 14, speed: 220, life: 0.5, size: 3.2, color: '#ffffff', gravity: 600 });
        P.add({ type: 'text', text: e.heal ? '-1' : '1', x: e.x, y: e.y - 24, vy: -60, life: 0.7, size: 16, color: e.heal ? '#8dffb0' : '#fff3c4' });
        break;
      default:
    }
  },
  haze: ['rgba(140,170,230,0)', 'rgba(140,170,230,0.25)'],
  vignette: 0.45,
};
