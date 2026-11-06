// Estatísticas do perfil, guardadas no aparelho (funciona sem conta e na
// versão sem servidor). Cada partida vira um registro; os números do perfil
// são calculados a partir dos totais.

export function emptyStats() {
  return {
    since: null,
    xp: 0,
    matches: 0, wins: 0, losses: 0, draws: 0,
    kills: 0, deaths: 0, falls: 0, hazardDeaths: 0,
    damageDealt: 0, damageTaken: 0, hits: 0, pickups: 0,
    time: 0, hillTime: 0,
    streak: 0, bestStreak: 0, mostKills: 0,
    byElement: {},   // id -> { matches, wins }
    byMode: {},      // '1x1' | '2x2' | '3x3' | 'ffa' | 'rei' -> { matches, wins }
    byMap: {},       // id -> { matches, wins }
    weapons: {},     // arma -> vezes que pegou
    recent: [],      // últimas 10 partidas
  };
}

const bump = (obj, key, won) => {
  const o = obj[key] ?? { matches: 0, wins: 0 };
  o.matches++;
  if (won) o.wins++;
  obj[key] = o;
};

// entry: { outcome, element, modeKey, map, kills, deaths, falls, hazardDeaths,
//          damageDealt, damageTaken, hits, pickups, weapons, duration, hillTime, date }
export function recordMatch(stats, entry) {
  const s = stats;
  const won = entry.outcome === 'vitoria';
  s.since ??= entry.date;
  s.matches++;
  if (won) s.wins++;
  else if (entry.outcome === 'derrota') s.losses++;
  else s.draws++;
  for (const k of ['kills', 'deaths', 'falls', 'hazardDeaths', 'damageDealt', 'damageTaken', 'hits', 'pickups', 'hillTime']) {
    s[k] += Math.round(entry[k] ?? 0);
  }
  s.time += Math.round(entry.duration ?? 0);
  s.streak = won ? s.streak + 1 : 0;
  s.bestStreak = Math.max(s.bestStreak, s.streak);
  s.mostKills = Math.max(s.mostKills, entry.kills ?? 0);
  bump(s.byElement, entry.element, won);
  bump(s.byMode, entry.modeKey, won);
  bump(s.byMap, entry.map, won);
  for (const [w, n] of Object.entries(entry.weapons ?? {})) s.weapons[w] = (s.weapons[w] ?? 0) + n;
  s.recent.unshift({
    outcome: entry.outcome, element: entry.element, modeKey: entry.modeKey, map: entry.map,
    kills: entry.kills ?? 0, deaths: entry.deaths ?? 0, date: entry.date,
  });
  s.recent.length = Math.min(s.recent.length, 10);
  return s;
}

const top = (obj, by = (v) => v) => {
  let best = null;
  for (const [k, v] of Object.entries(obj)) if (!best || by(v) > by(best[1])) best = [k, v];
  return best ? best[0] : null;
};

// Números prontos para mostrar
export function summarize(s) {
  return {
    winRate: s.matches ? Math.round((s.wins / s.matches) * 100) : 0,
    kd: s.deaths ? s.kills / s.deaths : s.kills,
    favoriteElement: top(s.byElement, (v) => v.matches),
    favoriteMode: top(s.byMode, (v) => v.matches),
    favoriteMap: top(s.byMap, (v) => v.matches),
    favoriteWeapon: top(s.weapons),
    killsPerMatch: s.matches ? s.kills / s.matches : 0,
  };
}

// ------------------------------------------------------------ nível (XP)

// XP de cada partida: jogar, vencer, kills e conquistas novas. A dificuldade
// dos bots multiplica (Fácil vale menos, Difícil vale mais).
export const XP = { play: 40, win: 60, draw: 20, kill: 15, ach: 100, achGold: 250 };
export const XP_DIFFICULTY = { facil: 0.75, normal: 1, dificil: 1.5 };

export function matchXp({ outcome, kills = 0, difficulty = 'normal', newAch = 0, newGold = 0 }) {
  const base = XP.play + (outcome === 'vitoria' ? XP.win : outcome === 'empate' ? XP.draw : 0) + kills * XP.kill;
  const mult = XP_DIFFICULTY[difficulty] ?? 1;
  return Math.round(base * mult) + newAch * XP.ach + newGold * XP.achGold;
}

// XP para passar do nível n para o n+1 (cada nível pede 50 a mais)
export const xpToNext = (level) => 100 + 50 * (level - 1);

export function levelInfo(xp) {
  let level = 1;
  let left = Math.max(0, Math.floor(xp));
  while (left >= xpToNext(level)) {
    left -= xpToNext(level);
    level++;
  }
  return { level, into: left, need: xpToNext(level) };
}

// Bordas da foto de perfil que vão sendo liberadas com o nível
export const FRAMES = [
  { id: 'bronze', name: 'Bronze', level: 1 },
  { id: 'prata', name: 'Prata', level: 5 },
  { id: 'ouro', name: 'Ouro', level: 10 },
  { id: 'esmeralda', name: 'Esmeralda', level: 15 },
  { id: 'rubi', name: 'Rubi', level: 20 },
  { id: 'elemental', name: 'Elemental', level: 30 },
];

// Perfis antigos (de antes do nível): estima o XP pelas partidas já jogadas
export function estimateXp(s) {
  return s.matches * XP.play + s.wins * XP.win + s.draws * XP.draw + s.kills * XP.kill;
}
