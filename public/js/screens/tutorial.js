// Tela do tutorial: roda as etapas de shared/tutorial.js uma depois da
// outra. Cada etapa é uma partidinha de treino com a sua arena; aqui ficam
// o laço, o cartão da tarefa (HTML por cima do jogo), a bandeira de chegada,
// a escolha do lutador e as telas de pausa e de fim.

import { STEPS, createStep, TUTORIAL_LOCAL_ID } from '/shared/tutorial.js';
import { enabledElements } from '/shared/elements.js';
import { BotController } from '/shared/ai.js';
import { DT } from '/shared/constants.js';
import { Renderer } from '../render/renderer.js';
import { drawPortrait, fitCanvas } from '../render/portrait.js';
import { KeyboardController } from '../input/keyboard.js';
import { loadBindings, keymapFrom, keyLabel } from '../input/bindings.js';
import { playEvents, chime } from '../audio.js';

const DONE_KEY = 'brawl.tutorial';
// Speedrun do tutorial (conquista de ouro "Velocista"): terminar tudo, sem
// pular nenhuma etapa e sem morrer nenhuma vez, em até SPEEDRUN_GOAL segundos
export const SPEEDRUN_GOAL = 80;   // 1:20
const BEST_KEY = 'brawl.tutorial.recorde';

function loadBest() {
  try {
    const v = Number(localStorage.getItem(BEST_KEY));
    return v > 0 ? v : null;
  } catch {
    return null;
  }
}

function saveBest(time) {
  const best = loadBest();
  if (best == null || time < best) {
    try {
      localStorage.setItem(BEST_KEY, String(time));
    } catch {
      // navegação privada
    }
    return time;
  }
  return best;
}

// meta escrita do jeito curto: 80 -> "1:20"
function goalText() {
  return `${Math.floor(SPEEDRUN_GOAL / 60)}:${String(SPEEDRUN_GOAL % 60).padStart(2, '0')}`;
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

const $ = (sel) => document.querySelector(sel);

export function tutorialDone() {
  try {
    return localStorage.getItem(DONE_KEY) === 'feito';
  } catch {
    return false;
  }
}

function markDone() {
  try {
    localStorage.setItem(DONE_KEY, 'feito');
  } catch {
    // sem armazenamento: só não lembra
  }
}

const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Nomes dos comandos no celular (botões na tela) e no controle
const TOUCH_LABELS = { left: 'joystick ←', right: 'joystick →', down: 'joystick ↓', up: 'PULAR', attack: 'BATER', throw: 'ARMA', dash: 'DASH' };
const PAD_LABELS = { left: '←', right: '→', down: '↓', up: 'A', attack: 'X', throw: 'B', dash: 'RB' };

// "{up}" -> <kbd>W</kbd> com a tecla que o jogador escolheu (ou o botão da
// tela no celular / o botão do controle, se estiver usando um)
function withKeys(text, bindings) {
  const cls = document.body.classList;
  const labels = cls.contains('has-touch') ? TOUCH_LABELS : cls.contains('has-pad') ? PAD_LABELS : null;
  return escapeHtml(text).replace(/\{(\w+)\}/g, (m, action) => {
    if (labels?.[action]) return `<kbd>${escapeHtml(labels[action])}</kbd>`;
    const code = bindings[action]?.[0];
    return code ? `<kbd>${escapeHtml(keyLabel(code))}</kbd>` : m;
  });
}

export class TutorialScreen {
  /**
   * @param {object} opts
   * @param {() => void} opts.onExit volta para o menu
   * @param {(element) => void} opts.onPlay "Jogar agora" no fim
   * @param {() => string} opts.getName nome do jogador
   */
  constructor({ onExit, onPlay, getName, debug = false }) {
    this.onExit = onExit;
    this.onPlay = onPlay;
    this.getName = getName;
    this.debug = debug;
    this.canvas = $('#tut-canvas');
    this.index = 0;
    this.element = null;
    this.current = null;
    this.running = false;
    this.paused = false;

    $('#tut-skip').addEventListener('click', () => this.skip());
    $('#tut-pause-btn').addEventListener('click', () => this.setPaused(true));
    $('#tut-resume').addEventListener('click', () => this.setPaused(false));
    $('#tut-restart').addEventListener('click', () => { this.setPaused(false); this.load(this.index); });
    $('#tut-skip2').addEventListener('click', () => { this.setPaused(false); this.skip(); });
    $('#tut-quit').addEventListener('click', () => this.exit());
    this.onResize = () => this.renderer?.resize();
  }

  // ------------------------------------------------------------ começo e fim

  start(index = 0) {
    this.stop();
    this.element = null;
    this.running = true;
    this.paused = false;
    // cronômetro da speedrun (conquista de ouro): só vale do começo, sem pular nada
    this.clock = 0;
    this.clockDone = false;
    this.skipped = index > 0;
    this.died = false;
    this.updateClock();
    for (const id of ['#tut-pick', '#tut-pause', '#tut-end']) $(id).hidden = true;
    window.addEventListener('resize', this.onResize);
    this.last = null;
    this.frameId = requestAnimationFrame(this.loop);
    this.load(index);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.nextTimer);
    this.keyboard?.destroy();
    this.keyboard = null;
    this.current = null;
    this.renderer = null;
    window.removeEventListener('resize', this.onResize);
  }

  exit() {
    this.stop();
    this.onExit();
  }

  get active() {
    return this.running;
  }

  // ------------------------------------------------------------ etapas

  load(index) {
    clearTimeout(this.nextTimer);
    this.index = index;
    if (index >= STEPS.length) {
      this.finish();
      return;
    }
    const step = STEPS[index];
    if (step.needsElement && !this.element) {
      this.showPick();
      return;
    }
    this.keyboard?.destroy();
    this.current = createStep(index, { element: step.needsElement ? this.element : null, name: this.getName(), seed: (Math.random() * 2 ** 31) | 0 });
    this.completed = false;
    this.keyboard = new KeyboardController(keymapFrom(loadBindings()));
    // o rival do desafio final é um bot fácil
    this.bot = step.final ? new BotController(2, { difficulty: 'facil', seed: 7 }) : null;
    this.renderer = new Renderer(this.canvas, this.current.game, { localPlayerId: TUTORIAL_LOCAL_ID, debug: this.debug });
    this.renderer.drawExtra = (ctx, time) => this.drawGoal(ctx, time);
    this.acc = 0;
    this.fade(false);
    this.updateCard(true);
    if (this.debug) window.__brawl = { ...(window.__brawl ?? {}), tutorial: this };
  }

  skip() {
    if (!this.running) return;
    this.skipped = true;
    $('#tut-pick').hidden = true;
    this.load(this.index + 1);
  }

  // Tarefa feita: plim, "Muito bem!" e a próxima arena
  complete() {
    this.completed = true;
    chime();
    const last = this.index === STEPS.length - 1;
    if (last) this.clockDone = true;
    this.toast(last ? 'Desafio vencido!' : '✔ Muito bem!');
    this.updateCard();
    this.nextTimer = setTimeout(() => {
      if (!this.running) return;
      this.fade(true);
      this.nextTimer = setTimeout(() => this.load(this.index + 1), 380);
    }, last ? 2600 : 1300);
  }

  finish() {
    markDone();
    this.clockDone = true;
    const time = this.clock;
    const valid = !this.skipped && !this.died;
    const before = loadBest();
    if (valid) saveBest(time);
    window.dispatchEvent(new CustomEvent('tutorial-complete', { detail: { time, valid } }));
    this.updateClock();
    const record = valid && (before == null || time < before);
    const timeLine = !valid
      ? (this.skipped
        ? ' (Você pulou alguma etapa, então o tempo não vale para o recorde.)'
        : ' (Você morreu no caminho, então o tempo não vale para o recorde. Para a conquista de ouro, não pode morrer nenhuma vez.)')
      : ` Seu tempo: ${fmtTime(time)}${record ? ' (novo recorde!)' : ` (recorde ${fmtTime(before)})`}.${time <= SPEEDRUN_GOAL ? ` Dentro de ${goalText()}: conquista de ouro!` : ` Faça em até ${goalText()}, sem pular etapa e sem morrer, para a conquista de ouro.`}`;
    this.fade(false);
    this.keyboard?.destroy();
    this.keyboard = null;
    this.showEnd({
      title: 'Tutorial completo!',
      text: `Você aprendeu tudo: andar, pular, dash, paredes, armas, perigos e como voltar para a arena. Agora é com você!${timeLine}`,
      main: ['Jogar agora', () => { const el = this.element; this.stop(); this.onPlay(el); }],
      alt: ['Voltar ao menu', () => this.exit()],
    });
  }

  lostFinal() {
    this.showEnd({
      title: 'Não foi dessa vez!',
      text: 'O rival ganhou o duelo. Tente de novo: use o dash para voltar quando for arremessado e pegue as armas que caem do céu.',
      main: ['Tentar de novo', () => { $('#tut-end').hidden = true; this.load(this.index); }],
      alt: ['Pular o desafio', () => { $('#tut-end').hidden = true; this.skipped = true; this.finish(); }],
    });
  }

  showEnd({ title, text, main, alt }) {
    this.closePause();
    $('#tut-end-title').textContent = title;
    $('#tut-end-text').textContent = text;
    const mainBtn = $('#tut-end-main');
    const altBtn = $('#tut-end-alt');
    mainBtn.textContent = main[0];
    altBtn.textContent = alt[0];
    mainBtn.onclick = main[1];
    altBtn.onclick = alt[1];
    $('#tut-end').hidden = false;
    mainBtn.focus();
  }

  // ------------------------------------------------------------ escolha do lutador

  // fecha a pausa se ela estiver aberta (ex.: pausou na troca de etapa)
  closePause() {
    this.paused = false;
    $('#tut-pause').hidden = true;
    this.last = null;
  }

  showPick() {
    this.closePause();
    this.keyboard?.destroy();
    this.keyboard = null;
    const grid = $('#tut-pick-grid');
    grid.replaceChildren();
    for (const el of enabledElements()) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tut-pick-btn';
      btn.style.setProperty('--el', el.color);
      btn.innerHTML = `<canvas></canvas><b>${el.name}</b><span>${escapeHtml(el.description)}</span>`;
      btn.addEventListener('click', () => {
        this.element = el.id;
        $('#tut-pick').hidden = true;
        this.load(this.index);
      });
      grid.appendChild(btn);
    }
    $('#tut-pick').hidden = false;
    requestAnimationFrame(() => {
      [...grid.querySelectorAll('canvas')].forEach((c, i) => {
        const { ctx, w, h } = fitCanvas(c);
        drawPortrait(ctx, enabledElements()[i].id, w / 2, h - 8, Math.min(w, h) / 78);
      });
    });
  }

  // ------------------------------------------------------------ cartão e efeitos

  updateCard(fresh = false) {
    const t = this.current;
    if (!t) return;
    const step = t.step;
    $('#tut-step').textContent = `ETAPA ${this.index + 1}/${STEPS.length}`;
    $('#tut-title').textContent = step.title;
    const html = withKeys(step.text(t.state), loadBindings());
    if (html !== this.lastText) {
      $('#tut-text').innerHTML = html;
      this.lastText = html;
    }
    const progress = step.progress?.(t.state) ?? null;
    $('#tut-progress').hidden = !progress;
    if (progress) $('#tut-progress').textContent = progress;
    $('#tut-card').classList.toggle('done', this.completed);
    // um pino por etapa: feitas, a atual e as que faltam
    const pegs = $('#tut-pegs');
    if (pegs.childElementCount !== STEPS.length) pegs.replaceChildren(...STEPS.map(() => document.createElement('i')));
    [...pegs.children].forEach((peg, i) => {
      peg.className = i < this.index || (i === this.index && this.completed) ? 'done' : i === this.index ? 'now' : '';
    });
    if (fresh) {
      const card = $('#tut-card');
      card.classList.remove('enter');
      void card.offsetWidth; // reinicia a animação de entrada
      card.classList.add('enter');
    }
  }

  toast(text) {
    const el = $('#tut-toast');
    el.textContent = text;
    el.hidden = false;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { el.hidden = true; }, 1500);
  }

  fade(out) {
    $('#tut-fade').classList.toggle('on', out);
  }

  // Bandeira de chegada balançando, com uma setinha pulando em cima
  drawGoal(ctx, time) {
    const goal = this.current?.step.goal;
    if (!goal) return;
    const { x, y } = goal;
    ctx.save();
    // mastro
    ctx.fillStyle = '#e8e2d4';
    ctx.strokeStyle = '#1d2a14';
    ctx.lineWidth = 2;
    ctx.fillRect(x - 2, y - 96, 4, 96);
    ctx.strokeRect(x - 2, y - 96, 4, 96);
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.arc(x, y - 98, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // pano tremulando
    ctx.beginPath();
    ctx.moveTo(x + 2, y - 92);
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      ctx.lineTo(x + 2 + u * 46, y - 92 + Math.sin(time * 6 - u * 4) * 4 * u + u * 2);
    }
    for (let i = 10; i >= 0; i--) {
      const u = i / 10;
      ctx.lineTo(x + 2 + u * 46, y - 64 + Math.sin(time * 6 - u * 4) * 4 * u - u * 2);
    }
    ctx.closePath();
    ctx.fillStyle = this.completed ? '#4dffa6' : '#ff5b4a';
    ctx.fill();
    ctx.stroke();
    // estrela no pano
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★', x + 22, y - 72 + Math.sin(time * 6 - 2) * 2);
    // seta
    if (!this.completed) {
      const by = y - 128 + Math.sin(time * 5) * 6;
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.moveTo(x - 11, by - 12);
      ctx.lineTo(x + 11, by - 12);
      ctx.lineTo(x, by + 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // brilho no chão
    const g = ctx.createRadialGradient(x, y, 2, x, y, 50);
    g.addColorStop(0, this.completed ? 'rgba(77,255,166,0.5)' : 'rgba(255,230,120,0.45)');
    g.addColorStop(1, 'rgba(255,230,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 50, y - 20, 100, 30);
    ctx.restore();
  }

  // ------------------------------------------------------------ laço

  setPaused(paused) {
    if (!this.running) return;
    // não dá para pausar por cima da escolha de lutador ou da janela final,
    // mas tirar a pausa sempre funciona
    if (paused && (!$('#tut-pick').hidden || !$('#tut-end').hidden)) return;
    this.paused = paused;
    $('#tut-pause').hidden = !paused;
    if (paused) $('#tut-resume').focus();
    else this.last = null;
  }

  togglePause() {
    this.setPaused(!this.paused);
  }

  // cronômetro no alto da tela: tempo atual, recorde e a meta do ouro
  updateClock() {
    const el = $('#tut-clock');
    if (!el) return;
    el.querySelector('b').textContent = fmtTime(this.clock ?? 0);
    const best = loadBest();
    const invalid = this.skipped || this.died;
    el.querySelector('small').textContent = this.skipped
      ? 'pulou etapa: não vale para o recorde'
      : this.died
        ? 'morreu: não vale para o recorde'
        : `meta do ouro ${goalText()} sem morrer${best != null ? ` · recorde ${fmtTime(best)}` : ''}`;
    el.classList.toggle('late', !invalid && (this.clock ?? 0) > SPEEDRUN_GOAL);
    el.classList.toggle('off', !!invalid);
  }

  loop = (now) => {
    if (!this.running) return;
    const dt = this.last == null ? 0 : Math.max(0, Math.min(0.1, (now - this.last) / 1000));
    this.last = now;
    const t = this.current;
    const blocked = this.paused || !$('#tut-pick').hidden || !$('#tut-end').hidden;
    if (t && this.renderer) {
      if (!blocked) {
        // o relógio só conta enquanto a etapa está sendo jogada: a transição
        // entre etapas ("Muito bem!" e a troca de arena) não conta para
        // ninguém (antes, pausar nessa hora economizava tempo)
        if (!this.clockDone && !this.completed) {
          this.clock += dt;
          this.updateClock();
        }
        this.acc += dt;
        let steps = 0;
        while (this.acc >= DT && steps < 12) {
          this.stepOnce();
          this.acc -= DT;
          steps++;
        }
        if (steps === 12) this.acc = 0;
      }
      this.renderer?.frame(blocked ? 0 : dt, blocked ? 1 : this.acc / DT);
    }
    this.frameId = requestAnimationFrame(this.loop);
  };

  stepOnce() {
    const t = this.current;
    const g = t.game;
    const inputs = { [TUTORIAL_LOCAL_ID]: this.keyboard ? this.keyboard.getInput(g) : {} };
    if (this.bot) inputs[2] = this.bot.getInput(g);
    g.step(inputs);
    const events = g.drainEvents();
    if (events.length) {
      this.renderer.handleEvents(events);
      playEvents(events, TUTORIAL_LOCAL_ID);
      // speedrun: morrer (cair para fora, perigo ou perder vida no desafio
      // final) invalida a tentativa
      if (!this.clockDone && !this.died && events.some((e) => e.type === 'ko' && e.id === TUTORIAL_LOCAL_ID)) {
        this.died = true;
        this.updateClock();
      }
    }
    if (this.completed) return;
    if (t.update(events)) {
      this.complete();
      return;
    }
    if (t.step.final && g.phase === 'ended') {
      this.lostFinal();
      return;
    }
    this.updateCard();
  }
}

