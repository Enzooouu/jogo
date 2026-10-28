// Visual de cada elemento: corpo, cabeça, cachecol e detalhes.
// Coordenadas locais: origem nos pés, olhando para a direita (fighter.js
// espelha quando o lutador olha para a esquerda).

const INK = '#0b0710';

export const LOOKS = {
  fogo: { body: '#4a2420', bodyHi: '#ff8a3a', glow: '#ff7a1a', glow2: '#ffd25a', eye: '#fff3b0', scarf: ['#ff5a1a', '#ffb347'], thick: 1 },
  agua: { body: '#2f8cff', bodyHi: '#9fe3ff', glow: '#5ab8ff', glow2: '#e6fbff', eye: '#ffffff', scarf: ['#7fd0ff', '#d8f6ff'], thick: 1 },
  terra: { body: '#6b4a2b', bodyHi: '#a37a4c', glow: '#ffb347', glow2: '#ffe08a', eye: '#ffcf5a', scarf: ['#5f8f3a', '#9ccf5f'], thick: 1.3 },
  ar: { body: '#d9f3ee', bodyHi: '#ffffff', glow: '#7fffe0', glow2: '#e0fff8', eye: '#3fd6c0', scarf: ['#9ff0e0', '#ffffff'], thick: 0.85 },
};

export function lookOf(element) {
  return LOOKS[element] ?? LOOKS.fogo;
}

// Segmento com contorno, cor e um fio de brilho
export function limbStroke(ctx, pts, w, color, hi) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  };
  ctx.strokeStyle = INK;
  ctx.lineWidth = w + 4;
  path();
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  path();
  ctx.stroke();
  if (hi) {
    ctx.save();
    ctx.translate(-w * 0.18, -w * 0.18);
    ctx.strokeStyle = hi;
    ctx.lineWidth = w * 0.32;
    path();
    ctx.stroke();
    ctx.restore();
  }
}

export function aura(ctx, k) {
  const g = ctx.createRadialGradient(0, -34, 4, 0, -34, 50);
  g.addColorStop(0, rgba(k.glow, 0.28));
  g.addColorStop(1, rgba(k.glow, 0));
  ctx.fillStyle = g;
  ctx.fillRect(-50, -84, 100, 100);
}

export function torso(ctx, element, k, sh, hip, t) {
  const wS = 8.5 * k.thick;
  const wH = 5.5 * k.thick;
  ctx.beginPath();
  ctx.moveTo(sh.x - wS, sh.y);
  ctx.quadraticCurveTo(sh.x + wS * 1.3, sh.y - 2, sh.x + wS, sh.y + 2);
  ctx.lineTo(hip.x + wH, hip.y);
  ctx.quadraticCurveTo(hip.x, hip.y + 4, hip.x - wH, hip.y);
  ctx.closePath();
  const g = ctx.createLinearGradient(sh.x - wS, 0, sh.x + wS, 0);
  g.addColorStop(0, shade(k.body, -0.25));
  g.addColorStop(0.6, k.body);
  g.addColorStop(1, element === 'fogo' ? shade(k.body, 0.15) : k.bodyHi);
  ctx.fillStyle = g;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.clip();
  if (element === 'fogo') {
    // Rachaduras de magma pulsando
    ctx.strokeStyle = k.glow;
    ctx.shadowColor = k.glow;
    ctx.shadowBlur = 6;
    ctx.globalAlpha = 0.7 + Math.sin(t * 5) * 0.3;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(sh.x - 3, sh.y + 3);
    ctx.lineTo(sh.x + 1, sh.y + 8);
    ctx.lineTo(sh.x - 2, sh.y + 13);
    ctx.lineTo(hip.x + 2, hip.y - 2);
    ctx.moveTo(sh.x + 1, sh.y + 8);
    ctx.lineTo(sh.x + 6, sh.y + 10);
    ctx.stroke();
  } else if (element === 'agua') {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(sh.x + 3, sh.y + 6, 2, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 3; i++) {
      const y = hip.y - ((t * 12 + i * 6) % 16);
      ctx.beginPath();
      ctx.arc(sh.x - 2 + i * 2, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (element === 'terra') {
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sh.x - 8, sh.y + 7);
    ctx.lineTo(sh.x + 8, sh.y + 9);
    ctx.moveTo(sh.x - 6, sh.y + 14);
    ctx.lineTo(sh.x + 6, sh.y + 13);
    ctx.stroke();
    ctx.fillStyle = '#5f8f3a';
    ctx.fillRect(hip.x - 8, hip.y - 4, 16, 3);
  } else if (element === 'ar') {
    ctx.strokeStyle = rgba(k.glow, 0.7);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(sh.x, sh.y + 9, 4, 0, Math.PI * 1.5);
    ctx.stroke();
  }
  ctx.restore();
}

// Cachecol/fita que balança (wind 0 = parado, 1 = correndo)
export function scarf(ctx, element, k, neck, t, wind) {
  const strips = element === 'ar' ? 2 : 1;
  const len = element === 'ar' ? 34 : element === 'terra' ? 16 : 26;
  for (let s = 0; s < strips; s++) {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      pts.push({
        x: neck.x - 2 - u * len * (0.6 + wind * 0.5),
        y: neck.y + 2 + u * (10 - wind * 8) + Math.sin(t * 8 - u * 5 + s * 2) * u * 4 + s * 4,
      });
    }
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y - 2.5);
    for (const p of pts) ctx.lineTo(p.x, p.y - 2.5 * (1 - 0.6 * ((neck.x - p.x) / len)));
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x, pts[i].y + 2.5);
    ctx.closePath();
    const g = ctx.createLinearGradient(neck.x, 0, neck.x - len, 0);
    g.addColorStop(0, k.scarf[0]);
    g.addColorStop(1, element === 'fogo' ? 'rgba(255,200,80,0)' : k.scarf[1]);
    ctx.fillStyle = g;
    ctx.fill();
    if (element !== 'fogo') {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  ctx.fillStyle = k.scarf[0];
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(neck.x, neck.y + 2, 6, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

export function fist(ctx, element, k, p, t) {
  ctx.fillStyle = element === 'fogo' ? k.glow2 : element === 'terra' ? shade(k.body, 0.2) : k.bodyHi;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y, element === 'terra' ? 5 : 3.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (element === 'fogo') {
    ctx.fillStyle = rgba(k.glow, 0.5 + Math.sin(t * 9) * 0.2);
    ctx.beginPath();
    ctx.arc(p.x, p.y - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function feet(ctx, element, k, f, b, t) {
  if (element === 'ar') {
    ctx.strokeStyle = rgba(k.glow, 0.8);
    ctx.lineWidth = 1.5;
    for (const p of [f, b]) {
      ctx.beginPath();
      ctx.arc(p.x - 4, p.y + 1, 4 + Math.sin(t * 6), Math.PI * 0.2, Math.PI * 1.4);
      ctx.stroke();
    }
  } else if (element === 'terra') {
    ctx.fillStyle = shade(k.body, -0.3);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    for (const p of [b, f]) {
      ctx.beginPath();
      ctx.ellipse(p.x + 2, p.y, 6, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export function pauldron(ctx, k, sh) {
  ctx.fillStyle = k.bodyHi;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sh.x - 4, sh.y + 6);
  ctx.lineTo(sh.x - 5, sh.y - 3);
  ctx.lineTo(sh.x + 3, sh.y - 6);
  ctx.lineTo(sh.x + 10, sh.y - 1);
  ctx.lineTo(sh.x + 8, sh.y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5f8f3a';
  ctx.fillRect(sh.x - 3, sh.y - 5, 9, 2.5);
}

export function head(ctx, element, k, h, t) {
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  if (element === 'fogo') fireHead(ctx, k, t);
  else if (element === 'agua') waterHead(ctx, k, t);
  else if (element === 'terra') earthHead(ctx, k);
  else airHead(ctx, k, t);
  ctx.restore();
}

// Chamas nascem do topo da cabeça, dentro da largura dela (não vazam
// para os lados), e só a ponta balança.
function fireHead(ctx, k, t) {
  const R = 10;
  const tongues = [
    { a: -2.25, h: 11, w: 4.2 },
    { a: -1.9, h: 16, w: 4.8 },
    { a: -1.57, h: 21, w: 5.4 },
    { a: -1.24, h: 16, w: 4.8 },
    { a: -0.89, h: 11, w: 4.2 },
  ];
  tongues.forEach((f, i) => {
    const bx = Math.cos(f.a) * (R - 2);
    const by = Math.sin(f.a) * (R - 2);
    const sway = Math.sin(t * 9 + i * 1.3) * 1.4;
    const tipX = bx * 0.55 + sway;
    const tipY = -R - f.h + Math.sin(t * 13 + i) * 1.2;
    ctx.fillStyle = i === 2 ? k.glow2 : i % 2 ? '#ffb347' : k.glow;
    ctx.beginPath();
    ctx.moveTo(bx - f.w, by + 2);
    ctx.quadraticCurveTo(bx - f.w * 0.7, (by + tipY) / 2, tipX, tipY);
    ctx.quadraticCurveTo(bx + f.w * 0.7, (by + tipY) / 2, bx + f.w, by + 2);
    ctx.closePath();
    ctx.fill();
  });
  // A cabeça cobre a base das chamas
  ctx.fillStyle = k.body;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const g = ctx.createRadialGradient(3, 2, 1, 3, 2, R);
  g.addColorStop(0, rgba(k.glow, 0.7));
  g.addColorStop(1, rgba(k.glow, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, R - 1, 0, Math.PI * 2);
  ctx.fill();
  eyes(ctx, k, 'fenda');
}

function waterHead(ctx, k, t) {
  ctx.fillStyle = rgba(k.body, 0.95);
  ctx.beginPath();
  ctx.moveTo(-2, -8);
  ctx.bezierCurveTo(-12, -14 + Math.sin(t * 4) * 2, -20, -6, -17, 2 + Math.sin(t * 4 + 1) * 2);
  ctx.bezierCurveTo(-14, -4, -10, -3, -8, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const g = ctx.createLinearGradient(-8, -18, 8, 10);
  g.addColorStop(0, k.bodyHi);
  g.addColorStop(0.5, k.body);
  g.addColorStop(1, shade(k.body, -0.35));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(1, -20);
  ctx.quadraticCurveTo(-11, -7, -10, 1);
  ctx.arc(0, 1, 10, Math.PI, 0, true);
  ctx.quadraticCurveTo(11, -7, 1, -20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.beginPath();
  ctx.ellipse(-4, -6, 2, 4, 0.4, 0, Math.PI * 2);
  ctx.fill();
  eyes(ctx, k, 'redondo');
}

function earthHead(ctx, k) {
  ctx.fillStyle = k.body;
  ctx.beginPath();
  ctx.moveTo(-10, 4);
  ctx.lineTo(-11, -5);
  ctx.lineTo(-5, -12);
  ctx.lineTo(6, -12);
  ctx.lineTo(11, -4);
  ctx.lineTo(10, 6);
  ctx.lineTo(2, 10);
  ctx.lineTo(-6, 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = k.bodyHi;
  ctx.beginPath();
  ctx.moveTo(-9, -5);
  ctx.lineTo(-4, -10);
  ctx.lineTo(2, -10);
  ctx.lineTo(-5, -4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5f8f3a';
  ctx.beginPath();
  ctx.moveTo(-6, -12);
  ctx.quadraticCurveTo(0, -16, 7, -12);
  ctx.lineTo(4, -10);
  ctx.lineTo(-3, -10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-8, 1);
  ctx.lineTo(-3, 3);
  ctx.lineTo(-4, 7);
  ctx.stroke();
  ctx.fillStyle = k.glow2;
  ctx.shadowColor = k.glow;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(1, -9);
  ctx.lineTo(3, -6);
  ctx.lineTo(1, -3);
  ctx.lineTo(-1, -6);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  eyes(ctx, k, 'fenda');
}

function airHead(ctx, k, t) {
  ctx.strokeStyle = rgba(k.glow, 0.8);
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const r = 14 + i * 4;
    const a0 = Math.PI * 0.9 + Math.sin(t * 3 + i) * 0.15;
    ctx.beginPath();
    ctx.arc(-2, -2, r, a0, a0 + 1.1);
    ctx.stroke();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  const g = ctx.createRadialGradient(-3, -4, 2, 0, 0, 12);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, k.body);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-10, 2);
  ctx.quadraticCurveTo(-12, -12, 0, -13);
  ctx.quadraticCurveTo(10, -13, 10, -2);
  ctx.quadraticCurveTo(14, -10, 16 + Math.sin(t * 5) * 2, -14);
  ctx.quadraticCurveTo(12, 0, 9, 4);
  ctx.quadraticCurveTo(0, 12, -10, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  eyes(ctx, k, 'redondo');
}

function eyes(ctx, k, kind) {
  ctx.fillStyle = k.eye;
  ctx.shadowColor = k.eye;
  ctx.shadowBlur = 6;
  if (kind === 'fenda') {
    ctx.beginPath();
    ctx.moveTo(2, -3);
    ctx.lineTo(9, -4);
    ctx.lineTo(8, 0);
    ctx.lineTo(3, 0);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(5.5, -2, 2.6, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(6.5, -1.5, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

export function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (amt > 0 ? (255 - c) * amt : c * amt))));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
