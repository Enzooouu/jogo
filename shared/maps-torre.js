// Mapa do modo Torre: o alto de uma torre de pedra. O chão do andar é o topo
// da torre (cair pelos lados elimina), com uma sacada de madeira de cada lado
// e um patamar de pedra flutuando no meio. O céu muda com o andar (ver
// game.map.towerFloor e public/js/render/stage-torre.js).

export const TOWER_MAPS = {
  torre: {
    id: 'torre',
    name: 'Torre dos Elementos',
    art: 'torre',
    towerOnly: true,
    width: 1280,
    height: 720,
    blast: { left: -380, right: 1660, top: -560, bottom: 1000 },
    solids: [{ x: 250, y: 560, w: 780, h: 200 }],  // topo da torre
    platforms: [
      { x: 100, y: 430, w: 200 },   // sacada da esquerda
      { x: 980, y: 430, w: 200 },   // sacada da direita
      { x: 505, y: 320, w: 270 },   // patamar do meio
    ],
    hazards: [],
    spawns: [
      // esquerda (você e o parceiro na Torre em dupla) e direita (bots)
      { x: 380, y: 560 }, { x: 900, y: 560 }, { x: 300, y: 560 }, { x: 980, y: 560 },
      { x: 470, y: 560 }, { x: 810, y: 560 },
    ],
    respawns: [{ x: 640, y: 140 }, { x: 520, y: 140 }, { x: 760, y: 140 }],
    itemSpawn: { minX: 280, maxX: 1000, y: -40 },
    decor: [],
    theme: { skyTop: '#4a9be8', skyBottom: '#cfeeff', haze: '#ffffff' },
  },
};
