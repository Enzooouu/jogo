// Rei da Ilha: uma área brilhante no chão do mapa ("a coroa"). O time que
// estiver sozinho dentro dela ganha 1 ponto por segundo; se tiver gente dos
// dois times, ela fica disputada e ninguém pontua. A cada 25 s a área muda
// de lugar (com aviso antes). Vence quem chegar a 60 pontos, ou quem tiver
// mais pontos quando o tempo acabar. Ninguém perde vida: quem cai volta
// depois de um tempinho.
//
// Não desenha nada; o desenho fica em public/js/render/renderer.js.

import { DT } from './constants.js';

export const HILL = {
  target: 60,      // pontos para vencer
  move: 25,        // segundos até a área mudar de lugar
  warn: 4,         // segundos de aviso antes de mudar
  w: 190,          // largura da área
  h: 150,          // altura da área (a partir do chão)
  timeLimit: 180,  // 3 minutos
};

export class KingOfHill {
  constructor(game) {
    this.game = game;
    this.spots = findSpots(game);
    // começa no lugar mais perto do meio do mapa
    const mid = game.map.width / 2;
    this.index = this.spots.reduce((best, s, i) => (Math.abs(s.x - mid) < Math.abs(this.spots[best].x - mid) ? i : best), 0);
    this.next = this.pickNext();
    this.timer = HILL.move;
    this.y = this.spots[this.index].y;
    this.scores = new Map(game.teams().map((t) => [t, 0]));
    this.owner = null;        // time pontuando agora
    this.contested = false;   // tem gente dos dois times dentro
    this.inside = [];         // ids de quem está dentro
  }

  get spot() {
    return this.place(this.spots[this.index]);
  }

  // lugar na plataforma acompanha ela (algumas balançam)
  place(s) {
    if (s.plat === undefined) return s;
    const pl = this.game.platforms[s.plat];
    return { x: pl.x + s.ox, y: pl.y, plat: s.plat };
  }

  // retângulo da área agora (o chão pode subir e descer, ex.: navios)
  rect() {
    const s = this.spot;
    return { x: s.x - HILL.w / 2, y: this.y - HILL.h, w: HILL.w, h: HILL.h };
  }

  // onde vai ser a próxima (para o aviso)
  nextRect() {
    const s = this.place(this.spots[this.next]);
    return { x: s.x - HILL.w / 2, y: s.y - HILL.h, w: HILL.w, h: HILL.h };
  }

  get warning() {
    return this.timer <= HILL.warn;
  }

  pickNext() {
    if (this.spots.length < 2) return this.index;
    const rng = this.game.rng;
    let i = this.index;
    while (i === this.index) i = rng.int(0, this.spots.length - 1);
    return i;
  }

  update() {
    const g = this.game;
    if (g.phase !== 'playing') return;
    // acompanha o chão embaixo da área (navio balançando, plataforma, gelo...)
    const here = this.spot;
    this.y = here.plat !== undefined ? here.y : groundAt(g, here.x, this.y) ?? this.y;

    this.timer -= DT;
    if (this.timer <= 0) {
      this.index = this.next;
      this.next = this.pickNext();
      this.timer = HILL.move;
      const s = this.spot;
      this.y = s.plat !== undefined ? s.y : groundAt(g, s.x, s.y) ?? s.y;
      g.emit('hillMove', { x: this.spot.x, y: this.y });
    }

    const r = this.rect();
    const teams = new Set();
    this.inside = [];
    for (const p of g.players) {
      if (p.state !== 'alive') continue;
      const cx = p.x + p.w / 2;
      const feet = p.y + p.h;
      if (cx < r.x || cx > r.x + r.w || feet < r.y || p.y > r.y + r.h) continue;
      teams.add(p.team);
      this.inside.push(p.id);
    }
    const owner = teams.size === 1 ? [...teams][0] : null;
    this.contested = teams.size > 1;
    if (owner !== this.owner) {
      if (owner !== null) g.emit('hillCapture', { team: owner, x: this.spot.x, y: this.y });
      else if (this.contested) g.emit('hillContest', { x: this.spot.x, y: this.y });
      this.owner = owner;
    }
    if (owner !== null) {
      const before = this.scores.get(owner);
      const now = before + DT;
      this.scores.set(owner, now);
      if (Math.floor(now) > Math.floor(before)) g.emit('hillPoint', { team: owner, points: Math.floor(now) });
      for (const id of this.inside) g.playerById(id).stats.hillTime += DT;
      if (now >= HILL.target) g.finish(owner, 'pontos');
    }
  }

  // tempo acabou: vence quem tem mais pontos (empate se igual)
  winnerByPoints() {
    const ranked = [...this.scores.entries()].sort((a, b) => b[1] - a[1]);
    const [best, second] = ranked;
    if (!best || (second && Math.floor(best[1]) === Math.floor(second[1]))) return null;
    return best[0];
  }

  points(team) {
    return Math.floor(this.scores.get(team) ?? 0);
  }
}

// Lugares possíveis: em cima dos blocos sólidos largos, longe de piscinas e
// espinhos e sem nada em cima.
function findSpots(game) {
  // mapa do Rei da Ilha: os lugares já vêm escolhidos à mão
  if (game.map.hillSpots) {
    return game.map.hillSpots.map((s) => {
      if (s.plat === undefined) return { x: s.x, y: s.y };
      const pl = game.platforms[s.plat];
      return { x: Math.round(pl.x + pl.w / 2), y: pl.y, plat: s.plat, ox: Math.round(pl.w / 2) };
    });
  }
  const solids = game.solidsNow();
  const hazards = game.hazardsNow();
  const spots = [];
  for (const s of solids) {
    if (s.w < 160) continue;
    const xs = s.w >= 600 ? [s.x + s.w * 0.2, s.x + s.w / 2, s.x + s.w * 0.8] : [s.x + s.w / 2];
    for (const x of xs) {
      if (x < 120 || x > game.map.width - 120) continue;
      const half = Math.min(HILL.w / 2, s.w / 2);
      // perigo encostado no chão da área
      const bad = hazards.some((h) => h.x < x + half && h.x + h.w > x - half && h.y < s.y + 6 && h.y + h.h > s.y - HILL.h);
      if (bad) continue;
      // outro bloco por cima (ex.: dentro do casco do navio)
      const covered = solids.some((o) => o !== s && o.x < x + 30 && o.x + o.w > x - 30 && o.y < s.y && o.y + o.h > s.y - HILL.h * 0.7);
      if (covered) continue;
      if (spots.some((p) => Math.abs(p.x - x) < 170 && Math.abs(p.y - s.y) < 80)) continue;
      spots.push({ x: Math.round(x), y: s.y });
    }
  }
  // plataformas largas também (a área vai junto se ela balançar)
  game.platforms.forEach((pl, i) => {
    if (pl.w < 140) return;
    const x = pl.x + pl.w / 2;
    const bad = hazards.some((h) => h.x < x + 80 && h.x + h.w > x - 80 && h.y < pl.y + 6 && h.y + h.h > pl.y - HILL.h);
    if (bad || spots.some((p) => Math.abs(p.x - x) < 170 && Math.abs(p.y - pl.y) < 80)) return;
    spots.push({ x: Math.round(x), y: pl.y, plat: i, ox: Math.round(pl.w / 2) });
  });
  if (!spots.length) {
    // mapa sem bloco largo: usa o meio
    const s = solids.reduce((a, b) => (b.w > a.w ? b : a), solids[0]);
    spots.push({ x: Math.round(s.x + s.w / 2), y: s.y });
  }
  return spots;
}

// Altura do chão em x, perto da altura `near` (o bloco mais alto ali que não
// esteja muito longe)
function groundAt(game, x, near) {
  let best = null;
  for (const s of game.solidsNow()) {
    if (x < s.x || x > s.x + s.w) continue;
    if (Math.abs(s.y - near) > 90) continue;
    if (best === null || Math.abs(s.y - near) < Math.abs(best - near)) best = s.y;
  }
  return best;
}
