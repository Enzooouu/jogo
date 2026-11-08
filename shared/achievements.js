// Conquistas em duas camadas:
//   - normais: valem em qualquer dificuldade
//   - de ouro: desafios mais difíceis, que só contam no Difícil (aparecem
//     como ??? até a pessoa completar a normal)
// Partidas no modo ADM e o Treino livre não contam.
//
// MatchTracker anota o que acontece numa partida (a partir dos eventos do
// jogo); evaluate() confere as conquistas no fim e devolve as novas.

import { weaponProfile } from './weapons.js';

const KO_WINDOW = 4; // segundos: o último golpe vale para o K.O. dentro desse tempo

// Cada conquista tem a versão normal e a de ouro (`gold`). A de ouro tem um
// desafio próprio, mais difícil, e só conta em partidas no Difícil.
export const ACHIEVEMENTS = [
  { id: 'primeira_vitoria', name: 'Primeira Vitória', desc: 'Vença uma partida.', icon: '🏆',
    check: (m) => m.won,
    gold: { name: 'Primeira Coroa', desc: 'Vença uma partida de cada modo no Difícil (1×1, 2×2, 3×3, Todos contra todos e Rei da Ilha).',
      goal: 5, progress: (m, c) => { if (m.won) c.set('primeira_vitoria', m.modeKey); return c.size('primeira_vitoria'); } } },
  { id: 'intocavel', name: 'Intocável', desc: 'Vença sem perder nenhuma vida.', icon: '🛡️',
    check: (m) => m.won && m.deaths === 0 && !m.hill,
    gold: { name: 'Intocável de Ouro', desc: 'Vença 3 partidas seguidas no Difícil sem perder nenhuma vida.',
      goal: 3, progress: (m, c) => c.streak('intocavel', m.won && m.deaths === 0 && !m.hill) } },
  { id: 'por_um_fio', name: 'Por um Fio', desc: 'Vença com só 1 vida sobrando.', icon: '❤️',
    check: (m) => m.won && m.livesLeft === 1 && !m.hill,
    gold: { name: 'Virada Lendária', desc: 'Vença um 3×3 no Difícil sozinho (seus aliados já fora) e com só 1 vida sobrando.',
      check: (m) => m.won && m.livesLeft === 1 && m.modeKey === '3x3' && m.alliesLeft === 0 } },
  { id: 'massacre', name: 'Massacre', desc: 'Derrube 3 adversários na mesma partida de Todos contra todos.', icon: '💥',
    check: (m) => m.mode === 'ffa' && m.kos.length >= 3,
    gold: { name: 'Carnificina', desc: 'No Difícil, na mesma partida de Todos contra todos, derrube 4 adversários, um de cada elemento diferente.',
      check: (m) => m.mode === 'ffa' && new Set(m.kos.map((k) => k.victimElement)).size >= 4 } },
  { id: 'misericordia', name: 'Golpe de Misericórdia', desc: 'Derrube alguém que estava com mais de 150% de dano.', icon: '💀',
    check: (m) => m.kos.some((k) => k.damage > 150),
    gold: { name: 'Execução', desc: 'No Difícil, derrube alguém com um soco (sem arma) quando ele estava com mais de 250% de dano.',
      check: (m) => m.kos.some((k) => k.damage > 250 && !k.weapon && k.src === 'golpe') } },
  { id: 'mestre', name: 'Mestre dos Elementos', desc: 'Vença com cada um dos 5 personagens.', icon: '🌀',
    goal: 5, progress: (m, c) => { if (m.won) c.set('mestre', m.element); return c.size('mestre'); },
    gold: { name: 'Lenda dos Elementos', desc: 'No Difícil, vença com os 5 personagens em vitórias seguidas, sem perder nenhuma vida (perder ou morrer zera).',
      goal: 5, progress: (m, c) => { if (m.won && m.deaths === 0) c.set('mestre', m.element); else c.clear('mestre'); return c.size('mestre'); } } },
  { id: 'banho_de_lava', name: 'Banho de Lava', desc: 'Como Fogo, entre na lava 10 vezes.', icon: '🔥',
    goal: 10, progress: (m, c) => c.add('banho_de_lava', m.element === 'fogo' ? m.lavaEnters : 0),
    gold: { name: 'Pés de Brasa', desc: 'Como Fogo, no Difícil, derrube 3 inimigos jogando eles na lava na mesma partida.',
      check: (m) => m.element === 'fogo' && m.kos.filter((k) => k.cause === 'lava').length >= 3 } },
  { id: 'tsunami', name: 'Tsunami', desc: 'Como Água, derrube um inimigo com o jato d\'água.', icon: '🌊',
    check: (m) => m.element === 'agua' && m.kos.some((k) => k.src === 'magia'),
    gold: { name: 'Maremoto', desc: 'Como Água, no Difícil, derrube 3 inimigos com o jato d\'água na mesma partida.',
      check: (m) => m.element === 'agua' && m.kos.filter((k) => k.src === 'magia').length >= 3 } },
  { id: 'rocha_firme', name: 'Rocha Firme', desc: 'Como Terra, atordoe inimigos 3 vezes na mesma partida.', icon: '🪨',
    check: (m) => m.element === 'terra' && m.stuns >= 3,
    gold: { name: 'Montanha Viva', desc: 'Como Terra, no Difícil, atordoe inimigos 30 vezes na mesma partida.',
      check: (m) => m.element === 'terra' && m.stuns >= 30 } },
  { id: 'furacao', name: 'Furacão', desc: 'Como Ar, derrube um inimigo com o tornado.', icon: '🌪️',
    check: (m) => m.element === 'ar' && m.kos.some((k) => k.src === 'magia'),
    gold: { name: 'Olho do Furacão', desc: 'Como Ar, no Difícil, derrube 3 inimigos com o tornado na mesma partida.',
      check: (m) => m.element === 'ar' && m.kos.filter((k) => k.src === 'magia').length >= 3 } },
  { id: 'sem_poderes', name: 'Sem Poderes', desc: 'Vença 5 partidas com o Mortal.', icon: '⚫',
    goal: 5, progress: (m, c) => c.add('sem_poderes', m.won && m.element === 'mortal' ? 1 : 0),
    gold: { name: 'Mortal Imortal', desc: 'Vença 5 partidas seguidas com o Mortal no Difícil.',
      goal: 5, progress: (m, c) => (m.element === 'mortal' ? c.streak('sem_poderes', m.won) : c.get('sem_poderes')) } },
  { id: 'arsenal', name: 'Arsenal Completo', desc: 'Acerte golpes com espada, cajado, lança e marretão.', icon: '🗡️',
    goal: 4, progress: (m, c) => { for (const w of m.weapons) c.set('arsenal', w); return c.size('arsenal'); },
    gold: { name: 'Mestre de Armas', desc: 'No Difícil, faça 5 K.O.s com cada arma: espada, cajado, lança e marretão (conta todas as partidas).',
      goal: 20, progress: (m, c) => { for (const k of m.kos) if (k.weapon) c.tally('arsenal', k.weapon, 1); return c.tallySum('arsenal', 5); } } },
  { id: 'martelada', name: 'Martelada', desc: 'Derrube alguém com o marretão.', icon: '🔨',
    check: (m) => m.kos.some((k) => k.weapon === 'marretao' && k.src === 'golpe'),
    gold: { name: 'Martelo dos Deuses', desc: 'No Difícil, derrube com o marretão alguém que estava com menos de 60% de dano.',
      check: (m) => m.kos.some((k) => k.weapon === 'marretao' && k.src === 'golpe' && k.damage < 60) } },
  { id: 'arremesso', name: 'Arremesso Certeiro', desc: 'Derrube alguém acertando uma arma lançada.', icon: '🎯',
    check: (m) => m.kos.some((k) => k.src === 'arremesso'),
    gold: { name: 'Mira Perfeita', desc: 'No Difícil, derrube 3 inimigos com armas lançadas na mesma partida.',
      check: (m) => m.kos.filter((k) => k.src === 'arremesso').length >= 3 } },
  { id: 'bola_de_neve', name: 'Bola de Neve', desc: 'No Lago Congelado, derrube 3 inimigos com bolas de neve.', icon: '❄️',
    goal: 3, progress: (m, c) => c.add('bola_de_neve', m.kos.filter((k) => k.src === 'neve').length),
    gold: { name: 'Avalanche', desc: 'No Difícil, derrube 3 inimigos com bolas de neve na mesma partida.',
      check: (m) => m.kos.filter((k) => k.src === 'neve').length >= 3 } },
  { id: 'artilheiro', name: 'Artilheiro', desc: 'No Navio Voador, derrube um inimigo logo depois de ele levar tiro do canhão.', icon: '💣',
    check: (m) => m.kos.some((k) => k.cannon),
    gold: { name: 'Capitão Pirata', desc: 'No Difícil, derrube 5 inimigos com a ajuda do canhão (conta todas as partidas). Prêmio: chapéu de pirata com tapa-olho.',
      reward: 'pirata', goal: 5, progress: (m, c) => c.add('artilheiro', m.kos.filter((k) => k.cannon).length) } },
  { id: 'rei_absoluto', name: 'Rei Absoluto', desc: 'Vença um Rei da Ilha sem o outro time marcar ponto.', icon: '👑',
    check: (m) => m.hill && m.won && m.enemyPoints === 0,
    gold: { name: 'Imperador', desc: 'No Difícil, vença o Rei da Ilha nos dois mapas (Castelo e Pirâmide) sem o outro time marcar ponto. Prêmio: coroa.',
      reward: 'coroa', goal: 2, progress: (m, c) => { if (m.hill && m.won && m.enemyPoints === 0) c.set('rei_absoluto', m.map); return c.size('rei_absoluto'); } } },
  { id: 'maos_limpas', name: 'Mãos Limpas', desc: 'Vença uma partida sem pegar nenhuma arma.', icon: '👊',
    check: (m) => m.won && m.pickups === 0,
    gold: { name: 'Punhos de Ferro', desc: 'No Difícil, vença 3 partidas seguidas sem pegar nenhuma arma.',
      goal: 3, progress: (m, c) => c.streak('maos_limpas', m.won && m.pickups === 0) } },
  { id: 'aprendiz', name: 'Aprendiz', desc: 'Termine o tutorial.', icon: '📜', special: true,
    // ouro: speedrun do tutorial (o cronômetro fica no alto da tela do tutorial)
    gold: { name: 'Velocista', desc: 'Termine o tutorial em até 1:30, sem pular nenhuma etapa.' } },
  // Torre: dada pelo próprio modo (ver towerEnd em main.js)
  { id: 'alpinista', name: 'Alpinista', desc: 'Na Torre, vença o andar 10 (o primeiro Gênio).', icon: '🗼', special: true,
    gold: { name: 'Astronauta', desc: 'Na Torre, passe do andar 50 e chegue ao espaço. Prêmio: capacete de astronauta.', reward: 'capacete' } },
];

export const byId = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

// Progresso salvo: { normal: { id: true }, ouro: { id: true },
//   counters: { normal: { id: número ou [lista] }, ouro: { ... } } }
export function emptyProgress() {
  return { normal: {}, ouro: {}, counters: { normal: {}, ouro: {} } };
}

// Anota uma partida a partir dos eventos do jogo
export class MatchTracker {
  constructor(game, localId) {
    this.game = game;
    this.localId = localId;
    this.lastHit = new Map();   // alvo -> { src, weapon, damage, time }
    this.cannonAt = new Map();  // alvo -> tempo do tiro de canhão
    this.kos = [];
    this.weapons = new Set();
    this.stuns = 0;
    this.lavaEnters = 0;
    this.pickups = 0;
    this.pickedWeapons = {};  // arma -> vezes que pegou (para o perfil)
  }

  onEvents(events) {
    const g = this.game;
    for (const e of events) {
      if (e.type === 'hit' && e.attacker === this.localId) {
        const t = g.playerById(e.target);
        this.lastHit.set(e.target, { src: e.src ?? 'golpe', weapon: e.weapon ?? null, damage: t ? t.damage : 0, time: g.time });
        if (e.weapon && e.src !== 'arremesso') this.weapons.add(e.weapon);
        if (e.stun) this.stuns++;
      } else if (e.type === 'hit' && e.target !== undefined) {
        // golpe de outra pessoa: o crédito do K.O. passa para ela
        this.lastHit.delete(e.target);
      } else if (e.type === 'snowHit' && e.attacker === this.localId) {
        const t = g.playerById(e.target);
        this.lastHit.set(e.target, { src: 'neve', weapon: null, damage: t ? t.damage : 0, time: g.time });
      } else if (e.type === 'pickup' && e.id === this.localId) {
        this.pickups++;
        if (e.weapon) this.pickedWeapons[e.weapon] = (this.pickedWeapons[e.weapon] ?? 0) + 1;
      } else if (e.type === 'cannonHit') {
        this.cannonAt.set(e.target, g.time);
      } else if (e.type === 'hazardEnter' && e.id === this.localId && e.hazard === 'lava') {
        this.lavaEnters++;
      } else if (e.type === 'ko' && e.id !== this.localId) {
        const victim = g.playerById(e.id);
        const me = g.playerById(this.localId);
        if (!victim || !me || victim.team === me.team) continue;
        const h = this.lastHit.get(e.id);
        const mine = h && g.time - h.time <= KO_WINDOW;
        const cannon = this.cannonAt.has(e.id) && g.time - this.cannonAt.get(e.id) <= KO_WINDOW;
        if (mine || e.killer === this.localId) {
          this.kos.push({ victim: e.id, victimElement: victim.element, cause: e.cause, src: mine ? h.src : 'golpe', weapon: mine ? h.weapon : null, damage: mine ? h.damage : 0, cannon });
        } else if (cannon && g.map.id === 'navio') {
          // tiro do canhão no inimigo e ele caiu: conta para quem está no outro navio
          this.kos.push({ victim: e.id, victimElement: victim.element, cause: e.cause, src: 'canhao', weapon: null, damage: 0, cannon: true });
        }
        this.lastHit.delete(e.id);
      }
    }
  }

  // Resumo da partida para conferir as conquistas
  summary(result, setup, outcome) {
    const me = result.players.find((p) => p.id === this.localId);
    const myTeam = me?.team;
    const hill = Boolean(result.hillScores);
    const enemyPoints = hill ? Object.entries(result.hillScores).filter(([t]) => t !== myTeam).reduce((a, [, v]) => a + v, 0) : 0;
    const local = setup.players.find((p) => p.id === this.localId);
    const teamSize = setup.players.filter((p) => p.team === local?.team).length;
    const modeKey = setup.mode === 'ffa' ? 'ffa' : setup.mode === 'rei' ? 'rei' : `${teamSize}x${teamSize}`;
    return {
      won: outcome === 'vitoria',
      mode: setup.mode,
      modeKey,
      map: setup.mapId ?? this.game.map.id,
      hill,
      enemyPoints,
      element: local?.element,
      difficulty: setup.difficulty,
      deaths: me?.deaths ?? 0,
      alliesLeft: result.players.filter((p) => p.team === myTeam && p.id !== this.localId && p.livesLeft > 0).length,
      pickups: this.pickups,
      pickedWeapons: { ...this.pickedWeapons },
      livesLeft: me?.livesLeft ?? 0,
      kos: this.kos,
      weapons: [...this.weapons],
      stuns: this.stuns,
      lavaEnters: this.lavaEnters,
      admin: setup.players.some((p) => p.admin),
      practice: Boolean(setup.practice),
      hasBots: setup.players.some((p) => p.isBot),
    };
  }
}

function counterApi(store) {
  return {
    add(id, n) { store[id] = (store[id] ?? 0) + n; return store[id]; },
    set(id, v) { const list = new Set(store[id] ?? []); if (v) list.add(v); store[id] = [...list]; return list.size; },
    size(id) { return (store[id] ?? []).length; },
    get(id) { return store[id] ?? 0; },
    clear(id) { store[id] = []; },
    // contagem por tipo (ex.: K.O.s por arma) e a soma com limite por tipo
    tally(id, key, n) { const o = store[id] && !Array.isArray(store[id]) ? store[id] : {}; o[key] = (o[key] ?? 0) + n; store[id] = o; },
    tallySum(id, cap) { const o = store[id] && !Array.isArray(store[id]) ? store[id] : {}; return Object.values(o).reduce((a, v) => a + Math.min(cap, v), 0); },
    // sequência: soma 1 se deu certo, volta para 0 se não deu
    streak(id, ok) { store[id] = ok ? (store[id] ?? 0) + 1 : 0; return store[id]; },
  };
}

// Confere as conquistas. Muda `progress` e devolve as novas:
// [{ id, tier: 'normal' | 'ouro' }]
export function evaluate(summary, progress) {
  if (summary.admin || summary.practice) return [];
  const tiers = ['normal'];
  if (summary.difficulty === 'dificil' && summary.hasBots) tiers.push('ouro');
  const unlocked = [];
  for (const tier of tiers) {
    const c = counterApi(progress.counters[tier]);
    for (const a of ACHIEVEMENTS) {
      if (a.special || (tier === 'ouro' && !a.gold)) continue;
      const rule = tier === 'ouro' ? a.gold : a;
      let done;
      if (rule.goal) done = rule.progress(summary, c) >= rule.goal;
      else done = Boolean(rule.check(summary));
      if (done && !progress[tier][a.id]) {
        progress[tier][a.id] = true;
        unlocked.push({ id: a.id, tier });
      }
    }
  }
  return unlocked;
}

// Progresso de uma conquista com meta (ex.: 3 de 5)
export function progressOf(a, tier, progress) {
  const rule = tier === 'ouro' ? a.gold : a;
  if (!rule?.goal) return null;
  const v = progress.counters[tier][a.id];
  const n = Array.isArray(v) ? v.length : typeof v === 'object' && v ? Object.values(v).reduce((s, x) => s + Math.min(5, x), 0) : v ?? 0;
  return { n: Math.min(n, rule.goal), goal: rule.goal };
}

// Conquista especial (ex.: tutorial, Torre). A de ouro também libera a
// normal, se ainda não tinha.
export function unlockSpecial(id, progress, tier = 'normal') {
  const out = [];
  if (!progress.normal[id]) {
    progress.normal[id] = true;
    out.push({ id, tier: 'normal' });
  }
  if (tier === 'ouro' && !progress.ouro[id]) {
    progress.ouro[id] = true;
    out.push({ id, tier: 'ouro' });
  }
  return out;
}
