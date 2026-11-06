// Conquistas em duas camadas:
//   - normais: valem em qualquer dificuldade
//   - de ouro: as mesmas, mas só contam no Difícil (aparecem como ??? até a
//     pessoa completar a normal)
// Partidas no modo ADM e o Treino livre não contam.
//
// MatchTracker anota o que acontece numa partida (a partir dos eventos do
// jogo); evaluate() confere as conquistas no fim e devolve as novas.

import { weaponProfile } from './weapons.js';

const KO_WINDOW = 4; // segundos: o último golpe vale para o K.O. dentro desse tempo

export const ACHIEVEMENTS = [
  { id: 'primeira_vitoria', name: 'Primeira Vitória', desc: 'Vença uma partida.', gold: 'Primeira Coroa', icon: '🏆',
    check: (m) => m.won },
  { id: 'intocavel', name: 'Intocável', desc: 'Vença sem perder nenhuma vida.', gold: 'Intocável de Ouro', icon: '🛡️',
    check: (m) => m.won && m.deaths === 0 && !m.hill },
  { id: 'por_um_fio', name: 'Por um Fio', desc: 'Vença com só 1 vida sobrando.', gold: 'Virada Lendária', icon: '❤️',
    check: (m) => m.won && m.livesLeft === 1 && !m.hill },
  { id: 'massacre', name: 'Massacre', desc: 'Derrube 3 adversários na mesma partida de Todos contra todos.', gold: 'Carnificina', icon: '💥',
    check: (m) => m.mode === 'ffa' && m.kos.length >= 3 },
  { id: 'misericordia', name: 'Golpe de Misericórdia', desc: 'Derrube alguém que estava com mais de 150% de dano.', gold: 'Execução', icon: '💀',
    check: (m) => m.kos.some((k) => k.damage > 150) },
  { id: 'mestre', name: 'Mestre dos Elementos', desc: 'Vença com cada um dos 5 personagens.', gold: 'Lenda dos Elementos', icon: '🌀',
    goal: 5, progress: (m, c) => { if (m.won) c.set('mestre', m.element); return c.size('mestre'); } },
  { id: 'banho_de_lava', name: 'Banho de Lava', desc: 'Como Fogo, entre na lava 10 vezes.', gold: 'Pés de Brasa', icon: '🔥',
    goal: 10, progress: (m, c) => c.add('banho_de_lava', m.element === 'fogo' ? m.lavaEnters : 0) },
  { id: 'tsunami', name: 'Tsunami', desc: 'Como Água, derrube um inimigo com o jato d\'água.', gold: 'Maremoto', icon: '🌊',
    check: (m) => m.element === 'agua' && m.kos.some((k) => k.src === 'magia') },
  { id: 'rocha_firme', name: 'Rocha Firme', desc: 'Como Terra, atordoe inimigos 3 vezes na mesma partida.', gold: 'Montanha Viva', icon: '🪨',
    check: (m) => m.element === 'terra' && m.stuns >= 3 },
  { id: 'furacao', name: 'Furacão', desc: 'Como Ar, derrube um inimigo com o tornado.', gold: 'Olho do Furacão', icon: '🌪️',
    check: (m) => m.element === 'ar' && m.kos.some((k) => k.src === 'magia') },
  { id: 'sem_poderes', name: 'Sem Poderes', desc: 'Vença 5 partidas com o Mortal.', gold: 'Mortal Imortal', icon: '⚫',
    goal: 5, progress: (m, c) => c.add('sem_poderes', m.won && m.element === 'mortal' ? 1 : 0) },
  { id: 'arsenal', name: 'Arsenal Completo', desc: 'Acerte golpes com espada, cajado, lança e marretão.', gold: 'Mestre de Armas', icon: '🗡️',
    goal: 4, progress: (m, c) => { for (const w of m.weapons) c.set('arsenal', w); return c.size('arsenal'); } },
  { id: 'martelada', name: 'Martelada', desc: 'Derrube alguém com o marretão.', gold: 'Martelo dos Deuses', icon: '🔨',
    check: (m) => m.kos.some((k) => k.weapon === 'marretao' && k.src === 'golpe') },
  { id: 'arremesso', name: 'Arremesso Certeiro', desc: 'Derrube alguém acertando uma arma lançada.', gold: 'Mira Perfeita', icon: '🎯',
    check: (m) => m.kos.some((k) => k.src === 'arremesso') },
  { id: 'bola_de_neve', name: 'Bola de Neve', desc: 'No Lago Congelado, derrube 3 inimigos com bolas de neve.', gold: 'Avalanche', icon: '❄️',
    goal: 3, progress: (m, c) => c.add('bola_de_neve', m.kos.filter((k) => k.src === 'neve').length) },
  { id: 'artilheiro', name: 'Artilheiro', desc: 'No Navio Voador, derrube um inimigo logo depois de ele levar tiro do canhão.', gold: 'Capitão Pirata', icon: '💣',
    check: (m) => m.kos.some((k) => k.cannon) },
  { id: 'rei_absoluto', name: 'Rei Absoluto', desc: 'Vença um Rei da Ilha sem o outro time marcar ponto.', gold: 'Imperador', icon: '👑',
    check: (m) => m.hill && m.won && m.enemyPoints === 0 },
  { id: 'aprendiz', name: 'Aprendiz', desc: 'Termine o tutorial.', gold: null, icon: '📜', special: true },
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
          this.kos.push({ src: mine ? h.src : 'golpe', weapon: mine ? h.weapon : null, damage: mine ? h.damage : 0, cannon });
        } else if (cannon && g.map.id === 'navio') {
          // tiro do canhão no inimigo e ele caiu: conta para quem está no outro navio
          this.kos.push({ src: 'canhao', weapon: null, damage: 0, cannon: true });
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
    return {
      won: outcome === 'vitoria',
      mode: setup.mode,
      hill,
      enemyPoints,
      element: local?.element,
      difficulty: setup.difficulty,
      deaths: me?.deaths ?? 0,
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
      let done;
      if (a.goal) done = a.progress(summary, c) >= a.goal;
      else done = Boolean(a.check(summary));
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
  if (!a.goal) return null;
  const v = progress.counters[tier][a.id];
  const n = Array.isArray(v) ? v.length : v ?? 0;
  return { n: Math.min(n, a.goal), goal: a.goal };
}

// Conquista especial (ex.: tutorial)
export function unlockSpecial(id, progress) {
  if (progress.normal[id]) return [];
  progress.normal[id] = true;
  return [{ id, tier: 'normal' }];
}
