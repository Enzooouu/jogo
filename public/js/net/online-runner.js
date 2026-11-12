// Partida online no navegador. Quem roda a partida de verdade é o servidor;
// aqui fica uma cópia espelho (o mesmo Game de shared/), atualizada com o
// estado que chega ~30 vezes por segundo, só para desenhar e tocar os sons.
// Os botões que a pessoa aperta vão para o servidor.

import { Game } from '/shared/game.js';
import { MATCH } from '/shared/constants.js';
import { gameConfig, applySnapshot } from '/shared/net.js';
import { encodeInput, EMPTY_INPUT } from '/shared/input.js';
import { Renderer } from '../render/renderer.js';
import { KeyboardController } from '../input/keyboard.js';
import { loadBindings, keymapFrom, currentBindings, actionOf } from '../input/bindings.js';
import { playEvents, beep, setAmbience } from '../audio.js';

const SNAP_MS = 1000 / 30;   // intervalo entre os estados que chegam do servidor

export class OnlineRunner {
  constructor({ canvas, setup, you, client, debug = false }) {
    this.online = true;
    this.setup = { ...setup, localPlayerId: you };
    this.game = new Game(gameConfig(setup));
    this.localId = you;
    this.client = client;
    this.keyboard = new KeyboardController(keymapFrom(loadBindings()));
    this.renderer = new Renderer(canvas, this.game, { localPlayerId: you, debug });
    this.running = false;
    this.paused = false;
    this.last = null;
    this.lastSnap = performance.now();
    this.sentHeld = -1;
    this.prevHeld = 0;
    this.pending = 0;
    this.lastSend = 0;
    this.lastCount = null;
    this.onEvents = null;

    this.offSnap = client.on('s', (m) => this.onSnapshot(m));
    this.onResize = () => this.renderer.resize();
    const isScores = (code) => actionOf(currentBindings(), code) === 'scores';
    this.onKey = (e) => {
      if (isScores(e.code)) {
        e.preventDefault();
        this.renderer.showScores = true;
      }
    };
    this.onKeyUp = (e) => {
      if (isScores(e.code)) this.renderer.showScores = false;
    };
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKeyUp);
  }

  onSnapshot({ s, e }) {
    applySnapshot(this.game, s);
    this.lastSnap = performance.now();
    const g = this.game;
    if (g.phase === 'countdown') {
      const n = Math.ceil(g.phaseTimer);
      if (n !== this.lastCount && n <= MATCH.countdown) {
        this.lastCount = n;
        beep();
      }
    }
    if (e?.length) {
      this.onEvents?.(e);
      this.renderer.handleEvents(e);
      playEvents(e, this.localId);
    }
  }

  start() {
    this.running = true;
    setAmbience(this.game.map.id === 'coliseu' ? 'torcida' : null);
    this.frameId = requestAnimationFrame(this.loop);
  }

  loop = (now) => {
    if (!this.running) return;
    const dt = this.last === null ? 0 : Math.max(0, Math.min(0.1, (now - this.last) / 1000));
    this.last = now;
    this.sendInput(now);
    // desenha entre o estado anterior e o último que chegou
    const alpha = Math.min(1, (performance.now() - this.lastSnap) / SNAP_MS);
    this.renderer.frame(dt, alpha);
    this.frameId = requestAnimationFrame(this.loop);
  };

  // manda os botões quando mudam (e um "ainda estou aqui" de vez em quando).
  // Os apertos rápidos vão marcados à parte para o servidor não perder.
  sendInput(now) {
    const input = this.paused ? EMPTY_INPUT : this.keyboard.getInput(this.game);
    const held = encodeInput(input);
    this.pending |= held & ~this.prevHeld;
    this.prevHeld = held;
    if (held !== this.sentHeld || this.pending || now - this.lastSend > 250) {
      this.client.send({ t: 'i', h: held, p: this.pending });
      this.sentHeld = held;
      this.pending = 0;
      this.lastSend = now;
    }
  }

  // online não dá para pausar a partida: só abre o menu e para de mandar comandos
  setPaused(paused) {
    this.paused = paused;
  }

  stop() {
    this.running = false;
    setAmbience(null);
    cancelAnimationFrame(this.frameId);
    this.offSnap();
    this.keyboard?.destroy();
    this.client.send({ t: 'i', h: 0, p: 0 });
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
