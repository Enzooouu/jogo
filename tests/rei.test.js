// Testes do Rei da Ilha: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../shared/game.js';
import { MAPS, HILL_MAPS } from '../shared/maps.js';
import { HILL } from '../shared/hill.js';
import { BotController } from '../shared/ai.js';

function hillGame(mapId = 'castelo', seed = 1) {
  return new Game({
    players: [
      { id: 1, element: 'fogo', team: 'A' }, { id: 2, element: 'fogo', team: 'A' },
      { id: 3, element: 'agua', team: 'B' }, { id: 4, element: 'agua', team: 'B' },
    ],
    mode: 'rei', mapId, seed, items: false,
  });
}

// coloca o jogador em pé dentro da área
function putInside(g, p) {
  const r = g.hill.rect();
  p.x = r.x + r.w / 2 - p.w / 2;
  p.y = r.y + r.h - p.h;
  p.vx = 0;
  p.vy = 0;
}

test('o Rei da Ilha tem mapas só dele (fora da lista dos outros modos)', () => {
  assert.ok(Object.keys(HILL_MAPS).length >= 2);
  for (const id of Object.keys(HILL_MAPS)) assert.equal(MAPS[id], undefined, id);
});

test('todo mapa do Rei da Ilha tem pelo menos 4 lugares para a área', () => {
  for (const id of Object.keys(HILL_MAPS)) {
    const g = hillGame(id);
    assert.ok(g.hill.spots.length >= 4, `${id}: ${g.hill.spots.length}`);
  }
});

test('todo mapa tem pelo menos 2 lugares para a ilha', () => {
  for (const id of Object.keys(MAPS)) {
    const g = hillGame(id);
    assert.ok(g.hill.spots.length >= 2, `${id}: ${g.hill.spots.length}`);
  }
});

test('time sozinho na área ganha 1 ponto por segundo; os dois juntos, ninguém', () => {
  const g = hillGame();
  while (g.phase === 'countdown') g.step({});
  for (const p of g.players) { p.state = 'respawning'; p.respawnTimer = 999; }   // tira todo mundo do mapa
  const a = g.playerById(1);
  const b = g.playerById(3);
  a.state = 'alive';
  for (let i = 0; i < 125; i++) { putInside(g, a); g.step({}); }
  assert.equal(g.hill.points('A'), 2);
  assert.equal(g.hill.owner, 'A');
  b.state = 'alive';
  for (let i = 0; i < 120; i++) { putInside(g, a); putInside(g, b); g.step({}); }
  assert.equal(g.hill.points('A'), 2);
  assert.equal(g.hill.points('B'), 0);
  assert.equal(g.hill.contested, true);
});

test('ninguém perde vida e quem chega no alvo vence', () => {
  const g = hillGame();
  while (g.phase === 'countdown') g.step({});
  const a = g.playerById(1);
  g.knockOut(g.playerById(3), 'queda');
  assert.equal(g.playerById(3).lives, 1);
  assert.equal(g.playerById(3).state, 'respawning');
  for (const p of g.players) if (p !== a) { p.state = 'respawning'; p.respawnTimer = 999; }
  g.hill.scores.set('A', HILL.target - 0.5);
  for (let i = 0; i < 60 && g.phase === 'playing'; i++) { putInside(g, a); g.step({}); }
  assert.notEqual(g.phase, 'playing');
  assert.equal(g.result.winnerTeam, 'A');
  assert.equal(g.result.reason, 'pontos');
});

test('a ilha muda de lugar a cada 25 s', () => {
  const g = hillGame('gelo');
  while (g.phase === 'countdown') g.step({});
  const first = g.hill.index;
  for (let i = 0; i < Math.ceil(HILL.move * 60) + 2; i++) g.step({});
  assert.notEqual(g.hill.index, first);
});

test('bots disputam a ilha e a partida termina', () => {
  const g = hillGame('piramide', 3);
  const bots = g.players.map((p) => new BotController(p.id, { seed: p.id }));
  for (let n = 0; g.phase !== 'ended' && n < 60 * 200; n++) {
    const inputs = {};
    for (const b of bots) inputs[b.playerId] = b.getInput(g);
    g.step(inputs);
  }
  assert.equal(g.phase, 'ended');
  const total = Object.values(g.result.hillScores).reduce((a, b) => a + b, 0);
  assert.ok(total > 40, `pontos ${total}`);
});

test('Pirâmide do Sol: dá para subir e descer a rampa andando, sem sair do chão', () => {
  const g = new Game({ players: [{ id: 1, element: 'fogo', team: 'A' }, { id: 2, element: 'agua', team: 'B' }], mode: 'rei', mapId: 'piramide', items: false });
  while (g.phase === 'countdown') g.step({});
  const o = g.playerById(2);
  o.state = 'respawning';
  o.respawnTimer = 999;
  const p = g.playerById(1);
  p.x = 220;
  p.y = 600 - p.h;
  for (let i = 0; i < 5; i++) g.step({});
  let air = 0;
  for (let i = 0; i < 70; i++) { g.step({ 1: { right: true } }); if (!p.onGround) air++; }
  assert.equal(Math.round(p.y + p.h), 410, 'chegou no topo');
  for (let i = 0; i < 80; i++) { g.step({ 1: { right: true } }); if (!p.onGround) air++; }
  assert.equal(Math.round(p.y + p.h), 600, 'desceu do outro lado');
  assert.ok(air <= 3, `ficou ${air} quadros no ar`);
});
