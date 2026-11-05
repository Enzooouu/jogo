// Desenho do Marretão (apontando para -y a partir da mão, como as outras
// armas): cabo de madeira com empunhadura de couro, colar de metal e uma
// cabeça enorme com volume (face da frente, tampo claro e as duas pontas de
// bater). Cada elemento tem a sua cabeça; o Mortal (e a arma caída) usa a
// universal, de ferro escuro com friso de ouro e as quatro pedras.

import { prismColor } from './universal-art.js';

const INK = '#140c1c';

// medidas da cabeça (na mão: o cabo vai de +16 até -50, a cabeça de -84 a -48)
const HEAD = { hw: 27, top: -84, bottom: -48, bevel: 6 };

function path(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

function ink(ctx, w = 2.4) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = w;
  ctx.stroke();
}

// ---------------------------------------------------------------- cabo

const GRIPS = {
  fogo: { leather: '#4a1e14', stitch: '#ff8a3a', pommel: ['#3a2a2a', '#1a1010'], gem: '#ff6a1f' },
  agua: { leather: '#173a6a', stitch: '#bfe9ff', pommel: ['#bfe2f2', '#4f7fa4'], gem: '#5fd0ff' },
  terra: { leather: '#4a3018', stitch: '#d8b27a', pommel: ['#9a9286', '#5a5248'], gem: '#4fae5a' },
  ar: { leather: '#2f7f74', stitch: '#ffffff', pommel: ['#ffffff', '#9cc8bf'], gem: '#7fffe0' },
  mortal: { leather: '#2a2040', stitch: '#e8c76a', pommel: ['#ffe08a', '#a87a2a'], gem: null },
};

function handle(ctx, element, t) {
  const g = GRIPS[element] ?? GRIPS.mortal;
  // madeira
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(0, -50); ctx.stroke();
  const wood = ctx.createLinearGradient(-3, 0, 3, 0);
  wood.addColorStop(0, '#c48a52');
  wood.addColorStop(0.45, '#9a6234');
  wood.addColorStop(1, '#5e3a1c');
  ctx.strokeStyle = wood;
  ctx.lineWidth = 5.6;
  ctx.stroke();
  // veios
  ctx.strokeStyle = 'rgba(60,30,10,0.45)';
  ctx.lineWidth = 0.8;
  for (const [x, y0, y1] of [[-1, -46, -30], [1.2, -26, -10], [-0.8, -18, -4]]) {
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + 0.8, (y0 + y1) / 2, x, y1); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,225,180,0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-1.6, -48); ctx.lineTo(-1.6, 12); ctx.stroke();
  // empunhadura de couro (faixas inclinadas) com costura
  ctx.save();
  path(ctx, [[-3.6, 13], [-3.6, -6], [3.6, -6], [3.6, 13]]);
  ctx.fillStyle = g.leather;
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1.2;
  for (let y = 14; y > -8; y -= 3.4) {
    ctx.beginPath(); ctx.moveTo(-4, y); ctx.lineTo(4, y - 2.4); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 0.8;
  for (let y = 12.6; y > -8; y -= 3.4) {
    ctx.beginPath(); ctx.moveTo(-4, y); ctx.lineTo(4, y - 2.4); ctx.stroke();
  }
  ctx.restore();
  path(ctx, [[-3.6, 13], [-3.6, -6], [3.6, -6], [3.6, 13]]);
  ink(ctx, 1.4);
  ctx.strokeStyle = g.stitch;
  ctx.lineWidth = 0.7;
  ctx.setLineDash([1.2, 1.4]);
  ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, -5); ctx.stroke();
  ctx.setLineDash([]);
  // anéis de metal nas pontas da empunhadura
  for (const y of [-7.5, 13]) {
    const m = ctx.createLinearGradient(-4.5, 0, 4.5, 0);
    m.addColorStop(0, g.pommel[1]);
    m.addColorStop(0.4, g.pommel[0]);
    m.addColorStop(1, g.pommel[1]);
    ctx.fillStyle = m;
    path(ctx, [[-4.6, y - 1.6], [4.6, y - 1.6], [4.6, y + 1.6], [-4.6, y + 1.6]]);
    ctx.fill(); ink(ctx, 1.2);
  }
  // pomo: ponteira de metal com pedra
  const m = ctx.createLinearGradient(-5, 0, 5, 0);
  m.addColorStop(0, g.pommel[1]);
  m.addColorStop(0.4, g.pommel[0]);
  m.addColorStop(1, g.pommel[1]);
  ctx.fillStyle = m;
  path(ctx, [[-4.4, 14.6], [-5.2, 18], [-2.6, 22.5], [2.6, 22.5], [5.2, 18], [4.4, 14.6]]);
  ctx.fill(); ink(ctx, 1.4);
  ctx.fillStyle = g.gem ?? prismColor(t);
  ctx.beginPath(); ctx.arc(0, 18.4, 1.9, 0, Math.PI * 2); ctx.fill(); ink(ctx, 0.9);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath(); ctx.arc(-0.6, 17.7, 0.6, 0, Math.PI * 2); ctx.fill();
}

// colar que prende a cabeça no cabo
function socket(ctx, metal, dark) {
  const m = ctx.createLinearGradient(-6, 0, 6, 0);
  m.addColorStop(0, dark);
  m.addColorStop(0.4, metal);
  m.addColorStop(1, dark);
  ctx.fillStyle = m;
  path(ctx, [[-4.4, -44], [-6, -47], [-6, -50], [6, -50], [6, -47], [4.4, -44]]);
  ctx.fill(); ink(ctx, 1.4);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(-5, -49.4, 3, 1.2);
}

// ---------------------------------------------------------------- cabeça

// Bloco com volume: tampo (claro), frente e as duas pontas (bater)
// cores: { top, face, faceDark, end, endDark }
function block(ctx, c, { hw = HEAD.hw, top = HEAD.top, bottom = HEAD.bottom, b = HEAD.bevel } = {}) {
  const outlinePts = [[-hw + b, top], [hw - b, top], [hw, top + b], [hw, bottom - b], [hw - b, bottom], [-hw + b, bottom], [-hw, bottom - b], [-hw, top + b]];
  // sombra embaixo
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  path(ctx, outlinePts.map(([x, y]) => [x + 1.5, y + 2]));
  ctx.fill();
  // frente
  const f = ctx.createLinearGradient(0, top, 0, bottom);
  f.addColorStop(0, c.face);
  f.addColorStop(1, c.faceDark);
  ctx.fillStyle = f;
  path(ctx, outlinePts);
  ctx.fill();
  // tampo claro (chanfro de cima)
  ctx.fillStyle = c.top;
  path(ctx, [[-hw + b, top], [hw - b, top], [hw - b - 2, top + b - 1], [-hw + b + 2, top + b - 1]]);
  ctx.fill();
  // pontas (faces de bater): a da esquerda pega luz, a da direita fica na sombra
  for (const side of [-1, 1]) {
    const x0 = side * hw;
    const x1 = side * (hw - b + 1);
    ctx.fillStyle = side < 0 ? c.end : c.endDark;
    path(ctx, [[x0, top + b], [x1, top + b - 1], [x1, bottom - b + 1], [x0, bottom - b]]);
    ctx.fill();
  }
  // chanfro de baixo, escuro
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  path(ctx, [[-hw + b + 2, bottom - b + 1], [hw - b - 2, bottom - b + 1], [hw - b, bottom], [-hw + b, bottom]]);
  ctx.fill();
  return outlinePts;
}

// faixa de metal em volta da cabeça, com rebites
function band(ctx, x, w, metal, dark, { top = HEAD.top, bottom = HEAD.bottom, rivets = true } = {}) {
  const m = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  m.addColorStop(0, dark);
  m.addColorStop(0.35, metal);
  m.addColorStop(1, dark);
  ctx.fillStyle = m;
  path(ctx, [[x - w / 2, top - 1.5], [x + w / 2, top - 1.5], [x + w / 2, bottom + 1.5], [x - w / 2, bottom + 1.5]]);
  ctx.fill(); ink(ctx, 1.3);
  if (!rivets) return;
  ctx.fillStyle = metal;
  for (const y of [top + 5, bottom - 5]) {
    ctx.beginPath(); ctx.arc(x, y, 1.3, 0, Math.PI * 2); ctx.fill(); ink(ctx, 0.7);
  }
}

// pedra lapidada (losango) com brilho
function gem(ctx, x, y, color, light, r = 5, t = 0, glow = 6) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = glow + Math.sin(t * 4) * 2;
  ctx.fillStyle = color;
  path(ctx, [[x, y - r * 1.4], [x + r, y], [x, y + r * 1.4], [x - r, y]]);
  ctx.fill();
  ctx.restore();
  path(ctx, [[x, y - r * 1.4], [x + r, y], [x, y + r * 1.4], [x - r, y]]);
  ink(ctx, 1.3);
  ctx.fillStyle = light;
  path(ctx, [[x, y - r * 1.4], [x - r, y], [x - r * 0.2, y - r * 0.1]]);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.5, r * 0.22, 0, Math.PI * 2); ctx.fill();
}

// ---------------------------------------------------------------- Fogo
// Basalto escuro com rachaduras de lava pulsando, faixas de ferro e as
// pontas em brasa; uma chaminha dança no tampo
function fireHead(ctx, t) {
  const pts = block(ctx, { top: '#5a4040', face: '#3a2a2a', faceDark: '#1c1214', end: '#ff8a3a', endDark: '#c8400e' });
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  // brasa nas pontas
  for (const side of [-1, 1]) {
    const g = ctx.createRadialGradient(side * HEAD.hw, -66, 1, side * HEAD.hw, -66, 16);
    g.addColorStop(0, 'rgba(255,200,90,0.95)');
    g.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(side * HEAD.hw - 16, -84, 32, 36);
  }
  // rachaduras de lava
  const pulse = 0.65 + 0.35 * Math.sin(t * 5);
  ctx.shadowColor = '#ff6a1f';
  ctx.shadowBlur = 7;
  ctx.strokeStyle = `rgba(255,${150 + 50 * pulse},60,${pulse})`;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(-20, -79); ctx.lineTo(-14, -72); ctx.lineTo(-17, -64); ctx.lineTo(-12, -56); ctx.lineTo(-14, -50);
  ctx.moveTo(-14, -72); ctx.lineTo(-8, -70);
  ctx.moveTo(19, -80); ctx.lineTo(14, -71); ctx.lineTo(18, -63); ctx.lineTo(13, -54);
  ctx.moveTo(18, -63); ctx.lineTo(22, -60);
  ctx.stroke();
  ctx.restore();
  path(ctx, pts);
  ink(ctx, 2.6);
  band(ctx, -9, 5, '#8a8a92', '#3a3a42');
  band(ctx, 9, 5, '#8a8a92', '#3a3a42');
  gem(ctx, 0, -66, '#ff5a1f', '#ffc061', 4.6, t, 10);
  // chaminha no tampo
  for (let i = 0; i < 3; i++) {
    const h = 9 - i * 2.5 + Math.sin(t * 11 + i * 2) * 2;
    ctx.fillStyle = ['#ff6a1f', '#ffa53a', '#ffe08a'][i];
    ctx.beginPath();
    ctx.moveTo(-5 + i * 1.6, -84);
    ctx.quadraticCurveTo(-4 + i, -84 - h * 0.6, Math.sin(t * 7 + i) * 1.5, -84 - h);
    ctx.quadraticCurveTo(4 - i, -84 - h * 0.6, 5 - i * 1.6, -84);
    ctx.closePath();
    ctx.fill();
  }
}

// ---------------------------------------------------------------- Água
// Aço azul-mar com ondas gravadas; as pontas viram cristas de onda curvadas
// e uma pérola-água no centro; gotinhas pingando
function waterHead(ctx, t) {
  const pts = block(ctx, { top: '#bfe9ff', face: '#3f8fd8', faceDark: '#1e4a8a', end: '#9fe3ff', endDark: '#2a6ab0' });
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  ctx.strokeStyle = 'rgba(220,245,255,0.75)';
  ctx.lineWidth = 1.5;
  for (const [y, k] of [[-72, 0], [-62, 1.5]]) {
    ctx.beginPath();
    for (let x = -HEAD.hw; x <= HEAD.hw; x += 1.5) ctx.lineTo(x, y + Math.sin(x * 0.35 + t * 3 + k) * 2);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(-HEAD.hw, -78, HEAD.hw * 2, 3);
  ctx.restore();
  path(ctx, pts);
  ink(ctx, 2.6);
  // cristas de onda nas pontas
  for (const side of [-1, 1]) {
    const x = side * HEAD.hw;
    ctx.fillStyle = side < 0 ? '#9fe3ff' : '#5fb4ff';
    ctx.beginPath();
    ctx.moveTo(x, -80);
    ctx.quadraticCurveTo(x + side * 9, -84, x + side * 8, -74);
    ctx.quadraticCurveTo(x + side * 5, -78, x + side * 3, -73);
    ctx.lineTo(x, -70);
    ctx.closePath();
    ctx.fill(); ink(ctx, 1.6);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(x + side * 6.5, -79, 1.1, 0, Math.PI * 2); ctx.fill();
  }
  band(ctx, 0, 11, '#e6f8ff', '#7fb4d8', { rivets: false });
  // concha estilizada na faixa + pérola
  ctx.strokeStyle = 'rgba(30,74,138,0.6)';
  ctx.lineWidth = 0.8;
  for (const a of [-0.8, -0.4, 0, 0.4, 0.8]) {
    ctx.beginPath(); ctx.moveTo(0, -56); ctx.lineTo(Math.sin(a) * 4.5, -56 - Math.cos(a) * 7); ctx.stroke();
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(0, -70, 4.4, 0, Math.PI * 2); ctx.fill(); ink(ctx, 1.3);
  ctx.fillStyle = 'rgba(95,208,255,0.85)';
  ctx.beginPath(); ctx.arc(1.2, -69, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath(); ctx.arc(-1.3, -71.5, 1.1, 0, Math.PI * 2); ctx.fill();
  // gotinhas pingando das pontas
  for (const [x, k] of [[-HEAD.hw + 4, 0], [HEAD.hw - 4, 0.5]]) {
    const d = (t * 1.2 + k) % 1;
    ctx.fillStyle = `rgba(159,227,255,${0.9 * (1 - d)})`;
    ctx.beginPath(); ctx.ellipse(x, -46 + d * 16, 1.2, 1.8, 0, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------------------------------------------------------------- Terra
// Pedra bruta lascada (contorno irregular), com musgo e folhinhas no tampo,
// cristais de âmbar saindo de cima e cintas de bronze com pedra verde
function earthHead(ctx, t) {
  const top = HEAD.top;
  const bottom = HEAD.bottom;
  const hw = HEAD.hw + 1;
  const pts = [[-hw + 4, top + 1], [-8, top - 1], [6, top + 1], [hw - 5, top], [hw, top + 7], [hw + 1, -66], [hw - 1, bottom - 6], [hw - 6, bottom], [-4, bottom + 1], [-hw + 5, bottom], [-hw, bottom - 7], [-hw - 1, -64], [-hw, top + 6]];
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  path(ctx, pts.map(([x, y]) => [x + 1.5, y + 2]));
  ctx.fill();
  const f = ctx.createLinearGradient(-hw, top, hw, bottom);
  f.addColorStop(0, '#b0a494');
  f.addColorStop(0.5, '#867a6a');
  f.addColorStop(1, '#4f463c');
  ctx.fillStyle = f;
  path(ctx, pts);
  ctx.fill();
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  // facetas da pedra lascada
  ctx.fillStyle = 'rgba(255,245,225,0.22)';
  path(ctx, [[-hw, top], [-6, top], [-12, -68], [-hw, -62]]); ctx.fill();
  path(ctx, [[8, top], [hw, top], [hw, -70], [14, -74]]); ctx.fill();
  ctx.fillStyle = 'rgba(30,20,10,0.25)';
  path(ctx, [[-hw, -60], [-10, -62], [-6, bottom], [-hw, bottom]]); ctx.fill();
  path(ctx, [[12, -66], [hw, -64], [hw, bottom], [6, bottom]]); ctx.fill();
  // rachaduras
  ctx.strokeStyle = 'rgba(30,20,10,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-18, -82); ctx.lineTo(-14, -74); ctx.lineTo(-19, -66);
  ctx.moveTo(20, -58); ctx.lineTo(15, -52); ctx.lineTo(18, -48);
  ctx.stroke();
  // musgo no tampo
  ctx.fillStyle = '#5f9a3e';
  ctx.beginPath();
  ctx.moveTo(-hw, top + 5);
  ctx.quadraticCurveTo(-14, top - 3, -2, top + 3);
  ctx.quadraticCurveTo(10, top + 7, hw, top + 2);
  ctx.lineTo(hw, top - 4);
  ctx.lineTo(-hw, top - 4);
  ctx.fill();
  ctx.restore();
  path(ctx, pts);
  ink(ctx, 2.6);
  // folhinhas e cristais de âmbar saindo do tampo
  ctx.fillStyle = '#8ad05a';
  for (const [x, a] of [[-17, -0.6], [-13, 0.3], [19, 0.7]]) {
    ctx.save(); ctx.translate(x, top + 1); ctx.rotate(a + Math.sin(t * 2 + x) * 0.08);
    ctx.beginPath(); ctx.ellipse(0, -3, 1.6, 3.6, 0, 0, Math.PI * 2); ctx.fill(); ink(ctx, 0.8);
    ctx.restore();
  }
  for (const [x, h, a] of [[4, 11, -0.15], [9, 7, 0.35]]) {
    ctx.save(); ctx.translate(x, top + 2); ctx.rotate(a);
    const g = ctx.createLinearGradient(-2.5, 0, 2.5, 0);
    g.addColorStop(0, '#ffe08a'); g.addColorStop(1, '#d8861e');
    ctx.fillStyle = g;
    path(ctx, [[-2.6, 0], [-2.6, -h + 3], [0, -h], [2.6, -h + 3], [2.6, 0]]);
    ctx.fill(); ink(ctx, 1.1);
    ctx.restore();
  }
  band(ctx, -10, 5, '#d8a868', '#7a4c22');
  band(ctx, 10, 5, '#d8a868', '#7a4c22');
  gem(ctx, 0, -66, '#4fae5a', '#c8ffc8', 4.6, t, 6);
}

// ---------------------------------------------------------------- Ar
// Mármore branco com veios verde-água, asas de penas saindo das pontas,
// fita voando e redemoinhos gravados
function airHead(ctx, t) {
  // asas atrás da cabeça
  for (const side of [-1, 1]) {
    const flap = Math.sin(t * 4 + side) * 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === 0 ? '#ffffff' : i === 1 ? '#e6fbf6' : '#c4efe6';
      ctx.beginPath();
      const bx = side * (HEAD.hw - 4);
      const by = -76 + i * 6;
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + side * (12 - i * 2), by - 12 + i * 3 + flap, bx + side * (20 - i * 3), by - 10 + i * 4 + flap);
      ctx.quadraticCurveTo(bx + side * (12 - i * 2), by - 2, bx, by + 4);
      ctx.closePath();
      ctx.fill(); ink(ctx, 1.3);
    }
  }
  const pts = block(ctx, { top: '#ffffff', face: '#eef9f6', faceDark: '#b4ddd4', end: '#ffffff', endDark: '#9cc8bf' });
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  // veios do mármore
  ctx.strokeStyle = 'rgba(79,209,184,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-26, -70); ctx.quadraticCurveTo(-16, -76, -10, -66); ctx.quadraticCurveTo(-6, -58, -12, -50);
  ctx.moveTo(26, -60); ctx.quadraticCurveTo(18, -56, 14, -64);
  ctx.stroke();
  // redemoinhos gravados
  ctx.strokeStyle = 'rgba(40,150,135,0.8)';
  ctx.lineWidth = 1.5;
  for (const x of [-15, 15]) {
    ctx.beginPath();
    ctx.arc(x, -66, 5, t * 3, t * 3 + Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, -66, 2.2, t * 3 + 1, t * 3 + 1 + Math.PI * 1.3);
    ctx.stroke();
  }
  ctx.restore();
  path(ctx, pts);
  ink(ctx, 2.6);
  band(ctx, 0, 10, '#7fe8d0', '#2f9f8c', { rivets: false });
  gem(ctx, 0, -66, '#7fffe0', '#ffffff', 4.4, t, 10);
  // fita voando do colar
  ctx.strokeStyle = '#4fd1b8';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(3, -46);
  for (let i = 1; i <= 6; i++) ctx.lineTo(3 + i * 2.8, -46 + i * 2.6 + Math.sin(t * 9 - i * 0.9) * 2.4);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

// ---------------------------------------------------------------- Mortal
// Ferro escuro com frisos de ouro, as quatro pedras dos elementos na faixa
// e a joia que muda de cor no centro
function universalHead(ctx, t) {
  const pts = block(ctx, { top: '#8a90a0', face: '#5a606e', faceDark: '#2a2e38', end: '#a8aebc', endDark: '#3c414c' });
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(-HEAD.hw, -84, HEAD.hw * 0.9, 36);
  ctx.restore();
  path(ctx, pts);
  ink(ctx, 2.6);
  // frisos de ouro nas pontas
  const gold = ctx.createLinearGradient(0, -84, 0, -48);
  gold.addColorStop(0, '#fff1b8');
  gold.addColorStop(0.5, '#e8b23a');
  gold.addColorStop(1, '#9a6416');
  for (const side of [-1, 1]) {
    ctx.fillStyle = gold;
    const x = side * (HEAD.hw - 6);
    path(ctx, [[x - 1.6, -83], [x + 1.6, -83], [x + 1.6, -49], [x - 1.6, -49]]);
    ctx.fill(); ink(ctx, 1);
  }
  band(ctx, 0, 14, '#ffe08a', '#a87a2a', { rivets: false });
  const colors = ['#4fd1b8', '#ff6a1f', '#9a6634', '#2f86f0'];
  [[-3.6, -79], [3.6, -79], [-3.6, -53], [3.6, -53]].forEach(([x, y], i) => {
    ctx.fillStyle = colors[i];
    ctx.beginPath(); ctx.arc(x, y, 1.9, 0, Math.PI * 2); ctx.fill(); ink(ctx, 0.8);
  });
  gem(ctx, 0, -66, prismColor(t), '#ffffff', 5, t, 9);
}

const HEADS = { fogo: fireHead, agua: waterHead, terra: earthHead, ar: airHead };
const SOCKETS = {
  fogo: ['#8a8a92', '#3a3a42'], agua: ['#e6f8ff', '#7fb4d8'], terra: ['#d8a868', '#7a4c22'],
  ar: ['#ffffff', '#9cc8bf'], mortal: ['#ffe08a', '#a87a2a'],
};

export function drawHammerArt(ctx, element, t) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const el = HEADS[element] ? element : 'mortal';
  handle(ctx, el, t);
  socket(ctx, ...SOCKETS[el]);
  (HEADS[el] ?? universalHead)(ctx, t);
  ctx.restore();
}

// Rastro da descida do marretão: uma faixa grossa em arco em volta do ombro,
// na altura da cabeça da marreta (mesma convenção de ângulo das poses:
// 0 = para baixo, PI/2 = para a frente, PI = para cima)
export function drawHammerSmear(ctx, color, shoulder, { from, to, alpha }) {
  if (alpha <= 0 || Math.abs(from - to) < 0.05) return;
  const toCanvas = (a) => Math.atan2(Math.cos(a), Math.sin(a));
  const r0 = 58;
  const r1 = 98;
  const a0 = toCanvas(from);
  const a1 = toCanvas(to);
  // de trás-em-cima para a frente-embaixo é sentido horário na tela
  const ccw = false;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  const g = ctx.createRadialGradient(shoulder.x, shoulder.y, r0, shoulder.x, shoulder.y, r1);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.55, color);
  g.addColorStop(0.9, 'rgba(255,255,255,0.95)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(shoulder.x, shoulder.y, r1, a0, a1, ccw);
  ctx.arc(shoulder.x, shoulder.y, r0, a1, a0, !ccw);
  ctx.closePath();
  ctx.fill();
  // linhas de velocidade dentro do rastro
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.5;
  for (const r of [70, 84]) {
    ctx.beginPath();
    ctx.arc(shoulder.x, shoulder.y, r, a0 + (a1 - a0) * 0.3, a1, ccw);
    ctx.stroke();
  }
  ctx.restore();
}
