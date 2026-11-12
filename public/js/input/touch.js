// Controles de toque (celular e tablet): joystick do lado esquerdo e
// botões do lado direito (bater, jogar a arma, dash e pular).
//
// O joystick aparece onde o dedo encostar na metade esquerda da tela e segue
// o dedo (dá para andar e descer). Cada botão funciona com vários dedos ao
// mesmo tempo (ex.: andando e batendo).

const STATE = { left: false, right: false, down: false, up: false, attack: false, throw: false, dash: false };
const tapped = new Set();   // apertou e soltou entre dois passos do jogo
let active = false;          // os controles estão na tela agora

// Comando vindo do toque (mesmo formato do teclado), ou null se desligado
export function touchMoveInput() {
  if (!active) return null;
  const out = { ...STATE };
  for (const k of tapped) out[k] = true;
  tapped.clear();
  return out;
}

// Celular/tablet: o jeito principal de mexer é o dedo. Computadores que só
// "aceitam" toque (notebook com tela de toque, Chromebook da escola) usam
// mouse/trackpad como principal e não entram no modo toque sozinhos (se a
// pessoa encostar na tela, o main.js liga o modo toque na hora).
export function isTouchDevice() {
  return Boolean(window.matchMedia?.('(pointer: coarse)').matches && !window.matchMedia?.('(any-pointer: fine)').matches)
    || Boolean(window.matchMedia?.('(pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 820);
}

// tela de celular (para pedir para girar): o lado menor da tela é pequeno
export function isPhoneScreen() {
  return Math.min(screen.width, screen.height) <= 820;
}

const RADIUS = 56;     // até onde o pino do joystick anda
const DEAD = 0.3;      // inclinação mínima para andar

export class TouchControls {
  constructor(root, { onPause, onScores } = {}) {
    this.root = root;
    this.stick = root.querySelector('.tc-stick');
    this.base = root.querySelector('.tc-base');
    this.knob = root.querySelector('.tc-knob');
    this.stickId = null;
    this.home = null;

    // joystick: o dedo que encostar na área da esquerda
    const zone = root.querySelector('.tc-zone');
    zone.addEventListener('pointerdown', (e) => {
      if (this.stickId !== null) return;
      e.preventDefault();
      this.stickId = e.pointerId;
      zone.setPointerCapture?.(e.pointerId);
      const r = zone.getBoundingClientRect();
      // a base nasce onde o dedo encostou (sem sair muito da borda)
      this.home = {
        x: Math.max(RADIUS + 14, Math.min(r.width - RADIUS - 14, e.clientX - r.left)),
        y: Math.max(RADIUS + 14, Math.min(r.height - RADIUS - 14, e.clientY - r.top)),
        left: r.left,
        top: r.top,
      };
      this.base.style.left = `${this.home.x}px`;
      this.base.style.top = `${this.home.y}px`;
      this.stick.classList.add('on');
      this.moveStick(e);
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.stickId) this.moveStick(e);
    });
    const endStick = (e) => {
      if (e.pointerId !== this.stickId) return;
      this.stickId = null;
      this.stick.classList.remove('on');
      this.knob.style.transform = 'translate(-50%, -50%)';
      STATE.left = STATE.right = STATE.down = false;
    };
    zone.addEventListener('pointerup', endStick);
    zone.addEventListener('pointercancel', endStick);
    zone.addEventListener('lostpointercapture', endStick);

    // botões: segurou = apertado; soltou = solta
    for (const btn of root.querySelectorAll('[data-act]')) {
      const act = btn.dataset.act;
      const down = (e) => {
        e.preventDefault();
        btn.setPointerCapture?.(e.pointerId);
        if (!STATE[act]) tapped.add(act);
        STATE[act] = true;
        btn.classList.add('on');
        navigator.vibrate?.(8);
      };
      const up = (e) => {
        e.preventDefault();
        STATE[act] = false;
        btn.classList.remove('on');
      };
      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('lostpointercapture', up);
    }
    root.querySelector('.tc-pause')?.addEventListener('click', () => onPause?.());
    const scores = root.querySelector('.tc-scores');
    if (scores) {
      scores.addEventListener('pointerdown', (e) => { e.preventDefault(); onScores?.(true); });
      for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) scores.addEventListener(ev, () => onScores?.(false));
    }
    // nada de menu de toque longo, seleção de texto ou zoom em cima dos controles
    root.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  moveStick(e) {
    const dx = e.clientX - this.home.left - this.home.x;
    const dy = e.clientY - this.home.top - this.home.y;
    const len = Math.hypot(dx, dy);
    const k = len > RADIUS ? RADIUS / len : 1;
    this.knob.style.transform = `translate(calc(-50% + ${dx * k}px), calc(-50% + ${dy * k}px))`;
    const nx = dx / RADIUS;
    const ny = dy / RADIUS;
    STATE.left = nx < -DEAD;
    STATE.right = nx > DEAD;
    // descer só puxando bem para baixo (para não cair da plataforma sem querer)
    STATE.down = ny > 0.65 && Math.abs(ny) > Math.abs(nx) * 0.8;
  }

  show(on) {
    active = on;
    this.root.hidden = !on;
    if (!on) this.reset();
  }

  reset() {
    for (const k of Object.keys(STATE)) STATE[k] = false;
    tapped.clear();
    this.stickId = null;
    this.stick.classList.remove('on');
    for (const b of this.root.querySelectorAll('.on')) b.classList.remove('on');
  }
}
