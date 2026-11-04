// Controle (gamepad) de Xbox, PlayStation ou genérico, pelo "mapeamento
// padrão" do navegador (Gamepad API). Botões no padrão:
//
//   0 A / ✕     1 B / ◯     2 X / ▢     3 Y / △
//   4 LB / L1   5 RB / R1   6 LT / L2   7 RT / R2
//   8 Select / Share   9 Start / Options   10 L3   11 R3
//   12 ↑  13 ↓  14 ←  15 →  (direcional)
//
// Na luta:  analógico esquerdo ou direcional = andar (para baixo = descer)
//           A ou Y = pular · X = atacar · B = lançar a arma
//           LB, RB, LT ou RT = dash · Start = pausar · Select (segurar) = placar
// Nos menus: direcional/analógico = andar entre as opções · A = confirmar ·
//            B = voltar · Start = confirmar

export const PAD = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, SELECT: 8, START: 9, L3: 10, R3: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };

// botões de cada movimento do boneco
export const PAD_MAP = {
  up: [PAD.A, PAD.Y],
  attack: [PAD.X],
  throw: [PAD.B],
  dash: [PAD.LB, PAD.RB, PAD.LT, PAD.RT],
};

const DEAD = 0.45;        // quanto inclinar o analógico para contar
const REPEAT_FIRST = 0.42; // segurando a direção no menu: espera e repete
const REPEAT_EVERY = 0.14;

// Lê todos os controles ligados juntos (qualquer um serve)
function readPads() {
  const list = navigator.getGamepads ? [...navigator.getGamepads()].filter((p) => p && p.connected) : [];
  const buttons = new Array(17).fill(false);
  let ax = 0;
  let ay = 0;
  for (const p of list) {
    p.buttons.forEach((b, i) => {
      if (i < buttons.length && (b.pressed || b.value > 0.5)) buttons[i] = true;
    });
    const x = p.axes[0] ?? 0;
    const y = p.axes[1] ?? 0;
    if (Math.abs(x) > Math.abs(ax)) ax = x;
    if (Math.abs(y) > Math.abs(ay)) ay = y;
  }
  return { connected: list.length > 0, buttons, ax, ay, name: list[0]?.id ?? '' };
}

// Comando do boneco vindo do controle (mesmo formato do teclado)
export function padMoveInput() {
  const s = readPads();
  if (!s.connected) return null;
  const b = s.buttons;
  const any = (ids) => ids.some((i) => b[i]);
  return {
    left: b[PAD.LEFT] || s.ax < -DEAD,
    right: b[PAD.RIGHT] || s.ax > DEAD,
    down: b[PAD.DOWN] || s.ay > 0.6,
    up: any(PAD_MAP.up),
    attack: any(PAD_MAP.attack),
    throw: any(PAD_MAP.throw),
    dash: any(PAD_MAP.dash),
  };
}

export function padConnected() {
  return readPads().connected;
}

// Laço que fica olhando o controle o tempo todo e avisa quando um botão é
// apertado (e as direções, com repetição se segurar). `onButton(name)`
// recebe: 'up', 'down', 'left', 'right', 'a', 'b', 'x', 'y', 'start',
// 'select', 'l3', 'r3'; `onRelease(name)` só para 'select'.
// `onConnect(connected, name)` quando liga/desliga um controle.
export function watchGamepad({ onButton, onRelease, onConnect }) {
  let prev = new Array(17).fill(false);
  let wasConnected = false;
  let dir = null;
  let dirTime = 0;
  let nextRepeat = 0;
  let last = performance.now();
  const NAMES = { [PAD.A]: 'a', [PAD.B]: 'b', [PAD.X]: 'x', [PAD.Y]: 'y', [PAD.START]: 'start', [PAD.SELECT]: 'select', [PAD.L3]: 'l3', [PAD.R3]: 'r3', [PAD.LB]: 'lb', [PAD.RB]: 'rb' };

  const tick = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const s = readPads();
    if (s.connected !== wasConnected) {
      wasConnected = s.connected;
      onConnect?.(s.connected, s.name);
    }
    if (s.connected) {
      for (const [i, name] of Object.entries(NAMES)) {
        if (s.buttons[i] && !prev[i]) onButton(name);
        if (!s.buttons[i] && prev[i]) onRelease?.(name);
      }
      // direção atual (direcional ou analógico), com repetição
      const b = s.buttons;
      const d = b[PAD.UP] || s.ay < -0.6 ? 'up'
        : b[PAD.DOWN] || s.ay > 0.6 ? 'down'
          : b[PAD.LEFT] || s.ax < -0.6 ? 'left'
            : b[PAD.RIGHT] || s.ax > 0.6 ? 'right' : null;
      if (d !== dir) {
        dir = d;
        dirTime = 0;
        nextRepeat = REPEAT_FIRST;
        if (d) onButton(d);
      } else if (d) {
        dirTime += dt;
        if (dirTime >= nextRepeat) {
          nextRepeat += REPEAT_EVERY;
          onButton(d);
        }
      }
      prev = s.buttons;
    } else {
      prev = new Array(17).fill(false);
      dir = null;
    }
    requestAnimationFrame(tick);
  };
  window.addEventListener('gamepadconnected', () => {}); // alguns navegadores só liberam o controle depois desse evento
  requestAnimationFrame(tick);
}
