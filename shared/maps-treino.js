// Arenas do tutorial (Campo de Treino): grama, de dia. Uma arena para cada
// lição (ver shared/tutorial.js). Não aparecem na escolha de mapa.

export const GROUND = 560;

// Arena de treino: completa os campos que todo mapa precisa
function arena(id, opts) {
  return {
    id,
    name: 'Campo de Treino',
    art: 'treino',
    tutorial: true,
    width: 1280,
    height: 720,
    blast: { left: -500, right: 1780, top: -700, bottom: 1000 },
    platforms: [],
    hazards: [],
    spawns: [{ x: 300, y: GROUND }, { x: 980, y: GROUND }],
    respawns: [{ x: 640, y: 150 }],
    itemSpawn: { minX: 200, maxX: 1080, y: -40 },
    decor: [],
    theme: { skyTop: '#4a9be8', skyBottom: '#cfeeff', haze: '#ffffff' },
    ...opts,
  };
}

const floor = (x, w, y = GROUND) => ({ x, y, w, h: 760 - y });

export const TUTORIAL_MAPS = {
  'treino-andar': arena('treino-andar', {
    solids: [floor(80, 1120)],
    decor: [{ type: 'placa', x: 150 }, { type: 'arbusto', x: 460 }, { type: 'flores', x: 760 }, { type: 'arvore', x: 1170 }],
  }),
  'treino-pular': arena('treino-pular', {
    solids: [floor(80, 1120), { x: 430, y: 470, w: 120, h: 90 }, { x: 780, y: 350, w: 420, h: 210 }],
    decor: [{ type: 'flores', x: 250 }, { type: 'arbusto', x: 900, y: 350 }],
  }),
  'treino-descer': arena('treino-descer', {
    solids: [floor(80, 1120)],
    platforms: [{ x: 440, y: 410, w: 400 }, { x: 440, y: 260, w: 400 }],
    decor: [{ type: 'arvore', x: 200 }, { type: 'feno', x: 1040 }],
  }),
  'treino-dash': arena('treino-dash', {
    solids: [floor(80, 440), floor(980, 220)],
    decor: [{ type: 'placa', x: 150 }, { type: 'flores', x: 360 }],
  }),
  'treino-parede': arena('treino-parede', {
    solids: [floor(80, 460, 220), floor(540, 200, 600), floor(740, 460, 220)],
    respawns: [{ x: 640, y: 600 }],
    decor: [{ type: 'arvore', x: 200, y: 220 }, { type: 'arbusto', x: 1150, y: 220 }],
  }),
  'treino-campo': arena('treino-campo', {
    solids: [floor(80, 1120)],
    decor: [{ type: 'feno', x: 140 }, { type: 'arvore', x: 1170 }, { type: 'flores', x: 520 }],
  }),
  'treino-perigos': arena('treino-perigos', {
    solids: [
      floor(80, 240), { x: 320, y: 592, w: 140, h: 168 },
      floor(460, 240), { x: 700, y: 592, w: 140, h: 168 },
      floor(840, 360),
    ],
    hazards: [
      { type: 'lava', x: 320, y: 570, w: 140, h: 22 },
      { type: 'agua', x: 700, y: 570, w: 140, h: 22 },
      { type: 'espinhos', x: 930, y: 548, w: 90, h: 12 },
    ],
    wind: {
      first: 1.5, every: [3, 4.5], warn: 1, active: 2.5, max: 1,
      w: 200, h: 150, strength: 300,
      surfaces: [{ y: GROUND, x0: 470, x1: 690 }],
    },
    decor: [{ type: 'placa', x: 150 }],
  }),
  'treino-voltar': arena('treino-voltar', {
    solids: [{ x: 440, y: 520, w: 400, h: 170 }],
    blast: { left: -700, right: 1980, top: -700, bottom: 1000 },
    decor: [{ type: 'arvore', x: 480, y: 520 }, { type: 'flores', x: 760, y: 520 }],
  }),
  'treino-final': arena('treino-final', {
    solids: [{ x: 200, y: 540, w: 880, h: 180 }],
    platforms: [{ x: 300, y: 420, w: 200 }, { x: 780, y: 420, w: 200 }, { x: 540, y: 310, w: 200 }],
    spawns: [{ x: 320, y: 540 }, { x: 960, y: 540 }],
    respawns: [{ x: 560, y: 150 }, { x: 720, y: 150 }],
    itemSpawn: { minX: 260, maxX: 1020, y: -40 },
    decor: [{ type: 'arvore', x: 240, y: 540 }, { type: 'feno', x: 1030, y: 540 }],
  }),
};

