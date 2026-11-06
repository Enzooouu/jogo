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
    ctx.moveTo(sh.x - 2, sh.y + 13);
    ctx.lineTo(sh.x - 7, sh.y + 16);
    ctx.stroke();
    // brasa acesa no peito (o "coração" de fogo)
    ctx.globalAlpha = 1;
    const pulse = 0.75 + Math.sin(t * 5) * 0.25;
    const cy = sh.y + 8;
    const core = ctx.createRadialGradient(sh.x + 1, cy, 0.5, sh.x + 1, cy, 6);
    core.addColorStop(0, `rgba(255,250,220,${pulse})`);
    core.addColorStop(0.4, rgba(k.glow2, 0.85 * pulse));
    core.addColorStop(1, rgba(k.glow, 0));
    ctx.fillStyle = core;
    ctx.beginPath(); ctx.arc(sh.x + 1, cy, 6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // placas de carvão (luz de cima)
    ctx.fillStyle = 'rgba(255,170,90,0.12)';
    ctx.beginPath(); ctx.moveTo(sh.x - 8, sh.y); ctx.lineTo(sh.x + 2, sh.y); ctx.lineTo(sh.x - 4, sh.y + 5); ctx.closePath(); ctx.fill();
  } else if (element === 'agua') {
    // corrente ondulando por dentro do corpo
    ctx.strokeStyle = 'rgba(200,240,255,0.55)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let y = sh.y + 2; y < hip.y; y += 1) {
      const u = (y - sh.y) / Math.max(1, hip.y - sh.y);
      const x = sh.x + (hip.x - sh.x) * u - 1 + Math.sin(y * 0.6 + t * 6) * 1.6;
      if (y === sh.y + 2) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // água mais funda embaixo
    const deep = ctx.createLinearGradient(0, sh.y, 0, hip.y + 3);
    deep.addColorStop(0, 'rgba(10,40,120,0)');
    deep.addColorStop(1, 'rgba(10,40,120,0.3)');
    ctx.fillStyle = deep;
    ctx.fillRect(sh.x - 12, sh.y, 24, hip.y - sh.y + 6);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
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
    // placa de pedra clara em cima à esquerda (luz)
    ctx.fillStyle = 'rgba(255,230,190,0.16)';
    ctx.beginPath(); ctx.moveTo(sh.x - 11, sh.y); ctx.lineTo(sh.x + 4, sh.y - 1); ctx.lineTo(sh.x - 3, sh.y + 7); ctx.lineTo(sh.x - 10, sh.y + 7); ctx.closePath(); ctx.fill();
    // cinto de musgo com folhinha
    ctx.fillStyle = '#5f8f3a';
    ctx.fillRect(hip.x - 9, hip.y - 4.5, 18, 3.4);
    ctx.fillStyle = '#8ad05a';
    ctx.beginPath(); ctx.ellipse(hip.x + 4, hip.y - 4, 2.6, 1.2, -0.5, 0, Math.PI * 2); ctx.fill();
    // cristal de âmbar encravado no peito
    ctx.save();
    ctx.shadowColor = k.glow;
    ctx.shadowBlur = 5 + Math.sin(t * 3) * 2;
    ctx.fillStyle = '#ffd27a';
    const gx = sh.x + 2;
    const gy = sh.y + 9;
    ctx.beginPath(); ctx.moveTo(gx, gy - 4); ctx.lineTo(gx + 2.6, gy); ctx.lineTo(gx, gy + 3.6); ctx.lineTo(gx - 2.6, gy); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(gx, gy - 4); ctx.lineTo(gx + 2.6, gy); ctx.lineTo(gx, gy + 3.6); ctx.lineTo(gx - 2.6, gy); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(gx - 1.2, gy - 2, 1, 1.6);
  } else if (element === 'ar') {
    // emblema de redemoinho girando no peito
    ctx.save();
    ctx.translate(sh.x, sh.y + 9);
    ctx.rotate(t * 3);
    ctx.strokeStyle = rgba(k.glow, 0.85);
    ctx.shadowColor = k.glow;
    ctx.shadowBlur = 5;
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      ctx.rotate((Math.PI * 2) / 3);
      ctx.beginPath(); ctx.arc(1.6, 0, 3, Math.PI, Math.PI * 1.8); ctx.stroke();
    }
    ctx.restore();
    // faixa do cinto verde-água
    ctx.fillStyle = rgba(k.glow, 0.6);
    ctx.fillRect(hip.x - 7, hip.y - 4, 14, 2.4);
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
    // chaminha dançando em cima do punho
    const h = 6 + Math.sin(t * 13) * 1.5;
    ctx.fillStyle = rgba(k.glow, 0.85);
    ctx.beginPath(); ctx.moveTo(p.x - 2.6, p.y - 2); ctx.quadraticCurveTo(p.x - 2, p.y - h * 0.7, p.x + Math.sin(t * 9), p.y - h); ctx.quadraticCurveTo(p.x + 2, p.y - h * 0.6, p.x + 2.6, p.y - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = rgba(k.glow2, 0.9);
    ctx.beginPath(); ctx.arc(p.x, p.y - 3, 1.4, 0, Math.PI * 2); ctx.fill();
  } else if (element === 'agua') {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.arc(p.x - 1.2, p.y - 1.3, 1.1, 0, Math.PI * 2); ctx.fill();
    // gotinha pingando da mão
    const d = (t * 1.4) % 1;
    ctx.fillStyle = rgba(k.bodyHi, 0.9 * (1 - d));
    ctx.beginPath(); ctx.ellipse(p.x + 0.5, p.y + 4 + d * 10, 1, 1.5, 0, 0, Math.PI * 2); ctx.fill();
  } else if (element === 'terra') {
    // nós de pedra no punho
    ctx.fillStyle = 'rgba(255,230,190,0.35)';
    ctx.beginPath(); ctx.moveTo(p.x - 4, p.y - 1); ctx.lineTo(p.x - 1, p.y - 4.4); ctx.lineTo(p.x + 1.5, p.y - 1.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(p.x + 1, p.y - 4); ctx.lineTo(p.x + 2, p.y + 1); ctx.stroke();
  } else if (element === 'ar') {
    ctx.strokeStyle = rgba(k.glow, 0.85);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(p.x, p.y, 6, t * 6, t * 6 + 2); ctx.stroke();
  }
}

export function feet(ctx, element, k, f, b, t) {
  if (element === 'fogo') {
    // brasinhas subindo dos pés
    for (const [p, o] of [[f, 0], [b, 0.5]]) {
      const u = (t * 1.6 + o) % 1;
      ctx.fillStyle = rgba(k.glow2, 1 - u);
      ctx.beginPath(); ctx.arc(p.x + Math.sin(t * 5 + o * 9) * 2, p.y - 2 - u * 10, 1.1 - u * 0.5, 0, Math.PI * 2); ctx.fill();
    }
  } else if (element === 'agua') {
    // ondinha em volta dos pés
    ctx.strokeStyle = rgba(k.bodyHi, 0.6);
    ctx.lineWidth = 1.2;
    for (const p of [f, b]) {
      const u = (t * 1.2) % 1;
      ctx.globalAlpha = 1 - u;
      ctx.beginPath(); ctx.ellipse(p.x + 1, p.y + 1.5, 4 + u * 6, 1.2 + u * 1.2, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (element === 'ar') {
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
  ctx.fillStyle = 'rgba(255,230,190,0.3)';
  ctx.beginPath(); ctx.moveTo(sh.x - 5, sh.y - 3); ctx.lineTo(sh.x + 3, sh.y - 6); ctx.lineTo(sh.x + 1, sh.y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5f8f3a';
  ctx.fillRect(sh.x - 3, sh.y - 5, 9, 2.5);
  // cristalzinho no ombro
  ctx.fillStyle = '#ffd27a';
  ctx.beginPath(); ctx.moveTo(sh.x + 5, sh.y - 4); ctx.lineTo(sh.x + 6.5, sh.y - 10); ctx.lineTo(sh.x + 8, sh.y - 4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
}

export function head(ctx, element, k, h, t) {
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  if (element === 'fogo') fireHead(ctx, k, t);
  else if (element === 'agua') waterHead(ctx, k, t);
  else if (element === 'terra') earthHead(ctx, k, t);
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
  // miolo branco-amarelo das chamas
  ctx.fillStyle = 'rgba(255,248,210,0.9)';
  ctx.beginPath();
  ctx.moveTo(-3.4, -R + 2);
  ctx.quadraticCurveTo(-2.2, -R - 8, Math.sin(t * 11) * 1.2, -R - 12 + Math.sin(t * 13) * 1.5);
  ctx.quadraticCurveTo(2.2, -R - 8, 3.4, -R + 2);
  ctx.closePath();
  ctx.fill();
  // fagulhas subindo da cabeça
  for (let i = 0; i < 4; i++) {
    const u = (t * 1.1 + i / 4) % 1;
    ctx.fillStyle = rgba(i % 2 ? k.glow2 : k.glow, 1 - u);
    ctx.beginPath(); ctx.arc(Math.sin(t * 4 + i * 2.3) * 7, -R - 18 - u * 16, 1.3 - u * 0.7, 0, Math.PI * 2); ctx.fill();
  }
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
  // rachadura de brasa na testa e reflexo de carvão
  ctx.strokeStyle = rgba(k.glow, 0.85);
  ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(-3, -4); ctx.lineTo(-5, -1); ctx.stroke();
  ctx.fillStyle = 'rgba(255,220,180,0.25)';
  ctx.beginPath(); ctx.ellipse(-4.5, -5.5, 2.2, 1.2, -0.6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
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
  // bolhinhas subindo dentro da gota
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(1, -20); ctx.quadraticCurveTo(-11, -7, -10, 1); ctx.arc(0, 1, 10, Math.PI, 0, true); ctx.quadraticCurveTo(11, -7, 1, -20);
  ctx.clip();
  for (let i = 0; i < 4; i++) {
    const u = (t * 0.7 + i / 4) % 1;
    ctx.strokeStyle = `rgba(230,250,255,${0.8 * (1 - u)})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(-4 + i * 2.6 + Math.sin(t * 3 + i) * 1, 8 - u * 22, 0.9 + u * 0.6, 0, Math.PI * 2); ctx.stroke();
  }
  // brilho na borda de baixo (água refletindo)
  ctx.fillStyle = 'rgba(160,230,255,0.4)';
  ctx.beginPath(); ctx.ellipse(2, 8.5, 6, 1.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.ellipse(-4, -6, 2, 4, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath(); ctx.arc(-1.5, -12, 1.1, 0, Math.PI * 2); ctx.fill();
  // gotinha girando em volta da cabeça
  const a = t * 2.4;
  ctx.fillStyle = rgba(k.bodyHi, 0.95);
  ctx.beginPath(); ctx.ellipse(Math.cos(a) * 15, -2 + Math.sin(a) * 5, 1.5, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  eyes(ctx, k, 'redondo');
}

function earthHead(ctx, k, t = 0) {
  // cristais de âmbar crescendo atrás da cabeça
  ctx.save();
  ctx.shadowColor = k.glow;
  ctx.shadowBlur = 6 + Math.sin(t * 3) * 2;
  for (const [x, y, h, a, c] of [[-8, -9, 9, -0.6, '#ffd27a'], [-4, -12, 12, -0.25, '#ffe9a8'], [-10, -3, 7, -1.1, '#e8a83a']]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(-2.2, 0); ctx.lineTo(-2.2, -h + 3); ctx.lineTo(0, -h); ctx.lineTo(2.2, -h + 3); ctx.lineTo(2.2, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  for (const [x, y, h, a] of [[-8, -9, 9, -0.6], [-4, -12, 12, -0.25], [-10, -3, 7, -1.1]]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-2.2, 0); ctx.lineTo(-2.2, -h + 3); ctx.lineTo(0, -h); ctx.lineTo(2.2, -h + 3); ctx.lineTo(2.2, 0); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(-1.4, -h + 3.5, 0.9, h - 5);
    ctx.restore();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
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
  // florzinha no musgo
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath(); ctx.arc(5 + Math.cos(a) * 1.4, -13.5 + Math.sin(a) * 1.4, 0.9, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#ffd25a';
  ctx.beginPath(); ctx.arc(5, -13.5, 0.8, 0, Math.PI * 2); ctx.fill();
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
  // penas no alto da cabeça balançando
  for (const [x, a, len] of [[-6, -0.5, 9], [-2, -0.15, 11]]) {
    ctx.save();
    ctx.translate(x, -12);
    ctx.rotate(a + Math.sin(t * 4 + x) * 0.12);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-3, -len * 0.5, 0, -len); ctx.quadraticCurveTo(3, -len * 0.5, 0, 0); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = rgba(k.glow, 0.9); ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(0, -0.5); ctx.lineTo(0, -len + 1); ctx.stroke();
    ctx.restore();
  }
  // brilho suave na bochecha
  ctx.fillStyle = rgba(k.glow, 0.35);
  ctx.beginPath(); ctx.ellipse(3, 4, 2.6, 1.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
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
