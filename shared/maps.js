// Mapas. Coordenadas em pixels do mundo (1280 x 720, origem no canto
// superior esquerdo, y cresce para baixo).
//
// solids:    blocos sólidos (colidem por todos os lados)
// platforms: plataformas finas, dá para atravessar por baixo e descer com ↓
// hazards:   perigos; o efeito depende do elemento (ver elements.js)
// spawns:    pontos de nascimento (posição dos pés). Com 2 times, quem fica
//            na metade esquerda é de um time e na direita do outro. O código
//            distribui quantos jogadores houver (4, 6, 8...).
// blast:     sair desses limites = perder uma vida
// decor:     enfeites só visuais (não colidem)
// wind:      rajadas de vento que aparecem em lugares aleatórios
//            (surfaces = chãos onde podem nascer; dir = sempre para fora)

import { TUTORIAL_MAPS } from './maps-treino.js';
import { HILL_MAPS } from './maps-rei.js';
import { TOWER_MAPS } from './maps-torre.js';

export { HILL_MAPS };

// Plataforma pendurada em balão (Pico dos Ventos)
const SWING = { length: 130, push: 3.2, wind: 0.9, gravity: 620, damping: 0.6, maxAngle: 1.15 };

// Sólidos de um navio do Navio Voador (0 = esquerda; o 1 é o espelho): o
// tombadilho, o convés e fatias do casco seguindo a curva de baixo (a mesma
// curva do desenho em public/js/render/stage-navio.js)
function shipSolids(ship) {
  const quad = (a, c, b, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;
  // curva da popa: (64,530) -> (315,604), controle (110,600)
  // curva da proa: (315,604) -> (586,486), controle (490,600)
  const along = (p0, c, p1, y) => {
    let best = p0[0];
    let bestD = Infinity;
    for (let t = 0; t <= 1; t += 0.005) {
      const d = Math.abs(quad(p0[1], c[1], p1[1], t) - y);
      if (d < bestD) {
        bestD = d;
        best = quad(p0[0], c[0], p1[0], t);
      }
    }
    return best;
  };
  const left = (y) => (y <= 530 ? 64 + ((530 - y) / 94) * 6 : along([64, 530], [110, 600], [315, 604], y));
  const right = (y) => along([315, 604], [490, 600], [586, 486], y);
  const out = [
    { x: 70, y: 436, w: 120, h: 64 },    // tombadilho
    { x: 70, y: 500, w: 490, h: 12 },    // convés
  ];
  for (const [y0, y1] of [[512, 528], [528, 544], [544, 560], [560, 576], [576, 590], [590, 600]]) {
    const mid = (y0 + y1) / 2;
    const l = Math.round(left(mid));
    const r = Math.round(Math.min(560, right(mid)));
    out.push({ x: l, y: y0, w: r - l, h: y1 - y0, under: true });
  }
  return out.map((s) => ({ ...s, ship, x: ship === 0 ? s.x : 1280 - s.x - s.w }));
}

export const MAPS = {
  caldeira: {
    id: 'caldeira',
    name: 'Caldeira',
    width: 1280,
    height: 720,
    blast: { left: -260, right: 1540, top: -560, bottom: 1000 },
    // Ilha flutuante: as laterais (x=180 e x=1100) são paredes para se pendurar.
    solids: [
      { x: 180, y: 540, w: 150, h: 160 },
      { x: 330, y: 572, w: 140, h: 128 },  // fundo da piscina de lava
      { x: 470, y: 540, w: 340, h: 160 },
      { x: 810, y: 572, w: 140, h: 128 },  // fundo da piscina de água
      { x: 950, y: 540, w: 150, h: 160 },
      { x: 250, y: 700, w: 780, h: 50 },   // base da ilha
      { x: 380, y: 750, w: 520, h: 45 },
    ],
    platforms: [
      { x: 250, y: 420, w: 220 },
      { x: 810, y: 420, w: 220 },
      { x: 540, y: 315, w: 200 },
    ],
    hazards: [
      { type: 'lava', x: 330, y: 550, w: 140, h: 22 },
      { type: 'agua', x: 810, y: 550, w: 140, h: 22 },
      { type: 'espinhos', x: 600, y: 303, w: 80, h: 12 },   // em cima da plataforma do meio
    ],
    // near = perigo ao lado do ponto (quem morre nele nasce em outro lugar)
    spawns: [
      { x: 230, y: 540, near: 'lava' }, { x: 1050, y: 540, near: 'agua' },
      { x: 590, y: 540 }, { x: 690, y: 540 },
      { x: 360, y: 420, near: 'lava' }, { x: 920, y: 420, near: 'agua' },
      { x: 565, y: 315, near: 'espinhos' }, { x: 715, y: 315, near: 'espinhos' },
    ],
    respawns: [
      { x: 560, y: 150 }, { x: 720, y: 150 }, { x: 400, y: 150 }, { x: 880, y: 150 },
    ],
    wind: {
      first: 8, every: [7, 11], warn: 1.2, active: 3, max: 2,
      w: 190, h: 150, strength: 320,
      surfaces: [
        { y: 540, x0: 190, x1: 1090 },
        { y: 420, x0: 250, x1: 470 },
        { y: 420, x0: 810, x1: 1030 },
        { y: 315, x0: 540, x1: 740 },
      ],
    },
    itemSpawn: { minX: 220, maxX: 1060, y: -40 },
    decor: [
      { type: 'braseiro', x: 200, y: 540 },
      { type: 'obsidiana', x: 300, y: 540 },
      { type: 'runa', x: 640, y: 540 },
      { type: 'cristal', x: 985, y: 540 },
      { type: 'fonte', x: 1078, y: 540 },
      { type: 'tocha', x: 255, y: 618 },
      { type: 'tocha', x: 1025, y: 618, cold: true },
      { type: 'cascata', hazard: 'lava', x: 420, y: 795 },
      { type: 'cascata', hazard: 'agua', x: 862, y: 795 },
    ],
    theme: { skyTop: '#140a24', skyBottom: '#3d1630', haze: '#ff7a3c' },
  },

  // Ilhas no céu ao entardecer, com
  // muito vento, lava na ilhota da esquerda, lago de chuva na da direita,
  // espinhos na ilha do meio e plataformas balançando presas em balões.
  pico: {
    id: 'pico',
    name: 'Pico dos Ventos',
    width: 1280,
    height: 720,
    blast: { left: -260, right: 1540, top: -560, bottom: 1000 },
    solids: [
      { x: 360, y: 520, w: 560, h: 150 },  // ilha principal
      { x: 80, y: 450, w: 66, h: 80 },     // ilhota da esquerda (bordas da lava)
      { x: 146, y: 474, w: 88, h: 56 },    // fundo da lava
      { x: 234, y: 450, w: 66, h: 80 },
      { x: 980, y: 450, w: 66, h: 80 },    // ilhota da direita (bordas do lago)
      { x: 1046, y: 474, w: 88, h: 56 },   // fundo do lago
      { x: 1134, y: 450, w: 66, h: 80 },
    ],
    // swing: pendurada num balão; só balança quando alguém anda em cima
    // (length = corda, push = força de quem anda, gravity = força que traz
    // de volta, damping = freio, maxAngle = inclinação máxima da corda)
    platforms: [
      { x: 363, y: 390, w: 150, swing: SWING },
      { x: 767, y: 390, w: 150, swing: SWING },
      { x: 560, y: 270, w: 160, swing: SWING },
    ],
    hazards: [
      { type: 'lava', x: 146, y: 458, w: 88, h: 16 },
      { type: 'agua', x: 1046, y: 458, w: 88, h: 16 },
      { type: 'espinhos', x: 455, y: 508, w: 100, h: 12 },
      { type: 'espinhos', x: 725, y: 508, w: 100, h: 12 },
    ],
    spawns: [
      { x: 405, y: 520, near: 'espinhos' }, { x: 875, y: 520, near: 'espinhos' },
      { x: 600, y: 520, near: 'espinhos' }, { x: 680, y: 520, near: 'espinhos' },
      { x: 438, y: 390 }, { x: 842, y: 390 },
      { x: 266, y: 450, near: 'lava' }, { x: 1014, y: 450, near: 'agua' },
    ],
    respawns: [
      { x: 560, y: 150 }, { x: 720, y: 150 }, { x: 400, y: 150 }, { x: 880, y: 150 },
    ],
    // bem mais vento que na Caldeira: correntes que atravessam o mapa de
    // ponta a ponta (stream) e, junto, uma rajada comum por vez
    wind: {
      first: 3, every: [2.5, 4.5], warn: 1.1, active: 3.2, max: 1,
      w: 210, h: 160, strength: 380,
      stream: { first: 6, every: [9, 12], warn: 1.5, active: 4, h: 130, strength: 320, bands: [390, 262, 140] },
      surfaces: [
        { y: 520, x0: 370, x1: 910 },
        { y: 450, x0: 85, x1: 295 },
        { y: 450, x0: 985, x1: 1195 },
        { y: 390, x0: 360, x1: 920 },
        { y: 270, x0: 540, x1: 740 },
      ],
    },
    itemSpawn: { minX: 380, maxX: 900, y: -40 },
    decor: [
      { type: 'moinho', x: 1170, y: 450 },
      { type: 'bandeira', x: 380, y: 520 },
      { type: 'bandeira', x: 900, y: 520 },
      { type: 'arvore', x: 272, y: 450 },
      { type: 'santuario', x: 640, y: 520 },
    ],
    theme: { skyTop: '#3a4f9e', skyBottom: '#ffb98a', haze: '#ffd6a8' },
  },

  // Campo de grama de dia, sem piscina, espinho nem vento: duas ilhas com
  // um buraco no meio (era uma ponte, que quebrou) e uma plataforma de
  // madeira lá no alto. Só dá para perder vida sendo derrubado. Usa o
  // cenário do Campo de Treino (shared/maps-treino.js).
  campo: {
    id: 'campo',
    name: 'Campo Aberto',
    art: 'treino',
    width: 1280,
    height: 720,
    blast: { left: -260, right: 1540, top: -560, bottom: 1000 },
    solids: [
      { x: 180, y: 530, w: 340, h: 180 },
      { x: 760, y: 530, w: 340, h: 180 },
    ],
    platforms: [{ x: 455, y: 330, w: 370 }],
    hazards: [],
    spawns: [
      { x: 300, y: 530 }, { x: 980, y: 530 }, { x: 400, y: 530 }, { x: 880, y: 530 },
      { x: 240, y: 530 }, { x: 1040, y: 530 }, { x: 460, y: 530 }, { x: 820, y: 530 },
    ],
    respawns: [
      { x: 560, y: 150 }, { x: 720, y: 150 }, { x: 400, y: 150 }, { x: 880, y: 150 },
    ],
    itemSpawn: { minX: 220, maxX: 1060, y: -40 },
    decor: [
      { type: 'arvore', x: 225, y: 530 }, { type: 'arvore', x: 1055, y: 530 },
      { type: 'estandarte', x: 330, y: 530, el: 'fogo' }, { type: 'estandarte', x: 950, y: 530, el: 'agua' },
      { type: 'estandarte', x: 640, y: 330, el: 'ar' },
      { type: 'poste', x: 470, y: 330 }, { type: 'poste', x: 810, y: 330 },
      { type: 'varal', x: 250, y: 410, x2: 470, y2: 262 }, { type: 'varal', x: 810, y: 262, x2: 1030, y2: 410 },
      { type: 'ponte', x: 520, y: 530, dir: 1 }, { type: 'ponte', x: 760, y: 530, dir: -1 },
      { type: 'flores', x: 420, y: 530 }, { type: 'pedras', x: 480, y: 530 }, { type: 'cogumelos', x: 270, y: 530 },
      { type: 'flores', x: 860, y: 530 }, { type: 'arbusto', x: 1000, y: 530 }, { type: 'cogumelos', x: 790, y: 530 },
      { type: 'feno', x: 400, y: 530 },
    ],
    theme: { skyTop: '#4a9be8', skyBottom: '#cfeeff', haze: '#ffffff' },
  },

  // Lago congelado numa noite de neve com aurora boreal. O meio é gelo
  // (escorrega: demora para parar e para virar); as margens são de neve
  // (firmes). No centro tem um buraco no gelo com água (só a Água nada).
  gelo: {
    id: 'gelo',
    name: 'Lago Congelado',
    art: 'gelo',
    lake: true,   // gelo que racha, plataformas que derretem, nevasca, pingentes e bolas de neve (shared/lake.js)
    width: 1280,
    height: 720,
    blast: { left: -260, right: 1540, top: -560, bottom: 1000 },
    solids: [
      // vão até bem embaixo (y 1700): ninguém passa por baixo do mapa
      { x: 90, y: 530, w: 240, h: 1170 },               // margem de neve (esquerda)
      { x: 330, y: 530, w: 620, h: 1170, ice: true },   // gelo (lago inteiro congelado)
      { x: 950, y: 530, w: 240, h: 1170 },              // margem de neve (direita)
    ],
    platforms: [
      { x: 230, y: 395, w: 200, ice: true },
      { x: 850, y: 395, w: 200, ice: true },
      { x: 530, y: 268, w: 220, ice: true },
    ],
    hazards: [],
    spawns: [
      { x: 170, y: 530 }, { x: 1110, y: 530 }, { x: 420, y: 530 }, { x: 860, y: 530 },
      { x: 560, y: 530 }, { x: 720, y: 530 },
      { x: 330, y: 395 }, { x: 950, y: 395 },
    ],
    respawns: [
      { x: 560, y: 150 }, { x: 720, y: 150 }, { x: 400, y: 150 }, { x: 880, y: 150 },
    ],
    itemSpawn: { minX: 140, maxX: 1140, y: -40 },
    decor: [],
    theme: { skyTop: '#060c24', skyBottom: '#1c2f5a', haze: '#a8c8ff' },
  },

  // Coliseu romano no fim da tarde: palco de pedra sobre o fosso, colunas
  // quebradas como plataformas e a torcida na arquibancada, que joga as
  // armas. Morte súbita: depois de 2:30 de luta o palco se abre (sobram dois
  // pedaços e a laje do alto) e sobem paredes de espinhos que matam.
  coliseu: {
    id: 'coliseu',
    name: 'Coliseu',
    art: 'coliseu',
    width: 1280,
    height: 720,
    blast: { left: -260, right: 1540, top: -560, bottom: 1000 },
    solids: [{ x: 200, y: 520, w: 880, h: 200 }],
    platforms: [
      { x: 285, y: 395, w: 150 },
      { x: 845, y: 395, w: 150 },
      { x: 560, y: 285, w: 160 },
    ],
    hazards: [],
    // walls = face de dentro das paredes de espinhos (esquerda, direita);
    // keep = pedaços do palco que não caem; dropPlatforms = índices das
    // plataformas que caem; warn = segundos de aviso antes
    suddenDeath: { start: 150, warn: 5, walls: [70, 1210], keep: [[330, 530], [750, 950]], dropPlatforms: [0, 1] },
    // a torcida joga as armas (de fora da tela, dos dois lados)
    itemThrow: { from: [-80, 1360], y: 330, time: 1.3 },
    spawns: [
      { x: 330, y: 520 }, { x: 950, y: 520 }, { x: 440, y: 520 }, { x: 840, y: 520 },
      { x: 540, y: 520 }, { x: 740, y: 520 }, { x: 260, y: 520 }, { x: 1020, y: 520 },
    ],
    // reaparece em cima dos pedaços que não caem na morte súbita
    respawns: [
      { x: 430, y: 150 }, { x: 850, y: 150 }, { x: 640, y: 150 }, { x: 430, y: 150 },
    ],
    itemSpawn: { minX: 240, maxX: 1040, y: -40 },
    decor: [],
    theme: { skyTop: '#3a2a6a', skyBottom: '#ffb070', haze: '#ffcf9a' },
  },

  // Navio Voador: dois navios piratas voando lado a lado acima das nuvens,
  // com um vão no meio (dá para atravessar pulando). Os navios sobem e
  // descem e os mastros balançam (shared/ship.js). Perto do tombadilho de
  // cada navio fica um canhão que atira em arco por cima do vão: a bala cai
  // no tombadilho do outro navio e explode.
  navio: {
    id: 'navio',
    name: 'Navio Voador',
    art: 'navio',
    width: 1280,
    height: 720,
    blast: { left: -260, right: 1540, top: -560, bottom: 1000 },
    // o casco é redondo embaixo: o sólido segue a curva em fatias (sem
    // parede invisível do lado de fora da curva)
    solids: [...shipSolids(0), ...shipSolids(1)],
    platforms: [
      { x: 227, y: 326, w: 216, ship: 0 },   // verga (esquerda)
      { x: 289, y: 196, w: 92, ship: 0 },    // gávea (esquerda)
      { x: 837, y: 326, w: 216, ship: 1 },   // verga (direita)
      { x: 899, y: 196, w: 92, ship: 1 },    // gávea (direita)
    ],
    // cada navio: altura do convés, mastro, canhão e onde a bala dele cai
    ships: [
      { deckY: 500, poopY: 436, stern: 70, bow: 560, mast: 335, cannon: { x: 228, dir: 1 }, target: { x: 1150, y: 436 } },
      { deckY: 500, poopY: 436, stern: 1210, bow: 720, mast: 945, cannon: { x: 1052, dir: -1 }, target: { x: 130, y: 436 } },
    ],
    hazards: [],
    spawns: [
      { x: 300, y: 500 }, { x: 980, y: 500 }, { x: 420, y: 500 }, { x: 860, y: 500 },
      { x: 130, y: 436 }, { x: 1150, y: 436 }, { x: 500, y: 500 }, { x: 780, y: 500 },
    ],
    respawns: [
      { x: 400, y: 150 }, { x: 880, y: 150 }, { x: 300, y: 150 }, { x: 980, y: 150 },
    ],
    itemSpawn: { minX: 120, maxX: 1160, y: -40 },
    decor: [],
    theme: { skyTop: '#24366e', skyBottom: '#ffcf8f', haze: '#ffd9b0' },
  },
};

export const DEFAULT_MAP = 'caldeira';

export function getMap(id = DEFAULT_MAP) {
  const map = MAPS[id] ?? HILL_MAPS[id] ?? TUTORIAL_MAPS[id] ?? TOWER_MAPS[id];
  if (!map) throw new Error(`Mapa desconhecido: ${id}`);
  return map;
}

// Limites do "palco principal" (união dos blocos sólidos). Usado pelos bots
// para saber onde é seguro ficar.
export function stageBounds(map) {
  let left = Infinity, right = -Infinity, top = Infinity;
  for (const s of map.solids) {
    left = Math.min(left, s.x);
    right = Math.max(right, s.x + s.w);
    top = Math.min(top, s.y);
  }
  return { left, right, top, centerX: (left + right) / 2 };
}
