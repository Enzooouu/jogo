// Testes da simulação (rodam no Node, sem navegador): npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../shared/game.js';
import { BotController } from '../shared/ai.js';
import { MATCH, PLAYER } from '../shared/constants.js';
import { weaponProfile, WEAPONS } from '../shared/weapons.js';
import { hazardReaction } from '../shared/elements.js';
import { encodeInput, decodeInput, makeInput } from '../shared/input.js';

const FPS = 60;

// Cada elemento é um time (regra: times não misturam elementos).
function newGame(elements = ['fogo', 'agua', 'agua', 'fogo'], opts = {}) {
  const players = elements.map((element, i) => ({
    id: i + 1,
    name: `P${i + 1}`,
    element,
    team: element,
  }));
  const game = new Game({ players, seed: 42, ...opts });
  // Pula a contagem regressiva
  while (game.phase === 'countdown') game.step({});
  game.drainEvents();
  return game;
}

function run(game, ticks, inputs = {}) {
  for (let i = 0; i < ticks; i++) game.step(typeof inputs === 'function' ? inputs(i) : inputs);
}

function place(p, x, feetY) {
  p.x = x - p.w / 2;
  p.y = feetY - p.h;
  p.vx = 0;
  p.vy = 0;
}

// Afasta os jogadores que não participam do teste para não atrapalharem.
function park(game, ...ids) {
  ids.forEach((id, i) => place(game.playerById(id), 980 + i * 40, 540));
}

test('o jogador anda, fica no chão e pula duas vezes no ar', () => {
  const g = newGame();
  park(g, 2, 3, 4);
  const p = g.playerById(1);
  place(p, 640, 540);
  run(g, 5);
  assert.equal(p.onGround, true);

  const x0 = p.x;
  run(g, 20, { 1: makeInput({ right: true }) });
  assert.ok(p.x > x0 + 50, 'andou para a direita');

  run(g, 1, { 1: makeInput({ up: true }) });
  assert.ok(p.vy < 0, 'pulou');
  run(g, 10);
  run(g, 1, { 1: makeInput({ up: true }) });
  assert.equal(p.jumpsLeft, 0, 'usou o pulo duplo');
  const vyBefore = p.vy;
  run(g, 1);
  run(g, 1, { 1: makeInput({ up: true }) });
  assert.ok(p.vy > vyBefore, 'não tem terceiro pulo');
  run(g, 120);
  assert.equal(p.onGround, true, 'voltou ao chão');
});

test('plataforma fina: atravessa por baixo e desce segurando ↓', () => {
  const g = newGame();
  park(g, 2, 3, 4);
  const p = g.playerById(1);
  place(p, 640, 540);       // embaixo da plataforma central (y=315)
  run(g, 3);
  run(g, 1, { 1: makeInput({ up: true }) });
  run(g, 14);
  run(g, 1, { 1: makeInput({ up: true }) });
  run(g, 90);
  assert.equal(p.standingOn, 'platform');
  assert.equal(p.y + p.h, 315);
  run(g, 1, { 1: makeInput({ down: true }) });
  run(g, 60);
  assert.equal(p.standingOn, 'solid');
  assert.equal(p.y + p.h, 540);
});

test('tabela de perigos: fogo é imune à lava e morre na água; água é o contrário', () => {
  assert.equal(hazardReaction('fogo', 'lava'), 'imune');
  assert.equal(hazardReaction('fogo', 'agua'), 'morre');
  assert.equal(hazardReaction('agua', 'agua'), 'imune');
  assert.equal(hazardReaction('agua', 'lava'), 'morre');
});

test('fogo atravessa a lava sem morrer, água morre na lava', () => {
  const g = newGame(['fogo', 'agua', 'agua', 'fogo']);
  park(g, 3, 4);
  const fire = g.playerById(1);
  const water = g.playerById(2);
  place(fire, 400, 572);    // dentro da piscina de lava
  place(water, 420, 572);
  run(g, 2);
  assert.equal(fire.state, 'alive');
  assert.equal(fire.inHazard, 'lava');
  assert.equal(water.state, 'respawning');
  assert.equal(water.lives, PLAYER.lives - 1);
  assert.equal(water.stats.hazardDeaths, 1);
});

test('fogo morre na água, água nada tranquila', () => {
  const g = newGame(['fogo', 'agua', 'agua', 'fogo']);
  park(g, 3, 4);
  const fire = g.playerById(1);
  const water = g.playerById(2);
  place(fire, 880, 572);
  place(water, 900, 572);
  run(g, 2);
  assert.equal(fire.state, 'respawning');
  assert.equal(water.state, 'alive');
  assert.equal(water.inHazard, 'agua');
});

test('cair do mapa tira uma vida, reaparece e fica eliminado sem vidas', () => {
  const g = newGame();
  park(g, 2, 3, 4);
  const p = g.playerById(1);
  for (let life = PLAYER.lives; life > 0; life--) {
    place(p, 640, 540);
    run(g, 2);
    p.x = 60;               // fora do palco: cai
    run(g, 200);
    assert.equal(p.lives, life - 1);
    if (life > 1) assert.equal(p.state, 'alive', 'reapareceu');
  }
  assert.equal(p.state, 'out');
  assert.equal(p.stats.falls, PLAYER.lives);
});

test('soco acerta o inimigo (dano + empurrão) e não acerta o aliado', () => {
  const g = newGame(['fogo', 'agua', 'fogo', 'agua']);
  park(g, 4);
  const a = g.playerById(1);
  const enemy = g.playerById(2);
  const ally = g.playerById(3);
  place(a, 600, 540);
  place(enemy, 640, 540);
  place(ally, 560, 540);
  a.facing = 1;
  run(g, 2);
  run(g, 1, { 1: makeInput({ attack: true }) });
  run(g, 10);
  assert.ok(enemy.damage > 0, 'inimigo levou dano');
  assert.ok(enemy.vx > 0, 'inimigo foi empurrado para a direita');
  assert.equal(enemy.lastHitBy, 1);

  a.facing = -1;
  run(g, 30);
  run(g, 1, { 1: makeInput({ attack: true }) });
  run(g, 10);
  assert.equal(ally.damage, 0, 'aliado não leva dano');
});

test('modo ADM: cada golpe do jogador ADM dá 999%', () => {
  const players = [
    { id: 1, name: 'Adm', element: 'fogo', team: 'fogo', admin: true },
    { id: 2, name: 'Bot', element: 'agua', team: 'agua' },
  ];
  const g = new Game({ players, seed: 42 });
  while (g.phase === 'countdown') g.step({});
  const adm = g.playerById(1);
  const bot = g.playerById(2);
  place(adm, 600, 540);
  place(bot, 640, 540);
  adm.facing = 1;
  bot.facing = -1;
  run(g, 2);
  place(adm, 600, 540);
  place(bot, 640, 540);
  adm.facing = 1;
  run(g, 2);
  run(g, 1, { 1: makeInput({ attack: true }) });
  run(g, 10);
  assert.equal(PLAYER.adminDamage, 999);
  assert.equal(bot.damage, PLAYER.adminDamage);
  run(g, 900);
  assert.equal(bot.lives, PLAYER.lives - 1, 'voou longe e caiu');
});

test('plataforma do balão só balança quando alguém anda em cima (Pico dos Ventos)', () => {
  const g = newGame(['fogo', 'agua', 'agua', 'fogo'], { mapId: 'pico' });
  // sem vento neste teste (o vento também balança a plataforma)
  g.nextWindIn = Infinity;
  g.nextStreamIn = Infinity;
  for (const id of [2, 3, 4]) place(g.playerById(id), 640, 520);
  const p = g.playerById(1);
  const pl = g.platforms[0];
  const x0 = pl.x;
  place(p, pl.x + pl.w / 2, pl.y);
  run(g, 60);
  assert.equal(p.standingOn, 'platform');
  assert.ok(Math.abs(pl.x - x0) < 0.5, 'parado em cima: a plataforma não se mexe');

  // andando para a direita, ela balança para a direita e leva o jogador
  place(p, pl.x + 20, pl.y);
  run(g, 2);
  run(g, 20, { 1: makeInput({ right: true }) });
  assert.ok(pl.x > x0 + 5, 'balançou para o lado que ele andou');
  assert.equal(p.standingOn, 'platform', 'continua em cima');
  assert.ok(Math.abs(p.y + p.h - pl.y) < 1, 'pés em cima da plataforma');

  // parou de andar: volta devagar para o lugar (como um balanço de verdade)
  run(g, 1000);
  assert.ok(Math.abs(pl.x - x0) < 3, 'voltou para o lugar');
});

test('corrente de vento atravessa o mapa e empurra a plataforma do balão', () => {
  const g = newGame(['fogo', 'agua', 'agua', 'fogo'], { mapId: 'pico' });
  g.nextWindIn = Infinity;
  g.nextStreamIn = 0;
  for (const id of [1, 2, 3, 4]) place(g.playerById(id), 640, 520);
  run(g, 1);
  const stream = g.winds.find((w) => w.stream);
  assert.ok(stream, 'a corrente apareceu');
  assert.ok(stream.x <= -200 && stream.x + stream.w >= 1480, 'vai de ponta a ponta');
  // põe a corrente na altura das plataformas de baixo
  stream.y = 262;
  const pl = g.platforms[0];
  const x0 = pl.x;
  run(g, 140);
  assert.ok(Math.abs(pl.x - x0) > 20, 'a plataforma balançou com o vento');
});

test('na Caldeira as plataformas ficam paradas', () => {
  const g = newGame();
  const before = g.platforms.map((pl) => [pl.x, pl.y]);
  run(g, 120);
  assert.deepEqual(g.platforms.map((pl) => [pl.x, pl.y]), before);
});

test('modo ADM: o jogador ADM é intangível (golpes e perigos não pegam)', () => {
  const players = [
    { id: 1, name: 'Adm', element: 'fogo', team: 'fogo', admin: true },
    { id: 2, name: 'Bot', element: 'agua', team: 'agua' },
  ];
  const g = new Game({ players, seed: 42 });
  while (g.phase === 'countdown') g.step({});
  const adm = g.playerById(1);
  const bot = g.playerById(2);
  adm.invuln = 0;
  place(adm, 600, 540);
  place(bot, 640, 540);
  bot.facing = -1;
  run(g, 2);
  run(g, 1, { 2: makeInput({ attack: true }) });
  run(g, 10);
  assert.equal(adm.damage, 0, 'o golpe não acertou');
  // em cima da água (que mata o fogo) não morre
  const water = g.map.hazards.find((h) => h.type === 'agua');
  place(adm, water.x + water.w / 2, water.y + water.h);
  run(g, 30);
  assert.equal(adm.lives, PLAYER.lives);
});

test('arma arremessada que não acerta ninguém fica no chão e volta com as mesmas cargas', () => {
  const g = newGame(['fogo', 'agua', 'agua', 'fogo']);
  // os outros ficam longe, do outro lado (senão pegariam a arma)
  [2, 3, 4].forEach((id, i) => place(g.playerById(id), 230 + i * 30, 540));
  g.nextItemIn = Infinity;
  const p = g.playerById(1);
  place(p, 600, 540);
  p.facing = 1;
  p.weapon = { id: 'espada', uses: 3 };
  run(g, 2);
  run(g, 1, { 1: makeInput({ throw: true }) });
  assert.equal(p.weapon, null);
  run(g, 120);
  const item = g.items.find((i) => i.dropped);
  assert.ok(item, 'a arma ficou no chão');
  assert.ok(item.landed, 'pousou');
  assert.equal(item.uses, 3);
  // vai até ela e pega de volta
  place(p, item.x + item.w / 2, item.y + item.h);
  p.pickupCooldown = 0;
  run(g, 2);
  assert.deepEqual(p.weapon, { id: 'espada', uses: 3 });
  assert.ok(!g.items.includes(item), 'saiu do chão');
});

test('arma arremessada que acerta alguém não volta', () => {
  const g = newGame(['fogo', 'agua', 'agua', 'fogo']);
  park(g, 3, 4);
  g.nextItemIn = Infinity;
  const p = g.playerById(1);
  const enemy = g.playerById(2);
  place(p, 600, 540);
  place(enemy, 700, 540);
  p.facing = 1;
  p.weapon = { id: 'espada', uses: 2 };
  run(g, 2);
  run(g, 1, { 1: makeInput({ throw: true }) });
  run(g, 60);
  assert.ok(enemy.damage > 0, 'acertou');
  assert.equal(g.items.filter((i) => i.dropped).length, 0);
});

test('arma arremessada para fora do mapa se perde', () => {
  const g = newGame(['fogo', 'agua', 'agua', 'fogo']);
  park(g, 2, 3, 4);
  g.nextItemIn = Infinity;
  const p = g.playerById(1);
  place(p, 1060, 540);
  p.facing = 1;
  p.weapon = { id: 'cajado', uses: 4 };
  run(g, 2);
  run(g, 1, { 1: makeInput({ throw: true }) });
  run(g, 240);
  assert.equal(g.items.filter((i) => i.dropped).length, 0);
});

test('modo ADM: pulos e dashes no ar infinitos', () => {
  const players = [
    { id: 1, name: 'Adm', element: 'fogo', team: 'fogo', admin: true },
    { id: 2, name: 'Bot', element: 'agua', team: 'agua' },
  ];
  const g = new Game({ players, seed: 42 });
  while (g.phase === 'countdown') g.step({});
  g.nextWindIn = Infinity;
  const adm = g.playerById(1);
  place(g.playerById(2), 300, 540);
  place(adm, 640, 300);
  // pula 6 vezes seguidas no ar: sobe sempre
  let lastY = adm.y;
  for (let i = 0; i < 6; i++) {
    run(g, 1, { 1: makeInput({ up: true }) });
    run(g, 12);
    assert.ok(adm.y < lastY, `pulo ${i + 1} subiu`);
    lastY = adm.y;
  }
  // 4 dashes no ar (o fogo normal só tem 1)
  for (let i = 0; i < 4; i++) {
    run(g, 1, { 1: makeInput({ dash: true, right: true }) });
    assert.ok(adm.dashTime > 0, `dash ${i + 1} saiu`);
    run(g, 40);
  }
});

test('só cair lá embaixo tira vida (lados e cima não têm limite)', () => {
  const g = newGame();
  const p = g.playerById(1);
  for (const [x, y] of [[-3000, 300], [4000, 300], [640, -3000]]) {
    p.x = x;
    p.y = y;
    p.vx = 0;
    p.vy = 0;
    run(g, 1);
    assert.equal(p.lives, PLAYER.lives, `não morreu em (${x}, ${y})`);
  }
  p.x = 640;
  p.y = g.map.blast.bottom + 10;
  run(g, 1);
  assert.equal(p.lives, PLAYER.lives - 1, 'caiu lá embaixo e perdeu uma vida');
});

test('caixa que cai do céu se quebra no chão e deixa a arma com as cargas cheias', () => {
  const g = newGame();
  park(g, 1, 2, 3, 4);
  g.items = [];
  g.nextItemIn = 0;
  run(g, 1);
  const item = g.items[0];
  assert.ok(item && !item.dropped, 'a caixa apareceu caindo');
  item.x = 600 - item.w / 2;
  run(g, 60 * 6);
  assert.ok(item.landed && item.dropped, 'virou arma no chão');
  assert.equal(item.uses, WEAPONS[item.weapon].uses);
  const p = g.playerById(1);
  place(p, item.x + item.w / 2, item.y + item.h);
  p.pickupCooldown = 0;
  run(g, 2);
  assert.deepEqual(p.weapon, { id: item.weapon, uses: WEAPONS[item.weapon].uses });
});

// Dispara um projétil de cajado do jogador `id` (elemento dele) virado para `dir`
function shootStaff(g, id, dir) {
  const p = g.playerById(id);
  p.facing = dir;
  p.weapon = { id: 'cajado', uses: 5 };
  p.cooldown = 0;
  p.attack = null;
  run(g, 1, { [id]: makeInput({ attack: true }) });
  run(g, 1);
}

// Dois jogadores frente a frente (FFA, um de cada elemento) atirando um no outro
function staffDuel(a, b) {
  const players = [a, b].map((element, i) => ({ id: i + 1, name: element, element }));
  const g = new Game({ players, mode: 'ffa', seed: 7 });
  while (g.phase === 'countdown') g.step({});
  g.nextWindIn = Infinity;
  g.nextItemIn = Infinity;
  // no chão firme do meio (fora da lava e da água)
  place(g.playerById(1), 520, 540);
  place(g.playerById(2), 760, 540);
  run(g, 2);
  return g;
}

test('fogo + água no ar viram vapor (os dois somem)', () => {
  const g = staffDuel('fogo', 'agua');
  const events = [];
  shootStaff(g, 1, 1);
  shootStaff(g, 2, -1);
  for (let i = 0; i < 40; i++) {
    g.step({});
    events.push(...g.drainEvents());
  }
  assert.ok(events.some((e) => e.type === 'combo' && e.kind === 'vapor'), 'teve vapor');
  assert.equal(g.playerById(1).damage + g.playerById(2).damage, 0, 'ninguém foi acertado');
});

test('terra + ar viram tempestade de areia: o tornado continua', () => {
  const g2 = staffDuel('terra', 'ar');
  const events = [];
  shootStaff(g2, 1, 1);   // pedra da Terra indo para a direita
  shootStaff(g2, 2, -1);  // tornado do Ar indo para a esquerda
  for (let i = 0; i < 90; i++) {
    g2.step({});
    events.push(...g2.drainEvents());
  }
  const combo = events.find((e) => e.type === 'combo');
  assert.equal(combo?.kind, 'areia');
  assert.equal(combo.carrier, 'ar', 'o tornado continua');
  assert.ok(g2.projectiles.some((pr) => pr.element === 'ar' && pr.combo === 'terra') || events.some((e) => e.type === 'hit'));
});

test('disparo combinado aplica o efeito do outro elemento ao acertar', () => {
  const g = staffDuel('agua', 'fogo');
  // tornado de fogo do jogador 1 (fingindo ser do Ar) acertando o jogador de água
  const target = g.playerById(1);
  const shooter = g.playerById(2);
  g.projectiles.push({
    id: 999, kind: 'magia', owner: shooter.id, team: shooter.team, element: 'ar', weapon: 'cajado',
    combo: 'terra', x: target.x + target.w / 2 + 30, y: target.y + 30, vx: -380, vy: 0, r: 18,
    gravity: 0, life: 1, pierce: true, hitIds: [],
  });
  target.invuln = 0;
  run(g, 10);
  assert.ok(target.status.atordoado, 'ficou atordoado pela areia');
});

test('quanto mais dano, maior o empurrão', () => {
  const kbAt = (damage) => {
    const g = newGame(['fogo', 'agua', 'fogo', 'agua']);
    park(g, 3, 4);
    const a = g.playerById(1);
    const b = g.playerById(2);
    place(a, 600, 540);
    place(b, 640, 540);
    a.facing = 1;
    b.damage = damage;
    run(g, 2);
    run(g, 1, { 1: makeInput({ attack: true }) });
    run(g, 6);
    return Math.hypot(b.vx, b.vy);
  };
  assert.ok(kbAt(120) > kbAt(0) * 1.5);
});

test('derrubar o inimigo do mapa conta kill para quem bateu', () => {
  const g = newGame(['fogo', 'agua', 'fogo', 'agua']);
  park(g, 3, 4);
  const a = g.playerById(1);
  const b = g.playerById(2);
  place(a, 1060, 540);
  place(b, 1095, 540);
  b.damage = 250;
  a.facing = 1;
  run(g, 2);
  run(g, 1, { 1: makeInput({ attack: true }) });
  run(g, 180);
  assert.equal(b.stats.deaths, 1);
  assert.equal(a.stats.kills, 1);
});

test('armas caem do céu, pousam e são pegas ao encostar', () => {
  const g = newGame();
  park(g, 2, 3, 4);
  const p = g.playerById(1);
  place(p, 640, 540);
  g.nextItemIn = 0;
  run(g, 1);
  assert.equal(g.items.length, 1, 'arma apareceu');
  const item = g.items[0];
  item.x = 640 - item.w / 2 + 120;
  run(g, 60 * 6);
  assert.equal(item.landed, true, 'arma pousou');
  assert.equal(item.y + item.h, 540);

  place(p, item.x + item.w / 2, 540);
  g.nextItemIn = 999;
  run(g, 2);
  assert.ok(p.weapon, 'pegou a arma');
  assert.equal(g.items.length, 0);
});

test('o efeito da arma muda com o elemento de quem pega', () => {
  const fireSword = weaponProfile('espada', 'fogo');
  const waterSword = weaponProfile('espada', 'agua');
  assert.equal(fireSword.status.type, 'queimadura');
  assert.equal(waterSword.status.type, 'encharcado');
  assert.notEqual(fireSword.name, waterSword.name);

  const fireStaff = weaponProfile('cajado', 'fogo');
  const waterStaff = weaponProfile('cajado', 'agua');
  assert.ok(fireStaff.explosion, 'bola de fogo explode');
  assert.equal(waterStaff.projectile.pierce, true, "jato d'água atravessa");
  assert.ok(waterStaff.kbScale > fireStaff.kbScale, "jato d'água empurra mais");
});

test('espada de fogo queima, espada de água encharca (deixa lento)', () => {
  for (const [element, status] of [['fogo', 'queimadura'], ['agua', 'encharcado']]) {
    const g = newGame([element, 'terra', element, 'terra']);
    park(g, 3, 4);
    const a = g.playerById(1);
    const b = g.playerById(2);
    place(a, 600, 540);
    place(b, 650, 540);
    a.facing = 1;
    a.weapon = { id: 'espada', uses: 5 };
    run(g, 2);
    run(g, 1, { 1: makeInput({ attack: true }) });
    run(g, 12);
    assert.ok(b.status[status], `${element} aplicou ${status}`);
    assert.equal(a.weapon.uses, 4, 'gastou um uso');
  }
});

test('cajado atira projétil; bola de fogo explode e acerta quem está perto', () => {
  const g = newGame(['fogo', 'agua', 'fogo', 'agua']);
  const a = g.playerById(1);
  const b = g.playerById(2);
  const c = g.playerById(4);
  place(a, 520, 540);
  place(b, 760, 540);
  place(c, 800, 540);
  place(g.playerById(3), 300, 540);
  a.facing = 1;
  a.weapon = { id: 'cajado', uses: 3 };
  run(g, 2);
  run(g, 1, { 1: makeInput({ attack: true }) });
  run(g, 10);
  assert.equal(g.projectiles.length, 1);
  run(g, 40);
  assert.ok(b.damage > 0, 'acertou em cheio');
  assert.ok(c.damage > 0, 'explosão pegou o vizinho');
});

test('arremessar a arma solta ela e cria um projétil', () => {
  const g = newGame();
  park(g, 2, 3, 4);
  const p = g.playerById(1);
  place(p, 600, 540);
  p.weapon = { id: 'espada', uses: 5 };
  run(g, 2);
  run(g, 1, { 1: makeInput({ throw: true }) });
  assert.equal(p.weapon, null);
  assert.equal(g.projectiles.length, 1);
  assert.equal(g.projectiles[0].kind, 'arremesso');
});

test('vence o time que eliminar o outro', () => {
  const g = newGame(['fogo', 'agua', 'agua', 'fogo']);
  for (const p of g.players.filter((q) => q.team === 'agua')) {
    p.lives = 1;
    p.y = 2000;      // caiu lá embaixo
  }
  run(g, 2);
  assert.equal(g.phase, 'ending');
  assert.equal(g.result.winnerTeam, 'fogo');
  assert.equal(g.result.reason, 'eliminacao');
  run(g, Math.ceil(MATCH.endDelay * FPS) + 2);
  assert.equal(g.phase, 'ended');
});

test('tempo esgotado: vence quem tem mais vidas', () => {
  const g = newGame(['fogo', 'agua', 'agua', 'fogo'], { timeLimit: 1 });
  g.playerById(2).lives = 1;
  run(g, FPS + 2);
  assert.equal(g.result.reason, 'tempo');
  assert.equal(g.result.winnerTeam, 'fogo');
});

test('desistir dá a vitória ao outro time', () => {
  const g = newGame();
  g.forfeit(1);
  assert.equal(g.phase, 'ended');
  assert.equal(g.result.winnerTeam, 'agua');
  assert.equal(g.result.forfeitedBy, 1);
});

test('ninguém nasce ao lado do perigo que o mata', () => {
  for (const elements of [['agua', 'fogo', 'fogo', 'agua'], ['fogo', 'agua', 'agua', 'fogo']]) {
    const g = newGame(elements);
    for (const p of g.players) {
      for (const h of g.map.hazards) {
        if (hazardReaction(p.element, h.type) !== 'morre') continue;
        const cx = p.x + p.w / 2;
        const distance = cx < h.x ? h.x - cx : cx - (h.x + h.w);
        assert.ok(distance > 100 || p.y + p.h < h.y - 80, `${p.element} nasceu a ${distance}px de ${h.type}`);
      }
    }
  }
});

function botMatch({ count = 4, mode = 'times', seed = 7, difficulty = 'normal' } = {}) {
  const players = Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Bot ${i + 1}`,
    element: mode === 'ffa' ? (i % 2 ? 'agua' : 'fogo') : i < count / 2 ? 'fogo' : 'agua',
    team: i < count / 2 ? 'A' : 'B',
    isBot: true,
  }));
  const g = new Game({ players, mode, seed });
  const bots = players.map((p) => new BotController(p.id, { difficulty, seed: seed * 31 + p.id }));
  let ticks = 0;
  while (g.phase !== 'ended' && ticks < FPS * 300) {
    const inputs = {};
    for (const b of bots) inputs[b.playerId] = b.getInput(g);
    g.step(inputs);
    g.drainEvents();
    ticks++;
  }
  return g;
}

test('partida 2v2 só com bots termina com um vencedor', () => {
  const g = botMatch();
  assert.equal(g.phase, 'ended');
  assert.ok(g.result);
  assert.equal(g.result.players.length, 4);
  const kills = g.result.players.reduce((s, p) => s + p.kills, 0);
  assert.ok(kills > 0, 'houve kills');
});

test('suporta mais de 4 jogadores (3v3 e 4v4) e todos contra todos', () => {
  for (const [count, mode] of [[6, 'times'], [8, 'times'], [5, 'ffa'], [8, 'ffa']]) {
    const g = botMatch({ count, mode, seed: count });
    assert.equal(g.phase, 'ended', `${count} jogadores em ${mode}`);
    assert.equal(g.players.length, count);
    if (mode === 'ffa') assert.equal(new Set(g.players.map((p) => p.team)).size, count);
  }
});

test('mesma semente e mesmos comandos = mesma partida (base para o online)', () => {
  const a = botMatch({ seed: 99 });
  const b = botMatch({ seed: 99 });
  assert.deepEqual(a.result, b.result);
  assert.equal(a.tick, b.tick);
});

test('comando compacta e descompacta sem perder nada', () => {
  const input = makeInput({ left: true, attack: true, down: true });
  assert.deepEqual(decodeInput(encodeInput(input)), input);
});

test('parede: se pendura, escorrega devagar e pula para longe dela', () => {
  const g = newGame();
  park(g, 2, 3, 4);
  const p = g.playerById(1);
  // Ao lado da parede esquerda da ilha (x = 180), no ar, segurando para a direita.
  p.x = 180 - p.w - 1;
  p.y = 560;
  p.vx = 0;
  p.vy = 400;
  const hold = { 1: makeInput({ right: true }) };
  run(g, 2, hold);
  assert.equal(p.onWall, 1, 'pendurou');
  run(g, 10, hold);
  assert.equal(p.vy, 0, 'fica parado um instante');
  const y0 = p.y;
  run(g, 40, hold);
  assert.ok(p.y > y0, 'escorrega');
  assert.ok(p.vy <= 150, 'escorrega devagar');

  const jumps = p.jumpsLeft;
  run(g, 1, { 1: makeInput({ right: true, up: true }) });
  assert.ok(p.vy < -600, 'pulo de parede vai para cima');
  assert.ok(p.vx < 0, 'e para longe da parede');
  assert.equal(p.jumpsLeft, jumps, 'não gasta os pulos normais');
});

test('sem segurar para a parede, só cai', () => {
  const g = newGame();
  park(g, 2, 3, 4);
  const p = g.playerById(1);
  p.x = 180 - p.w - 1;
  p.y = 560;
  p.vy = 400;
  run(g, 10);
  assert.equal(p.onWall, 0);
  assert.ok(p.vy > 400);
});

test('bot derrubado para fora se recupera pela parede', () => {
  let recovered = 0;
  for (let seed = 1; seed <= 6; seed++) {
    const players = [
      { id: 1, name: 'A', element: 'fogo', team: 'A', isBot: true },
      { id: 2, name: 'B', element: 'agua', team: 'B', isBot: true },
    ];
    const g = new Game({ players, seed });
    while (g.phase === 'countdown') g.step({});
    const bot = new BotController(1, { difficulty: 'normal', seed });
    const p = g.playerById(1);
    p.x = 120;
    p.y = 600;   // abaixo do topo da ilha, ao lado da parede esquerda
    p.vy = 0;
    p.jumpsLeft = 0;
    place(g.playerById(2), 1050, 540);
    for (let i = 0; i < FPS * 4 && p.state === 'alive'; i++) g.step({ 1: bot.getInput(g) });
    // voltou para cima da ilha (vale estar na lava, já que é de Fogo)
    if (p.state === 'alive' && p.x > 180 && p.x < 1100 && p.y + p.h <= 572) recovered++;
  }
  assert.ok(recovered >= 5, `recuperou ${recovered} de 6`);
});

test('times não misturam elementos e não repetem elemento', () => {
  const make = (list) => () => new Game({ players: list.map(([element, team], i) => ({ id: i + 1, element, team })), seed: 1 });
  assert.throws(make([['fogo', 'A'], ['agua', 'A'], ['agua', 'B'], ['fogo', 'B']]), /mistura/);
  assert.throws(make([['fogo', 'A'], ['fogo', 'A'], ['fogo', 'B'], ['fogo', 'B']]), /mesmo elemento/);
  assert.doesNotThrow(make([['fogo', 'A'], ['fogo', 'A'], ['agua', 'B'], ['agua', 'B']]));
});

test('cada time nasce no lado do mapa mais seguro para o seu elemento', () => {
  for (const [a, b] of [['fogo', 'agua'], ['agua', 'fogo']]) {
    const players = [[a, 'A'], [a, 'A'], [b, 'B'], [b, 'B']].map(([element, team], i) => ({ id: i + 1, element, team }));
    const g = new Game({ players, seed: 1 });
    const water = g.players.filter((p) => p.element === 'agua');
    assert.ok(water.every((p) => p.x > 640 - 60), 'time de Água fica do lado da água');
  }
});

test('placar conta dano causado, dano recebido, golpes e armas pegas', () => {
  const g = newGame(['fogo', 'agua', 'fogo', 'agua']);
  park(g, 3, 4);
  const a = g.playerById(1);
  const b = g.playerById(2);
  place(a, 600, 540);
  place(b, 640, 540);
  a.facing = 1;
  run(g, 2);
  run(g, 1, { 1: makeInput({ attack: true }) });
  run(g, 10);
  assert.equal(a.stats.hits, 1);
  assert.equal(a.stats.damageDealt, 6);
  assert.equal(b.stats.damageTaken, 6);
  g.forfeit(2);
  const row = g.result.players.find((p) => p.id === 2);
  assert.equal(row.damageTaken, 6);
});

// ------------------------------------------------------------ Terra e Ar

function duel(a, b, opts = {}) {
  const g = new Game({ players: [{ id: 1, element: a, team: 'A' }, { id: 2, element: b, team: 'B' }], seed: 3, ...opts });
  while (g.phase === 'countdown') g.step({});
  g.drainEvents();
  return g;
}

test('espinhos não matam: somam 6% por segundo, e Terra é imune', () => {
  for (const [el, expected] of [['fogo', 6], ['ar', 6], ['terra', 0]]) {
    const g = duel(el, el === 'fogo' ? 'agua' : 'fogo');
    const p = g.playerById(1);
    place(g.playerById(2), 1050, 540);
    g.nextWindIn = Infinity;
    place(p, 640, 315);           // em cima dos espinhos
    run(g, FPS);
    assert.equal(p.state, 'alive', `${el} continua vivo`);
    assert.ok(Math.abs(p.damage - expected) < 0.2, `${el}: ${p.damage}`);
  }
});

test('vento empurra para fora; Ar é imune e Terra sente metade', () => {
  const pushed = {};
  for (const el of ['fogo', 'terra', 'ar']) {
    const g = duel(el, el === 'fogo' ? 'agua' : 'fogo');
    const p = g.playerById(1);
    place(g.playerById(2), 1050, 540);
    g.nextWindIn = Infinity;
    place(p, 300, 540);
    g.winds.push({ id: 99, x: 200, y: 380, w: 250, h: 160, dir: -1, state: 'ativo', time: 5 });
    const x0 = p.x;
    run(g, 30);
    pushed[el] = x0 - p.x;
  }
  assert.ok(pushed.fogo > 80, `fogo empurrado ${pushed.fogo}`);
  assert.ok(pushed.terra > 20 && pushed.terra < pushed.fogo * 0.7, `terra ${pushed.terra}`);
  assert.ok(Math.abs(pushed.ar) < 1, `ar ${pushed.ar}`);
});

test('rajadas de vento aparecem sozinhas com aviso antes', () => {
  const g = duel('fogo', 'agua');
  g.nextWindIn = 0;
  run(g, 1);
  assert.equal(g.winds.length, 1);
  assert.equal(g.winds[0].state, 'aviso');
  run(g, Math.ceil(g.map.wind.warn * FPS) + 1);
  assert.equal(g.winds[0].state, 'ativo');
  const ev = g.drainEvents().map((e) => e.type);
  assert.ok(ev.includes('windStart'));
});

test('espadão de Terra atordoa; Terra não fica atordoado', () => {
  const g = duel('terra', 'fogo');
  const a = g.playerById(1);
  const b = g.playerById(2);
  place(a, 600, 540);
  place(b, 650, 540);
  a.facing = 1;
  a.weapon = { id: 'espada', uses: 5 };
  run(g, 2);
  run(g, 1, { 1: makeInput({ attack: true }) });
  run(g, 10);
  assert.ok(b.status.atordoado, 'fogo atordoado');
  g.applyStatus(a, { type: 'atordoado', duration: 1 }, 2);
  assert.equal(a.status.atordoado, null);
});

test('tornado do Ar puxa o inimigo para perto', () => {
  const g = duel('ar', 'fogo');
  const a = g.playerById(1);
  const b = g.playerById(2);
  place(a, 500, 540);
  place(b, 760, 540);
  a.facing = 1;
  a.weapon = { id: 'cajado', uses: 5 };
  run(g, 2);
  run(g, 1, { 1: makeInput({ attack: true }) });
  let pulled = false;
  for (let i = 0; i < 60 && !pulled; i++) {
    run(g, 1);
    if (b.vx < -20) pulled = true;
  }
  assert.ok(pulled, 'foi puxado na direção do tornado');
});

test('Ar é mais rápido que Terra', () => {
  const g = duel('ar', 'terra');
  const a = g.playerById(1);
  const t = g.playerById(2);
  place(a, 520, 540);
  place(t, 520, 540);
  g.nextWindIn = Infinity;
  run(g, 30, { 1: makeInput({ right: true }), 2: makeInput({ right: true }) });
  assert.ok(a.x > t.x + 20);
});

test('todos contra todos com os 4 elementos termina', () => {
  const players = ['fogo', 'agua', 'terra', 'ar'].map((element, i) => ({ id: i + 1, element, name: element, isBot: true }));
  const g = new Game({ players, mode: 'ffa', seed: 11 });
  const bots = players.map((p) => new BotController(p.id, { seed: p.id }));
  let n = 0;
  while (g.phase !== 'ended' && n < FPS * 300) {
    const inputs = {};
    for (const b of bots) inputs[b.playerId] = b.getInput(g);
    g.step(inputs);
    n++;
  }
  assert.equal(g.phase, 'ended');
});

test('times de Terra e de Ar também terminam a partida', () => {
  for (const [a, b] of [['terra', 'ar'], ['fogo', 'terra'], ['ar', 'agua']]) {
    const players = [[a, 'A'], [a, 'A'], [b, 'B'], [b, 'B']].map(([element, team], i) => ({ id: i + 1, element, team, isBot: true }));
    const g = new Game({ players, seed: 21 });
    const bots = players.map((p) => new BotController(p.id, { seed: p.id * 7 }));
    let n = 0;
    while (g.phase !== 'ended' && n < FPS * 300) {
      const inputs = {};
      for (const bot of bots) inputs[bot.playerId] = bot.getInput(g);
      g.step(inputs);
      n++;
    }
    assert.equal(g.phase, 'ended', `${a} x ${b}`);
  }
});

test('passar correndo pelos espinhos também machuca (espeta na hora)', () => {
  const g = duel('fogo', 'agua');
  place(g.playerById(2), 1050, 540);
  g.nextWindIn = Infinity;
  const p = g.playerById(1);
  place(p, 590, 315);
  p.vx = 330;
  run(g, 15, { 1: makeInput({ right: true }) });
  assert.ok(p.damage >= 3, `levou ${p.damage}`);
});

// ------------------------------------------------------------ dash

test('dash: arranco rápido na direção segurada, sem gravidade', () => {
  const g = duel('fogo', 'agua');
  place(g.playerById(2), 1050, 540);
  g.nextWindIn = Infinity;
  const p = g.playerById(1);
  place(p, 600, 540);
  run(g, 2);
  const x0 = p.x;
  run(g, 1, { 1: makeInput({ right: true, dash: true }) });
  run(g, 8, { 1: makeInput({ right: true }) });
  assert.ok(p.x - x0 > 90, `andou ${p.x - x0}`);
});

test('no ar só tem 1 dash; recarrega ao pisar no chão', () => {
  const g = duel('fogo', 'agua');
  place(g.playerById(2), 1050, 540);
  g.nextWindIn = Infinity;
  const p = g.playerById(1);
  p.x = 150; p.y = 100; p.vx = 0; p.vy = 0;   // no ar, fora da ilha
  run(g, 1);
  run(g, 1, { 1: makeInput({ left: true, dash: true }) });
  assert.equal(p.airDashes, 0);
  run(g, 40);
  const vy = p.vy;
  run(g, 1, { 1: makeInput({ dash: true }) });
  assert.equal(p.dashTime, 0, 'segundo dash no ar não sai');
  place(p, 640, 540);
  run(g, 3);
  assert.equal(p.onGround, true);
  assert.equal(p.airDashes, 1, 'recarregou');
  void vy;
});

test('dash para cima na diagonal ajuda a voltar para a ilha', () => {
  const g = duel('fogo', 'agua');
  place(g.playerById(2), 1050, 540);
  g.nextWindIn = Infinity;
  const p = g.playerById(1);
  p.x = 60; p.y = 560; p.vx = 0; p.vy = 300; p.jumpsLeft = 0;
  run(g, 1, { 1: makeInput({ right: true, up: true, dash: true }) });
  run(g, 9, { 1: makeInput({ right: true }) });
  assert.ok(p.y < 520, `subiu até ${p.y}`);
});

test('bots usam o dash quando acabam os pulos fora da ilha', () => {
  let dashed = 0;
  for (let seed = 1; seed <= 6; seed++) {
    const g = duel('fogo', 'agua', { seed });
    place(g.playerById(2), 1050, 540);
    g.nextWindIn = Infinity;
    const bot = new BotController(1, { seed });
    const p = g.playerById(1);
    p.x = 20; p.y = 450; p.vx = -100; p.vy = 100; p.jumpsLeft = 0;
    for (let i = 0; i < 30; i++) {
      g.step({ 1: bot.getInput(g) });
      if (g.drainEvents().some((e) => e.type === 'dash')) { dashed++; break; }
    }
  }
  assert.ok(dashed >= 5, `dash em ${dashed} de 6`);
});

test('levar golpe no ar não devolve o dash', () => {
  const g = duel('fogo', 'agua');
  g.nextWindIn = Infinity;
  const a = g.playerById(1);
  const b = g.playerById(2);
  place(a, 600, 540);
  b.x = 640; b.y = 300; b.vx = 0; b.vy = 0;
  run(g, 1);
  run(g, 1, { 2: makeInput({ dash: true, up: true }) });
  assert.equal(b.airDashes, 0, 'gastou o dash');
  run(g, 12);
  b.x = a.x + 40; b.y = a.y; a.facing = 1;
  run(g, 1, { 1: makeInput({ attack: true }) });
  run(g, 8);
  assert.ok(b.damage > 0, 'levou o golpe');
  assert.equal(b.airDashes, 0, 'continua sem dash');
});

test('um aperto de dash gasta só um dos 2 dashes do Ar', () => {
  const g = duel('ar', 'fogo');
  g.nextWindIn = Infinity;
  const p = g.playerById(1);
  p.x = 640; p.y = 100; p.vy = 0;
  run(g, 1);
  run(g, 6, { 1: makeInput({ dash: true, right: true }) });
  assert.equal(p.airDashes, 1);
});

// ---------------------------------------------------------------- lança

function spearGame(element = 'fogo') {
  const g = newGame([element, element === 'agua' ? 'terra' : 'agua'], { mapId: 'treino-campo', items: false });
  const [a, b] = g.players;
  place(a, 400, 560);
  a.facing = 1;
  a.weapon = { id: 'lanca', uses: WEAPONS.lanca.uses };
  return { g, a, b };
}

test('lança: avança para a frente quando ataca e erra', () => {
  const { g, a, b } = spearGame();
  place(b, 1150, 560);
  const x0 = a.x;
  run(g, 40, (i) => ({ 1: makeInput({ attack: i === 0 }) }));
  assert.ok(a.x - x0 > 120, `andou só ${Math.round(a.x - x0)}px`);
  assert.equal(a.weapon.uses, WEAPONS.lanca.uses - 1);
});

test('lança: para em quem acertar e acerta só uma vez por golpe', () => {
  const { g, a, b } = spearGame();
  place(b, 540, 560);
  let hits = 0;
  const x0 = a.x;
  for (let i = 0; i < 40; i++) {
    g.step({ 1: makeInput({ attack: i === 0 }) });
    hits += g.drainEvents().filter((e) => e.type === 'hit' && e.attacker === 1).length;
  }
  assert.equal(hits, 1);
  assert.ok(b.damage > 0);
  assert.ok(a.x - x0 < 110, 'parou no inimigo em vez de passar direto');
});

test('lança: no ar avança só 1 vez até pisar no chão', () => {
  const { g, a } = spearGame('ar');
  // caindo no vazio, longe de qualquer chão
  a.x = -300;
  a.y = -400;
  a.onGround = false;
  let lunges = 0;
  for (let i = 0; i < 70; i++) {
    g.step({ 1: makeInput({ attack: i % 20 === 0 }) });
    lunges += g.drainEvents().filter((e) => e.type === 'lunge').length;
  }
  assert.equal(lunges, 1);
});

test('lança: cada elemento tem a sua (nome e efeito)', () => {
  assert.equal(weaponProfile('lanca', 'fogo').status.type, 'queimadura');
  assert.equal(weaponProfile('lanca', 'agua').name, 'Tridente da Maré');
  assert.equal(weaponProfile('lanca', 'terra').status.type, 'atordoado');
  assert.ok(weaponProfile('lanca', 'ar').lunge.speed > weaponProfile('lanca', 'terra').lunge.speed, 'a do ar é mais rápida');
});

// ---------------------------------------------------------------- mortal

test('Mortal: bate 25% mais forte que os outros com a mesma arma', () => {
  const hit = (element) => {
    const g = newGame([element, element === 'agua' ? 'terra' : 'agua'], { mapId: 'treino-campo', items: false });
    const [a, b] = g.players;
    place(a, 400, 560);
    place(b, 440, 560);
    a.facing = 1;
    a.weapon = { id: 'espada', uses: 5 };
    run(g, 20, (i) => ({ 1: makeInput({ attack: i === 0 }) }));
    return b.damage;
  };
  const normal = hit('agua');
  const mortal = hit('mortal');
  assert.ok(Math.abs(mortal / normal - 1.25) < 0.01, `mortal ${mortal} x normal ${normal}`);
});

test('Mortal: morre na lava e na água, espinhos machucam e o vento empurra', () => {
  assert.equal(hazardReaction('mortal', 'lava'), 'morre');
  assert.equal(hazardReaction('mortal', 'agua'), 'morre');
  assert.equal(hazardReaction('mortal', 'espinhos'), 'dano');
  assert.equal(hazardReaction('mortal', 'vento'), 'empurra');
});

test('Mortal: usa as armas padrão, sem efeito de elemento', () => {
  for (const id of Object.keys(WEAPONS)) {
    const p = weaponProfile(id, 'mortal');
    assert.equal(p.status, undefined, id);
    assert.equal(p.name, WEAPONS[id].name, id);
  }
});

test('Mortal: tiro sem elemento não se combina com outros tiros', () => {
  const g = newGame(['mortal', 'fogo'], { items: false });
  const [a, b] = g.players;
  place(a, 300, 540);
  place(b, 700, 540);
  a.facing = 1;
  b.facing = -1;
  a.weapon = { id: 'cajado', uses: 5 };
  b.weapon = { id: 'cajado', uses: 5 };
  let combos = 0;
  for (let i = 0; i < 40; i++) {
    g.step({ 1: makeInput({ attack: i === 0 }), 2: makeInput({ attack: i === 0 }) });
    combos += g.drainEvents().filter((e) => e.type === 'combo').length;
  }
  assert.equal(combos, 0);
});
