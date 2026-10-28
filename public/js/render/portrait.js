// Bonecos grandes e parados para as telas de menu (cartas, versus, modos).

import { drawFighter } from './fighter.js';

export function portraitPlayer(element, extra = {}) {
  return {
    element, facing: 1, slot: 0, w: 30, h: 66, vx: 0, vy: 0, onGround: true, hitstun: 0, invuln: 0,
    status: {}, attack: null, weapon: null, name: '', onWall: 0, ...extra,
  };
}

// Desenha um lutador com os pés em (cx, footY), `scale` vezes maior.
export function drawPortrait(ctx, element, cx, footY, scale, { facing = 1, time = 0, extra = {} } = {}) {
  ctx.save();
  ctx.translate(cx, footY);
  ctx.scale(scale, scale);
  const p = portraitPlayer(element, { facing, ...extra });
  drawFighter(ctx, p, -15, -66, { runPhase: 0 }, time, { teamColor: '#fff', isLocal: false, showName: false });
  ctx.restore();
}

// Ajusta o tamanho interno do canvas ao tamanho na tela (nitidez em telas retina).
export function fitCanvas(canvas) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const r = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width * dpr));
  const h = Math.max(1, Math.round(r.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, r.width, r.height);
  return { ctx, w: r.width, h: r.height };
}
