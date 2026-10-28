// Desenho dos lutadores (bonecos de palito com o tema do elemento) e das
// armas na mão. A pose é calculada a partir do estado do jogador; nada
// aqui altera a simulação.

import { ELEMENTS } from '/shared/elements.js';
import { lookOf, aura, scarf, limbStroke, torso, feet, fist, pauldron, head, shade } from './look.js';

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

  if (p.onWall) {
    // Pendurado: mãos na parede, pés apoiados, corpo um pouco afastado
    const slide = Math.min(1, Math.max(0, p.vy) / 150);
    pose.lean = -0.18;
    pose.armF = [2.6 - slide * 0.3, 2.1];
    pose.armB = [2.1, 1.5];
    pose.legF = [1.0, 0.35];
    pose.legB = [0.45, -0.3];
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
  const k = lookOf(p.element);
  const pose = computePose(p, vis, time);
  const dir = p.facing;
  const cx = x + p.w / 2;
  const footY = y + p.h;

  ctx.save();
  if (p.invuln > 0 && Math.floor(time * 14) % 2 === 0) ctx.globalAlpha = 0.35;

  ctx.translate(cx, footY);
  ctx.scale(dir, 1);
  if (p.hitstun > 0) ctx.rotate(-0.25 * Math.sign(p.vx || 1) * dir);

  const hip = { x: 0, y: -24 - pose.bob };
  const neck = { x: Math.sin(pose.lean) * 20, y: hip.y - Math.cos(pose.lean) * 20 };
  const headPos = { x: neck.x + Math.sin(pose.lean) * 12, y: neck.y - Math.cos(pose.lean) * 12 };
  const shoulder = { x: hip.x + (neck.x - hip.x) * 0.86, y: hip.y + (neck.y - hip.y) * 0.86 };

  const legF = limb(hip, pose.legF);
  const legB = limb(hip, pose.legB);
  const armF = limb(shoulder, pose.armF);
  const armB = limb(shoulder, pose.armB);
  const wind = Math.min(1, Math.abs(p.vx) / 300 + (p.onGround ? 0 : 0.4)) + 0.2;

  aura(ctx, k);
  scarf(ctx, p.element, k, neck, time, wind);

  // Membros de trás (mais escuros)
  const back = shade(k.body, p.element === 'ar' ? -0.25 : -0.35);
  limbStroke(ctx, [hip, legB.mid, legB.end], 6 * k.thick, back);
  limbStroke(ctx, [shoulder, armB.mid, armB.end], 5.5 * k.thick, back);

  torso(ctx, p.element, k, shoulder, hip, time);
  limbStroke(ctx, [hip, legF.mid, legF.end], 6.5 * k.thick, k.body, k.bodyHi);
  feet(ctx, p.element, k, legF.end, legB.end, time);

  // Arma (atrás do braço da frente)
  if (p.weapon || (p.attack && p.attack.weapon)) {
    const weaponId = p.attack?.weapon ?? p.weapon?.id;
    const angle = pose.weaponAngle ?? (weaponId === 'cajado' ? 2.9 : pose.armF[1] + 0.6);
    drawHeldWeapon(ctx, weaponId, p.element, armF.end, angle, time);
  }
  limbStroke(ctx, [shoulder, armF.mid, armF.end], 6 * k.thick, k.body, k.bodyHi);
  fist(ctx, p.element, k, armF.end, time);
  if (p.element === 'terra') pauldron(ctx, k, shoulder);

  head(ctx, p.element, k, headPos, time);
  ctx.restore();

  // Marcadores acima da cabeça (não espelhados)
  if (showName) drawTag(ctx, cx, y - 16, p, teamColor, isLocal);
}

function limb(start, [a1, a2]) {
  const mid = { x: start.x + Math.sin(a1) * LIMB, y: start.y + Math.cos(a1) * LIMB };
  const end = { x: mid.x + Math.sin(a2) * LIMB, y: mid.y + Math.cos(a2) * LIMB };
  return { mid, end };
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
