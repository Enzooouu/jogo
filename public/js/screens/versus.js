// Tela "Versus": seu time de um lado, o adversário do outro, antes da luta.

import { ELEMENTS } from '/shared/elements.js';
import { drawPortrait, fitCanvas } from '../render/portrait.js';

// Fundo de cada lado conforme o elemento
const PALETTE = {
  fogo: { inner: '#7a2408', mid: '#3a0d0a', outer: '#12060a', fx: 'brasas' },
  agua: { inner: '#0b3f8a', mid: '#0a1d3f', outer: '#05080f', fx: 'chuva' },
  terra: { inner: '#5a3a18', mid: '#2a1a0a', outer: '#0d0804', fx: 'brasas' },
  ar: { inner: '#3c6e66', mid: '#1a302c', outer: '#070d0c', fx: 'chuva' },
};

export class VersusScreen {
  constructor(canvas) {
    this.canvas = canvas;
    this.frame = null;
  }

  start(setup) {
    this.setup = setup;
    const me = setup.players.find((p) => p.id === setup.localPlayerId);
    this.left = setup.players.filter((p) => p.team === me.team);
    this.right = setup.players.filter((p) => p.team !== me.team);
    const t0 = performance.now();
    const loop = (now) => {
      this.draw((now - t0) / 1000 + 1);
      this.frame = requestAnimationFrame(loop);
    };
    this.stop();
    this.frame = requestAnimationFrame(loop);
  }

  stop() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  draw(t) {
    const { ctx, w, h } = fitCanvas(this.canvas);
    const mid = w / 2;
    const slant = Math.min(90, w * 0.07);
    const leftEl = this.left[0].element;
    const rightEl = this.right[0].element;

    this.half(ctx, w, h, leftEl, [[0, 0], [mid + slant, 0], [mid - slant, h], [0, h]], w * 0.25, t, 0);
    this.half(ctx, w, h, rightEl, [[mid + slant, 0], [w, 0], [w, h], [mid - slant, h]], w * 0.75, t, mid - slant);

    // Linha brilhante da divisão
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#c77dff';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.moveTo(mid + slant, 0);
    ctx.lineTo(mid - slant, h);
    ctx.stroke();
    ctx.restore();

    const floor = h * 0.83;
    this.team(ctx, this.left, w * 0.3, floor, 1, h, t, 'espada');
    this.team(ctx, this.right, w * 0.7, floor, -1, h, t, 'cajado');

    // VS
    ctx.save();
    ctx.translate(mid, h * 0.5);
    ctx.rotate(-0.12);
    const size = Math.min(110, w * 0.09);
    ctx.font = `italic 900 ${size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = size * 0.11;
    ctx.strokeStyle = '#000';
    ctx.strokeText('VS', 0, 0);
    const g = ctx.createLinearGradient(-size * 0.6, 0, size * 0.6, 0);
    g.addColorStop(0, ELEMENTS[leftEl].light);
    g.addColorStop(1, ELEMENTS[rightEl].light);
    ctx.fillStyle = g;
    ctx.fillText('VS', 0, 0);
    ctx.restore();
  }

  half(ctx, w, h, element, poly, cx, t, x0) {
    const pal = PALETTE[element] ?? PALETTE.fogo;
    ctx.save();
    ctx.beginPath();
    poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.clip();
    const g = ctx.createRadialGradient(cx, h * 0.6, 20, cx, h * 0.6, w * 0.6);
    g.addColorStop(0, pal.inner);
    g.addColorStop(0.5, pal.mid);
    g.addColorStop(1, pal.outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const span = w / 2 + 100;
    if (pal.fx === 'brasas') {
      for (let i = 0; i < 120; i++) {
        const x = x0 + ((i * 97.3) % span);
        const y = h - ((i * 53.1 + t * 40) % h);
        ctx.fillStyle = `rgba(255,${150 + (i % 80)},60,${0.3 + (i % 5) / 10})`;
        ctx.fillRect(x, y, 2, 2);
      }
    } else {
      ctx.fillStyle = 'rgba(160,220,255,0.35)';
      for (let i = 0; i < 90; i++) {
        const x = x0 + ((i * 71.7) % span);
        const y = (i * 41.3 + t * 70) % h;
        ctx.fillRect(x, y, 1.5, 9);
      }
    }
    ctx.restore();
  }

  // Desenha o time: o primeiro na frente e grande, os outros atrás.
  team(ctx, members, cx, floor, facing, h, t, weapon) {
    const n = members.length;
    const scale = Math.min(h / 130, 5.2) * (n === 1 ? 1 : n === 2 ? 0.86 : 0.76);
    const spots = [];
    for (let i = n - 1; i >= 0; i--) {
      const back = i === 0 ? 0 : i;
      spots.push({
        p: members[i],
        x: cx - facing * back * scale * 26 * (i % 2 ? 1 : -0.6),
        y: floor - back * scale * 6,
        s: scale * (1 - back * 0.14),
        dim: back * 0.22,
      });
    }
    for (const s of spots) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.s * 30, s.s * 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.globalAlpha = 1 - s.dim * 0.6;
      drawPortrait(ctx, s.p.element, s.x, s.y, s.s, {
        facing,
        time: t + s.p.id,
        extra: s.dim === 0 ? { weapon: { id: weapon } } : {},
      });
      ctx.restore();
    }
  }
}
