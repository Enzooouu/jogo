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

// Plataforma pendurada em balão (Pico dos Ventos)
const SWING = { length: 130, push: 3.2, wind: 0.9, gravity: 620, damping: 0.6, maxAngle: 1.15 };

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
    width: 1280,
    height: 720,
    blast: { left: -260, right: 1540, top: -560, bottom: 1000 },
    solids: [
      { x: 150, y: 530, w: 180, h: 190 },               // margem de neve (esquerda)
      { x: 330, y: 530, w: 280, h: 190, ice: true },    // gelo
      { x: 610, y: 562, w: 60, h: 158 },                // fundo do buraco no gelo
      { x: 670, y: 530, w: 280, h: 190, ice: true },    // gelo
      { x: 950, y: 530, w: 180, h: 190 },               // margem de neve (direita)
    ],
    platforms: [
      { x: 390, y: 400, w: 150, ice: true },
      { x: 740, y: 400, w: 150, ice: true },
      { x: 565, y: 290, w: 150, ice: true },
    ],
    hazards: [
      { type: 'agua', x: 610, y: 540, w: 60, h: 22 },
    ],
    spawns: [
      { x: 230, y: 530 }, { x: 1050, y: 530 }, { x: 420, y: 530 }, { x: 860, y: 530 },
      { x: 540, y: 530, near: 'agua' }, { x: 740, y: 530, near: 'agua' },
      { x: 465, y: 400 }, { x: 815, y: 400 },
    ],
    respawns: [
      { x: 560, y: 150 }, { x: 720, y: 150 }, { x: 400, y: 150 }, { x: 880, y: 150 },
    ],
    itemSpawn: { minX: 200, maxX: 1080, y: -40 },
    decor: [],
    theme: { skyTop: '#060c24', skyBottom: '#1c2f5a', haze: '#a8c8ff' },
  },

  // Coliseu romano no fim da tarde: palco de pedra sobre o fosso, colunas
  // quebradas como plataformas e a torcida na arquibancada. Morte súbita:
  // depois de 2:30 de luta, paredes de espinhos fecham dos dois lados.
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
    // paredes de espinhos: posição da face de dentro (esquerda, direita), de
    // onde saem até onde chegam; `top` = chão do palco, `height` = altura da
    // parede acima dele; `warn` = segundos de aviso antes
    closingWalls: { start: 150, end: 215, warn: 5, from: [200, 1080], to: [470, 810], top: 520, height: 70 },
    spawns: [
      { x: 330, y: 520 }, { x: 950, y: 520 }, { x: 440, y: 520 }, { x: 840, y: 520 },
      { x: 540, y: 520 }, { x: 740, y: 520 }, { x: 260, y: 520 }, { x: 1020, y: 520 },
    ],
    // reaparece sempre no meio (fica dentro das paredes quando elas fecham)
    respawns: [
      { x: 560, y: 150 }, { x: 720, y: 150 }, { x: 600, y: 120 }, { x: 680, y: 120 },
    ],
    itemSpawn: { minX: 240, maxX: 1040, y: -40 },
    decor: [],
    theme: { skyTop: '#3a2a6a', skyBottom: '#ffb070', haze: '#ffcf9a' },
  },
};

export const DEFAULT_MAP = 'caldeira';

export function getMap(id = DEFAULT_MAP) {
  const map = MAPS[id] ?? TUTORIAL_MAPS[id];
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
