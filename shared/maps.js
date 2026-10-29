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
};

export const DEFAULT_MAP = 'caldeira';

export function getMap(id = DEFAULT_MAP) {
  const map = MAPS[id];
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
