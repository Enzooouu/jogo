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

export const ACCESSORY_ART = { capacete: drawHelmet };
