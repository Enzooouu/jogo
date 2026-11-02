// Testes do Marretão: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../shared/game.js';
import { WEAPONS, pickWeapon, weaponProfile } from '../shared/weapons.js';
import { createRng } from '../shared/rng.js';

function duel(a = 'mortal', b = 'agua') {
  const players = [{ id: 1, element: a, team: 'A' }, { id: 2, element: b, team: 'B' }];
  const g = new Game({ players, seed: 4, mapId: 'campo', items: false });
  while (g.phase === 'countdown') g.step({});
  return g;
}

function place(p, x, feetY) {
  p.x = x - p.w / 2;
  p.y = feetY - p.h;
  p.vx = 0;
  p.vy = 0;
}

test('Marretão: tem um uso só e some depois da pancada', () => {
  assert.equal(WEAPONS.marretao.uses, 1);
  const g = duel();
  const [me, other] = g.players;
  place(me, 300, 530);
  place(other, 360, 530);
  me.facing = 1;
  me.weapon = { id: 'marretao', uses: 1 };
  g.step({ 1: { attack: true } });
  for (let i = 0; i < 40; i++) g.step({});
  assert.equal(me.weapon, null);
  const ev = g.drainEvents().map((e) => e.type);
  assert.ok(ev.includes('hammerSlam'));
  assert.ok(ev.includes('weaponBreak'));
});

test('Marretão: dá bem mais dano que a espada', () => {
  const hit = (weapon) => {
    const g = duel('fogo', 'agua');
    const [me, other] = g.players;
    place(me, 300, 530);
    place(other, 360, 530);
    me.facing = 1;
    me.weapon = { id: weapon, uses: 5 };
    g.step({ 1: { attack: true } });
    for (let i = 0; i < 40; i++) g.step({});
    return other.damage;
  };
  const espada = hit('espada');
  const marretao = hit('marretao');
  assert.ok(marretao >= espada * 2, `marretão ${marretao} x espada ${espada}`);
  assert.ok(weaponProfile('marretao', 'terra').damage > weaponProfile('marretao', 'ar').damage);
});

test('Marretão: é raro (cai bem menos que as outras armas)', () => {
  const rng = createRng(11);
  const count = {};
  for (let i = 0; i < 20000; i++) {
    const id = pickWeapon(() => rng.next());
    count[id] = (count[id] ?? 0) + 1;
  }
  assert.ok(count.marretao > 500 && count.marretao < 2500, `marretão caiu ${count.marretao} vezes`);
  assert.ok(count.espada > count.marretao * 3);
});
