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

// Barulho de fundo do mapa (só o Coliseu tem: o murmúrio da torcida)
let ambience = null;
let crowdLoop = null;

export function setAmbience(kind) {
  if (kind === ambience) return;
  ambience = kind;
  if (crowdLoop) {
    try {
      crowdLoop.stop();
    } catch {
      // já tinha parado
    }
    crowdLoop = null;
  }
  const c = ensure();
  if (!c || kind !== 'torcida') return;
  // ruído filtrado em loop: parece um monte de gente conversando longe
  const len = c.sampleRate * 2;
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (0.7 + 0.3 * Math.sin(i / 1800));
  const src = c.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const band = c.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 520;
  band.Q.value = 0.8;
  const gain = c.createGain();
  gain.gain.value = 0.05;
  src.connect(band).connect(gain).connect(master);
  src.start();
  crowdLoop = src;
}

// Grito da torcida: ruído filtrado na faixa da voz que cresce, fica um
// tempo e some devagar, com um monte de "êêê!" de vozes diferentes no meio
function crowdRoar(vol = 0.5, dur = 2.2, delay = 0) {
  const c = ensure();
  if (!c || muted) return;
  const t = c.currentTime + delay;
  const len = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  for (const [freq, q, share] of [[700, 0.9, 1], [1600, 1.2, 0.7]]) {
    const src = c.createBufferSource();
    src.buffer = buffer;
    const band = c.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = freq;
    band.Q.value = q;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol * share, t + 0.25);
    gain.gain.setValueAtTime(vol * share, t + dur * 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(band).connect(gain).connect(master);
    src.start(t);
    src.stop(t + dur + 0.05);
  }
  // vozes gritando
  for (let i = 0; i < 14; i++) {
    const f = 260 + Math.random() * 380;
    tone({ freq: f, to: f * (1.15 + Math.random() * 0.3), dur: 0.35 + Math.random() * 0.4, type: 'sawtooth', vol: 0.025, delay: delay + 0.05 + Math.random() * dur * 0.5 });
  }
}

// Torcida: comemoração (alguém caiu) e "uooooh" (golpe forte)
function cheer(vol = 0.35, delay = 0) {
  crowdRoar(vol * 1.4, 2.2, delay);
}

function ooh() {
  tone({ freq: 240, to: 170, dur: 0.8, type: 'sawtooth', vol: 0.05 });
  tone({ freq: 300, to: 210, dur: 0.8, type: 'triangle', vol: 0.05 });
  noise({ dur: 0.7, vol: 0.12, freq: 700 });
}

// Toca o som de cada evento da partida.
export function playEvents(events, localId) {
  if (ambience === 'torcida') {
    for (const e of events) {
      if (e.type === 'ko') cheer();
      else if (e.type === 'hit' && e.kb > 650) ooh();
      else if (e.type === 'itemThrown') cheer(0.12);
      else if (e.type === 'collapse') {
        noise({ dur: 1.8, vol: 0.6, freq: 300 });
        tone({ freq: 70, to: 25, dur: 1.6, type: 'sawtooth', vol: 0.35 });
        cheer(0.4, 0.3);
      }
    }
  }
  for (const e of events) {
    switch (e.type) {
      case 'jump':
        if (e.id === localId) tone({ freq: e.double ? 520 : 380, to: e.double ? 900 : 640, dur: 0.1, type: 'triangle', vol: 0.15 });
        break;
      case 'wallsWarn':
        // trombeta de morte súbita
        tone({ freq: 220, dur: 0.35, type: 'sawtooth', vol: 0.16 });
        tone({ freq: 277, dur: 0.35, type: 'sawtooth', vol: 0.16, delay: 0.35 });
        tone({ freq: 330, dur: 0.7, type: 'sawtooth', vol: 0.18, delay: 0.7 });
        break;
      case 'spikeWall':
        noise({ dur: 0.12, vol: 0.3, freq: 3000 });
        tone({ freq: 180, to: 90, dur: 0.15, type: 'square', vol: 0.15 });
        break;
      case 'lunge':
        // zuuum da investida
        noise({ dur: 0.16, vol: 0.18, freq: 2400 });
        tone({ freq: 260, to: 720, dur: 0.14, type: 'triangle', vol: 0.1 });
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
      case 'combo':
        if (e.kind === 'vapor') noise({ dur: 0.6, vol: 0.25, freq: 3500 });
        else {
          noise({ dur: 0.3, vol: 0.3, freq: 1200 });
          tone({ freq: 300, to: 900, dur: 0.25, type: 'sawtooth', vol: 0.12 });
        }
        break;
      case 'crateOpen':
        noise({ dur: 0.18, vol: 0.3, freq: 900 });
        tone({ freq: 660, to: 990, dur: 0.15, type: 'triangle', vol: 0.1, delay: 0.08 });
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
      // ---- Navio Voador
      case 'cannonFuse':
        noise({ dur: 1.4, vol: 0.12, freq: 5000 });
        break;
      case 'cannonFire':
        noise({ dur: 0.6, vol: 0.55, freq: 500 });
        tone({ freq: 90, to: 35, dur: 0.5, type: 'sawtooth', vol: 0.35 });
        break;
      case 'cannonBoom':
        noise({ dur: 0.7, vol: 0.5, freq: 700 });
        tone({ freq: 120, to: 40, dur: 0.45, type: 'sine', vol: 0.4 });
        break;
      // ---- Lago Congelado
      case 'iceCrack':
        noise({ dur: 0.12, vol: 0.3, freq: 4200 });
        tone({ freq: 1600, to: 700, dur: 0.08, type: 'triangle', vol: 0.08 });
        break;
      case 'iceBreak':
        noise({ dur: 0.45, vol: 0.45, freq: 2600 });
        tone({ freq: 260, to: 70, dur: 0.4, type: 'sawtooth', vol: 0.18 });
        noise({ dur: 0.5, vol: 0.25, freq: 800, delay: 0.12 });
        break;
      case 'iceFreeze':
        tone({ freq: 1400, to: 2100, dur: 0.12, type: 'triangle', vol: 0.07 });
        tone({ freq: 1900, to: 2600, dur: 0.12, type: 'triangle', vol: 0.06, delay: 0.1 });
        break;
      case 'platformMelt':
        noise({ dur: 0.35, vol: 0.22, freq: 1600 });
        tone({ freq: 520, to: 180, dur: 0.3, type: 'sine', vol: 0.12 });
        break;
      case 'blizzardWarn':
        tone({ freq: 380, to: 760, dur: 0.6, type: 'sine', vol: 0.08 });
        tone({ freq: 420, to: 820, dur: 0.6, type: 'sine', vol: 0.06, delay: 0.5 });
        break;
      case 'blizzardStart':
        noise({ dur: 4.4, vol: 0.2, freq: 650 });
        break;
      case 'icicleShake':
        tone({ freq: 2600, dur: 0.04, type: 'triangle', vol: 0.05 });
        tone({ freq: 2900, dur: 0.04, type: 'triangle', vol: 0.05, delay: 0.08 });
        break;
      case 'icicleBreak':
        noise({ dur: 0.2, vol: 0.25, freq: 5200 });
        break;
      case 'snowPickup':
        noise({ dur: 0.12, vol: 0.16, freq: 700 });
        break;
      case 'snowHit':
        noise({ dur: 0.1, vol: 0.25, freq: 600 });
        tone({ freq: 210, to: 110, dur: 0.1, type: 'sine', vol: 0.18 });
        break;
      case 'matchEnd':
        // som da comemoração de cada elemento
        if (e.winnerElement === 'fogo') {
          for (const at of FIRE_IMPACTS.small) noise({ dur: 0.35, vol: 0.22, freq: 600, delay: at });
          // assobio do meteoro gigante chegando e o estrondo
          tone({ freq: 1400, to: 250, dur: FIRE_IMPACTS.big - FIRE_IMPACTS.bigStart, type: 'sine', vol: 0.07, delay: FIRE_IMPACTS.bigStart });
          noise({ dur: 1.6, vol: 0.7, freq: 400, delay: FIRE_IMPACTS.big });
          tone({ freq: 90, to: 25, dur: 1.4, type: 'sawtooth', vol: 0.4, delay: FIRE_IMPACTS.big });
        } else if (e.winnerElement === 'mortal') {
          // soco final: zumbido carregando, pancada enorme e vidro quebrando
          tone({ freq: 120, to: 900, dur: 1, type: 'sawtooth', vol: 0.06 });
          noise({ dur: 1, vol: 0.12, freq: 1800 });
          noise({ dur: 1.2, vol: 0.75, freq: 500, delay: 1.05 });
          tone({ freq: 80, to: 25, dur: 1.2, type: 'sawtooth', vol: 0.45, delay: 1.05 });
          for (let i = 0; i < 6; i++) noise({ dur: 0.12, vol: 0.18, freq: 6000, delay: 1.12 + i * 0.09 });
        } else if (e.winnerElement === 'agua') {
          noise({ dur: 2.5, vol: 0.3, freq: 900, delay: 0.2 });
        } else if (e.winnerElement === 'ar') {
          // vento rodando (grave e agudo) e um sininho no fim
          noise({ dur: 3.2, vol: 0.22, freq: 700, delay: 0.1 });
          noise({ dur: 2.6, vol: 0.12, freq: 2400, delay: 0.5 });
          tone({ freq: 180, to: 420, dur: 3, type: 'sine', vol: 0.06, delay: 0.2 });
          tone({ freq: 1320, dur: 0.6, type: 'triangle', vol: 0.06, delay: 3.2 });
          tone({ freq: 1760, dur: 0.8, type: 'triangle', vol: 0.05, delay: 3.35 });
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

// Tarefa do tutorial concluída: plim de três notas subindo
export function chime() {
  tone({ freq: 660, dur: 0.12, type: 'triangle', vol: 0.18 });
  tone({ freq: 880, dur: 0.12, type: 'triangle', vol: 0.18, delay: 0.1 });
  tone({ freq: 1320, dur: 0.28, type: 'triangle', vol: 0.16, delay: 0.2 });
}
