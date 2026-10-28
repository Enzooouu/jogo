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

export const MAPS = {
  caldeira: {
    id: 'caldeira',
    name: 'Caldeira',
    width: 1280,
    height: 720,
    blast: { left: -180, right: 1460, top: -520, bottom: 860 },
    solids: [
      { x: 180, y: 540, w: 150, h: 80 },
      { x: 330, y: 572, w: 140, h: 48 },   // fundo da piscina de lava
      { x: 470, y: 540, w: 340, h: 80 },
      { x: 810, y: 572, w: 140, h: 48 },   // fundo da piscina de água
      { x: 950, y: 540, w: 150, h: 80 },
    ],
    platforms: [
      { x: 250, y: 420, w: 220 },
      { x: 810, y: 420, w: 220 },
      { x: 540, y: 315, w: 200 },
    ],
    hazards: [
      { type: 'lava', x: 330, y: 550, w: 140, h: 22 },
      { type: 'agua', x: 810, y: 550, w: 140, h: 22 },
    ],
    // near = perigo ao lado do ponto (quem morre nele nasce em outro lugar)
    spawns: [
      { x: 230, y: 540, near: 'lava' }, { x: 1050, y: 540, near: 'agua' },
      { x: 590, y: 540 }, { x: 690, y: 540 },
      { x: 360, y: 420, near: 'lava' }, { x: 920, y: 420, near: 'agua' },
      { x: 590, y: 315 }, { x: 690, y: 315 },
    ],
    respawns: [
      { x: 580, y: 160 }, { x: 700, y: 160 }, { x: 640, y: 110 },
    ],
    itemSpawn: { minX: 220, maxX: 1060, y: -40 },
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
