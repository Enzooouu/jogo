// Luzes extras da partida de demonstração da tela inicial (mapa Caldeira):
// luz quente do vulcão, luz fria da cachoeira, cristais pulsando, brilho
// descendo a cachoeira, névoa, brasas e gotículas. Tudo em coordenadas do
// mundo, então acompanha a câmera quando ela se afasta.

import { VIEW_W, VIEW_H } from './renderer.js';

const TAU = Math.PI * 2;

// ellipse de luz: centro, raios, cor e força
const LIGHTS = [
  { x: 115, y: 475, rx: 486, ry: 384, c: '255,110,40', a: 0.34, flicker: true },
  { x: 333, y: 706, rx: 282, ry: 205, c: '255,140,60', a: 0.18, flicker: true },
  { x: 1190, y: 396, rx: 384, ry: 435, c: '80,170,255', a: 0.27 },
  { x: 986, y: 533, rx: 179, ry: 128, c: '120,200,255', a: 0.34 },
];
const PLATFORM_GLOW = { fogo: '255,150,70', agua: '120,190,255', meio: '200,130,255' };
const FALLS = { x: 1161, y: 151, w: 69, h: 396 };

export class MenuGlow {
  constructor(seed = 7) {
    this.s = seed;
    this.parts = [];
    for (let i = 0; i < 46; i++) this.parts.push(this.spawn('ember', true));
    for (let i = 0; i < 26; i++) this.parts.push(this.spawn('drop', true));
    for (let i = 0; i < 12; i++) this.parts.push(this.spawn('spark', true));
  }

  rnd(a, b) {
    this.s = (this.s * 16807) % 2147483647;
    return a + ((this.s - 1) / 2147483646) * (b - a);
  }

  spawn(kind, init) {
    const r = (a, b) => this.rnd(a, b);
    const life = init ? r(0, 1) : 1;
    if (kind === 'ember') return { kind, x: r(25, 385), y: init ? r(215, 720) : r(610, 735), vx: r(-5, 13), vy: r(-36, -18), r: r(0.6, 1.8), life, hue: r(18, 42), k: r(0, 9) };
    if (kind === 'drop') return { kind, x: r(1050, 1267), y: init ? r(396, 612) : r(490, 562), vx: r(-26, 26), vy: r(-22, -6), r: r(0.6, 1.4), life };
    return { kind, x: r(896, 1024), y: r(446, 533), vx: r(-5, 5), vy: r(-12, -4), r: r(0.5, 1.1), life };
  }

  draw(ctx, renderer, dt) {
    const cam = renderer.camera;
    const map = renderer.game.map;
    if (map.id !== 'caldeira') return;
    const t = renderer.time;
    const z = renderer.scale * cam.zoom;
    ctx.save();
    ctx.setTransform(z, 0, 0, z, (VIEW_W / 2 - cam.x * cam.zoom) * renderer.scale, (VIEW_H / 2 - cam.y * cam.zoom) * renderer.scale);

    // luzes grandes (fogo à esquerda, água à direita, um toque violeta no meio)
    ctx.globalCompositeOperation = 'screen';
    const flicker = 0.9 + 0.06 * Math.sin(t * 2.1) + 0.04 * Math.sin(t * 5.3);
    for (const L of LIGHTS) this.ellipse(ctx, L.x, L.y, L.rx, L.ry, L.c, L.a * (L.flicker ? flicker : 1), 0.7);
    const mid = ctx.createLinearGradient(map.width * 0.3, 0, map.width * 0.7, 0);
    mid.addColorStop(0, 'rgba(199,125,255,0)');
    mid.addColorStop(0.5, 'rgba(199,125,255,0.07)');
    mid.addColorStop(1, 'rgba(199,125,255,0)');
    ctx.fillStyle = mid;
    ctx.fillRect(map.width * 0.3, -200, map.width * 0.4, map.height + 400);

    // cristais pulsando: o grande do chão e os pendurados nas plataformas
    const pulse = (delay) => 0.5 + 0.5 * Math.sin(((t + delay) / 4) * TAU);
    this.glow(ctx, 986, 514, 38, '150,215,255', 0.55, pulse(0));
    for (const [i, p] of renderer.game.platforms.entries()) {
      const cx = p.x + p.w / 2;
      const side = cx < map.width * 0.42 ? 'fogo' : cx > map.width * 0.58 ? 'agua' : 'meio';
      this.glow(ctx, cx, p.y + 45, side === 'meio' ? 19 : 22, PLATFORM_GLOW[side], 0.6, pulse(1.3 + i * 0.8));
    }

    // cachoeira: faixas de brilho descendo e névoa no pé
    this.falls(ctx, t);
    this.ellipse(ctx, 1178, 562, 102, 58, '210,235,255', 0.28 * (0.55 + 0.45 * pulse(2)), 1);

    // brasas e gotículas
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.parts.length; i++) {
      const p = this.parts[i];
      p.x += p.vx * dt + (p.kind === 'ember' ? Math.sin(t * 1.4 + p.k) * 0.5 : 0);
      p.y += p.vy * dt;
      p.life -= dt * (p.kind === 'ember' ? 0.22 : p.kind === 'drop' ? 0.5 : 0.35);
      if (p.life <= 0) {
        this.parts[i] = this.spawn(p.kind, false);
        continue;
      }
      const a = Math.min(1, p.life * 2) * Math.min(1, (1 - p.life) * 6 + 0.2) * 0.9;
      const col = p.kind === 'ember' ? `hsla(${p.hue},100%,62%,` : p.kind === 'drop' ? 'hsla(205,90%,85%,' : 'hsla(200,100%,75%,';
      const r = p.r * 6;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, `${col}${a})`);
      g.addColorStop(1, `${col}0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  ellipse(ctx, x, y, rx, ry, c, a, stop) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, `rgba(${c},${a})`);
    g.addColorStop(stop, `rgba(${c},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
    ctx.restore();
  }

  glow(ctx, x, y, r, c, a, k) {
    const s = 0.92 + 0.14 * k;
    this.ellipse(ctx, x, y, r * s, r * s, c, a * (0.55 + 0.45 * k), 1);
  }

  falls(ctx, t) {
    const { x, y, w, h } = FALLS;
    if (!this.fallsCanvas) {
      this.fallsCanvas = document.createElement('canvas');
      this.fallsCanvas.width = w * 2;
      this.fallsCanvas.height = h * 2;
    }
    const c = this.fallsCanvas.getContext('2d');
    c.setTransform(2, 0, 0, 2, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, w, h);
    const off = ((t / 1.4) % 1) * 70;
    for (let by = -70 + off; by < h; by += 70) {
      const g = c.createLinearGradient(0, by, 0, by + 34);
      g.addColorStop(0, 'rgba(225,242,255,0)');
      g.addColorStop(0.41, 'rgba(225,242,255,0.09)');
      g.addColorStop(1, 'rgba(225,242,255,0)');
      c.fillStyle = g;
      c.fillRect(0, by, w, 34);
    }
    // apaga as bordas para não ficar um retângulo
    const side = c.createLinearGradient(0, 0, w, 0);
    side.addColorStop(0, 'rgba(0,0,0,0)');
    side.addColorStop(0.25, '#000');
    side.addColorStop(0.75, '#000');
    side.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalCompositeOperation = 'destination-in';
    c.fillStyle = side;
    c.fillRect(0, 0, w, h);
    ctx.drawImage(this.fallsCanvas, x, y, w, h);
  }
}
