// Simula 1.000 lutas num mapa: cada dupla de personagens luta 100 vezes
// (50 de cada lado do mapa), bots no Mestre, 3 vidas. Sem desenhar nada:
// só a física e os bots. Uso: node simular.mjs <mapa>
import fs from 'node:fs';
import { Game } from '../../shared/game.js';
import { BotController } from '../../shared/ai.js';

const mapId = process.argv[2];
const PER_SIDE = 50;
const ELS = ['fogo', 'agua', 'terra', 'ar', 'mortal'];
const out = { mapa: mapId, nivel: 'mestre', vidas: 3, lutasPorDupla: PER_SIDE * 2, duplas: [] };
const t0 = Date.now();
for (let i = 0; i < ELS.length; i++) for (let j = i + 1; j < ELS.length; j++) {
  const a = ELS[i];
  const b = ELS[j];
  const r = { a, b, vitoriasA: 0, vitoriasB: 0, empates: 0, duracaoMedia: 0, kos: 0 };
  let dur = 0;
  for (let n = 0; n < PER_SIDE * 2; n++) {
    const swap = n % 2 === 1;   // metade das lutas com os lados trocados
    const left = swap ? b : a;
    const right = swap ? a : b;
    const seed = 10_000 + i * 1000 + j * 100 + n;
    const players = [
      { id: 1, name: 'L', element: left, team: 'A', isBot: true },
      { id: 2, name: 'R', element: right, team: 'B', isBot: true },
    ];
    const g = new Game({ players, seed, mode: 'times', mapId });
    const bots = players.map((p) => new BotController(p.id, { difficulty: 'mestre', seed: seed * 7 + p.id }));
    let steps = 0;
    while (g.phase !== 'ended' && steps < 60 * 60 * 10) {
      const inp = {};
      for (const bt of bots) inp[bt.playerId] = bt.getInput(g);
      g.step(inp);
      g.drainEvents();
      steps++;
    }
    const win = g.result?.winnerTeam;
    const winEl = win === 'A' ? left : win === 'B' ? right : null;
    if (winEl === a) r.vitoriasA++;
    else if (winEl === b) r.vitoriasB++;
    else r.empates++;
    dur += g.result?.duration ?? 0;
    r.kos += g.players.reduce((s, p) => s + p.stats.deaths, 0);
  }
  r.duracaoMedia = Math.round(dur / (PER_SIDE * 2));
  out.duplas.push(r);
  console.log(mapId, a, 'x', b, r.vitoriasA, '-', r.vitoriasB, 'empates', r.empates, `(${Math.round((Date.now() - t0) / 1000)}s)`);
}
fs.writeFileSync(new URL(`./resultado-${mapId}.json`, import.meta.url), JSON.stringify(out, null, 2));
console.log('fim', mapId, Math.round((Date.now() - t0) / 1000) + 's');
