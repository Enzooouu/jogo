// Testes do Lago Congelado (shared/lake.js): npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../shared/game.js';
import { LAKE } from '../shared/lake.js';

function newLake(elements = ['fogo', 'terra']) {
  const players = elements.map((element, i) => ({ id: i + 1, name: `P${i + 1}`, element, team: element }));
  const g = new Game({ players, seed: 7, mapId: 'gelo', items: false });
  while (g.phase === 'countdown') g.step({});
  // desliga o que é aleatório; cada teste liga só o que precisa
  g.lake.nextBlizzard = Infinity;
  g.lake.nextIcicle = Infinity;
  g.lake.nextPile = Infinity;
  g.drainEvents();
  return g;
}

function run(g, ticks, inputs = {}) {
  for (let i = 0; i < ticks; i++) g.step(typeof inputs === 'function' ? inputs(i) : inputs);
}

function place(p, x, feetY) {
  p.x = x - p.w / 2;
  p.y = feetY - p.h;
  p.vx = 0;
  p.vy = 0;
}

// tira o jogador do caminho (lá em cima, fora do mapa, sem cair)
function park(g, id) {
  const p = g.playerById(id);
  p.state = 'respawning';
  p.respawnTimer = Infinity;
}

const types = (events) => events.map((e) => e.type);

test('Lago: o gelo do meio é inteiro e não tem água', () => {
  const g = newLake();
  assert.equal(g.map.hazards.length, 0);
  assert.equal(g.hazardsNow().length, 0);
  const ice = g.solidsNow().filter((s) => s.ice);
  assert.equal(ice.length, 1);
  assert.equal(ice[0].w, 620);
});

test('Lago: três pancadas fortes quebram o gelo, abrem um buraco de água e ele congela de novo', () => {
  const g = newLake(['agua', 'terra']);
  park(g, 2);
  const p = g.playerById(1);
  const smash = () => {
    place(p, 671, 520);   // meio de um pedaço do gelo
    p.vy = LAKE.crack.pound + 20;
    p.onGround = false;
    run(g, 1, { 1: { down: true } });   // descendo rápido (segurando baixo)
  };
  smash();
  assert.ok(types(g.drainEvents()).includes('iceCrack'));
  smash();
  smash();
  const ev = g.drainEvents();
  assert.ok(types(ev).includes('iceBreak'), types(ev).join(','));
  const holes = g.hazardsNow();
  assert.equal(holes.length, 1);
  assert.equal(holes[0].type, 'agua');
  // quem é de Água fica bem dentro do buraco
  run(g, 30);
  assert.equal(p.state, 'alive');
  assert.ok(p.y + p.h > 530, 'caiu dentro do buraco');
  // depois de alguns segundos congela e quem estava dentro sobe
  run(g, Math.ceil(LAKE.crack.open * 60) + 5);
  assert.equal(g.hazardsNow().length, 0);
  assert.ok(Math.abs(p.y + p.h - 530) < 1, `pés em ${p.y + p.h}`);
});

test('Lago: cair andando (sem pancada) não racha o gelo', () => {
  const g = newLake();
  park(g, 2);
  const p = g.playerById(1);
  place(p, 640, 400);
  run(g, 60);
  assert.ok(!types(g.drainEvents()).includes('iceCrack'));
});

test('Lago: o buraco mata quem não é de Água', () => {
  const g = newLake(['fogo', 'terra']);
  park(g, 2);
  const cell = g.lake.cells[5];
  cell.open = 5;
  g.lake.version++;
  const p = g.playerById(1);
  place(p, cell.x + cell.w / 2, 500);
  run(g, 40);
  assert.equal(p.state, 'respawning');
});

test('Lago: plataforma de gelo derrete com alguém em cima, cai e volta depois', () => {
  const g = newLake();
  park(g, 2);
  const p = g.playerById(1);
  const pl = g.platforms[0];
  place(p, pl.x + pl.w / 2, pl.y);
  run(g, Math.ceil(LAKE.melt.time * 60) + 5);
  assert.ok(types(g.drainEvents()).includes('platformMelt'));
  assert.ok(g.platformGone(pl));
  run(g, 20);
  assert.ok(p.y > pl.y, 'caiu da plataforma');
  run(g, Math.ceil(LAKE.melt.gone * 60));
  assert.ok(!g.platformGone(pl));
  assert.equal(pl.melt, 0);
});

test('Lago: a nevasca empurra na diagonal para baixo, para o lado sorteado (Ar é imune)', () => {
  const g = newLake(['fogo', 'ar']);
  const [fogo, ar] = g.players;
  place(fogo, 640, 200);
  place(ar, 700, 200);
  g.lake.blizzard = { state: 'ativo', dir: 1, time: 3 };
  run(g, 10);
  assert.ok(fogo.windVx > 0, 'fogo vai para a direita');
  assert.equal(ar.windVx, 0);
  // fogo cai mais rápido que o Ar
  assert.ok(fogo.vy > ar.vy, `fogo ${fogo.vy} x ar ${ar.vy}`);
  g.lake.blizzard = { state: 'ativo', dir: -1, time: 3 };
  run(g, 20);
  assert.ok(fogo.windVx < 0, 'agora para a esquerda');
});

test('Lago: a nevasca avisa antes de começar', () => {
  const g = newLake();
  g.lake.nextBlizzard = 0.01;
  run(g, 2);
  assert.ok(types(g.drainEvents()).includes('blizzardWarn'));
  assert.equal(g.lake.blizzard.state, 'aviso');
  run(g, Math.ceil(LAKE.blizzard.warn * 60) + 2);
  assert.ok(types(g.drainEvents()).includes('blizzardStart'));
});

test('Lago: pingente treme, cai e machuca quem está embaixo', () => {
  const g = newLake();
  park(g, 2);
  const p = g.playerById(1);
  const pl = g.platforms[2];
  place(p, pl.x + pl.w / 2, 530);
  g.lake.icicles.push({ id: 99, plat: 2, dx: pl.w / 2, x: pl.x + pl.w / 2, y: pl.y + 30, vy: 0, state: 'treme', time: 0.2 });
  run(g, 60);
  assert.equal(p.damage, LAKE.icicle.damage);
  assert.ok(types(g.drainEvents()).includes('icicleBreak'));
  assert.equal(g.lake.icicles.length, 0);
});

test('Lago: bola de neve dá 1 de dano em qualquer um e devolve 1 para quem é de Água', () => {
  for (const [target, expected] of [['terra', 11], ['fogo', 11], ['agua', 9]]) {
    const g = newLake(['mortal', target]);
    const [me, other] = g.players;
    place(me, 500, 530);
    place(other, 640, 530);
    me.facing = 1;
    other.damage = 10;
    me.snowballs = 3;
    run(g, 1, { 1: { throw: true } });
    run(g, 30);
    assert.equal(me.snowballs, 2);
    assert.equal(other.damage, expected, `${target}: ${other.damage}`);
    assert.ok(other.vx > 0, `${target} foi empurrado`);
  }
});

test('Lago: passar no montinho de neve dá bolas de neve, mesmo segurando arma', () => {
  const g = newLake();
  park(g, 2);
  const p = g.playerById(1);
  p.weapon = { id: 'espada', uses: 5 };
  g.lake.nextPile = 0.01;
  run(g, 2);
  const pile = g.lake.piles[0];
  assert.ok(pile);
  place(p, pile.x + pile.w / 2, pile.y + pile.h);
  run(g, 2);
  assert.equal(p.snowballs, LAKE.snow.per);
  assert.equal(g.lake.piles.length, 0);
  assert.equal(p.weapon.id, 'espada');
});
