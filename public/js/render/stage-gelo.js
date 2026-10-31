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
  // fumaça da chaminé subindo
  const cx = CABIN.x + 23;
  const cy = HILL(CABIN.x) + 6 - 66;
  for (let i = 0; i < 6; i++) {
    const u = (time * 0.25 + i / 6) % 1;
    ctx.fillStyle = `rgba(200,210,230,${0.35 * (1 - u)})`;
    ctx.beginPath();
    ctx.arc(cx + u * 30 + Math.sin(time + i) * 4, cy - u * 70, 4 + u * 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ================================================================ campo (mundo)

// Pingentes de gelo pendurados numa borda
function icicles(ctx, x0, x1, y, rand, big = 1) {
  for (let x = x0 + 4; x < x1 - 4; x += 7 + rand() * 9) {
    const len = (6 + rand() * 18) * big;
    const w = 2.5 + rand() * 2;
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
}

// Margem de neve: terra congelada escura embaixo e uma camada grossa de neve
function snowBank(ctx, s, rand) {
  const bottom = 1000;
  const g = ctx.createLinearGradient(0, s.y, 0, s.y + 260);
  g.addColorStop(0, '#4a4558');
  g.addColorStop(1, '#1e1c2a');
  ctx.fillStyle = g;
  ctx.fillRect(s.x, s.y, s.w, bottom - s.y);
  // pedras e manchas de gelo na terra
  for (let i = 0; i < s.w / 14; i++) {
    const x = s.x + rand() * s.w;
    const y = s.y + 30 + rand() * 200;
    ctx.fillStyle = rand() < 0.5 ? 'rgba(120,130,160,0.35)' : 'rgba(200,225,255,0.18)';
    ctx.beginPath();
    ctx.ellipse(x, y, 3 + rand() * 8, 2 + rand() * 4, rand(), 0, Math.PI * 2);
    ctx.fill();
  }
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
  ctx.moveTo(s.x - 6, top - 4);
  ctx.lineTo(s.x + s.w + 6, top - 4);
  ctx.quadraticCurveTo(s.x + s.w + 10, top + 14, s.x + s.w - 2, top + 30);
  for (let x = s.x + s.w - 14; x > s.x + 8; x -= 16 + rand() * 10) ctx.quadraticCurveTo(x + 8, top + 24 + rand() * 8, x, top + 16 + rand() * 6);
  ctx.quadraticCurveTo(s.x - 10, top + 16, s.x - 6, top - 4);
  ctx.closePath();
  ctx.fill();
  const sg = ctx.createLinearGradient(0, top - 8, 0, top + 16);
  sg.addColorStop(0, SNOW.light);
  sg.addColorStop(1, SNOW.mid);
  ctx.fillStyle = sg;
  roundRect(ctx, s.x - 6, top - 8, s.w + 12, 20, 9);
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,60,100,0.7)';
  ctx.lineWidth = 1.6;
  roundRect(ctx, s.x - 6, top - 8, s.w + 12, 20, 9);
  ctx.stroke();
  // brilhinhos e montinhos na neve
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < s.w / 22; i++) {
    const x = s.x + rand() * s.w;
    ctx.beginPath();
    ctx.ellipse(x, top - 7, 6 + rand() * 8, 3 + rand() * 2, 0, Math.PI, 0);
    ctx.fill();
  }
  icicles(ctx, s.x - 4, s.x + 10, top + 24, rand, 1.4);
  icicles(ctx, s.x + s.w - 10, s.x + s.w + 4, top + 24, rand, 1.4);
}

// Gelo do lago: placa transparente com faixa clara em cima, rachaduras,
// bolhas presas e a água escura lá embaixo
function iceSheet(ctx, s, rand) {
  const bottom = 1000;
  ctx.save();
  ctx.beginPath();
  ctx.rect(s.x, s.y, s.w, bottom - s.y);
  ctx.clip();
  const g = ctx.createLinearGradient(0, s.y, 0, s.y + 200);
  g.addColorStop(0, ICE.light);
  g.addColorStop(0.18, ICE.mid);
  g.addColorStop(0.5, ICE.deep);
  g.addColorStop(1, ICE.dark);
  ctx.fillStyle = g;
  ctx.fillRect(s.x, s.y, s.w, bottom - s.y);
  // reflexos diagonais
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let x = s.x - 100; x < s.x + s.w; x += 70 + rand() * 50) {
    ctx.beginPath();
    ctx.moveTo(x, s.y + 140);
    ctx.lineTo(x + 70, s.y);
    ctx.lineTo(x + 92, s.y);
    ctx.lineTo(x + 22, s.y + 140);
    ctx.closePath();
    ctx.fill();
  }
  // bolhas presas no gelo
  for (let i = 0; i < s.w / 12; i++) {
    const x = s.x + rand() * s.w;
    const y = s.y + 20 + rand() * 120;
    const r = 1 + rand() * 3;
    ctx.strokeStyle = 'rgba(230,250,255,0.6)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // rachaduras
  ctx.strokeStyle = 'rgba(240,252,255,0.75)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < s.w / 70; i++) {
    let x = s.x + 20 + rand() * (s.w - 40);
    let y = s.y + 6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      x += (rand() - 0.5) * 30;
      y += 8 + rand() * 14;
      ctx.lineTo(x, y);
      if (rand() < 0.4) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + (rand() - 0.5) * 24, y + 6 + rand() * 8);
        ctx.moveTo(x, y);
      }
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
  for (let i = 0; i < s.w / 60; i++) {
    const x = s.x + rand() * (s.w - 50);
    ctx.beginPath();
    ctx.moveTo(x, s.y + 1 + rand() * 3);
    ctx.quadraticCurveTo(x + 25, s.y + 4, x + 50, s.y + 1 + rand() * 3);
    ctx.stroke();
  }
}

// Fundo do buraco no gelo: pedra escura e gelada
function holeBottom(ctx, s) {
  const g = ctx.createLinearGradient(0, s.y, 0, s.y + 160);
  g.addColorStop(0, '#0e2440');
  g.addColorStop(1, '#040a16');
  ctx.fillStyle = g;
  ctx.fillRect(s.x, s.y, s.w, 1000 - s.y);
}

// Plataforma de gelo com pingentes embaixo
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

function drawTerrain(ctx, map, rand) {
  // pinheirinhos nevados atrás das margens
  for (const s of map.solids) {
    if (s.ice || map.hazards.some((h) => Math.abs(h.y + h.h - s.y) < 3)) continue;
    for (let i = 0; i < 2; i++) snowyPine(ctx, s.x + 30 + i * (s.w - 60), s.y + 4, 1.4 + rand() * 0.3);
  }
  for (const s of map.solids) {
    if (map.hazards.some((h) => Math.abs(h.y + h.h - s.y) < 3 && h.x < s.x + s.w && h.x + h.w > s.x)) holeBottom(ctx, s);
    else if (s.ice) iceSheet(ctx, s, rand);
    else snowBank(ctx, s, rand);
  }
  for (const p of map.platforms) icePlatform(ctx, p, rand);
  // bonecos de neve nas margens
  const banks = map.solids.filter((s) => !s.ice && s.h > 170);
  if (banks[0]) snowman(ctx, banks[0].x + banks[0].w * 0.55, banks[0].y - 6);
  if (banks[1]) snowman(ctx, banks[1].x + banks[1].w * 0.45, banks[1].y - 6);
}

export const GELO_ART = {
  sky: paintSky,
  skyAnimated,
  far: drawFar,
  farAnimated,
  mid: drawMid,
  midAnimated,
  terrain: drawTerrain,
  behind() {},
  // brilhinhos piscando na superfície do gelo
  front(ctx, map, time) {
    for (const s of map.solids) {
      if (!s.ice) continue;
      for (let i = 0; i < 5; i++) {
        const x = s.x + ((i * 97 + Math.floor(time * 0.7 + i) * 53) % s.w);
        const tw = Math.max(0, Math.sin(time * 3 + i * 1.7));
        if (tw < 0.2) continue;
        ctx.fillStyle = `rgba(255,255,255,${tw})`;
        ctx.fillRect(x - 4 * tw, s.y - 1, 8 * tw, 1);
        ctx.fillRect(x - 0.5, s.y - 4 * tw - 1, 1, 8 * tw);
      }
    }
  },
  haze: ['rgba(140,170,230,0)', 'rgba(140,170,230,0.25)'],
  vignette: 0.45,
};
