// Armas "universais": como a espada, o cajado e a lança ficam quando estão caídos no
// chão, sem ser de time nenhum. Têm um pouco de cada elemento (pedrinhas e
// fios nas quatro cores) e uma cor de brilho que vai mudando devagar.
// Convenção igual à de weapons-art.js: origem na mão, a arma aponta para -y.

const INK = '#0b0710';
import { spShaft, spGrip, spButt, spSocket, spBlade, swGrip, swGuard, glint } from './weapons-art.js';

const ELEMENT_COLORS = ['#ff7a2a', '#4fb0ff', '#d8b27a', '#9fe9dc'];

function shape(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

// Cor que passa pelas cores dos quatro elementos com o tempo
export function prismColor(t, offset = 0) {
  const k = (((t * 0.35 + offset) % 1) + 1) % 1;
  const i = Math.floor(k * 4);
  const f = k * 4 - i;
  const a = hexToRgb(ELEMENT_COLORS[i]);
  const b = hexToRgb(ELEMENT_COLORS[(i + 1) % 4]);
  const mix = (x, y) => Math.round(x + (y - x) * f);
  return `rgb(${mix(a[0], b[0])},${mix(a[1], b[1])},${mix(a[2], b[2])})`;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Espada: lâmina prateada com filete de luz, guarda dourada com as quatro
// pedrinhas e joia no punho
export function drawUniversalSword(ctx, t) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const glow = prismColor(t);
  swGrip(ctx, '#2a2040', '#ffe08a', '#a87a2a', glow, t);
  // lâmina de aço com sulco no meio e fio dourado
  const blade = [[-4.6, -8], [-4.8, -48], [-2.6, -58], [0, -66], [2.6, -58], [4.8, -48], [4.6, -8]];
  spBlade(ctx, blade, '#ffffff', '#a7b2c8', 'rgba(255,224,138,0.9)', -10, -62);
  ctx.fillStyle = 'rgba(80,90,120,0.35)';
  shape(ctx, [[-1, -12], [-1, -48], [0, -52], [1, -48], [1, -12]]);
  ctx.fill();
  glint(ctx, blade, t, -10, -64, 2.6);
  // guarda dourada com as quatro pedrinhas e a joia que muda de cor
  const guard = [[-13, -10], [-11, -6.5], [-4, -5.5], [4, -5.5], [11, -6.5], [13, -10], [12.6, -3.6], [5, -1.4], [-5, -1.4], [-12.6, -3.6]];
  swGuard(ctx, guard, '#ffe08a', '#a87a2a', glow, '#ffffff', t, 8);
  [-9.5, -6, 6, 9.5].forEach((x, i) => {
    ctx.fillStyle = ELEMENT_COLORS[i];
    ctx.beginPath(); ctx.arc(x, -5.2, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 0.6; ctx.stroke();
  });
  ctx.restore();
}

// Cajado: haste clara com espiral dourada e uma esfera de cristal com fios
// das quatro cores girando dentro
export function drawUniversalStaff(ctx, t) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const glow = prismColor(t);
  // haste clara com espiral de ouro
  spShaft(ctx, '#ffffff', '#f1e4cf', '#c8b494', 4.4, 14, -30);
  ctx.strokeStyle = '#d9a93f';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let y = -4; y > -29; y -= 1.4) {
    const x = Math.sin(y * 0.4) * 1.7;
    if (y === -4) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#d9a93f';
  ctx.beginPath(); ctx.moveTo(-2.6, 13); ctx.lineTo(0, 20); ctx.lineTo(2.6, 13); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.stroke();
  // cabeça mais perto da mão e um pouco menor (como os cajados originais)
  ctx.save();
  ctx.translate(0, 16);
  ctx.translate(0, -62);
  ctx.scale(0.88, 0.88);
  ctx.translate(0, 62);
  const cy = -62;
  // meia-lua dourada segurando a esfera
  for (const [w, c] of [[5.4, INK], [3, '#e8c76a']]) {
    ctx.strokeStyle = c; ctx.lineWidth = w;
    ctx.beginPath(); ctx.arc(0, cy, 12.5, Math.PI * 0.12, Math.PI * 0.88); ctx.stroke();
  }
  ctx.fillStyle = '#e8c76a';
  shape(ctx, [[-4.6, -45], [-6, -49.5], [0, -52.5], [6, -49.5], [4.6, -45]]);
  ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke();
  // as quatro pedrinhas na meia-lua
  [[-11.6, cy + 4.6], [-6.6, cy + 10.4], [6.6, cy + 10.4], [11.6, cy + 4.6]].forEach(([x, y], i) => {
    ctx.fillStyle = ELEMENT_COLORS[i];
    ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.stroke();
  });
  // esfera de cristal com o brilho que muda de cor
  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = 14;
  const orb = ctx.createRadialGradient(-2.5, cy - 3, 1, 0, cy, 9);
  orb.addColorStop(0, '#ffffff');
  orb.addColorStop(0.5, '#e8ecff');
  orb.addColorStop(1, glow);
  ctx.fillStyle = orb;
  ctx.beginPath(); ctx.arc(0, cy, 8.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, cy, 8.4, 0, Math.PI * 2);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
  // os quatro elementos girando dentro
  for (let i = 0; i < 4; i++) {
    const a = t * 2 + (i * Math.PI) / 2;
    ctx.fillStyle = ELEMENT_COLORS[i];
    ctx.beginPath(); ctx.arc(Math.cos(a) * 4.2, cy + Math.sin(a) * 4.2, 1.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.ellipse(-3, cy - 3.6, 2.2, 1.2, -0.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.restore();
}

// Lança: haste roxa escura com filete dourado em espiral, colar dourado com
// as quatro pedrinhas dos elementos e uma joia que muda de cor, lâmina
// prateada com nervura e fio na cor que vai mudando, brilhinho correndo
export function drawUniversalSpear(ctx, t) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const glow = prismColor(t);
  // haste roxa com espiral de ouro
  spShaft(ctx, '#7a6ab0', '#4a3a7a', '#241a44', 4.8);
  ctx.strokeStyle = '#e8c76a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = -4; y > -46; y -= 1.4) {
    const x = Math.sin(y * 0.4) * 1.8;
    if (y === -4) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  spGrip(ctx, '#2a2040', '#ffe08a', '#a87a2a', 3.4);
  spButt(ctx, '#ffe08a', '#a87a2a');
  spSocket(ctx, '#ffe08a', '#a87a2a', glow, '#ffffff', 8, t);
  // as quatro pedrinhas dos elementos no alvado
  ELEMENT_COLORS.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(-4.5 + i * 3, -47.4, 1.05, 0, Math.PI * 2); ctx.fill();
  });
  // lâmina de aço em folha, com sulco no meio e fio dourado
  const pts = [[0, -57], [-5.5, -62], [-6.5, -72], [-4, -84], [0, -97], [4, -84], [6.5, -72], [5.5, -62]];
  spBlade(ctx, pts, '#ffffff', '#a7b2c8', 'rgba(255,224,138,0.9)', -60, -93);
  ctx.fillStyle = 'rgba(80,90,120,0.35)';
  shape(ctx, [[0, -62], [-1.2, -66], [-0.8, -82], [0, -86], [0.8, -82], [1.2, -66]]);
  ctx.fill();
  // brilho que corre pela lâmina
  const k = (t % 2.6) / 0.5;
  if (k < 1) {
    const y = -60 - 36 * k;
    ctx.save();
    shape(ctx, pts);
    ctx.clip();
    const g = ctx.createLinearGradient(0, y - 6, 0, y + 6);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.8)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-10, y - 6, 20, 12);
    ctx.restore();
  }
  ctx.restore();
}
