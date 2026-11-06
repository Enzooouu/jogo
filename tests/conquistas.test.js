// Testes das conquistas: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../shared/game.js';
import { MatchTracker, evaluate, emptyProgress, ACHIEVEMENTS, unlockSpecial } from '../shared/achievements.js';

function setupFor(element, difficulty = 'normal', extra = {}) {
  return {
    mode: 'times', difficulty, localPlayerId: 1,
    players: [{ id: 1, element, team: 'A', isBot: false }, { id: 2, element: element === 'fogo' ? 'agua' : 'fogo', team: 'B', isBot: true }],
    ...extra,
  };
}

function resultFor(won, me = {}) {
  return {
    winnerTeam: won ? 'A' : 'B',
    players: [{ id: 1, team: 'A', deaths: 0, livesLeft: 3, ...me }, { id: 2, team: 'B', deaths: 3, livesLeft: 0 }],
  };
}

function game(element = 'fogo') {
  const g = new Game({ players: setupFor(element).players, mapId: 'campo', items: false });
  while (g.phase === 'countdown') g.step({});
  return g;
}

test('vitória sem perder vida dá Primeira Vitória e Intocável (normais)', () => {
  const g = game();
  const t = new MatchTracker(g, 1);
  const p = emptyProgress();
  const got = evaluate(t.summary(resultFor(true), setupFor('fogo'), 'vitoria'), p);
  const ids = got.map((x) => x.id);
  assert.ok(ids.includes('primeira_vitoria'));
  assert.ok(ids.includes('intocavel'));
  assert.ok(got.every((x) => x.tier === 'normal'));
  // de novo: não repete
  assert.equal(evaluate(t.summary(resultFor(true), setupFor('fogo'), 'vitoria'), p).length, 0);
});

test('no Difícil a mesma vitória também dá as de ouro', () => {
  const g = game();
  const t = new MatchTracker(g, 1);
  const p = emptyProgress();
  const got = evaluate(t.summary(resultFor(true), setupFor('fogo', 'dificil'), 'vitoria'), p);
  assert.ok(got.some((x) => x.id === 'primeira_vitoria' && x.tier === 'ouro'));
  assert.ok(p.normal.primeira_vitoria && p.ouro.primeira_vitoria);
});

test('modo ADM e treino não contam', () => {
  const g = game();
  const t = new MatchTracker(g, 1);
  const adm = setupFor('fogo');
  adm.players[0].admin = true;
  assert.equal(evaluate(t.summary(resultFor(true), adm, 'vitoria'), emptyProgress()).length, 0);
  assert.equal(evaluate(t.summary(resultFor(true), setupFor('fogo', 'normal', { practice: true }), 'vitoria'), emptyProgress()).length, 0);
});

test('K.O. com marretão dá Martelada; lançada dá Arremesso Certeiro', () => {
  const g = game();
  const t = new MatchTracker(g, 1);
  t.onEvents([{ type: 'hit', attacker: 1, target: 2, weapon: 'marretao', src: 'golpe' }, { type: 'ko', id: 2, killer: 1 }]);
  t.onEvents([{ type: 'hit', attacker: 1, target: 2, weapon: 'espada', src: 'arremesso' }, { type: 'ko', id: 2, killer: 1 }]);
  const ids = evaluate(t.summary(resultFor(false), setupFor('fogo'), 'derrota'), emptyProgress()).map((x) => x.id);
  assert.ok(ids.includes('martelada'));
  assert.ok(ids.includes('arremesso'));
});

test('Mestre dos Elementos precisa vencer com os 5', () => {
  const p = emptyProgress();
  for (const el of ['fogo', 'agua', 'terra', 'ar']) {
    const t = new MatchTracker(game(el), 1);
    evaluate(t.summary(resultFor(true), setupFor(el), 'vitoria'), p);
  }
  assert.ok(!p.normal.mestre);
  const t = new MatchTracker(game('mortal'), 1);
  evaluate(t.summary(resultFor(true), setupFor('mortal'), 'vitoria'), p);
  assert.ok(p.normal.mestre);
});

test('Aprendiz vem do tutorial e não tem versão de ouro', () => {
  const p = emptyProgress();
  assert.equal(unlockSpecial('aprendiz', p).length, 1);
  assert.equal(ACHIEVEMENTS.find((a) => a.id === 'aprendiz').gold, null);
  assert.ok(ACHIEVEMENTS.length >= 10);
});

test('o jogo marca de onde veio o golpe (golpe, magia, arremesso)', () => {
  const g = game('agua');
  const me = g.playerById(1);
  const foe = g.playerById(2);
  me.x = 300; foe.x = 340; foe.y = me.y; me.facing = 1;
  const seen = [];
  for (let i = 0; i < 40; i++) {
    g.step({ 1: { attack: i === 0 } });
    for (const e of g.drainEvents()) if (e.type === 'hit') seen.push(e.src);
  }
  assert.ok(seen.includes('golpe'));
});
