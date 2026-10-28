// Liga tudo durante uma partida local: simulação (Game), controles
// (teclado e bots), desenho (Renderer) e som.
//
// Laço com passo fixo: a simulação sempre anda em passos de 1/60 s,
// independente da taxa de quadros do monitor. Para o online, o servidor
// rodaria o mesmo Game com os comandos que chegam pela rede.

import { Game } from '/shared/game.js';
import { BotController } from '/shared/ai.js';
import { DT } from '/shared/constants.js';
import { Renderer } from './render/renderer.js';
import { KeyboardController } from './input/keyboard.js';
import { playEvents, beep } from './audio.js';

export class MatchRunner {
  /**
   * @param {object} opts
   * @param {HTMLCanvasElement} opts.canvas
   * @param {object} opts.setup { players, mode, seed, localPlayerId, difficulty }
   * @param {(result) => void} opts.onEnd
   */
  constructor({ canvas, setup, onEnd, debug = false }) {
    this.setup = setup;
    this.onEnd = onEnd;
    this.game = new Game({ players: setup.players, mode: setup.mode, seed: setup.seed });
    this.localId = setup.localPlayerId;

    // Cada jogador tem uma "fonte de comandos". No online, jogadores remotos
    // teriam uma fonte que lê os comandos vindos do WebSocket.
    this.controllers = new Map();
    for (const p of setup.players) {
      if (p.isBot) {
        this.controllers.set(p.id, new BotController(p.id, { difficulty: setup.difficulty, seed: setup.seed + p.id * 7919 }));
      } else if (p.id === this.localId) {
        this.keyboard = new KeyboardController();
        this.controllers.set(p.id, this.keyboard);
      }
    }

    this.renderer = new Renderer(canvas, this.game, { localPlayerId: this.localId, debug });
    this.running = false;
    this.paused = false;
    this.speed = 1;
    this.acc = 0;
    this.last = null;
    this.endNotified = false;
    this.lastCount = null;

    this.onResize = () => this.renderer.resize();
    this.onKey = (e) => {
      if (e.code === 'KeyF') {
        const me = this.game.playerById(this.localId);
        if (me?.state === 'out') this.speed = this.speed === 1 ? 3 : 1;
      }
    };
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKey);
  }

  start() {
    this.running = true;
    this.frameId = requestAnimationFrame(this.loop);
  }

  loop = (now) => {
    if (!this.running) return;
    const dt = this.last === null ? 0 : Math.min(0.1, (now - this.last) / 1000);
    this.last = now;

    if (!this.paused) {
      this.acc += dt * this.speed;
      let steps = 0;
      while (this.acc >= DT && steps < 12) {
        this.stepOnce();
        this.acc -= DT;
        steps++;
      }
      if (steps === 12) this.acc = 0;
    }

    this.renderer.frame(this.paused ? 0 : dt, this.paused ? 1 : this.acc / DT);

    if (this.game.phase === 'ended' && !this.endNotified) {
      this.endNotified = true;
      this.onEnd?.(this.game.result);
    }
    this.frameId = requestAnimationFrame(this.loop);
  };

  stepOnce() {
    const g = this.game;
    const inputs = {};
    for (const [id, c] of this.controllers) inputs[id] = c.getInput(g);
    g.step(inputs);

    if (g.phase === 'countdown') {
      const n = Math.ceil(g.phaseTimer);
      if (n !== this.lastCount) {
        this.lastCount = n;
        beep();
      }
    }
    const events = g.drainEvents();
    if (events.length) {
      this.renderer.handleEvents(events);
      playEvents(events, this.localId);
    }
  }

  setPaused(paused) {
    this.paused = paused;
    if (!paused) this.last = null;
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frameId);
    this.keyboard?.destroy();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKey);
  }
}
