// Partida de demonstração entre bots que roda no fundo dos menus.

import { Game } from '/shared/game.js';
import { BotController } from '/shared/ai.js';
import { DT } from '/shared/constants.js';
import { Renderer } from '../render/renderer.js';

export class DemoArena {
  constructor(canvas) {
    this.canvas = canvas;
    this.frame = null;
    this.seed = 1;
  }

  newGame() {
    const players = [
      { id: 1, name: 'Brasa', element: 'fogo', team: 'A', isBot: true },
      { id: 2, name: 'Pavio', element: 'fogo', team: 'A', isBot: true },
      { id: 3, name: 'Maré', element: 'agua', team: 'B', isBot: true },
      { id: 4, name: 'Gota', element: 'agua', team: 'B', isBot: true },
    ];
    this.seed++;
    this.game = new Game({ players, seed: this.seed, timeLimit: 0 });
    this.bots = players.map((p) => new BotController(p.id, { difficulty: 'dificil', seed: this.seed * 31 + p.id }));
    this.renderer = new Renderer(this.canvas, this.game, {});
    this.renderer.drawHud = () => {};
    // Pula a contagem regressiva
    while (this.game.phase === 'countdown') this.step();
  }

  step() {
    const inputs = {};
    for (const b of this.bots) inputs[b.playerId] = b.getInput(this.game);
    this.game.step(inputs);
    this.renderer.handleEvents(this.game.drainEvents());
  }

  start() {
    if (this.frame) return;
    this.canvas.hidden = false;
    if (!this.game || this.game.phase === 'ended') this.newGame();
    this.renderer.resize();
    this.onResize = () => this.renderer.resize();
    window.addEventListener('resize', this.onResize);
    let last = performance.now();
    let acc = 0;
    const loop = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += dt;
      while (acc >= DT) {
        this.step();
        acc -= DT;
      }
      if (this.game.phase === 'ended') this.newGame();
      this.renderer.frame(dt, acc / DT);
      this.frame = requestAnimationFrame(loop);
    };
    this.frame = requestAnimationFrame(loop);
  }

  stop() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.canvas.hidden = true;
    window.removeEventListener('resize', this.onResize);
  }
}
