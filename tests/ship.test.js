// Testes do Navio Voador (shared/ship.js): npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../shared/game.js';
import { BotController } from '../shared/ai.js';
import { SHIP } from '../shared/ship.js';

function newShip(elements = ['fogo', 'agua']) {
  const players = elements.map((element, i) => ({ id: i + 1, name: `P${i + 1}`, element, team: element }));
  const g = new Game({ players, seed: 5, mapId: 'navio', items: false });
  while (g.phase === 'countdown') g.step({});
  g.drainEvents();
  return g;
}

function run(g, ticks, inputs = {}) {
  for (let i = 0; i < ticks; i++) g.step(inputs);
}

function place(p, x, feetY) {
  p.x = x - p.w / 2;
  p.y = feetY - p.h;
  p.vx = 0;
  p.vy = 0;
}

const types = (events) => events.map((e) => e.type);

test('Navio: os navios sobem e descem e quem está em cima vai junto', () => {
  const g = newShip();
  const p = g.playerById(1);
  place(p, 400, 500);
  const ys = [];
  for (let i = 0; i < 6 * 60; i++) {
    g.step({});
    if (i > 30) ys.push(p.y + p.h - g.solidsNow().find((s) => s.ship === 0 && s.y > 480).y);
  }
  const deckYs = [];
  const g2 = newShip();
  for (let i = 0; i < 6 * 60; i++) {
    g2.step({});
    deckYs.push(g2.solidsNow()[1].y);
  }
  assert.ok(Math.max(...deckYs) - Math.min(...deckYs) > SHIP.bob, 'o convés sobe e desce');
  assert.ok(ys.every((d) => Math.abs(d) < 1.5), 'os pés ficam no convés');
});

test('Navio: canhão acende o pavio, atira em arco e a bala cai no tombadilho do outro navio', () => {
  const g = newShip();
  for (const p of g.players) { p.state = 'respawning'; p.respawnTimer = Infinity; }
  run(g, Math.ceil(SHIP.cannon.first * 60) + 2);
  assert.ok(types(g.drainEvents()).includes('cannonFuse'));
  run(g, Math.ceil(SHIP.cannon.fuse * 60) + 2);
  const fired = g.drainEvents();
  assert.ok(types(fired).includes('cannonFire'));
  run(g, Math.ceil((SHIP.cannon.flight + 0.3) * 60));
  const boom = g.drainEvents().find((e) => e.type === 'cannonBoom');
  assert.ok(boom, 'explodiu');
  assert.ok(Math.abs(boom.x - g.map.ships[0].target.x) < 40, `caiu em x ${Math.round(boom.x)}`);
});

test('Navio: quem está no tombadilho onde a bala cai é arremessado', () => {
  const g = newShip(['terra', 'agua']);
  const [terra, agua] = g.players;
  place(agua, 1150, 436);
  terra.state = 'respawning';
  terra.respawnTimer = Infinity;
  g.ships.cannon.time = 0.01;
  run(g, Math.ceil((SHIP.cannon.fuse + SHIP.cannon.flight + 0.4) * 60), {});
  assert.ok(agua.damage >= SHIP.cannon.boom.damage, `dano ${agua.damage}`);
});

test('Navio: bots jogam uma partida inteira sem travar', () => {
  const players = [{ id: 1, element: 'ar', team: 'A', isBot: true }, { id: 2, element: 'terra', team: 'B', isBot: true }];
  const g = new Game({ players, seed: 9, mapId: 'navio' });
  const bots = players.map((p) => new BotController(p.id, { difficulty: 'dificil', seed: p.id }));
  while (g.phase !== 'ended' && g.tick < 60 * 400) {
    const inp = {};
    for (const b of bots) inp[b.playerId] = b.getInput(g);
    g.step(inp);
  }
  assert.equal(g.phase, 'ended');
});
