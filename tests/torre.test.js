// Testes do modo Torre: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../shared/game.js';
import { BotController, DIFFICULTIES } from '../shared/ai.js';
import { botBrain, brainName, floorFoes, floorStep, carryAfterWin, towerXp, gravityFor, isGuardianFloor, guardianOf, TOWER } from '../shared/tower.js';
import { PHYS } from '../shared/constants.js';

test('torre: o bot fica mais esperto a cada andar até o gênio no 10', () => {
  const b0 = botBrain(0);
  const b5 = botBrain(5);
  const b10 = botBrain(10);
  assert.ok(b0.attackChance < DIFFICULTIES.facil.attackChance, 'andar 0 é mais burro que o Fácil');
  assert.ok(b0.thinkEvery > DIFFICULTIES.facil.thinkEvery);
  assert.ok(b5.attackChance > b0.attackChance && b10.attackChance > b5.attackChance);
  assert.ok(b10.thinkEvery < DIFFICULTIES.dificil.thinkEvery, 'gênio pensa mais rápido que o Difícil');
  assert.deepEqual(botBrain(40), b10);
  assert.equal(brainName(0), 'Muito burro');
  assert.equal(brainName(10), 'Gênio');
});

test('torre: depois do gênio volta a ser burro, com mais bots, e sobe de novo', () => {
  assert.deepEqual(floorFoes(0), { bots: 1, lives: 1, guardian: false });
  assert.deepEqual(floorFoes(9), { bots: 1, lives: 1, guardian: false });
  assert.deepEqual(floorFoes(11), { bots: 2, lives: 1, guardian: false });
  assert.deepEqual(floorFoes(19), { bots: 2, lives: 1, guardian: false });
  assert.deepEqual(floorFoes(21), { bots: 3, lives: 1, guardian: false });
  assert.deepEqual(floorFoes(31), { bots: 3, lives: 2, guardian: false });
  assert.deepEqual(floorFoes(41), { bots: 3, lives: 3, guardian: false });
  assert.deepEqual(floorFoes(99), { bots: 3, lives: 3, guardian: false });
  assert.deepEqual(floorStep(11), { cycle: 1, step: 1 });
  assert.deepEqual(floorStep(20), { cycle: 1, step: 10 });
  assert.equal(brainName(10), 'Gênio');
  assert.equal(brainName(11), 'Burro');
  assert.equal(brainName(20), 'Gênio');
  assert.equal(brainName(21), 'Burro');
  assert.deepEqual(botBrain(15), botBrain(5));
  assert.deepEqual(botBrain(30), botBrain(10));
});

test('torre: vidas e dano continuam, cura metade e ganha vida a cada 5', () => {
  assert.deepEqual(carryAfterWin(0, { lives: 2, damage: 80 }), { lives: 2, damage: 40, gotLife: false });
  assert.deepEqual(carryAfterWin(4, { lives: 2, damage: 10 }), { lives: 3, damage: 5, gotLife: true });
  assert.equal(carryAfterWin(9, { lives: 3, damage: 0 }).lives, TOWER.maxLives);
  assert.equal(towerXp(0, 0), 0);
  assert.equal(towerXp(2, 1), 30 + 35 + 15);
});

test('torre: o jogo começa com as vidas e o dano que vieram do andar anterior', () => {
  const g = new Game({
    mode: 'times', mapId: 'torre', towerFloor: 3, lives: 3,
    players: [
      { id: 1, element: 'fogo', team: 'A', lives: 2, damage: 45 },
      { id: 2, element: 'agua', team: 'B', isBot: true, lives: 1 },
    ],
  });
  assert.equal(g.playerById(1).lives, 2);
  assert.equal(g.playerById(1).damage, 45);
  assert.equal(g.playerById(2).lives, 1);
  assert.equal(g.map.towerFloor, 3);
  const bot = new BotController(2, { brain: botBrain(0) });
  assert.equal(bot.cfg.thinkEvery, botBrain(0).thinkEvery);
});

test('torre: no espaço (51+) a gravidade é mais leve e o pulo vai mais alto', () => {
  assert.equal(gravityFor(50), 1);
  assert.ok(gravityFor(51) < 1);
  const jumpTop = (gravityScale) => {
    const g = new Game({ mode: 'times', mapId: 'torre', towerFloor: 51, gravityScale, countdown: 0,
      players: [{ id: 1, element: 'fogo', team: 'A' }, { id: 2, element: 'agua', team: 'B', isBot: true }] });
    const me = g.playerById(1);
    for (let i = 0; i < 30; i++) g.step({});
    const y0 = me.y;
    me.vy = -PHYS.jumpSpeed;
    me.onGround = false;
    let top = y0;
    for (let i = 0; i < 90; i++) {
      g.step({});
      top = Math.min(top, me.y);
    }
    return y0 - top;
  };
  assert.ok(jumpTop(gravityFor(51)) > jumpTop(1) * 1.15);
});

test('torre: os andares 10, 20, 30… são de Guardião (1 chefe 1,3x maior)', () => {
  assert.equal(isGuardianFloor(0), false);
  assert.equal(isGuardianFloor(10), true);
  assert.equal(isGuardianFloor(15), false);
  assert.equal(isGuardianFloor(40), true);
  assert.deepEqual(floorFoes(10), { bots: 1, lives: 2, guardian: true });
  assert.deepEqual(floorFoes(20), { bots: 1, lives: 3, guardian: true });
  assert.equal(guardianOf(10).size, 1.3);
  assert.ok(guardianOf(30).power > guardianOf(10).power);
  assert.ok(guardianOf(200).power <= 1.5);
  const g = new Game({ mode: 'times', mapId: 'torre', towerFloor: 10,
    players: [{ id: 1, element: 'fogo', team: 'A' }, { id: 2, element: 'agua', team: 'B', isBot: true, size: 1.3, lives: 2 }] });
  const boss = g.playerById(2);
  const me = g.playerById(1);
  assert.ok(Math.abs(boss.h - me.h * 1.3) < 0.01, 'Guardião é 1,3x mais alto');
  assert.ok(Math.abs(boss.w - me.w * 1.3) < 0.01);
  assert.equal(boss.y + boss.h, me.y + me.h, 'os dois de pé no mesmo chão');
});

test('torre: andar comum termina rápido e sem comemoração; Guardião comemora', () => {
  const end = (celebrate, endDelay) => {
    const g = new Game({ mode: 'times', mapId: 'torre', countdown: 0, celebrate, endDelay,
      players: [{ id: 1, element: 'fogo', team: 'A' }, { id: 2, element: 'agua', team: 'B', isBot: true, lives: 1 }] });
    g.step({});
    g.knockOut(g.playerById(2), 'queda');
    let steps = 0;
    let ev = null;
    while (g.phase !== 'ended' && steps < 600) {
      g.step({});
      steps++;
      ev = ev ?? g.drainEvents().find((e) => e.type === 'matchEnd');
    }
    return { steps, ev };
  };
  const plain = end(false, 0.8);
  const boss = end(true, undefined);
  assert.equal(plain.ev.celebrate, false);
  assert.equal(boss.ev.celebrate, true);
  assert.ok(plain.steps < boss.steps / 3);
});

test('torre: a subida do elevador vem antes da contagem', () => {
  const g = new Game({ mode: 'times', mapId: 'torre', climb: 2.4,
    players: [{ id: 1, element: 'fogo', team: 'A' }, { id: 2, element: 'agua', team: 'B', isBot: true }] });
  assert.equal(g.climb, 2.4);
  assert.ok(Math.abs(g.phaseTimer - 5.4) < 1e-9);
});
