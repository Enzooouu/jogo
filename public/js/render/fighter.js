// Desenho dos lutadores (bonecos de palito com o tema do elemento) e das
// armas na mão. A pose é calculada a partir do estado do jogador; nada
// aqui altera a simulação.

import { ELEMENTS } from '/shared/elements.js';

const OUTLINE = '#0c0710';
const LIMB = 11;          // comprimento de cada metade de braço/perna

// Ângulos em radianos medidos a partir de "para baixo"; positivo = para a
// frente (lado para onde o lutador olha).
function computePose(p, vis, time) {
  const pose = {
    lean: 0, bob: 0,
    legF: [0.18, 0.05], legB: [-0.18, 0.05],
    armF: [0.6, 1.9], armB: [-0.25, 1.0],
    weaponAngle: null,     // ângulo da arma (se estiver atacando com ela)
  };
  const speed = Math.abs(p.vx);

  if (p.hitstun > 0) {
    const f = Math.sin(time * 40) * 0.3;
    pose.lean = -0.45;
    pose.legF = [0.7 + f, -0.3];
    pose.legB = [-0.5 - f, 0.4];
    pose.armF = [2.4 + f, 0.4];
    pose.armB = [-2.2 - f, -0.3];
    return pose;
  }

  if (!p.onGround) {
    if (p.vy < 0) {
      pose.legF = [0.9, -1.1];
      pose.legB = [0.2, -0.9];
      pose.armF = [2.3, 0.5];
      pose.armB = [-2.0, -0.4];
    } else {
      pose.legF = [0.35, -0.2];
      pose.legB = [-0.35, 0.3];
      pose.armF = [1.7, 0.5];
      pose.armB = [-1.5, -0.3];
    }
  } else if (speed > 30) {
    const ph = vis.runPhase;
    const s = Math.sin(ph);
    pose.lean = 0.18;
    pose.legF = [s * 0.8, s * 0.8 - 0.7 - 0.4 * Math.max(0, Math.cos(ph))];
    pose.legB = [-s * 0.8, -s * 0.8 - 0.7 - 0.4 * Math.max(0, -Math.cos(ph))];
    pose.armF = [-s * 0.9 + 0.3, 1.4];
    pose.armB = [s * 0.9 + 0.3, 1.4];
    pose.bob = Math.abs(Math.cos(ph)) * 2;
  } else {
    pose.bob = Math.sin(time * 3 + p.slot) * 0.8;
  }

  if (p.attack) {
    const u = Math.min(1, p.attack.t / p.attack.duration);
    const active = p.attack.t >= p.attack.startup;
    if (p.attack.weapon === 'espada') {
      // Golpe de cima para baixo à frente
      const a = active ? 2.9 - Math.min(1, (u - 0.25) / 0.45) * 2.2 : 2.9 + u * 0.6;
      pose.armF = [a, a];
      pose.weaponAngle = a;
      pose.lean = 0.2;
    } else if (p.attack.weapon === 'cajado') {
      pose.armF = [1.57, 1.57];
      pose.weaponAngle = 1.57;
      pose.lean = active ? -0.1 : 0.05;
    } else {
      // Soco: recolhe e estica o braço
      if (active && u < 0.75) pose.armF = [1.57, 1.57];
      else pose.armF = [0.9, 2.5];
      pose.armB = [-0.6, 0.6];
      pose.lean = active ? 0.25 : -0.05;
    }
  }
  return pose;
}

export function drawFighter(ctx, p, x, y, vis, time, { teamColor, isLocal, showName = true }) {
  const el = ELEMENTS[p.element];
  const pose = computePose(p, vis, time);
  const dir = p.facing;
  const cx = x + p.w / 2;
  const footY = y + p.h;

  ctx.save();
  if (p.invuln > 0 && Math.floor(time * 14) % 2 === 0) ctx.globalAlpha = 0.35;

  // Sombra/brilho do elemento
  ctx.save();
  ctx.translate(cx, footY - 30);
  const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
  aura.addColorStop(0, hexA(el.color, 0.32));
  aura.addColorStop(1, hexA(el.color, 0));
  ctx.fillStyle = aura;
  ctx.fillRect(-46, -46, 92, 92);
  ctx.restore();

  ctx.translate(cx, footY);
  ctx.scale(dir, 1);
  if (p.hitstun > 0) ctx.rotate(-0.25 * Math.sign(p.vx || 1) * dir);

  const hip = { x: 0, y: -24 - pose.bob };
  const neck = { x: Math.sin(pose.lean) * 20, y: hip.y - Math.cos(pose.lean) * 20 };
  const head = { x: neck.x + Math.sin(pose.lean) * 11, y: neck.y - Math.cos(pose.lean) * 11 };
  const shoulder = { x: hip.x + (neck.x - hip.x) * 0.85, y: hip.y + (neck.y - hip.y) * 0.85 };

  const legF = limb(hip, pose.legF);
  const legB = limb(hip, pose.legB);
  const armF = limb(shoulder, pose.armF);
  const armB = limb(shoulder, pose.armB);

  // Membros de trás (mais escuros)
  stroke(ctx, [hip, legB.mid, legB.end], el.dark, 6);
  stroke(ctx, [shoulder, armB.mid, armB.end], el.dark, 6);

  // Tronco e membros da frente
  stroke(ctx, [hip, neck], el.color, 7);
  stroke(ctx, [hip, legF.mid, legF.end], el.color, 6);

  // Arma (atrás do braço da frente)
  if (p.weapon || (p.attack && p.attack.weapon)) {
    const weaponId = p.attack?.weapon ?? p.weapon?.id;
    const angle = pose.weaponAngle ?? (weaponId === 'cajado' ? 2.9 : pose.armF[1] + 0.6);
    drawHeldWeapon(ctx, weaponId, p.element, armF.end, angle, time);
  }
  stroke(ctx, [shoulder, armF.mid, armF.end], el.color, 6);

  // Mão
  ctx.fillStyle = el.light;
  ctx.beginPath();
  ctx.arc(armF.end.x, armF.end.y, 3.5, 0, Math.PI * 2);
  ctx.fill();

  drawHead(ctx, head, p.element, time);
  ctx.restore();

  // Marcadores acima da cabeça (não espelhados)
  if (showName) drawTag(ctx, cx, y - 16, p, teamColor, isLocal);
}

function limb(start, [a1, a2]) {
  const mid = { x: start.x + Math.sin(a1) * LIMB, y: start.y + Math.cos(a1) * LIMB };
  const end = { x: mid.x + Math.sin(a2) * LIMB, y: mid.y + Math.cos(a2) * LIMB };
  return { mid, end };
}

function stroke(ctx, pts, color, width) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [c, w] of [[OUTLINE, width + 4], [color, width]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }
}

function drawHead(ctx, head, elementId, time) {
  const el = ELEMENTS[elementId];
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;

  if (elementId === 'fogo') {
    // Chamas no topo da cabeça
    for (let i = 0; i < 3; i++) {
      const flick = Math.sin(time * 18 + i * 2.1) * 3;
      const bx = -7 + i * 7;
      ctx.fillStyle = i === 1 ? el.light : el.color;
      ctx.beginPath();
      ctx.moveTo(bx - 5, -4);
      ctx.quadraticCurveTo(bx - 2 + flick * 0.3, -14, bx + flick * 0.5 - 2, -22 - (i === 1 ? 6 : 0) + flick);
      ctx.quadraticCurveTo(bx + 4, -12, bx + 5, -4);
      ctx.fill();
    }
    ctx.fillStyle = el.color;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (elementId === 'agua') {
    // Cabeça em forma de gota
    ctx.fillStyle = el.color;
    ctx.beginPath();
    ctx.moveTo(-3, -19);
    ctx.quadraticCurveTo(-11, -6, -10, 1);
    ctx.arc(0, 1, 10, Math.PI, 0, true);
    ctx.quadraticCurveTo(11, -6, -3, -19);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(-4, -4, 2.2, 4, 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = el.color;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Olho "bravo" virado para a frente
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(2, -2);
  ctx.lineTo(9, -4);
  ctx.lineTo(8, 1);
  ctx.lineTo(3, 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(6, -2, 2, 2);
  ctx.restore();
}

export function drawHeldWeapon(ctx, weaponId, elementId, hand, angle, time) {
  const el = ELEMENTS[elementId];
  ctx.save();
  ctx.translate(hand.x, hand.y);
  // angle: 0 = para baixo; giramos para que o eixo +y local aponte para o ângulo
  ctx.rotate(-angle + Math.PI);
  if (weaponId === 'espada') drawSword(ctx, el, time);
  else if (weaponId === 'cajado') drawStaff(ctx, el, time);
  ctx.restore();
}

// Espada apontando para -y (a partir da mão)
export function drawSword(ctx, el, time) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(0, -46);
  ctx.stroke();
  // lâmina
  ctx.shadowColor = el.color;
  ctx.shadowBlur = 12 + Math.sin(time * 10) * 4;
  const g = ctx.createLinearGradient(0, -46, 0, -6);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, el.light);
  ctx.strokeStyle = g;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(0, -46);
  ctx.stroke();
  ctx.shadowBlur = 0;
  // guarda e cabo
  ctx.strokeStyle = el.dark;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-7, -6);
  ctx.lineTo(7, -6);
  ctx.stroke();
  ctx.strokeStyle = '#3a2516';
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(0, 5);
  ctx.stroke();
}

export function drawStaff(ctx, el, time) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.lineTo(0, -34);
  ctx.stroke();
  ctx.strokeStyle = '#7a5532';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.shadowColor = el.color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = el.color;
  ctx.beginPath();
  ctx.arc(0, -38, 7 + Math.sin(time * 6) * 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = el.light;
  ctx.beginPath();
  ctx.arc(-2, -40, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawTag(ctx, cx, y, p, teamColor, isLocal) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '700 12px system-ui, sans-serif';
  const label = isLocal ? 'VOCÊ' : p.name;
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.strokeText(label, cx, y - 8);
  ctx.fillStyle = isLocal ? '#ffffff' : teamColor;
  ctx.fillText(label, cx, y - 8);
  // triângulo do time
  ctx.fillStyle = teamColor;
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 6, y - 3);
  ctx.lineTo(cx + 6, y - 3);
  ctx.lineTo(cx, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
