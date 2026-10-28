// Telas de login/cadastro e de perfil, e a caixinha de conta no menu.

import { ELEMENTS } from '/shared/elements.js';
import { api } from '../api.js';

const $ = (sel) => document.querySelector(sel);

// ------------------------------------------------------------ caixa no menu

export function renderAccountBox(user, { onLogin, onRegister, onProfile, onLogout }) {
  const box = $('#account-box');
  box.innerHTML = '';
  const button = (label, cls, fn) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `btn small ${cls}`;
    b.textContent = label;
    b.addEventListener('click', fn);
    box.appendChild(b);
  };
  if (user) {
    const who = document.createElement('span');
    who.className = 'who';
    who.append('Olá, ');
    const strong = document.createElement('strong');
    strong.textContent = user.username;
    who.append(strong);
    box.appendChild(who);
    button('Perfil', '', onProfile);
    button('Sair', 'ghost', onLogout);
  } else {
    button('Entrar', '', onLogin);
    button('Criar conta', 'ghost', onRegister);
  }
  $('#save-hint').textContent = user
    ? `Suas estatísticas serão salvas na conta ${user.username}.`
    : 'Jogando como convidado. Entre ou crie uma conta para salvar suas estatísticas.';
}

// ------------------------------------------------------------ login / cadastro

let authMode = 'login';
let onAuthenticated = null;

export function initAuthScreen(onSuccess) {
  onAuthenticated = onSuccess;
  for (const tab of document.querySelectorAll('#screen-auth .tabs button')) {
    tab.addEventListener('click', () => setAuthMode(tab.dataset.tab));
  }
  $('#auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = $('#auth-user').value.trim();
    const password = $('#auth-pass').value;
    const error = $('#auth-error');
    error.textContent = '';

    if (authMode === 'register' && password !== $('#auth-pass2').value) {
      error.textContent = 'As senhas não são iguais.';
      return;
    }
    const submit = $('#auth-submit');
    submit.disabled = true;
    try {
      const { user } = authMode === 'login' ? await api.login(username, password) : await api.register(username, password);
      $('#auth-form').reset();
      onAuthenticated?.(user);
    } catch (err) {
      error.textContent = err.message;
    } finally {
      submit.disabled = false;
    }
  });
}

export function setAuthMode(mode) {
  authMode = mode;
  for (const tab of document.querySelectorAll('#screen-auth .tabs button')) {
    tab.classList.toggle('on', tab.dataset.tab === mode);
  }
  const register = mode === 'register';
  $('#auth-pass2-label').hidden = !register;
  $('#auth-pass2').required = register;
  $('#auth-pass').autocomplete = register ? 'new-password' : 'current-password';
  $('#auth-submit').textContent = register ? 'Criar conta' : 'Entrar';
  $('#auth-rules').hidden = !register;
  $('#auth-error').textContent = '';
}

export function focusAuth() {
  $('#auth-user').focus();
}

// ------------------------------------------------------------ perfil

export async function loadProfile() {
  const grid = $('#profile-stats');
  grid.innerHTML = '<p class="hint">Carregando...</p>';
  $('#profile-elements').innerHTML = '';
  $('#profile-history').innerHTML = '';
  try {
    renderProfile(await api.profile());
    return true;
  } catch (err) {
    grid.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'error';
    p.textContent = err.message;
    grid.appendChild(p);
    return false;
  }
}

export function renderProfile({ user, stats, elements, recent }) {
  $('#profile-name').textContent = user.username;
  $('#profile-since').textContent = `Jogando desde ${formatDate(user.createdAt)}`;

  const winRate = stats.matchesPlayed ? Math.round((stats.wins / stats.matchesPlayed) * 100) : 0;
  const kd = stats.deaths ? (stats.kills / stats.deaths).toFixed(2) : stats.kills.toFixed(2);
  const fav = stats.favoriteElement ? ELEMENTS[stats.favoriteElement] : null;
  const cards = [
    ['Partidas', stats.matchesPlayed],
    ['Vitórias', stats.wins],
    ['Derrotas', stats.losses],
    ['Empates', stats.draws],
    ['Taxa de vitória', `${winRate}%`],
    ['Kills', stats.kills],
    ['Mortes', stats.deaths],
    ['K/D', kd],
    ['Elemento mais usado', fav ? fav.name : '—', fav?.color],
  ];
  const grid = $('#profile-stats');
  grid.innerHTML = '';
  for (const [label, value, color] of cards) {
    const div = document.createElement('div');
    div.className = 'stat';
    div.innerHTML = '<div class="v"></div><div class="k"></div>';
    div.querySelector('.v').textContent = value;
    if (color) div.querySelector('.v').style.color = color;
    div.querySelector('.k').textContent = label;
    grid.appendChild(div);
  }

  const elBox = $('#profile-elements');
  elBox.innerHTML = '';
  const total = elements.reduce((s, e) => s + e.matches, 0);
  for (const el of Object.values(ELEMENTS).filter((e) => e.enabled)) {
    const used = elements.find((e) => e.element === el.id)?.matches ?? 0;
    const pct = total ? Math.round((used / total) * 100) : 0;
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = '<span class="n"></span><div class="bar"><span></span></div><span class="c"></span>';
    row.querySelector('.n').textContent = el.name;
    const bar = row.querySelector('.bar > span');
    bar.style.width = `${pct}%`;
    bar.style.background = el.color;
    row.querySelector('.c').textContent = `${used} (${pct}%)`;
    elBox.appendChild(row);
  }

  const hist = $('#profile-history');
  hist.innerHTML = '';
  if (!recent.length) {
    hist.innerHTML = '<p class="hint">Nenhuma partida ainda. Bora jogar!</p>';
    return;
  }
  const ul = document.createElement('ul');
  ul.className = 'history';
  const label = { vitoria: 'Vitória', derrota: 'Derrota', empate: 'Empate' };
  for (const m of recent) {
    const li = document.createElement('li');
    li.innerHTML = '<span class="r"></span><span class="d"></span><span class="hint"></span>';
    const r = li.querySelector('.r');
    r.textContent = label[m.result];
    r.className = `res-${m.result}`;
    li.querySelector('.d').textContent = `${ELEMENTS[m.element]?.name ?? m.element} · ${m.teamSize}v${m.teamSize} · ${m.kills} kills / ${m.deaths} mortes`;
    li.querySelector('.hint').textContent = formatDate(m.finishedAt);
    li.querySelector('.hint').style.margin = '0';
    ul.appendChild(li);
  }
  hist.appendChild(ul);
}

function formatDate(sqlDate) {
  if (!sqlDate) return '';
  // O SQLite guarda em UTC no formato "AAAA-MM-DD HH:MM:SS"
  const d = new Date(`${sqlDate.replace(' ', 'T')}Z`);
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
