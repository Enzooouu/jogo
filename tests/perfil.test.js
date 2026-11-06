import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyStats, recordMatch, summarize } from '../shared/profile-stats.js';

const base = { element: 'fogo', modeKey: '1x1', map: 'caldeira', kills: 2, deaths: 1, pickups: 1, weapons: { espada: 1 }, duration: 90, date: '2026-11-06T12:00:00Z' };

test('perfil: 4 partidas e 1 vitória dá 25%', () => {
  const s = emptyStats();
  recordMatch(s, { ...base, outcome: 'vitoria' });
  recordMatch(s, { ...base, outcome: 'derrota' });
  recordMatch(s, { ...base, outcome: 'derrota' });
  recordMatch(s, { ...base, outcome: 'empate' });
  const sum = summarize(s);
  assert.equal(s.matches, 4);
  assert.equal(s.wins, 1);
  assert.equal(s.losses, 2);
  assert.equal(s.draws, 1);
  assert.equal(sum.winRate, 25);
  assert.equal(s.kills, 8);
  assert.equal(s.deaths, 4);
  assert.equal(s.pickups, 4);
  assert.equal(s.time, 360);
});

test('perfil: personagem, arma, mapa e modo favoritos', () => {
  const s = emptyStats();
  recordMatch(s, { ...base, outcome: 'vitoria', element: 'agua', weapons: { cajado: 3 } });
  recordMatch(s, { ...base, outcome: 'vitoria', element: 'agua', map: 'pico', modeKey: 'rei' });
  recordMatch(s, { ...base, outcome: 'derrota', map: 'pico', modeKey: 'rei' });
  const sum = summarize(s);
  assert.equal(sum.favoriteElement, 'agua');
  assert.equal(sum.favoriteWeapon, 'cajado');
  assert.equal(sum.favoriteMap, 'pico');
  assert.equal(sum.favoriteMode, 'rei');
  assert.deepEqual(s.byElement.agua, { matches: 2, wins: 2 });
});

test('perfil: sequência de vitórias, recorde de kills e últimas 10', () => {
  const s = emptyStats();
  for (let i = 0; i < 3; i++) recordMatch(s, { ...base, outcome: 'vitoria', kills: i });
  recordMatch(s, { ...base, outcome: 'derrota', kills: 7 });
  for (let i = 0; i < 9; i++) recordMatch(s, { ...base, outcome: 'vitoria' });
  assert.equal(s.bestStreak, 9);
  assert.equal(s.streak, 9);
  assert.equal(s.mostKills, 7);
  assert.equal(s.recent.length, 10);
  assert.equal(s.since, base.date);
});

test('perfil: K/D sem mortes não divide por zero', () => {
  const s = emptyStats();
  recordMatch(s, { ...base, outcome: 'vitoria', kills: 3, deaths: 0 });
  assert.equal(summarize(s).kd, 3);
  assert.equal(summarize(emptyStats()).winRate, 0);
});
