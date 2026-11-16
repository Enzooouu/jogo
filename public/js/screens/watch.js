// Modo "Assistir" (só administrador): dois bots lutando, sem ninguém jogar.
// Feito para gravar vídeos de "quem vai vencer?". Aqui fica só o painel de
// escolha e a montagem da partida; quem roda é o MatchRunner de sempre.

import { ELEMENTS, enabledElements } from '/shared/elements.js';
import { getMap } from '/shared/maps.js';
import { mapIdsFor, pickRandomMap } from './maps.js';

const $ = (sel) => document.querySelector(sel);
const KEY = 'brawl.assistir';
const RANDOM = 'aleatorio';

const ELEMENT_COLORS = { fogo: '#ff8a3d', agua: '#5ab4ff', terra: '#c9a06a', ar: '#9ff0df', mortal: '#d7d2e6' };
export const elementColor = (id) => ELEMENT_COLORS[id] ?? '#ffffff';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null') ?? {};
  } catch {
    return {};
  }
}

function save(v) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    // sem armazenamento
  }
}

function fill(select, options, value) {
  select.innerHTML = '';
  for (const [v, label] of options) {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = label;
    select.appendChild(o);
  }
  if (value && options.some(([v]) => v === value)) select.value = value;
}

// escolhas -> setup do MatchRunner (sem jogador local)
export function buildWatchSetup({ a, b, map, difficulty, lives }) {
  const pickEl = (v) => {
    const ids = enabledElements().map((e) => e.id);
    return v === RANDOM || !ELEMENTS[v] ? ids[Math.floor(Math.random() * ids.length)] : v;
  };
  const ea = pickEl(a);
  let eb = pickEl(b);
  if (b === RANDOM && a === RANDOM && eb === ea) eb = pickEl(RANDOM);
  const na = ELEMENTS[ea].name;
  const nb = ea === eb ? `${ELEMENTS[eb].name} 2` : ELEMENTS[eb].name;
  const ids = mapIdsFor('times');
  return {
    watch: true,
    mode: 'times',
    difficulty,
    lives,
    localPlayerId: null,
    seed: (Math.random() * 2 ** 31) | 0,
    mapId: map !== RANDOM && ids.includes(map) ? map : pickRandomMap(Math.random, ids),
    players: [
      { id: 1, name: ea === eb ? `${na} 1` : na, element: ea, team: 'A', isBot: true, lives },
      { id: 2, name: nb, element: eb, team: 'B', isBot: true, lives },
    ],
  };
}

export class WatchPanel {
  constructor({ onStart, canRecord = false }) {
    this.onStart = onStart;
    this.canRecord = canRecord;
    $('#w-go').addEventListener('click', () => this.start());
  }

  open() {
    const v = load();
    const els = [[RANDOM, 'Aleatório'], ...enabledElements().map((e) => [e.id, e.name])];
    fill($('#w-a'), els, v.a ?? 'fogo');
    fill($('#w-b'), els, v.b ?? 'agua');
    fill($('#w-map'), [[RANDOM, 'Aleatório'], ...mapIdsFor('times').map((id) => [id, getMap(id).name])], v.map ?? RANDOM);
    if (v.difficulty) $('#w-diff').value = v.difficulty;
    if (v.lives) $('#w-lives').value = String(v.lives);
    if (v.banner != null) $('#w-banner').value = v.banner ? '1' : '0';
    if (v.format) $('#w-format').value = v.format;
    $('#w-intro').value = v.intro ?? 'Quem vai ganhar?';
    if (v.record != null) $('#w-record').value = v.record ? '1' : '0';
    $('#w-record-box').hidden = !this.canRecord;
    $('#w-sync-box').hidden = !this.canRecord;
    if (v.sync != null) $('#w-sync').value = String(v.sync);
  }

  choices() {
    return {
      a: $('#w-a').value,
      b: $('#w-b').value,
      map: $('#w-map').value,
      difficulty: $('#w-diff').value,
      lives: Number($('#w-lives').value) || 3,
      banner: $('#w-banner').value === '1',
      format: $('#w-format').value,
      intro: $('#w-intro').value.trim().slice(0, 40),
      record: this.canRecord && $('#w-record').value === '1',
      sync: Number($('#w-sync').value) || 0,
    };
  }

  start() {
    const c = this.choices();
    save(c);
    this.last = c;
    this.onStart(c);
  }
}
