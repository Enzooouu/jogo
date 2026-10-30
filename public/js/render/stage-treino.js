// Cenário do Campo de Treino (tutorial): dia de sol, mais ou menos 13h.
// Céu azul com o sol alto, montanhas azuladas lá longe, morros verdes com
// árvores e o campo de grama onde se treina. Mesmo formato de PICO_ART
// (ver stage.js): o que não se mexe é desenhado uma vez só.

import { roundRect } from './stage-util.js';

const VIEW_W = 1280;
const VIEW_H = 720;
const SUN = { x: 1010, y: 92, r: 44 };
const INK = '#1d2a14';
const GRASS = { top: '#7ccf4f', light: '#b4ee6e', mid: '#5daa3c', dark: '#3d7c2a' };
const DIRT = { light: '#a8774a', mid: '#8a5d36', dark: '#5e3c22', deep: '#432a17' };

// ---------------------------------------------------------------- céu

function paintSky(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, '#2f7fd6');
  sky.addColorStop(0.45, '#6fb5ef');
  sky.addColorStop(0.8, '#bfe3fb');
  sky.addColorStop(1, '#e4f5ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // brilho em volta do sol
  const glow = ctx.createRadialGradient(SUN.x, SUN.y, SUN.r * 0.6, SUN.x, SUN.y, SUN.r * 7);
  glow.addColorStop(0, 'rgba(255,250,220,0.75)');
  glow.addColorStop(0.25, 'rgba(255,245,200,0.25)');
  glow.addColorStop(1, 'rgba(255,245,200,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // sol
  const disc = ctx.createRadialGradient(SUN.x - 8, SUN.y - 8, 4, SUN.x, SUN.y, SUN.r);
  disc.addColorStop(0, '#ffffff');
  disc.addColorStop(0.7, '#fff8d8');
  disc.addColorStop(1, '#ffe9a0');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(SUN.x, SUN.y, SUN.r, 0, Math.PI * 2);
  ctx.fill();
}

function puff(ctx, x, y, s) {
  // nuvem fofa: sombra embaixo, corpo branco e brilho em cima
  const blobs = [[-1.2, 0.15, 0.55], [-0.5, -0.25, 0.75], [0.35, -0.35, 0.85], [1.1, 0.05, 0.6], [0, 0.2, 0.7]];
  ctx.fillStyle = 'rgba(170,200,230,0.55)';
  for (const [bx, by, r] of blobs) {
    ctx.beginPath();
    ctx.arc(x + bx * s, y + by * s + s * 0.18, r * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  for (const [bx, by, r] of blobs) {
    ctx.beginPath();
    ctx.arc(x + bx * s, y + by * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillRect(x - 1.6 * s, y + 0.1 * s, 3.2 * s, 0.75 * s);
}

function skyAnimated(ctx, time) {
  // nuvens passando devagar (o tempo de cada uma é diferente)
  const clouds = [[120, 150, 30, 6], [520, 90, 22, 4], [820, 200, 26, 5], [1180, 130, 34, 7], [300, 260, 18, 3]];
  for (const [x0, y, s, v] of clouds) {
    const x = ((x0 + time * v) % (VIEW_W + 300)) - 150;
    puff(ctx, x, y, s);
  }
}

// ---------------------------------------------------------------- fundo distante

// Uma montanha: encosta com degraus, lado da sombra mais escuro e neve no
// topo que acompanha o formato do pico
function mountain(ctx, x, base, h, w, color, shadow, snow, rand) {
  const left = [];
  const right = [];
  const steps = 7;
  for (let i = 1; i < steps; i++) {
    const u = i / steps;
    left.push([x - w * u + (rand() - 0.5) * w * 0.08, base - h * (1 - u) + (rand() - 0.5) * h * 0.06]);
    right.push([x + w * u + (rand() - 0.5) * w * 0.08, base - h * (1 - u) + (rand() - 0.5) * h * 0.06]);
  }
  const top = [x, base - h];
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - w, base);
  for (const p of [...left].reverse()) ctx.lineTo(p[0], p[1]);
  ctx.lineTo(top[0], top[1]);
  for (const p of right) ctx.lineTo(p[0], p[1]);
  ctx.lineTo(x + w, base);
  ctx.closePath();
  ctx.fill();
  // lado da sombra (o sol está à direita, então a sombra fica à esquerda)
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.moveTo(top[0], top[1]);
  for (const p of left) ctx.lineTo(p[0], p[1]);
  ctx.lineTo(x - w, base);
  ctx.lineTo(x - w * 0.15, base);
  ctx.lineTo(x + w * 0.05, base - h * 0.45);
  ctx.closePath();
  ctx.fill();
  if (!snow) return;
  // neve: desce um pouco pelas encostas, com a borda em ziguezague
  const cap = 0.28;
  ctx.fillStyle = snow;
  ctx.beginPath();
  ctx.moveTo(top[0], top[1]);
  ctx.lineTo(x - w * cap, top[1] + h * cap);
  for (let i = 1; i <= 5; i++) ctx.lineTo(x - w * cap + (i / 6) * w * cap * 2, top[1] + h * cap * (i % 2 ? 0.6 : 0.95));
  ctx.lineTo(x + w * cap, top[1] + h * cap);
  ctx.closePath();
  ctx.fill();
}

function drawFar(ctx, map, rand) {
  // montanhas azuladas lá longe, com neve no topo (as de trás mais claras)
  for (const [x, h, w] of [[-420, 300, 330], [80, 360, 380], [620, 280, 300], [1080, 380, 400], [1620, 320, 360]]) {
    mountain(ctx, x, 520, h, w, '#a9c8e6', '#93b5d8', '#f4fbff', rand);
  }
  for (const [x, h, w] of [[-160, 210, 260], [360, 240, 280], [860, 190, 240], [1360, 230, 280], [1900, 200, 250]]) {
    mountain(ctx, x, 540, h, w, '#8db4d8', '#7aa2c9', 'rgba(244,251,255,0.95)', rand);
  }
  // névoa no pé das montanhas
  const fog = ctx.createLinearGradient(0, 420, 0, 560);
  fog.addColorStop(0, 'rgba(225,242,255,0)');
  fog.addColorStop(1, 'rgba(225,242,255,0.8)');
  ctx.fillStyle = fog;
  ctx.fillRect(-800, 420, 2900, 980);
}

function farAnimated() {}

// ---------------------------------------------------------------- fundo médio

function tree(ctx, x, y, s, rand) {
  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(x - 3 * s, y - 22 * s, 6 * s, 22 * s);
  const greens = ['#3f8a3a', '#4f9d40', '#5fb34a'];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = greens[i];
    ctx.beginPath();
    ctx.arc(x + (rand() - 0.5) * 10 * s, y - (30 + i * 6) * s, (16 - i * 3) * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMid(ctx, map, rand) {
  // dois morros verdes ondulados
  const hill = (base, amp, color, k, shift) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-600, 1400);
    for (let x = -600; x <= 1900; x += 20) ctx.lineTo(x, base - Math.sin(x * k + shift) * amp - Math.sin(x * k * 2.3 + shift) * amp * 0.3);
    ctx.lineTo(1900, 1400);
    ctx.closePath();
    ctx.fill();
  };
  hill(470, 40, '#8fcf6a', 0.004, 1.2);
  // árvores no morro de trás
  for (let i = 0; i < 26; i++) {
    const x = -500 + i * 95 + rand() * 40;
    const y = 470 - Math.sin(x * 0.004 + 1.2) * 40 - Math.sin(x * 0.0092 + 1.2) * 12 + 4;
    tree(ctx, x, y, 0.7 + rand() * 0.3, rand);
  }
  hill(540, 30, '#76bd55', 0.0055, 3.4);
  // cerca de madeira no morro da frente
  ctx.strokeStyle = '#a07a4e';
  ctx.lineWidth = 3;
  for (let x = -500; x < 1800; x += 34) {
    const y = 540 - Math.sin(x * 0.0055 + 3.4) * 30 - Math.sin(x * 0.0127 + 3.4) * 9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 16);
    ctx.stroke();
  }
  ctx.lineWidth = 2;
  for (const dy of [6, 12]) {
    ctx.beginPath();
    for (let x = -500; x < 1800; x += 17) {
      const y = 540 - Math.sin(x * 0.0055 + 3.4) * 30 - Math.sin(x * 0.0127 + 3.4) * 9 - dy;
      if (x === -500) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // tenda listrada do campo de treino
  const tx = 1500;
  const ty = 540 - Math.sin(tx * 0.0055 + 3.4) * 30 - 6;
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? '#f4efe4' : '#d9473a';
    ctx.beginPath();
    ctx.moveTo(tx, ty - 60);
    ctx.lineTo(tx - 50 + i * (100 / 6), ty);
    ctx.lineTo(tx - 50 + (i + 1) * (100 / 6), ty);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(tx - 1.5, ty - 78, 3, 20);
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.moveTo(tx + 1.5, ty - 78);
  ctx.lineTo(tx + 16, ty - 73);
  ctx.lineTo(tx + 1.5, ty - 68);
  ctx.fill();
}

function midAnimated(ctx, time) {
  // passarinhos voando ao longe
  ctx.strokeStyle = 'rgba(40,60,80,0.6)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 3; i++) {
    const x = ((time * (26 + i * 5) + i * 400) % 2200) - 400;
    const y = 180 + i * 34 + Math.sin(time * 0.8 + i) * 10;
    const f = Math.sin(time * 9 + i * 2) * 3;
    ctx.beginPath();
    ctx.moveTo(x - 7, y - f);
    ctx.quadraticCurveTo(x - 3, y - 3, x, y);
    ctx.quadraticCurveTo(x + 3, y - 3, x + 7, y - f);
    ctx.stroke();
  }
}

// ---------------------------------------------------------------- campo (mundo)

function block(ctx, s, rand, solids) {
  // flutuando = nada embaixo segurando (ex.: a ilha da etapa "voltar")
  const below = s.y + s.h;
  const supported = solids.some((o) => o !== s && Math.abs(o.y - below) < 3 && o.x < s.x + s.w && o.x + o.w > s.x);
  const floating = below < 740 && !supported;
  const bottom = floating || supported ? s.y + s.h : 1000;
  // terra em camadas
  const g = ctx.createLinearGradient(0, s.y, 0, Math.min(bottom, s.y + 260));
  g.addColorStop(0, DIRT.light);
  g.addColorStop(0.35, DIRT.mid);
  g.addColorStop(1, DIRT.dark);
  ctx.fillStyle = g;
  ctx.fillRect(s.x, s.y, s.w, bottom - s.y);
  if (floating) {
    // ilha flutuante: parte de baixo de pedra, em ponta
    ctx.fillStyle = DIRT.deep;
    ctx.beginPath();
    ctx.moveTo(s.x, bottom - 2);
    const n = Math.max(3, Math.round(s.w / 60));
    for (let i = 0; i <= n; i++) {
      const x = s.x + (i / n) * s.w;
      const mid = 1 - Math.abs(i / n - 0.5) * 2;
      ctx.lineTo(x, bottom + 10 + mid * 70 + rand() * 18);
    }
    ctx.lineTo(s.x + s.w, bottom - 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  // pedrinhas e raízes
  for (let i = 0; i < (s.w * Math.min(300, bottom - s.y)) / 2600; i++) {
    const x = s.x + 8 + rand() * (s.w - 16);
    const y = s.y + 24 + rand() * (Math.min(300, bottom - s.y) - 30);
    ctx.fillStyle = rand() < 0.5 ? 'rgba(60,36,18,0.45)' : 'rgba(200,160,120,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y, 3 + rand() * 5, 2 + rand() * 3, rand(), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(70,45,20,0.5)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < s.w / 90; i++) {
    const x = s.x + 10 + rand() * (s.w - 20);
    ctx.beginPath();
    ctx.moveTo(x, s.y + 16);
    ctx.quadraticCurveTo(x + (rand() - 0.5) * 20, s.y + 30, x + (rand() - 0.5) * 16, s.y + 40 + rand() * 20);
    ctx.stroke();
  }
  // contorno das laterais
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(s.x, Math.min(bottom, s.y + 1400));
  ctx.lineTo(s.x, s.y);
  ctx.moveTo(s.x + s.w, s.y);
  ctx.lineTo(s.x + s.w, Math.min(bottom, s.y + 1400));
  ctx.stroke();
  // grama por cima, caindo um pouco pelas bordas
  ctx.fillStyle = GRASS.dark;
  roundRect(ctx, s.x - 4, s.y - 4, s.w + 8, 18, 6);
  ctx.fill();
  ctx.fillStyle = GRASS.top;
  roundRect(ctx, s.x - 4, s.y - 5, s.w + 8, 13, 6);
  ctx.fill();
  ctx.fillStyle = GRASS.light;
  ctx.fillRect(s.x, s.y - 4, s.w, 3);
  // franja da grama
  ctx.fillStyle = GRASS.dark;
  for (let x = s.x - 2; x < s.x + s.w; x += 7) {
    const h = 4 + rand() * 7;
    ctx.beginPath();
    ctx.moveTo(x, s.y + 10);
    ctx.lineTo(x + 3.5, s.y + 10 + h);
    ctx.lineTo(x + 7, s.y + 10);
    ctx.fill();
  }
  // tufinhos de grama em pé
  ctx.strokeStyle = GRASS.mid;
  ctx.lineWidth = 1.6;
  for (let i = 0; i < s.w / 14; i++) {
    const x = s.x + 4 + rand() * (s.w - 8);
    ctx.beginPath();
    ctx.moveTo(x, s.y - 3);
    ctx.lineTo(x - 2 - rand() * 2, s.y - 8 - rand() * 5);
    ctx.moveTo(x + 2, s.y - 3);
    ctx.lineTo(x + 3 + rand() * 2, s.y - 7 - rand() * 5);
    ctx.stroke();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  roundRect(ctx, s.x - 4, s.y - 5, s.w + 8, 15, 6);
  ctx.stroke();
}

function plank(ctx, p) {
  // tábua de madeira com suportes
  const h = 14;
  ctx.fillStyle = '#7a5230';
  for (const x of [p.x + 16, p.x + p.w - 22]) {
    ctx.beginPath();
    ctx.moveTo(x, p.y + h);
    ctx.lineTo(x + 6, p.y + h);
    ctx.lineTo(x + 3, p.y + h + 14);
    ctx.closePath();
    ctx.fill();
  }
  const g = ctx.createLinearGradient(0, p.y, 0, p.y + h);
  g.addColorStop(0, '#d9a066');
  g.addColorStop(1, '#a8703f');
  ctx.fillStyle = g;
  roundRect(ctx, p.x, p.y, p.w, h, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(90,55,25,0.6)';
  ctx.lineWidth = 1;
  for (let x = p.x + 40; x < p.x + p.w - 10; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, p.y + 2);
    ctx.lineTo(x, p.y + h - 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#3a2410';
  for (let x = p.x + 8; x < p.x + p.w; x += 40) {
    ctx.beginPath();
    ctx.arc(x, p.y + h / 2, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  roundRect(ctx, p.x, p.y, p.w, h, 4);
  ctx.stroke();
}

// Enfeites (não colidem). `d.y` = chão onde ficam (padrão: o chão do campo)
function decor(ctx, d, rand) {
  const y = d.y ?? 560;
  const x = d.x;
  switch (d.type) {
    case 'arvore': {
      ctx.fillStyle = '#6b4a2b';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 7, y);
      ctx.lineTo(x - 5, y - 70);
      ctx.lineTo(x + 5, y - 70);
      ctx.lineTo(x + 8, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      for (const [dx, dy, r, c] of [[-22, -84, 26, '#3f8a3a'], [20, -88, 28, '#3f8a3a'], [0, -112, 30, '#4f9d40'], [-12, -96, 22, '#5fb34a'], [14, -104, 18, '#6cc456']]) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,220,0.25)';
      ctx.beginPath();
      ctx.arc(x + 8, y - 120, 12, 0, Math.PI * 2);
      ctx.fill();
      // maçãs
      ctx.fillStyle = '#e04a3a';
      for (const [dx, dy] of [[-18, -90], [12, -100], [24, -80]]) {
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'arbusto':
      for (const [dx, r, c] of [[-14, 12, '#3f8a3a'], [12, 13, '#3f8a3a'], [0, 16, '#57a845']]) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(x + dx, y - r * 0.8, r, Math.PI, 0);
        ctx.fill();
      }
      break;
    case 'flores':
      for (let i = 0; i < 9; i++) {
        const fx = x + (rand() - 0.5) * 70;
        const h = 6 + rand() * 8;
        ctx.strokeStyle = GRASS.dark;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(fx, y - 3);
        ctx.lineTo(fx, y - 3 - h);
        ctx.stroke();
        ctx.fillStyle = ['#ffffff', '#ffd23f', '#ff7aa8', '#b48cff'][i % 4];
        ctx.beginPath();
        ctx.arc(fx, y - 3 - h, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'feno': {
      ctx.fillStyle = '#e2bf5c';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      roundRect(ctx, x - 26, y - 34, 52, 34, 7);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#b48a30';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 22 + i * 8, y - 30);
        ctx.lineTo(x - 20 + i * 8, y - 4);
        ctx.stroke();
      }
      ctx.strokeStyle = '#8a3a2a';
      ctx.lineWidth = 2;
      for (const dx of [-12, 12]) {
        ctx.beginPath();
        ctx.moveTo(x + dx, y - 34);
        ctx.lineTo(x + dx, y);
        ctx.stroke();
      }
      break;
    }
    case 'placa': {
      ctx.fillStyle = '#7a5230';
      ctx.fillRect(x - 3, y - 50, 6, 50);
      ctx.fillStyle = '#d9a066';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      roundRect(ctx, x - 40, y - 74, 80, 30, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3a2410';
      ctx.font = '800 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TREINO', x, y - 54);
      break;
    }
    default:
      break;
  }
}

function drawTerrain(ctx, map, rand) {
  for (const d of map.decor ?? []) if (d.type === 'arvore') decor(ctx, d, rand);
  for (const s of map.solids) block(ctx, s, rand, map.solids);
  for (const p of map.platforms) plank(ctx, p);
  for (const d of map.decor ?? []) if (d.type !== 'arvore') decor(ctx, d, rand);
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
  front() {},
  haze: ['rgba(255,255,255,0)', 'rgba(225,242,255,0.3)'],
  vignette: 0.18, // de dia as bordas escurecem menos
};

