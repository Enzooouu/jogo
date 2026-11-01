// Lago Congelado: o que acontece só neste mapa.
//   - gelo que racha: pancadas fortes racham um pedaço do lago; na 3ª ele
//     quebra e abre um buraco de água gelada que congela de novo depois
//   - plataformas de gelo que derretem com gente em cima (e voltam depois)
//   - nevasca na diagonal (de cima à esquerda para baixo à direita, ou o
//     contrário), com aviso antes
//   - pingentes que se soltam das plataformas e caem
//   - montinhos de neve: quem passa pega bolas de neve para arremessar
//
// Não desenha nada; o desenho fica em public/js/render/stage-gelo.js.

import { DT, PHYS } from './constants.js';
import { rectsOverlap, circleRectOverlap } from './geometry.js';
import { ELEMENTS } from './elements.js';

export const LAKE = {
  cells: 10,                // o gelo é dividido em 10 pedaços que podem quebrar
  crack: {
    launched: 550,          // quem foi arremessado (golpe nos últimos 2,5 s) e cai com essa velocidade racha
    fall: 900,              // qualquer queda forte racha (ex.: lá da plataforma do alto)
    hitKb: 650,             // golpe forte em quem está em pé no gelo também racha embaixo dele
    hits: 3,                // pancadas para quebrar
    open: 10,               // segundos com o buraco aberto
    heal: 20,               // segundos para uma rachadura sumir sozinha
    holeDepth: 32,          // fundo do buraco (água de 22 + um pouco)
  },
  melt: { time: 3.5, refreeze: 6, gone: 8, back: 0.6 },
  blizzard: { first: 22, every: [18, 26], warn: 2.2, active: 4.5, push: 170, down: 700 },
  icicle: { first: 7, every: [4, 7], shake: 0.9, damage: 5, gravity: 1900, r: 8 },
  snow: { first: 5, every: [7, 11], max: 2, per: 3, w: 30, h: 16 },
  snowball: { damage: 1, fireDamage: 3, speed: 780, lift: -190, gravity: 1250, r: 9, kb: 360, angle: 0.4 },
};

export class FrozenLake {
  constructor(game) {
    this.game = game;
    const map = game.map;
    this.ice = map.solids.find((s) => s.ice);
    const n = LAKE.cells;
    const w = this.ice.w / n;
    // cada pedaço do gelo: rachaduras, tempo do buraco aberto
    this.cells = Array.from({ length: n }, (_, i) => ({
      i, x: this.ice.x + i * w, w, cracks: 0, healIn: 0, open: 0,
    }));
    this.version = 0;            // muda quando um buraco abre ou fecha
    this.cache = null;
    this.blizzard = null;        // { state: 'aviso'|'ativo', dir, time }
    this.nextBlizzard = LAKE.blizzard.first;
    this.icicles = [];           // pingentes tremendo ou caindo
    this.nextIcicle = LAKE.icicle.first;
    this.piles = [];             // montinhos de neve no chão
    this.nextPile = LAKE.snow.first;
    for (const pl of game.platforms) {
      pl.melt = 0;
      pl.goneTime = 0;
      pl.backTime = 0;
    }
  }

  // ---------------------------------------------------------- consulta

  // Chão de agora: as margens, os pedaços de gelo inteiros (juntos) e o
  // fundo de cada buraco aberto
  solids() {
    if (this.cache?.version === this.version) return this.cache.solids;
    const out = this.game.map.solids.filter((s) => !s.ice);
    const { y, h } = this.ice;
    let run = null;
    for (const c of this.cells) {
      if (c.open > 0) {
        run = null;
        out.push({ x: c.x, y: y + LAKE.crack.holeDepth, w: c.w, h: h - LAKE.crack.holeDepth, hole: true });
        continue;
      }
      if (run) run.w += c.w;
      else {
        run = { ...this.ice, x: c.x, w: c.w };
        out.push(run);
      }
    }
    this.cache = { version: this.version, solids: out };
    return out;
  }

  // Água dos buracos abertos (mata como a água normal)
  hazards() {
    const out = [];
    for (const c of this.cells) {
      if (c.open > 0) out.push({ type: 'agua', x: c.x, y: this.ice.y + 10, w: c.w, h: 22, hole: true });
    }
    return out;
  }

  cellAt(x) {
    return this.cells.find((c) => x >= c.x && x < c.x + c.w) ?? null;
  }

  // ---------------------------------------------------------- passo

  update() {
    this.updateCells();
    this.updatePlatforms();
    this.updateBlizzard();
    this.updateIcicles();
    this.updatePiles();
  }

  // Alguém bateu no gelo com velocidade `vy` (chamado ao pousar no gelo)
  impact(p, vy) {
    const g = this.game;
    const launched = p.lastHitBy !== null && g.time - p.lastHitTime < 2.5 && vy >= LAKE.crack.launched;
    if (!launched && vy < LAKE.crack.fall) return;
    this.crackAt(p.x + p.w / 2);
  }

  // Golpe forte em quem está em pé no gelo: racha embaixo dele
  strongHit(p, kb) {
    if (kb >= LAKE.crack.hitKb && p.onGround && p.onIce && p.standingOn === 'solid') this.crackAt(p.x + p.w / 2);
  }

  crackAt(x) {
    const g = this.game;
    const cell = this.cellAt(x);
    if (!cell || cell.open > 0) return;
    cell.cracks++;
    cell.healIn = LAKE.crack.heal;
    if (cell.cracks >= LAKE.crack.hits) {
      cell.cracks = 0;
      cell.open = LAKE.crack.open;
      this.version++;
      g.emit('iceBreak', { cell: cell.i, x: cell.x, w: cell.w, y: this.ice.y });
    } else {
      g.emit('iceCrack', { cell: cell.i, level: cell.cracks, x, y: this.ice.y });
    }
  }

  updateCells() {
    const g = this.game;
    for (const c of this.cells) {
      if (c.open > 0) {
        c.open -= DT;
        if (c.open <= 0) {
          c.open = 0;
          this.version++;
          // congela de novo: quem estava nadando no buraco sobe para cima do gelo
          for (const p of g.players) {
            if (p.state !== 'alive') continue;
            const inside = p.x + p.w > c.x && p.x < c.x + c.w && p.y + p.h > this.ice.y;
            if (inside) {
              p.y = this.ice.y - p.h;
              p.vy = 0;
            }
          }
          g.emit('iceFreeze', { cell: c.i, x: c.x, w: c.w, y: this.ice.y });
        }
      } else if (c.cracks > 0) {
        c.healIn -= DT;
        if (c.healIn <= 0) {
          c.cracks--;
          c.healIn = LAKE.crack.heal;
        }
      }
    }
  }

  // Plataformas de gelo derretem com alguém em cima; caem e voltam depois
  updatePlatforms() {
    const g = this.game;
    const cfg = LAKE.melt;
    g.platforms.forEach((pl, i) => {
      if (!pl.ice) return;
      pl.backTime = Math.max(0, pl.backTime - DT);
      if (pl.goneTime > 0) {
        pl.goneTime -= DT;
        if (pl.goneTime <= 0) {
          pl.goneTime = 0;
          pl.melt = 0;
          pl.backTime = cfg.back;
          g.emit('platformBack', { index: i, x: pl.x, y: pl.y, w: pl.w });
        }
        return;
      }
      const standing = g.players.some((p) => p.state === 'alive' && p.onGround && p.standingOn === 'platform' && p.platform === i);
      if (standing) pl.melt += DT / cfg.time;
      else pl.melt = Math.max(0, pl.melt - DT / cfg.refreeze);
      if (pl.melt >= 1) {
        pl.melt = 1;
        pl.goneTime = cfg.gone;
        g.emit('platformMelt', { index: i, x: pl.x, y: pl.y, w: pl.w });
      }
    });
  }

  // Nevasca: aviso, depois sopra na diagonal para baixo (dir 1 = para a
  // direita, vindo de cima à esquerda; -1 = para a esquerda)
  updateBlizzard() {
    const g = this.game;
    const cfg = LAKE.blizzard;
    const bz = this.blizzard;
    if (bz) {
      bz.time -= DT;
      if (bz.time > 0) return;
      if (bz.state === 'aviso') {
        bz.state = 'ativo';
        bz.time = cfg.active;
        g.emit('blizzardStart', { dir: bz.dir });
      } else {
        this.blizzard = null;
        this.nextBlizzard = g.rng.range(cfg.every[0], cfg.every[1]);
        g.emit('blizzardEnd');
      }
      return;
    }
    this.nextBlizzard -= DT;
    if (this.nextBlizzard > 0) return;
    this.blizzard = { state: 'aviso', dir: g.rng.chance(0.5) ? 1 : -1, time: cfg.warn };
    g.emit('blizzardWarn', { dir: this.blizzard.dir });
  }

  // Empurrão da nevasca num jogador (`factor` = quanto o elemento sente o
  // vento). Devolve o empurrão de lado e já aplica o de cima para baixo.
  blizzardPush(p, factor) {
    const bz = this.blizzard;
    if (!bz || bz.state !== 'ativo' || factor <= 0) return 0;
    if (!p.onGround) p.vy = Math.min(p.vy + LAKE.blizzard.down * factor * DT, PHYS.fastFall);
    return bz.dir * LAKE.blizzard.push * factor;
  }

  // Pingentes: um treme embaixo de uma plataforma e depois cai
  updateIcicles() {
    const g = this.game;
    const cfg = LAKE.icicle;
    this.nextIcicle -= DT;
    if (this.nextIcicle <= 0) {
      this.nextIcicle = g.rng.range(cfg.every[0], cfg.every[1]);
      const options = g.platforms.filter((pl) => pl.ice && !g.platformGone(pl));
      if (options.length) {
        const pl = g.rng.pick(options);
        const x = Math.round(g.rng.range(pl.x + 22, pl.x + pl.w - 22));
        this.icicles.push({ id: g.nextEntityId++, plat: g.platforms.indexOf(pl), dx: x - pl.x, x, y: pl.y + 30, vy: 0, state: 'treme', time: cfg.shake });
        g.emit('icicleShake', { x, y: pl.y + 30 });
      }
    }
    const keep = [];
    for (const ic of this.icicles) {
      const pl = g.platforms[ic.plat];
      if (ic.state === 'treme') {
        // a plataforma derreteu antes: o pingente cai junto
        if (pl) {
          ic.x = pl.x + ic.dx;
          ic.y = pl.y + 30;
        }
        ic.time -= DT;
        if (ic.time <= 0 || (pl && g.platformGone(pl))) ic.state = 'cai';
        keep.push(ic);
        continue;
      }
      ic.vy += cfg.gravity * DT;
      ic.y += ic.vy * DT;
      let broke = false;
      for (const p of g.players) {
        if (p.state !== 'alive' || p.invuln > 0 || p.admin) continue;
        if (!circleRectOverlap(ic.x, ic.y, cfg.r, p)) continue;
        this.hitByIcicle(p, ic);
        broke = true;
        break;
      }
      if (!broke) {
        const surfaces = [...g.solidsNow(), ...g.platforms.filter((q) => q !== pl && !g.platformGone(q))];
        broke = surfaces.some((s) => ic.x > s.x && ic.x < s.x + s.w && ic.y >= s.y && ic.y - ic.vy * DT <= s.y + 2);
      }
      if (broke || ic.y > g.map.blast.bottom) g.emit('icicleBreak', { x: ic.x, y: ic.y });
      else keep.push(ic);
    }
    this.icicles = keep;
  }

  hitByIcicle(p, ic) {
    const g = this.game;
    const damage = LAKE.icicle.damage;
    p.damage += damage;
    p.stats.damageTaken += damage;
    const dir = Math.sign(p.x + p.w / 2 - ic.x) || 1;
    p.vx = dir * 140;
    p.vy = Math.max(p.vy, 120);
    p.hitstun = Math.max(p.hitstun, 0.2);
    p.attack = null;
    p.dashTime = 0;
    p.lungeTime = 0;
    g.emit('hit', {
      attacker: null, target: p.id, damage, kb: 160, element: p.element, weapon: 'pingente', icicle: true,
      x: p.x + p.w / 2, y: p.y + 8,
    });
  }

  // Montinhos de neve aparecem nas margens e no gelo; quem passa por cima
  // pega bolas de neve (não ocupa a mão: as armas continuam valendo)
  updatePiles() {
    const g = this.game;
    const cfg = LAKE.snow;
    this.nextPile -= DT;
    if (this.nextPile <= 0) {
      this.nextPile = g.rng.range(cfg.every[0], cfg.every[1]);
      if (this.piles.length < cfg.max) {
        const floors = this.game.map.solids.filter((s) => !s.ice);
        const s = g.rng.pick(floors);
        const x = Math.round(g.rng.range(s.x + 24, s.x + s.w - 24 - cfg.w));
        this.piles.push({ id: g.nextEntityId++, x, y: s.y - cfg.h, w: cfg.w, h: cfg.h });
        g.emit('snowPile', { x: x + cfg.w / 2, y: s.y });
      }
    }
    for (const p of g.players) {
      if (p.state !== 'alive' || p.snowballs >= cfg.per) continue;
      const i = this.piles.findIndex((pile) => rectsOverlap(p, pile));
      if (i < 0) continue;
      const pile = this.piles[i];
      this.piles.splice(i, 1);
      p.snowballs = cfg.per;
      g.emit('snowPickup', { id: p.id, x: pile.x + pile.w / 2, y: pile.y + pile.h });
    }
  }

  // Bola de neve acertou alguém: 1 de dano (3 no Fogo, que derrete com o
  // frio); em quem é de Água ela devolve 1 de vida
  snowHit(owner, t, dir) {
    const g = this.game;
    const cfg = LAKE.snowball;
    const heal = t.element === 'agua';
    const hurt = t.element === 'fogo' ? LAKE.snowball.fireDamage : LAKE.snowball.damage;
    const amount = heal ? -Math.min(1, t.damage) : hurt;
    t.damage += amount;
    if (!heal) {
      t.stats.damageTaken += hurt;
      owner.stats.damageDealt += hurt;
      owner.stats.hits++;
    }
    const kb = (cfg.kb + t.damage * 0.6) / (ELEMENTS[t.element].stats?.weight ?? 1);
    t.vx = dir * kb * Math.cos(cfg.angle);
    t.vy = Math.min(-kb * Math.sin(cfg.angle), -140);
    t.onGround = false;
    t.hitstun = 0.15;
    t.attack = null;
    t.dashTime = 0;
    t.lungeTime = 0;
    t.lastHitBy = owner.id;
    t.lastHitTime = g.time;
    g.emit('snowHit', { attacker: owner.id, target: t.id, heal, damage: amount, x: t.x + t.w / 2, y: t.y + t.h * 0.4 });
  }
}
