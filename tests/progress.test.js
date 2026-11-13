// Progresso guardado na conta (nível, conquistas, coleção): npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../server/db.js';
import { createApp } from '../server/index.js';
import { checkProgress } from '../server/progress.js';

const perfil = (xp, matches = 0) => ({ perfil: { xp, matches, recent: [] }, conquistas: { normal: {}, ouro: {}, counters: { normal: {}, ouro: {} } } });

test('progresso: barra o impossível', () => {
  assert.equal(checkProgress(perfil(500), null), null);
  assert.equal(checkProgress(perfil(10_000_000), null), 'XP impossível.');
  assert.equal(checkProgress({ dinheiro: {} }, null), 'Progresso inválido.');
  assert.equal(checkProgress({ perfil: { xp: -5 } }, null), 'Progresso inválido.');
  const old = { data: perfil(1000, 3), at: 1000 };
  assert.equal(checkProgress(perfil(1400, 4), old, 1060), null, 'uma partida normal passa');
  assert.equal(checkProgress(perfil(90_000, 4), old, 1060), 'XP impossível.');
  assert.equal(checkProgress(perfil(1400, 500), old, 1060), 'Partidas demais.');
  assert.equal(checkProgress(perfil(40_000, 4), old, 1000 + 3600), null, 'muito tempo jogando libera mais XP');
});

test('progresso: fica na conta, e mudança do servidor ganha', async () => {
  const app = createApp({ db: openDatabase(':memory:') });
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let cookie = '';
  const call = async (method, url, body) => {
    const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', cookie }, body: body && JSON.stringify(body) });
    cookie = res.headers.get('set-cookie')?.split(';')[0] ?? cookie;
    return { status: res.status, body: res.status === 204 ? null : await res.json() };
  };
  try {
    assert.equal((await call('GET', '/progress')).status, 401);
    await call('POST', '/auth/register', { username: 'ana', password: 'senha-boa-123' });
    assert.deepEqual((await call('GET', '/progress')).body, { data: null, rev: null });
    const a = await call('POST', '/progress', { data: perfil(300, 1), rev: null });
    assert.deepEqual(a.body, { rev: 1 });
    assert.equal((await call('POST', '/progress', { data: perfil(600, 2), rev: 1 })).body.rev, 2);
    // versão velha: o servidor devolve a dele
    const old = await call('POST', '/progress', { data: perfil(900, 3), rev: 1 });
    assert.equal(old.status, 409);
    assert.equal(old.body.data.perfil.xp, 600);
    const cheat = await call('POST', '/progress', { data: perfil(999_999, 3), rev: 2 });
    assert.equal(cheat.status, 422);
    assert.equal((await call('GET', '/progress')).body.data.perfil.xp, 600);
  } finally {
    server.close();
  }
});

test('admin: só enzoofoda entra; muda progresso, senha e apaga conta', async () => {
  const app = createApp({ db: openDatabase(':memory:') });
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const client = () => {
    let cookie = '';
    return async (method, url, body) => {
      const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', cookie }, body: body && JSON.stringify(body) });
      cookie = res.headers.get('set-cookie')?.split(';')[0] ?? cookie;
      return { status: res.status, body: res.status === 204 ? null : await res.json() };
    };
  };
  try {
    const bia = client();
    const adm = client();
    const bId = (await bia('POST', '/auth/register', { username: 'bia', password: 'senha-da-bia' })).body.user.id;
    await bia('POST', '/progress', { data: perfil(100, 1), rev: null });
    assert.equal((await bia('GET', '/admin/users')).status, 403, 'jogador comum não entra');
    await adm('POST', '/auth/register', { username: 'enzoofoda', password: 'senha-do-adm' });
    const list = (await adm('GET', '/admin/users?q=bi')).body;
    assert.deepEqual(list.users.map((u) => [u.username, u.xp]), [['bia', 100]]);
    assert.equal(list.total, 2);
    assert.ok(!JSON.stringify(list).includes('password'), 'senha nunca aparece');
    // muda o nível
    assert.equal((await adm('POST', `/admin/users/${bId}/progress`, { data: perfil(5000, 1) })).status, 200);
    const stale = await bia('POST', '/progress', { data: perfil(200, 2), rev: 1 });
    assert.equal(stale.status, 409, 'o jogo da bia pega a versão do admin');
    assert.equal(stale.body.data.perfil.xp, 5000);
    // senha nova: a sessão antiga cai e a senha nova funciona
    assert.equal((await adm('POST', `/admin/users/${bId}/password`, { password: 'nova-senha-1' })).status, 200);
    assert.equal((await bia('GET', '/progress')).status, 401);
    assert.equal((await bia('POST', '/auth/login', { username: 'bia', password: 'nova-senha-1' })).status, 200);
    // apaga
    assert.equal((await adm('POST', `/admin/users/${bId}/delete`, {})).status, 200);
    assert.equal((await adm('GET', `/admin/users/${bId}`)).status, 404);
    assert.equal((await bia('GET', '/progress')).status, 401);
  } finally {
    server.close();
  }
});
