// Acessórios que o boneco pode usar (colecionáveis). Por enquanto só o
// capacete de astronauta (prêmio da conquista de ouro "Astronauta").
// Desenhados em volta da cabeça, no espaço do boneco (já espelhado).

const INK = '#1a1222';

// Capacete de astronauta: bolha de vidro em volta da cabeça, anel de metal
// no pescoço, uma antena com luz e o reflexo no vidro.
export function drawHelmet(ctx, h, time = 0) {
  const cx = h.x;
  const cy = h.y - 2;
  const R = 17;
  ctx.save();
  // antena com luzinha piscando
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 9, cy - 13);
  ctx.lineTo(cx + 14, cy - 25);
  ctx.stroke();
  ctx.strokeStyle = '#c9d2e0';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const blink = 0.5 + 0.5 * Math.sin(time * 5);
  ctx.fillStyle = `rgba(255,${Math.round(70 + 60 * blink)},80,1)`;
  ctx.beginPath();
  ctx.arc(cx + 14, cy - 26, 2.6, 0, Math.PI * 2);
  ctx.fill();
  // vidro (transparente: dá para ver a cabeça dentro)
  const glass = ctx.createRadialGradient(cx - 6, cy - 7, 2, cx, cy, R);
  glass.addColorStop(0, 'rgba(255,255,255,0.28)');
  glass.addColorStop(0.6, 'rgba(170,215,255,0.12)');
  glass.addColorStop(1, 'rgba(120,180,255,0.3)');
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(220,240,255,0.85)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, R - 1.6, 0, Math.PI * 2);
  ctx.stroke();
  // reflexo
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, R - 5, -2.6, -1.9);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc(cx + 7, cy - 9, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // anel de metal no pescoço
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(cx, cy + R - 2, 12, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  const ring = ctx.createLinearGradient(cx - 11, 0, cx + 11, 0);
  ring.addColorStop(0, '#8a94a8');
  ring.addColorStop(0.45, '#f2f5fa');
  ring.addColorStop(1, '#7a8498');
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.ellipse(cx, cy + R - 2.5, 10.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff8a3d';
  ctx.fillRect(cx - 1.5, cy + R - 4.5, 3, 3);
  ctx.restore();
}

// Coroa de chifres do Guardião da Torre (não é colecionável: é do chefe)
export function drawGuardianCrown(ctx, h, time = 0) {
  const cx = h.x;
  const cy = h.y - 9;
  ctx.save();
  ctx.lineJoin = 'round';
  // chifres curvos dos lados
  for (const s of [-1, 1]) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(cx + s * 7, cy + 2);
    ctx.quadraticCurveTo(cx + s * 20, cy - 2, cx + s * 19, cy - 19);
    ctx.quadraticCurveTo(cx + s * 15, cy - 8, cx + s * 4, cy - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8dcc0';
    ctx.beginPath();
    ctx.moveTo(cx + s * 7, cy);
    ctx.quadraticCurveTo(cx + s * 17, cy - 3, cx + s * 17.5, cy - 15);
    ctx.quadraticCurveTo(cx + s * 13, cy - 7, cx + s * 5, cy - 2);
    ctx.closePath();
    ctx.fill();
  }
  // aro dourado com 3 pontas e uma pedra que brilha
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(cx - 11, cy + 3);
  ctx.lineTo(cx - 12, cy - 7);
  ctx.lineTo(cx - 6, cy - 2);
  ctx.lineTo(cx, cy - 13);
  ctx.lineTo(cx + 6, cy - 2);
  ctx.lineTo(cx + 12, cy - 7);
  ctx.lineTo(cx + 11, cy + 3);
  ctx.closePath();
  ctx.fill();
  const gold = ctx.createLinearGradient(0, cy - 12, 0, cy + 3);
  gold.addColorStop(0, '#fff1b8');
  gold.addColorStop(0.5, '#f0c04a');
  gold.addColorStop(1, '#a8701c');
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.moveTo(cx - 9.5, cy + 1.5);
  ctx.lineTo(cx - 10, cy - 4.5);
  ctx.lineTo(cx - 5.5, cy - 0.5);
  ctx.lineTo(cx, cy - 10.5);
  ctx.lineTo(cx + 5.5, cy - 0.5);
  ctx.lineTo(cx + 10, cy - 4.5);
  ctx.lineTo(cx + 9.5, cy + 1.5);
  ctx.closePath();
  ctx.fill();
  const pulse = 0.6 + 0.4 * Math.sin(time * 4);
  ctx.fillStyle = `rgba(255,70,90,${0.5 + 0.5 * pulse})`;
  ctx.beginPath();
  ctx.arc(cx, cy - 1, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Aura escura com brilho dourado em volta do Guardião (atrás do corpo)
export function drawGuardianAura(ctx, time = 0) {
  const pulse = 0.75 + 0.25 * Math.sin(time * 3);
  const g = ctx.createRadialGradient(0, -36, 6, 0, -36, 58);
  g.addColorStop(0, `rgba(255,200,90,${0.28 * pulse})`);
  g.addColorStop(0.55, `rgba(150,60,200,${0.18 * pulse})`);
  g.addColorStop(1, 'rgba(120,40,180,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -36, 46, 60, 0, 0, Math.PI * 2);
  ctx.fill();
}

export const ACCESSORY_ART = { capacete: drawHelmet, guardiao: drawGuardianCrown };
