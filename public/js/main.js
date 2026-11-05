// Ponto de entrada do navegador: troca de telas e o caminho
// início -> modo -> carta do elemento -> versus -> partida -> resultado.

import { ELEMENTS, HAZARDS, HAZARD_REACTION } from '/shared/elements.js';
import { WEAPONS, weaponProfile } from '/shared/weapons.js';
import { MAPS, getMap } from '/shared/maps.js';
import { HILL } from '/shared/hill.js';
import { MatchRunner } from './match.js';
import { unlockAudio, toggleMute, isMuted } from './audio.js';
import { Renderer, TEAM_COLORS, drawCrown } from './render/renderer.js';
import { drawPortrait, fitCanvas } from './render/portrait.js';
import { buildLocalSetup, outcomeFor } from './setup.js';
import { api } from './api.js';
import { renderAccountBox, initAuthScreen, setAuthMode, focusAuth, loadProfile } from './screens/account.js';
import { DemoArena } from './screens/demo.js';
import { initHomeMenu } from './screens/home-menu.js';
import { MapPicker, RANDOM_MAP, pickRandomMap } from './screens/maps.js';
import { initControls } from './screens/controls.js';
import { TutorialScreen } from './screens/tutorial.js';
import { currentBindings, actionOf } from './input/bindings.js';
import { watchGamepad } from './input/gamepad.js';
import { TouchControls, isTouchDevice } from './input/touch.js';
import { VersusScreen } from './screens/versus.js';

const $ = (sel) => document.querySelector(sel);
const DEBUG = new URLSearchParams(location.search).has('debug');

const state = {
  screen: null,
  element: loadPref('elemento', 'fogo'),
  teamSize: Number(loadPref('tamanho', '2')) || 2,
  mode: 'times',
  difficulty: loadPref('dificuldade', 'normal'),
  mapChoice: loadPref('mapa', RANDOM_MAP), // id do mapa ou 'aleatorio'
  demo: loadPref('demo', '1') === '1',
  admin: loadPref('adm', '0') === '1', // modo ADM (testes): golpes dão 999%
  runner: null,
  pendingSetup: null,  // times montados na tela Versus
  lastSetup: null,
  user: null,
  offline: false,      // sem servidor: só modo convidado
  matchTicket: null,   // promessa com o id da partida no servidor (se logado)
};

const demo = new DemoArena($('#menu-bg'));
const controls = initControls($('#controls-panel'));
const versus = new VersusScreen($('#versus-canvas'));
let homeMenu = null;
// tela de mapas: ao continuar, guarda a escolha e vai para o versus
const mapPicker = new MapPicker($('#screen-maps'), {
  onContinue(id) {
    state.mapChoice = id;
    savePref('mapa', id);
    goVersus();
  },
});

// ------------------------------------------------------------ telas

const SCREENS = ['home', 'mode', 'cards', 'maps', 'versus', 'game', 'tutorial', 'result', 'auth', 'profile'];
const WITH_DEMO = new Set(['home', 'mode', 'cards', 'auth', 'profile', 'result']);

export function show(name) {
  for (const s of SCREENS) $(`#screen-${s}`).hidden = s !== name;
  if (name !== 'tutorial' && tutorial?.active) tutorial.stop();
  state.screen = name;
  demo.setHome(name === 'home');
  $('#menu-bg').classList.toggle('home-lit', name === 'home');
  if (name === 'home') requestAnimationFrame(() => homeMenu?.refresh());
  if (WITH_DEMO.has(name) && state.demo) demo.start();
  else demo.stop();
  if (name !== 'versus') versus.stop();
  if (name === 'cards') startCardAnimation();
  else stopCardAnimation();
  if (name === 'mode') drawModeTiles();
  if (name === 'maps') mapPicker.open(state.mapChoice);
  else mapPicker.stop();
  if (name !== 'game') $('#training-hud').hidden = true;
  closePanels();
  // jogando com o controle: já deixa a opção principal da tela escolhida
  if (document.body.classList.contains('pad-nav') && name !== 'game' && name !== 'tutorial') {
    setTimeout(() => {
      const list = padTargets(padRoot());
      if (list.length && !list.includes(document.activeElement)) padFocus(padDefault(list));
    }, 60);
  }
}

document.addEventListener('click', (e) => {
  const go = e.target.closest('[data-go]');
  if (go) show(go.dataset.go);
  const back = e.target.closest('[data-back]');
  if (back) show(back.dataset.back);
  if (e.target.closest('[data-close]')) closePanels();
});

// ------------------------------------------------------------ conta

function setUser(user) {
  state.user = user;
  renderAccountBox(user, {
    onLogin: () => openAuth('login'),
    onRegister: () => openAuth('register'),
    onProfile: openProfile,
    onLogout: async () => {
      try {
        await api.logout();
      } finally {
        setUser(null);
      }
    },
  });
  if (state.offline) setOfflineMode();
  homeMenu?.refresh();
}

function setOfflineMode() {
  state.offline = true;
  $('#welcome-login').hidden = true;
  $('#account-box').hidden = true;
  $('#home-profile').hidden = true;
  $('#save-hint').textContent = 'Versão sem servidor: dá para jogar, mas contas e estatísticas ficam desligadas.';
}

function openAuth(mode) {
  setAuthMode(mode);
  show('auth');
  focusAuth();
}

async function openProfile() {
  if (!state.user) {
    openAuth('login');
    return;
  }
  show('profile');
  const ok = await loadProfile();
  if (!ok) {
    // Sessão expirou: volta para o login
    const { user } = await api.me().catch(() => ({ user: null }));
    if (!user) {
      setUser(null);
      openAuth('login');
    }
  }
}

// ------------------------------------------------------------ início

function closePanels() {
  for (const p of document.querySelectorAll('.side-panel')) p.hidden = true;
  $('#panel-backdrop').hidden = true;
}

function togglePanel(id) {
  const panel = $(id);
  const open = panel.hidden;
  closePanels();
  panel.hidden = !open;
  $('#panel-backdrop').hidden = panel.hidden;
  if (id === '#controls-panel') controls.refresh();
  if (id === '#settings-panel') {
    $('#opt-sound').checked = !isMuted();
    $('#opt-demo').checked = state.demo;
    $('#opt-admin').checked = state.admin;
  }
}

// ------------------------------------------------------------ passo 1: modo

function drawModeTiles() {
  requestAnimationFrame(() => {
    for (const tile of document.querySelectorAll('.mode-tile')) {
      const { ctx, w, h } = fitCanvas(tile.querySelector('canvas'));
      if (tile.dataset.mode === 'treino') {
        const s = Math.min(1.5, h / 95);
        drawPortrait(ctx, state.element === RANDOM_ELEMENT ? 'fogo' : state.element, w * 0.32, h - 12, s, { facing: 1 });
        drawPortrait(ctx, 'mortal', w * 0.68, h - 12, s, { facing: -1, extra: { skin: 'espantalho' } });
        continue;
      }
      if (tile.dataset.mode === 'rei') {
        // dois times disputando a área com a coroa
        const s = Math.min(1.5, h / 95) * 0.82;
        const glow = ctx.createRadialGradient(w / 2, h - 12, 2, w / 2, h - 12, w * 0.28);
        glow.addColorStop(0, 'rgba(255,224,138,0.7)');
        glow.addColorStop(1, 'rgba(255,224,138,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);
        drawPortrait(ctx, 'fogo', w * 0.2, h - 12, s, { facing: 1 });
        drawPortrait(ctx, 'fogo', w * 0.33, h - 12, s, { facing: 1 });
        drawPortrait(ctx, 'agua', w * 0.67, h - 12, s, { facing: -1 });
        drawPortrait(ctx, 'agua', w * 0.8, h - 12, s, { facing: -1 });
        drawCrown(ctx, w / 2, h * 0.36, Math.min(1.5, h / 75), '#ffd25a');
        continue;
      }
      const ffa = tile.dataset.mode === 'ffa';
      const n = ffa ? 2 : Number(tile.dataset.size);
      const scale = Math.min(1.5, h / 95) * (n === 3 ? 0.78 : n === 2 ? 0.9 : 1);
      const gap = scale * 26;
      const foot = h - 12;
      if (ffa) {
        ['fogo', 'agua', 'mortal', 'terra', 'ar'].forEach((el, i) => {
          drawPortrait(ctx, el, w * (0.13 + i * 0.185), foot, scale * 0.82, { facing: i < 2 ? 1 : i === 2 ? 1 : -1 });
        });
        continue;
      }
      // Cada time agrupado de um lado, com espaço no meio para o "VS"
      for (let i = 0; i < n; i++) {
        const offset = (i - (n - 1) / 2) * gap;
        drawPortrait(ctx, 'fogo', w * 0.25 + offset, foot, scale, { facing: 1 });
        drawPortrait(ctx, 'agua', w * 0.75 + offset, foot, scale, { facing: -1 });
      }
      ctx.font = `italic 900 ${Math.round(h * 0.16)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText('VS', w / 2, h * 0.6);
    }
  });
}

function chooseMode(teamSize, mode = 'times') {
  state.teamSize = teamSize;
  state.mode = mode;
  if (mode === 'times') savePref('tamanho', String(teamSize));
  show('cards');
  $('#cards-mode').textContent = mode === 'ffa'
    ? 'Todos contra todos · cada jogador tem um elemento diferente'
    : mode === 'treino'
      ? 'Treino livre · teste golpes e combos num boneco parado'
      : mode === 'rei'
        ? `Rei da Ilha ${teamSize} × ${teamSize} · fique na área brilhante: ${HILL.target} pontos vence`
      : `Modo ${teamSize} × ${teamSize} · o time inteiro usa o elemento da carta`;
  $(`.el-card[data-element="${state.element}"]`)?.focus();
}

// ------------------------------------------------------------ passo 2: cartas

// carta "?": sorteia o elemento na hora da partida
const RANDOM_ELEMENT = 'aleatorio';
const WEAPON_EFFECT = {
  fogo: 'Armas queimam o alvo',
  agua: 'Armas deixam o alvo lento',
  terra: 'Armas atordoam o alvo',
  ar: 'Tornado puxa os inimigos',
  mortal: 'Bate 40% mais forte',
};

// nível de 1 a 5 de cada atributo (3 = normal)
function statLevel(v, step) {
  return Math.max(1, Math.min(5, Math.round(3 + (v - 1) / step)));
}

function buildCards() {
  const list = $('#card-list');
  list.innerHTML = '';
  const make = (id, name, color, light, dark) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'el-card';
    card.dataset.element = id;
    card.style.setProperty('--c1', color);
    card.style.setProperty('--c2', dark);
    card.style.setProperty('--c3', light);
    card.innerHTML = `<i class="sel">SELECIONADO</i><div class="stage"><canvas aria-hidden="true"></canvas></div>
      <div class="info"><span class="n"></span><span class="tl"></span><div class="bars"></div><ul class="perks"></ul></div>`;
    card.querySelector('.n').textContent = name;
    card.addEventListener('click', () => selectElement(id));
    card.addEventListener('dblclick', () => show('maps'));
    list.appendChild(card);
    return card;
  };
  // carta aleatória primeiro
  const rnd = make(RANDOM_ELEMENT, 'ALEATÓRIO', '#c77dff', '#ffffff', '#3a1e5c');
  rnd.classList.add('random');
  rnd.querySelector('.tl').textContent = 'Sorteia um elemento a cada partida';
  rnd.querySelector('.bars').innerHTML = '<p class="rnd-note">Fogo, Água, Terra, Ar ou Mortal: você só descobre na hora da luta.</p>';
  for (const el of Object.values(ELEMENTS)) {
    if (!el.enabled) continue;
    const card = make(el.id, el.name.toUpperCase(), el.color, el.light, el.dark);
    card.querySelector('.tl').textContent = el.description.split('.')[0] + '.';
    const st = { speed: 1, jump: 1, weight: 1, damage: 1, ...el.stats };
    const bars = card.querySelector('.bars');
    for (const [label, level] of [
      ['Velocidade', statLevel(st.speed, 0.07)], ['Pulo', statLevel(st.jump, 0.07)],
      ['Peso', statLevel(st.weight, 0.06)], ['Força', statLevel(st.damage, 0.18)],
    ]) {
      const row = document.createElement('div');
      row.className = 'bar';
      row.innerHTML = `<span></span><b>${'<i></i>'.repeat(5)}</b>`;
      row.querySelector('span').textContent = label;
      row.querySelectorAll('i').forEach((seg, k) => seg.classList.toggle('on', k < level));
      bars.appendChild(row);
    }
    const reactions = HAZARD_REACTION[el.id] ?? {};
    const names = (kind) => Object.keys(reactions).filter((h) => reactions[h] === kind).map((h) => HAZARDS[h].name).join(', ');
    const perks = card.querySelector('.perks');
    for (const [cls, text] of [['good', names('imune') && `Imune: ${names('imune')}`], ['bad', names('morre') && `Morre: ${names('morre')}`], ['mid', names('dano') && `Machuca: ${names('dano')}`], ['fx', WEAPON_EFFECT[el.id]]]) {
      if (!text) continue;
      const li = document.createElement('li');
      li.className = cls;
      li.textContent = text;
      perks.appendChild(li);
    }
  }
  const start = state.element === RANDOM_ELEMENT || ELEMENTS[state.element]?.enabled ? state.element : 'fogo';
  selectElement(start);
  // ← → trocam a carta, Enter continua
  window.addEventListener('keydown', (e) => {
    if (state.screen !== 'cards') return;
    const cards = [...document.querySelectorAll('.el-card')];
    const i = cards.findIndex((c) => c.dataset.element === state.element);
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
      e.preventDefault();
      const next = cards[(i + (e.code === 'ArrowRight' ? 1 : -1) + cards.length) % cards.length];
      selectElement(next.dataset.element);
      next.focus({ preventScroll: true });
    } else if (e.code === 'Enter' && !(e.target instanceof HTMLButtonElement && !e.target.classList.contains('el-card'))) {
      e.preventDefault();
      cardsNext();
    }
  });
}

// depois da carta: escolher o mapa (o treino livre tem o mapa dele)
function cardsNext() {
  if (state.mode === 'treino') startMatch(newSetup());
  else show('maps');
}

function selectElement(id) {
  state.element = id;
  savePref('elemento', id);
  for (const card of document.querySelectorAll('.el-card')) card.classList.toggle('on', card.dataset.element === id);
}

let cardFrame = null;
function startCardAnimation() {
  if (cardFrame) return;
  const t0 = performance.now();
  const order = ['fogo', 'agua', 'terra', 'ar', 'mortal'];
  const loop = (now) => {
    const t = (now - t0) / 1000 + 1;
    for (const card of document.querySelectorAll('.el-card')) {
      const { ctx, w, h } = fitCanvas(card.querySelector('canvas'));
      const on = card.classList.contains('on');
      const id = card.dataset.element;
      // brilho redondo embaixo do lutador (pedestal)
      const glow = ctx.createRadialGradient(w / 2, h - 14, 4, w / 2, h - 14, w * 0.5);
      glow.addColorStop(0, on ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(w / 2, h - 12, w * 0.42, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      if (id === RANDOM_ELEMENT) {
        // silhueta trocando de elemento por trás do "?"
        const el = order[Math.floor(t * (on ? 3 : 1)) % order.length];
        ctx.save();
        ctx.globalAlpha = 0.3;
        drawPortrait(ctx, el, w / 2, h - 10, Math.min(1.85, h / 94), { time: t });
        ctx.restore();
        const s = Math.min(w, h);
        ctx.font = `italic 900 ${Math.round(s * 0.62)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const bob = Math.sin(t * 2.5) * 4;
        ctx.lineWidth = 8;
        ctx.strokeStyle = 'rgba(20,8,40,0.7)';
        ctx.strokeText('?', w / 2, h * 0.48 + bob);
        const g = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.75);
        g.addColorStop(0, '#ffd25a');
        g.addColorStop(0.5, '#ff6a1f');
        g.addColorStop(1, '#c77dff');
        ctx.fillStyle = g;
        ctx.fillText('?', w / 2, h * 0.48 + bob);
        continue;
      }
      const weapon = { fogo: 'espada', agua: 'cajado', terra: 'espada', ar: 'cajado', mortal: 'lanca' }[id];
      drawPortrait(ctx, id, w / 2, h - 10, Math.min(1.85, h / 94), {
        time: on ? t : 0,
        extra: weapon ? { weapon: { id: weapon } } : {},
      });
    }
    cardFrame = requestAnimationFrame(loop);
  };
  cardFrame = requestAnimationFrame(loop);
}

function stopCardAnimation() {
  if (cardFrame) cancelAnimationFrame(cardFrame);
  cardFrame = null;
}

// ------------------------------------------------------------ passo 3: versus

function goVersus() {
  const setup = newSetup();
  state.pendingSetup = setup;
  const me = setup.players.find((p) => p.id === setup.localPlayerId);
  const mine = setup.players.filter((p) => p.team === me.team);
  const theirs = setup.players.filter((p) => p.team !== me.team);
  const a = ELEMENTS[mine[0].element];
  const b = ELEMENTS[theirs[0].element];
  const ffa = setup.mode === 'ffa';

  const title = $('#vs-title');
  title.innerHTML = '<span class="a"></span> × <span class="b"></span>';
  title.querySelector('.a').textContent = a.name.toUpperCase();
  title.querySelector('.a').style.color = a.light;
  title.querySelector('.b').textContent = ffa ? 'TODOS' : b.name.toUpperCase();
  title.querySelector('.b').style.color = ffa ? '#e9d8ff' : b.light;

  fillSide($('#vs-left'), ffa ? 'VOCÊ' : 'SEU TIME', a, mine, me.id);
  if (ffa) fillRivals($('#vs-right'), theirs);
  else fillSide($('#vs-right'), 'ADVERSÁRIO', b, theirs, me.id);
  setChips('#diff-seg', state.difficulty);
  $('#vs-map-name').textContent = `${getMap(setup.mapId).name}${state.mapChoice === RANDOM_MAP ? ' (sorteado)' : ''}`;
  show('versus');
  versus.start(setup);
  $('#play-btn').focus();
}

function fillSide(box, tag, el, members, myId) {
  const reactions = HAZARD_REACTION[el.id] ?? {};
  const names = (kind) => Object.keys(reactions).filter((h) => reactions[h] === kind).map((h) => HAZARDS[h].name).join(', ');
  const imune = names('imune');
  const morre = names('morre');
  box.innerHTML = '<span class="tag"></span><h2></h2><ul></ul><div class="names"></div>';
  const tagEl = box.querySelector('.tag');
  tagEl.textContent = tag;
  tagEl.style.background = tag === 'SEU TIME' ? el.color : 'rgba(255,255,255,.14)';
  tagEl.style.color = tag === 'SEU TIME' ? '#140600' : el.light;
  const h2 = box.querySelector('h2');
  h2.textContent = el.name.toUpperCase();
  h2.style.color = el.light;
  const ul = box.querySelector('ul');
  const effect = {
    fogo: 'Armas queimam o alvo',
    agua: 'Armas deixam o alvo lento',
    terra: 'Armas atordoam o alvo',
    ar: 'Tornado puxa os inimigos',
    mortal: 'Bate 40% mais forte (armas sem efeito)',
  }[el.id];
  for (const line of [imune && `Imune: ${imune}`, morre && `Morre: ${morre}`, effect]) {
    if (!line) continue;
    const li = document.createElement('li');
    li.textContent = line;
    ul.appendChild(li);
  }
  box.querySelector('.names').textContent = members.map((p) => (p.id === myId ? `${p.name} (você)` : p.name)).join(' · ');
}

// Todos contra todos: lista os 3 rivais, cada um com seu elemento
function fillRivals(box, rivals) {
  box.innerHTML = '<span class="tag">ADVERSÁRIOS</span><h2>TODOS</h2><ul></ul>';
  const tagEl = box.querySelector('.tag');
  tagEl.style.background = 'rgba(255,255,255,.14)';
  tagEl.style.color = '#e9d8ff';
  box.querySelector('h2').style.color = '#e9d8ff';
  const ul = box.querySelector('ul');
  for (const p of rivals) {
    const li = document.createElement('li');
    li.textContent = `${p.name} · ${ELEMENTS[p.element].name}`;
    li.style.color = ELEMENTS[p.element].light;
    ul.appendChild(li);
  }
}

function setChips(selector, value) {
  for (const b of $(selector).querySelectorAll('button')) b.classList.toggle('on', b.dataset.value === value);
}

// ------------------------------------------------------------ partida

function playerName() {
  return state.user?.username ?? 'Jogador';
}

function newSetup() {
  // escolha "?" (aleatório): sorteia o elemento e o mapa a cada partida
  const enabled = Object.values(ELEMENTS).filter((e) => e.enabled).map((e) => e.id);
  const element = state.element === RANDOM_ELEMENT ? enabled[Math.floor(Math.random() * enabled.length)] : state.element;
  const setup = buildLocalSetup({
    element,
    name: playerName(),
    teamSize: state.teamSize,
    mode: state.mode,
    difficulty: state.difficulty,
    admin: state.admin,
  });
  setup.mapId = state.mapChoice === RANDOM_MAP ? pickRandomMap() : MAPS[state.mapChoice] ? state.mapChoice : 'caldeira';
  if (state.mode === 'treino') {
    // você contra um espantalho preso ao chão (dá para virar boneco solto)
    setup.mode = 'times';
    setup.practice = true;
    setup.mapId = 'treino-livre';
    setup.players = [
      { id: 1, name: playerName(), element, team: 'A', isBot: false, admin: state.admin },
      { id: 2, name: 'Espantalho', element: 'mortal', skin: 'espantalho', team: 'B', isBot: false, dummy: true, anchored: true },
    ];
  }
  return setup;
}

async function startMatch(setup) {
  state.lastSetup = setup;
  unlockAudio();
  goFullscreen();
  // Tira o foco do botão clicado para Enter/Espaço não "clicarem" nele durante a luta.
  document.activeElement?.blur?.();
  show('game');
  $('#pause-overlay').hidden = true;
  state.runner?.stop();
  const runner = new MatchRunner({
    canvas: $('#game-canvas'),
    setup,
    debug: DEBUG,
    onEnd: (result) => endMatch(setup, result),
  });
  state.runner = runner;
  runner.start();
  $('#quit-btn').textContent = 'Desistir';
  $('#quit-hint').textContent = 'Desistir conta como derrota.';
  if (setup.practice) {
    startTraining(runner);
    if (DEBUG) window.__brawl = { runner, state, training };
    return;
  }

  // Avisa o servidor que a partida começou (só para quem está logado).
  const teamSize = setup.mode === 'ffa'
    ? setup.players.length / 2
    : setup.players.filter((p) => p.team === setup.players[0].team).length;
  // Partida no modo ADM não conta nas estatísticas.
  const admin = setup.players.some((p) => p.admin);
  state.matchTicket = state.user && !admin
    ? api.startMatch({ mode: setup.mode, element: setup.players[0].element, teamSize }).catch((err) => ({ error: err }))
    : null;
  if (DEBUG) window.__brawl = { runner, state };
}

function setPaused(paused) {
  const runner = state.runner;
  if (!runner || runner.game.phase === 'ended') return;
  runner.setPaused(paused);
  $('#pause-overlay').hidden = !paused;
  if (paused) $('#resume-btn').focus();
}

// ------------------------------------------------------------ treino livre

const TRAINING_WEAPONS = { Digit1: 'espada', Digit2: 'cajado', Digit3: 'lanca', Digit4: 'marretao' };
const COMBO_GAP = 1;  // segundos sem acertar que encerram o combo
let training = null;

function startTraining(runner) {
  const g = runner.game;
  // cada um reaparece onde começou
  for (const p of g.players) p.checkpoint = { x: p.x + p.w / 2, y: p.y + p.h };
  training = { runner, combo: 0, comboDmg: 0, best: 0, total: 0, last: null, lastHitAt: -9 };
  $('#training-hud').hidden = false;
  $('#quit-btn').textContent = 'Sair do treino';
  $('#quit-hint').textContent = 'O treino não conta nas estatísticas.';
  updateTrainingHud();
  updateDummyButton();
  runner.onEvents = (events) => {
    for (const e of events) {
      if (e.type !== 'hit' || e.target !== 2) continue;
      const t = g.time;
      if (t - training.lastHitAt > COMBO_GAP) {
        training.combo = 0;
        training.comboDmg = 0;
      }
      training.lastHitAt = t;
      training.combo++;
      training.comboDmg += e.damage;
      training.total += e.damage;
      training.best = Math.max(training.best, training.combo);
      training.last = { damage: e.damage, weapon: e.weapon };
      updateTrainingHud(true);
    }
  };
  const tick = () => {
    if (state.runner !== runner) return;
    updateTrainingHud();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function weaponLabel(id) {
  return WEAPONS[id]?.name ?? 'Soco';
}

function updateTrainingHud(pop = false) {
  if (!training) return;
  const g = training.runner.game;
  const dummy = g.playerById(2);
  // o combo fica apagado depois de um tempo sem acertar (o próximo golpe começa outro)
  const combo = $('#th-combo');
  combo.parentElement.classList.toggle('old', g.time - training.lastHitAt > COMBO_GAP);
  combo.textContent = training.combo;
  if (pop) {
    combo.classList.remove('pop');
    void combo.offsetWidth;
    combo.classList.add('pop');
  }
  const last = training.last;
  $('#th-last').textContent = last ? `${Math.round(last.damage)} · ${weaponLabel(last.weapon)}` : '—';
  $('#th-combo-dmg').textContent = Math.round(training.comboDmg);
  $('#th-best').textContent = training.best;
  $('#th-total').textContent = Math.round(training.total);
  $('#th-dummy').textContent = `${Math.round(dummy?.damage ?? 0)}%`;
}

// troca entre o espantalho preso ao chão e o boneco solto (que voa longe)
function toggleDummy() {
  const d = training?.runner.game.playerById(2);
  if (!d) return;
  d.anchored = !d.anchored;
  d.skin = d.anchored ? 'espantalho' : 'boneco';
  d.name = d.anchored ? 'Espantalho' : 'Boneco';
  d.sway = 0;
  d.swayV = 0;
  resetDummy();
  updateDummyButton();
}

function updateDummyButton() {
  const d = training?.runner.game.playerById(2);
  $('#th-toggle').textContent = d?.anchored ? 'Virar boneco solto' : 'Virar espantalho';
  $('#th-dummy-label').textContent = d?.anchored ? 'Espantalho' : 'Boneco';
}

function resetDummy() {
  const g = training?.runner.game;
  const d = g?.playerById(2);
  if (!d) return;
  d.damage = 0;
  d.vx = 0;
  d.vy = 0;
  for (const k of Object.keys(d.status)) d.status[k] = null;
  if (d.state !== 'respawning' && d.state !== 'out') {
    d.x = d.checkpoint.x - d.w / 2;
    d.y = d.checkpoint.y - d.h;
  }
  training.combo = 0;
  training.comboDmg = 0;
  updateTrainingHud();
}

window.addEventListener('keydown', (e) => {
  if (state.screen !== 'game' || !training || state.runner !== training.runner || state.runner.paused) return;
  if (e.repeat || actionOf(currentBindings(), e.code)) return;
  if (e.code === 'KeyR') {
    e.preventDefault();
    resetDummy();
  } else if (e.code === 'KeyT') {
    e.preventDefault();
    toggleDummy();
  } else if (TRAINING_WEAPONS[e.code]) {
    e.preventDefault();
    const g = training.runner.game;
    const me = g.playerById(1);
    if (!me || me.state === 'respawning') return;
    g.spawnWeaponAt(TRAINING_WEAPONS[e.code], me.x + me.w / 2 + me.facing * 50, me.y - 40);
  }
});

function quitMatch() {
  const runner = state.runner;
  if (!runner) return;
  if (runner.game.practice) {
    runner.stop();
    state.runner = null;
    $('#pause-overlay').hidden = true;
    show('mode');
    return;
  }
  runner.game.forfeit(state.lastSetup.localPlayerId);
  // onEnd é chamado pelo próprio laço no próximo quadro
  runner.setPaused(false);
  $('#pause-overlay').hidden = true;
}

function endMatch(setup, result) {
  state.runner?.stop();
  state.runner = null;
  const outcome = showResult(setup, result);
  saveResult(setup, result, outcome);
}

async function saveResult(setup, result, outcome) {
  const note = $('#result-save');
  const ticket = state.matchTicket;
  state.matchTicket = null;
  if (setup.players.some((p) => p.admin)) {
    note.textContent = 'Modo ADM ligado: esta partida não conta nas estatísticas.';
    return;
  }
  if (!ticket) {
    note.textContent = 'Partida de convidado: entre na sua conta para salvar suas estatísticas.';
    return;
  }
  note.textContent = 'Salvando estatísticas...';
  const me = result.players.find((p) => p.id === setup.localPlayerId);
  try {
    const started = await ticket;
    if (started.error) throw started.error;
    await api.finishMatch(started.matchId, { result: outcome, kills: me.kills, deaths: me.deaths });
    note.innerHTML = '<span class="ok">✓ Estatísticas salvas na sua conta.</span> ';
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'btn ghost small';
    link.textContent = 'Ver perfil';
    link.addEventListener('click', openProfile);
    note.appendChild(link);
  } catch (err) {
    note.innerHTML = '';
    const span = document.createElement('span');
    span.className = 'error';
    span.textContent = `Não deu para salvar as estatísticas: ${err.message}`;
    note.appendChild(span);
  }
}

// ------------------------------------------------------------ resultado

function teamLabel(result, team) {
  if (result.mode === 'ffa') return '—';
  const teams = [...new Set(result.players.map((p) => p.team))];
  return Renderer.teamName(teams.indexOf(team));
}

// "Dourado 60 × 41 Violeta"
function hillLine(result) {
  const teams = [...new Set(result.players.map((p) => p.team))];
  return teams.map((t) => `${teamLabel(result, t).replace('Time ', '')} ${result.hillScores[t] ?? 0}`).join(' × ');
}

function teamColor(result, team) {
  const teams = [...new Set(result.players.map((p) => p.team))];
  return TEAM_COLORS[teams.indexOf(team) % TEAM_COLORS.length];
}

function showResult(setup, result) {
  const outcome = outcomeFor(result, setup.localPlayerId);
  const title = $('#result-title');
  title.textContent = { vitoria: 'VITÓRIA!', derrota: 'DERROTA', empate: 'EMPATE' }[outcome];
  title.className = `result-title ${{ vitoria: 'win', derrota: 'lose', empate: 'draw' }[outcome]}`;

  // Todos contra todos: não tem time, o vencedor é um jogador
  const ffa = result.mode === 'ffa';
  const champion = ffa && result.winnerTeam !== null ? result.players.find((p) => p.team === result.winnerTeam) : null;
  const championName = champion && (champion.id === setup.localPlayerId ? 'Você' : champion.name);
  const winner = result.winnerTeam !== null ? (ffa ? championName : teamLabel(result, result.winnerTeam)) : null;
  const subs = {
    eliminacao: winner ? (ffa ? `${winner} ficou por último de pé.` : `${winner} eliminou o adversário.`) : 'Todos caíram ao mesmo tempo.',
    tempo: result.hillScores
      ? (winner ? `Tempo esgotado — ${winner} tinha mais pontos (${hillLine(result)}).` : `Tempo esgotado e pontos empatados (${hillLine(result)}).`)
      : winner ? `Tempo esgotado — ${winner} tinha mais vidas.` : 'Tempo esgotado e tudo empatado.',
    pontos: result.hillScores ? `${winner} chegou a ${HILL.target} pontos na ilha (${hillLine(result)}).` : '',
    desistencia: 'Você desistiu da partida.',
  };
  $('#result-sub').textContent = subs[result.reason] ?? '';

  // cartões dos jogadores: vencedores primeiro, depois por kills
  const cards = $('#result-cards');
  cards.innerHTML = '';
  const teams = [...new Set(result.players.map((p) => p.team))];
  const won = (p) => result.winnerTeam !== null && p.team === result.winnerTeam;
  const sorted = [...result.players].sort((a, b) => won(b) - won(a) || teams.indexOf(a.team) - teams.indexOf(b.team) || b.kills - a.kills || a.deaths - b.deaths);
  const mvp = [...result.players].sort((a, b) => b.damageDealt - a.damageDealt)[0];
  sorted.forEach((p, i) => {
    const el = ELEMENTS[p.element];
    const card = document.createElement('div');
    card.className = 'pcard';
    if (won(p)) card.classList.add('winner');
    if (p.id === setup.localPlayerId) card.classList.add('me');
    card.style.setProperty('--team', teamColor(result, p.team));
    card.style.setProperty('--el', el.color);
    card.style.setProperty('--el-light', el.light ?? el.color);
    card.style.animationDelay = `${0.15 + i * 0.08}s`;
    const stat = (cls, value, label) => `<div class="pstat ${cls}${value === 0 ? ' zero' : ''}"><b>${value}</b><span>${label}</span></div>`;
    card.innerHTML = `
      <div class="pcard-head">
        <div class="pavatar"></div>
        <div class="pname-wrap"><span class="pname"></span><span class="pmeta"></span></div>
      </div>
      <div class="ptags"></div>
      <div class="pstats">
        ${stat('', p.kills, 'Kills')}${stat('', p.deaths, 'Mortes')}${stat('', p.hits ?? 0, 'Golpes')}
        ${stat('dealt', p.damageDealt, 'Dano feito')}${stat('taken', p.damageTaken, 'Dano levado')}${result.hillScores ? stat('', p.hillTime ?? 0, 'Seg. na ilha') : stat('', p.pickups ?? 0, 'Armas')}
      </div>`;
    card.querySelector('.pavatar').textContent = p.name.charAt(0).toUpperCase();
    card.querySelector('.pname').textContent = p.name;
    card.querySelector('.pmeta').textContent = ffa ? el.name : `${teamLabel(result, p.team)} · ${el.name}`;
    const tags = card.querySelector('.ptags');
    const addTag = (text, cls) => {
      const t = document.createElement('span');
      t.className = `ptag ${cls}`;
      t.textContent = text;
      tags.appendChild(t);
    };
    if (p.id === setup.localPlayerId) addTag('VOCÊ', 'you');
    if (won(p)) addTag(ffa ? 'CAMPEÃO' : 'VENCEDOR', 'win');
    if (p === mvp && p.damageDealt > 0) addTag('MVP', 'mvp');
    if (p.isBot) addTag('BOT', '');
    cards.appendChild(card);
  });
  // linha de cima: mapa e duração
  const mapName = getMap(setup.mapId ?? 'caldeira').name;
  $('#result-eyebrow').textContent = `FIM DE PARTIDA · ${mapName.toUpperCase()} · ${formatTime(result.duration)}`;
  $('#screen-result').classList.toggle('lose', outcome === 'derrota');
  $('#result-save').textContent = '';
  show('result');
  $('#again-btn').focus();
  return outcome;
}

function formatTime(sec) {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ------------------------------------------------------------ toque (celular)

const touch = new TouchControls($('#touch-controls'), {
  onPause: () => {
    if (state.screen === 'game') setPaused(true);
    else if (state.screen === 'tutorial') tutorial.setPaused(true);
  },
  onScores: (on) => {
    if (state.runner && state.screen === 'game') state.runner.renderer.showScores = on;
  },
});
let touchMode = isTouchDevice();
document.body.classList.toggle('has-touch', touchMode);
// encostou na tela: liga o modo toque (ex.: notebook com tela de toque)
window.addEventListener('touchstart', () => {
  if (touchMode) return;
  touchMode = true;
  document.body.classList.add('has-touch');
}, { passive: true });

// mostra os controles só durante a luta (sem pausa nem janela por cima)
let wasPortrait = false;
function syncTouch() {
  const inFight = state.screen === 'game' || state.screen === 'tutorial';
  document.body.classList.toggle('in-fight', inFight);
  const fighting = (state.screen === 'game' && state.runner && !state.runner.paused && state.runner.game.phase !== 'ended')
    || (state.screen === 'tutorial' && tutorial.running && !document.querySelector('.tut-overlay:not([hidden])'));
  const want = touchMode && Boolean(fighting);
  if (want !== !touch.root.hidden) touch.show(want);
  // no treino o botão de placar não serve
  touch.root.querySelector('.tc-scores').hidden = state.screen !== 'game' || Boolean(training && state.runner === training?.runner);
  // virou o celular de pé no meio da luta: pausa sozinho
  const portrait = touchMode && window.innerHeight > window.innerWidth;
  if (portrait && !wasPortrait && fighting) {
    if (state.screen === 'game') setPaused(true);
    else tutorial.setPaused(true);
  }
  wasPortrait = portrait;
  // o tutorial já tem o botão "Pausa" dele
  touch.root.querySelector('.tc-pause').hidden = state.screen === 'tutorial';
  requestAnimationFrame(syncTouch);
}
requestAnimationFrame(syncTouch);

// no celular a luta abre em tela cheia, deitada
function goFullscreen() {
  if (!touchMode || document.fullscreenElement) return;
  try {
    document.documentElement.requestFullscreen?.({ navigationUI: 'hide' })?.then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
  } catch {
    // sem tela cheia (ex.: dentro de outra página): segue normal
  }
}

// ------------------------------------------------------------ controle (gamepad)

// Nos menus o controle "aperta teclas": direções viram setas (as telas que
// usam ← → já tratam), A confirma, B volta (Esc). Se a tela não usar a
// seta, o foco anda para o botão mais perto naquela direção.
function fakeKey(code, key = code) {
  const e = new KeyboardEvent('keydown', { code, key, bubbles: true, cancelable: true });
  (document.activeElement && document.activeElement !== document.body ? document.activeElement : window).dispatchEvent(e);
  return e.defaultPrevented;
}

const FOCUSABLE = 'button, [href], input, select, [tabindex]:not([tabindex="-1"])';

// onde o controle navega agora: painel aberto, janela por cima ou a tela
function padRoot() {
  const visible = (el) => el && !el.hidden && el.offsetParent !== null;
  for (const sel of ['.side-panel:not([hidden])', '#welcome', '#pause-overlay', '.tut-overlay:not([hidden])']) {
    const el = $(sel);
    if (visible(el)) return el;
  }
  return $(`#screen-${state.screen}`);
}

function padTargets(root) {
  return [...root.querySelectorAll(FOCUSABLE)].filter((el) => {
    if (el.disabled || el.closest('[hidden]') || el.offsetParent === null) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  });
}

function padFocus(el) {
  el.focus({ preventScroll: false });
  el.scrollIntoView?.({ block: 'nearest' });
}

// opção principal de cada tela (onde o foco cai primeiro)
const PAD_DEFAULTS = ['.home-item.on', '.home-item', '.mode-tile[data-size="2"]', '.mode-tile', '.el-card.on', '.map-card.on',
  '#play-btn', '#again-btn', '#resume-btn', '.welcome-go', '.primary', '.btn:not(.ghost)'];
function padDefault(list) {
  for (const sel of PAD_DEFAULTS) {
    const el = list.find((e) => e.matches(sel));
    if (el) return el;
  }
  return list.find((e) => !e.matches('.back')) ?? list[0];
}

function padMove(dir) {
  const root = padRoot();
  const list = padTargets(root);
  if (!list.length) return;
  const cur = document.activeElement;
  if (!cur || !list.includes(cur)) {
    padFocus(padDefault(list));
    return;
  }
  const c = cur.getBoundingClientRect();
  const cx = c.left + c.width / 2;
  const cy = c.top + c.height / 2;
  const [vx, vy] = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[dir];
  let best = null;
  let bestScore = Infinity;
  for (const el of list) {
    if (el === cur) continue;
    const r = el.getBoundingClientRect();
    const dx = r.left + r.width / 2 - cx;
    const dy = r.top + r.height / 2 - cy;
    const along = dx * vx + dy * vy;
    if (along <= 4) continue;
    const side = Math.abs(dx * vy) + Math.abs(dy * vx);
    const score = along + side * 2.2;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  // nada naquela direção (ex.: botões lado a lado): vai para o próximo/anterior
  if (!best) {
    const i = list.indexOf(cur);
    best = list[i + (dir === 'down' || dir === 'right' ? 1 : -1)];
  }
  if (best) padFocus(best);
}

function padConfirm() {
  const cur = document.activeElement;
  const root = padRoot();
  const list = padTargets(root);
  if ((!cur || cur === document.body || !list.includes(cur)) && !['cards', 'maps', 'versus'].includes(state.screen) && list.length) {
    padFocus(padDefault(list));
    if (state.screen !== 'home') return;
    document.activeElement.click();
    return;
  }
  // nas telas de carta e mapa o A continua (igual ao Enter)
  const onCard = !cur || cur === document.body || cur.matches('.el-card, .map-card');
  if (state.screen === 'cards' && root.id === 'screen-cards' && onCard) {
    cardsNext();
    return;
  }
  if (state.screen === 'maps' && root.id === 'screen-maps' && onCard) {
    mapPicker.onContinue(mapPicker.current());
    return;
  }
  if (cur && cur !== document.body && root.contains(cur) && padTargets(root).includes(cur)) {
    cur.click();
    return;
  }
  if (state.screen === 'versus') {
    $('#play-btn').click();
    return;
  }
  if (!fakeKey('Enter')) padMove('down');
}


const TRAINING_CYCLE = ['espada', 'cajado', 'lanca', 'marretao'];
let trainingPick = 0;

function onPadButton(name) {
  document.body.classList.add('pad-nav');
  unlockAudio();
  const playing = state.screen === 'game' && state.runner && !state.runner.paused;
  if (playing) {
    const inTraining = training && state.runner === training.runner;
    if (name === 'start') setPaused(true);
    else if (name === 'select' && inTraining) {
      // treino: Select faz cair a próxima arma; L3 troca o alvo; R3 zera o alvo
      const me = state.runner.game.playerById(1);
      const w = TRAINING_CYCLE[trainingPick++ % TRAINING_CYCLE.length];
      if (me && me.state !== 'respawning') state.runner.game.spawnWeaponAt(w, me.x + me.w / 2 + me.facing * 50, me.y - 40);
    } else if (name === 'select') state.runner.renderer.showScores = true;
    else if (name === 'l3' && inTraining) toggleDummy();
    else if (name === 'r3' && inTraining) resetDummy();
    return;
  }
  // tutorial rodando (sem janela por cima): só o Start, que pausa
  const tutOverlay = document.querySelector('.tut-overlay:not([hidden])');
  if (state.screen === 'tutorial' && !tutOverlay) {
    if (name === 'start') tutorial.togglePause();
    return;
  }
  if (state.screen === 'game' && state.runner?.paused && (name === 'start' || name === 'b')) {
    setPaused(false);
    return;
  }
  if (state.screen === 'tutorial' && !$('#tut-pause').hidden && (name === 'start' || name === 'b')) {
    tutorial.togglePause();
    return;
  }
  if (['up', 'down', 'left', 'right'].includes(name)) {
    const code = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[name];
    // na luta pausada as setas iriam para o boneco: só anda o foco
    const inFight = state.screen === 'game' || state.screen === 'tutorial';
    if (inFight || !fakeKey(code)) padMove(name);
    else if (state.screen === 'maps') $('#screen-maps .map-card.on')?.focus({ preventScroll: true });
  } else if (name === 'a' || name === 'start') padConfirm();
  else if (name === 'b') fakeKey('Escape');
}

function onPadRelease(name) {
  if (name === 'select' && state.runner) state.runner.renderer.showScores = false;
}

let padToastTimer = null;
function onPadConnect(connected) {
  document.body.classList.toggle('has-pad', connected);
  const toast = $('#pad-toast');
  toast.textContent = connected ? '🎮 Controle conectado' : '🎮 Controle desconectado';
  toast.hidden = false;
  toast.classList.remove('out');
  clearTimeout(padToastTimer);
  padToastTimer = setTimeout(() => toast.classList.add('out'), 2200);
}

watchGamepad({ onButton: onPadButton, onRelease: onPadRelease, onConnect: onPadConnect });
// mexeu o mouse: tira o destaque de navegação pelo controle
window.addEventListener('mousemove', () => document.body.classList.remove('pad-nav'));

// ------------------------------------------------------------ teclado global

window.addEventListener('keydown', (e) => {
  const typing = e.target instanceof HTMLInputElement;
  const action = actionOf(currentBindings(), e.code);
  if (action === 'mute' && !typing && !e.repeat) {
    e.preventDefault();
    toggleMute();
  }
  // P também pausa, a não ser que o jogador tenha colocado P em alguma ação
  const pauseKey = e.code === 'Escape' || (e.code === 'KeyP' && !action);
  if (state.screen === 'tutorial' && pauseKey) {
    e.preventDefault();
    tutorial.togglePause();
    return;
  }
  if (state.screen === 'home' && e.code === 'Escape' && !$('#welcome').hidden) {
    closeWelcome();
    return;
  }
  if (state.screen === 'game' && pauseKey) {
    e.preventDefault();
    setPaused(!state.runner?.paused);
    return;
  }
  // Esc volta um passo nos menus
  if (e.code === 'Escape') {
    const back = { mode: 'home', cards: 'mode', maps: 'cards', versus: 'maps', auth: 'home', profile: 'home' }[state.screen];
    if (state.screen === 'home') closePanels();
    else if (back) show(back);
  }
});

// som também pode ficar num botão do mouse (só durante a partida)
window.addEventListener('mousedown', (e) => {
  if (state.screen !== 'game' || e.target.closest?.('button')) return;
  if (actionOf(currentBindings(), `Mouse${e.button}`) === 'mute') toggleMute();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.screen === 'game') setPaused(true);
  if (document.hidden && state.screen === 'tutorial') tutorial.setPaused(true);
});

// ------------------------------------------------------------ tutorial

const tutorial = new TutorialScreen({
  onExit: () => show('home'),
  // "Jogar agora" no fim: já vem com o elemento usado no tutorial
  onPlay: (element) => {
    if (element) {
      state.element = element;
      savePref('elemento', element);
    }
    show('mode');
  },
  getName: () => playerName(),
  debug: DEBUG,
});

function openTutorial() {
  unlockAudio();
  goFullscreen();
  document.activeElement?.blur?.();
  show('tutorial');
  tutorial.start(0);
}

// Cartão de boas-vindas (só na primeira vez que abre o jogo)
function openWelcome() {
  $('#welcome').hidden = false;
  requestAnimationFrame(() => {
    const { ctx, w, h } = fitCanvas($('#welcome-art'));
    drawPortrait(ctx, 'agua', w / 2, h - 6, h / 82, { extra: { skin: 'manequim' } });
  });
  $('#welcome-yes').focus();
}

function closeWelcome() {
  $('#welcome').hidden = true;
  savePref('boasVindas', '1');
}

// ------------------------------------------------------------ preferências

function loadPref(key, fallback) {
  try {
    return localStorage.getItem(`brawl.${key}`) ?? fallback;
  } catch {
    return fallback;
  }
}

function savePref(key, value) {
  try {
    localStorage.setItem(`brawl.${key}`, value);
  } catch {
    // navegação privada sem armazenamento: tudo bem
  }
}

// ------------------------------------------------------------ início

function init() {
  buildCards();
  homeMenu = initHomeMenu($('.home-menu'), () => $('#welcome').hidden && $('#panel-backdrop').hidden);
  $('#home-play').addEventListener('click', () => show('mode'));
  $('#home-tutorial').addEventListener('click', openTutorial);
  $('#welcome-yes').addEventListener('click', () => {
    closeWelcome();
    openTutorial();
  });
  $('#welcome-no').addEventListener('click', closeWelcome);
  $('#welcome-login').addEventListener('click', () => {
    closeWelcome();
    openAuth('login');
  });
  $('#home-profile').addEventListener('click', openProfile);
  $('#home-controls').addEventListener('click', () => togglePanel('#controls-panel'));
  $('#panel-backdrop').addEventListener('click', closePanels);
  $('#home-settings').addEventListener('click', () => togglePanel('#settings-panel'));
  $('#opt-sound').addEventListener('change', (e) => {
    if (e.target.checked === isMuted()) toggleMute();
  });
  $('#opt-demo').addEventListener('change', (e) => {
    state.demo = e.target.checked;
    savePref('demo', state.demo ? '1' : '0');
    if (state.demo) demo.start();
    else demo.stop();
  });
  $('#opt-admin').addEventListener('change', (e) => {
    state.admin = e.target.checked;
    savePref('adm', state.admin ? '1' : '0');
  });
  for (const tile of document.querySelectorAll('.mode-tile[data-size]')) {
    tile.addEventListener('click', () => chooseMode(Number(tile.dataset.size)));
  }
  $('.mode-tile[data-mode="ffa"]').addEventListener('click', () => chooseMode(1, 'ffa'));
  $('.mode-tile[data-mode="treino"]').addEventListener('click', () => chooseMode(1, 'treino'));
  $('.mode-tile[data-mode="rei"]').addEventListener('click', () => chooseMode(2, 'rei'));
  // treino livre tem o mapa dele: pula a escolha de mapa
  $('#cards-next').addEventListener('click', cardsNext);
  $('#maps-next').addEventListener('click', () => mapPicker.onContinue(mapPicker.current()));
  $('#diff-seg').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    state.difficulty = btn.dataset.value;
    savePref('dificuldade', state.difficulty);
    setChips('#diff-seg', state.difficulty);
  });
  $('#play-btn').addEventListener('click', () => {
    const setup = state.pendingSetup ?? newSetup();
    setup.difficulty = state.difficulty;
    startMatch(setup);
  });
  $('#resume-btn').addEventListener('click', () => setPaused(false));
  $('#quit-btn').addEventListener('click', quitMatch);
  $('#th-weapon').addEventListener('click', (e) => {
    const g = state.runner?.game;
    const me = g?.playerById(1);
    if (me && me.state !== 'respawning') {
      const w = TRAINING_CYCLE[trainingPick++ % TRAINING_CYCLE.length];
      g.spawnWeaponAt(w, me.x + me.w / 2 + me.facing * 50, me.y - 40);
    }
    e.currentTarget.blur();
  });
  $('#th-reset').addEventListener('click', (e) => {
    resetDummy();
    e.currentTarget.blur();
  });
  $('#th-toggle').addEventListener('click', (e) => {
    toggleDummy();
    e.currentTarget.blur();
  });
  $('#again-btn').addEventListener('click', () => startMatch(newSetup()));
  $('#menu-btn').addEventListener('click', () => show('home'));
  window.addEventListener('resize', () => {
    if (state.screen === 'mode') drawModeTiles();
  });
  initAuthScreen((user) => {
    setUser(user);
    show('home');
  });
  setUser(null);
  show('home');
  if (loadPref('boasVindas', '0') !== '1') openWelcome();
  api.me().then(({ user }) => setUser(user)).catch(() => {
    // Sem servidor (ex.: aberto como página estática): joga só como convidado.
    setUser(null);
    setOfflineMode();
  });
}

init();
