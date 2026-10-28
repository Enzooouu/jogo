// Teclado e mouse -> comando do jogador (mesmo formato dos bots, ver shared/input.js).
// Botões do mouse entram no mapa como 'Mouse0' (esquerdo) e 'Mouse2' (direito).

import { makeInput, INPUT_KEYS } from '/shared/input.js';

export const KEYMAP = {
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  up: ['KeyW', 'ArrowUp', 'Space'],
  down: ['KeyS', 'ArrowDown'],
  attack: ['Mouse0', 'KeyJ', 'KeyZ'],
  throw: ['Mouse2', 'KeyK', 'KeyX'],
  dash: ['ShiftLeft', 'ShiftRight', 'KeyL'],
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
    this.press = (code, e) => {
      const action = this.codeToAction.get(code);
      if (!action) return;
      e.preventDefault();
      if (!this.isHeld(action)) this.tapped.add(action);
      this.heldCodes.add(code);
    };
    this.release = (code, e) => {
      if (!this.codeToAction.has(code)) return;
      e.preventDefault();
      this.heldCodes.delete(code);
    };
    this.onDown = (e) => this.press(e.code, e);
    this.onUp = (e) => this.release(e.code, e);
    // Cliques em botões (ex.: menu de pausa) não contam como ataque.
    this.onMouseDown = (e) => { if (!e.target.closest?.('button')) this.press(`Mouse${e.button}`, e); };
    this.onMouseUp = (e) => this.release(`Mouse${e.button}`, e);
    this.onContextMenu = (e) => e.preventDefault();   // botão direito não abre o menu do navegador
    this.onBlur = () => this.heldCodes.clear();
    target.addEventListener('keydown', this.onDown);
    target.addEventListener('keyup', this.onUp);
    target.addEventListener('mousedown', this.onMouseDown);
    target.addEventListener('mouseup', this.onMouseUp);
    target.addEventListener('contextmenu', this.onContextMenu);
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
    this.target.removeEventListener('mousedown', this.onMouseDown);
    this.target.removeEventListener('mouseup', this.onMouseUp);
    this.target.removeEventListener('contextmenu', this.onContextMenu);
    window.removeEventListener('blur', this.onBlur);
  }
}
