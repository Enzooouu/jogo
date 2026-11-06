// Foto de perfil: um personagem (busto) ou uma arma, dentro de um círculo
// com a cor do elemento. `pic` é 'el:<elemento>' ou 'arma:<arma>:<elemento>'.

import { ELEMENTS } from '/shared/elements.js';
import { drawPortrait } from './portrait.js';
import { drawHeldWeapon } from './fighter.js';

// comprimento de cada arma a partir da mão (para caber no círculo)
const REACH = { espada: { back: 26, front: 92 }, cajado: { back: 30, front: 100 }, lanca: { back: 36, front: 118 }, marretao: { back: 24, front: 104 } };

export function parsePic(pic) {
  const [kind, a, b] = String(pic || '').split(':');
  if (kind === 'arma' && REACH[a]) return { kind: 'arma', weapon: a, element: ELEMENTS[b] ? b : 'fogo' };
  if (kind === 'el' && ELEMENTS[a]) return { kind: 'el', element: a };
  return { kind: 'el', element: 'fogo' };
}

export function drawAvatar(ctx, w, h, pic, time = 0) {
  const p = parsePic(pic);
  const el = ELEMENTS[p.element];
  ctx.clearRect(0, 0, w, h);
  // fundo: brilho da cor do elemento
  const g = ctx.createRadialGradient(w / 2, h * 0.62, 0, w / 2, h * 0.55, w * 0.7);
  g.addColorStop(0, hexA(el.light, 0.55));
  g.addColorStop(0.5, hexA(el.color, 0.38));
  g.addColorStop(1, 'rgba(12,8,22,0.95)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  if (p.kind === 'el') {
    drawPortrait(ctx, p.element, w / 2, h * 1.55, (h / 150) * 3, { facing: 1, time });
    return;
  }
  // arma na diagonal, apontando para cima e para a direita
  const r = REACH[p.weapon];
  const len = r.back + r.front;
  const s = (Math.min(w, h) * 1.36) / len;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(s, s);
  const mid = (r.front - r.back) / 2;   // meio da arma, a partir da mão
  const dir = { x: Math.SQRT1_2, y: -Math.SQRT1_2 };
  const hand = { x: -dir.x * mid, y: -dir.y * mid };
  // ângulo: 0 = para baixo, PI = para cima; 3PI/4 = diagonal para cima e direita
  drawHeldWeapon(ctx, p.weapon, p.element, hand, (3 * Math.PI) / 4, time);
  ctx.restore();
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
