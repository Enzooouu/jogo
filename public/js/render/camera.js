// Câmera: o mapa inteiro fica sempre visível. Quando alguém sai da área
// principal, a câmera se afasta (zoom out) para acompanhar e volta quando
// todos retornam.

const MARGIN_X = 90;      // folga em volta dos jogadores (unidades do mundo)
const MARGIN_TOP = 120;   // folga maior em cima (nome acima da cabeça)
const MARGIN_BOTTOM = 110; // espaço do placar embaixo da tela
const MIN_ZOOM = 0.5;
const SMOOTH = 4.5;       // quanto maior, mais rápido acompanha

export class Camera {
  constructor(viewW, viewH, home) {
    this.viewW = viewW;
    this.viewH = viewH;
    this.home = home;     // retângulo que sempre aparece (a área principal)
    this.x = home.x + home.w / 2;
    this.y = home.y + home.h / 2;
    this.zoom = Math.min(viewW / home.w, viewH / home.h);
  }

  target(players) {
    // modo "foco" (Assistir com a tela em pé): só uma faixa do meio aparece
    // (`focus.frac` da largura); a câmera chega perto e segue só os lutadores
    // fim da luta (animação de vitória): abre para mostrar o mapa
    if (this.focus?.wide) {
      const visW = this.viewW * this.focus.frac;
      const zoom = Math.max(0.36, Math.min(1, visW / (this.home.w * 0.72)));
      return { x: this.home.x + this.home.w / 2, y: this.home.y + this.home.h * 0.55, zoom };
    }
    if (this.focus && players.length) {
      let l = Infinity;
      let r = -Infinity;
      let t = Infinity;
      let b = -Infinity;
      for (const p of players) {
        l = Math.min(l, p.x - 70);
        r = Math.max(r, p.x + p.w + 70);
        t = Math.min(t, p.y - 110);
        b = Math.max(b, p.y + p.h + 90);
      }
      const visW = this.viewW * this.focus.frac;
      // um pouco afastado (0,85) para ver mais do cenário em volta da luta
      const zoom = Math.max(0.4, Math.min(1.45, 0.85 * Math.min(visW / (r - l), this.viewH / (b - t))));
      return { x: (l + r) / 2, y: (t + b) / 2, zoom };
    }
    let { x: left, y: top } = this.home;
    let right = left + this.home.w;
    let bottom = top + this.home.h;
    for (const p of players) {
      left = Math.min(left, p.x - MARGIN_X);
      right = Math.max(right, p.x + p.w + MARGIN_X);
      top = Math.min(top, p.y - MARGIN_TOP);
      bottom = Math.max(bottom, p.y + p.h + MARGIN_BOTTOM);
    }
    const zoom = Math.max(MIN_ZOOM, Math.min(this.viewW / (right - left), this.viewH / (bottom - top)));
    return { x: (left + right) / 2, y: (top + bottom) / 2, zoom };
  }

  update(dt, players) {
    const t = this.target(players);
    const k = 1 - Math.exp(-SMOOTH * dt);
    // Afasta rápido (ninguém some da tela) e volta mais devagar.
    const kz = t.zoom < this.zoom ? 1 - Math.exp(-SMOOTH * 2 * dt) : k;
    this.zoom += (t.zoom - this.zoom) * kz;
    this.x += (t.x - this.x) * kz;
    this.y += (t.y - this.y) * kz;
  }

  // Mundo -> tela (unidades lógicas da tela 1280x720)
  toScreen(wx, wy) {
    return {
      x: (wx - this.x) * this.zoom + this.viewW / 2,
      y: (wy - this.y) * this.zoom + this.viewH / 2,
    };
  }

  // Transformação para uma camada de fundo com paralaxe `f`
  // (0 = parada no céu, 1 = anda junto com o mundo).
  layer(f) {
    const zoom = 1 + (this.zoom - 1) * f;
    const cx = this.home.x + this.home.w / 2;
    const cy = this.home.y + this.home.h / 2;
    const x = cx + (this.x - cx) * f;
    const y = cy + (this.y - cy) * f;
    return { zoom, ox: this.viewW / 2 - x * zoom, oy: this.viewH / 2 - y * zoom };
  }
}
