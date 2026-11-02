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

test('Navio: quem fica com o pé dentro da ponta do convés não é jogado para trás do navio', () => {
  for (const [x, key] of [[555, 'right'], [205, 'left'], [735, 'left'], [1075, 'right']]) {
    const g = newShip();
    g.playerById(2).state = 'respawning';
    g.playerById(2).respawnTimer = Infinity;
    const p = g.playerById(1);
    const deck = g.solidsNow().find((s) => s.y > 480 && x > s.x && x < s.x + s.w);
    // no ar, com o pé 14 px dentro da ponta do convés, dando dash
    place(p, x, deck.y + 14);
    p.onGround = false;
    run(g, 1, { 1: { dash: true, [key]: true } });
    const cx = p.x + p.w / 2;
    assert.ok(Math.abs(cx - x) < 60, `de ${x} foi parar em ${Math.round(cx)}`);
  }
});

test('Navio: dash rente ao convés com o navio subindo não joga o jogador para a ponta', () => {
  for (const start of [0, 0.7, 1.5, 2.2, 3.1, 4.4]) {
    const g = newShip();
    g.playerById(2).state = 'respawning';
    g.playerById(2).respawnTimer = Infinity;
    run(g, Math.round(start * 60));
    const p = g.playerById(1);
    const deck = g.solidsNow().find((s) => s.ship === 0 && s.y > 480);
    // no ar, com o pé 2 px acima do convés, dando dash para a direita
    place(p, 400, deck.y - 2);
    p.onGround = false;
    run(g, 1, { 1: { dash: true, right: true } });
    run(g, 12, { 1: { right: true } });
    assert.ok(p.x > 380 && p.x < 620, `foi parar em x ${Math.round(p.x)} (começo ${start}s)`);
  }
});
