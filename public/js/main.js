// Ponto de entrada do navegador: troca de telas e o caminho
// início -> modo -> carta do elemento -> versus -> partida -> resultado.

import { ELEMENTS, HAZARDS, HAZARD_REACTION } from '/shared/elements.js';
import { WEAPONS, weaponProfile } from '/shared/weapons.js';
import { MAPS } from '/shared/maps.js';
import { MatchRunner } from './match.js';
import { unlockAudio, toggleMute, isMuted } from './audio.js';
import { Renderer, TEAM_COLORS } from './render/renderer.js';
import { drawPortrait, fitCanvas } from './render/portrait.js';
import { buildLocalSetup, outcomeFor } from './setup.js';
import { api } from './api.js';
import { renderAccountBox, initAuthScreen, setAuthMode, focusAuth, loadProfile } from './screens/account.js';
import { DemoArena } from './screens/demo.js';
import { initControls } from './screens/controls.js';
import { TutorialScreen } from './screens/tutorial.js';
import { currentBindings, actionOf } from './input/bindings.js';
import { VersusScreen } from './screens/versus.js';

const $ = (sel) => document.querySelector(sel);
const DEBUG = new URLSearchParams(location.search).has('debug');

const state = {
  screen: null,
  element: loadPref('elemento', 'fogo'),
  teamSize: Number(loadPref('tamanho', '2')) || 2,
  mode: 'times',
  difficulty: loadPref('dificuldade', 'normal'),
  mapId: loadPref('mapa', 'caldeira'),
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

// ------------------------------------------------------------ telas

const SCREENS = ['home', 'mode', 'cards', 'versus', 'game', 'tutorial', 'result', 'auth', 'profile'];
const WITH_DEMO = new Set(['home', 'mode', 'cards', 'auth', 'profile']);

export function show(name) {
  for (const s of SCREENS) $(`#screen-${s}`).hidden = s !== name;
  if (name !== 'tutorial' && tutorial?.active) tutorial.stop();
  state.screen = name;
  if (WITH_DEMO.has(name) && state.demo) demo.start();
  else demo.stop();
  if (name !== 'versus') versus.stop();
  if (name === 'cards') startCardAnimation();
  else stopCardAnimation();
  if (name === 'mode') drawModeTiles();
  closePanels();
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
    : `Modo ${teamSize} × ${teamSize} · o time inteiro usa o elemento da carta`;
  $(`.el-card[data-element="${state.element}"]`)?.focus();
}

// ------------------------------------------------------------ passo 2: cartas

function buildCards() {
  const list = $('#card-list');
  list.innerHTML = '';
  for (const el of Object.values(ELEMENTS)) {
    const reactions = HAZARD_REACTION[el.id] ?? {};
    const imune = Object.keys(reactions).filter((h) => reactions[h] === 'imune').map((h) => HAZARDS[h].name).join(', ');
    const morre = Object.keys(reactions).filter((h) => reactions[h] === 'morre').map((h) => HAZARDS[h].name).join(', ');
    const machuca = Object.keys(reactions).filter((h) => reactions[h] === 'dano').map((h) => HAZARDS[h].name).join(', ');
    const rows = [['Imune', imune || '—'], ['Morre', morre || '—']];
    if (machuca) rows.push(['Machuca', machuca]);
    for (const id of Object.keys(WEAPONS)) {
      if (WEAPONS[id].byElement?.[el.id]) rows.push([WEAPONS[id].name, weaponProfile(id, el.id).name]);
    }
    // sem elemento: armas padrão e dano extra
    if (el.stats.damage && el.stats.damage !== 1) {
      rows.push(['Armas', 'Padrão (sem efeito)'], ['Dano', `+${Math.round((el.stats.damage - 1) * 100)}%`]);
    }
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'el-card';
    card.dataset.element = el.id;
    card.disabled = !el.enabled;
    card.style.setProperty('--c1', el.color);
    card.style.setProperty('--c2', el.dark);
    card.innerHTML = `<div class="top"><span class="n"></span>${el.enabled ? '<i class="sel" hidden>SELECIONADO</i>' : '<i>EM BREVE</i>'}</div>
      <canvas aria-hidden="true"></canvas><dl></dl><p class="desc"></p>`;
    card.querySelector('.desc').textContent = el.description;
    card.querySelector('.n').textContent = el.name.toUpperCase();
    const dl = card.querySelector('dl');
    for (const [k, v] of rows) {
      const dt = document.createElement('dt');
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.textContent = v;
      dl.append(dt, dd);
    }
    card.addEventListener('click', () => selectElement(el.id));
    card.addEventListener('dblclick', () => el.enabled && goVersus());
    list.appendChild(card);
  }
  selectElement(ELEMENTS[state.element]?.enabled ? state.element : 'fogo');
}

function selectElement(id) {
  state.element = id;
  savePref('elemento', id);
  for (const card of document.querySelectorAll('.el-card')) {
    const on = card.dataset.element === id;
    card.classList.toggle('on', on);
    const sel = card.querySelector('.sel');
    if (sel) sel.hidden = !on;
  }
}

let cardFrame = null;
function startCardAnimation() {
  if (cardFrame) return;
  const t0 = performance.now();
  const loop = (now) => {
    const t = (now - t0) / 1000 + 1;
    for (const card of document.querySelectorAll('.el-card')) {
      const { ctx, w, h } = fitCanvas(card.querySelector('canvas'));
      const on = card.classList.contains('on');
      const el = card.dataset.element;
      const weapon = { fogo: 'espada', agua: 'cajado', terra: 'espada', ar: 'cajado', mortal: 'lanca' }[el];
      drawPortrait(ctx, el, w / 2, h - 10, Math.min(1.85, h / 94), {
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
  setChips('#map-seg', state.mapId);
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
  const setup = buildLocalSetup({
    element: state.element,
    name: playerName(),
    teamSize: state.teamSize,
    mode: state.mode,
    difficulty: state.difficulty,
    admin: state.admin,
  });
  setup.mapId = MAPS[state.mapId] ? state.mapId : 'caldeira';
  return setup;
}

async function startMatch(setup) {
  state.lastSetup = setup;
  unlockAudio();
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

function quitMatch() {
  const runner = state.runner;
  if (!runner) return;
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
    tempo: winner ? `Tempo esgotado — ${winner} tinha mais vidas.` : 'Tempo esgotado e tudo empatado.',
    desistencia: 'Você desistiu da partida.',
  };
  $('#result-sub').textContent = `${subs[result.reason] ?? ''} Duração: ${formatTime(result.duration)}.`;

  const rows = $('#result-rows');
  rows.innerHTML = '';
  const teams = [...new Set(result.players.map((p) => p.team))];
  // sem time (todos contra todos): esconde a coluna de time e ordena por kills
  $('#result-rows').closest('table').classList.toggle('ffa', ffa);
  const sorted = ffa
    ? [...result.players].sort((a, b) => (b.team === result.winnerTeam) - (a.team === result.winnerTeam) || b.kills - a.kills || a.deaths - b.deaths)
    : [...result.players].sort((a, b) => teams.indexOf(a.team) - teams.indexOf(b.team) || b.kills - a.kills);
  for (const p of sorted) {
    const tr = document.createElement('tr');
    if (p.id === setup.localPlayerId) tr.className = 'me';
    const el = ELEMENTS[p.element];
    tr.innerHTML = `
      <td><span class="pname"></span>${p.isBot ? '<span class="tag">BOT</span>' : ''}</td>
      <td><span class="dot" style="background:${teamColor(result, p.team)}"></span><span class="tname"></span></td>
      <td><span class="dot" style="background:${el.color}"></span>${el.name}</td>
      <td>${p.kills}</td><td>${p.deaths}</td><td>${p.damageDealt}</td><td>${p.damageTaken}</td>`;
    tr.querySelector('.pname').textContent = p.name;
    tr.querySelector('.tname').textContent = teamLabel(result, p.team);
    rows.appendChild(tr);
  }
  $('#result-save').textContent = '';
  show('result');
  $('#again-btn').focus();
  return outcome;
}

function formatTime(sec) {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

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
    const back = { mode: 'home', cards: 'mode', versus: 'cards', auth: 'home', profile: 'home' }[state.screen];
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
  $('#cards-next').addEventListener('click', goVersus);
  $('#map-seg').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    state.mapId = btn.dataset.value;
    savePref('mapa', state.mapId);
    setChips('#map-seg', state.mapId);
  });
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
    setup.mapId = state.mapId;
    startMatch(setup);
  });
  $('#resume-btn').addEventListener('click', () => setPaused(false));
  $('#quit-btn').addEventListener('click', quitMatch);
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
