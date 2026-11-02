// Desenho dos lutadores (bonecos de palito com o tema do elemento) e das
// armas na mão. A pose é calculada a partir do estado do jogador; nada
// aqui altera a simulação.

import { drawHammerArt, drawHammerSmear } from './hammer-art.js';
import { ELEMENTS } from '/shared/elements.js';
import { drawSwordArt, drawStaffArt, drawSpearArt, drawSlash } from './weapons-art.js';
import { lookOf, aura, scarf, limbStroke, torso, feet, fist, pauldron, head, shade, rgba as rgbaHex } from './look.js';
import { drawSkin, drawScarecrow } from './mannequin.js';
import { drawUniversalSword, drawUniversalStaff, drawUniversalSpear } from './universal-art.js';

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
    weaponSlide: 0,        // empurra a arma ao longo dela (mão mais perto da cabeça)
    smear: null,           // rastro do marretão { from, to, alpha }
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

  if (p.dashTime > 0) {
    // Dash: corpo inclinado, braços e pernas para trás
    pose.lean = 0.55;
    pose.legF = [-0.4, -0.9];
    pose.legB = [-0.9, -0.5];
    pose.armF = [-1.2, -0.9];
    pose.armB = [-1.6, -1.2];
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
    } else if (p.attack.weapon === 'lanca') {
      // Lança: puxa para trás e estoca reto para a frente com as duas mãos
      const thrust = active ? 1 : u / Math.max(0.01, p.attack.startup / p.attack.duration);
      pose.armF = [1.57, 1.57];
      pose.armB = [1.2, 1.5];
      pose.weaponAngle = 1.57;
      pose.lean = active ? 0.42 : -0.12 * thrust;
      pose.thrust = active ? 6 : -6 * Math.min(1, thrust);
      if (active) {
        pose.legF = [0.9, 0.3];
        pose.legB = [-0.7, 0.2];
      }
    } else if (p.attack.weapon === 'marretao') {
      hammerPose(pose, p.attack);
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
  // Segurando a lança (sem atacar): quase deitada na altura da cintura, as
  // duas mãos na haste e o cabo passando para trás do corpo
  if (p.weapon?.id === 'lanca' && !p.attack) {
    pose.armF = [0.75, 1.45];
    pose.armB = [0.3, 1.25];
  }
  // Segurando o marretão: no ombro, a cabeça atrás das costas e as mãos
  // perto da cabeça (o cabo sai para a frente, para baixo)
  if (p.weapon?.id === 'marretao' && !p.attack) {
    pose.armF = [0.35, 2.75];
    pose.armB = [0.1, 2.5];
    pose.weaponAngle = HAMMER.carry;
    pose.weaponSlide = HAMMER.carrySlide;
  }
  return pose;
}

// Marretão em 4 tempos:
//   1. preparo (até o startup): tira do ombro e levanta bem alto atrás da
//      cabeça, agachando e inclinando para trás, e treme um pouco no alto
//   2. descida (0,07 s): acelera em arco e crava a cabeça no chão à frente
//   3. impacto: fica cravado, com um tranco de volta
//   4. recuperação: puxa a marreta do chão
const HAMMER = { carry: 4.0, carrySlide: 24, top: 4.3, ground: 1.3, swing: 0.07, stuck: 0.11 };
const lerp = (a, b, k) => a + (b - a) * k;
const easeOut = (k) => 1 - (1 - k) ** 3;
const easeInOut = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);

function hammerPose(pose, atk) {
  const S = atk.startup;
  const t = atk.t;
  let a;
  if (t < S) {
    const k = easeOut(Math.min(1, t / (S * 0.75)));
    const hold = Math.max(0, (t - S * 0.75) / (S * 0.25));
    a = lerp(HAMMER.carry, HAMMER.top, k) + Math.sin(t * 90) * 0.03 * hold;
    pose.weaponSlide = lerp(HAMMER.carrySlide, 0, k);
    pose.lean = -0.28 * k;
    pose.bob = -3 * k;
    pose.legF = [lerp(0, 0.55, k), lerp(0, -0.35, k)];
    pose.legB = [lerp(0, -0.45, k), lerp(0, 0.05, k)];
    pose.armF = [a - 0.55, a - 0.1];
    pose.armB = [a - 0.75, a - 0.2];
  } else {
    const since = t - S;
    const s = Math.min(1, since / HAMMER.swing);
    const rec = Math.max(0, (since - HAMMER.swing - HAMMER.stuck) / Math.max(0.01, atk.duration - S - HAMMER.swing - HAMMER.stuck));
    // acelera (começa devagar e termina rápido, como um peso caindo)
    a = lerp(HAMMER.top, HAMMER.ground, s * s);
    if (s >= 1) {
      // tranco no impacto e depois puxa de volta
      const bounce = Math.exp(-(since - HAMMER.swing) * 40) * Math.sin((since - HAMMER.swing) * 70) * 0.1;
      a = HAMMER.ground + bounce + easeInOut(Math.min(1, rec)) * 0.25;
    }
    const k = Math.min(1, s * 1.4) * (1 - 0.6 * easeInOut(Math.min(1, rec)));
    pose.lean = lerp(-0.28, 0.55, Math.min(1, s * 1.4)) - 0.3 * easeInOut(Math.min(1, rec));
    pose.bob = -3 - 5 * k;
    pose.legF = [lerp(0.55, 1.05, k), lerp(-0.35, 0.15, k)];
    pose.legB = [lerp(-0.45, -1.0, k), lerp(0.05, 0.25, k)];
    pose.armF = [a - 0.12, a];
    pose.armB = [a - 0.3, a - 0.05];
    pose.weaponSlide = 0;
    // rastro da descida
    if (since < HAMMER.swing + 0.08) {
      pose.smear = { from: HAMMER.top, to: a, alpha: since < HAMMER.swing ? 1 : 1 - (since - HAMMER.swing) / 0.08 };
    }
  }
  pose.weaponAngle = a;
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
  if (p.skin === 'espantalho') {
    drawScarecrow(ctx, p, time);
    ctx.restore();
    if (showName) drawTag(ctx, cx, y - 16, p, teamColor, isLocal);
    return;
  }
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

  // Manequim preto (tutorial e o Mortal) e boneco de treino
  const skin = p.skin ?? (p.element === 'mortal' ? 'manequim' : null);
  if (skin) {
    const weapon = () => {
      if (p.attack?.weapon === 'espada' && pose.weaponAngle !== null && p.attack.t >= p.attack.startup) {
        const u = (p.attack.t - p.attack.startup) / (p.attack.duration - p.attack.startup);
        drawSlash(ctx, 'rgba(235,238,255,0.9)', shoulder, pose.weaponAngle, 2.9, Math.max(0, 1 - u * 1.2));
      }
      if (pose.smear) drawHammerSmear(ctx, 'rgba(235,238,255,0.85)', shoulder, pose.smear);
      const weaponId = p.attack?.weapon ?? p.weapon?.id;
      if (!weaponId) return;
      const angle = pose.weaponAngle ?? (weaponId === 'cajado' ? 2.9 : weaponId === 'lanca' ? 1.78 : pose.armF[1] + 0.6);
      const hand = pose.thrust ? { x: armF.end.x + pose.thrust, y: armF.end.y } : armF.end;
      drawHeldWeapon(ctx, weaponId, p.element, hand, angle, time, weaponId === 'lanca' ? 16 : pose.weaponSlide);
    };
    drawSkin(ctx, skin, { hip, neck, headPos, shoulder, legF, legB, armF, armB }, time, weapon);
    ctx.restore();
    if (showName) drawTag(ctx, cx, y - 16, p, teamColor, isLocal);
    return;
  }

  aura(ctx, k);
  scarf(ctx, p.element, k, neck, time, wind);

  // Membros de trás (mais escuros)
  const back = shade(k.body, p.element === 'ar' ? -0.25 : -0.35);
  limbStroke(ctx, [hip, legB.mid, legB.end], 6 * k.thick, back);
  limbStroke(ctx, [shoulder, armB.mid, armB.end], 5.5 * k.thick, back);

  torso(ctx, p.element, k, shoulder, hip, time);
  limbStroke(ctx, [hip, legF.mid, legF.end], 6.5 * k.thick, k.body, k.bodyHi);
  feet(ctx, p.element, k, legF.end, legB.end, time);

  // Rastro do corte da espada
  if (p.attack?.weapon === 'espada' && pose.weaponAngle !== null && p.attack.t >= p.attack.startup) {
    const u = (p.attack.t - p.attack.startup) / (p.attack.duration - p.attack.startup);
    drawSlash(ctx, rgbaHex(k.glow2, 0.9), shoulder, pose.weaponAngle, 2.9, Math.max(0, 1 - u * 1.2));
  }

  if (pose.smear) drawHammerSmear(ctx, rgbaHex(k.glow2, 0.85), shoulder, pose.smear);

  // Arma (atrás do braço da frente)
  if (p.weapon || (p.attack && p.attack.weapon)) {
    const weaponId = p.attack?.weapon ?? p.weapon?.id;
    // lança: quase na horizontal, um pouco para cima, segurada mais no meio
    const angle = pose.weaponAngle ?? (weaponId === 'cajado' ? 2.9 : weaponId === 'lanca' ? 1.78 : pose.armF[1] + 0.6);
    const hand = pose.thrust ? { x: armF.end.x + pose.thrust, y: armF.end.y } : armF.end;
    drawHeldWeapon(ctx, weaponId, p.element, hand, angle, time, weaponId === 'lanca' ? 16 : pose.weaponSlide);
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

// `slide` empurra a arma para trás ao longo dela (a mão fica mais no meio)
export function drawHeldWeapon(ctx, weaponId, elementId, hand, angle, time, slide = 0) {
  ctx.save();
  ctx.translate(hand.x, hand.y);
  // angle: 0 = para baixo; giramos para que o eixo -y local aponte para o ângulo
  ctx.rotate(-angle + Math.PI);
  ctx.translate(0, slide);
  // Mortal (sem elemento): armas padrão, as universais
  if (weaponId === 'marretao') drawHammerArt(ctx, elementId, time);
  else if (elementId === 'mortal') {
    if (weaponId === 'espada') drawUniversalSword(ctx, time);
    else if (weaponId === 'cajado') drawUniversalStaff(ctx, time);
    else if (weaponId === 'lanca') drawUniversalSpear(ctx, time);
  } else if (weaponId === 'espada') drawSwordArt(ctx, elementId, time);
  else if (weaponId === 'cajado') drawStaffArt(ctx, elementId, time);
  else if (weaponId === 'lanca') drawSpearArt(ctx, elementId, time);
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
