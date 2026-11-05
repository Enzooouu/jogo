// Mapas exclusivos do Rei da Ilha (só aparecem nesse modo, e o modo só usa
// eles). Cada um diz onde a área com a coroa pode aparecer (`hillSpots`):
// { x, y } = meio da área em cima do chão, ou { plat } = em cima daquela
// plataforma.

const BLAST = { left: -260, right: 1540, top: -560, bottom: 1000 };

// Rampa: o jogo só tem blocos retos, então a rampa é feita de degrauzinhos
// de 4 px (o lutador sobe sozinho degraus de até 10 px e "gruda" no chão ao
// descer, então anda liso). Vai de (x0, y0) a (x1, y1); o desenho é uma
// rampa lisa por cima. Os degraus mais baixos vêm primeiro (importante para
// subir correndo ou de dash).
export function rampSteps(x0, y0, x1, y1, bottom, stepH = 4) {
  const out = [];
  const n = Math.max(1, Math.round(Math.abs(y1 - y0) / stepH));
  for (let i = 0; i < n; i++) {
    // degrau i fica entre os pontos i e i+1 da rampa; a altura dele é a do
    // meio desse pedaço, então a linha da rampa passa no meio do degrau
    const k0 = i / n;
    const k1 = (i + 1) / n;
    const top = Math.round(y0 + ((y1 - y0) * (k0 + k1)) / 2);
    const xa = x0 + (x1 - x0) * k0;
    // cada degrau vai do começo dele até o pé do alto da rampa (sem frestas)
    const left = Math.round(Math.min(xa, x1));
    const right = Math.round(Math.max(xa, x1));
    out.push({ x: left, y: top, w: Math.max(1, right - left), h: bottom - top, ramp: true });
  }
  // de baixo para cima
  return out.sort((a, b) => b.y - a.y);
}

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

  // Pirâmide no deserto, ao meio-dia: duas rampas lisas sobem até o topo de
  // ouro (o lugar mais disputado); dois blocos de arenito flutuam dos lados.
  piramide: {
    id: 'piramide',
    name: 'Pirâmide do Sol',
    art: 'piramide',
    hillOnly: true,
    width: 1280,
    height: 720,
    blast: BLAST,
    // desenho: chão de 200 a 1080 em y 600, rampas de 270→540 e 740→1010, topo em y 410
    pyramid: { left: 200, right: 1080, ground: 600, rampL: [270, 540], rampR: [740, 1010], top: 410 },
    solids: [
      { x: 200, y: 600, w: 880, h: 160 },   // chão da base
      { x: 540, y: 410, w: 200, h: 190 },   // topo de ouro
      ...rampSteps(270, 600, 540, 410, 600),
      ...rampSteps(1010, 600, 740, 410, 600),
    ],
    platforms: [
      { x: 50, y: 470, w: 160 },
      { x: 1070, y: 470, w: 160 },
    ],
    hazards: [],
    hillSpots: [
      { x: 640, y: 410 },
      { x: 400, y: 565, fixed: true },     // meio da rampa da esquerda
      { x: 880, y: 565, fixed: true },     // meio da rampa da direita
      { x: 220, y: 600 }, { x: 1060, y: 600 },
      { plat: 0 }, { plat: 1 },
    ],
    spawns: [
      { x: 240, y: 600 }, { x: 1040, y: 600 }, { x: 320, y: 600 }, { x: 960, y: 600 },
      { x: 220, y: 600 }, { x: 1060, y: 600 }, { x: 600, y: 410 }, { x: 680, y: 410 },
    ],
    respawns: [{ x: 640, y: 120 }, { x: 480, y: 150 }, { x: 800, y: 150 }],
    itemSpawn: { minX: 240, maxX: 1040, y: -40 },
    decor: [],
    theme: { skyTop: '#3d8fe0', skyBottom: '#ffe3a8', haze: '#ffe0a0' },
  },
};
