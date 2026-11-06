// Modo Torre (sobrevivência): você sobe andar por andar. A torre anda em
// ciclos de 10 andares; em cada ciclo os bots começam burros e terminam gênios:
//   andares 0–10   1 bot   (muito burro no 0 → gênio no 10)
//   andares 11–20  2 bots  (burros no 11 → gênios no 20)
//   andares 21–30  3 bots  (burros no 21 → gênios no 30)
//   andares 31+    3 bots, e a cada ciclo eles ganham mais 1 vida (até 3)
// Suas vidas e seu dano continuam de um andar para o outro; perdeu, a torre
// acaba e o recorde fica guardado.

export const TOWER = {
  geniusFloor: 10,     // andar em que o bot vira gênio
  startLives: 3,
  maxLives: 3,
  lifeEvery: 5,        // a cada 5 andares vencidos ganha 1 vida (até o máximo)
  heal: 0.5,           // ao vencer um andar, recupera metade do dano
  timeLimit: 180,      // segundos por andar
  spaceFloor: 51,      // do andar 51 em diante é o espaço...
  spaceGravity: 0.78,  // ...com a gravidade mais leve
};

export const gravityFor = (floor) => (floor >= TOWER.spaceFloor ? TOWER.spaceGravity : 1);

// Cérebro do bot: do "muito burro" (t = 0) ao gênio (t = 1)
const DUMB = { thinkEvery: 30, attackChance: 0.08, reflex: 0.45, itemGreed: 0.1 };
const GENIUS = { thinkEvery: 3, attackChance: 2, reflex: 1, itemGreed: 1 };

const lerp = (a, b, t) => a + (b - a) * t;

// Em que ciclo o andar está e em que degrau (0 = mais burro, 10 = gênio)
export function floorStep(floor) {
  if (floor <= TOWER.geniusFloor) return { cycle: 0, step: floor };
  const cycle = Math.floor((floor - 1) / TOWER.geniusFloor);
  return { cycle, step: floor - cycle * TOWER.geniusFloor };
}

export function botBrain(floor) {
  const { step } = floorStep(floor);
  // sobe devagar nos primeiros degraus e mais rápido perto do gênio
  const t = Math.min(1, Math.max(0, step / TOWER.geniusFloor)) ** 1.6;
  return {
    thinkEvery: Math.round(lerp(DUMB.thinkEvery, GENIUS.thinkEvery, t)),
    attackChance: lerp(DUMB.attackChance, GENIUS.attackChance, t),
    reflex: lerp(DUMB.reflex, GENIUS.reflex, t),
    itemGreed: lerp(DUMB.itemGreed, GENIUS.itemGreed, t),
  };
}

const LEVELS = [
  [0, 'Muito burro'], [1, 'Burro'], [3, 'Fraco'], [5, 'Esperto'], [7, 'Muito esperto'], [9, 'Quase gênio'], [10, 'Gênio'],
];

export function brainName(floor) {
  const { step } = floorStep(floor);
  let name = LEVELS[0][1];
  for (const [f, n] of LEVELS) if (step >= f) name = n;
  return name;
}

// Quantos bots e quantas vidas cada um tem
export function floorFoes(floor) {
  const { cycle } = floorStep(floor);
  return { bots: Math.min(3, cycle + 1), lives: Math.min(3, 1 + Math.max(0, cycle - 2)) };
}

// Como você começa o próximo andar depois de vencer o andar `floor`
export function carryAfterWin(floor, { lives, damage }) {
  const cleared = floor + 1;
  const bonus = cleared % TOWER.lifeEvery === 0 ? 1 : 0;
  return {
    lives: Math.min(TOWER.maxLives, lives + bonus),
    damage: Math.round(damage * (1 - TOWER.heal)),
    gotLife: bonus > 0 && lives < TOWER.maxLives,
  };
}

// XP de uma subida: cada andar vencido vale mais quanto mais alto
export function towerXp(floorsCleared, kills) {
  let xp = 0;
  for (let f = 0; f < floorsCleared; f++) xp += 30 + 5 * Math.min(f, 20);
  return xp + kills * 15;
}
