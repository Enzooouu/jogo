// Testes da simulação (rodam no Node, sem navegador): npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../shared/game.js';
import { BotController } from '../shared/ai.js';
import { MATCH, PLAYER } from '../shared/constants.js';
import { weaponProfile } from '../shared/weapons.js';
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
    p.x = -1000;     // fora do mapa
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
        if (hazardReaction(p.element, h.type) === 'imune') continue;
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
    if (p.state === 'alive' && p.y + p.h <= 540) recovered++;
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
