// Ponto de entrada do navegador: troca de telas e ligação entre menu,
// partida e resultado.

import { ELEMENTS } from '/shared/elements.js';
import { MatchRunner } from './match.js';
import { unlockAudio, toggleMute } from './audio.js';
import { drawFighter } from './render/fighter.js';
import { Renderer, TEAM_COLORS } from './render/renderer.js';
import { buildLocalSetup, outcomeFor } from './setup.js';
import { api } from './api.js';
import { renderAccountBox, initAuthScreen, setAuthMode, focusAuth, loadProfile } from './screens/account.js';

const $ = (sel) => document.querySelector(sel);
const DEBUG = new URLSearchParams(location.search).has('debug');

const state = {
  screen: null,
  element: loadPref('elemento', 'fogo'),
  teamSize: 2,
  mode: 'times',
  difficulty: loadPref('dificuldade', 'normal'),
  runner: null,
  lastSetup: null,
  user: null,
  matchTicket: null,   // promessa com o id da partida no servidor (se logado)
};

// ------------------------------------------------------------ telas

const SCREENS = ['menu', 'game', 'result', 'auth', 'profile'];

export function show(name) {
  for (const s of SCREENS) $(`#screen-${s}`).hidden = s !== name;
  state.screen = name;
  if (name === 'menu') startPreviews();
  else stopPreviews();
}

document.addEventListener('click', (e) => {
  const go = e.target.closest('[data-go]');
  if (go) show(go.dataset.go);
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
}

function openAuth(mode) {
  setAuthMode(mode);
  show('auth');
  focusAuth();
}

async function openProfile() {
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

// ------------------------------------------------------------ menu

function buildElementCards() {
  const list = $('#element-list');
  list.innerHTML = '';
  for (const el of Object.values(ELEMENTS)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'element-card';
    btn.dataset.element = el.id;
    btn.style.setProperty('--el', el.color);
    btn.disabled = !el.enabled;
    btn.innerHTML = `
      ${el.enabled ? '' : '<span class="soon">EM BREVE</span>'}
      <canvas width="192" height="220" aria-hidden="true"></canvas>
      <span class="name"></span>
      <span class="desc"></span>`;
    btn.querySelector('.name').textContent = el.name;
    btn.querySelector('.desc').textContent = el.description;
    btn.addEventListener('click', () => selectElement(el.id));
    list.appendChild(btn);
  }
  selectElement(ELEMENTS[state.element]?.enabled ? state.element : 'fogo');
}

function selectElement(id) {
  state.element = id;
  savePref('elemento', id);
  for (const card of document.querySelectorAll('.element-card')) {
    card.classList.toggle('on', card.dataset.element === id);
  }
}

function bindSegment(selector, onChange) {
  const seg = $(selector);
  seg.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || btn.disabled) return;
    for (const b of seg.querySelectorAll('button')) b.classList.toggle('on', b === btn);
    onChange(btn.dataset.value);
  });
}

function setSegment(selector, value) {
  for (const b of $(selector).querySelectorAll('button')) b.classList.toggle('on', b.dataset.value === value);
}

// Bonecos animados nos cartões de elemento
let previewFrame = null;
function startPreviews() {
  if (previewFrame) return;
  const t0 = performance.now();
  const draw = (now) => {
    const time = (now - t0) / 1000;
    for (const card of document.querySelectorAll('.element-card')) {
      const canvas = card.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const selected = card.classList.contains('on');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(2.2, 0, 0, 2.2, 0, 0);
      const fake = {
        element: card.dataset.element, facing: 1, slot: 0, w: 30, h: 66,
        vx: 0, vy: 0, onGround: true, hitstun: 0, invuln: 0, status: {},
        attack: selected && time % 2 > 1.6 ? { weapon: null, t: (time % 2) - 1.6, startup: 0.07, duration: 0.4 } : null,
        weapon: null, name: '',
      };
      drawFighter(ctx, fake, 29, 22, { runPhase: 0 }, selected ? time : 0, { teamColor: '#fff', isLocal: false, showName: false });
    }
    previewFrame = requestAnimationFrame(draw);
  };
  previewFrame = requestAnimationFrame(draw);
}

function stopPreviews() {
  if (previewFrame) cancelAnimationFrame(previewFrame);
  previewFrame = null;
}

// ------------------------------------------------------------ partida

function playerName() {
  return state.user?.username ?? 'Jogador';
}

function newSetup() {
  return buildLocalSetup({
    element: state.element,
    name: playerName(),
    teamSize: state.teamSize,
    mode: state.mode,
    difficulty: state.difficulty,
  });
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
  state.matchTicket = state.user
    ? api.startMatch({ mode: setup.mode, element: setup.players[0].element, teamSize: state.teamSize }).catch((err) => ({ error: err }))
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

  const winner = result.winnerTeam !== null ? teamLabel(result, result.winnerTeam) : null;
  const subs = {
    eliminacao: winner ? `${winner} eliminou o adversário.` : 'Todos caíram ao mesmo tempo.',
    tempo: winner ? `Tempo esgotado — ${winner} tinha mais vidas.` : 'Tempo esgotado e tudo empatado.',
    desistencia: 'Você desistiu da partida.',
  };
  $('#result-sub').textContent = `${subs[result.reason] ?? ''} Duração: ${formatTime(result.duration)}.`;

  const rows = $('#result-rows');
  rows.innerHTML = '';
  const teams = [...new Set(result.players.map((p) => p.team))];
  const sorted = [...result.players].sort((a, b) => teams.indexOf(a.team) - teams.indexOf(b.team) || b.kills - a.kills);
  for (const p of sorted) {
    const tr = document.createElement('tr');
    if (p.id === setup.localPlayerId) tr.className = 'me';
    const el = ELEMENTS[p.element];
    tr.innerHTML = `
      <td><span class="pname"></span>${p.isBot ? '<span class="tag">BOT</span>' : ''}</td>
      <td><span class="dot" style="background:${teamColor(result, p.team)}"></span><span class="tname"></span></td>
      <td><span class="dot" style="background:${el.color}"></span>${el.name}</td>
      <td>${p.kills}</td><td>${p.deaths}</td><td>${p.damageDealt}</td>`;
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
  if (e.code === 'KeyM' && !typing) toggleMute();
  if (state.screen === 'game' && (e.code === 'Escape' || e.code === 'KeyP')) {
    e.preventDefault();
    setPaused(!state.runner?.paused);
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.screen === 'game') setPaused(true);
});

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
  buildElementCards();
  setSegment('#diff-seg', state.difficulty);
  bindSegment('#mode-seg', (v) => { state.mode = v; });
  bindSegment('#size-seg', (v) => { state.teamSize = Number(v); });
  bindSegment('#diff-seg', (v) => {
    state.difficulty = v;
    savePref('dificuldade', v);
  });
  $('#play-btn').addEventListener('click', () => startMatch(newSetup()));
  $('#resume-btn').addEventListener('click', () => setPaused(false));
  $('#quit-btn').addEventListener('click', quitMatch);
  $('#again-btn').addEventListener('click', () => startMatch(newSetup()));
  $('#menu-btn').addEventListener('click', () => show('menu'));
  initAuthScreen((user) => {
    setUser(user);
    show('menu');
  });
  setUser(null);
  show('menu');
  api.me().then(({ user }) => setUser(user)).catch(() => setUser(null));
}

init();
