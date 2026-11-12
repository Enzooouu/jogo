// Testes do servidor online (salas com código, partida e amigos): npm test
// Sobe o servidor de verdade (banco em memória) e conecta "jogadores" pelo WebSocket.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { openDatabase } from '../server/db.js';
import { createApp } from '../server/index.js';
import { createStore } from '../server/store.js';
import { createOnline } from '../server/online.js';

let server;
let base;
let db;
let online;

before(async () => {
  db = openDatabase(':memory:');
  const store = createStore(db);
  // sala de espera curta nos testes
  online = createOnline(store, { lobbySeconds: 1.5, rematchSeconds: 1.5 });
  server = createApp({ db, store, online }).listen(0);
  online.attach(server);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `127.0.0.1:${server.address().port}`;
});

after(() => {
  online.close();
  server.close();
  db.close();
});

// Jogador de teste: guarda as mensagens e espera a que precisar
function player(cookie = '') {
  const ws = new WebSocket(`ws://${base}/ws`, { headers: cookie ? { Cookie: cookie } : {} });
  const inbox = [];
  const waiters = [];
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    inbox.push(msg);
    for (const w of [...waiters]) {
      if (w.match(msg)) {
        waiters.splice(waiters.indexOf(w), 1);
        w.resolve(msg);
      }
    }
  });
  const open = new Promise((resolve) => ws.once('open', resolve));
  return {
    ws,
    inbox,
    open,
    send: (msg) => ws.send(JSON.stringify(msg)),
    wait(match, ms = 5000) {
      const found = inbox.find(match);
      if (found) {
        inbox.splice(inbox.indexOf(found), 1);
        return Promise.resolve(found);
      }
      return new Promise((resolve, reject) => {
        const w = { match, resolve };
        waiters.push(w);
        setTimeout(() => reject(new Error('demorou demais esperando mensagem')), ms);
      });
    },
    close: () => ws.close(),
  };
}

async function account(name) {
  const res = await fetch(`http://${base}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: name, password: 'segredo123' }),
  });
  return res.headers.get('set-cookie').split(';')[0];
}

const api = (cookie) => async (method, url, body) => {
  const res = await fetch(`http://${base}${url}`, {
    method,
    headers: { Cookie: cookie, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
};

test('criar sala dá um código de 6 números e a outra pessoa entra com ele', async () => {
  const a = player();
  const b = player();
  await Promise.all([a.open, b.open]);
  await a.wait((m) => m.t === 'hello');
  a.send({ t: 'create' });
  const lobby = await a.wait((m) => m.t === 'lobby');
  assert.match(lobby.code, /^\d{6}$/);
  assert.equal(lobby.host, true);

  b.send({ t: 'join', code: '000000' });
  const err = await b.wait((m) => m.t === 'error');
  assert.match(err.error, /código/);

  b.send({ t: 'join', code: lobby.code });
  const lb = await b.wait((m) => m.t === 'lobby' && m.members.length === 2);
  assert.equal(lb.host, false);
  assert.ok(lb.secondsLeft > 0, 'começa a contagem da sala de espera');
  assert.equal(lb.phase, 'lobby');

  // só o dono escolhe o modo e o mapa
  b.send({ t: 'config', mode: 'ffa' });
  a.send({ t: 'config', mode: 'rei', mapId: 'castelo' });
  const cfg = await b.wait((m) => m.t === 'lobby' && m.mode === 'rei');
  assert.equal(cfg.mapId, 'castelo');

  // terceiro jogador não cabe
  const c = player();
  await c.open;
  c.send({ t: 'join', code: lobby.code });
  assert.match((await c.wait((m) => m.t === 'error')).error, /cheia/);
  a.close();
  b.close();
  c.close();
});

test('os dois prontos: a partida começa no servidor e o estado chega ~30x por segundo; comandos chegam no boneco', async () => {
  const a = player();
  const b = player();
  await Promise.all([a.open, b.open]);
  a.send({ t: 'create' });
  const { code } = await a.wait((m) => m.t === 'lobby');
  b.send({ t: 'join', code });
  await b.wait((m) => m.t === 'lobby' && m.members.length === 2);
  a.send({ t: 'config', mode: '2x2', mapId: 'campo' });
  a.send({ t: 'pick', element: 'terra', hat: 'coroa' });
  b.send({ t: 'pick', element: 'terra' });   // mesmo personagem pode
  a.send({ t: 'ready', ready: true });
  b.send({ t: 'ready', ready: true });
  const start = await a.wait((m) => m.t === 'start');
  assert.equal(start.you, 1);
  assert.equal(start.setup.mapId, 'campo');
  assert.equal(start.setup.players.length, 4);
  assert.equal(start.setup.players.find((p) => p.id === 1).hat, 'coroa');
  const startB = await b.wait((m) => m.t === 'start');
  assert.equal(startB.you, 2);

  // conta os estados que chegam em 1 segundo
  const before = Date.now();
  await new Promise((r) => setTimeout(r, 1000));
  const snaps = a.inbox.filter((m) => m.t === 's').length;
  assert.ok(snaps >= 20 && snaps <= 40, `chegaram ${snaps} estados em ${Date.now() - before} ms`);

  // depois da contagem: segura "direita" e o boneco anda
  await new Promise((r) => setTimeout(r, 2600));
  const xOf = (msg) => msg.s.players.find((p) => p.id === 1).x;
  const s1 = await a.wait((m) => m.t === 's' && m.s.phase === 'playing');
  b.send({ t: 'i', h: 0, p: 0 });
  a.send({ t: 'i', h: 2, p: 2 });   // bit 1 = direita
  await new Promise((r) => setTimeout(r, 500));
  a.inbox.length = 0;
  const s2 = await a.wait((m) => m.t === 's');
  assert.ok(xOf(s2) > xOf(s1) + 40, `andou de ${xOf(s1)} para ${xOf(s2)}`);

  // saiu no meio: o outro ganha
  b.close();
  const end = await a.wait((m) => m.t === 'end', 3000);
  assert.equal(end.leftBy, startB.setup.players.find((p) => p.id === 2).name);
  assert.equal(end.result.winnerTeam, 'A');
  a.close();
});

test('o tempo da sala de espera acaba e a partida começa sozinha (personagem aleatório)', async () => {
  const a = player();
  const b = player();
  await Promise.all([a.open, b.open]);
  a.send({ t: 'create' });
  const { code } = await a.wait((m) => m.t === 'lobby');
  b.send({ t: 'join', code });
  const start = await a.wait((m) => m.t === 'start', 4000);
  assert.ok(start.setup.players.every((p) => p.element), 'cada um ganhou um personagem');
  a.close();
  b.close();
});

test('amigos: pedido, aceitar, ver quem está online e convidar para a sala', async () => {
  const cookieA = await account('Lava');
  const cookieB = await account('Garoa');
  const A = api(cookieA);
  const B = api(cookieB);

  assert.equal((await A('POST', '/api/friends/add', { username: 'NinguemAqui' })).status, 404);
  assert.equal((await A('POST', '/api/friends/add', { username: 'Lava' })).status, 400);
  const add = await A('POST', '/api/friends/add', { username: 'garoa' });
  assert.equal(add.body.status, 'pedido');
  assert.deepEqual((await B('GET', '/api/friends')).body.incoming, ['Lava']);
  assert.deepEqual((await A('GET', '/api/friends')).body.outgoing, ['Garoa']);

  // convidar antes de serem amigos não vale
  const a = player(cookieA);
  await a.open;
  a.send({ t: 'create' });
  const { code } = await a.wait((m) => m.t === 'lobby');
  a.send({ t: 'invite', username: 'Garoa' });
  assert.match((await a.wait((m) => m.t === 'error')).error, /amigos/);

  await B('POST', '/api/friends/accept', { username: 'Lava' });
  let list = (await A('GET', '/api/friends')).body;
  assert.deepEqual(list.friends, [{ username: 'Garoa', online: false }]);

  // Garoa abre o jogo (conectado com a conta): aparece online e recebe o convite
  const b = player(cookieB);
  await b.open;
  await b.wait((m) => m.t === 'hello' && m.account && m.name === 'Garoa');
  list = (await A('GET', '/api/friends')).body;
  assert.equal(list.friends[0].online, true);
  a.send({ t: 'invite', username: 'Garoa' });
  const inv = await b.wait((m) => m.t === 'invited');
  assert.deepEqual([inv.from, inv.code], ['Lava', code]);

  // desfazer amizade
  await B('POST', '/api/friends/remove', { username: 'Lava' });
  assert.deepEqual((await A('GET', '/api/friends')).body.friends, []);
  a.close();
  b.close();
});

test('pedido cruzado vira amizade na hora; amigos exigem conta', async () => {
  const c1 = await account('Brisa');
  const c2 = await account('Rocha');
  await api(c1)('POST', '/api/friends/add', { username: 'Rocha' });
  const r = await api(c2)('POST', '/api/friends/add', { username: 'Brisa' });
  assert.equal(r.body.status, 'aceito');
  const res = await fetch(`http://${base}/api/friends`);
  assert.equal(res.status, 401);
});

test('Torre em dupla: venceu o andar, o servidor manda o próximo andar (com a subida)', async () => {
  const a = player();
  const b = player();
  await Promise.all([a.open, b.open]);
  a.send({ t: 'create' });
  const { code } = await a.wait((m) => m.t === 'lobby');
  b.send({ t: 'join', code });
  await b.wait((m) => m.t === 'lobby' && m.members.length === 2);
  a.send({ t: 'config', mode: 'torre' });
  a.send({ t: 'ready', ready: true });
  b.send({ t: 'ready', ready: true });
  const s0 = await a.wait((m) => m.t === 'start');
  assert.equal(s0.setup.tower.floor, 0);
  assert.deepEqual(s0.setup.players.filter((p) => !p.isBot).map((p) => p.team), ['A', 'A']);
  // derruba o bot do andar 0 direto no servidor
  const room = [...online._rooms().values()].find((r) => r.code === s0.code);
  const g = room.match.game;
  while (g.phase === 'countdown') await new Promise((r) => setTimeout(r, 50));
  const bot = g.players.find((p) => p.isBot);
  bot.lives = 1;
  g.knockOut(bot, 'queda');
  const s1 = await a.wait((m) => m.t === 'start' && m.setup.tower.floor === 1, 4000);
  assert.ok(s1.setup.tower.climb > 0, 'andar novo começa com a subida do elevador');
  a.close();
  b.close();
});
