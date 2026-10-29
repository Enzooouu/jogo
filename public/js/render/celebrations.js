// Comemoração de vitória: cada elemento tem a sua, tocada no fim da partida.
//   fogo  -> chuva de meteoros atrás da ilha
//   agua  -> tsunami atravessando a tela
//   ar    -> tornado gigante
//   terra -> terremoto (tremor, rachaduras, pedras caindo)
//
// Camadas (todas em coordenadas do mundo):
//   'back'  -> atrás da ilha     'mid' -> entre a ilha e os lutadores
//   'front' -> na frente de tudo (menos o placar)

import { drawFireball } from './weapons-art.js';

export const CELEBRATION_TIME = 4;

export function startCelebration(element) {
  return { element, t: 0, seed: 1 };
}

// Efeitos que não são desenho direto: partículas e tremor de tela.
export function updateCelebration(cel, dt, renderer) {
  cel.t += dt;
  const P = renderer.particles;
  const t = cel.t;
  if (cel.element === 'terra') {
    const k = Math.max(0, 1 - t / CELEBRATION_TIME);
    renderer.shake(9 * k + 2, 0.1);
    if (Math.random() < dt * 30 * k) {
      P.add({ x: 180 + Math.random() * 920, y: 540, vx: (Math.random() - 0.5) * 40, vy: -40 - Math.random() * 60, life: 1.2, size: 8, grow: 22, color: 'rgba(150,120,90,0.35)' });
    }
  } else if (cel.element === 'agua') {
    const front = tsunamiFront(t);
    if (Math.random() < dt * 60) {
      const y = 720 - tsunamiHeight(t) + Math.random() * 30;
      P.add({ x: front - Math.random() * 60, y, vx: 200 + Math.random() * 200, vy: -150 - Math.random() * 200, life: 0.8, size: 3, color: 'rgba(225,250,255,0.9)', gravity: 600 });
    }
  } else if (cel.element === 'ar') {
    if (Math.random() < dt * 25) {
      const cx = tornadoX(t);
      P.add({ x: cx + (Math.random() - 0.5) * 200, y: 540, vx: (Math.random() - 0.5) * 100, vy: -260, life: 1, size: 2, color: 'rgba(220,255,248,0.8)' });
    }
  }
}

export function drawCelebration(ctx, cel, layer) {
  if (!cel) return;
  const fade = Math.min(1, cel.t / 0.4, (CELEBRATION_TIME - cel.t) / 0.5);
  if (fade <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, fade);
  if (cel.element === 'fogo' && layer === 'back') meteors(ctx, cel.t);
  else if (cel.element === 'ar' && layer === 'back') tornado(ctx, cel.t);
  else if (cel.element === 'agua' && layer === 'mid') tsunami(ctx, cel.t);
  else if (cel.element === 'terra' && layer === 'front') quake(ctx, cel.t);
  ctx.restore();
}

function rand(i, k = 0) {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ---------------------------------------------------------------- fogo

function meteors(ctx, t) {
  // brilho vermelho no céu
  const sky = ctx.createLinearGradient(0, -400, 0, 600);
  sky.addColorStop(0, 'rgba(255,80,30,0.25)');
  sky.addColorStop(1, 'rgba(255,80,30,0)');
  ctx.fillStyle = sky;
  ctx.fillRect(-600, -400, 2500, 1000);

  for (let i = 0; i < 34; i++) {
    const start = i * 0.1;
    const life = t - start;
    if (life < 0) continue;
    const x0 = -300 + rand(i) * 1600;
    const vx = 380 + rand(i, 1) * 160;
    const vy = 720 + rand(i, 2) * 200;
    const groundY = 380 + rand(i, 3) * 240;
    const r = 7 + rand(i, 4) * 12;
    const hitT = (groundY + 300) / vy;
    if (life < hitT) {
      const x = x0 + vx * life;
      const y = -300 + vy * life;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(vy, vx));
      drawFireball(ctx, 0, 0, r, t + i, 1);
      ctx.restore();
    } else if (life < hitT + 0.6) {
      // impacto atrás da ilha
      const k = (life - hitT) / 0.6;
      const x = x0 + vx * hitT;
      const g = ctx.createRadialGradient(x, groundY, 2, x, groundY, r * 7 * (0.5 + k));
      g.addColorStop(0, `rgba(255,230,150,${0.9 * (1 - k)})`);
      g.addColorStop(0.4, `rgba(255,110,30,${0.6 * (1 - k)})`);
      g.addColorStop(1, 'rgba(255,60,20,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r * 8, groundY - r * 8, r * 16, r * 16);
    }
  }
}

// ---------------------------------------------------------------- água

function tsunamiFront(t) {
  return -500 + Math.max(0, t - 0.2) * 900;
}

function tsunamiHeight(t) {
  return 420 + Math.sin(t * 2) * 30;
}

function tsunami(ctx, t) {
  const front = tsunamiFront(t);
  const H = tsunamiHeight(t);
  const base = 900;
  const top = 720 - H;
  const back = front - 1600;
  ctx.beginPath();
  ctx.moveTo(back, base);
  for (let x = back; x <= front - 120; x += 30) {
    const u = (x - back) / (front - 120 - back);
    const y = 720 - H * (0.35 + 0.65 * u * u) + Math.sin(x * 0.02 + t * 6) * 10;
    ctx.lineTo(x, y);
  }
  // crista curvando para a frente
  ctx.quadraticCurveTo(front - 40, top - 70, front + 60, top + 10);
  ctx.quadraticCurveTo(front + 10, top + 30, front - 10, top + 90);
  ctx.quadraticCurveTo(front + 40, top + 260, front + 140, base);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, top, 0, base);
  g.addColorStop(0, 'rgba(120,210,255,0.78)');
  g.addColorStop(0.4, 'rgba(30,110,220,0.72)');
  g.addColorStop(1, 'rgba(10,40,120,0.8)');
  ctx.fillStyle = g;
  ctx.fill();
  // espuma na crista
  ctx.strokeStyle = 'rgba(240,252,255,0.95)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(front - 260, top + 40 + Math.sin(t * 6) * 6);
  ctx.quadraticCurveTo(front - 60, top - 60, front + 60, top + 10);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const y = top + 80 + i * 45;
    ctx.beginPath();
    ctx.moveTo(front - 900 + ((t * 300 + i * 120) % 700), y);
    ctx.lineTo(front - 820 + ((t * 300 + i * 120) % 700), y - 6);
    ctx.stroke();
  }
}

// ---------------------------------------------------------------- ar

function tornadoX(t) {
  return 640 + Math.sin(t * 0.9) * 260;
}

function tornado(ctx, t) {
  const cx = tornadoX(t);
  const grow = Math.min(1, t / 0.8);
  const bottom = 620;
  const topY = -380;
  const rings = 26;
  for (let i = 0; i < rings; i++) {
    const u = i / (rings - 1);
    const y = bottom + (topY - bottom) * u;
    const w = (40 + u * u * 420) * grow;
    const sway = Math.sin(t * 2 + u * 3) * 40 * u;
    ctx.strokeStyle = i % 2 ? 'rgba(235,255,250,0.55)' : 'rgba(127,255,224,0.45)';
    ctx.lineWidth = 3 + u * 6;
    const a0 = (t * 5 + i * 0.4) % (Math.PI * 2);
    ctx.beginPath();
    ctx.ellipse(cx + sway, y, w, 10 + u * 26, 0, a0, a0 + Math.PI * 1.4);
    ctx.stroke();
  }
  // pedras e destroços girando
  for (let i = 0; i < 16; i++) {
    const u = rand(i, 5);
    const y = bottom + (topY - bottom) * u;
    const w = (40 + u * u * 420) * grow;
    const a = t * (3 + rand(i, 6) * 2) + i;
    const x = cx + Math.sin(t * 2 + u * 3) * 40 * u + Math.cos(a) * w;
    const yy = y + Math.sin(a) * (10 + u * 26);
    const s = 4 + rand(i, 7) * 8;
    ctx.fillStyle = Math.sin(a) > 0 ? '#6b5560' : '#3a2e40';
    ctx.save();
    ctx.translate(x, yy);
    ctx.rotate(a * 2);
    ctx.fillRect(-s / 2, -s / 2, s, s * 0.7);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- terra

const CRACKS = [
  [[250, 540], [300, 560], [280, 600], [320, 640]],
  [[620, 540], [600, 575], [650, 610], [630, 660], [670, 700]],
  [[1020, 540], [990, 580], [1040, 620], [1010, 680]],
  [[520, 540], [560, 570], [540, 600]],
  [[760, 540], [730, 565], [770, 600], [750, 640]],
];

function quake(ctx, t) {
  // rachaduras brilhando que vão crescendo
  const grow = Math.min(1, t / 1.2);
  ctx.strokeStyle = '#ffb347';
  ctx.shadowColor = '#ff7a1a';
  ctx.shadowBlur = 12;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  for (const crack of CRACKS) {
    const n = Math.max(2, Math.ceil(crack.length * grow));
    ctx.beginPath();
    crack.slice(0, n).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  // pedras caindo do céu
  for (let i = 0; i < 22; i++) {
    const start = 0.3 + i * 0.13;
    const life = t - start;
    if (life < 0) continue;
    const x = 200 + rand(i, 8) * 880;
    const y = -80 + 0.5 * 1600 * life * life;
    if (y > 560) continue;
    const s = 8 + rand(i, 9) * 14;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(life * (4 + rand(i, 10) * 4));
    ctx.fillStyle = '#7a5a3a';
    ctx.strokeStyle = '#140a0a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s, 0); ctx.lineTo(-s * 0.5, -s * 0.8); ctx.lineTo(s * 0.6, -s * 0.7); ctx.lineTo(s, 0.1 * s); ctx.lineTo(s * 0.3, s * 0.8); ctx.lineTo(-s * 0.6, s * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
