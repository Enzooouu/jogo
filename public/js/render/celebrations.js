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
    const fx = tsunamiFront(t);
    const s = WAVE_SCALE;
    // respingos saindo da ponta da onda
    for (let i = 0; i < 3; i++) {
      if (Math.random() > dt * 40) continue;
      P.add({
        x: fx + (100 + Math.random() * 60) * s, y: WAVE_BASE - (430 + Math.random() * 120) * s,
        vx: 250 + Math.random() * 300, vy: -120 + Math.random() * 260,
        life: 0.9, size: 2.5 + Math.random() * 3.5, color: 'rgba(235,252,255,0.95)', gravity: 900,
      });
    }
    if (Math.random() < dt * 8) {
      P.add({ x: fx + 120 * s, y: WAVE_BASE - 480 * s, vx: 180, vy: -30, life: 1.2, size: 16, grow: 40, color: 'rgba(220,245,255,0.25)' });
    }
    // depois que a crista passa, cai uma chuvinha de gotas
    if (fx > 200 && Math.random() < dt * 50) {
      const x = -100 + Math.random() * Math.min(1500, fx + 100);
      P.add({ x, y: -40 + Math.random() * 200, vx: 60, vy: 300 + Math.random() * 200, life: 1.2, size: 1.6, color: 'rgba(200,240,255,0.8)', gravity: 400 });
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
  else if (cel.element === 'agua' && layer === 'back') tsunami(ctx, cel.t);
  else if (cel.element === 'agua' && layer === 'mid') islandWash(ctx, cel.t);
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

// Onda gigante passando atrás da ilha, da esquerda para a direita, com a
// crista curvando para a frente (como um tubo de surf).
const WAVE_BASE = 860;
const WAVE_SCALE = 1;

function tsunamiFront(t) {
  // começa devagar e acelera um pouco
  const u = Math.max(0, t - 0.15);
  return -700 + u * 520 + u * u * 30;
}

function wavePath(ctx, fx, base, s, wob) {
  ctx.beginPath();
  ctx.moveTo(fx - 1700 * s, base);
  ctx.bezierCurveTo(fx - 1100 * s, base, fx - 650 * s, base - 300 * s, fx - 330 * s, base - 480 * s);
  ctx.bezierCurveTo(fx - 210 * s, base - 590 * s, fx - 20 * s, base - 650 * s, fx + 100 * s, base - 600 * s);
  ctx.bezierCurveTo(fx + 190 * s, base - 560 * s, fx + 210 * s, base - 455 * s, fx + 150 * s + wob, base - 395 * s);
  ctx.bezierCurveTo(fx + 110 * s, base - 360 * s, fx + 60 * s, base - 410 * s, fx + 25 * s, base - 440 * s);
  ctx.bezierCurveTo(fx - 60 * s, base - 420 * s, fx - 95 * s, base - 280 * s, fx - 35 * s, base - 180 * s);
  ctx.bezierCurveTo(fx + 20 * s, base - 90 * s, fx + 140 * s, base - 20 * s, fx + 290 * s, base);
  ctx.closePath();
}

// Ponto numa curva de Bézier cúbica (para espalhar a espuma pela crista)
function bez(p0, p1, p2, p3, u) {
  const v = 1 - u;
  return v * v * v * p0 + 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u * p3;
}

function drawWave(ctx, fx, base, s, t, dark) {
  const wob = Math.sin(t * 7) * 6 * s;
  const top = base - 650 * s;

  // corpo da onda
  wavePath(ctx, fx, base, s, wob);
  const g = ctx.createLinearGradient(0, top, 0, base);
  if (dark) {
    g.addColorStop(0, 'rgba(70,150,210,0.9)');
    g.addColorStop(1, 'rgba(8,30,80,0.95)');
  } else {
    g.addColorStop(0, '#c8f4ff');
    g.addColorStop(0.18, '#5cc0f5');
    g.addColorStop(0.55, '#1f78d6');
    g.addColorStop(1, '#0a2d72');
  }
  ctx.fillStyle = g;
  ctx.fill();

  ctx.save();
  wavePath(ctx, fx, base, s, wob);
  ctx.clip();
  // brilho na face (luz atravessando a água perto da crista)
  const glow = ctx.createRadialGradient(fx - 120 * s, base - 480 * s, 10, fx - 120 * s, base - 480 * s, 300 * s);
  glow.addColorStop(0, 'rgba(180,255,240,0.45)');
  glow.addColorStop(1, 'rgba(180,255,240,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(fx - 500 * s, base - 700 * s, 800 * s, 600 * s);
  // listras de água subindo pela face
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 3 * s;
  ctx.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const k = (t * 0.9 + i / 14) % 1;
    const x = fx - (900 - i * 55) * s;
    const y = base - k * 520 * s;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 40 * s, y - 30 * s, x + 90 * s, y - 40 * s);
    ctx.stroke();
  }
  // sombra dentro do tubo
  ctx.strokeStyle = 'rgba(5,25,70,0.55)';
  ctx.lineWidth = 60 * s;
  ctx.beginPath();
  ctx.moveTo(fx + 25 * s, base - 440 * s);
  ctx.bezierCurveTo(fx - 60 * s, base - 420 * s, fx - 95 * s, base - 280 * s, fx - 35 * s, base - 180 * s);
  ctx.stroke();
  ctx.restore();

  if (dark) return;

  // espuma grossa na crista e na ponta
  ctx.strokeStyle = 'rgba(245,253,255,0.95)';
  ctx.lineCap = 'round';
  ctx.lineWidth = 16 * s;
  ctx.beginPath();
  ctx.moveTo(fx - 330 * s, base - 480 * s);
  ctx.bezierCurveTo(fx - 210 * s, base - 590 * s, fx - 20 * s, base - 650 * s, fx + 100 * s, base - 600 * s);
  ctx.bezierCurveTo(fx + 190 * s, base - 560 * s, fx + 210 * s, base - 455 * s, fx + 150 * s + wob, base - 395 * s);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 26; i++) {
    const u = i / 25;
    const seg = u < 0.6 ? 0 : 1;
    const v = seg === 0 ? u / 0.6 : (u - 0.6) / 0.4;
    const x = seg === 0
      ? bez(fx - 330 * s, fx - 210 * s, fx - 20 * s, fx + 100 * s, v)
      : bez(fx + 100 * s, fx + 190 * s, fx + 210 * s, fx + 150 * s + wob, v);
    const y = seg === 0
      ? bez(base - 480 * s, base - 590 * s, base - 650 * s, base - 600 * s, v)
      : bez(base - 600 * s, base - 560 * s, base - 455 * s, base - 395 * s, v);
    const r = (6 + Math.abs(Math.sin(t * 9 + i * 1.7)) * 9) * s;
    ctx.beginPath();
    ctx.arc(x + Math.sin(t * 6 + i) * 4, y + Math.cos(t * 5 + i) * 4, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // espuma na base da onda
  ctx.fillStyle = 'rgba(235,250,255,0.8)';
  for (let i = 0; i < 10; i++) {
    const x = fx + (160 + i * 14) * s;
    ctx.beginPath();
    ctx.arc(x, base - (10 + Math.abs(Math.sin(t * 8 + i)) * 20) * s, (8 + (i % 3) * 4) * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tsunami(ctx, t) {
  const fx = tsunamiFront(t);
  // céu escurecendo/azulando enquanto a onda passa
  const k = Math.min(1, t / 0.8);
  ctx.fillStyle = `rgba(10,50,110,${0.28 * k})`;
  ctx.fillRect(-1200, -900, 3700, 2400);
  // onda de trás (mais longe, menor e escura) e a onda principal
  drawWave(ctx, fx - 520, WAVE_BASE + 40, 0.7, t + 1.3, true);
  drawWave(ctx, fx, WAVE_BASE, WAVE_SCALE, t, false);
}

// Lâmina de água com espuma escorrendo por cima da ilha depois da crista
function islandWash(ctx, t) {
  const fx = tsunamiFront(t);
  const right = Math.min(1100, fx + 40);
  if (right <= 180) return;
  const fade = Math.max(0, Math.min(1, (3.7 - t) / 0.8));
  ctx.save();
  ctx.globalAlpha *= 0.6 * fade;
  ctx.fillStyle = '#4fb2f0';
  ctx.beginPath();
  ctx.moveTo(180, 548);
  for (let x = 180; x <= right; x += 12) ctx.lineTo(x, 532 + Math.sin(x * 0.05 + t * 8) * 4);
  ctx.lineTo(right, 548);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#eafcff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 180; x <= right; x += 12) {
    const y = 532 + Math.sin(x * 0.05 + t * 8) * 4;
    if (x === 180) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
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
