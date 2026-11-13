// Online: o servidor roda a partida de verdade (o mesmo Game daqui) e manda o
// estado para os jogadores umas 30 vezes por segundo. Cada navegador tem uma
// "cópia espelho" da partida, atualizada com esse estado, só para desenhar.
//
//   gameConfig(setup)       config do Game a partir do setup (local e online)
//   snapshotGame(game)      estado que muda durante a partida, pronto para JSON
//   applySnapshot(game, s)  coloca esse estado na cópia espelho
//   buildOnlineSetup(...)   monta a partida online (bots completando os times)

import { ELEMENTS, enabledElements } from './elements.js';
import { EMPTY_INPUT } from './input.js';
import { MAPS, HILL_MAPS } from './maps.js';
import { TOWER, botBrain, floorFoes, floorStep, guardianOf, gravityFor } from './tower.js';

// ------------------------------------------------------------ config

export function gameConfig(setup) {
  return {
    players: setup.players, mode: setup.mode, seed: setup.seed, mapId: setup.mapId,
    ...(setup.online ? { checkElements: false } : {}),
    // treino livre: ninguém perde vida, sem tempo e contagem curta
    ...(setup.practice ? { practice: true, timeLimit: 0, countdown: 1, items: false } : {}),
    // modo Torre: o andar muda o céu e cada andar tem um tempo
    ...(setup.tower ? {
      towerFloor: setup.tower.floor, timeLimit: setup.tower.timeLimit, lives: setup.tower.maxLives, gravityScale: setup.tower.gravity ?? 1,
      climb: setup.tower.climb ?? 0, climbInfo: setup.tower.climbInfo ?? null, celebrate: setup.tower.celebrate ?? true, endDelay: setup.tower.endDelay,
    } : {}),
  };
}

// ------------------------------------------------------------ estado

// partes do Game que mudam durante a partida (o mapa e o resto não mudam)
const DYNAMIC = [
  'tick', 'time', 'phase', 'phaseTimer', 'result', 'suddenDeath', 'suddenWarned', 'walls', 'winds',
  'items', 'projectiles', 'platforms', 'players', 'nextItemIn', 'nextWindIn', 'nextStreamIn', 'respawnIndex', 'nextEntityId',
];
// partes que são objetos com métodos (só os dados vão pela rede)
const PARTS = ['hill', 'lake', 'ships'];

function toPlain(v) {
  if (v === null || typeof v !== 'object') return typeof v === 'function' ? undefined : v;
  if (v instanceof Map) return { __m: [...v].map(([k, x]) => [k, toPlain(x)]) };
  if (v instanceof Set) return { __s: [...v].map(toPlain) };
  if (Array.isArray(v)) return v.map(toPlain);
  const out = {};
  for (const k of Object.keys(v)) {
    if (k === 'game') continue;   // referência de volta para o Game
    const x = toPlain(v[k]);
    if (x !== undefined) out[k] = x;
  }
  return out;
}

function fromPlain(v) {
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map(fromPlain);
  if (v.__m) return new Map(v.__m.map(([k, x]) => [k, fromPlain(x)]));
  if (v.__s) return new Set(v.__s.map(fromPlain));
  const out = {};
  for (const k of Object.keys(v)) out[k] = fromPlain(v[k]);
  return out;
}

export function snapshotGame(game) {
  const s = {};
  for (const k of DYNAMIC) s[k] = toPlain(game[k]);
  for (const k of PARTS) if (game[k]) s[k] = toPlain(game[k]);
  return s;
}

export function applySnapshot(game, snap) {
  const old = new Map(game.players.map((p) => [p.id, p]));
  const oldPlat = game.platforms;
  for (const k of DYNAMIC) if (k in snap) game[k] = fromPlain(snap[k]);
  for (const k of PARTS) {
    if (!snap[k] || !game[k]) continue;
    const plain = fromPlain(snap[k]);
    for (const key of Object.keys(plain)) game[k][key] = plain[key];
  }
  // posição anterior = onde estava no estado passado (o desenho interpola)
  for (const p of game.players) {
    const o = old.get(p.id);
    if (o) {
      p.px = o.x;
      p.py = o.y;
    }
  }
  game.platforms.forEach((pl, i) => {
    if (oldPlat[i]) {
      pl.px = oldPlat[i].x;
      pl.py = oldPlat[i].y;
    }
  });
}

// ------------------------------------------------------------ montar a partida

export const ONLINE_MODES = {
  '1x1': { name: '1 × 1', size: 1 },
  '2x2': { name: '2 × 2', size: 2 },
  '3x3': { name: '3 × 3', size: 3 },
  ffa: { name: 'Todos contra todos' },
  rei: { name: 'Rei da Ilha', size: 2 },
  torre: { name: 'Torre (em dupla)' },
};

export const RANDOM = 'aleatorio';

// mapas que cada modo pode usar
export function mapsFor(mode) {
  if (mode === 'rei') return Object.keys(HILL_MAPS);
  if (mode === 'torre') return ['torre'];
  return Object.keys(MAPS);
}

const BOT_NAMES = {
  fogo: ['Brasa', 'Fagulha', 'Labareda', 'Pavio', 'Faísca', 'Chama'],
  agua: ['Maré', 'Gota', 'Onda', 'Correnteza', 'Garoa', 'Orvalho'],
  terra: ['Rocha', 'Barro', 'Cascalho', 'Pedregulho'],
  ar: ['Brisa', 'Rajada', 'Sopro', 'Ventania'],
  mortal: ['Zé', 'Fulano', 'Mané', 'Anônimo', 'Sujeito', 'Cidadão'],
};

const TOWER_NAMES = ['Zé Tonto', 'Bobão', 'Lerdo', 'Novato', 'Aprendiz', 'Espertinho', 'Sabido', 'Astuto', 'Estrategista', 'Mestre', 'Gênio'];

/**
 * @param {object} o
 * @param {string} o.mode  '1x1' | '2x2' | '3x3' | 'ffa' | 'rei' | 'torre'
 * @param {string} o.mapId mapa escolhido ou 'aleatorio'
 * @param {{ id, name, element, hat? }[]} o.humans os dois jogadores (o 1º é o dono da sala)
 * @param {() => number} o.rand número aleatório (0 a 1)
 * @param {object} [o.tower] Torre em dupla: { floor, carry: { [id]: { lives, damage } }, climbInfo }
 */
export function buildOnlineSetup({ mode, mapId, humans, rand = Math.random, tower = null }) {
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const used = new Set();
  const botName = (el) => {
    const free = (BOT_NAMES[el] ?? ['Bot']).filter((n) => !used.has(n));
    const n = free.length ? pick(free) : `Bot ${used.size + 1}`;
    used.add(n);
    return n;
  };
  const elements = enabledElements().map((e) => e.id);
  const human = (h, team, extra = {}) => ({ id: h.id, name: h.name, element: h.element, team, isBot: false, hat: h.hat ?? null, ...extra });
  const maps = mapsFor(mode);
  const map = mapId && mapId !== RANDOM && maps.includes(mapId) ? mapId : pick(maps);
  const setup = { online: true, mode: 'times', mapId: map, difficulty: 'normal', seed: Math.floor(rand() * 2 ** 31), players: [] };
  let id = 10;   // bots começam no 10 (os jogadores são 1 e 2)

  if (mode === 'torre') {
    // Torre em dupla: os dois no mesmo time contra os bots do andar
    const floor = tower?.floor ?? 0;
    const { bots, lives, guardian } = floorFoes(floor);
    const brain = botBrain(floor);
    const others = elements.filter((e) => !humans.some((h) => h.element === e));
    const enemy = pick(others.length ? others : elements);
    for (const h of humans) {
      const c = tower?.carry?.[h.id];
      setup.players.push(human(h, 'A', { lives: c?.lives ?? TOWER.startLives, maxLives: TOWER.maxLives, damage: c?.damage ?? 0 }));
    }
    if (guardian) {
      const g = guardianOf(floor);
      setup.players.push({ id: id++, name: g.name, element: enemy, team: 'B', isBot: true, brain, lives, size: g.size, power: g.power, guardian: true, hat: 'guardiao' });
    } else {
      const base = TOWER_NAMES[Math.min(floorStep(floor).step, TOWER_NAMES.length - 1)];
      for (let i = 0; i < bots; i++) setup.players.push({ id: id++, name: bots > 1 ? `${base} ${i + 1}` : base, element: enemy, team: 'B', isBot: true, brain, lives });
    }
    setup.mapId = 'torre';
    setup.tower = {
      floor, timeLimit: TOWER.timeLimit, maxLives: TOWER.maxLives, gravity: gravityFor(floor),
      climb: floor > 0 ? 2.6 : 0, climbInfo: tower?.climbInfo ?? null, celebrate: guardian, endDelay: guardian ? undefined : 0.9,
    };
    setup.onlineMode = 'torre';
    return setup;
  }

  if (mode === 'ffa') {
    // cada um por si: os dois jogadores e bots até dar 5
    setup.mode = 'ffa';
    humans.forEach((h, i) => setup.players.push(human(h, `P${i + 1}`)));
    const free = elements.filter((e) => !humans.some((h) => h.element === e));
    while (setup.players.length < 5) {
      const el = free.length ? free.shift() : pick(elements);
      setup.players.push({ id, name: botName(el), element: el, team: `P${id}`, isBot: true });
      id++;
    }
    setup.onlineMode = 'ffa';
    return setup;
  }

  // times: o dono da sala no time A e o convidado no B; bots do mesmo
  // elemento completam cada time
  const size = ONLINE_MODES[mode]?.size ?? 1;
  if (mode === 'rei') setup.mode = 'rei';
  const [a, b] = humans;
  setup.players.push(human(a, 'A'));
  for (let i = 1; i < size; i++) setup.players.push({ id: id++, name: botName(a.element), element: a.element, team: 'A', isBot: true });
  if (b) {
    setup.players.push(human(b, 'B'));
    for (let i = 1; i < size; i++) setup.players.push({ id: id++, name: botName(b.element), element: b.element, team: 'B', isBot: true });
  }
  setup.onlineMode = mode;
  return setup;
}

export const onlineModeName = (mode) => ONLINE_MODES[mode]?.name ?? mode;
export const elementName = (id) => ELEMENTS[id]?.name ?? id;

// ------------------------------------------------------------ previsão local
//
// O navegador tem a sua própria cópia da partida e move o SEU boneco na hora
// em que você aperta (sem esperar o servidor). Cada passo (1/60 s) o comando
// vai numerado para o servidor; o servidor responde, junto com o estado, até
// que número ele já usou ("ack"). Quando chega um estado do servidor:
//   1. a cópia vira exatamente o estado do servidor (ele é o juiz);
//   2. os comandos que o servidor ainda não usou são aplicados de novo.
// Assim o seu boneco fica sempre na frente, e se o servidor discordar (ex.:
// você levou um golpe), a cópia se corrige sozinha.
// Os outros jogadores e os bots continuam com o último comando que tinham.


export class Predictor {
  constructor(game, localId) {
    this.game = game;
    this.localId = localId;
    this.seq = 0;
    this.history = [];   // [{ q, input }] comandos que o servidor ainda não usou
    this.maxHistory = 120;
  }

  inputsFor(input) {
    const inputs = {};
    for (const p of this.game.players) inputs[p.id] = p.id === this.localId ? input : (p.prevInput ?? EMPTY_INPUT);
    return inputs;
  }

  // Um passo local: devolve o número do comando (para mandar ao servidor)
  step(input) {
    const q = ++this.seq;
    this.history.push({ q, input });
    if (this.history.length > this.maxHistory) this.history.shift();
    this.game.step(this.inputsFor(input));
    return q;
  }

  // Chegou o estado do servidor (`ack` = último comando meu que ele usou)
  reconcile(snap, ack) {
    applySnapshot(this.game, snap);
    if (ack != null) this.history = this.history.filter((h) => h.q > ack);
    for (const h of this.history) this.game.step(this.inputsFor(h.input));
    // os eventos refeitos aqui já vieram (ou virão) do servidor
    this.game.drainEvents();
  }
}
