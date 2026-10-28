// Testes da API de contas e estatísticas (banco em memória): npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../server/db.js';
import { createApp } from '../server/index.js';

let server;
let base;
let db;

before(async () => {
  db = openDatabase(':memory:');
  server = createApp({ db }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  db.close();
});

// Cliente simples que guarda o cookie de sessão, como o navegador faz.
function client() {
  let cookie = '';
  return async (method, url, body) => {
    const res = await fetch(base + url, {
      method,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null, setCookie: set };
  };
}

test('cadastro cria a conta, já entra e guarda a senha com bcrypt', async () => {
  const call = client();
  const res = await call('POST', '/api/auth/register', { username: 'Fagulha', password: 'segredo123' });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.username, 'Fagulha');
  assert.match(res.setCookie, /HttpOnly/i);
  assert.match(res.setCookie, /SameSite=Lax/i);

  const row = db.prepare('SELECT password_hash FROM users WHERE username = ?').get('Fagulha');
  assert.match(row.password_hash, /^\$2[aby]\$12\$/, 'hash bcrypt com custo 12');
  assert.ok(!row.password_hash.includes('segredo123'), 'senha nunca em texto puro');

  const me = await call('GET', '/api/auth/me');
  assert.equal(me.body.user.username, 'Fagulha');
});

test('cadastro recusa nome repetido (sem diferenciar maiúsculas) e dados inválidos', async () => {
  const call = client();
  await call('POST', '/api/auth/register', { username: 'Mare', password: 'abcdef' });
  assert.equal((await call('POST', '/api/auth/register', { username: 'mare', password: 'abcdef' })).status, 409);
  assert.equal((await call('POST', '/api/auth/register', { username: 'ab', password: 'abcdef' })).status, 400);
  assert.equal((await call('POST', '/api/auth/register', { username: 'nome com espaço', password: 'abcdef' })).status, 400);
  assert.equal((await call('POST', '/api/auth/register', { username: 'Valido', password: '123' })).status, 400);
  assert.equal((await call('POST', '/api/auth/register', { username: 'Valido', password: 'x'.repeat(73) })).status, 400);
});

test('login com senha certa entra, com senha errada não; logout sai', async () => {
  const signup = client();
  await signup('POST', '/api/auth/register', { username: 'Labareda', password: 'fogo1234' });

  const call = client();
  const wrong = await call('POST', '/api/auth/login', { username: 'Labareda', password: 'errada' });
  assert.equal(wrong.status, 401);
  const ghost = await call('POST', '/api/auth/login', { username: 'NaoExiste', password: 'qualquer' });
  assert.equal(ghost.status, 401);
  assert.equal(wrong.body.error, ghost.body.error, 'mesma mensagem: não revela se o usuário existe');

  const ok = await call('POST', '/api/auth/login', { username: 'labareda', password: 'fogo1234' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.user.username, 'Labareda');
  assert.equal((await call('GET', '/api/profile')).status, 200);

  assert.equal((await call('POST', '/api/auth/logout', {})).status, 204);
  assert.equal((await call('GET', '/api/profile')).status, 401);
  assert.equal((await call('GET', '/api/auth/me')).body.user, null);
});

test('rotas que mudam algo exigem JSON', async () => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'username=a&password=b',
  });
  assert.equal(res.status, 415);
});

test('estatísticas são atualizadas no fim de cada partida', async () => {
  const call = client();
  await call('POST', '/api/auth/register', { username: 'Correnteza', password: 'agua1234' });

  const empty = await call('GET', '/api/profile');
  assert.deepEqual(empty.body.stats, {
    matchesPlayed: 0, wins: 0, losses: 0, draws: 0, kills: 0, deaths: 0, favoriteElement: null,
  });

  const games = [
    { element: 'agua', result: 'vitoria', kills: 3, deaths: 1 },
    { element: 'agua', result: 'derrota', kills: 1, deaths: 3 },
    { element: 'fogo', result: 'vitoria', kills: 4, deaths: 0 },
    { element: 'agua', result: 'empate', kills: 0, deaths: 2 },
  ];
  let profile;
  for (const g of games) {
    const start = await call('POST', '/api/matches', { mode: 'times', element: g.element, teamSize: 2 });
    assert.equal(start.status, 201);
    const fin = await call('POST', `/api/matches/${start.body.matchId}/finish`, { result: g.result, kills: g.kills, deaths: g.deaths });
    assert.equal(fin.status, 200);
    profile = fin.body;
  }
  assert.deepEqual(profile.stats, {
    matchesPlayed: 4, wins: 2, losses: 1, draws: 1, kills: 8, deaths: 6, favoriteElement: 'agua',
  });
  assert.deepEqual(profile.elements, [{ element: 'agua', matches: 3 }, { element: 'fogo', matches: 1 }]);
  assert.equal(profile.recent.length, 4);
  assert.equal(profile.recent[0].result, 'empate', 'mais recente primeiro');
});

test('partida não pode ser registrada duas vezes nem com números impossíveis', async () => {
  const call = client();
  await call('POST', '/api/auth/register', { username: 'Pavio', password: 'fogo1234' });
  const { body } = await call('POST', '/api/matches', { mode: 'times', element: 'fogo', teamSize: 2 });
  const url = `/api/matches/${body.matchId}/finish`;

  assert.equal((await call('POST', url, { result: 'vitoria', kills: 7, deaths: 0 })).status, 400, '2 inimigos x 3 vidas = no máximo 6 kills');
  assert.equal((await call('POST', url, { result: 'vitoria', kills: 1, deaths: 4 })).status, 400, 'no máximo 3 mortes');
  assert.equal((await call('POST', url, { result: 'ganhei', kills: 1, deaths: 0 })).status, 400);
  assert.equal((await call('POST', url, { result: 'vitoria', kills: 1.5, deaths: 0 })).status, 400);
  assert.equal((await call('POST', url, { result: 'vitoria', kills: 6, deaths: 3 })).status, 200);
  assert.equal((await call('POST', url, { result: 'vitoria', kills: 6, deaths: 3 })).status, 409);

  const other = client();
  await other('POST', '/api/auth/register', { username: 'Intruso', password: 'abcdef1' });
  const start = await call('POST', '/api/matches', { mode: 'times', element: 'fogo', teamSize: 2 });
  const steal = await other('POST', `/api/matches/${start.body.matchId}/finish`, { result: 'vitoria', kills: 1, deaths: 0 });
  assert.equal(steal.status, 404, 'não dá para finalizar a partida de outra conta');

  assert.equal((await call('POST', '/api/matches', { mode: 'times', element: 'terra', teamSize: 2 })).status, 400, 'Terra ainda não liberado');
  const guest = client();
  assert.equal((await guest('POST', '/api/matches', { mode: 'times', element: 'fogo', teamSize: 2 })).status, 401);
});
