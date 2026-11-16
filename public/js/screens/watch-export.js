// Exportar vídeo do modo Assistir "quadro por quadro" (como um editor de
// vídeo faz). A luta é sempre igual quando começa do mesmo jeito (mesma
// semente), então depois de assistir ao vivo a gente refaz a luta inteira
// fora do tempo real: cada quadro é desenhado com calma no tempo exato
// (30 por segundo) e o som de cada golpe é colocado no quadro em que ele
// acontece. Assim o vídeo sai sempre liso e com o som certinho, mesmo em
// computador fraco. Usa WebCodecs (VideoEncoder/AudioEncoder) e o mp4-muxer.

import { Muxer, ArrayBufferTarget } from '../vendor/mp4-muxer.mjs';
import { Game } from '/shared/game.js';
import { gameConfig } from '/shared/net.js';
import { BotController } from '/shared/ai.js';
import { MATCH, DT } from '/shared/constants.js';
import { Renderer } from '../render/renderer.js';
import { renderAudioOffline } from '../audio.js';
import { WatchRecorder } from './watch-rec.js';

const FPS = 30;
const EMOJI = { fogo: '🔥', agua: '💧', terra: '🪨', ar: '🌪️', mortal: '⚔️' };
// pede comentário: "Comenta pra quem você torce: 🔥 ou 💧"
export function commentPrompt(players) {
  const [a, b] = players;
  return `Comenta pra quem você torce: ${EMOJI[a.element] ?? a.name} ou ${EMOJI[b.element] ?? b.name}`;
}
const AFTER_END = 2.8;          // segundos depois do fim (vencedor na tela)
const MAX_SECONDS = 6 * 60;     // trava de segurança

export const canExport = () => typeof VideoEncoder !== 'undefined' && typeof AudioEncoder !== 'undefined'
  && typeof OfflineAudioContext !== 'undefined';

async function pickVideoCodec(width, height) {
  for (const codec of ['avc1.640028', 'avc1.4d0028', 'avc1.640033']) {
    const cfg = { codec, width, height, bitrate: 12_000_000, framerate: FPS };
    try {
      if ((await VideoEncoder.isConfigSupported(cfg)).supported) return cfg;
    } catch {
      // tenta o próximo
    }
  }
  return null;
}

async function pickAudioCodec() {
  for (const [codec, mux] of [['mp4a.40.2', 'aac'], ['opus', 'opus']]) {
    const cfg = { codec, sampleRate: 48000, numberOfChannels: 2, bitrate: 160_000 };
    try {
      if ((await AudioEncoder.isConfigSupported(cfg)).supported) return { cfg, mux };
    } catch {
      // tenta o próximo
    }
  }
  return null;
}

const nextTick = () => new Promise((r) => setTimeout(r, 0));

/**
 * @param {object} o
 * @param {object} o.setup o mesmo setup da luta que passou ao vivo
 * @param {object} o.choices escolhas do painel (banner, intro, format)
 * @param {(id: string) => string} o.color cor do elemento
 * @param {(fraction: number, label: string) => void} o.onProgress
 * @returns {Promise<{blob: Blob, ext: string}>}
 */
export async function exportWatchVideo({ setup, choices, color, onProgress = () => {}, cancelled = () => false }) {
  const portrait = choices.format !== 'deitado';
  const W = portrait ? 1080 : 1920;
  const H = portrait ? 1920 : 1080;
  const vCfg = await pickVideoCodec(W, H);
  if (!vCfg) throw new Error('Este navegador não consegue criar vídeo MP4.');
  const aCodec = await pickAudioCodec();

  // ---------------------------------------------------------------- a luta
  const game = new Game(gameConfig(setup));
  const bots = setup.players.map((p) => new BotController(p.id, { difficulty: setup.difficulty, brain: p.brain ?? null, seed: setup.seed + p.id * 7919 }));

  // canvas do jogo, fora da tela, já no tamanho do vídeo
  const holder = document.createElement('div');
  holder.style.cssText = `position:fixed;left:-99999px;top:0;width:${portrait ? 540 : 960}px;height:540px;pointer-events:none`;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%';
  holder.appendChild(canvas);
  document.body.appendChild(holder);
  const r = new Renderer(canvas, game, {});
  const full = portrait ? Math.round(H * 16 / 9) : W;
  r.crop = portrait ? W / full : 1;
  r.minCanvasW = full;
  r.maxCanvasW = full;
  r.resize();
  if (portrait) {
    r.drawHud = () => {};
    r.camera.focus = { frac: r.crop };
  }

  // o que vai por cima (marca, placar, frase, vencedor): o mesmo desenho do
  // gravador ao vivo
  let info = { banner: choices.banner, players: [] };
  const comp = new WatchRecorder({ source: canvas, portrait: () => portrait, info: () => info, name: 'x' });

  // ---------------------------------------------------------------- vídeo
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    fastStart: 'in-memory',
    video: { codec: 'avc', width: W, height: H, frameRate: FPS },
    ...(aCodec ? { audio: { codec: aCodec.mux, numberOfChannels: 2, sampleRate: 48000 } } : {}),
  });
  let encodeError = null;
  const venc = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { encodeError = e; },
  });
  venc.configure(vCfg);

  const lastDmg = new Map();
  const damageOf = (p) => {
    if (p.state === 'alive' && p.lives > 0) lastDmg.set(p.id, Math.round(p.damage));
    return p.lives <= 0 || p.state === 'out' ? (lastDmg.get(p.id) ?? Math.round(p.damage)) : Math.round(p.damage);
  };

  const audioItems = [];
  let speed = 1;
  let slowLeft = 0;
  let acc = 0;
  let lastCount = null;
  let winner = null;
  let endedAt = null;
  const intro = choices.intro ? choices.intro.toUpperCase() : '';

  // o vídeo começa já na luta: a contagem regressiva acontece fora do vídeo
  // (a câmera também se ajeita nesse tempo)
  while (game.phase === 'countdown') {
    for (let k = 0; k < 2 && game.phase === 'countdown'; k++) {
      const inputs = {};
      for (const b of bots) inputs[b.playerId] = b.getInput(game);
      game.step(inputs);
      r.handleEvents(game.drainEvents());
    }
    r.frame(1 / FPS, 1);
  }
  // e começa quando os dois já estão perto (câmera fechada neles), no
  // máximo 1,5 s depois do início da luta
  for (let f = 0; f < FPS * 1.5 && game.phase === 'playing'; f++) {
    const [a, b] = game.players;
    if (Math.abs(a.x - b.x) < 260 && Math.abs(a.y - b.y) < 160) break;
    for (let k = 0; k < 2 && game.phase === 'playing'; k++) {
      const inputs = {};
      for (const bt of bots) inputs[bt.playerId] = bt.getInput(game);
      game.step(inputs);
      const ev = game.drainEvents();
      r.handleEvents(ev);
    }
    r.frame(1 / FPS, 1);
  }
  const sub = choices.intro ? commentPrompt(setup.players) : '';

  let frame = 0;
  try {
    for (;;) {
      const t = frame / FPS;
      if (encodeError) throw encodeError;
      if (cancelled()) throw new Error('cancelado');
      if (endedAt !== null && t > endedAt + AFTER_END) break;
      if (t > MAX_SECONDS) break;

      // simulação: 2 passos por quadro (menos na câmera lenta)
      if (game.phase !== 'ended') {
        acc += speed / FPS;
        while (acc >= DT - 1e-9 && game.phase !== 'ended') {
          acc -= DT;
          const inputs = {};
          for (const b of bots) inputs[b.playerId] = b.getInput(game);
          game.step(inputs);
          if (game.phase === 'countdown') {
            const n = Math.ceil(game.phaseTimer);
            if (n !== lastCount && n <= MATCH.countdown) {
              lastCount = n;
              audioItems.push({ t, beep: true });
            }
          }
          const events = game.drainEvents();
          if (!events.length) continue;
          r.handleEvents(events);
          audioItems.push({ t, events });
          for (const e of events) {
            if (e.type === 'matchEnd' && !winner) {
              const w = e.winnerTeam != null ? setup.players.find((p) => p.team === e.winnerTeam) : null;
              winner = { name: w ? w.name.toUpperCase() : 'EMPATE', color: w ? color(w.element) : '#ffffff', at: t };
            } else if (e.type === 'ko' && portrait) {
              speed = 0.3;
              slowLeft = 0.75;
              r.camera.focus.hold = true;
              r.camera.focus.punch = 1;
            } else if (e.type === 'hit' && e.kb >= 1000 && portrait) {
              speed = 0.3;
              slowLeft = 0.6;
              r.camera.focus.hold = false;
              r.camera.focus.punch = 1.18;
            }
          }
        }
        if (game.phase === 'ended' && endedAt === null) endedAt = t;
      }
      if (slowLeft > 0) {
        slowLeft -= 1 / FPS;
        if (slowLeft <= 0) {
          speed = 1;
          if (r.camera.focus) {
            r.camera.focus.hold = false;
            r.camera.focus.punch = 1;
          }
        }
      }
      if (portrait) r.camera.focus.wide = game.phase === 'ending' || game.phase === 'ended';

      // desenha o jogo e o que vai por cima
      r.frame(1 / FPS, game.phase === 'ended' ? 1 : Math.min(1, acc / DT));
      let introInfo = null;
      if (intro) {
        const alpha = t < 0.3 ? t / 0.3 : t < 3 ? 1 : Math.max(0, 1 - (t - 3) / 0.6);
        if (alpha > 0) introInfo = { text: intro, sub, alpha, scale: 0.85 + 0.15 * Math.min(1, t / 0.3) };
      }
      info = {
        banner: choices.banner,
        intro: introInfo,
        winner: winner ? { ...winner, elapsed: t - winner.at } : null,
        players: game.players.map((p) => ({
          name: p.name.toUpperCase(), color: color(p.element), damage: damageOf(p), lives: p.lives, out: p.lives <= 0,
        })),
      };
      comp.compose(info);

      const vf = new VideoFrame(comp.out, { timestamp: Math.round(frame * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
      venc.encode(vf, { keyFrame: frame % (FPS * 2) === 0 });
      vf.close();
      frame++;
      while (venc.encodeQueueSize > 4) await nextTick();
      if (frame % 3 === 0) {
        // o fim da luta ainda não é conhecido: o progresso vai até 90%
        const total = endedAt !== null ? endedAt + AFTER_END : Math.max(t + 20, 60);
        onProgress(Math.min(0.9, (t / total) * 0.9), 'Gerando o vídeo…');
        await nextTick();
      }
    }
    await venc.flush();
    venc.close();

    // ---------------------------------------------------------------- som
    const duration = frame / FPS;
    if (aCodec) {
      onProgress(0.92, 'Gerando o som…');
      const buffer = await renderAudioOffline({ duration, items: audioItems, ambience: setup.mapId === 'coliseu' ? 'torcida' : null });
      const aenc = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: (e) => { encodeError = e; },
      });
      aenc.configure(aCodec.cfg);
      const left = buffer.getChannelData(0);
      const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
      const STEP = 1024 * 4;
      for (let i = 0; i < buffer.length; i += STEP) {
        const n = Math.min(STEP, buffer.length - i);
        const data = new Float32Array(n * 2);
        data.set(left.subarray(i, i + n), 0);
        data.set(right.subarray(i, i + n), n);
        const ad = new AudioData({
          format: 'f32-planar', sampleRate: buffer.sampleRate, numberOfFrames: n, numberOfChannels: 2,
          timestamp: Math.round((i / buffer.sampleRate) * 1e6), data,
        });
        aenc.encode(ad);
        ad.close();
        if (encodeError) throw encodeError;
      }
      await aenc.flush();
      aenc.close();
    }

    onProgress(0.98, 'Finalizando…');
    muxer.finalize();
    onProgress(1, 'Pronto!');
    return { blob: new Blob([target.buffer], { type: 'video/mp4' }), ext: 'mp4' };
  } finally {
    holder.remove();
  }
}
