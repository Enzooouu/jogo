// Teclas escolhidas pelo jogador: cada movimento tem uma tecla principal
// (obrigatória) e uma extra (pode ficar vazia). Fica salvo no navegador.
// Botões do mouse: 'Mouse0' (esquerdo), 'Mouse1' (meio), 'Mouse2' (direito).

const STORAGE_KEY = 'brawl.teclas';

// Movimentos que dá para trocar, na ordem da tela de controles
export const ACTIONS = [
  { id: 'left', name: 'Andar para a esquerda' },
  { id: 'right', name: 'Andar para a direita' },
  { id: 'up', name: 'Pular' },
  { id: 'down', name: 'Descer / cair rápido' },
  { id: 'attack', name: 'Atacar' },
  { id: 'throw', name: 'Lançar a arma' },
  { id: 'dash', name: 'Dash' },
];

export const DEFAULT_BINDINGS = {
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  up: ['KeyW', 'Space'],
  down: ['KeyS', 'ArrowDown'],
  attack: ['Mouse0', 'KeyJ'],
  throw: ['Mouse2', 'KeyK'],
  dash: ['ShiftLeft', 'KeyL'],
};

// Teclas que já têm outra função no jogo e não podem ser usadas
export const RESERVED = { Escape: 'pausar', Tab: 'placar', KeyM: 'som' };

export function cloneBindings(b) {
  return Object.fromEntries(Object.entries(b).map(([k, v]) => [k, [...v]]));
}

// Lê do navegador; se estiver faltando ou estragado, usa o padrão
export function loadBindings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (isValid(saved)) return saved;
  } catch {
    // sem armazenamento ou dado estragado: usa o padrão
  }
  return cloneBindings(DEFAULT_BINDINGS);
}

export function saveBindings(b) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(b));
  } catch {
    // navegação privada: vale só até fechar a página
  }
}

function isValid(b) {
  if (!b || typeof b !== 'object') return false;
  const used = new Set();
  for (const { id } of ACTIONS) {
    const slot = b[id];
    if (!Array.isArray(slot) || slot.length !== 2 || typeof slot[0] !== 'string' || !slot[0]) return false;
    for (const code of slot) {
      if (code === null) continue;
      if (typeof code !== 'string' || used.has(code) || RESERVED[code]) return false;
      used.add(code);
    }
  }
  return true;
}

// Formato que o KeyboardController usa: { ação: [teclas] }
export function keymapFrom(b) {
  return Object.fromEntries(ACTIONS.map(({ id }) => [id, b[id].filter(Boolean)]));
}

// Coloca `code` no espaço `slot` (0 = principal, 1 = extra) do movimento
// `action`. Se a tecla já estava em outro movimento, os dois trocam (assim
// nenhum movimento fica sem tecla). Devolve { ok, bindings, message }.
export function assignKey(bindings, action, slot, code) {
  if (RESERVED[code]) return { ok: false, bindings, message: `Essa tecla já serve para ${RESERVED[code]}.` };
  const b = cloneBindings(bindings);
  const old = b[action][slot];
  if (old === code) return { ok: true, bindings: b, message: '' };
  let message = '';
  for (const { id, name } of ACTIONS) {
    const i = b[id].indexOf(code);
    if (i === -1 || (id === action && i === slot)) continue;
    b[id][i] = old ?? null;
    // a principal nunca fica vazia: a extra sobe para o lugar dela
    if (b[id][0] === null) {
      b[id][0] = b[id][1];
      b[id][1] = null;
    }
    if (b[id][0] === null) return { ok: false, bindings, message: `Essa é a única tecla de "${name}".` };
    message = old ? `Trocou com "${name}".` : `Saiu de "${name}".`;
  }
  b[action][slot] = code;
  return { ok: true, bindings: b, message };
}

// Tira a tecla extra (a principal não pode ficar vazia)
export function clearExtra(bindings, action) {
  const b = cloneBindings(bindings);
  b[action][1] = null;
  return b;
}

// Nome curto e bonito de uma tecla
export function keyLabel(code) {
  if (!code) return '—';
  const named = {
    Space: 'Espaço', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
    ShiftLeft: 'Shift esq.', ShiftRight: 'Shift dir.', ControlLeft: 'Ctrl esq.', ControlRight: 'Ctrl dir.',
    AltLeft: 'Alt esq.', AltRight: 'Alt dir.', Enter: 'Enter', Backspace: 'Apagar', CapsLock: 'Caps Lock',
    Mouse0: 'Clique esq.', Mouse1: 'Clique do meio', Mouse2: 'Clique dir.', Mouse3: 'Mouse 4', Mouse4: 'Mouse 5',
    Comma: ',', Period: '.', Slash: '/', Semicolon: 'Ç', Quote: '~', BracketLeft: '´', BracketRight: '[', Backslash: ']',
    Minus: '-', Equal: '=', Backquote: "'", IntlBackslash: '\\', IntlRo: '/',
  };
  if (named[code]) return named[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`;
  return code;
}
