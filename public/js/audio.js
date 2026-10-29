// Efeitos sonoros sintetizados com Web Audio (sem arquivos de som).
// M liga/desliga.

import { FIRE_IMPACTS, QUAKE_HITS } from './render/celebrations.js';

let ctx = null;
let master = null;
let muted = readMuted();

function readMuted() {
  try {
    return localStorage.getItem('brawl.mudo') === '1';
  } catch {
    return false;
  }
}

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.35;
  master.connect(ctx.destination);
  return ctx;
}

export function unlockAudio() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume();
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  try {
    localStorage.setItem('brawl.mudo', muted ? '1' : '0');
  } catch {
    // sem armazenamento: só não lembra a preferência
  }
  if (master) master.gain.value = muted ? 0 : 0.35;
  return muted;
}

function tone({ freq = 440, to = freq, dur = 0.12, type = 'square', vol = 0.3, delay = 0 }) {
  const c = ensure();
  if (!c || muted) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise({ dur = 0.15, vol = 0.3, freq = 1200, delay = 0 }) {
  const c = ensure();
  if (!c || muted) return;
  const t = c.currentTime + delay;
  const len = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = freq;
  const gain = c.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(master);
  src.start(t);
}

// Toca o som de cada evento da partida.
export function playEvents(events, localId) {
  for (const e of events) {
    switch (e.type) {
      case 'jump':
        if (e.id === localId) tone({ freq: e.double ? 520 : 380, to: e.double ? 900 : 640, dur: 0.1, type: 'triangle', vol: 0.15 });
        break;
      case 'attack':
        noise({ dur: 0.07, vol: 0.12, freq: 3000 });
        break;
      case 'hit':
        noise({ dur: 0.12, vol: e.kb > 650 ? 0.45 : 0.3, freq: 1800 });
        tone({ freq: 160, to: 60, dur: 0.12, type: 'sine', vol: 0.4 });
        break;
      case 'ko':
        noise({ dur: 0.5, vol: 0.5, freq: 900 });
        tone({ freq: 110, to: 30, dur: 0.5, type: 'sawtooth', vol: 0.3 });
        break;
      case 'pickup':
        tone({ freq: 660, dur: 0.07, type: 'square', vol: 0.12 });
        tone({ freq: 990, dur: 0.1, type: 'square', vol: 0.12, delay: 0.07 });
        break;
      case 'shoot':
        tone({ freq: e.element === 'agua' ? 900 : 300, to: e.element === 'agua' ? 300 : 120, dur: 0.18, type: 'sawtooth', vol: 0.12 });
        break;
      case 'itemLost':
        noise({ dur: 0.35, vol: 0.18, freq: 2200 });
        break;
      case 'explosion':
        noise({ dur: 0.3, vol: 0.4, freq: 700 });
        break;
      case 'hazardHurt':
        if (e.id === localId) tone({ freq: 700, to: 300, dur: 0.09, type: 'square', vol: 0.12 });
        break;
      case 'windWarn':
        tone({ freq: 300, to: 500, dur: 0.25, type: 'sine', vol: 0.08 });
        break;
      case 'windStart':
        noise({ dur: 0.9, vol: 0.2, freq: 500 });
        break;
      case 'start':
        tone({ freq: 880, dur: 0.35, type: 'square', vol: 0.18 });
        break;
      case 'matchEnd':
        // som da comemoração de cada elemento
        if (e.winnerElement === 'fogo') {
          for (const at of FIRE_IMPACTS.small) noise({ dur: 0.35, vol: 0.22, freq: 600, delay: at });
          // assobio do meteoro gigante chegando e o estrondo
          tone({ freq: 1400, to: 250, dur: FIRE_IMPACTS.big - FIRE_IMPACTS.bigStart, type: 'sine', vol: 0.07, delay: FIRE_IMPACTS.bigStart });
          noise({ dur: 1.6, vol: 0.7, freq: 400, delay: FIRE_IMPACTS.big });
          tone({ freq: 90, to: 25, dur: 1.4, type: 'sawtooth', vol: 0.4, delay: FIRE_IMPACTS.big });
        } else if (e.winnerElement === 'agua') {
          noise({ dur: 2.5, vol: 0.3, freq: 900, delay: 0.2 });
        } else if (e.winnerElement === 'ar') {
          tone({ freq: 200, to: 600, dur: 2.5, type: 'sawtooth', vol: 0.05, delay: 0.1 });
          noise({ dur: 2.5, vol: 0.2, freq: 1500, delay: 0.1 });
        } else if (e.winnerElement === 'terra') {
          tone({ freq: 50, to: 30, dur: 3, type: 'sawtooth', vol: 0.35 });
          noise({ dur: 3, vol: 0.3, freq: 200 });
          // tranco de cada pilar subindo e a pancada final
          for (const at of QUAKE_HITS.pillars) {
            tone({ freq: 75, to: 35, dur: 0.35, type: 'sine', vol: 0.45, delay: at });
            noise({ dur: 0.4, vol: 0.25, freq: 350, delay: at });
          }
          noise({ dur: 1.3, vol: 0.65, freq: 260, delay: QUAKE_HITS.slam });
          tone({ freq: 60, to: 20, dur: 1.2, type: 'sawtooth', vol: 0.4, delay: QUAKE_HITS.slam });
        }
        tone({ freq: 523, dur: 0.15, type: 'triangle', vol: 0.2 });
        tone({ freq: 659, dur: 0.15, type: 'triangle', vol: 0.2, delay: 0.15 });
        tone({ freq: 784, dur: 0.3, type: 'triangle', vol: 0.2, delay: 0.3 });
        break;
      default:
        break;
    }
  }
}

export function beep() {
  tone({ freq: 440, dur: 0.12, type: 'square', vol: 0.15 });
}
