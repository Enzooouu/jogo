// Navio Voador: o que acontece só neste mapa.
//   - os dois navios sobem e descem devagar (cada um num ritmo) e os mastros
//     balançam para os lados, levando junto a verga e a gávea
//   - no convés, quem está parado escorrega um pouco para o lado que o navio
//     está inclinando
//   - um canhão perto do tombadilho de cada navio dispara (um de cada vez)
//     uma bala em arco por cima do vão, que cai no tombadilho do outro navio:
//     quem estiver no caminho é arremessado, e a queda explode
//
// Não desenha nada; o desenho fica em public/js/render/stage-navio.js.

import { DT } from './constants.js';
import { circleRectOverlap } from './geometry.js';
import { ELEMENTS } from './elements.js';

export const SHIP = {
  bob: 5,              // quanto sobe e desce (px)
  period: [5.6, 6.4],  // segundos de uma subida e descida (cada navio um)
  lean: 0.055,         // inclinação máxima dos mastros (radianos)
  slide: 45,           // escorregada no convés com o navio inclinado (px/s)
  cannon: {
    first: 8,          // primeiro tiro
    every: 14,         // tempo entre um tiro e outro (alterna os navios)
    fuse: 1.5,         // pavio aceso antes do tiro
    flight: 1.1,       // tempo da bala no ar
    gravity: 900,
    r: 13,
    hit: { damage: 12, kbBase: 420, kbScale: 3.0, angle: 0.5 },
    boom: { radius: 95, damage: 10, kbBase: 380, kbScale: 2.8, angle: 0.8 },
  },
};

export class Airships {
  constructor(game) {
    this.game = game;
    this.cfg = game.map.ships;
    this.state = this.cfg.map((s, i) => ({ bob: 0, lean: 0, phase: i * Math.PI * 0.85 }));
    this.cannon = { ship: 0, state: 'espera', time: SHIP.cannon.first };
    this.balls = [];
    this.tick = -1;
    this.cache = null;
    // posição de cada plataforma presa num mastro (altura acima do convés)
    for (const pl of game.platforms) {
      if (pl.ship == null) continue;
      pl.mastHeight = this.cfg[pl.ship].deckY - pl.y;
    }
  }

  // ---------------------------------------------------------- consulta

  // Chão de agora: o sólido de cada navio, subindo e descendo junto
  solids() {
    if (this.cache?.tick === this.game.tick) return this.cache.solids;
    const solids = this.game.map.solids.map((s) => (s.ship == null ? s : { ...s, y: s.y + this.state[s.ship].bob }));
    this.cache = { tick: this.game.tick, solids };
    return solids;
  }

  // ---------------------------------------------------------- passo

  update() {
    const t = this.game.time;
    // quem está em pé num navio sobe e desce junto (senão o convés subindo
    // "entra" no pé e empurra o jogador de lado)
    const before = this.state.map((st) => st.bob);
    const riders = [];
    for (const p of this.game.players) {
      if (p.state !== 'alive' || !p.onGround || p.standingOn !== 'solid') continue;
      const feet = p.y + p.h;
      const s = this.solids().find((q) => q.ship != null && Math.abs(q.y - feet) < 2 && p.x + p.w > q.x && p.x < q.x + q.w);
      if (s) riders.push([p, s.ship]);
    }
    this.state.forEach((st, i) => {
      const w = (Math.PI * 2) / SHIP.period[i];
      st.bob = Math.sin(t * w + st.phase) * SHIP.bob;
      st.lean = Math.sin(t * w * 0.8 + st.phase + 1) * SHIP.lean;
    });
    this.cache = null;
    for (const [p, i] of riders) p.y += this.state[i].bob - before[i];
    this.updateCannon();
    this.updateBalls();
  }

  // Chamado dentro de updatePlatforms: move a verga e a gávea com o navio
  movePlatforms() {
    for (const pl of this.game.platforms) {
      if (pl.bridge) {
        // a prancha fica na média da altura dos dois conveses
        const y = pl.baseY + (this.state[0].bob + this.state[1].bob) / 2;
        pl.dy = y - pl.y;
        pl.y = y;
        continue;
      }
      if (pl.ship == null) continue;
      const st = this.state[pl.ship];
      const x = pl.baseX + Math.sin(st.lean) * pl.mastHeight;
      const y = pl.baseY + st.bob;
      pl.dx = x - pl.x;
      pl.dy = y - pl.y;
      pl.x = x;
      pl.y = y;
    }
  }

  // Escorregada no convés: quem está em pé num navio vai um pouco para o
  // lado que ele está inclinando
  slidePush(p) {
    if (!p.onGround) return 0;
    let ship = null;
    if (p.standingOn === 'platform') ship = this.game.platforms[p.platform]?.ship;
    else {
      const feet = p.y + p.h;
      const s = this.solids().find((q) => q.ship != null && Math.abs(q.y - feet) < 2 && p.x + p.w > q.x && p.x < q.x + q.w);
      ship = s?.ship;
    }
    if (ship == null) return 0;
    return (this.state[ship].lean / SHIP.lean) * SHIP.slide;
  }

  // Canhão: espera -> pavio (aviso) -> tiro; depois é a vez do outro navio
  updateCannon() {
    const g = this.game;
    const c = this.cannon;
    const cfg = SHIP.cannon;
    c.time -= DT;
    if (c.time > 0) return;
    const ship = this.cfg[c.ship];
    if (c.state === 'espera') {
      c.state = 'pavio';
      c.time = cfg.fuse;
      g.emit('cannonFuse', { ship: c.ship, x: ship.cannon.x, y: ship.deckY, tx: ship.target.x, ty: ship.target.y });
      return;
    }
    // fogo!
    const st = this.state[c.ship];
    const x0 = ship.cannon.x + ship.cannon.dir * 34;
    const y0 = ship.deckY + st.bob - 16;
    const tx = ship.target.x;
    const ty = ship.target.y + this.state[1 - c.ship].bob;
    const T = cfg.flight;
    this.balls.push({
      id: g.nextEntityId++, ship: c.ship, x: x0, y: y0,
      vx: (tx - x0) / T, vy: (ty - y0 - 0.5 * cfg.gravity * T * T) / T,
      time: T + 0.4, hitIds: [],
    });
    g.emit('cannonFire', { ship: c.ship, x: x0, y: y0, dir: ship.cannon.dir });
    c.state = 'espera';
    c.time = cfg.every - cfg.fuse;
    c.ship = 1 - c.ship;
  }

  updateBalls() {
    const g = this.game;
    const cfg = SHIP.cannon;
    const keep = [];
    for (const b of this.balls) {
      b.vy += cfg.gravity * DT;
      b.x += b.vx * DT;
      b.y += b.vy * DT;
      b.time -= DT;
      // acerta quem estiver no caminho
      for (const p of g.players) {
        if (p.state !== 'alive' || p.invuln > 0 || p.admin || b.hitIds.includes(p.id)) continue;
        if (!circleRectOverlap(b.x, b.y, cfg.r, p)) continue;
        b.hitIds.push(p.id);
        this.knock(p, cfg.hit, Math.sign(b.vx) || 1);
      }
      // cai no navio do outro lado (descendo) e explode
      const landed = b.vy > 0 && this.solids().some((s) => b.x > s.x && b.x < s.x + s.w && b.y + cfg.r >= s.y && b.y < s.y + 40);
      if (landed || b.time <= 0) {
        this.explode(b);
        continue;
      }
      if (b.y < g.map.blast.bottom) keep.push(b);
    }
    this.balls = keep;
  }

  explode(b) {
    const g = this.game;
    const { boom } = SHIP.cannon;
    g.emit('cannonBoom', { x: b.x, y: b.y, radius: boom.radius });
    for (const p of g.players) {
      if (p.state !== 'alive' || p.invuln > 0 || p.admin || b.hitIds.includes(p.id)) continue;
      if (!circleRectOverlap(b.x, b.y, boom.radius, p)) continue;
      this.knock(p, boom, Math.sign(p.x + p.w / 2 - b.x) || Math.sign(b.vx) || 1);
    }
  }

  // empurrão do canhão (não é golpe de ninguém)
  knock(p, prof, dir) {
    const g = this.game;
    p.damage += prof.damage;
    p.stats.damageTaken += prof.damage;
    const weight = ELEMENTS[p.element].stats?.weight ?? 1;
    const kb = (prof.kbBase + p.damage * prof.kbScale) / weight;
    p.vx = dir * kb * Math.cos(prof.angle);
    p.vy = Math.min(-kb * Math.sin(prof.angle), -180);
    p.onGround = false;
    p.hitstun = 0.12 + kb * 0.00035;
    p.attack = null;
    p.dashTime = 0;
    p.lungeTime = 0;
    p.jumpsLeft = Math.max(p.jumpsLeft, 1);
    g.emit('hit', {
      attacker: null, target: p.id, damage: prof.damage, kb, element: p.element, weapon: 'canhao', cannon: true,
      x: p.x + p.w / 2, y: p.y + p.h * 0.4,
    });
  }

  // os bots fogem do lugar onde a bala vai cair (durante o pavio)
  danger() {
    const c = this.cannon;
    if (c.state !== 'pavio') return null;
    const t = this.cfg[c.ship].target;
    return { x: t.x, y: t.y, r: SHIP.cannon.boom.radius + 30 };
  }
}
