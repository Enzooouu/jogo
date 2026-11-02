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
