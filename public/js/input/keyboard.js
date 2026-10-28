// Teclado -> comando do jogador (mesmo formato dos bots, ver shared/input.js).

import { makeInput, INPUT_KEYS } from '/shared/input.js';

export const KEYMAP = {
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  up: ['KeyW', 'ArrowUp', 'Space'],
  down: ['KeyS', 'ArrowDown'],
  attack: ['KeyJ', 'KeyZ'],
  throw: ['KeyK', 'KeyX'],
};

export class KeyboardController {
  constructor(keymap = KEYMAP, target = window) {
    this.keymap = keymap;
    this.target = target;
    this.heldCodes = new Set();
    // Tecla apertada e solta entre dois passos da simulação ainda conta.
    this.tapped = new Set();
    this.codeToAction = new Map();
    for (const [action, codes] of Object.entries(keymap)) {
      for (const code of codes) this.codeToAction.set(code, action);
    }
    this.onDown = (e) => {
      const action = this.codeToAction.get(e.code);
      if (!action) return;
      e.preventDefault();
      if (!this.isHeld(action)) this.tapped.add(action);
      this.heldCodes.add(e.code);
    };
    this.onUp = (e) => {
      if (!this.codeToAction.has(e.code)) return;
      e.preventDefault();
      this.heldCodes.delete(e.code);
    };
    this.onBlur = () => this.heldCodes.clear();
    target.addEventListener('keydown', this.onDown);
    target.addEventListener('keyup', this.onUp);
    window.addEventListener('blur', this.onBlur);
  }

  // A ação continua apertada enquanto qualquer tecla dela estiver apertada
  // (ex.: A e ← para esquerda).
  isHeld(action) {
    return this.keymap[action].some((code) => this.heldCodes.has(code));
  }

  getInput() {
    const partial = {};
    for (const key of INPUT_KEYS) partial[key] = this.isHeld(key) || this.tapped.has(key);
    this.tapped.clear();
    return makeInput(partial);
  }

  destroy() {
    this.target.removeEventListener('keydown', this.onDown);
    this.target.removeEventListener('keyup', this.onUp);
    window.removeEventListener('blur', this.onBlur);
  }
}
