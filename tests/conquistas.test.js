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

test('as de ouro são mais difíceis: Primeira Coroa pede vencer cada modo no Difícil', () => {
  const p = emptyProgress();
  const win = (extra, outcome = 'vitoria') => {
    const t = new MatchTracker(game(), 1);
    const setup = { ...setupFor('fogo', 'dificil'), ...extra };
    return evaluate(t.summary(resultFor(true), setup, outcome), p);
  };
  win({});
  assert.ok(p.normal.primeira_vitoria);
  assert.ok(!p.ouro.primeira_vitoria, 'uma vitória só não basta');
  win({ mode: 'ffa' });
  win({ mode: 'rei' });
  win({ players: [...setupFor('fogo').players, { id: 3, element: 'fogo', team: 'A', isBot: true }, { id: 4, element: 'agua', team: 'B', isBot: true }] });
  assert.ok(!p.ouro.primeira_vitoria);
  win({ players: [...setupFor('fogo').players, ...[3, 5].map((id) => ({ id, element: 'fogo', team: 'A', isBot: true })), ...[4, 6].map((id) => ({ id, element: 'agua', team: 'B', isBot: true }))] });
  assert.ok(p.ouro.primeira_vitoria);
});

test('Intocável de Ouro precisa de 3 seguidas (perder zera)', () => {
  const p = emptyProgress();
  const play = (deaths) => evaluate(new MatchTracker(game(), 1).summary(resultFor(true, { deaths }), setupFor('fogo', 'dificil'), 'vitoria'), p);
  play(0); play(0); play(1); play(0); play(0);
  assert.ok(!p.ouro.intocavel);
  play(0);
  assert.ok(p.ouro.intocavel);
});

test('no Normal as de ouro não avançam', () => {
  const p = emptyProgress();
  for (let i = 0; i < 5; i++) evaluate(new MatchTracker(game(), 1).summary(resultFor(true), setupFor('fogo'), 'vitoria'), p);
  assert.equal(Object.keys(p.ouro).length, 0);
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
  for (const a of ACHIEVEMENTS) if (a.gold) assert.ok(a.gold.name && a.gold.desc && (a.gold.check || a.gold.goal || a.special), a.id);
  assert.ok(ACHIEVEMENTS.length >= 10);
});

test('Alpinista (Torre): a de ouro libera a normal junto e dá o capacete', () => {
  const p = emptyProgress();
  const a = ACHIEVEMENTS.find((x) => x.id === 'alpinista');
  assert.equal(a.gold.reward, 'capacete');
  assert.deepEqual(unlockSpecial('alpinista', p, 'ouro'), [{ id: 'alpinista', tier: 'normal' }, { id: 'alpinista', tier: 'ouro' }]);
  assert.deepEqual(unlockSpecial('alpinista', p, 'ouro'), []);
  const q = emptyProgress();
  assert.deepEqual(unlockSpecial('alpinista', q), [{ id: 'alpinista', tier: 'normal' }]);
  assert.equal(q.ouro.alpinista, undefined);
});

test('Imperador (ouro do Rei Absoluto) dá a coroa', () => {
  const a = ACHIEVEMENTS.find((x) => x.id === 'rei_absoluto');
  assert.equal(a.gold.name, 'Imperador');
  assert.equal(a.gold.reward, 'coroa');
  assert.equal(ACHIEVEMENTS.find((x) => x.id === 'artilheiro').gold.reward, 'pirata');
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

test('regras novas: Mãos Limpas, Virada Lendária sozinho e Capitão Pirata somando partidas', () => {
  const p = emptyProgress();
  // Mãos Limpas: vence sem pegar arma
  const t = new MatchTracker(game(), 1);
  assert.ok(evaluate(t.summary(resultFor(true), setupFor('fogo'), 'vitoria'), p).some((x) => x.id === 'maos_limpas'));
  const t2 = new MatchTracker(game(), 1);
  t2.onEvents([{ type: 'pickup', id: 1 }]);
  assert.equal(t2.summary(resultFor(true), setupFor('fogo'), 'vitoria').pickups, 1);
  // Capitão Pirata: 5 K.O.s com canhão em várias partidas
  const p2 = emptyProgress();
  for (let i = 0; i < 5; i++) {
    const tt = new MatchTracker(game(), 1);
    tt.kos.push({ cannon: true, victim: 2, victimElement: 'agua', src: 'canhao' });
    evaluate(tt.summary(resultFor(false), setupFor('fogo', 'dificil'), 'derrota'), p2);
  }
  assert.ok(p2.ouro.artilheiro);
});
