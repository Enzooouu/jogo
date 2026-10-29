// Armas "universais": como a espada e o cajado ficam quando estão caídos no
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
