// Formato único de comando de um jogador em um passo da simulação.
// Teclado, bots e (no futuro) jogadores remotos via WebSocket produzem
// exatamente este objeto. É pequeno de propósito, para trafegar pela rede.

export const INPUT_KEYS = ['left', 'right', 'up', 'down', 'attack', 'throw'];

export const EMPTY_INPUT = Object.freeze({
  left: false, right: false, up: false, down: false, attack: false, throw: false,
});

export function makeInput(partial = {}) {
  const input = { ...EMPTY_INPUT };
  for (const key of INPUT_KEYS) input[key] = Boolean(partial[key]);
  return input;
}

// Compacta em um número (1 bit por botão) para mandar pela rede.
export function encodeInput(input) {
  let bits = 0;
  INPUT_KEYS.forEach((key, i) => { if (input[key]) bits |= 1 << i; });
  return bits;
}

export function decodeInput(bits) {
  const input = { ...EMPTY_INPUT };
  INPUT_KEYS.forEach((key, i) => { input[key] = (bits & (1 << i)) !== 0; });
  return input;
}
