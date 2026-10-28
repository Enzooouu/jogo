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
    }

    this.thinkTimer--;
    if (this.thinkTimer <= 0) {
      this.think(game, me);
      this.thinkTimer = this.cfg.thinkEvery + this.rng.int(0, 4);
    }

    const out = { ...EMPTY_INPUT };
    let dir = 0;
    let jump = false;
    const cx = me.x + me.w / 2;
    const feet = me.y + me.h;
    const stage = this.stage;

    const offStage = cx < stage.left - 2 || cx > stage.right + 2;
    // Cabeça abaixo do chão do palco (e fora das piscinas) = embaixo da ilha.
    const underStage = !offStage && me.y > stage.top + 60;

    if (underStage) {
      // Preso embaixo do palco: sai pela borda mais próxima.
      dir = cx - stage.left < stage.right - cx ? -1 : 1;
    } else if (offStage) {
      // Recuperação: volta para o palco usando os pulos e a parede (segurar
      // na direção do palco já faz o bot se pendurar; pular dali sobe).
      dir = cx < stage.centerX ? 1 : -1;
      if (me.onWall && me.wallHang <= 0.2) jump = true;
      else if (me.vy > -60 && feet > stage.top - 90 && me.jumpsLeft > 0) jump = true;
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
      const reach = ranged ? 520 : profile.reach + me.w * 0.4;
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
        if (gap < -2 || gap > 46) continue;
        const goalInside = goal && goal.x + goal.w / 2 > h.x - 30 && goal.x + goal.w / 2 < h.x + h.w + 30;
        if (goalInside) dir = 0;
        else if (gap < 30) jump = true;
      }

      // Não anda para fora do palco nem cai de plataforma em cima de perigo.
      if (dir !== 0) {
        const probeX = cx + dir * (me.w / 2 + 14);
        if (!this.landingIsSafe(game, me, probeX)) dir = 0;
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
    for (const p of game.map.platforms) if (x >= p.x && x <= p.x + p.w) consider(p.y, 'platform');
    for (const h of game.map.hazards) if (x >= h.x && x <= h.x + h.w) consider(h.y, 'hazard', h.type);
    if (!best) {
      // Sem nada embaixo: só é seguro se ainda estou em cima do chão atual.
      return me.standingOn === 'solid' && game.map.solids.some((s) => x >= s.x && x <= s.x + s.w && Math.abs(s.y - feet) < 2);
    }
    if (best.kind === 'hazard') return hazardReaction(me.element, best.type) === 'imune';
    return true;
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
