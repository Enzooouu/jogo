// Testes do modo Torre: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../shared/game.js';
import { BotController, DIFFICULTIES } from '../shared/ai.js';
import { botBrain, brainName, floorFoes, carryAfterWin, towerXp, TOWER } from '../shared/tower.js';

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
  assert.equal(brainName(99), 'Gênio');
});

test('torre: depois do gênio vêm mais bots e mais vidas', () => {
  assert.deepEqual(floorFoes(0), { bots: 1, lives: 1 });
  assert.deepEqual(floorFoes(10), { bots: 1, lives: 1 });
  assert.deepEqual(floorFoes(11), { bots: 2, lives: 1 });
  assert.deepEqual(floorFoes(21), { bots: 3, lives: 1 });
  assert.equal(floorFoes(26).lives, 2);
  assert.equal(floorFoes(60).lives, 3);
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
