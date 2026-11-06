// Acessórios que o boneco pode usar (colecionáveis). Por enquanto só o
// capacete de astronauta (prêmio da conquista de ouro "Astronauta").
// Desenhados em volta da cabeça, no espaço do boneco (já espelhado).

const INK = '#1a1222';

// Capacete de astronauta: casco branco em volta da cabeça com um visor
// grande de vidro azulado na frente (dá para ver o rosto), reflexo dourado,
// lanterna do lado e o anel de metal no pescoço.
export function drawHelmet(ctx, h, time = 0) {
  const cx = h.x;
  const cy = h.y - 2;
  const R = 17;
  ctx.save();
  ctx.lineJoin = 'round';
  // casco branco com o buraco do visor (o rosto aparece pelo vidro)
  const vx = cx + 2.5;
  const vy = cy + 0.5;
  const shellPath = (r, vw, vh) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.ellipse(vx, vy, vw, vh, 0, 0, Math.PI * 2, true);
  };
  ctx.fillStyle = INK;
  shellPath(R + 1.6, 11.4, 9.9);
  ctx.fill('evenodd');
  const shell = ctx.createRadialGradient(cx - 6, cy - 8, 2, cx, cy, R + 2);
  shell.addColorStop(0, '#ffffff');
  shell.addColorStop(0.6, '#e6ebf3');
  shell.addColorStop(1, '#a9b3c4');
  ctx.fillStyle = shell;
  shellPath(R, 13, 11.5);
  ctx.fill('evenodd');
  // vidro do visor: azulado e transparente, com reflexo dourado embaixo
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(vx, vy, 11.4, 9.9, 0, 0, Math.PI * 2);
  ctx.clip();
  const glass = ctx.createLinearGradient(vx - 12, vy - 10, vx + 12, vy + 10);
  glass.addColorStop(0, 'rgba(140,200,255,0.28)');
  glass.addColorStop(0.6, 'rgba(60,110,210,0.12)');
  glass.addColorStop(1, 'rgba(255,190,90,0.3)');
  ctx.fillStyle = glass;
  ctx.fillRect(vx - 13, vy - 12, 26, 24);
  ctx.fillStyle = 'rgba(255,205,110,0.35)';
  ctx.beginPath();
  ctx.ellipse(vx + 4, vy + 9.5, 11, 3.6, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(vx, vy, 8, -2.6, -1.85);
  ctx.stroke();
  ctx.restore();
  // borda do visor
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(vx, vy, 12.2, 10.7, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#8e99ad';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(vx, vy, 13.4, 11.9, 0, 0, Math.PI * 2);
  ctx.stroke();
  // lanterna do lado (acende e apaga devagar)
  const glow = 0.55 + 0.45 * Math.sin(time * 2.5);
  ctx.fillStyle = INK;
  ctx.fillRect(cx - 17.5, cy - 6, 6, 9);
  ctx.fillStyle = '#c9d2e0';
  ctx.fillRect(cx - 16.5, cy - 5, 4, 7);
  ctx.fillStyle = `rgba(255,236,150,${0.6 + 0.4 * glow})`;
  ctx.fillRect(cx - 16, cy - 4, 3, 2.5);
  // anel do pescoço
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(cx, cy + R - 1, 12.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const ring = ctx.createLinearGradient(cx - 12, 0, cx + 12, 0);
  ring.addColorStop(0, '#8a94a8');
  ring.addColorStop(0.45, '#f4f6fa');
  ring.addColorStop(1, '#7a8498');
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.ellipse(cx, cy + R - 1.5, 11, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff7a2f';
  ctx.fillRect(cx - 6, cy + R - 2.6, 12, 2);
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

// Coroa do Imperador (prêmio da conquista de ouro "Imperador"): aro de ouro
// com 5 pontas (a do meio mais alta) terminando em losangos, veludo vermelho
// por dentro e uma pedra vermelha no meio do aro.
export function drawEmperorCrown(ctx, h, time = 0) {
  const cx = h.x;
  const base = h.y - 10;
  ctx.save();
  ctx.lineJoin = 'round';
  // veludo por dentro (aparece entre as pontas)
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(cx, base - 7, 12.5, 8, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#9c1830';
  ctx.beginPath();
  ctx.ellipse(cx, base - 7, 11, 6.8, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,120,140,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx - 3, base - 10, 4, 2.2, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // pontas: [x da base esquerda, x do topo, altura]
  const spikes = [[-13, -12.5, 10], [-7.5, -6.5, 14], [-3, 0, 19], [3, 6.5, 14], [7.5, 12.5, 10]];
  const gold = ctx.createLinearGradient(0, base - 22, 0, base + 4);
  gold.addColorStop(0, '#fff4c4');
  gold.addColorStop(0.4, '#f6c843');
  gold.addColorStop(1, '#a8701c');
  const spikePath = (grow) => {
    ctx.beginPath();
    ctx.moveTo(cx - 13 - grow, base + 1);
    for (const [x0, tip, hgt] of spikes) {
      const w = x0 < 0 && tip < 0 ? 2.5 : 2.5;
      ctx.lineTo(cx + tip - w - grow * 0.3, base - hgt + 3);
      ctx.lineTo(cx + tip, base - hgt - grow);
      ctx.lineTo(cx + tip + w + grow * 0.3, base - hgt + 3);
    }
    ctx.lineTo(cx + 13 + grow, base + 1);
    ctx.closePath();
  };
  ctx.fillStyle = INK;
  spikePath(1.4);
  ctx.fill();
  ctx.fillStyle = gold;
  spikePath(0);
  ctx.fill();
  // losangos nas pontas
  for (const [, tip, hgt] of spikes) {
    const y = base - hgt - 1.5;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(cx + tip, y - 3.6);
    ctx.lineTo(cx + tip + 2.8, y);
    ctx.lineTo(cx + tip, y + 3.6);
    ctx.lineTo(cx + tip - 2.8, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff1b0';
    ctx.beginPath();
    ctx.moveTo(cx + tip, y - 2.3);
    ctx.lineTo(cx + tip + 1.7, y);
    ctx.lineTo(cx + tip, y + 2.3);
    ctx.lineTo(cx + tip - 1.7, y);
    ctx.closePath();
    ctx.fill();
  }
  // aro (faixa grossa com brilho em cima e sombra embaixo)
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(cx - 14.5, base - 4.5);
  ctx.quadraticCurveTo(cx, base - 7.5, cx + 14.5, base - 4.5);
  ctx.lineTo(cx + 14.5, base + 3.5);
  ctx.quadraticCurveTo(cx, base + 0.5, cx - 14.5, base + 3.5);
  ctx.closePath();
  ctx.fill();
  const band = ctx.createLinearGradient(0, base - 6, 0, base + 3);
  band.addColorStop(0, '#fff0b0');
  band.addColorStop(0.5, '#e9b432');
  band.addColorStop(1, '#9a6414');
  ctx.fillStyle = band;
  ctx.beginPath();
  ctx.moveTo(cx - 13, base - 3.6);
  ctx.quadraticCurveTo(cx, base - 6.4, cx + 13, base - 3.6);
  ctx.lineTo(cx + 13, base + 2);
  ctx.quadraticCurveTo(cx, base - 0.8, cx - 13, base + 2);
  ctx.closePath();
  ctx.fill();
  // pedra vermelha no meio do aro, com brilho que pulsa
  const pulse = 0.7 + 0.3 * Math.sin(time * 3);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(cx, base - 1.6, 3.6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  const gem = ctx.createRadialGradient(cx - 1, base - 3, 0.5, cx, base - 1.6, 3.4);
  gem.addColorStop(0, '#ffd0d8');
  gem.addColorStop(0.4, '#ff3b5c');
  gem.addColorStop(1, '#8a0f24');
  ctx.globalAlpha = 0.75 + 0.25 * pulse;
  ctx.fillStyle = gem;
  ctx.beginPath();
  ctx.ellipse(cx, base - 1.6, 2.6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const ACCESSORY_ART = { capacete: drawHelmet, coroa: drawEmperorCrown, guardiao: drawGuardianCrown };
