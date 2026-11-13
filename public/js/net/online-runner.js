// Partida online no navegador. Quem manda na partida é o servidor, mas aqui
// roda uma cópia (o mesmo Game de shared/) com "previsão local": o seu boneco
// se mexe na hora em que você aperta, e cada estado que chega do servidor
// (~30 por segundo) corrige a cópia (ver Predictor em shared/net.js).

import { Game } from '/shared/game.js';
import { MATCH } from '/shared/constants.js';
import { gameConfig, Predictor } from '/shared/net.js';
import { encodeInput, EMPTY_INPUT } from '/shared/input.js';
import { Renderer } from '../render/renderer.js';
import { KeyboardController } from '../input/keyboard.js';
import { loadBindings, keymapFrom, currentBindings, actionOf } from '../input/bindings.js';
import { playEvents, beep, setAmbience } from '../audio.js';

const STEP = 1 / 60;          // o mesmo passo do servidor

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
    this.predictor = new Predictor(this.game, you);
    this.acc = 0;
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

  onSnapshot({ s, e, a }) {
    this.predictor.reconcile(s, a);
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
    // passos fixos de 1/60 s: cada passo anda a cópia e manda o comando
    this.acc += dt;
    let n = 0;
    while (this.acc >= STEP && n < 6) {
      this.acc -= STEP;
      n++;
      this.tick();
    }
    if (n === 6) this.acc = 0;
    this.renderer.frame(dt, Math.min(1, this.acc / STEP));
    this.frameId = requestAnimationFrame(this.loop);
  };

  tick() {
    const input = this.paused ? EMPTY_INPUT : this.keyboard.getInput(this.game);
    const q = this.predictor.step(input);
    this.game.drainEvents();   // efeitos e sons vêm do servidor
    this.client.send({ t: 'i', q, h: encodeInput(input) });
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
    this.client.send({ t: 'i', h: 0, p: 0 });   // solta todos os botões
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
