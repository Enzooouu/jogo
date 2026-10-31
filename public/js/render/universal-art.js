// Armas "universais": como a espada, o cajado e a lança ficam quando estão caídos no
// chão, sem ser de time nenhum. Têm um pouco de cada elemento (pedrinhas e
// fios nas quatro cores) e uma cor de brilho que vai mudando devagar.
// Convenção igual à de weapons-art.js: origem na mão, a arma aponta para -y.

const INK = '#0b0710';
const ELEMENT_COLORS = ['#ff7a2a', '#4fb0ff', '#d8b27a', '#9fe9dc'];

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

  // punho enrolado e joia
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6.5;
  ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, 9); ctx.stroke();
  ctx.strokeStyle = '#3b2f5c';
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.strokeStyle = '#e8c76a';
  ctx.lineWidth = 1;
  for (let y = -2; y < 9; y += 3) {
    ctx.beginPath(); ctx.moveTo(-1.8, y); ctx.lineTo(1.8, y + 1.5); ctx.stroke();
  }
  ctx.fillStyle = glow;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 9); ctx.lineTo(3.4, 12.5); ctx.lineTo(0, 16); ctx.lineTo(-3.4, 12.5);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // lâmina
  ctx.beginPath();
  ctx.moveTo(-4, -7); ctx.lineTo(-3.6, -42); ctx.lineTo(0, -56); ctx.lineTo(3.6, -42); ctx.lineTo(4, -7);
  ctx.closePath();
  const g = ctx.createLinearGradient(-4, 0, 4, 0);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.5, '#dfe6f2');
  g.addColorStop(1, '#9aa6bd');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  // filete de luz no meio da lâmina
  ctx.shadowColor = glow;
  ctx.shadowBlur = 8;
  ctx.strokeStyle = glow;
  ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, -44); ctx.stroke();
  ctx.shadowBlur = 0;
  // brilho correndo pela lâmina
  const k = (t * 0.8) % 1;
  if (k < 0.35) {
    const y = -10 - (k / 0.35) * 40;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.ellipse(-1.5, y, 1.2, 4, 0, 0, Math.PI * 2); ctx.fill();
  }

  // guarda dourada em asa com as quatro pedrinhas
  ctx.fillStyle = '#e8c76a';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, -9);
  ctx.quadraticCurveTo(-8, -4, -3, -5);
  ctx.lineTo(3, -5);
  ctx.quadraticCurveTo(8, -4, 14, -9);
  ctx.quadraticCurveTo(10, -1, 3, -1);
  ctx.lineTo(-3, -1);
  ctx.quadraticCurveTo(-10, -1, -14, -9);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ELEMENT_COLORS.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(-6.6 + i * 4.4, -3.6, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

// Cajado: haste clara com espiral dourada e uma esfera de cristal com fios
// das quatro cores girando dentro
export function drawUniversalStaff(ctx, t) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // haste
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(0, -44); ctx.stroke();
  ctx.strokeStyle = '#f1e4cf';
  ctx.lineWidth = 3.2;
  ctx.stroke();
  ctx.strokeStyle = '#d9a93f';
  ctx.lineWidth = 1.4;
  for (let y = 12; y > -40; y -= 8) {
    ctx.beginPath(); ctx.moveTo(-2, y); ctx.lineTo(2, y - 4); ctx.stroke();
  }
  // ponteira
  ctx.fillStyle = '#d9a93f';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-2.5, 14); ctx.lineTo(0, 20); ctx.lineTo(2.5, 14); ctx.closePath(); ctx.fill(); ctx.stroke();

  // suporte dourado em meia-lua segurando a esfera
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(0, -55, 11, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  ctx.strokeStyle = '#e8c76a';
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ctx.fillStyle = '#e8c76a';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-4, -43); ctx.lineTo(0, -47); ctx.lineTo(4, -43); ctx.closePath(); ctx.fill(); ctx.stroke();

  // esfera de cristal
  const cy = -56;
  ctx.shadowColor = prismColor(t);
  ctx.shadowBlur = 14;
  const orb = ctx.createRadialGradient(-2.5, cy - 3, 1, 0, cy, 9);
  orb.addColorStop(0, '#ffffff');
  orb.addColorStop(0.6, 'rgba(225,235,255,0.85)');
  orb.addColorStop(1, 'rgba(170,185,230,0.9)');
  ctx.fillStyle = orb;
  ctx.beginPath(); ctx.arc(0, cy, 8.5, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  // fios das quatro cores girando dentro
  ctx.lineWidth = 1.6;
  ELEMENT_COLORS.forEach((c, i) => {
    const a = t * 2.2 + (i * Math.PI) / 2;
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.arc(0, cy, 4.5, a, a + 1.1);
    ctx.stroke();
  });
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, cy, 8.5, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.ellipse(-3, cy - 3.5, 1.6, 2.6, -0.5, 0, Math.PI * 2); ctx.fill();
  // faíscas das quatro cores orbitando
  ELEMENT_COLORS.forEach((c, i) => {
    const a = -t * 1.6 + (i * Math.PI) / 2;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 13, cy + Math.sin(a) * 5, 1.6, 0, Math.PI * 2);
    ctx.fill();
  });
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
  // haste
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6.5;
  ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(0, -44); ctx.stroke();
  const shaft = ctx.createLinearGradient(-2, 0, 2, 0);
  shaft.addColorStop(0, '#5a4a8a');
  shaft.addColorStop(1, '#2a2048');
  ctx.strokeStyle = shaft;
  ctx.lineWidth = 3.6;
  ctx.stroke();
  ctx.strokeStyle = '#e8c76a';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (let y = 18; y > -40; y -= 1.5) {
    const x = Math.sin(y * 0.4) * 1.6;
    if (y === 18) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // ponteira
  ctx.fillStyle = '#e8c76a';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-3, 18); ctx.lineTo(0, 26); ctx.lineTo(3, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.rect(-3.2, 14, 6.4, 3); ctx.fill(); ctx.stroke();
  // colar dourado com as quatro pedrinhas e a joia do meio
  ctx.beginPath();
  ctx.moveTo(-4.5, -38); ctx.lineTo(-6.5, -43); ctx.lineTo(-5, -48); ctx.lineTo(5, -48); ctx.lineTo(6.5, -43); ctx.lineTo(4.5, -38);
  ctx.closePath();
  const gold = ctx.createLinearGradient(-6, 0, 6, 0);
  gold.addColorStop(0, '#a87a2a');
  gold.addColorStop(0.4, '#ffe08a');
  gold.addColorStop(1, '#a87a2a');
  ctx.fillStyle = gold;
  ctx.fill(); ctx.stroke();
  ELEMENT_COLORS.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(-4.5 + i * 3, -39.6, 1.1, 0, Math.PI * 2); ctx.fill();
  });
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, -44.5, 2.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // lâmina com nervura
  const pts = [[0, -48], [-5.5, -55], [-4, -70], [0, -84], [4, -70], [5.5, -55]];
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = '#a7b2c8';
  ctx.fill();
  ctx.save();
  ctx.clip();
  const face = ctx.createLinearGradient(-5, 0, 0, 0);
  face.addColorStop(0, '#ffffff');
  face.addColorStop(1, '#e2e8f4');
  ctx.fillStyle = face;
  ctx.fillRect(-6, -86, 6, 40);
  // brilhinho correndo pela lâmina
  const run = ((t * 0.6) % 1.6) - 0.3;
  const shine = ctx.createLinearGradient(0, -84 + run * 40, 0, -78 + run * 40);
  shine.addColorStop(0, 'rgba(255,255,255,0)');
  shine.addColorStop(0.5, 'rgba(255,255,255,0.95)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(-6, -90, 12, 50);
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.stroke();
  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = 6;
  ctx.strokeStyle = glow;
  ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(0, -51); ctx.lineTo(0, -80); ctx.stroke();
  ctx.restore();
  ctx.restore();
}
