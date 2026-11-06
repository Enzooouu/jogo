// Tela de perfil: números guardados neste aparelho (funcionam sem conta e na
// versão sem servidor) e o "chip" de perfil no canto superior direito do menu.

import { ELEMENTS } from '/shared/elements.js';
import { WEAPONS } from '/shared/weapons.js';
import { getMap } from '/shared/maps.js';
import { emptyStats, recordMatch, summarize, matchXp, levelInfo, estimateXp, FRAMES } from '/shared/profile-stats.js';
import { drawPortrait, fitCanvas } from '../render/portrait.js';
import { drawAvatar } from '../render/avatar.js';

const KEY = 'brawl.perfil';
const $ = (sel) => document.querySelector(sel);

const MODE_NAMES = { '1x1': '1 contra 1', '2x2': '2 contra 2', '3x3': '3 contra 3', ffa: 'Todos contra todos', rei: 'Rei da Ilha' };
const OUTCOME = { vitoria: ['V', 'Vitória'], derrota: ['D', 'Derrota'], empate: ['E', 'Empate'] };

export function loadStats() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (v && typeof v.matches === 'number') {
      const s = { ...emptyStats(), ...v };
      // perfil de antes do nível: ganha o XP das partidas que já jogou
      if (typeof v.xp !== 'number') s.xp = estimateXp(s);
      return s;
    }
  } catch {
    // sem armazenamento: começa do zero
  }
  return emptyStats();
}

function saveStats(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // navegação privada: vale só até fechar a página
  }
}

// Guarda uma partida. `summary` vem do MatchTracker (conquistas).
// Devolve o XP ganho e o nível antes/depois (para a tela de resultado).
export function recordProfileMatch(summary, result, localId, outcome, { newAch = 0, newGold = 0 } = {}) {
  const me = result.players.find((p) => p.id === localId);
  if (!me) return null;
  const stats = loadStats();
  const before = levelInfo(stats.xp);
  const gained = matchXp({ outcome, kills: me.kills, difficulty: summary.difficulty, newAch, newGold });
  stats.xp += gained;
  recordMatch(stats, {
    outcome,
    element: summary.element ?? me.element,
    modeKey: summary.modeKey,
    map: summary.map,
    kills: me.kills, deaths: me.deaths, falls: me.falls, hazardDeaths: me.hazardDeaths,
    damageDealt: me.damageDealt, damageTaken: me.damageTaken, hits: me.hits,
    pickups: summary.pickups ?? me.pickups, weapons: summary.pickedWeapons,
    hillTime: me.hillTime, duration: result.duration,
    date: new Date().toISOString(),
  });
  saveStats(stats);
  return { gained, before, after: levelInfo(stats.xp) };
}

// ------------------------------------------------------------ foto de perfil

const LOOK_KEY = 'brawl.avatar';

// { pic: 'auto' | 'el:<elemento>' | 'arma:<arma>:<elemento>', frame }
export function loadLook() {
  try {
    const v = JSON.parse(localStorage.getItem(LOOK_KEY) ?? 'null');
    if (v && typeof v.pic === 'string') return { pic: v.pic, frame: v.frame ?? 'auto' };
  } catch {
    // sem armazenamento
  }
  return { pic: 'auto', frame: 'auto' };
}

function saveLook(look) {
  try {
    localStorage.setItem(LOOK_KEY, JSON.stringify(look));
  } catch {
    // navegação privada
  }
}

// foto que aparece: 'auto' usa o personagem mais usado
function resolvePic(look, stats) {
  if (look.pic !== 'auto') return look.pic;
  return `el:${summarize(stats).favoriteElement ?? 'fogo'}`;
}

// borda escolhida, mas só se o nível já liberou (senão a melhor liberada)
function resolveFrame(look, level) {
  const open = FRAMES.filter((f) => f.level <= level);
  return open.find((f) => f.id === look.frame)?.id ?? open[open.length - 1].id;
}

export function resetStats() {
  saveStats(emptyStats());
}

// ------------------------------------------------------------ textos

const nf = (n) => Math.round(n).toLocaleString('pt-BR');
const elName = (id) => ELEMENTS[id]?.name ?? '—';
const mapName = (id) => {
  try {
    return getMap(id)?.name ?? id;
  } catch {
    return id;
  }
};
const weaponName = (id) => WEAPONS[id]?.name ?? id;

function formatTime(sec) {
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}min`;
}

function formatDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR');
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

// ------------------------------------------------------------ retratos

let portraits = [];
let raf = 0;

function portrait(canvas, element, { scale = 1, facing = 1, foot = 0.94 } = {}) {
  portraits.push({ canvas, draw: (ctx, w, h, t) => drawPortrait(ctx, element, w / 2, h * foot, (h / 150) * scale, { facing, time: t }) });
}

function avatarCanvas(canvas, pic) {
  portraits = portraits.filter((p) => p.canvas !== canvas);
  portraits.push({ canvas, draw: (ctx, w, h, t) => drawAvatar(ctx, w, h, pic, t) });
}

function drawPortraits(time) {
  for (const p of portraits) {
    if (!p.canvas.isConnected || !p.canvas.offsetParent) continue;
    // fitCanvas já ajusta a escala da tela (retina): desenha em pixels de CSS
    const { ctx, w, h } = fitCanvas(p.canvas);
    p.draw(ctx, w, h, time / 1000);
  }
}

function startPortraits() {
  cancelAnimationFrame(raf);
  const loop = (t) => {
    portraits = portraits.filter((p) => p.canvas.isConnected);
    if (!portraits.some((p) => p.canvas.offsetParent)) return;
    drawPortraits(t);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

// ------------------------------------------------------------ chip do menu

export function renderProfileChip(username) {
  const chip = $('#profile-chip');
  if (!chip) return;
  const s = loadStats();
  const lv = levelInfo(s.xp);
  const look = loadLook();
  chip.querySelector('b').textContent = username || 'Convidado';
  chip.querySelector('.pc-lv').textContent = `NÍVEL ${lv.level}`;
  chip.querySelector('.pc-xp i').style.width = `${(lv.into / lv.need) * 100}%`;
  chip.querySelector('.pc-badge').textContent = lv.level;
  chip.querySelector('.pc-av').dataset.frame = resolveFrame(look, lv.level);
  avatarCanvas(chip.querySelector('canvas'), resolvePic(look, s));
  startPortraits();
}

// ------------------------------------------------------------ tela

export function renderLocalProfile({ username, achievements, onReset }) {
  const s = loadStats();
  const sum = summarize(s);
  const fav = sum.favoriteElement;
  portraits = portraits.filter((p) => p.canvas.id === 'profile-chip-canvas');
  const lv = levelInfo(s.xp);
  const look = loadLook();

  $('#profile-name').textContent = username || 'Convidado';
  // foto + nível
  const av = $('#profile-avatar');
  av.dataset.frame = resolveFrame(look, lv.level);
  avatarCanvas(av.querySelector('canvas'), resolvePic(look, s));
  av.querySelector('.pc-badge').textContent = lv.level;
  av.onclick = () => openPicker(s, lv.level, () => renderLocalProfile({ username, achievements, onReset }));
  $('#profile-level').textContent = `NÍVEL ${lv.level}`;
  $('#profile-xp-fill').style.width = `${(lv.into / lv.need) * 100}%`;
  $('#profile-xp-text').textContent = `${nf(lv.into)} / ${nf(lv.need)} XP · faltam ${nf(lv.need - lv.into)} para o nível ${lv.level + 1}`;
  $('#profile-since').textContent = s.since
    ? `Jogando desde ${formatDate(s.since)} · ${formatTime(s.time)} de jogo`
    : 'Nenhuma partida ainda: jogue uma para começar seu perfil.';
  $('#profile-note').textContent = username
    ? 'Estes números ficam guardados neste aparelho.'
    : 'Jogando como convidado: os números ficam guardados neste aparelho.';

  // herói: personagem mais usado
  const hero = $('#profile-hero');
  hero.innerHTML = '';
  const hc = el('canvas');
  hero.appendChild(hc);
  portrait(hc, fav ?? 'fogo', { scale: 1.05 });
  hero.style.setProperty('--el', ELEMENTS[fav]?.color ?? '#ff6a1f');
  const heroTxt = el('div', 'ph-txt');
  heroTxt.append(el('small', '', 'PERSONAGEM MAIS USADO'), el('b', '', fav ? elName(fav) : '—'));
  if (fav) {
    const d = s.byElement[fav];
    heroTxt.append(el('span', '', `${d.matches} ${d.matches === 1 ? 'partida' : 'partidas'} · ${Math.round((d.wins / d.matches) * 100)}% vitórias`));
  }
  hero.appendChild(heroTxt);

  // anel da porcentagem de vitórias
  const ring = $('#profile-ring');
  ring.style.setProperty('--p', sum.winRate);
  ring.querySelector('b').textContent = `${sum.winRate}%`;
  ring.querySelector('span').textContent = s.matches ? `${nf(s.wins)} de ${nf(s.matches)}` : 'sem partidas';

  // números principais
  const main = [
    ['Partidas', nf(s.matches), ''],
    ['Vitórias', nf(s.wins), 'good'],
    ['Derrotas', nf(s.losses), 'bad'],
    ['Kills', nf(s.kills), 'fire'],
    ['Mortes', nf(s.deaths), 'violet'],
    ['Armas pegas', nf(s.pickups), 'gold'],
  ];
  const grid = $('#profile-stats');
  grid.innerHTML = '';
  for (const [k, v, c] of main) {
    const d = el('div', `stat big ${c}`);
    d.append(el('div', 'v', v), el('div', 'k', k));
    grid.appendChild(d);
  }

  // mais números
  const more = [
    ['Empates', nf(s.draws)],
    ['K/D (kills por morte)', sum.kd.toFixed(2).replace('.', ',')],
    ['Kills por partida', sum.killsPerMatch.toFixed(1).replace('.', ',')],
    ['Mais kills numa partida', nf(s.mostKills)],
    ['Dano causado', `${nf(s.damageDealt)}%`],
    ['Dano levado', `${nf(s.damageTaken)}%`],
    ['Golpes acertados', nf(s.hits)],
    ['Quedas para fora', nf(s.falls)],
    ['Mortes por perigo', nf(s.hazardDeaths)],
    ['Vitórias seguidas (recorde)', nf(s.bestStreak)],
    ['Vitórias seguidas (agora)', nf(s.streak)],
    ['Tempo jogado', formatTime(s.time)],
    ['Tempo no topo (Rei)', formatTime(s.hillTime)],
    ['Conquistas', achievements],
  ];
  const mg = $('#profile-more');
  mg.innerHTML = '';
  for (const [k, v] of more) {
    const d = el('div', 'pm');
    d.append(el('span', '', k), el('b', '', v));
    mg.appendChild(d);
  }

  // personagens
  const els = $('#profile-elements');
  els.innerHTML = '';
  const maxM = Math.max(1, ...Object.values(s.byElement).map((v) => v.matches));
  for (const e of Object.values(ELEMENTS).filter((x) => x.enabled)) {
    const d = s.byElement[e.id] ?? { matches: 0, wins: 0 };
    const row = el('div', `pe-row${d.matches ? '' : ' none'}`);
    const c = el('canvas');
    row.appendChild(c);
    portrait(c, e.id, { scale: 3, foot: 1.55 });
    const info = el('div', 'pe-info');
    const top = el('div', 'pe-top');
    top.append(el('b', '', e.name), el('span', '', d.matches ? `${d.matches} ${d.matches === 1 ? 'partida' : 'partidas'} · ${Math.round((d.wins / d.matches) * 100)}% vitórias` : 'nunca jogou'));
    const bar = el('div', 'pe-bar');
    const fill = el('i');
    fill.style.width = `${(d.matches / maxM) * 100}%`;
    fill.style.background = e.color;
    bar.appendChild(fill);
    info.append(top, bar);
    row.appendChild(info);
    els.appendChild(row);
  }

  // favoritos
  const favs = $('#profile-favs');
  favs.innerHTML = '';
  const favRow = (icon, label, value, extra) => {
    const r = el('div', 'pf');
    r.append(el('span', 'pf-i', icon));
    const t = el('div');
    t.append(el('small', '', label), el('b', '', value ?? '—'));
    r.appendChild(t);
    if (extra) r.appendChild(el('em', '', extra));
    favs.appendChild(r);
  };
  const cnt = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  favRow('🗺️', 'Mapa favorito', sum.favoriteMap && mapName(sum.favoriteMap), sum.favoriteMap && cnt(s.byMap[sum.favoriteMap].matches, 'partida', 'partidas'));
  favRow('🎮', 'Modo favorito', sum.favoriteMode && (MODE_NAMES[sum.favoriteMode] ?? sum.favoriteMode), sum.favoriteMode && cnt(s.byMode[sum.favoriteMode].matches, 'partida', 'partidas'));
  favRow('⚔️', 'Arma favorita', sum.favoriteWeapon && weaponName(sum.favoriteWeapon), sum.favoriteWeapon && cnt(s.weapons[sum.favoriteWeapon], 'vez', 'vezes'));
  // vitórias por modo
  const modes = Object.entries(s.byMode).sort((a, b) => b[1].matches - a[1].matches);
  if (modes.length) {
    const ml = el('div', 'pf-modes');
    for (const [k, v] of modes) {
      const m = el('div');
      m.append(el('span', '', MODE_NAMES[k] ?? k), el('b', '', `${Math.round((v.wins / v.matches) * 100)}%`), el('small', '', `${v.wins}/${v.matches}`));
      ml.appendChild(m);
    }
    favs.append(el('h3', '', 'Vitórias por modo'), ml);
  }

  // últimas partidas
  const hist = $('#profile-history');
  hist.innerHTML = '';
  if (!s.recent.length) {
    hist.appendChild(el('p', 'hint', 'Suas últimas 10 partidas aparecem aqui.'));
  } else {
    const ul = el('ul', 'history');
    for (const m of s.recent) {
      const [short, long] = OUTCOME[m.outcome] ?? ['?', m.outcome];
      const li = el('li', `ph-${m.outcome}`);
      const badge = el('span', 'res', short);
      badge.title = long;
      const mid = el('div');
      mid.append(el('b', '', `${elName(m.element)} · ${MODE_NAMES[m.modeKey] ?? m.modeKey}`), el('small', '', mapName(m.map)));
      const right = el('div', 'r');
      right.append(el('b', '', `${m.kills} K / ${m.deaths} M`), el('small', '', formatDate(m.date)));
      li.append(badge, mid, right);
      ul.appendChild(li);
    }
    hist.appendChild(ul);
  }

  const reset = $('#profile-reset');
  reset.hidden = !s.matches;
  reset.onclick = () => {
    if (!confirm('Apagar todas as estatísticas do perfil neste aparelho? (As conquistas continuam.)')) return;
    resetStats();
    onReset?.();
  };

  requestAnimationFrame(startPortraits);
}

// ------------------------------------------------------------ escolher foto

const PICK_WEAPONS = ['espada', 'cajado', 'lanca', 'marretao'];

function openPicker(stats, level, onDone) {
  const box = $('#avatar-picker');
  const look = loadLook();
  const enabled = Object.values(ELEMENTS).filter((e) => e.enabled);
  const draw = () => {
    for (const p of [...box.querySelectorAll('canvas')]) portraits = portraits.filter((x) => x.canvas !== p);
    const chars = $('#ap-chars');
    const weps = $('#ap-weapons');
    const frames = $('#ap-frames');
    chars.innerHTML = '';
    weps.innerHTML = '';
    frames.innerHTML = '';
    const option = (parent, pic, label, title) => {
      const b = el('button', `ap-opt${look.pic === pic ? ' on' : ''}`);
      b.type = 'button';
      b.title = title ?? label;
      const ring = el('span', 'ap-ring');
      const c = el('canvas');
      ring.appendChild(c);
      b.append(ring, el('small', '', label));
      if (pic === 'auto') avatarCanvas(c, resolvePic({ pic: 'auto' }, stats));
      else avatarCanvas(c, pic);
      b.onclick = () => {
        look.pic = pic;
        saveLook(look);
        draw();
      };
      parent.appendChild(b);
    };
    option(chars, 'auto', 'Automático', 'O personagem que você mais usa');
    for (const e of enabled) option(chars, `el:${e.id}`, e.name);
    for (const w of PICK_WEAPONS) {
      const row = el('div', 'ap-wrow');
      row.appendChild(el('span', 'ap-wname', WEAPONS[w].name));
      const opts = el('div', 'ap-grid');
      for (const e of enabled) {
        const name = WEAPONS[w].byElement?.[e.id]?.name ?? `${WEAPONS[w].name} ${e.id === 'mortal' ? 'comum' : `(${e.name})`}`;
        option(opts, `arma:${w}:${e.id}`, e.name, name);
      }
      row.appendChild(opts);
      weps.appendChild(row);
    }
    const current = resolveFrame(look, level);
    for (const f of FRAMES) {
      const locked = f.level > level;
      const b = el('button', `ap-frame${current === f.id ? ' on' : ''}${locked ? ' locked' : ''}`);
      b.type = 'button';
      b.disabled = locked;
      const dot = el('span', 'ap-fdot');
      dot.dataset.frame = f.id;
      b.append(dot, el('b', '', f.name), el('small', '', locked ? `🔒 Nível ${f.level}` : `Nível ${f.level}`));
      b.onclick = () => {
        look.frame = f.id;
        saveLook(look);
        draw();
      };
      frames.appendChild(b);
    }
    startPortraits();
  };
  box.hidden = false;
  draw();
  const close = () => {
    box.hidden = true;
    document.removeEventListener('keydown', onKey, true);
    onDone?.();
  };
  const onKey = (e) => {
    if (e.code !== 'Escape') return;
    e.stopPropagation();
    e.preventDefault();
    close();
  };
  document.addEventListener('keydown', onKey, true);
  box.querySelector('.ap-close').onclick = close;
  box.querySelector('.ap-back').onclick = close;
  box.querySelector('.ap-close').focus({ preventScroll: true });
}
