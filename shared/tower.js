// Modo Torre (sobrevivência): você sobe andar por andar. No andar 0 o bot é
// muito burro; a cada andar ele fica mais esperto, até virar um gênio no
// andar 10. Depois disso a torre continua para sempre: aparecem mais bots e
// eles ganham mais vidas. Suas vidas e seu dano continuam de um andar para
// o outro; perdeu, a torre acaba e o recorde fica guardado.

export const TOWER = {
  geniusFloor: 10,     // andar em que o bot vira gênio
  startLives: 3,
  maxLives: 3,
  lifeEvery: 5,        // a cada 5 andares vencidos ganha 1 vida (até o máximo)
  heal: 0.5,           // ao vencer um andar, recupera metade do dano
  timeLimit: 180,      // segundos por andar
};

// Cérebro do bot: do "muito burro" (t = 0) ao gênio (t = 1)
const DUMB = { thinkEvery: 30, attackChance: 0.08, reflex: 0.45, itemGreed: 0.1 };
const GENIUS = { thinkEvery: 3, attackChance: 2, reflex: 1, itemGreed: 1 };

const lerp = (a, b, t) => a + (b - a) * t;

export function botBrain(floor) {
  // sobe devagar nos primeiros andares e mais rápido perto do gênio
  const t = Math.min(1, Math.max(0, floor / TOWER.geniusFloor)) ** 1.6;
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
  let name = LEVELS[0][1];
  for (const [f, n] of LEVELS) if (floor >= f) name = n;
  return name;
}

// Quantos bots e quantas vidas cada um tem
export function floorFoes(floor) {
  const bots = floor <= TOWER.geniusFloor ? 1 : floor <= 20 ? 2 : 3;
  const lives = floor <= 25 ? 1 : Math.min(3, 1 + Math.floor((floor - 16) / 10));
  return { bots, lives };
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
