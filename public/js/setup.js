// Monta a lista de jogadores de uma partida local (você + bots).

import { enabledElements } from '/shared/elements.js';

const BOT_NAMES = {
  fogo: ['Brasa', 'Fagulha', 'Labareda', 'Pavio', 'Faísca', 'Chama', 'Tição', 'Cinza'],
  agua: ['Maré', 'Gota', 'Onda', 'Correnteza', 'Garoa', 'Orvalho', 'Riacho', 'Chuvisco'],
  terra: ['Rocha', 'Barro', 'Cascalho', 'Pedregulho'],
  ar: ['Brisa', 'Rajada', 'Sopro', 'Ventania'],
};

/**
 * @param {object} opts
 * @param {string} opts.element elemento do jogador
 * @param {string} opts.name nome do jogador
 * @param {number} opts.teamSize jogadores por time (2 = 2v2)
 * @param {string} opts.mode 'times' | 'ffa'
 * @param {string} opts.difficulty dificuldade dos bots
 */
export function buildLocalSetup({ element, name, teamSize = 2, mode = 'times', difficulty = 'normal' }) {
  const elements = enabledElements().map((e) => e.id);
  const usedNames = new Set();
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const botName = (el) => {
    const free = (BOT_NAMES[el] ?? ['Bot']).filter((n) => !usedNames.has(n));
    const n = free.length ? pick(free) : `Bot ${usedNames.size + 1}`;
    usedNames.add(n);
    return n;
  };

  const players = [{ id: 1, name, element, team: 'A', isBot: false }];
  let id = 2;
  const total = mode === 'ffa' ? Math.max(2, teamSize * 2) : teamSize * 2;
  while (players.length < total) {
    const el = pick(elements);
    const team = mode === 'ffa' ? `P${id}` : players.filter((p) => p.team === 'A').length < teamSize ? 'A' : 'B';
    players.push({ id, name: botName(el), element: el, team, isBot: true });
    id++;
  }

  return {
    players,
    mode,
    difficulty,
    localPlayerId: 1,
    seed: (Math.random() * 2 ** 31) | 0,
  };
}

export function outcomeFor(result, playerId) {
  const me = result.players.find((p) => p.id === playerId);
  if (!me) return 'empate';
  if (result.reason === 'desistencia' && result.forfeitedBy === playerId) return 'derrota';
  if (result.winnerTeam === null) return 'empate';
  return result.winnerTeam === me.team ? 'vitoria' : 'derrota';
}
