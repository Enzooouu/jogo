// Bots simples. Cada bot olha o estado da partida e devolve um comando no
// mesmo formato do teclado (ver input.js), então para a simulação um bot e
// um humano são iguais.

import { hazardReaction } from './elements.js';
import { weaponProfile } from './weapons.js';
import { stageBounds } from './maps.js';
import { createRng } from './rng.js';
import { EMPTY_INPUT } from './input.js';
import { rectsOverlap } from './geometry.js';

export const DIFFICULTIES = {
  facil: { name: 'Fácil', thinkEvery: 16, attackChance: 0.3, reflex: 0.75, itemGreed: 0.4 },
  normal: { name: 'Normal', thinkEvery: 10, attackChance: 0.55, reflex: 0.93, itemGreed: 0.7 },
  dificil: { name: 'Difícil', thinkEvery: 5, attackChance: 0.85, reflex: 1, itemGreed: 0.9 },
};

export class BotController {
  constructor(playerId, { difficulty = 'normal', seed = 1 } = {}) {
    this.playerId = playerId;
    this.cfg = DIFFICULTIES[difficulty] ?? DIFFICULTIES.normal;
    this.rng = createRng(seed);
    this.thinkTimer = 0;
    this.goal = null;          // { type: 'enemy', id } | { type: 'item', id }
    this.lastOut = { ...EMPTY_INPUT };
    this.wantAttack = false;
    this.wantThrow = false;
    this.idleTimer = 0;
    this.stage = null;
  }

  getInput(game) {
    const me = game.playerById(this.playerId);
    if (!me || me.state !== 'alive' || game.phase !== 'playing') {
      this.lastOut = { ...EMPTY_INPUT };
      return this.lastOut;
    }
    if (!this.stage) {
      this.stage = stageBounds(game.map);
      this.islands = islandsOf(game.map);
    }

    this.thinkTimer--;
    if (this.thinkTimer <= 0) {
      this.think(game, me);
      this.thinkTimer = this.cfg.thinkEvery + this.rng.int(0, 4);
    }

    const out = { ...EMPTY_INPUT };
    let dir = 0;
    let jump = false;
    let dash = null;   // null ou { up: bool }
    const cx = me.x + me.w / 2;
    const feet = me.y + me.h;
    const stage = this.stage;

    // Mapas com várias ilhas: a ilha embaixo de mim, ou a mais perto para
    // onde voltar se eu estiver no ar fora de todas.
    const home = this.islands.find((i) => cx >= i.left - 2 && cx <= i.right + 2);
    // pulando um buraco de propósito (para pegar alguém do outro lado):
    // mira na ilha de lá, e não na mais perto
    if (home && me.onGround) this.crossing = null;
    const crossing = this.crossing && game.tick < this.crossing.until ? this.crossing : null;
    const crossIsland = crossing && this.islands.find((i) => crossing.x >= i.left && crossing.x <= i.right);
    const back = home ? null : crossIsland ? { island: crossIsland, x: crossing.x } : recoveryTarget(this.islands, game.map, me.element, cx);
    const island = home ?? back.island;
    const offStage = !home;
    // Cabeça abaixo do chão da ilha (e fora das piscinas) = embaixo dela.
    const underStage = !offStage && me.y > island.top + 60;

    if (underStage) {
      // Preso embaixo da ilha: sai pela borda mais próxima.
      dir = cx - island.left < island.right - cx ? -1 : 1;
    } else if (offStage) {
      // Recuperação: volta para a ilha usando os pulos e a parede (segurar
      // na direção dela já faz o bot se pendurar; pular dali sobe).
      // mira na parte segura da ilha (fora das piscinas mortais)
      dir = cx < back.x ? 1 : -1;
      if (me.onWall && me.wallHang <= 0.2) jump = true;
      else if (me.vy > -60 && feet > island.top - 90 && me.jumpsLeft > 0) jump = true;
      else if (me.jumpsLeft === 0 && me.airDashes > 0 && me.dashCooldown <= 0 && me.vy > 0 && feet > island.top - 30) {
        // Sem pulos: usa o dash para voltar. Perto da parede vai reto para
        // cima (na diagonal cairia direto nas piscinas da borda).
        const gap = cx < island.left ? island.left - cx : cx - island.right;
        dash = { up: true, straight: gap < 90 };
      }
    } else if (this.idleTimer > 0) {
      this.idleTimer--;
    } else {
      ({ dir, jump } = this.chase(game, me));
    }

    // Reflexos de sobrevivência (podem falhar um pouco nos bots mais fáceis).
    if (!offStage && !underStage && this.rng.chance(this.cfg.reflex)) {
      const safety = this.avoidDanger(game, me, dir);
      dir = safety.dir;
      jump = jump || safety.jump;
    }

    // Morte súbita (Coliseu): foge das paredes de espinhos
    if (!offStage && game.walls) {
      if (cx < game.walls.left + 90) dir = 1;
      else if (cx > game.walls.right - 90) dir = -1;
    }

    // Dentro de uma rajada de vento: anda contra ela para não ser jogado fora.
    if (!offStage && this.rng.chance(this.cfg.reflex)) {
      const gust = game.winds.find((w) => w.state === 'ativo' && rectsOverlap(me, w));
      if (gust && hazardReaction(me.element, 'vento') !== 'imune') dir = -gust.dir;
    }

    if (dir < 0) out.left = true;
    if (dir > 0) out.right = true;

    // Botões que precisam ser "apertados" (soltar e apertar de novo).
    out.up = jump && !this.lastOut.up;
    out.attack = this.wantAttack && !this.lastOut.attack;
    if (out.attack) this.wantAttack = false;
    out.throw = this.wantThrow && !this.lastOut.throw;
    if (out.throw) this.wantThrow = false;
    out.down = this.wantDown ?? false;
    this.wantDown = false;
    if (dash) {
      out.dash = !this.lastOut.dash;
      if (dash.up) out.up = true;
      if (dash.up && dash.straight) out.left = out.right = false;
    }

    this.lastOut = out;
    return out;
  }

  // Decide o objetivo de tempos em tempos (simula tempo de reação).
  think(game, me) {
    const enemies = game.players.filter((p) => p.state === 'alive' && p.team !== me.team);
    const nearestEnemy = minBy(enemies, (e) => dist(me, e));

    let goal = nearestEnemy ? { type: 'enemy', id: nearestEnemy.id } : null;

    if (!me.weapon && this.rng.chance(this.cfg.itemGreed)) {
      const items = game.items.filter((i) => !this.itemIsDeadly(game, me, i));
      const item = minBy(items, (i) => dist(me, i));
      if (item) {
        const dItem = dist(me, item);
        const dEnemy = nearestEnemy ? dist(me, nearestEnemy) : Infinity;
        if (dItem < 380 || dItem < dEnemy * 0.9) goal = { type: 'item', id: item.id };
      }
    }
    this.goal = goal;

    // Às vezes fica parado um instante (deixa o bot menos robótico).
    if (this.rng.chance(0.04)) this.idleTimer = this.rng.int(10, 30);
  }

  chase(game, me) {
    let dir = 0;
    let jump = false;
    const cx = me.x + me.w / 2;
    const goal = this.resolveGoal(game);
    if (!goal) return { dir, jump };

    const gx = goal.x + goal.w / 2;
    const dx = gx - cx;
    const dy = (goal.y + goal.h) - (me.y + me.h);   // diferença na altura dos pés

    if (this.goal.type === 'item') {
      if (Math.abs(dx) > 8) dir = Math.sign(dx);
    } else {
      const profile = weaponProfile(me.weapon?.id ?? null, me.element);
      const ranged = profile.kind === 'ranged';
      // a lança avança enquanto ataca: alcança mais longe (no chão)
      const lunge = profile.lunge && me.onGround ? profile.lunge.speed * profile.lunge.time * 0.8 : 0;
      const reach = ranged ? 520 : profile.reach + me.w * 0.4 + lunge;
      const minRange = ranged ? 160 : 0;
      const aligned = Math.abs(dy) < (ranged ? 36 : 50);
      const facingIt = Math.sign(dx) === me.facing || Math.abs(dx) < 4;

      if (Math.abs(dx) > reach * 0.85) dir = Math.sign(dx);
      else if (Math.abs(dx) < minRange) dir = -Math.sign(dx);

      if (Math.abs(dx) <= reach && aligned) {
        if (!facingIt) dir = Math.sign(dx);
        else if (me.cooldown <= 0 && !me.attack && this.rng.chance(this.cfg.attackChance * 0.25)) {
          this.wantAttack = true;
        }
      }

      if (me.weapon && me.weapon.uses <= 1 && Math.abs(dx) < 320 && aligned && facingIt && this.rng.chance(0.02)) {
        this.wantThrow = true;
      }
    }

    // Alvo mais alto: pula. Alvo mais baixo e eu numa plataforma: desce.
    if (dy < -60 && Math.abs(dx) < 280) {
      if (me.onGround) jump = true;
      else if (me.vy > 60 && me.jumpsLeft > 0 && (goal.y + goal.h) < me.y) jump = true;
    } else if (dy > 70 && me.onGround && me.standingOn === 'platform' && Math.abs(dx) < 140) {
      if (this.landingIsSafe(game, me, cx)) this.wantDown = true;
    }

    // Pulinho aleatório de vez em quando.
    if (me.onGround && this.rng.chance(0.004)) jump = true;
    return { dir, jump };
  }

  avoidDanger(game, me, dir) {
    let jump = false;
    const cx = me.x + me.w / 2;
    const feet = me.y + me.h;
    const deadly = game.map.hazards.filter((h) => hazardReaction(me.element, h.type) !== 'imune');

    // No ar, em cima de um perigo mortal: continua indo para a saída mais perto.
    for (const h of deadly) {
      const above = cx > h.x - 10 && cx < h.x + h.w + 10 && feet <= h.y + 4;
      if (above && !me.onGround) {
        const exitDir = cx - h.x < h.x + h.w - cx ? -1 : 1;
        dir = me.vx !== 0 && Math.abs(me.vx) > 120 ? Math.sign(me.vx) : exitDir;
        if (me.vy > 0 && feet > h.y - 70 && me.jumpsLeft > 0) jump = true;
        return { dir, jump };
      }
    }

    if (dir !== 0 && me.onGround) {
      // Perigo logo à frente na altura dos pés: pula por cima, a menos que o
      // objetivo esteja dentro dele (aí para na borda).
      const goal = this.resolveGoal(game);
      for (const h of deadly) {
        if (h.y > feet + 40 || h.y + h.h < feet - 40) continue;
        const gap = dir > 0 ? h.x - (me.x + me.w) : me.x - (h.x + h.w);
        // no gelo escorrega: precisa olhar mais longe
        const look = 46 + (me.onIce ? Math.abs(me.vx) * 0.35 : 0);
        if (gap < -2 || gap > look) continue;
        const goalInside = goal && goal.x + goal.w / 2 > h.x - 30 && goal.x + goal.w / 2 < h.x + h.w + 30;
        if (goalInside) dir = 0;
        else if (gap < 30) jump = true;
      }

      // Não anda para fora do palco nem cai de plataforma em cima de perigo.
      // Exceção: o objetivo está do outro lado de um buraco que dá para
      // pular; aí pula e atravessa.
      if (dir !== 0) {
        const probeX = cx + dir * (me.w / 2 + 14 + (me.onIce ? Math.abs(me.vx) * 0.3 : 0));
        if (!this.landingIsSafe(game, me, probeX)) {
          const goal = this.resolveGoal(game);
          const goalAhead = goal && Math.sign(goal.x + goal.w / 2 - cx) === dir && Math.abs(goal.x + goal.w / 2 - cx) > 60;
          const landing = goalAhead && me.standingOn === 'solid' ? this.landingAcross(game, me, probeX, dir) : null;
          if (landing !== null) {
            jump = true;
            this.crossing = { x: landing, until: game.tick + 110 };
          } else {
            dir = 0;
          }
        }
      }
    }
    return { dir, jump };
  }

  // Existe chão seguro embaixo desta coluna x (ignorando a plataforma atual)?
  landingIsSafe(game, me, x) {
    const feet = me.y + me.h;
    let best = null;
    const consider = (y, kind, type) => {
      if (y < feet + 2) return;
      if (!best || y < best.y) best = { y, kind, type };
    };
    for (const s of game.map.solids) if (x >= s.x && x <= s.x + s.w) consider(s.y, 'solid');
    for (const p of game.platforms) if (x >= p.x && x <= p.x + p.w) consider(p.y, 'platform');
    for (const h of game.map.hazards) if (x >= h.x && x <= h.x + h.w) consider(h.y, 'hazard', h.type);
    if (!best) {
      // Sem nada embaixo: só é seguro se ainda estou em cima do chão atual.
      return me.standingOn === 'solid' && game.map.solids.some((s) => x >= s.x && x <= s.x + s.w && Math.abs(s.y - feet) < 2);
    }
    if (best.kind === 'hazard') return hazardReaction(me.element, best.type) === 'imune';
    return true;
  }

  // Chão seguro do outro lado de um buraco, na mesma altura (até ~280px de
  // distância): devolve o x onde mirar, ou null se não dá para pular
  landingAcross(game, me, fromX, dir) {
    const feet = me.y + me.h;
    for (let d = 10; d <= 280; d += 10) {
      const x = fromX + dir * d;
      const solid = game.map.solids.find((s) => x >= s.x && x <= s.x + s.w && s.y > feet - 70 && s.y < feet + 50);
      if (!solid) continue;
      const target = x + dir * 40;
      const deadly = game.map.hazards.some((h) => target >= h.x - 20 && target <= h.x + h.w + 20 && hazardReaction(me.element, h.type) === 'morre');
      return deadly ? null : target;
    }
    return null;
  }

  itemIsDeadly(game, me, item) {
    return game.map.hazards.some((h) => rectsOverlap(item, h) && hazardReaction(me.element, h.type) !== 'imune');
  }

  resolveGoal(game) {
    if (!this.goal) return null;
    if (this.goal.type === 'enemy') {
      const e = game.playerById(this.goal.id);
      return e && e.state === 'alive' ? e : null;
    }
    const item = game.items.find((i) => i.id === this.goal.id);
    if (!item) {
      this.thinkTimer = 0;   // a arma sumiu: repensa no próximo passo
      return null;
    }
    return item;
  }
}

function dist(a, b) {
  const dx = a.x + a.w / 2 - (b.x + b.w / 2);
  const dy = a.y + a.h / 2 - (b.y + b.h / 2);
  return Math.hypot(dx, dy);
}

function minBy(list, fn) {
  let best = null;
  let bestValue = Infinity;
  for (const item of list) {
    const v = fn(item);
    if (v < bestValue) {
      bestValue = v;
      best = item;
    }
  }
  return best;
}

// Junta os blocos sólidos que se encostam em ilhas (left, right, top)
function islandsOf(map) {
  const sorted = [...map.solids].sort((a, b) => a.x - b.x);
  const out = [];
  for (const s of sorted) {
    const last = out[out.length - 1];
    if (last && s.x <= last.right + 1) {
      last.right = Math.max(last.right, s.x + s.w);
      last.top = Math.min(last.top, s.y);
    } else {
      out.push({ left: s.x, right: s.x + s.w, top: s.y });
    }
  }
  return out;
}

// Para onde voltar quando estou no ar fora de todas as ilhas: o pedaço de
// chão seguro (para o meu elemento) mais perto na horizontal. Empate: o maior.
function recoveryTarget(islands, map, element, x) {
  let best = null;
  for (const island of islands) {
    for (const [l, r] of safeSpans(island, map, element)) {
      // pedaço pequeno de chão é difícil de acertar: conta como mais longe
      const size = r - l;
      const gap = (x < l ? l - x : x > r ? x - r : 0) + (size < 100 ? 120 : 0);
      if (!best || gap < best.gap - 1 || (Math.abs(gap - best.gap) <= 1 && size > best.size)) {
        best = { island, gap, size, x: Math.max(l + 15, Math.min(r - 15, x)) };
      }
    }
  }
  return best;
}

// Trechos de chão de uma ilha fora dos perigos que matam este elemento
function safeSpans(island, map, element) {
  let spans = [[island.left, island.right]];
  for (const h of map.hazards) {
    if (hazardReaction(element, h.type) !== 'morre') continue;
    spans = spans.flatMap(([l, r]) => {
      if (h.x + h.w <= l || h.x >= r) return [[l, r]];
      return [[l, h.x], [h.x + h.w, r]].filter(([a, b]) => b - a > 24);
    });
  }
  return spans.length ? spans : [[island.left, island.right]];
}
