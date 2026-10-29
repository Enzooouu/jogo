// Vulcão do fundo da Caldeira (camada distante) e a lava que continua pelos
// morros da frente (camada do meio).
//
// Três estilos para escolher (só no modo de teste: ?debug&vulcao=a|b|c):
//   a: "Montanha de fogo"  montanha recortada, rios de lava irregulares
//   b: "Caldeira quebrada" cratera larga e desmoronada, lava em cascatas
//   c: "Noite escura"      vulcão quase preto, rios de crosta com fissuras,
//                          erupção de cinzas com raios

import { glowSprite } from './stage-util.js';

const STYLE = (() => {
  try {
    const q = new URLSearchParams(globalThis.location?.search ?? '');
    const s = q.has('debug') ? q.get('vulcao') : null;
    return ['a', 'b', 'c'].includes(s) ? s : 'a';
  } catch {
    return 'a';
  }
})();

const ERUPT_EVERY = 8;

// Caminhos dos dois rios grandes (como no desenho): um desce pela esquerda
// (com um braço) e o outro em diagonal para a direita.
const RIVERS = [
  { w0: 14, w1: 24, pts: [[56, 430], [40, 520], [10, 590], [-28, 680], [-52, 800], [-60, 900]] },
  { w0: 20, w1: 34, pts: [[82, 196], [60, 262], [50, 370], [62, 470], [82, 580], [96, 700], [100, 860], [96, 1040]] },
  { w0: 20, w1: 36, pts: [[132, 198], [148, 272], [154, 360], [172, 450], [192, 545], [216, 645], [236, 765], [252, 905], [258, 1060]] },
];

// Rios finos (só nos estilos a e c)
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
// Silhuetas de cada estilo

const OUTLINE = {
  a: [
    [-760, 1380], [-560, 820], [-470, 700], [-430, 650], [-360, 596], [-300, 524], [-250, 486],
    [-196, 424], [-150, 384], [-108, 334], [-70, 302], [-40, 262], [-12, 230], [10, 196], [24, 168],
    [34, 148], [44, 156], [54, 172], [66, 180], [108, 186], [150, 182], [160, 166], [176, 152],
    [190, 166], [206, 190], [234, 220], [256, 246], [276, 258], [290, 250], [304, 256], [316, 250],
    [330, 270], [352, 306], [372, 338], [400, 372], [430, 420], [470, 488], [522, 576], [582, 690],
    [660, 860], [820, 1380],
  ],
  b: [
    [-760, 1380], [-600, 860], [-500, 720], [-400, 610], [-300, 500], [-220, 400], [-150, 320],
    [-96, 262], [-60, 228], [-40, 232], [-24, 212], [-8, 222], [8, 204], [22, 214], [36, 200],
    [54, 214], [70, 226], [92, 230], [130, 230], [150, 226], [168, 212], [186, 220], [200, 206],
    [218, 216], [236, 204], [252, 224], [290, 264], [340, 330], [400, 420], [470, 530], [560, 690],
    [660, 880], [820, 1380],
  ],
  c: [
    [-760, 1380], [-540, 800], [-430, 660], [-330, 560], [-250, 470], [-190, 400], [-130, 340],
    [-80, 280], [-40, 230], [-10, 196], [12, 160], [26, 128], [36, 112], [48, 132], [60, 160],
    [72, 178], [108, 184], [146, 180], [160, 158], [170, 136], [182, 124], [194, 146], [212, 176],
    [240, 210], [262, 236], [282, 242], [296, 232], [310, 240], [328, 266], [356, 310], [410, 400],
    [490, 540], [580, 710], [680, 900], [820, 1380],
  ],
};

// Chaminé no ombro da encosta (solta vapor)
const VENT = { a: [298, 254], b: null, c: [296, 236] };

const CRATER = {
  a: { x: 108, y: 188, rx: 44, ry: 6 },
  b: { x: 110, y: 250, rx: 104, ry: 9 },
  c: { x: 109, y: 186, rx: 38, ry: 5 },
};

const COLORS = {
  a: { top: '#4a1a2e', mid: '#32122a', bottom: '#170914', lit: 'rgba(255,140,110,0.09)', shade: 'rgba(8,2,12,0.32)' },
  b: { top: '#4a1d2c', mid: '#331427', bottom: '#170914', lit: 'rgba(255,150,120,0.08)', shade: 'rgba(8,2,12,0.3)' },
  c: { top: '#24101e', mid: '#180a15', bottom: '#0c050b', lit: 'rgba(170,150,230,0.06)', shade: 'rgba(0,0,0,0.35)' },
};

// ======================================================================
// Desenho parado (vai para a camada distante)

export function drawVolcano(ctx, rand) {
  const outline = OUTLINE[STYLE];
  const col = COLORS[STYLE];
  const crater = CRATER[STYLE];
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
  if (STYLE === 'b') terraces(ctx, rand);
  if (STYLE === 'c') fissures(ctx, rand);
  // calor da cratera batendo na pedra
  const heat = ctx.createRadialGradient(crater.x, crater.y, 10, crater.x, crater.y, STYLE === 'c' ? 200 : 300);
  heat.addColorStop(0, STYLE === 'c' ? 'rgba(255,90,40,0.22)' : 'rgba(255,110,40,0.3)');
  heat.addColorStop(1, 'rgba(255,110,40,0)');
  ctx.fillStyle = heat;
  ctx.fillRect(crater.x - 300, crater.y - 300, 600, 600);
  ctx.restore();

  // luz da lua contornando o lado direito
  ctx.strokeStyle = STYLE === 'c' ? 'rgba(200,180,255,0.45)' : 'rgba(190,160,230,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const peak = outline.reduce((best, p, i) => (p[1] < outline[best][1] ? i : best), 0);
  outline.slice(peak, outline.length - 1).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();

  // rios de lava
  if (STYLE !== 'b') for (const t of THIN) thinFlow(ctx, t, rand);
  RIVERS.forEach((r, i) => river(ctx, r.pts, (u) => r.w0 + (r.w1 - r.w0) * u, i * 7.3 + 1, rand));

  drawCrater(ctx, body, crater);
}

// Faces de rocha: cristas tortas descendo do topo, com um lado claro e o
// outro escuro, e pontas de rocha saindo pela encosta
function facets(ctx, crater, col, rand) {
  const top = crater.y - 10;
  const ridges = [];
  for (const [x0, x1] of [[20, -560], [50, -330], [80, -120], [105, 60], [135, 260], [165, 420], [195, 640]]) {
    const pts = [[x0, top + (STYLE === 'b' ? 10 : 0)]];
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
    ctx.fillStyle = STYLE === 'c' ? 'rgba(180,160,230,0.08)' : 'rgba(255,150,120,0.1)';
    poly(ctx, [[x - s, y], [x - s * 0.2, y - s * 1.1], [x - s * 0.1, y]]);
    ctx.fill();
  }
}

// Estilo b: degraus de pedra (a lava cai de um para o outro)
function terraces(ctx, rand) {
  for (const y of [330, 450, 580, 720, 880]) {
    const half = (y - 200) * 1.05 + 60;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.moveTo(110 - half, y);
    for (let x = 110 - half; x <= 110 + half; x += 40) ctx.lineTo(x, y + (rand() - 0.5) * 6);
    ctx.lineTo(110 + half, y + 12);
    ctx.lineTo(110 - half, y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,150,120,0.14)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(110 - half, y - 1);
    ctx.lineTo(110 + half, y - 1);
    ctx.stroke();
  }
}

// Estilo c: rachaduras finas brilhando pela encosta
function fissures(ctx, rand) {
  ctx.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    let x = -200 + rand() * 600;
    let y = 260 + rand() * 600;
    const pts = [[x, y]];
    for (let k = 0; k < 6; k++) {
      x += (rand() - 0.5) * 40;
      y += 10 + rand() * 22;
      pts.push([x, y]);
    }
    for (const [w, c] of [[5, 'rgba(255,80,20,0.18)'], [1.6, 'rgba(255,170,80,0.85)']]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.beginPath();
      pts.forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.stroke();
    }
  }
}

function thinFlow(ctx, pts, rand) {
  const dense = densify(pts, 8);
  const r = ribbon(dense, (u) => 6 - u * 2.5, 1.2, pts[0][0]);
  ctx.fillStyle = STYLE === 'c' ? 'rgba(60,15,10,0.9)' : 'rgba(150,40,12,0.95)';
  fillRibbon(ctx, r);
  ctx.strokeStyle = STYLE === 'c' ? 'rgba(255,150,70,0.7)' : 'rgba(255,190,90,0.85)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  dense.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}

// Rio de lava grande, no jeito de cada estilo
function river(ctx, pts, width, seed, rand) {
  const dense = densify(pts, 7);
  if (STYLE === 'a') riverA(ctx, dense, width, seed, rand);
  else if (STYLE === 'b') riverB(ctx, dense, width, seed, rand);
  else riverC(ctx, dense, width, seed, rand);
}

// a: lava viva com beirada irregular, crosta nas margens, miolo que muda de
// largura e placas escuras boiando
function riverA(ctx, dense, width, seed, rand) {
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

// b: a lava cai em cascatas pelos degraus (partes íngremes claras e lisas,
// poças largas em cada degrau)
function riverB(ctx, dense, width, seed, rand) {
  const glow = ribbon(dense, (u) => width(u) * 2, 5, seed);
  ctx.fillStyle = 'rgba(255,80,20,0.14)';
  fillRibbon(ctx, glow);
  const crust = ribbon(dense, (u) => width(u) + 6, 2.5, seed + 1);
  ctx.fillStyle = '#2b0b08';
  fillRibbon(ctx, crust);
  const body = ribbon(dense, (u) => width(u) * 0.9, 1.5, seed + 2);
  const g = ctx.createLinearGradient(0, dense[0][1], 0, dense[dense.length - 1][1]);
  g.addColorStop(0, '#ffb347');
  g.addColorStop(1, '#d9441a');
  ctx.fillStyle = g;
  fillRibbon(ctx, body);
  // listras verticais da cascata
  ctx.strokeStyle = 'rgba(255,240,180,0.75)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < dense.length - 6; i += 3) {
    const [x, y] = dense[i];
    const [x2, y2] = dense[i + 4];
    const off = Math.sin(i * 1.3 + seed) * width(i / dense.length) * 0.3;
    ctx.beginPath();
    ctx.moveTo(x + off, y);
    ctx.lineTo(x2 + off, y2);
    ctx.stroke();
  }
  // em cada degrau: borda de pedra cruzando a cascata e um respingo brilhando
  for (const ty of [330, 450, 580, 720, 880]) {
    const i = dense.findIndex(([, y]) => y >= ty);
    if (i < 0) continue;
    const [x, y] = dense[i];
    const w = width(i / dense.length);
    ctx.fillStyle = '#2b0b08';
    poly(ctx, [[x - w * 0.9, y - 2], [x - w * 0.3, y - 5], [x + w * 0.4, y - 4], [x + w * 0.9, y - 1], [x + w * 0.8, y + 4], [x - w * 0.8, y + 4]]);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,230,160,0.95)';
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.arc(x - w * 0.5 + k * w * 0.25, y + 8 + (k % 2) * 3, 2.2 + (k % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// c: crosta escura com fissuras acesas por dentro (lava esfriando)
function riverC(ctx, dense, width, seed, rand) {
  const glow = ribbon(dense, (u) => width(u) * 1.8, 6, seed);
  ctx.fillStyle = 'rgba(255,70,20,0.10)';
  fillRibbon(ctx, glow);
  const body = ribbon(dense, width, 4, seed + 1);
  ctx.fillStyle = '#1f0907';
  fillRibbon(ctx, body);
  // beiradas acesas
  ctx.strokeStyle = 'rgba(255,120,40,0.75)';
  ctx.lineWidth = 1.5;
  for (const side of [body.left, body.right]) {
    ctx.beginPath();
    side.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
  // rede de rachaduras brilhando dentro da crosta
  ctx.lineCap = 'round';
  for (let i = 1; i < dense.length - 2; i += 2) {
    const [x, y] = dense[i];
    const w = width(i / dense.length) * 0.45;
    const a = (rand() - 0.5) * w * 2;
    const b = (rand() - 0.5) * w * 2;
    const [x2, y2] = dense[i + 2];
    ctx.strokeStyle = rand() < 0.3 ? '#ffe08a' : '#ff8a24';
    ctx.lineWidth = 0.8 + rand() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x + a, y);
    ctx.lineTo((x + x2) / 2 + (a + b) / 2 + (rand() - 0.5) * 6, (y + y2) / 2);
    ctx.lineTo(x2 + b, y2);
    ctx.stroke();
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
  const c = CRATER[STYLE];
  // brilho da cratera
  const pulse = 0.5 + Math.sin(time * 1.7) * 0.15;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = pulse;
  const gw = STYLE === 'b' ? 60 : 120;
  ctx.drawImage(glowSprite('255,140,60'), c.x - c.rx - gw, c.y - 150, c.rx * 2 + gw * 2, 260);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  smoke(ctx, time, c);
  const vent = VENT[STYLE];
  if (vent) {
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

  if (STYLE === 'a') eruptionA(ctx, time, c, phase);
  else if (STYLE === 'b') eruptionB(ctx, time, c, phase);
  else eruptionC(ctx, time, c, phase);
}

function flowLights(ctx, rivers, time, surge) {
  const hot = glowSprite(STYLE === 'c' ? '255,150,70' : '255,220,140');
  ctx.globalCompositeOperation = 'lighter';
  rivers.forEach((dense, f) => {
    const n = STYLE === 'c' ? 4 : 7;
    for (let k = 0; k < n; k++) {
      const u = (time * (STYLE === 'b' ? 0.11 : 0.06) + k / n + f * 0.13) % 1;
      const [x, y] = alongDense(dense, u);
      const r = (STYLE === 'c' ? 10 : 14) * (1 - u * 0.3);
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

// Coluna de lava líquida com bordas que se mexem (polígono, não bolinhas)
function lavaColumn(ctx, x0, y0, h, w, time, seed) {
  if (h < 4) return;
  const left = [];
  const right = [];
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const y = y0 - h * u;
    const half = w * (1 - u * 0.55) + Math.sin(u * 9 + time * 14 + seed) * 3;
    const sway = Math.sin(u * 4 + time * 6 + seed) * 5 * u;
    left.push([x0 + sway - half, y]);
    right.push([x0 + sway + half + Math.sin(u * 11 + time * 13 + seed) * 2, y]);
  }
  const shape = [...left, ...right.reverse()];
  ctx.fillStyle = '#b52a0c';
  poly(ctx, shape.map(([x, y], i) => [x + (i < left.length ? -3 : 3), y]));
  ctx.fill();
  const g = ctx.createLinearGradient(0, y0, 0, y0 - h);
  g.addColorStop(0, '#ff7a1a');
  g.addColorStop(0.5, '#ffa53a');
  g.addColorStop(1, '#ffe08a');
  ctx.fillStyle = g;
  poly(ctx, shape);
  ctx.fill();
  // miolo claro
  ctx.fillStyle = 'rgba(255,245,200,0.8)';
  poly(ctx, left.map(([x, y], i) => [x + (right[right.length - 1 - i][0] - x) * 0.35, y]).concat(
    left.map(([x, y], i) => [x + (right[right.length - 1 - i][0] - x) * 0.55, y]).reverse(),
  ));
  ctx.fill();
  // topo se abrindo em gotas que caem
  const top = left[left.length - 1];
  for (let j = 0; j < 9; j++) {
    const a = -Math.PI / 2 + (j - 4) * 0.35;
    const d = 10 + (j % 3) * 8;
    ctx.fillStyle = j % 2 ? '#fff0b0' : '#ffb347';
    ctx.beginPath();
    ctx.arc(top[0] + w * 0.45 + Math.cos(a) * d * 1.4, top[1] + Math.sin(a) * d * 0.6 + d * 0.4, 5 - Math.abs(j - 4) * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
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

// a: leque de lava incandescente, bombas com rastro de fumaça, cinzas
function eruptionA(ctx, time, c, phase) {
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

// b: vários gêiseres de lava estourando da cratera larga
function eruptionB(ctx, time, c, phase) {
  charge(ctx, c, phase);
  if (phase > 3) return;
  flash(ctx, c, phase, 360);
  ashPuffs(ctx, c, phase, 4, 0.4);
  for (const [dx, delay, hmax, w] of [[-70, 0, 170, 12], [0, 0.15, 240, 16], [70, 0.3, 190, 12]]) {
    const p = phase - delay;
    if (p > 0 && p < 1.5) lavaColumn(ctx, c.x + dx, c.y, hmax * Math.sin(Math.PI * (p / 1.5)), w, time, dx);
  }
  bombs(ctx, c, phase, false, 'rgba(255,160,60,0.8)');
}

// c: coluna de cinzas subindo com raios dentro e pedras incandescentes
function eruptionC(ctx, time, c, phase) {
  charge(ctx, c, phase);
  if (phase > 4) return;
  flash(ctx, c, phase, 260);
  const k = Math.min(1, phase / 2.2);
  const fade = phase < 3 ? 1 : 1 - (phase - 3);
  // coluna de cinzas (bolhas escuras iluminadas por baixo)
  for (let j = 0; j < 20; j++) {
    const u = j / 19;
    if (u > k) break;
    const r = 30 + u * 90 + Math.sin(j * 1.7 + time * 2) * 8;
    const x = c.x + Math.sin(j * 2.1 + time * 0.8) * (10 + u * 26) + u * u * 90;
    const y = c.y - 20 - u * 420;
    const g = ctx.createRadialGradient(x, y + r * 0.3, 0, x, y, r);
    const warm = 1 - u;
    g.addColorStop(0, `rgba(${Math.round(70 + 110 * warm)},${Math.round(35 + 40 * warm)},40,${0.85 * fade})`);
    g.addColorStop(0.7, `rgba(40,25,35,${0.75 * fade})`);
    g.addColorStop(1, 'rgba(40,25,35,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // raios dentro da nuvem de cinzas
  for (const at of [0.5, 1.1, 1.7, 2.4]) {
    if (phase < at || phase > at + 0.12) continue;
    const seed = at * 10;
    let x = c.x + Math.sin(seed) * 30;
    let y = c.y - 60 - (at / 2.4) * 160;
    const pts = [[x, y]];
    for (let s = 0; s < 8; s++) {
      x += Math.sin(seed + s * 2.7) * 24;
      y -= 16 + Math.abs(Math.sin(seed * s)) * 12;
      pts.push([x, y]);
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.8;
    ctx.drawImage(glowSprite('200,190,255'), pts[4][0] - 120, pts[4][1] - 110, 240, 220);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    for (const [w, col] of [[5, 'rgba(170,150,255,0.5)'], [2, 'rgba(250,245,255,1)']]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.beginPath();
      pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      // galho
      ctx.moveTo(pts[3][0], pts[3][1]);
      ctx.lineTo(pts[3][0] + 26, pts[3][1] - 8);
      ctx.lineTo(pts[3][0] + 40, pts[3][1] + 6);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.6;
    ctx.drawImage(glowSprite('200,190,255'), x - 80, y - 60, 160, 160);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  bombs(ctx, c, phase, false, 'rgba(255,120,40,0.85)');
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
