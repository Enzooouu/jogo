// Testes da troca de teclas (tela de controles): npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_BINDINGS, ACTIONS, assignKey, clearExtra, keymapFrom, keyLabel, cloneBindings, actionOf, loadBindings } from '../public/js/input/bindings.js';

const every = (b) => ACTIONS.every(({ id }) => Boolean(b[id][0]));

test('colocar uma tecla livre na extra', () => {
  const r = assignKey(DEFAULT_BINDINGS, 'up', 1, 'ArrowUp');
  assert.ok(r.ok);
  assert.deepEqual(r.bindings.up, ['KeyW', 'ArrowUp']);
  assert.deepEqual(DEFAULT_BINDINGS.up, ['KeyW', 'Space'], 'o padrão não muda');
});

test('tecla que já é de outro movimento: os dois trocam', () => {
  const r = assignKey(DEFAULT_BINDINGS, 'attack', 0, 'KeyK');
  assert.ok(r.ok);
  assert.equal(r.bindings.attack[0], 'KeyK');
  assert.equal(r.bindings.throw[1], 'Mouse0', 'lançar ficou com a tecla antiga do atacar');
  assert.ok(every(r.bindings));
});

test('nunca deixa um movimento sem tecla', () => {
  // dash só com uma tecla
  let b = clearExtra(DEFAULT_BINDINGS, 'dash');
  b = clearExtra(b, 'left');
  // tentar pôr a única tecla do dash na extra (vazia) da esquerda
  const r = assignKey(b, 'left', 1, 'ShiftLeft');
  assert.equal(r.ok, false);
  assert.match(r.message, /única tecla/);
  assert.equal(r.bindings.dash[0], 'ShiftLeft');
});

test('se a principal sair, a extra sobe para o lugar dela', () => {
  // tira o W do pulo pondo ele na extra (vazia) do dash
  const b = clearExtra(DEFAULT_BINDINGS, 'dash');
  const r = assignKey(b, 'dash', 1, 'KeyW');
  assert.ok(r.ok);
  assert.deepEqual(r.bindings.up, ['Space', null]);
  assert.ok(every(r.bindings));
});

test('só o Esc não pode ser usado', () => {
  assert.equal(assignKey(DEFAULT_BINDINGS, 'attack', 0, 'Escape').ok, false);
  // Tab e M agora são teclas do placar e do som: dá para trocar
  const r = assignKey(DEFAULT_BINDINGS, 'attack', 0, 'Tab');
  assert.ok(r.ok);
  assert.equal(r.bindings.scores[0], 'Mouse0', 'o placar ficou com a tecla antiga do atacar');
  const m = assignKey(DEFAULT_BINDINGS, 'mute', 0, 'KeyN');
  assert.deepEqual(m.bindings.mute, ['KeyN', null]);
  assert.equal(actionOf(m.bindings, 'KeyM'), undefined);
});

test('placar e som não entram nos movimentos do boneco', () => {
  const k = keymapFrom(DEFAULT_BINDINGS);
  assert.equal(k.scores, undefined);
  assert.equal(k.mute, undefined);
  assert.deepEqual(k.left, ['KeyA', 'ArrowLeft']);
});

test('teclas salvas antes do placar/som ganham Tab e M', () => {
  const old = cloneBindings(DEFAULT_BINDINGS);
  delete old.scores;
  delete old.mute;
  old.left = ['KeyA', 'KeyQ'];
  const store = { 'brawl.teclas': JSON.stringify(old) };
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
  try {
    const b = loadBindings();
    assert.deepEqual(b.left, ['KeyA', 'KeyQ'], 'manteve o que o jogador escolheu');
    assert.deepEqual(b.scores, ['Tab', null]);
    assert.deepEqual(b.mute, ['KeyM', null]);
  } finally {
    delete globalThis.localStorage;
  }
});

test('mapa do teclado ignora a extra vazia e os nomes ficam bonitos', () => {
  const b = clearExtra(cloneBindings(DEFAULT_BINDINGS), 'dash');
  assert.deepEqual(keymapFrom(b).dash, ['ShiftLeft']);
  assert.equal(keyLabel('KeyA'), 'A');
  assert.equal(keyLabel('Mouse0'), 'Clique esq.');
  assert.equal(keyLabel('Space'), 'Espaço');
});
