// Partículas puramente visuais (faíscas, brasas, gotas, fumaça, anéis).
// Não afetam a simulação, por isso usam Math.random à vontade.

export class Particles {
  constructor(max = 900) {
    this.list = [];
    this.max = max;
  }

  add(p) {
    if (this.list.length >= this.max) this.list.shift();
    this.list.push({
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0.5, maxLife: p.life ?? 0.5,
      size: 3, grow: 0, gravity: 0, drag: 0,
      color: '#fff', type: 'dot', alpha: 1,
      ...p,
    });
  }

  burst(x, y, { count = 10, speed = 200, spread = Math.PI * 2, angle = 0, ...rest } = {}) {
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const s = speed * (0.35 + Math.random() * 0.65);
      const life = (rest.life ?? 0.5) * (0.6 + Math.random() * 0.6);
      this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, ...rest, life, maxLife: life });
    }
  }

  update(dt) {
    const keep = [];
    for (const p of this.list) {
      p.life -= dt;
      if (p.life <= 0) continue;
      p.vy += p.gravity * dt;
      if (p.drag) {
        const k = Math.max(0, 1 - p.drag * dt);
        p.vx *= k;
        p.vy *= k;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size = Math.max(0, p.size + p.grow * dt);
      keep.push(p);
    }
    this.list = keep;
  }

  draw(ctx) {
    for (const p of this.list) {
      const t = p.life / p.maxLife;
      ctx.globalAlpha = Math.max(0, Math.min(1, t * p.alpha * 1.4));
      if (p.type === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, 4 * t);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'spark') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
        ctx.stroke();
      } else if (p.type === 'text') {
        ctx.fillStyle = p.color;
        ctx.font = `900 ${p.size}px ${p.font ?? 'system-ui, sans-serif'}`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(0,0,0,0.75)';
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}
