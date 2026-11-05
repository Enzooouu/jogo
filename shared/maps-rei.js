// Mapas exclusivos do Rei da Ilha (só aparecem nesse modo, e o modo só usa
// eles). Cada um diz onde a área com a coroa pode aparecer (`hillSpots`):
// { x, y } = meio da área em cima do chão, ou { plat } = em cima daquela
// plataforma.

const BLAST = { left: -260, right: 1540, top: -560, bottom: 1000 };

export const HILL_MAPS = {
  // Pátio de um castelo ao entardecer: duas torres com passarelas nas
  // ameias, o trono no meio do pátio e a sacada lá no alto.
  castelo: {
    id: 'castelo',
    name: 'Castelo do Rei',
    art: 'castelo',
    hillOnly: true,
    width: 1280,
    height: 720,
    blast: BLAST,
    solids: [
      { x: 150, y: 560, w: 980, h: 200 },   // pátio
      { x: 150, y: 410, w: 170, h: 150 },   // torre da esquerda
      { x: 960, y: 410, w: 170, h: 150 },   // torre da direita
      { x: 550, y: 530, w: 180, h: 30 },    // degrau do trono
    ],
    platforms: [
      { x: 320, y: 410, w: 190 },           // passarela da esquerda
      { x: 770, y: 410, w: 190 },           // passarela da direita
      { x: 545, y: 285, w: 190 },           // sacada do rei
    ],
    hazards: [],
    hillSpots: [{ x: 640, y: 530 }, { x: 235, y: 410 }, { x: 1045, y: 410 }, { x: 410, y: 560 }, { x: 870, y: 560 }, { plat: 2 }],
    spawns: [
      { x: 380, y: 560 }, { x: 900, y: 560 }, { x: 460, y: 560 }, { x: 820, y: 560 },
      { x: 300, y: 560 }, { x: 980, y: 560 }, { x: 240, y: 410 }, { x: 1040, y: 410 },
    ],
    respawns: [{ x: 640, y: 150 }, { x: 480, y: 150 }, { x: 800, y: 150 }],
    itemSpawn: { minX: 220, maxX: 1060, y: -40 },
    decor: [],
    theme: { skyTop: '#2a3a7a', skyBottom: '#ffb46a', haze: '#ffd2a0' },
  },

  // Pirâmide em degraus no deserto, ao meio-dia: o topo dourado é o lugar
  // mais disputado; dois blocos de arenito flutuam dos lados.
  piramide: {
    id: 'piramide',
    name: 'Pirâmide do Sol',
    art: 'piramide',
    hillOnly: true,
    width: 1280,
    height: 720,
    blast: BLAST,
    solids: [
      { x: 220, y: 590, w: 840, h: 170 },   // base
      { x: 320, y: 520, w: 640, h: 70 },    // 2º degrau
      { x: 420, y: 450, w: 440, h: 70 },    // 3º degrau
      { x: 540, y: 380, w: 200, h: 70 },    // topo dourado
    ],
    platforms: [
      { x: 60, y: 450, w: 160 },
      { x: 1060, y: 450, w: 160 },
    ],
    hazards: [],
    hillSpots: [{ x: 640, y: 380 }, { x: 370, y: 520 }, { x: 910, y: 520 }, { x: 270, y: 590 }, { x: 1010, y: 590 }, { plat: 0 }, { plat: 1 }],
    spawns: [
      { x: 280, y: 590 }, { x: 1000, y: 590 }, { x: 370, y: 520 }, { x: 910, y: 520 },
      { x: 250, y: 590 }, { x: 1030, y: 590 }, { x: 470, y: 450 }, { x: 810, y: 450 },
    ],
    respawns: [{ x: 640, y: 120 }, { x: 480, y: 150 }, { x: 800, y: 150 }],
    itemSpawn: { minX: 240, maxX: 1040, y: -40 },
    decor: [],
    theme: { skyTop: '#3d8fe0', skyBottom: '#ffe3a8', haze: '#ffe0a0' },
  },
};
