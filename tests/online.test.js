// Testes do modo online (montar a partida e copiar o estado): npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../shared/game.js';
import { BotController } from '../shared/ai.js';
import { gameConfig, snapshotGame, applySnapshot, buildOnlineSetup, mapsFor, Predictor } from '../shared/net.js';
import { decodeInput } from '../shared/input.js';
import { HILL_MAPS } from '../shared/maps.js';

const humans = (a = 'fogo', b = 'agua') => [{ id: 1, name: 'Ana', element: a }, { id: 2, name: 'Beto', element: b }];

test('online: cada modo monta os times certos (bots completam)', () => {
  const s1 = buildOnlineSetup({ mode: '1x1', mapId: 'caldeira', humans: humans() });
  assert.deepEqual(s1.players.map((p) => [p.id, p.team, p.isBot]), [[1, 'A', false], [2, 'B', false]]);
  const s3 = buildOnlineSetup({ mode: '3x3', mapId: 'pico', humans: humans() });
  assert.equal(s3.players.filter((p) => p.team === 'A').length, 3);
  assert.equal(s3.players.filter((p) => p.team === 'B' && p.isBot).length, 2);
  assert.ok(s3.players.filter((p) => p.team === 'B').every((p) => p.element === 'agua'));
  const ffa = buildOnlineSetup({ mode: 'ffa', mapId: 'aleatorio', humans: humans() });
  assert.equal(ffa.mode, 'ffa');
  assert.equal(ffa.players.length, 5);
  const rei = buildOnlineSetup({ mode: 'rei', mapId: 'caldeira', humans: humans() });
  assert.equal(rei.mode, 'rei');
  assert.ok(Object.keys(HILL_MAPS).includes(rei.mapId), 'Rei da Ilha só usa os mapas dele');
  const torre = buildOnlineSetup({ mode: 'torre', humans: humans(), tower: { floor: 10 } });
  assert.equal(torre.mapId, 'torre');
  assert.deepEqual(torre.players.filter((p) => !p.isBot).map((p) => p.team), ['A', 'A'], 'Torre: os dois no mesmo time');
  assert.ok(torre.players.some((p) => p.guardian), 'andar 10 tem Guardião');
  assert.deepEqual(mapsFor('torre'), ['torre']);
});

test('online: os dois podem escolher o mesmo personagem (e a Torre em dupla mistura elementos)', () => {
  for (const mode of ['1x1', '2x2', 'rei', 'ffa', 'torre']) {
    const setup = buildOnlineSetup({ mode, mapId: 'aleatorio', humans: humans(mode === 'torre' ? 'fogo' : 'terra', 'terra') });
    assert.doesNotThrow(() => new Game(gameConfig(setup)), mode);
  }
});

test('online: o estado do servidor copiado na cópia espelho fica igual', () => {
  for (const mapId of ['caldeira', 'gelo', 'navio', 'coliseu']) {
    const setup = buildOnlineSetup({ mode: '2x2', mapId, humans: humans() });
    const server = new Game(gameConfig(setup));
    const mirror = new Game(gameConfig(setup));
    const bots = setup.players.map((p) => new BotController(p.id, { difficulty: 'dificil', seed: p.id }));
    for (let t = 0; t < 60 * 20; t++) {
      const inp = {};
      for (const b of bots) inp[b.playerId] = b.getInput(server);
      server.step(inp);
      server.drainEvents();
      if (t % 2 === 0) applySnapshot(mirror, JSON.parse(JSON.stringify(snapshotGame(server))));
    }
    applySnapshot(mirror, JSON.parse(JSON.stringify(snapshotGame(server))));
    for (const p of server.players) {
      const m = mirror.playerById(p.id);
      assert.equal(m.x, p.x, mapId);
      assert.equal(m.damage, p.damage);
      assert.equal(m.lives, p.lives);
    }
    assert.equal(mirror.items.length, server.items.length);
    assert.equal(mirror.time, server.time);
    if (server.lake) assert.equal(mirror.lake.holes?.length ?? 0, server.lake.holes?.length ?? 0);
  }
});

test('online: Rei da Ilha manda os pontos (Map) certinho', () => {
  const setup = buildOnlineSetup({ mode: 'rei', mapId: 'castelo', humans: humans() });
  const server = new Game(gameConfig(setup));
  const mirror = new Game(gameConfig(setup));
  for (let t = 0; t < 600; t++) server.step({});
  server.hill.scores.set('A', 12);
  applySnapshot(mirror, JSON.parse(JSON.stringify(snapshotGame(server))));
  assert.ok(mirror.hill.scores instanceof Map);
  assert.equal(mirror.hill.scores.get('A'), 12);
  assert.equal(typeof mirror.hill.update, 'function', 'continua sendo o objeto do Rei da Ilha');
});

test('online: previsão local mexe o boneco na hora e bate com o servidor', () => {
  const setup = buildOnlineSetup({ mode: '1x1', mapId: 'caldeira', humans: humans(), seed: 5 });
  const server = new Game(gameConfig(setup));
  const client = new Game(gameConfig(setup));
  const pred = new Predictor(client, 1);
  const LAG = 8;                 // ~130 ms de ida
  const toServer = [];           // [{ chega, q, input }]
  const toClient = [];           // [{ chega, s, a }]
  let ack = null;
  const right = decodeInput(2);  // bit 1 = direita
  assert.ok(right.right);
  let first = null;
  for (let t = 0; t < 600; t++) {
    const input = t > 300 ? right : decodeInput(t % 90 < 45 ? 2 : 1);
    const before = client.players[0].x;
    toServer.push({ chega: t + LAG, q: pred.step(input), input });
    client.drainEvents();
    if (first === null && server.phase === 'playing' && client.players[0].x !== before) first = t;
    const msg = toServer[0]?.chega <= t ? toServer.shift() : null;
    if (msg) ack = msg.q;
    server.step({ 1: msg?.input ?? server.players[0].prevInput, 2: {} });
    server.drainEvents();
    if (t % 2 === 0) toClient.push({ chega: t + LAG, s: snapshotGame(server), a: ack });
    while (toClient[0]?.chega <= t) {
      const m = toClient.shift();
      pred.reconcile(m.s, m.a);
    }
  }
  assert.ok(first !== null, 'o boneco se mexe sem esperar o servidor');
  // o servidor recebe o que faltava; com tudo confirmado a cópia fica igual
  let last = ack;
  for (const m of toServer) { server.step({ 1: m.input, 2: {} }); last = m.q; }
  pred.reconcile(snapshotGame(server), last);
  assert.equal(pred.history.length, 0);
  assert.equal(client.players[0].x, server.players[0].x);
  assert.equal(client.players[0].y, server.players[0].y);
});
