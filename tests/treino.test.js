import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../shared/game.js';
import { MAPS } from '../shared/maps.js';

// Treino livre: você contra um boneco Mortal parado
function trainingGame(element, mapId) {
  return new Game({
    players: [
      { id: 1, element, team: 'A', isBot: false },
      { id: 2, name: 'Boneco', element: 'mortal', skin: 'boneco', team: 'B', isBot: false, dummy: true },
    ],
    mode: 'times', seed: 7, mapId, practice: true, timeLimit: 0, countdown: 1,
  });
}

test('treino abre em todos os mapas com qualquer elemento (até o Mortal)', () => {
  for (const mapId of Object.keys(MAPS)) {
    for (const el of ['fogo', 'agua', 'terra', 'ar', 'mortal']) {
      const g = trainingGame(el, mapId);
      for (let i = 0; i < 300; i++) g.step({ 1: { attack: i % 30 < 2, right: i < 150, left: i >= 150 } });
      assert.notEqual(g.phase, 'ended', `${mapId}/${el}`);
    }
  }
});

test('o boneco de treino não pega armas', () => {
  const g = trainingGame('fogo', 'campo');
  while (g.phase === 'countdown') g.step({});
  const d = g.playerById(2);
  g.spawnWeaponAt('espada', d.x + d.w / 2, d.y + d.h - 20);
  for (let i = 0; i < 60; i++) g.step({});
  assert.equal(d.weapon, null);
  assert.equal(g.items.length, 1);
});

test('o espantalho fica preso no chão e só balança quando apanha', () => {
  const g = new Game({
    players: [
      { id: 1, element: 'fogo', team: 'A' },
      { id: 2, element: 'mortal', skin: 'espantalho', team: 'B', dummy: true, anchored: true },
    ],
    mode: 'times', seed: 3, mapId: 'treino-livre', practice: true, timeLimit: 0, countdown: 1, items: false,
  });
  while (g.phase === 'countdown') g.step({});
  const me = g.playerById(1);
  const d = g.playerById(2);
  d.checkpoint = { x: d.x + d.w / 2, y: d.y + d.h };
  const x0 = d.x;
  me.x = d.x - 50;
  me.facing = 1;
  me.weapon = { id: 'marretao', uses: 1 };
  let maxSway = 0;
  for (let i = 0; i < 90; i++) {
    g.step({ 1: { attack: i < 2 } });
    maxSway = Math.max(maxSway, Math.abs(d.sway));
  }
  assert.ok(d.damage >= 30, `dano ${d.damage}`);
  assert.equal(d.x, x0);
  assert.ok(maxSway > 0.1, `balanço ${maxSway}`);
});

test('no treino dá para trocar de elemento no meio da luta', () => {
  const g = trainingGame('fogo', 'treino-livre');
  while (g.phase === 'countdown') g.step({});
  const me = g.playerById(1);
  me.status.queimadura = { time: 2, dps: 4, source: 2 };
  assert.equal(g.setElement(1, 'ar'), true);
  assert.equal(me.element, 'ar');
  assert.equal(me.status.queimadura, null);
  assert.equal(g.setElement(1, 'ar'), false);
  assert.equal(g.setElement(1, 'nada'), false);
  for (let i = 0; i < 120; i++) g.step({ 1: { right: i < 60, up: i === 10 } });
  assert.equal(me.element, 'ar');
  assert.ok(g.drainEvents().length >= 0);
});
