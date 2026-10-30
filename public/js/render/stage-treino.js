// Cenário do Campo de Treino (tutorial): dia de sol, mais ou menos 13h.
//
//   céu      azul, sol alto com raios girando devagar, nuvens fofas
//   longe    montanhas com neve e uma floresta azulada no pé delas
//   meio     morros de grama cortada, árvores, dojo, torre com bandeira,
//            cerca e ovelhas pastando
//   campo    terra em camadas com pedras e raízes, grama grossa caindo pelas
//            bordas, trepadeiras nas paredes, tábuas de madeira e enfeites
//            (estandartes dos elementos, suporte de armas, alvo, árvores...)
//
// Mesmo formato de PICO_ART (ver stage.js): o que não se mexe é desenhado uma
// vez só; a cada quadro só entram as nuvens, os raios de sol, os
// estandartes balançando, as borboletas e os passarinhos.

import { roundRect, seeded } from './stage-util.js';

const VIEW_W = 1280;
const VIEW_H = 720;
const SUN = { x: 1010, y: 92, r: 42 };
const INK = '#1d2a14';
const GRASS = { deep: '#2c6322', dark: '#3b8a2b', mid: '#58ad39', top: '#7dcf4c', light: '#aeea68', shine: '#dcffa0' };
const DIRT = { top: '#a06d3f', mid: '#83552f', dark: '#5c3b20', deep: '#3e2815', band: '#93643a', band2: '#6d4527' };
const STONE = { light: '#c4bcae', mid: '#968d80', dark: '#615a50' };
const WOOD = { light: '#deaa6e', mid: '#b47c45', dark: '#7a5230', deep: '#4e321b' };
const ELEMENT_COLORS = {
  fogo: ['#ff6a1f', '#ffd25a'],
  agua: ['#2f8cff', '#9fe3ff'],
  terra: ['#8a5a2e', '#d8b27a'],
  ar: ['#7fd6c6', '#ffffff'],
};

// ================================================================ céu

function paintSky(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, '#2468c9');
  sky.addColorStop(0.32, '#4a97e4');
  sky.addColorStop(0.62, '#8ccaf5');
  sky.addColorStop(0.85, '#c9eafc');
  sky.addColorStop(1, '#e8f7ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // cirros: riscos finos de nuvem bem lá no alto
  const rand = seeded(5);
  for (let i = 0; i < 7; i++) {
    const x = rand() * VIEW_W;
    const y = 40 + rand() * 170;
    const w = 160 + rand() * 260;
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, `rgba(255,255,255,${0.18 + rand() * 0.18})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.06 + rand() * 0.04);
    ctx.beginPath();
    ctx.ellipse(0, 0, w / 2, 3 + rand() * 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // brilho do sol (duas camadas) e o disco com uma coroa
  for (const [r, a] of [[SUN.r * 9, 0.28], [SUN.r * 3.2, 0.5]]) {
    const glow = ctx.createRadialGradient(SUN.x, SUN.y, SUN.r * 0.5, SUN.x, SUN.y, r);
    glow.addColorStop(0, `rgba(255,251,226,${a})`);
    glow.addColorStop(1, 'rgba(255,248,210,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(SUN.x - r, SUN.y - r, r * 2, r * 2);
  }
  ctx.strokeStyle = 'rgba(255,255,240,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(SUN.x, SUN.y, SUN.r * 1.45, 0, Math.PI * 2);
  ctx.stroke();
  const disc = ctx.createRadialGradient(SUN.x - 10, SUN.y - 10, 4, SUN.x, SUN.y, SUN.r);
  disc.addColorStop(0, '#ffffff');
  disc.addColorStop(0.65, '#fffbe6');
  disc.addColorStop(1, '#ffe8a3');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(SUN.x, SUN.y, SUN.r, 0, Math.PI * 2);
  ctx.fill();

  // reflexos da lente: bolinhas na linha do sol até o meio da tela
  for (const [k, r, c] of [[0.35, 26, '255,240,200,0.10'], [0.55, 12, '200,240,255,0.14'], [0.72, 40, '255,230,255,0.06'], [0.9, 8, '255,255,220,0.18']]) {
    const x = SUN.x + (VIEW_W * 0.42 - SUN.x) * k * 1.6;
    const y = SUN.y + (VIEW_H * 0.5 - SUN.y) * k * 1.6;
    ctx.fillStyle = `rgba(${c})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // fileira de nuvens baixinha no horizonte (aparece entre as montanhas),
  // com bordas macias
  for (let x = -40; x < VIEW_W + 40; x += 40 + rand() * 30) {
    const r = 34 + rand() * 30;
    const y = 300 - r * 0.2 + rand() * 12;
    const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const low = ctx.createLinearGradient(0, 280, 0, 380);
  low.addColorStop(0, 'rgba(255,255,255,0)');
  low.addColorStop(1, 'rgba(255,255,255,0.5)');
  ctx.fillStyle = low;
  ctx.fillRect(0, 280, VIEW_W, 440);
}

// Nuvens fofas: cada formato é desenhado uma vez numa tela pequena e depois
// só copiado (sombra azulada embaixo, luz do sol vindo da direita)
const cloudSprites = new Map();
function cloudSprite(seed) {
  if (cloudSprites.has(seed)) return cloudSprites.get(seed);
  const W = 320;
  const H = 150;
  const canvas = document.createElement('canvas');
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  const rand = seeded(seed * 97 + 13);
  const base = 112;
  const blobs = [];
  const n = 7 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const x = 46 + u * 228 + (rand() - 0.5) * 18;
    const hump = 1 - Math.abs(u - 0.45) * 1.6;
    const r = 20 + hump * 30 + rand() * 10;
    blobs.push([x, base - r * 0.55 - hump * 26, r]);
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, base + 6);
  ctx.clip();
  // sombra
  ctx.fillStyle = '#c4d8ee';
  for (const [x, y, r] of blobs) {
    ctx.beginPath();
    ctx.arc(x, y + 6, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // corpo com luz da direita
  for (const [x, y, r] of blobs) {
    const g = ctx.createRadialGradient(x + r * 0.35, y - r * 0.45, r * 0.1, x, y, r * 1.05);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.6, '#f6faff');
    g.addColorStop(1, '#dbe8f6');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // base reta e suave
  const fade = ctx.createLinearGradient(0, base - 18, 0, base + 6);
  fade.addColorStop(0, 'rgba(196,216,238,0)');
  fade.addColorStop(1, 'rgba(184,206,232,0.9)');
  ctx.fillStyle = fade;
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillRect(0, base - 18, W, 24);
  cloudSprites.set(seed, canvas);
  return canvas;
}

const CLOUDS = [
  // x inicial, y, tamanho, velocidade, formato
  [60, 70, 0.75, 5, 1], [460, 130, 0.55, 3.5, 2], [760, 40, 0.6, 4.2, 3],
  [1150, 150, 0.85, 6, 4], [300, 205, 0.4, 2.6, 5], [960, 230, 0.45, 3, 6],
];

function skyAnimated(ctx, time) {
  // raios de sol girando bem devagar
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(SUN.x, SUN.y);
  ctx.rotate(time * 0.015);
  const rays = ctx.createRadialGradient(0, 0, SUN.r, 0, 0, 760);
  rays.addColorStop(0, 'rgba(255,248,215,0.07)');
  rays.addColorStop(1, 'rgba(255,248,215,0)');
  ctx.fillStyle = rays;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const w = i % 2 ? 0.05 : 0.09;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a - w) * 760, Math.sin(a - w) * 760);
    ctx.lineTo(Math.cos(a + w) * 760, Math.sin(a + w) * 760);
    ctx.closePath();
  }
  ctx.fill();
  ctx.restore();

  for (const [x0, y, s, v, seed] of CLOUDS) {
    const w = 320 * s;
    const x = ((x0 + time * v) % (VIEW_W + w + 100)) - w - 50 + 100;
    ctx.drawImage(cloudSprite(seed), x, y, w, 150 * s);
  }
}

// ================================================================ fundo distante

// Uma montanha: encosta com degraus, lado da sombra mais escuro e neve no
// topo (com sombra azulada do lado esquerdo)
function mountain(ctx, x, base, h, w, color, shadow, snow, rand) {
  const left = [];
  const right = [];
  const steps = 8;
  for (let i = 1; i < steps; i++) {
    const u = i / steps;
    left.push([x - w * u + (rand() - 0.5) * w * 0.08, base - h * (1 - u) + (rand() - 0.5) * h * 0.06]);
    right.push([x + w * u + (rand() - 0.5) * w * 0.08, base - h * (1 - u) + (rand() - 0.5) * h * 0.06]);
  }
  const top = [x, base - h];
  const body = () => {
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
  const g = ctx.createLinearGradient(0, base - h, 0, base);
  g.addColorStop(0, color[0]);
  g.addColorStop(1, color[1]);
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.save();
  body();
  ctx.clip();
  // lado da sombra (o sol está à direita)
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.moveTo(top[0], top[1]);
  for (const p of left) ctx.lineTo(p[0], p[1]);
  ctx.lineTo(x - w, base + 400);
  ctx.lineTo(x - w * 0.1, base + 400);
  ctx.lineTo(x + w * 0.08, base - h * 0.5);
  ctx.closePath();
  ctx.fill();
  if (snow) {
    const cap = 0.3;
    const edge = () => {
      ctx.moveTo(top[0], top[1]);
      ctx.lineTo(x - w * cap, top[1] + h * cap);
      for (let i = 1; i <= 6; i++) ctx.lineTo(x - w * cap + (i / 7) * w * cap * 2, top[1] + h * cap * (i % 2 ? 0.58 : 0.96));
      ctx.lineTo(x + w * cap, top[1] + h * cap);
      ctx.closePath();
    };
    ctx.fillStyle = snow;
    ctx.beginPath();
    edge();
    ctx.fill();
    // metade esquerda da neve na sombra
    ctx.fillStyle = 'rgba(150,180,220,0.45)';
    ctx.beginPath();
    ctx.moveTo(top[0], top[1]);
    ctx.lineTo(x - w * cap, top[1] + h * cap);
    ctx.lineTo(x - w * 0.02, top[1] + h * cap * 0.8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawFar(ctx, map, rand) {
  // cordilheira de trás (mais clara, quase sumindo no céu)
  for (const [x, h, w] of [[-560, 220, 300], [-60, 270, 330], [500, 230, 290], [1060, 290, 340], [1600, 250, 320], [2040, 220, 300]]) {
    mountain(ctx, x, 470, h, w, ['#b4d0ec', '#cfe3f5'], '#9fbfe0', '#f6fbff', rand);
  }
  // cordilheira da frente
  for (const [x, h, w] of [[-300, 170, 250], [240, 195, 260], [780, 160, 230], [1320, 190, 260], [1840, 170, 240]]) {
    mountain(ctx, x, 500, h, w, ['#8eb6db', '#b3d1ea'], '#7aa2c9', '#ffffff', rand);
  }
  // névoa no pé das montanhas
  const fog = ctx.createLinearGradient(0, 330, 0, 430);
  fog.addColorStop(0, 'rgba(225,242,255,0)');
  fog.addColorStop(1, 'rgba(225,242,255,0.85)');
  ctx.fillStyle = fog;
  ctx.fillRect(-800, 330, 2900, 100);
  // floresta azulada lá longe
  for (const [y, color, step, r0] of [[396, '#7ea9a6', 18, 12], [410, '#679a8a', 15, 11]]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-800, 1400);
    for (let x = -800; x <= 2100; x += step) {
      const r = r0 + rand() * 7;
      const yy = y - r + Math.sin(x * 0.004) * 8;
      ctx.lineTo(x, yy + r * 0.6);
      ctx.arc(x + step / 2, yy + r * 0.6, step / 2 + 1, Math.PI, 0);
      if (rand() < 0.25) {
        // pinheiro mais alto no meio das copas
        ctx.lineTo(x + step / 2, yy - r * 1.6);
        ctx.lineTo(x + step, yy + r * 0.6);
      }
    }
    ctx.lineTo(2100, 1400);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(225,242,255,0.15)';
  ctx.fillRect(-800, 380, 2900, 1000);
}

function farAnimated() {}

// ================================================================ fundo médio

const BACK_HILL = (x) => 470 - Math.sin(x * 0.004 + 1.2) * 40 - Math.sin(x * 0.0092 + 1.2) * 12;
const FRONT_HILL = (x) => 540 - Math.sin(x * 0.0055 + 3.4) * 30 - Math.sin(x * 0.0127 + 3.4) * 9;

// Árvore redonda com sombra à esquerda e luz à direita
function oak(ctx, x, y, s, rand, hue = 0) {
  const greens = hue ? ['#4d8a5a', '#5f9c66', '#79b67a', '#9ccf91'] : ['#2f7a32', '#3f923a', '#5bb04a', '#8fd468'];
  ctx.fillStyle = '#5b3d22';
  ctx.beginPath();
  ctx.moveTo(x - 3 * s, y);
  ctx.lineTo(x - 2 * s, y - 22 * s);
  ctx.lineTo(x + 2 * s, y - 22 * s);
  ctx.lineTo(x + 3.5 * s, y);
  ctx.closePath();
  ctx.fill();
  const clumps = [];
  for (let i = 0; i < 6; i++) clumps.push([(rand() - 0.5) * 26 * s, -(28 + rand() * 16) * s, (10 + rand() * 7) * s]);
  ctx.fillStyle = greens[0];
  for (const [dx, dy, r] of clumps) {
    ctx.beginPath();
    ctx.arc(x + dx - r * 0.15, y + dy + r * 0.2, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = greens[1];
  for (const [dx, dy, r] of clumps) {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, r * 0.88, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = greens[2];
  for (const [dx, dy, r] of clumps) {
    ctx.beginPath();
    ctx.arc(x + dx + r * 0.25, y + dy - r * 0.25, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = greens[3];
  for (const [dx, dy, r] of clumps.slice(0, 3)) {
    ctx.beginPath();
    ctx.arc(x + dx + r * 0.4, y + dy - r * 0.45, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Pinheiro em camadas
function pine(ctx, x, y, s, hue = 0) {
  const greens = hue ? ['#3f7a5c', '#5a9a74'] : ['#22603a', '#33804a'];
  ctx.fillStyle = '#5b3d22';
  ctx.fillRect(x - 2 * s, y - 8 * s, 4 * s, 8 * s);
  for (let i = 0; i < 4; i++) {
    const w = (16 - i * 3) * s;
    const yy = y - (8 + i * 11) * s;
    ctx.fillStyle = greens[0];
    ctx.beginPath();
    ctx.moveTo(x - w, yy);
    ctx.lineTo(x, yy - 18 * s);
    ctx.lineTo(x + w, yy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = greens[1];
    ctx.beginPath();
    ctx.moveTo(x, yy - 18 * s);
    ctx.lineTo(x + w, yy);
    ctx.lineTo(x + w * 0.2, yy);
    ctx.closePath();
    ctx.fill();
  }
}

// Morro com degradê e faixas de grama cortada
function hill(ctx, fn, colors, stripe) {
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(-600, 1400);
    for (let x = -600; x <= 1900; x += 16) ctx.lineTo(x, fn(x));
    ctx.lineTo(1900, 1400);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, 400, 0, 760);
  g.addColorStop(0, colors[0]);
  g.addColorStop(1, colors[1]);
  ctx.fillStyle = g;
  path();
  ctx.fill();
  ctx.save();
  path();
  ctx.clip();
  ctx.fillStyle = stripe;
  for (let x = -900; x < 1900; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 1400);
    ctx.lineTo(x + 400, 380);
    ctx.lineTo(x + 445, 380);
    ctx.lineTo(x + 45, 1400);
    ctx.closePath();
    ctx.fill();
  }
  // borda de cima mais clara (luz do sol)
  ctx.strokeStyle = 'rgba(230,255,190,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = -600; x <= 1900; x += 16) ctx.lineTo(x, fn(x) + 1.5);
  ctx.stroke();
  ctx.restore();
}

// Dojo de madeira com telhado vermelho curvado
function dojo(ctx, x, y) {
  ctx.fillStyle = 'rgba(40,70,30,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y, 70, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // paredes
  ctx.fillStyle = '#e9dcc0';
  ctx.fillRect(x - 46, y - 42, 92, 42);
  ctx.fillStyle = '#6e4a2a';
  for (const dx of [-46, -16, 14, 42]) ctx.fillRect(x + dx, y - 42, 4, 42);
  ctx.fillRect(x - 46, y - 44, 92, 4);
  // porta de correr
  ctx.fillStyle = '#c9b48c';
  ctx.fillRect(x - 12, y - 30, 24, 30);
  ctx.strokeStyle = '#6e4a2a';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 12, y - 30, 24, 30);
  ctx.beginPath();
  ctx.moveTo(x, y - 30);
  ctx.lineTo(x, y);
  ctx.stroke();
  // telhado de duas águas com pontas viradas
  for (const [yy, w, c] of [[-44, 66, '#b83a2c'], [-70, 50, '#d04a36']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - w - 8, y + yy + 2);
    ctx.quadraticCurveTo(x - w + 6, y + yy - 4, x - w * 0.6, y + yy - 14);
    ctx.lineTo(x + w * 0.6, y + yy - 14);
    ctx.quadraticCurveTo(x + w - 6, y + yy - 4, x + w + 8, y + yy + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,200,170,0.35)';
    ctx.fillRect(x - w * 0.6, y + yy - 14, w * 1.2, 3);
  }
  ctx.fillStyle = '#e9dcc0';
  ctx.fillRect(x - 30, y - 58, 60, 14);
  ctx.fillStyle = '#6e4a2a';
  ctx.fillRect(x - 30, y - 58, 60, 2);
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.arc(x, y - 52, 4, 0, Math.PI * 2);
  ctx.fill();
}

// Torre de vigia de madeira (a bandeira em cima é animada)
const TOWER = { x: 1210 };
function tower(ctx, x, y) {
  ctx.strokeStyle = '#7a5230';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 18, y);
  ctx.lineTo(x - 10, y - 90);
  ctx.moveTo(x + 18, y);
  ctx.lineTo(x + 10, y - 90);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const k of [0.25, 0.55]) {
    ctx.moveTo(x - 18 + 8 * k * 1.3, y - 90 * k);
    ctx.lineTo(x + 18 - 8 * (k + 0.3), y - 90 * (k + 0.3));
    ctx.moveTo(x + 18 - 8 * k * 1.3, y - 90 * k);
    ctx.lineTo(x - 18 + 8 * (k + 0.3), y - 90 * (k + 0.3));
  }
  ctx.stroke();
  ctx.fillStyle = '#b47c45';
  ctx.fillRect(x - 18, y - 104, 36, 16);
  ctx.fillStyle = '#7a5230';
  for (let i = 0; i < 4; i++) ctx.fillRect(x - 16 + i * 10, y - 104, 2, 16);
  ctx.fillStyle = '#b83a2c';
  ctx.beginPath();
  ctx.moveTo(x - 24, y - 104);
  ctx.lineTo(x, y - 124);
  ctx.lineTo(x + 24, y - 104);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5b3d22';
  ctx.fillRect(x - 1, y - 150, 2, 28);
}

function sheep(ctx, x, y, s, dir) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * s, s);
  ctx.fillStyle = 'rgba(40,70,30,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 1, 13, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a3030';
  for (const dx of [-7, -3, 4, 8]) ctx.fillRect(dx, -6, 2, 7);
  ctx.fillStyle = '#ffffff';
  for (const [dx, dy, r] of [[-7, -10, 6], [0, -12, 7], [7, -10, 6], [-3, -7, 6], [4, -7, 6]]) {
    ctx.beginPath();
    ctx.arc(dx, dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(180,200,220,0.5)';
  ctx.beginPath();
  ctx.ellipse(-2, -5, 10, 3, 0, 0, Math.PI);
  ctx.fill();
  // cabeça baixa comendo grama
  ctx.fillStyle = '#3a3030';
  ctx.beginPath();
  ctx.ellipse(13, -6, 4, 5, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMid(ctx, map, rand) {
  // morro de trás
  hill(ctx, BACK_HILL, ['#a8de80', '#7fbf5a'], 'rgba(255,255,255,0.05)');
  dojo(ctx, 150, BACK_HILL(150) + 6);
  tower(ctx, TOWER.x, BACK_HILL(TOWER.x) + 4);
  for (let i = 0; i < 34; i++) {
    const x = -540 + i * 74 + rand() * 40;
    if (Math.abs(x - 150) < 80 || Math.abs(x - TOWER.x) < 34) continue;
    const y = BACK_HILL(x) + 4;
    const s = 0.65 + rand() * 0.35;
    if (rand() < 0.35) pine(ctx, x, y, s * 0.9, 1);
    else oak(ctx, x, y, s, rand, 1);
  }
  // morro da frente
  hill(ctx, FRONT_HILL, ['#93d66a', '#5fa444'], 'rgba(255,255,255,0.06)');
  // florzinhas espalhadas
  for (let i = 0; i < 260; i++) {
    const x = -560 + rand() * 2400;
    const y = FRONT_HILL(x) + 6 + rand() * 120;
    ctx.fillStyle = ['#ffffff', '#ffe866', '#ffb3d0', '#d9c2ff'][i % 4];
    ctx.globalAlpha = 0.7;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
  // árvores no morro da frente (maiores)
  for (const x of [-380, 40, 420, 980, 1460, 1760]) {
    const y = FRONT_HILL(x) + 6;
    if (rand() < 0.4) pine(ctx, x, y, 1.1);
    else oak(ctx, x, y, 1.15, rand);
  }
  // cerca de madeira acompanhando o morro
  const fy = (x) => FRONT_HILL(x) + 14;
  ctx.lineCap = 'round';
  for (const [dy, w] of [[7, 2.4], [13, 2.4]]) {
    ctx.strokeStyle = '#8a6440';
    ctx.lineWidth = w;
    ctx.beginPath();
    for (let x = -560; x < 1860; x += 12) {
      if (x === -560) ctx.moveTo(x, fy(x) - dy);
      else ctx.lineTo(x, fy(x) - dy);
    }
    ctx.stroke();
  }
  for (let x = -560; x < 1860; x += 38) {
    const y = fy(x);
    ctx.fillStyle = '#7a5532';
    ctx.fillRect(x - 2, y - 19, 4, 19);
    ctx.fillStyle = '#c99a62';
    ctx.fillRect(x - 2, y - 19, 1.5, 19);
    ctx.fillStyle = '#5b3d22';
    ctx.beginPath();
    ctx.moveTo(x - 2.5, y - 19);
    ctx.lineTo(x, y - 22);
    ctx.lineTo(x + 2.5, y - 19);
    ctx.fill();
  }
  // ovelhas pastando
  for (const [x, d] of [[300, 1], [345, -1], [880, 1], [1560, -1], [-200, 1]]) sheep(ctx, x, fy(x) + 26, 0.9, d);
}

function midAnimated(ctx, time) {
  // bandeira da torre de vigia
  const tx = TOWER.x;
  const ty = BACK_HILL(tx) + 4 - 150;
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.moveTo(tx + 1, ty);
  for (let i = 0; i <= 6; i++) {
    const u = i / 6;
    ctx.lineTo(tx + 1 + u * 20, ty + Math.sin(time * 5 - u * 3) * 2 * u);
  }
  for (let i = 6; i >= 0; i--) {
    const u = i / 6;
    ctx.lineTo(tx + 1 + u * 20, ty + 11 - u * 3 + Math.sin(time * 5 - u * 3) * 2 * u);
  }
  ctx.closePath();
  ctx.fill();
  // passarinhos voando ao longe
  ctx.strokeStyle = 'rgba(40,60,80,0.6)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 4; i++) {
    const x = ((time * (24 + i * 5) + i * 420) % 2300) - 450;
    const y = 150 + i * 30 + Math.sin(time * 0.8 + i) * 10;
    const f = Math.sin(time * 9 + i * 2) * 3;
    ctx.beginPath();
    ctx.moveTo(x - 7, y - f);
    ctx.quadraticCurveTo(x - 3, y - 3, x, y);
    ctx.quadraticCurveTo(x + 3, y - 3, x + 7, y - f);
    ctx.stroke();
  }
}

// ================================================================ campo (mundo)

// Pedra com luz em cima à direita e sombra embaixo à esquerda
function stone(ctx, x, y, r, rand, colors = STONE) {
  const n = 7;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 0.75 + rand() * 0.3;
    pts.push([x + Math.cos(a) * r * k * 1.25, y + Math.sin(a) * r * k * 0.85]);
  }
  const path = () => {
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
  };
  ctx.fillStyle = colors.mid;
  path();
  ctx.fill();
  ctx.save();
  path();
  ctx.clip();
  ctx.fillStyle = colors.dark;
  ctx.beginPath();
  ctx.ellipse(x - r * 0.4, y + r * 0.5, r * 1.2, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.light;
  ctx.beginPath();
  ctx.ellipse(x + r * 0.35, y - r * 0.4, r * 0.6, r * 0.35, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(30,20,10,0.55)';
  ctx.lineWidth = 1.2;
  path();
  ctx.stroke();
}

// Lados livres do bloco (sem outro bloco encostado), para as trepadeiras
function exposedSides(s, solids) {
  const touches = (x) => solids.some((o) => o !== s && (Math.abs(o.x + o.w - x) < 3 || Math.abs(o.x - x) < 3) && o.y < s.y + 40 && o.y + o.h > s.y);
  return { left: !touches(s.x), right: !touches(s.x + s.w) };
}

// Trepadeira descendo pela parede, com folhinhas
function vine(ctx, x, y, len, dir, rand) {
  ctx.strokeStyle = GRASS.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  const pts = [];
  for (let d = 0; d <= len; d += 6) {
    const px = x + dir * (Math.sin(d * 0.12 + rand() * 0.6) * 3 + 1.5);
    pts.push([px, y + d]);
    ctx.lineTo(px, y + d);
  }
  ctx.stroke();
  for (let i = 1; i < pts.length; i += 2) {
    const [px, py] = pts[i];
    const side = i % 4 === 1 ? 1 : -1;
    ctx.fillStyle = rand() < 0.5 ? GRASS.mid : GRASS.dark;
    ctx.beginPath();
    ctx.ellipse(px + side * 4, py, 4, 2.4, side * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // florzinha na ponta de algumas
  if (rand() < 0.4) {
    const [px, py] = pts[pts.length - 1];
    ctx.fillStyle = rand() < 0.5 ? '#ffffff' : '#ff9ac0';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(px + Math.cos(a) * 2.4, py + Math.sin(a) * 2.4, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Grama grossa por cima do bloco: borda de baixo em "ondinhas", caindo
// pelos cantos, com folhas em pé e trevinhos
function grassCap(ctx, s, rand, sides) {
  const top = s.y;
  const x0 = s.x - 5;
  const x1 = s.x + s.w + 5;
  // ondinhas da borda de baixo (sorteadas uma vez, usadas em todas as camadas)
  const bumps = [];
  for (let x = x1 - 12; x > x0 + 8; x -= 11 + rand() * 6) bumps.push([x, 11 + rand() * 6]);
  const path = (drop) => {
    ctx.beginPath();
    ctx.moveTo(x0, top - 3);
    ctx.lineTo(x1, top - 3);
    // canto direito caindo pela parede
    ctx.quadraticCurveTo(x1 + 2, top + 6, x1 - 1, top + (sides.right ? 22 : 12) + drop);
    for (const [bx, by] of bumps) ctx.quadraticCurveTo(bx + 5, top + by + 6 + drop, bx, top + by + drop);
    ctx.quadraticCurveTo(x0 - 2, top + 16 + drop, x0 + 1, top + (sides.left ? 22 : 12) + drop);
    ctx.quadraticCurveTo(x0 - 2, top + 6, x0, top - 3);
    ctx.closePath();
  };
  // sombra da grama na terra
  const shade = ctx.createLinearGradient(0, top + 8, 0, top + 46);
  shade.addColorStop(0, 'rgba(30,14,4,0.45)');
  shade.addColorStop(1, 'rgba(30,14,4,0)');
  ctx.fillStyle = shade;
  ctx.fillRect(s.x, top + 8, s.w, 38);
  // camadas: escura embaixo, meio, faixa clara em cima
  ctx.fillStyle = GRASS.deep;
  path(4);
  ctx.fill();
  ctx.fillStyle = GRASS.dark;
  path(0);
  ctx.fill();
  const g = ctx.createLinearGradient(0, top - 3, 0, top + 14);
  g.addColorStop(0, GRASS.light);
  g.addColorStop(0.35, GRASS.top);
  g.addColorStop(1, GRASS.mid);
  ctx.fillStyle = g;
  roundRect(ctx, x0 + 1, top - 3, x1 - x0 - 2, 12, 5);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  path(4);
  ctx.stroke();
  // brilho de cima
  ctx.fillStyle = GRASS.shine;
  ctx.fillRect(s.x, top - 3, s.w, 1.6);
  // folhas em pé (3 tons)
  for (let x = s.x - 2; x < s.x + s.w + 2; x += 3 + rand() * 3) {
    const h = 3 + rand() * 8;
    const lean = (rand() - 0.5) * 5;
    ctx.fillStyle = [GRASS.mid, GRASS.top, GRASS.light][Math.floor(rand() * 3)];
    ctx.beginPath();
    ctx.moveTo(x - 1.6, top - 1);
    ctx.quadraticCurveTo(x + lean * 0.3, top - h * 0.6, x + lean, top - 1 - h);
    ctx.quadraticCurveTo(x + lean * 0.3 + 1, top - h * 0.5, x + 1.6, top - 1);
    ctx.closePath();
    ctx.fill();
  }
  // fios de grama caindo pela borda das ondinhas
  for (const [bx, by] of bumps) {
    for (let k = 0; k < 3; k++) {
      const fx = bx - 4 + k * 4 + (rand() - 0.5) * 2;
      const len = 4 + rand() * 7;
      ctx.strokeStyle = k === 1 ? GRASS.dark : GRASS.deep;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(fx, top + by + 2);
      ctx.quadraticCurveTo(fx + (rand() - 0.5) * 4, top + by + 2 + len * 0.6, fx + (rand() - 0.5) * 3, top + by + 2 + len);
      ctx.stroke();
    }
  }
  // tufos mais altos, em leque
  for (let x = s.x + 20 + rand() * 40; x < s.x + s.w - 10; x += 55 + rand() * 70) {
    const n = 5 + Math.floor(rand() * 3);
    for (let k = 0; k < n; k++) {
      const a = -0.6 + (k / (n - 1)) * 1.2 + (rand() - 0.5) * 0.15;
      const h = 9 + rand() * 9 - Math.abs(a) * 5;
      const tx = x + Math.sin(a) * h;
      const ty = top - 1 - Math.cos(a) * h;
      ctx.fillStyle = k % 2 ? GRASS.top : GRASS.mid;
      ctx.beginPath();
      ctx.moveTo(x - 1.8, top);
      ctx.quadraticCurveTo(x + Math.sin(a) * h * 0.4, top - h * 0.5, tx, ty);
      ctx.quadraticCurveTo(x + Math.sin(a) * h * 0.4 + 1.5, top - h * 0.45, x + 1.8, top);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = GRASS.shine;
    ctx.fillRect(x - 0.5, top - 12, 1, 6);
  }
  // trevinhos e florzinhas no meio da grama
  for (let i = 0; i < s.w / 60; i++) {
    const x = s.x + 10 + rand() * (s.w - 20);
    if (rand() < 0.5) {
      ctx.fillStyle = GRASS.dark;
      for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2.5]]) {
        ctx.beginPath();
        ctx.arc(x + dx, top - 4 + dy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = ['#ffffff', '#ffe866', '#ff9ac0'][Math.floor(rand() * 3)];
      ctx.beginPath();
      ctx.arc(x, top - 7, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ---------------------------------------------------------------- terra

// Camadas do chão, de cima para baixo: terra escura (húmus) com raízes,
// argila alaranjada com riscos de sedimento, cascalho com pedras e, no fundo,
// rocha escura com cristais dos 4 elementos
const SOIL = [
  { from: 0, top: '#7c5131', bottom: '#6a4328', kind: 'humus' },
  { from: 64, top: '#b9824a', bottom: '#a06b3b', kind: 'argila' },
  { from: 150, top: '#8a6040', bottom: '#6b4a31', kind: 'cascalho' },
  { from: 250, top: '#55392a', bottom: '#2c1d14', kind: 'rocha' },
];

// Linha ondulada de separação entre duas camadas
function wavy(x0, x1, y, amp, phase) {
  const pts = [];
  for (let x = x0 - 10; x <= x1 + 10; x += 8) pts.push([x, y + Math.sin(x * 0.021 + phase) * amp + Math.sin(x * 0.067 + phase * 2) * amp * 0.35]);
  return pts;
}

function soil(ctx, s, bottom, rand) {
  const x0 = s.x;
  const x1 = s.x + s.w;
  const depth = bottom - s.y;
  // cada camada: preenche da sua linha ondulada até o fim do bloco
  const lines = SOIL.map((l, i) => (i === 0 ? null : wavy(x0, x1, s.y + l.from, 6 + rand() * 4, rand() * 10)));
  SOIL.forEach((l, i) => {
    if (l.from > depth) return;
    const g = ctx.createLinearGradient(0, s.y + l.from, 0, s.y + (SOIL[i + 1]?.from ?? l.from + 200));
    g.addColorStop(0, l.top);
    g.addColorStop(1, l.bottom);
    ctx.fillStyle = g;
    ctx.beginPath();
    if (lines[i]) {
      lines[i].forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    } else {
      ctx.moveTo(x0 - 10, s.y);
      ctx.lineTo(x1 + 10, s.y);
    }
    ctx.lineTo(x1 + 10, bottom + 10);
    ctx.lineTo(x0 - 10, bottom + 10);
    ctx.closePath();
    ctx.fill();
  });

  // textura de cada camada
  const span = (i) => [s.y + SOIL[i].from, s.y + (SOIL[i + 1]?.from ?? depth)];
  const area = (i) => {
    const [a, b] = span(i);
    return Math.max(0, Math.min(b, bottom) - a) * s.w;
  };
  // húmus: grãozinhos, raizinhas e de vez em quando uma minhoca
  {
    const [a] = span(0);
    for (let i = 0; i < area(0) / 90; i++) {
      ctx.fillStyle = rand() < 0.6 ? 'rgba(40,22,10,0.45)' : 'rgba(170,120,80,0.35)';
      ctx.fillRect(x0 + rand() * s.w, a + 14 + rand() * 50, 1.6 + rand() * 1.6, 1.6);
    }
    for (let i = 0; i < s.w / 45; i++) {
      let x = x0 + 8 + rand() * (s.w - 16);
      let y = a + 12;
      ctx.strokeStyle = `rgba(${rand() < 0.5 ? '232,200,150' : '70,40,18'},0.6)`;
      ctx.lineWidth = 0.8 + rand() * 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0, n = 2 + Math.floor(rand() * 5); k < n; k++) {
        const nx = x + (rand() - 0.5) * 14;
        const ny = y + 6 + rand() * 9;
        ctx.quadraticCurveTo(x + (rand() - 0.5) * 8, (y + ny) / 2, nx, ny);
        x = nx;
        y = ny;
      }
      ctx.stroke();
    }
    if (rand() < 0.7) {
      const wx = x0 + 30 + rand() * (s.w - 60);
      const wy = a + 34 + rand() * 18;
      ctx.strokeStyle = '#e48a8a';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.bezierCurveTo(wx + 5, wy - 5, wx + 9, wy + 5, wx + 15, wy);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  // argila: riscos de sedimento e rachadinhas
  if (SOIL[1].from < depth) {
    const [a, b] = span(1);
    for (let i = 0; i < area(1) / 700; i++) {
      const x = x0 + rand() * s.w;
      const y = a + 10 + rand() * (Math.min(b, bottom) - a - 14);
      const w = 10 + rand() * 30;
      ctx.strokeStyle = rand() < 0.5 ? 'rgba(255,220,170,0.35)' : 'rgba(110,60,25,0.35)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + w / 2, y + (rand() - 0.5) * 3, x + w, y);
      ctx.stroke();
    }
    for (let i = 0; i < s.w / 160; i++) {
      let x = x0 + rand() * s.w;
      let y = a + 6;
      ctx.strokeStyle = 'rgba(80,45,20,0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 4; k++) {
        x += (rand() - 0.5) * 10;
        y += 5 + rand() * 7;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  // cascalho: bastante pedra de todo tipo, em grupinhos
  if (SOIL[2].from < depth) {
    const [a, b] = span(2);
    const n = area(2) / 1400;
    for (let i = 0; i < n; i++) {
      const cx = x0 + 10 + rand() * (s.w - 20);
      const cy = a + 12 + rand() * Math.max(4, Math.min(b, bottom) - a - 16);
      cobble(ctx, cx, cy, 2.5 + rand() * 5, rand);
      if (rand() < 0.4) cobble(ctx, cx + 6 + rand() * 5, cy + 2, 2 + rand() * 3, rand);
    }
  }
  // pedras grandes espalhadas pelas camadas de cima
  for (let i = 0; i < s.w / 110; i++) {
    const y = s.y + 30 + rand() * Math.min(depth - 40, 220);
    cobble(ctx, x0 + 14 + rand() * (s.w - 28), y, 6 + rand() * 7, rand);
  }
  // rocha do fundo: pedregulhos escuros e cristais brilhando (os cristais
  // vão por último, por cima da sombra do fundo)
  const crystals = [];
  if (SOIL[3].from < depth) {
    const [a] = span(3);
    const deepH = Math.min(bottom, s.y + 600) - a;
    for (let i = 0; i < (s.w * deepH) / 11000; i++) {
      cobble(ctx, x0 + rand() * s.w, a + 14 + rand() * deepH, 7 + rand() * 13, rand, ['#6e5e52', '#9a887a', '#463a32']);
    }
    for (let i = 0; i < Math.max(1, s.w / 200); i++) {
      crystals.push([x0 + 20 + rand() * (s.w - 40), a + 30 + rand() * Math.max(10, deepH - 50), BANNER_ORDER[Math.floor(rand() * 4)]]);
    }
  }

  // linhas entre as camadas: sombra embaixo e luz em cima
  lines.forEach((pts, i) => {
    if (!pts || SOIL[i].from > depth) return;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(30,14,4,0.35)';
    ctx.beginPath();
    pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y + 1.5) : ctx.moveTo(x, y + 1.5)));
    ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(255,225,180,0.25)';
    ctx.beginPath();
    pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y - 1) : ctx.moveTo(x, y - 1)));
    ctx.stroke();
  });

  // sombra embaixo da grama e volume (sol vindo da direita)
  const ao = ctx.createLinearGradient(0, s.y + 6, 0, s.y + 50);
  ao.addColorStop(0, 'rgba(25,10,2,0.5)');
  ao.addColorStop(1, 'rgba(25,10,2,0)');
  ctx.fillStyle = ao;
  ctx.fillRect(x0, s.y + 6, s.w, 44);
  const side = ctx.createLinearGradient(x0, 0, x0 + 60, 0);
  side.addColorStop(0, 'rgba(20,8,0,0.4)');
  side.addColorStop(1, 'rgba(20,8,0,0)');
  ctx.fillStyle = side;
  ctx.fillRect(x0, s.y, 60, depth);
  const lit = ctx.createLinearGradient(x1 - 40, 0, x1, 0);
  lit.addColorStop(0, 'rgba(255,220,170,0)');
  lit.addColorStop(1, 'rgba(255,220,170,0.22)');
  ctx.fillStyle = lit;
  ctx.fillRect(x1 - 40, s.y, 40, depth);
  // mais fundo = mais escuro
  const deep = ctx.createLinearGradient(0, s.y + 160, 0, s.y + 420);
  deep.addColorStop(0, 'rgba(10,4,0,0)');
  deep.addColorStop(1, 'rgba(10,4,0,0.45)');
  ctx.fillStyle = deep;
  ctx.fillRect(x0, s.y + 160, s.w, Math.max(0, depth - 160));
  for (const [x, y, el] of crystals) crystal(ctx, x, y, el, rand);
}

// Pedra arredondada meio enterrada: sombra de terra embaixo, luz em cima à
// direita, uma rachadinha de vez em quando
function cobble(ctx, x, y, r, rand, palette) {
  const colors = palette ?? [
    ['#a49a8c', '#c9c0b2', '#6f675c'],
    ['#b39a7c', '#d9c4a6', '#7a6550'],
    ['#9a7f74', '#c4aaa0', '#66504a'],
    ['#8d9196', '#bcc0c4', '#5d6166'],
  ][Math.floor(rand() * 4)];
  const [base, light, dark] = Array.isArray(colors[0]) ? colors[0] : colors;
  const rx = r * (1.1 + rand() * 0.4);
  const ry = r * (0.75 + rand() * 0.2);
  const rot = (rand() - 0.5) * 0.6;
  // buraco/sombra na terra
  ctx.fillStyle = 'rgba(30,14,4,0.45)';
  ctx.beginPath();
  ctx.ellipse(x - 1, y + 2, rx + 1.5, ry + 1.5, rot, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(x - rx * 0.35, y + ry * 0.55, rx, ry * 0.7, rot, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.ellipse(x + rx * 0.3, y - ry * 0.4, rx * 0.5, ry * 0.32, rot - 0.3, 0, Math.PI * 2);
  ctx.fill();
  if (r > 5 && rand() < 0.4) {
    ctx.strokeStyle = dark;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(x - rx * 0.2, y - ry);
    ctx.lineTo(x, y - ry * 0.2);
    ctx.lineTo(x - rx * 0.3, y + ry * 0.4);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(25,14,6,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.stroke();
}

// Grupinho de cristais de um elemento, com brilho em volta
function crystal(ctx, x, y, el, rand) {
  const [color, light] = ELEMENT_COLORS[el];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.5, 1.5);
  ctx.translate(-x, -y);
  const glow = ctx.createRadialGradient(x, y, 2, x, y, 26);
  glow.addColorStop(0, light === '#ffffff' ? 'rgba(200,255,245,0.35)' : `${color}55`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 26, y - 26, 52, 52);
  for (const [dx, h, w, a] of [[-6, 14, 5, -0.4], [0, 20, 6, 0], [6, 12, 5, 0.45]]) {
    ctx.save();
    ctx.translate(x + dx, y + 6);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w / 2, -h * 0.7);
    ctx.lineTo(0, -h);
    ctx.lineTo(w / 2, -h * 0.7);
    ctx.lineTo(w / 2, 0);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = light;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -h);
    ctx.lineTo(w / 2, -h * 0.7);
    ctx.lineTo(w / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(20,10,5,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w / 2, -h * 0.7);
    ctx.lineTo(0, -h);
    ctx.lineTo(w / 2, -h * 0.7);
    ctx.lineTo(w / 2, 0);
    ctx.stroke();
    ctx.restore();
  }
  // brilhinho
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x + 3, y - 18);
  ctx.lineTo(x + 4, y - 15);
  ctx.lineTo(x + 7, y - 14);
  ctx.lineTo(x + 4, y - 13);
  ctx.lineTo(x + 3, y - 10);
  ctx.lineTo(x + 2, y - 13);
  ctx.lineTo(x - 1, y - 14);
  ctx.lineTo(x + 2, y - 15);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Laterais com torrões de terra saindo um pouco para fora, e contorno
// acompanhando os torrões
function crumblySides(ctx, s, bottom, sides, rand) {
  const end = Math.min(bottom, s.y + 900);
  for (const [free, x, dir] of [[sides.left, s.x, -1], [sides.right, s.x + s.w, 1]]) {
    const pts = [[x, s.y + 6]];
    for (let y = s.y + 14; y < end; y += 10 + rand() * 14) {
      const out = free ? rand() * 4.5 : 0;
      pts.push([x + dir * out, y]);
    }
    pts.push([x, end]);
    if (free) {
      // torrões: cor da camada naquela altura
      ctx.beginPath();
      ctx.moveTo(x, s.y + 6);
      for (let i = 1; i < pts.length; i++) {
        const [px, py] = pts[i];
        const [qx, qy] = pts[i - 1];
        ctx.quadraticCurveTo(qx + dir * 2, (py + qy) / 2, px, py);
      }
      ctx.lineTo(x, end);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, s.y, 0, s.y + 300);
      g.addColorStop(0, '#6a4328');
      g.addColorStop(0.3, '#a06b3b');
      g.addColorStop(0.6, '#6b4a31');
      g.addColorStop(1, '#2c1d14');
      ctx.fillStyle = g;
      ctx.fill();
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const [px, py] = pts[i];
      const [qx, qy] = pts[i - 1];
      ctx.quadraticCurveTo(qx + dir * (free ? 2 : 0), (py + qy) / 2, px, py);
    }
    ctx.stroke();
  }
}

// Bloco de terra em camadas com pedras, raízes e a grama em cima
function block(ctx, s, rand, map) {
  const solids = map.solids;
  const below = s.y + s.h;
  const supported = solids.some((o) => o !== s && Math.abs(o.y - below) < 3 && o.x < s.x + s.w && o.x + o.w > s.x);
  const floating = below < 740 && !supported;
  const bottom = floating || supported ? below : 1000;
  // fundo de piscina (lava ou água em cima): pedra, sem grama
  const basin = map.hazards.some((h) => (h.type === 'lava' || h.type === 'agua') && Math.abs(h.y + h.h - s.y) < 3 && h.x < s.x + s.w && h.x + h.w > s.x);
  if (basin) {
    stoneBasin(ctx, s, rand);
    return;
  }

  if (floating) underside(ctx, s, rand);

  const sides = exposedSides(s, solids);
  ctx.save();
  ctx.beginPath();
  ctx.rect(s.x, s.y, s.w, bottom - s.y);
  ctx.clip();
  soil(ctx, s, bottom, rand);
  ctx.restore();
  crumblySides(ctx, s, bottom, sides, rand);

  // contorno (embaixo só quando o bloco termina na tela)
  if (supported || floating) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(s.x, bottom);
    ctx.lineTo(s.x + s.w, bottom);
    ctx.stroke();
  }

  // trepadeiras nas paredes livres
  const wallH = Math.min(bottom, 760) - s.y;
  for (const [free, x, dir] of [[sides.left, s.x, -1], [sides.right, s.x + s.w, 1]]) {
    if (!free || wallH < 60) continue;
    const count = Math.max(1, Math.round(wallH / 160));
    for (let i = 0; i < count; i++) vine(ctx, x + dir * 1, s.y + 10, 30 + rand() * Math.min(150, wallH - 40), dir, rand);
  }
  grassCap(ctx, s, rand, sides);
}

// Fundo da piscina de lava/água: blocos de pedra com musgo
function stoneBasin(ctx, s, rand) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(s.x, s.y, s.w, 1000 - s.y);
  ctx.clip();
  ctx.fillStyle = '#4b453e';
  ctx.fillRect(s.x, s.y, s.w, 1000 - s.y);
  for (let row = 0; row < 12; row++) {
    const y = s.y + row * 16;
    for (let x = s.x - (row % 2) * 14; x < s.x + s.w; x += 28) {
      const c = ['#7d756a', '#857c70', '#6f685e'][Math.floor(rand() * 3)];
      ctx.fillStyle = c;
      roundRect(ctx, x + 1, y + 1, 26, 14, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x + 3, y + 2, 20, 2);
    }
  }
  // fica mais escuro para baixo (fundo do poço)
  const dark = ctx.createLinearGradient(0, s.y, 0, s.y + 140);
  dark.addColorStop(0, 'rgba(10,6,2,0.15)');
  dark.addColorStop(1, 'rgba(10,6,2,0.7)');
  ctx.fillStyle = dark;
  ctx.fillRect(s.x, s.y, s.w, 1000 - s.y);
  ctx.restore();
}

// Ilha flutuante: parte de baixo de pedra, em ponta, com raízes penduradas
function underside(ctx, s, rand) {
  const bottom = s.y + s.h;
  const pts = [];
  const n = Math.max(4, Math.round(s.w / 36));
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const depth = (1 - (2 * u - 1) ** 2) * 90 + rand() * 16;
    pts.push([s.x + u * s.w, bottom - 4 + depth]);
  }
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(s.x, bottom - 6);
    for (const [x, y] of pts) ctx.lineTo(x, y);
    ctx.lineTo(s.x + s.w, bottom - 6);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, bottom, 0, bottom + 100);
  g.addColorStop(0, '#6e5a46');
  g.addColorStop(1, '#3a2e25');
  ctx.fillStyle = g;
  path();
  ctx.fill();
  ctx.save();
  path();
  ctx.clip();
  for (let i = 0; i < s.w / 18; i++) stone(ctx, s.x + rand() * s.w, bottom + rand() * 70, 4 + rand() * 7, rand, { light: '#9a8a78', mid: '#6e5f50', dark: '#463a30' });
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(s.x, bottom - 6, s.w * 0.3, 120);
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  path();
  ctx.stroke();
  // raízes e musgo pendurados
  for (let i = 1; i < pts.length - 1; i++) {
    if (rand() < 0.4) continue;
    const [x, y] = pts[i];
    ctx.strokeStyle = rand() < 0.5 ? '#5b3d22' : GRASS.deep;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y - 2);
    ctx.bezierCurveTo(x + 6, y + 10, x - 6, y + 20, x + (rand() - 0.5) * 8, y + 18 + rand() * 30);
    ctx.stroke();
  }
}

// Tábua de madeira: duas pranchas com veios, pregos, cordas e musguinho
function plank(ctx, p, rand) {
  const h = 16;
  // vigas de baixo com corda amarrada
  for (const x of [p.x + 18, p.x + p.w - 30]) {
    ctx.fillStyle = WOOD.dark;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, p.y + h - 2);
    ctx.lineTo(x + 12, p.y + h - 2);
    ctx.lineTo(x + 9, p.y + h + 12);
    ctx.lineTo(x + 3, p.y + h + 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#d9c18a';
    ctx.lineWidth = 1.4;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(x - 1, p.y + 3 + k * 4);
      ctx.lineTo(x + 13, p.y + 5 + k * 4);
      ctx.stroke();
    }
  }
  // pranchas
  const boards = [];
  let x = p.x;
  while (x < p.x + p.w - 1) {
    const w = Math.min(p.x + p.w - x, 60 + rand() * 50);
    boards.push([x, w]);
    x += w;
  }
  for (const [bx, bw] of boards) {
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + h);
    g.addColorStop(0, WOOD.light);
    g.addColorStop(0.55, WOOD.mid);
    g.addColorStop(1, WOOD.dark);
    ctx.fillStyle = g;
    ctx.fillRect(bx, p.y, bw, h);
    ctx.strokeStyle = 'rgba(90,55,25,0.5)';
    ctx.lineWidth = 0.9;
    for (let k = 0; k < 2; k++) {
      const yy = p.y + 5 + k * 5;
      ctx.beginPath();
      ctx.moveTo(bx + 3, yy);
      ctx.bezierCurveTo(bx + bw * 0.3, yy - 2, bx + bw * 0.6, yy + 2, bx + bw - 3, yy);
      ctx.stroke();
    }
    if (rand() < 0.5) {
      ctx.fillStyle = 'rgba(80,45,20,0.6)';
      ctx.beginPath();
      ctx.ellipse(bx + bw * (0.3 + rand() * 0.4), p.y + h / 2, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#3a2b20';
    for (const nx of [bx + 5, bx + bw - 5]) {
      ctx.beginPath();
      ctx.arc(nx, p.y + 4, 1.3, 0, Math.PI * 2);
      ctx.arc(nx, p.y + h - 4, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx, p.y + 1);
    ctx.lineTo(bx, p.y + h - 1);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,235,190,0.6)';
  ctx.fillRect(p.x + 2, p.y + 1, p.w - 4, 1.5);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  roundRect(ctx, p.x, p.y, p.w, h, 3);
  ctx.stroke();
  // musguinho pendurado numa ponta
  vine(ctx, p.x + p.w - 8, p.y + h - 2, 12 + rand() * 16, 1, rand);
}

// ---------------------------------------------------------------- enfeites
// Enfeites (não colidem). `d.y` = chão onde ficam (padrão: o chão do campo)

function bigTree(ctx, x, y, rand) {
  // sombra no chão
  ctx.fillStyle = 'rgba(20,50,10,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y - 1, 60, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // tronco com raízes e casca
  const bark = ctx.createLinearGradient(x - 12, 0, x + 12, 0);
  bark.addColorStop(0, '#4a3018');
  bark.addColorStop(0.6, '#7a5432');
  bark.addColorStop(1, '#9a7048');
  ctx.fillStyle = bark;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 20, y);
  ctx.quadraticCurveTo(x - 9, y - 6, x - 8, y - 30);
  ctx.lineTo(x - 7, y - 78);
  ctx.quadraticCurveTo(x - 20, y - 94, x - 30, y - 100);
  ctx.lineTo(x - 26, y - 104);
  ctx.quadraticCurveTo(x - 10, y - 96, x - 2, y - 86);
  ctx.quadraticCurveTo(x + 8, y - 100, x + 24, y - 106);
  ctx.lineTo(x + 27, y - 101);
  ctx.quadraticCurveTo(x + 12, y - 92, x + 8, y - 76);
  ctx.lineTo(x + 9, y - 30);
  ctx.quadraticCurveTo(x + 10, y - 6, x + 22, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(40,24,10,0.55)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) {
    const bx = x - 5 + i * 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, y - 10 - rand() * 10);
    ctx.lineTo(bx + (rand() - 0.5) * 3, y - 40 - rand() * 30);
    ctx.stroke();
  }
  // copa: muitas bolas em 4 tons, luz vindo da direita
  const clumps = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    clumps.push([Math.cos(a) * (34 + rand() * 12), -128 + Math.sin(a) * (24 + rand() * 8), 18 + rand() * 10]);
  }
  clumps.push([0, -132, 34], [-14, -118, 26], [16, -140, 24]);
  const tones = [[GRASS.deep, 0.2, 0.25, 1.05], [GRASS.dark, 0, 0, 0.92], [GRASS.mid, 0.2, -0.25, 0.62], [GRASS.top, 0.38, -0.42, 0.3]];
  for (const [color, ox, oy, k] of tones) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const [dx, dy, r] of clumps) {
      ctx.moveTo(x + dx + r * ox + r * k, y + dy + r * oy);
      ctx.arc(x + dx + r * ox, y + dy + r * oy, r * k, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(29,42,20,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (const [dx, dy, r] of clumps.slice(0, 14)) {
    ctx.moveTo(x + dx + r * 1.05 * Math.cos(1.2), y + dy + r * 1.05 * Math.sin(1.2));
    ctx.arc(x + dx, y + dy, r * 1.05, 1.2, 2.6);
  }
  ctx.stroke();
  // maçãs com brilho
  for (const [dx, dy] of [[-30, -112], [22, -124], [36, -104], [-8, -150], [8, -108]]) {
    ctx.fillStyle = '#d93a2c';
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(x + dx + 1.3, y + dy - 1.3, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function bush(ctx, x, y, rand) {
  const balls = [[-16, -10, 13], [14, -10, 14], [0, -17, 17], [-6, -6, 12], [8, -5, 11]];
  for (const [color, ox, oy, k] of [[GRASS.deep, 0, 2, 1.05], [GRASS.dark, 0, 0, 0.92], [GRASS.mid, 3, -4, 0.55], [GRASS.light, 5, -7, 0.22]]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const [dx, dy, r] of balls) {
      ctx.moveTo(x + dx + ox + r * k, y + dy + oy);
      ctx.arc(x + dx + ox, y + dy + oy, r * k, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  // frutinhas
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = rand() < 0.5 ? '#3c4ad9' : '#d93a6a';
    ctx.beginPath();
    ctx.arc(x - 20 + rand() * 40, y - 6 - rand() * 18, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function flowers(ctx, x, y, rand) {
  for (let i = 0; i < 12; i++) {
    const fx = x + (rand() - 0.5) * 80;
    const h = 8 + rand() * 12;
    ctx.strokeStyle = GRASS.dark;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(fx, y - 2);
    ctx.quadraticCurveTo(fx - 2, y - h * 0.5, fx + (rand() - 0.5) * 3, y - 2 - h);
    ctx.stroke();
    ctx.fillStyle = GRASS.mid;
    ctx.beginPath();
    ctx.ellipse(fx + 3, y - 4 - h * 0.3, 3, 1.4, -0.5, 0, Math.PI * 2);
    ctx.fill();
    const petal = ['#ffffff', '#ffd23f', '#ff7aa8', '#b48cff', '#ff8a4a'][Math.floor(rand() * 5)];
    const cx = fx + (rand() - 0.5) * 3;
    const cy = y - 2 - h;
    ctx.fillStyle = petal;
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * 2.6, cy + Math.sin(a) * 2.6, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = petal === '#ffd23f' ? '#a0521a' : '#ffd23f';
    ctx.beginPath();
    ctx.arc(cx, cy, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function hay(ctx, x, y, rand) {
  ctx.fillStyle = 'rgba(20,50,10,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y - 1, 34, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y - 38, 0, y);
  g.addColorStop(0, '#f2d27a');
  g.addColorStop(1, '#c79a3e');
  ctx.fillStyle = g;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  roundRect(ctx, x - 28, y - 38, 56, 38, 9);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(150,105,30,0.6)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 18; i++) {
    const sx = x - 24 + rand() * 48;
    const sy = y - 34 + rand() * 28;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (rand() - 0.5) * 8, sy + 4 + rand() * 4);
    ctx.stroke();
  }
  ctx.strokeStyle = '#8a3a2a';
  ctx.lineWidth = 2.5;
  for (const dx of [-13, 13]) {
    ctx.beginPath();
    ctx.moveTo(x + dx, y - 38);
    ctx.lineTo(x + dx, y);
    ctx.stroke();
  }
  // palha solta no chão
  ctx.strokeStyle = '#e2bf5c';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const sx = x - 36 + rand() * 72;
    ctx.beginPath();
    ctx.moveTo(sx, y - 1);
    ctx.lineTo(sx + 6, y - 2 - rand() * 2);
    ctx.stroke();
  }
}

function sign(ctx, x, y) {
  ctx.fillStyle = WOOD.dark;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.fillRect(x - 3, y - 54, 6, 54);
  ctx.strokeRect(x - 3, y - 54, 6, 54);
  // placa em forma de seta apontando para a direita
  ctx.beginPath();
  ctx.moveTo(x - 44, y - 80);
  ctx.lineTo(x + 34, y - 80);
  ctx.lineTo(x + 48, y - 65);
  ctx.lineTo(x + 34, y - 50);
  ctx.lineTo(x - 44, y - 50);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, y - 80, 0, y - 50);
  g.addColorStop(0, WOOD.light);
  g.addColorStop(1, WOOD.mid);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90,55,25,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 42, y - 65);
  ctx.lineTo(x + 40, y - 65);
  ctx.stroke();
  ctx.fillStyle = '#3a2410';
  ctx.font = '900 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TREINO', x - 2, y - 64);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#3a2b20';
  for (const nx of [x - 38, x + 28]) {
    ctx.beginPath();
    ctx.arc(nx, y - 74, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Suporte de armas de madeira, com espadas e cajados de treino
function rack(ctx, x, y) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.fillStyle = WOOD.mid;
  for (const dx of [-34, 30]) {
    ctx.fillRect(x + dx, y - 56, 5, 56);
    ctx.strokeRect(x + dx, y - 56, 5, 56);
  }
  for (const yy of [-50, -18]) {
    ctx.fillStyle = WOOD.light;
    ctx.fillRect(x - 38, y + yy, 76, 6);
    ctx.strokeRect(x - 38, y + yy, 76, 6);
  }
  // armas encostadas (inclinadas)
  const items = [[-22, 'espada', '#c7d0dc'], [-8, 'cajado', '#ff6a1f'], [6, 'espada', '#e0e6ee'], [20, 'cajado', '#2f8cff']];
  for (const [dx, kind, color] of items) {
    ctx.save();
    ctx.translate(x + dx, y - 4);
    ctx.rotate(0.12);
    if (kind === 'espada') {
      ctx.fillStyle = WOOD.deep;
      ctx.fillRect(-1.5, -14, 3, 12);
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(-6, -16, 12, 3);
      ctx.fillStyle = color;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-2.5, -16);
      ctx.lineTo(-2.5, -58);
      ctx.lineTo(0, -64);
      ctx.lineTo(2.5, -58);
      ctx.lineTo(2.5, -16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = '#7a5532';
      ctx.fillRect(-2, -64, 4, 64);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, -66, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(1.5, -67.5, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// Alvo de arco e flecha num cavalete, com duas flechas espetadas
function target(ctx, x, y) {
  ctx.strokeStyle = WOOD.dark;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 18, y);
  ctx.lineTo(x - 4, y - 50);
  ctx.moveTo(x + 18, y);
  ctx.lineTo(x + 4, y - 50);
  ctx.moveTo(x, y - 40);
  ctx.lineTo(x + 14, y);
  ctx.stroke();
  for (const [r, c] of [[24, '#f4efe4'], [19, '#d6372e'], [14, '#f4efe4'], [9, '#2f6fd6'], [4.5, '#ffd23f']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(x, y - 54, r * 0.9, r, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y - 54, 21.6, 24, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#5b3d22';
  ctx.lineWidth = 2;
  for (const [ax, ay, a] of [[x + 4, y - 58, -0.5], [x - 8, y - 46, -0.2]]) {
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + Math.cos(a) * 22, ay + Math.sin(a) * 22);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(ax + Math.cos(a) * 22, ay + Math.sin(a) * 22);
    ctx.lineTo(ax + Math.cos(a) * 16 - 3, ay + Math.sin(a) * 16 - 4);
    ctx.lineTo(ax + Math.cos(a) * 14, ay + Math.sin(a) * 14 + 1);
    ctx.fill();
  }
}

function rocks(ctx, x, y, rand) {
  stone(ctx, x - 12, y - 8, 12, rand);
  stone(ctx, x + 10, y - 6, 9, rand);
  stone(ctx, x + 2, y - 15, 7, rand);
  // musgo em cima
  ctx.fillStyle = GRASS.mid;
  ctx.beginPath();
  ctx.ellipse(x - 10, y - 17, 8, 3, -0.2, 0, Math.PI * 2);
  ctx.ellipse(x + 4, y - 21, 5, 2, 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function mushrooms(ctx, x, y, rand) {
  for (const [dx, s] of [[-8, 1], [5, 0.75], [14, 0.55]]) {
    const h = 12 * s;
    ctx.fillStyle = '#f4efe4';
    ctx.fillRect(x + dx - 2 * s, y - h, 4 * s, h);
    ctx.fillStyle = '#d6372e';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x + dx, y - h, 9 * s, 6 * s, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(x + dx + (rand() - 0.5) * 10 * s, y - h - 2 - rand() * 3 * s, 1.3 * s + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Mastro do estandarte (o pano é animado em `front`)
function bannerPole(ctx, x, y) {
  ctx.fillStyle = WOOD.dark;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.fillRect(x - 3, y - 130, 6, 130);
  ctx.strokeRect(x - 3, y - 130, 6, 130);
  ctx.fillRect(x - 26, y - 128, 52, 5);
  ctx.strokeRect(x - 26, y - 128, 52, 5);
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.arc(x, y - 134, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(20,50,10,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y - 1, 16, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

const BANNER_ORDER = ['fogo', 'agua', 'terra', 'ar'];

// Pano do estandarte com o símbolo do elemento, balançando com o vento
function bannerCloth(ctx, x, y, el, time) {
  const [color, light] = ELEMENT_COLORS[el];
  const top = y - 123;
  const len = 70;
  const wave = (u) => Math.sin(time * 2.4 - u * 3 + x) * 5 * u;
  ctx.beginPath();
  ctx.moveTo(x - 22, top);
  ctx.lineTo(x + 22, top);
  for (let i = 1; i <= 8; i++) ctx.lineTo(x + 22 + wave(i / 8), top + (i / 8) * len);
  ctx.lineTo(x + wave(1) + 0, top + len - 12);
  ctx.lineTo(x - 22 + wave(1), top + len);
  for (let i = 8; i >= 1; i--) ctx.lineTo(x - 22 + wave(i / 8), top + (i / 8) * len);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.stroke();
  // faixa clara na borda e símbolo
  const cx = x + wave(0.5);
  const cy = top + 30;
  ctx.fillStyle = light;
  ctx.fillRect(x - 22 + wave(0.05), top + 3, 44, 3);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = light;
  ctx.strokeStyle = light;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  if (el === 'fogo') {
    ctx.moveTo(0, -12);
    ctx.quadraticCurveTo(9, -2, 6, 6);
    ctx.quadraticCurveTo(3, 11, 0, 11);
    ctx.quadraticCurveTo(-8, 10, -7, 2);
    ctx.quadraticCurveTo(-5, -4, -2, -2);
    ctx.quadraticCurveTo(-2, -8, 0, -12);
    ctx.fill();
  } else if (el === 'agua') {
    ctx.moveTo(0, -12);
    ctx.quadraticCurveTo(9, 0, 7, 5);
    ctx.arc(0, 4, 7, 0.1, Math.PI - 0.1);
    ctx.quadraticCurveTo(-9, 0, 0, -12);
    ctx.fill();
  } else if (el === 'terra') {
    ctx.moveTo(-10, 9);
    ctx.lineTo(-3, -6);
    ctx.lineTo(1, 0);
    ctx.lineTo(5, -10);
    ctx.lineTo(11, 9);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.arc(0, 0, 8, 0.3, Math.PI * 1.7);
    ctx.moveTo(-10, 5);
    ctx.quadraticCurveTo(0, 12, 10, 4);
    ctx.stroke();
  }
  ctx.restore();
}

// Borboletas passeando em volta das flores
function butterflies(ctx, map, time) {
  let i = 0;
  for (const d of map.decor ?? []) {
    if (d.type !== 'flores') continue;
    const y0 = (d.y ?? 560) - 40;
    const x = d.x + Math.sin(time * 0.6 + i * 2) * 70 + Math.sin(time * 1.7 + i) * 12;
    const y = y0 + Math.sin(time * 1.3 + i * 3) * 18 + Math.cos(time * 2.9) * 4;
    const flap = Math.abs(Math.sin(time * 16 + i));
    const color = ['#ffd23f', '#ff7aa8', '#9fe3ff'][i % 3];
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 3.5 * flap, -2, 3.8 * flap + 0.6, 3.2, side * 0.5, 0, Math.PI * 2);
      ctx.ellipse(side * 2.6 * flap, 2.2, 2.6 * flap + 0.4, 2.2, -side * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#2a1a10';
    ctx.fillRect(-0.7, -3, 1.4, 6);
    ctx.restore();
    i++;
  }
}

function decor(ctx, d, rand) {
  const y = d.y ?? 560;
  const x = d.x;
  switch (d.type) {
    case 'arvore': bigTree(ctx, x, y, rand); break;
    case 'arbusto': bush(ctx, x, y, rand); break;
    case 'flores': flowers(ctx, x, y, rand); break;
    case 'feno': hay(ctx, x, y, rand); break;
    case 'placa': sign(ctx, x, y); break;
    case 'suporte': rack(ctx, x, y); break;
    case 'alvo': target(ctx, x, y); break;
    case 'pedras': rocks(ctx, x, y, rand); break;
    case 'cogumelos': mushrooms(ctx, x, y, rand); break;
    case 'estandarte': bannerPole(ctx, x, y); break;
    default: break;
  }
}

function drawTerrain(ctx, map, rand) {
  // árvores e estandartes atrás do chão (a grama cobre o pé deles)
  const back = new Set(['arvore', 'estandarte']);
  for (const d of map.decor ?? []) if (back.has(d.type)) decor(ctx, d, rand);
  for (const s of map.solids) block(ctx, s, rand, map);
  for (const p of map.platforms) plank(ctx, p, rand);
  for (const d of map.decor ?? []) if (!back.has(d.type)) decor(ctx, d, rand);
}

export const TREINO_ART = {
  sky: paintSky,
  skyAnimated,
  far: drawFar,
  farAnimated,
  mid: drawMid,
  midAnimated,
  terrain: drawTerrain,
  behind() {},
  // estandartes balançando e borboletas (desenhados a cada quadro)
  front(ctx, map, time) {
    let n = 0;
    for (const d of map.decor ?? []) {
      if (d.type !== 'estandarte') continue;
      bannerCloth(ctx, d.x, d.y ?? 560, d.el ?? BANNER_ORDER[n % 4], time);
      n++;
    }
    butterflies(ctx, map, time);
  },
  haze: ['rgba(255,255,255,0)', 'rgba(225,242,255,0.3)'],
  vignette: 0.18, // de dia as bordas escurecem menos
};
