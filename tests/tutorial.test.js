// Testes do tutorial: cada etapa dá para completar com comandos simples
// (como se fosse alguém jogando). npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STEPS, createStep, hazardText } from '../shared/tutorial.js';
import { getMap, MAPS } from '../shared/maps.js';
import { makeInput } from '../shared/input.js';

const pulse = (i, every) => i % every < 2;
const goTo = (me, x) => ({ right: me.x + me.w / 2 < x - 10, left: me.x + me.w / 2 > x + 10 });

// Joga a etapa com uma "mão" que decide os comandos; devolve se terminou
function play(index, hand, { element = null, seconds = 30 } = {}) {
  const t = createStep(index, { element });
  for (let i = 0; i < seconds * 60; i++) {
    const me = t.game.playerById(1);
    t.game.step({ 1: makeInput(hand(me, t.game, t.state, i)) });
    if (t.update(t.game.drainEvents())) return true;
  }
  return false;
}

test('11 etapas e as arenas existem (mas não aparecem na escolha de mapa)', () => {
  assert.equal(STEPS.length, 11);
  for (const s of STEPS) {
    assert.ok(getMap(s.map), s.map);
    assert.equal(MAPS[s.map], undefined);
  }
});

test('etapas 1 a 5 com o manequim: andar, pular, descer, dash e parede', () => {
  const t = createStep(0);
  assert.equal(t.game.playerById(1).skin, 'manequim');
  assert.equal(t.game.playerById(2).state, 'out', 'sem boneco de treino nessas etapas');

  assert.ok(play(0, () => ({ right: true })), 'andar');
  assert.ok(play(1, (me, g, s, i) => ({ right: me.x + 15 < 1050, up: me.x + 15 < 900 && pulse(i, 18) })), 'pular');
  assert.ok(play(2, (me, g, s, i) => ({ down: pulse(i, 30) })), 'descer');
  assert.ok(play(3, (me, g, s, i) => {
    const cx = me.x + me.w / 2;
    if (cx < 470) return { right: true };
    if (me.onGround && cx > 900) return goTo(me, 1100);
    if (me.onGround && cx < 600) return { right: true, up: true };
    return { right: cx < 1090, up: me.jumpsLeft > 0 && me.vy > -100 && pulse(i, 4), dash: me.jumpsLeft === 0 && me.vy > 0 };
  }), 'dash');
  assert.ok(play(4, (me, g, s, i) => {
    if (me.y + me.h <= 230) return { right: me.x + 15 < 1050 };
    if (me.onWall) {
      s.dir = -me.onWall;
      return { up: pulse(i, 6), [me.onWall > 0 ? 'right' : 'left']: true };
    }
    return { [(s.dir ?? 1) > 0 ? 'right' : 'left']: true, up: me.onGround ? pulse(i, 10) : me.vy > 0 && pulse(i, 6) };
  }), 'parede');
});

test('pular sem pulo duplo não chega no bloco alto', () => {
  assert.equal(play(1, (me, g, s, i) => ({ right: me.x + 15 < 1050, up: me.onGround && me.x + 15 < 900 && pulse(i, 18) }), { seconds: 8 }), false);
});

test('etapas 6 a 10 com cada elemento: arma, ataque, lançar, perigos e voltar', () => {
  for (const element of ['fogo', 'agua', 'terra', 'ar']) {
    const t = createStep(5, { element });
    assert.equal(t.game.playerById(1).skin, null, 'depois de escolher, é o lutador do elemento');
    assert.ok(play(5, (me, g) => (g.items[0]?.landed ? goTo(me, g.items[0].x + 17) : {}), { element }), `arma ${element}`);
    assert.ok(play(6, (me, g, s, i) => {
      const dx = g.playerById(2).x - me.x;
      const near = Math.abs(dx) < (s.phase === 'espada' ? 50 : 180);
      return { right: !near && dx > 0, left: !near && dx < 0, attack: near && pulse(i, 25) };
    }, { element }), `atacar ${element}`);
    assert.ok(play(7, (me, g, s, i) => (s.phase === 'lancar' ? { throw: pulse(i, 30) } : g.items[0]?.landed ? goTo(me, g.items[0].x + 17) : {}), { element }), `lançar ${element}`);
    assert.ok(play(8, (me) => {
      const cx = me.x + me.w / 2;
      const nearPit = (cx > 270 && cx < 330) || (cx > 650 && cx < 710) || (cx > 880 && cx < 920);
      return { right: cx < 1120, up: me.onGround && nearPit };
    }, { element }), `perigos ${element}`);
    assert.ok(play(9, (me, g, s, i) => {
      if (s.phase !== 'voando' || me.hitstun > 0) return {};
      const out = { [me.x + me.w / 2 < 640 ? 'right' : 'left']: true };
      if (me.vy > 50 && me.jumpsLeft > 0 && pulse(i, 4)) out.up = true;
      else if (me.vy > 100 && me.jumpsLeft === 0 && me.airDashes > 0) Object.assign(out, { up: true, dash: true });
      return out;
    }, { element }), `voltar ${element}`);
  }
});

test('no treino ninguém perde vida: quem cai volta no começo da etapa', () => {
  const t = createStep(9, { element: 'fogo' });
  const me = t.game.playerById(1);
  const lives = me.lives;
  for (let i = 0; i < 60 * 6; i++) {
    t.game.step({ 1: makeInput({}) });
    t.update(t.game.drainEvents());
  }
  assert.equal(me.lives, lives);
  assert.equal(t.state.back, 0, 'parado não conta como volta');
});

test('desafio final é uma partida de verdade contra bot, 2 vidas', () => {
  const t = createStep(10, { element: 'ar' });
  assert.equal(t.game.practice, false);
  assert.equal(t.game.playerById(2).isBot, true);
  assert.equal(t.game.playerById(1).lives, 2);
});

test('texto dos perigos fala de cada um para o elemento', () => {
  assert.match(hazardText('fogo'), /Lava: não te machuca/);
  assert.match(hazardText('terra'), /Espinhos: não te machuca/);
  assert.match(hazardText('ar'), /Vento: não te machuca/);
});
