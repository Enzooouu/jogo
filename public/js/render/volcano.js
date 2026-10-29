// Vulcão do fundo da Caldeira (camada distante) e a lava que continua pelos
// morros da frente (camada do meio).

import { glowSprite } from './stage-util.js';

const ERUPT_EVERY = 8;

// Caminhos dos dois rios grandes (como no desenho): um desce pela esquerda
// (com um braço) e o outro em diagonal para a direita.
const RIVERS = [
  { w0: 14, w1: 24, pts: [[56, 430], [40, 520], [10, 590], [-28, 680], [-52, 800], [-60, 900]] },
  { w0: 20, w1: 34, pts: [[82, 196], [60, 262], [50, 370], [62, 470], [82, 580], [96, 700], [100, 860], [96, 1040]] },
  { w0: 20, w1: 36, pts: [[132, 198], [148, 272], [154, 360], [172, 450], [192, 545], [216, 645], [236, 765], [252, 905], [258, 1060]] },
];

// Rios finos
const THIN = [
  [[70, 192], [30, 250], [-30, 330], [-90, 420], [-160, 520]],
  [[150, 194], [210, 260], [270, 330], [330, 430]],
];

// ======================================================================
// Ajudantes de forma

function cycle(time, every) {
  return ((time % every) + every) % every;
}

// Curva suave passando pelos pontos, com pontos a cada `step` pixels
function densify(pts, step = 7) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const m = Math.max(2, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < m; k++) {
      const t = k / m;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// Bordas de uma faixa com largura variando e beiradas irregulares
function ribbon(dense, width, wobble, seed) {
  const left = [];
  const right = [];
  for (let i = 0; i < dense.length; i++) {
    const a = dense[Math.max(0, i - 1)];
    const b = dense[Math.min(dense.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const u = i / (dense.length - 1);
    const base = width(u) / 2;
    const n1 = Math.sin(i * 0.61 + seed) * 0.6 + Math.sin(i * 0.23 + seed * 2.1) * 0.4;
    const n2 = Math.sin(i * 0.57 + seed * 3.3) * 0.6 + Math.sin(i * 0.19 + seed * 1.7) * 0.4;
    const [x, y] = dense[i];
    left.push([x + nx * (base + n1 * wobble), y + ny * (base + n1 * wobble)]);
    right.push([x - nx * (base + n2 * wobble), y - ny * (base + n2 * wobble)]);
  }
  return { left, right };
}

function fillRibbon(ctx, r) {
  ctx.beginPath();
  r.left.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  for (let i = r.right.length - 1; i >= 0; i--) ctx.lineTo(r.right[i][0], r.right[i][1]);
  ctx.closePath();
  ctx.fill();
}

function poly(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

function alongDense(dense, u) {
  const i = Math.min(dense.length - 1, Math.max(0, Math.floor(u * (dense.length - 1))));
  return dense[i];
}

// ======================================================================
// Silhueta, chaminé, cratera e cores

const OUTLINE = [
  [-760, 1380], [-560, 820], [-470, 700], [-430, 650], [-360, 596], [-300, 524], [-250, 486],
  [-196, 424], [-150, 384], [-108, 334], [-70, 302], [-40, 262], [-12, 230], [10, 196], [24, 168],
  [34, 148], [44, 156], [54, 172], [66, 180], [108, 186], [150, 182], [160, 166], [176, 152],
  [190, 166], [206, 190], [234, 220], [256, 246], [276, 258], [290, 250], [304, 256], [316, 250],
  [330, 270], [352, 306], [372, 338], [400, 372], [430, 420], [470, 488], [522, 576], [582, 690],
  [660, 860], [820, 1380],
];

// Chaminé no ombro da encosta (solta vapor)
const VENT = [298, 254];

const CRATER = { x: 108, y: 188, rx: 44, ry: 6 };

const COLORS = { top: '#4a1a2e', mid: '#32122a', bottom: '#170914', lit: 'rgba(255,140,110,0.09)', shade: 'rgba(8,2,12,0.32)' };

// ======================================================================
// Desenho parado (vai para a camada distante)

export function drawVolcano(ctx, rand) {
  const outline = OUTLINE;
  const col = COLORS;
  const crater = CRATER;
  const body = new Path2D();
  outline.forEach(([x, y], i) => (i ? body.lineTo(x, y) : body.moveTo(x, y)));
  body.closePath();
  const g = ctx.createLinearGradient(0, 120, 0, 1300);
  g.addColorStop(0, col.top);
  g.addColorStop(0.35, col.mid);
  g.addColorStop(1, col.bottom);
  ctx.fillStyle = g;
  ctx.fill(body);

  ctx.save();
  ctx.clip(body);
  facets(ctx, crater, col, rand);
  // calor da cratera batendo na pedra
  const heat = ctx.createRadialGradient(crater.x, crater.y, 10, crater.x, crater.y, 300);
  heat.addColorStop(0, 'rgba(255,110,40,0.3)');
  heat.addColorStop(1, 'rgba(255,110,40,0)');
  ctx.fillStyle = heat;
  ctx.fillRect(crater.x - 300, crater.y - 300, 600, 600);
  ctx.restore();

  // luz da lua contornando o lado direito
  ctx.strokeStyle = 'rgba(190,160,230,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const peak = outline.reduce((best, p, i) => (p[1] < outline[best][1] ? i : best), 0);
  outline.slice(peak, outline.length - 1).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();

  // rios de lava
  for (const t of THIN) thinFlow(ctx, t, rand);
  RIVERS.forEach((r, i) => river(ctx, r.pts, (u) => r.w0 + (r.w1 - r.w0) * u, i * 7.3 + 1, rand));

  drawCrater(ctx, body, crater);
}

// Faces de rocha: cristas tortas descendo do topo, com um lado claro e o
// outro escuro, e pontas de rocha saindo pela encosta
function facets(ctx, crater, col, rand) {
  const top = crater.y - 10;
  const ridges = [];
  for (const [x0, x1] of [[20, -560], [50, -330], [80, -120], [105, 60], [135, 260], [165, 420], [195, 640]]) {
    const pts = [[x0, top]];
    let x = x0;
    let y = top;
    const steps = 9;
    for (let k = 1; k <= steps; k++) {
      y = top + (1300 - top) * (k / steps);
      x = x0 + (x1 - x0) * (k / steps) + (rand() - 0.5) * 50;
      pts.push([x, y]);
    }
    ridges.push(pts);
  }
  for (let r = 0; r < ridges.length - 1; r++) {
    ctx.fillStyle = r % 2 ? col.shade : col.lit;
    const a = ridges[r];
    const b = ridges[r + 1];
    poly(ctx, [...a, ...[...b].reverse()]);
    ctx.fill();
  }
  // linhas das cristas
  for (const pts of ridges) {
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
  // pontas de rocha
  for (let i = 0; i < 26; i++) {
    const y = 260 + rand() * 800;
    const spread = (y - 150) * 0.85;
    const x = crater.x - spread + rand() * spread * 2;
    const s = 8 + rand() * 16;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    poly(ctx, [[x - s, y], [x - s * 0.2, y - s * 1.1], [x + s * 0.4, y - s * 0.5], [x + s, y]]);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,150,120,0.1)';
    poly(ctx, [[x - s, y], [x - s * 0.2, y - s * 1.1], [x - s * 0.1, y]]);
    ctx.fill();
  }
}



function thinFlow(ctx, pts, rand) {
  const dense = densify(pts, 8);
  const r = ribbon(dense, (u) => 6 - u * 2.5, 1.2, pts[0][0]);
  ctx.fillStyle = 'rgba(150,40,12,0.95)';
  fillRibbon(ctx, r);
  ctx.strokeStyle = 'rgba(255,190,90,0.85)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  dense.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}

// Rio de lava grande
function river(ctx, pts, width, seed, rand) {
  const dense = densify(pts, 7);
  lavaRiver(ctx, dense, width, seed, rand);
}

// Lava viva com beirada irregular, crosta nas margens, miolo que muda de
// largura e placas escuras boiando
function lavaRiver(ctx, dense, width, seed, rand) {
  const glow = ribbon(dense, (u) => width(u) * 2.2, 6, seed);
  ctx.fillStyle = 'rgba(255,80,20,0.12)';
  fillRibbon(ctx, glow);
  const crust = ribbon(dense, (u) => width(u) + 8, 3.5, seed + 1);
  ctx.fillStyle = '#2b0b08';
  fillRibbon(ctx, crust);
  const body = ribbon(dense, width, 3, seed + 2);
  ctx.fillStyle = '#c3360e';
  fillRibbon(ctx, body);
  const hot = ribbon(dense, (u) => width(u) * (0.45 + 0.2 * Math.sin(u * 20 + seed)), 3, seed + 3);
  ctx.fillStyle = '#ff8a24';
  fillRibbon(ctx, hot);
  // fios claros que se partem (a lava andando)
  ctx.strokeStyle = '#ffe08a';
  ctx.lineCap = 'round';
  for (let i = 2; i < dense.length - 4; i += 5 + Math.floor(rand() * 4)) {
    const [x, y] = dense[i];
    const [x2, y2] = dense[i + 3];
    const off = (rand() - 0.5) * width(i / dense.length) * 0.4;
    ctx.lineWidth = 1 + rand() * 1.6;
    ctx.beginPath();
    ctx.moveTo(x + off, y);
    ctx.lineTo(x2 + off, y2);
    ctx.stroke();
  }
  // placas de crosta escura boiando (formas irregulares)
  for (let i = 6; i < dense.length - 3; i += 7 + Math.floor(rand() * 6)) {
    const [x, y] = dense[i];
    const w = width(i / dense.length);
    const cx = x + (rand() - 0.5) * w * 0.6;
    const s = w * (0.12 + rand() * 0.12);
    ctx.fillStyle = 'rgba(55,12,6,0.85)';
    poly(ctx, [[cx - s, y], [cx - s * 0.3, y - s * 0.7], [cx + s * 0.8, y - s * 0.4], [cx + s, y + s * 0.4], [cx, y + s * 0.7]]);
    ctx.fill();
  }
  // ponta do rio se espalhando em lóbulos
  const [ex, ey] = dense[dense.length - 1];
  ctx.fillStyle = '#c3360e';
  for (const [dx, dy, r] of [[-10, 0, 10], [8, 4, 9], [0, 10, 8]]) {
    ctx.beginPath();
    ctx.arc(ex + dx, ey + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}



function drawCrater(ctx, body, c) {
  const open = { x: c.x, y: c.y - 5, rx: c.rx + 8, ry: c.ry + 5 };
  ctx.save();
  ctx.clip(body);
  ctx.beginPath();
  ctx.ellipse(open.x, open.y, open.rx, open.ry, 0, 0, Math.PI * 2);
  ctx.clip();
  const wall = ctx.createLinearGradient(0, open.y - open.ry, 0, c.y);
  wall.addColorStop(0, '#24091a');
  wall.addColorStop(1, '#a8361a');
  ctx.fillStyle = wall;
  ctx.fillRect(open.x - open.rx, open.y - open.ry, open.rx * 2, open.ry * 2);
  const lake = ctx.createLinearGradient(0, c.y - c.ry, 0, c.y + c.ry);
  lake.addColorStop(0, '#fff2a8');
  lake.addColorStop(0.5, '#ff9a2a');
  lake.addColorStop(1, '#c2300a');
  ctx.fillStyle = lake;
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,170,90,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(open.x, open.y, open.rx, open.ry, 0, 0.15, Math.PI - 0.15);
  ctx.stroke();
}

// ======================================================================
// Animação (lava andando, fumaça, erupção)

const DENSE_RIVERS = RIVERS.map((r) => densify(r.pts, 7));

export function volcanoAnimated(ctx, time) {
  const c = CRATER;
  // brilho da cratera
  const pulse = 0.5 + Math.sin(time * 1.7) * 0.15;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = pulse;
  const gw = 120;
  ctx.drawImage(glowSprite('255,140,60'), c.x - c.rx - gw, c.y - 150, c.rx * 2 + gw * 2, 260);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  smoke(ctx, time, c);
  const vent = VENT;
  {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5 + Math.sin(time * 2.3) * 0.15;
    ctx.drawImage(glowSprite('255,120,50'), vent[0] - 22, vent[1] - 14, 44, 24);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    const steam = glowSprite('215,200,215');
    for (let i = 0; i < 5; i++) {
      const k = (time * 0.25 + i / 5) % 1;
      const r = 8 + k * 30;
      ctx.globalAlpha = 0.4 * (1 - k);
      ctx.drawImage(steam, vent[0] + k * 30 + Math.sin(time + i) * 4 - r, vent[1] - 6 - k * 70 - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  }

  // a lava andando pelos rios (mais forte logo depois da erupção)
  const phase = cycle(time, ERUPT_EVERY);
  const surge = phase < 4 ? 1 - phase / 4 : 0;
  flowLights(ctx, DENSE_RIVERS, time, surge);

  eruption(ctx, time, c, phase);
}

function flowLights(ctx, rivers, time, surge) {
  const hot = glowSprite('255,220,140');
  ctx.globalCompositeOperation = 'lighter';
  rivers.forEach((dense, f) => {
    const n = 7;
    for (let k = 0; k < n; k++) {
      const u = (time * 0.06 + k / n + f * 0.13) % 1;
      const [x, y] = alongDense(dense, u);
      const r = 14 * (1 - u * 0.3);
      ctx.globalAlpha = Math.min(1, (0.45 + surge * 0.5) * (1 - u * 0.5));
      ctx.drawImage(hot, x - r, y - r * 1.4, r * 2, r * 2.8);
    }
  });
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function smoke(ctx, time, c) {
  for (let i = 0; i < 6; i++) {
    const k = (time * 0.045 + i / 6) % 1;
    const sx = c.x + Math.sin(i * 2.3 + time * 0.4) * 20 + k * k * 260;
    const sy = c.y - 10 - k * 420;
    const r = 34 + k * 100;
    const warm = Math.max(0, 1 - k * 2.2);
    const col = `${Math.round(55 + 90 * warm)},${Math.round(32 + 25 * warm)},${Math.round(50 - 10 * warm)}`;
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    g.addColorStop(0, `rgba(${col},${0.5 * (1 - k)})`);
    g.addColorStop(0.6, `rgba(${col},${0.3 * (1 - k)})`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
  }
}

// Bombas de lava voando em arco
const BOMBS = Array.from({ length: 14 }, (_, i) => ({
  dir: i % 2 ? 1 : -1,
  vx: 60 + ((i * 37) % 170),
  vy: 300 + ((i * 53) % 170),
  delay: i * 0.035,
  r: 3 + (i % 3),
}));

function bombs(ctx, c, phase, smokeTrail, color) {
  const G = 520;
  for (const b of BOMBS) {
    const t = phase - b.delay;
    if (t <= 0) continue;
    const vy = -b.vy;
    const bb = vy - 1.05 * b.vx;
    const land = (-bb + Math.sqrt(bb * bb + 2 * G * 10)) / G;
    const pos = (tt) => [c.x + b.dir * b.vx * tt, c.y - 10 + vy * tt + 0.5 * G * tt * tt];
    if (t < land) {
      if (smokeTrail) {
        for (let s = 1; s <= 5; s++) {
          const [sx, sy] = pos(Math.max(0, t - s * 0.07));
          ctx.fillStyle = `rgba(70,45,50,${0.35 - s * 0.05})`;
          ctx.beginPath();
          ctx.arc(sx, sy, b.r + s * 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      const [ax, ay] = pos(Math.max(0, t - 0.08));
      const [x, y] = pos(t);
      ctx.strokeStyle = color;
      ctx.lineWidth = b.r * 1.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = '#fff0b0';
      ctx.beginPath();
      ctx.arc(x, y, b.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (t - land < 1.5) {
      const [x, y] = pos(land);
      const k = (t - land) / 1.5;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 1 - k;
      ctx.drawImage(glowSprite('255,140,50'), x - 16, y - 10, 32, 20);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }
}

function flash(ctx, c, phase, size) {
  const a = Math.max(0, 1 - phase / 1.2);
  if (a <= 0) return;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = a * 0.9;
  ctx.drawImage(glowSprite('255,200,120'), c.x - size, c.y - size, size * 2, size * 1.8);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function charge(ctx, c, phase) {
  const k = phase > ERUPT_EVERY - 1 ? phase - (ERUPT_EVERY - 1) : 0;
  if (k <= 0) return;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = k * 0.8;
  ctx.drawImage(glowSprite('255,150,60'), c.x - c.rx - 70, c.y - 90, c.rx * 2 + 140, 160);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}


// Leque de lava: muitas gotas incandescentes lançadas em arco da cratera,
// cada uma com um risco de rastro (como os vulcões do Havaí)
function fountainFan(ctx, c, phase, dur, count, spread, speed) {
  const G = 640;
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const launch = (i / count) * dur;
    const t = phase - launch;
    if (t <= 0) continue;
    const a = -Math.PI / 2 + Math.sin(i * 12.9898) * spread;
    const v = speed * (0.75 + 0.25 * Math.abs(Math.sin(i * 78.233)));
    const vx = Math.cos(a) * v;
    const vy = Math.sin(a) * v;
    const pos = (tt) => [c.x + Math.sin(i * 3.7) * 10 + vx * tt, c.y - 6 + vy * tt + 0.5 * G * tt * tt];
    const [x, y] = pos(t);
    if (y > c.y + 30 + Math.abs(x - c.x) * 1.05) continue;
    const [px, py] = pos(Math.max(0, t - 0.06));
    const heat = Math.max(0, 1 - t / 1.4);
    ctx.strokeStyle = `rgba(255,${Math.round(120 + 120 * heat)},${Math.round(40 + 100 * heat)},${0.5 + heat * 0.5})`;
    ctx.lineWidth = 2.5 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

// Erupção: leque de lava incandescente, bombas com rastro de fumaça, cinzas
function eruption(ctx, time, c, phase) {
  charge(ctx, c, phase);
  if (phase > 3.2) return;
  flash(ctx, c, phase, 320);
  ashPuffs(ctx, c, phase, 5, 0.5);
  if (phase < 1.8) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.8 * Math.sin(Math.PI * (phase / 1.8));
    ctx.drawImage(glowSprite('255,120,40'), c.x - 90, c.y - 240, 180, 260);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  fountainFan(ctx, c, phase, 1.6, 260, 0.34, 480);
  bombs(ctx, c, phase, true, 'rgba(255,140,50,0.8)');
}



function ashPuffs(ctx, c, phase, count, alpha) {
  for (let j = 0; j < count; j++) {
    const k = Math.min(1, phase / 2.6);
    const px = c.x + (j - (count - 1) / 2) * 34 * k + Math.sin(j * 3.1) * 10;
    const py = c.y - 30 - k * (220 + (j % 3) * 50);
    const r = 26 + k * (70 + (j % 2) * 30);
    const a = alpha * (1 - k);
    const g = ctx.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, `rgba(70,35,40,${a})`);
    g.addColorStop(0.6, `rgba(55,30,40,${a * 0.6})`);
    g.addColorStop(1, 'rgba(55,30,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(px - r, py - r, r * 2, r * 2);
  }
}

// ======================================================================
// Lava continuando pelos morros da frente (camada do meio)

let midRivers = [];

// `hills` é o contorno dos morros; `hillAt(hills, x)` dá a altura num x
export function drawMidLava(ctx, hills, hillAt, rand) {
  midRivers = [[98, 30, [2, 6, 4]], [250, 32, [8, 12, 16]]].map(([x0, w, dx]) => {
    const y0 = hillAt(hills, x0);
    return { w, y0, pts: [[x0, y0 - 40], [x0 + dx[0], y0 + 110], [x0 + dx[1], y0 + 260], [x0 + dx[2], 1340]] };
  });
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-560, 1340);
  for (const [hx, hy] of hills) ctx.lineTo(hx, hy);
  ctx.lineTo(1840, 1340);
  ctx.closePath();
  ctx.clip();
  midRivers.forEach((r, i) => {
    const glow = ctx.createRadialGradient(r.pts[0][0], r.y0 + 60, 10, r.pts[0][0], r.y0 + 60, 160);
    glow.addColorStop(0, 'rgba(255,90,30,0.25)');
    glow.addColorStop(1, 'rgba(255,90,30,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(r.pts[0][0] - 160, r.y0 - 100, 320, 320);
    river(ctx, r.pts, (u) => r.w * (0.9 + u * 0.3), 40 + i * 9, rand);
  });
  ctx.restore();
  // borda do morro brilhando onde a lava passa por cima
  for (const r of midRivers) {
    const x0 = r.pts[0][0];
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.8;
    ctx.drawImage(glowSprite('255,190,110'), x0 - r.w * 1.4, r.y0 - r.w, r.w * 2.8, r.w * 2);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  // só a parte abaixo do topo do morro recebe as luzes andando
  midRivers.dense = midRivers.map((r) => densify(r.pts, 7).filter(([, y]) => y >= r.y0 + 4));
}

export function midLavaAnimated(ctx, time) {
  if (!midRivers.dense) return;
  const phase = cycle(time, ERUPT_EVERY);
  flowLights(ctx, midRivers.dense, time, phase < 4 ? 1 - phase / 4 : 0);
}
