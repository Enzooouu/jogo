// Cenário da Pirâmide do Sol (Rei da Ilha): deserto ao meio-dia.
//
//   céu      azul forte em cima, amarelo-claro no horizonte, sol alto com
//            raios girando devagar
//   longe    dunas e pirâmides pequenas lá no fundo
//   meio     dunas mais perto, um oásis com palmeiras e obeliscos
//   campo    pirâmide em degraus de arenito com faixas de hieróglifos, topo
//            dourado com o sol, areia na base e dois blocos flutuando
//
// Mesmo formato dos outros cenários (ver stage.js).

import { seeded, glowSprite } from './stage-util.js';

const INK = '#2a1a0c';
const SAND = { light: '#f3d79a', mid: '#e2bb72', dark: '#c49a52', deep: '#9a7438' };
const STONE = { top: '#f0d49a', light: '#ddb878', mid: '#c89e5e', dark: '#a37a42', deep: '#7a5a30', mortar: '#6a4a24' };
const GOLD = { light: '#fff0a8', mid: '#f2c440', dark: '#c8901e' };
const SUN = { x: 980, y: 120 };

// ================================================================ céu

function paintSky(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, 720);
  sky.addColorStop(0, '#2f7fd8');
  sky.addColorStop(0.45, '#7ab8ec');
  sky.addColorStop(0.75, '#d8e6d8');
  sky.addColorStop(1, '#ffe7b0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1280, 720);
  const glow = ctx.createRadialGradient(SUN.x, SUN.y, 20, SUN.x, SUN.y, 380);
  glow.addColorStop(0, 'rgba(255,250,220,0.9)');
  glow.addColorStop(0.2, 'rgba(255,240,180,0.45)');
  glow.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#fffbe6';
  ctx.beginPath();
  ctx.arc(SUN.x, SUN.y, 48, 0, Math.PI * 2);
  ctx.fill();
  // fiapos de nuvem
  const rand = seeded(8);
  for (let i = 0; i < 5; i++) {
    const x = rand() * 1280;
    const y = 60 + rand() * 180;
    const w = 180 + rand() * 220;
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// raios do sol girando e um falcão planando
function skyAnimated(ctx, t) {
  ctx.save();
  ctx.translate(SUN.x, SUN.y);
  ctx.rotate(t * 0.05);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++) {
    ctx.rotate((Math.PI * 2) / 12);
    const g = ctx.createLinearGradient(0, 60, 0, 300);
    g.addColorStop(0, 'rgba(255,240,190,0.16)');
    g.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-10, 60);
    ctx.lineTo(10, 60);
    ctx.lineTo(34, 300);
    ctx.lineTo(-34, 300);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // falcão fazendo círculos
  const a = t * 0.35;
  const x = 360 + Math.cos(a) * 140;
  const y = 150 + Math.sin(a) * 40;
  const flap = Math.sin(t * 3) * 2;
  ctx.strokeStyle = 'rgba(60,40,30,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 2 - flap);
  ctx.quadraticCurveTo(x - 5, y - 5, x, y);
  ctx.quadraticCurveTo(x + 5, y - 5, x + 12, y - 2 - flap);
  ctx.stroke();
}

// ================================================================ longe

function dune(ctx, base, amp, color, phase, len = 520) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-800, 1500);
  for (let x = -800; x <= 2100; x += 20) {
    ctx.lineTo(x, base - amp * (0.6 + 0.4 * Math.sin(x / len + phase)) - amp * 0.3 * Math.sin(x / (len * 0.43) + phase * 2));
  }
  ctx.lineTo(2100, 1500);
  ctx.closePath();
  ctx.fill();
}

function smallPyramid(ctx, x, base, h, light, dark) {
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.moveTo(x - h, base);
  ctx.lineTo(x, base - h);
  ctx.lineTo(x + h * 0.25, base);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(x + h * 0.25, base);
  ctx.lineTo(x, base - h);
  ctx.lineTo(x + h, base);
  ctx.closePath();
  ctx.fill();
}

function drawFar(ctx) {
  dune(ctx, 520, 60, '#e8c992', 0.4, 600);
  smallPyramid(ctx, 140, 478, 90, '#e6c48a', '#c9a46a');
  smallPyramid(ctx, 300, 486, 56, '#e6c48a', '#c9a46a');
  smallPyramid(ctx, 1160, 474, 110, '#e6c48a', '#c9a46a');
  dune(ctx, 560, 50, '#dfb978', 1.7, 420);
}

function farAnimated() {}

// ================================================================ meio

function palm(ctx, x, y, h, lean, rand) {
  // tronco curvo em gomos
  ctx.strokeStyle = '#7a5530';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * 0.4, y - h * 0.6, x + lean, y - h);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(60,40,20,0.5)';
  ctx.lineWidth = 2;
  for (let k = 0.1; k < 1; k += 0.12) {
    const px = x + lean * 0.4 * 2 * k * (1 - k) + lean * k * k;
    const py = y - h * k;
    ctx.beginPath();
    ctx.moveTo(px - 4, py);
    ctx.lineTo(px + 4, py - 2);
    ctx.stroke();
  }
  // folhas
  const tx = x + lean;
  const ty = y - h;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI + (i / 6) * Math.PI + (rand() - 0.5) * 0.2;
    const len = 50 + rand() * 20;
    ctx.strokeStyle = i % 2 ? '#3f8a3a' : '#2f6e2c';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a) * len * 0.6, ty + Math.sin(a) * len * 0.6 - 14, tx + Math.cos(a) * len, ty + Math.sin(a) * len * 0.5 + 16);
    ctx.stroke();
  }
  ctx.fillStyle = '#6a4020';
  for (const dx of [-5, 3]) {
    ctx.beginPath();
    ctx.arc(tx + dx, ty + 6, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function obelisk(ctx, x, base, h) {
  ctx.fillStyle = '#d8b276';
  ctx.beginPath();
  ctx.moveTo(x - 12, base);
  ctx.lineTo(x - 8, base - h);
  ctx.lineTo(x, base - h - 16);
  ctx.lineTo(x + 8, base - h);
  ctx.lineTo(x + 12, base);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(120,80,40,0.35)';
  ctx.fillRect(x, base - h, 10, h);
  ctx.fillStyle = GOLD.mid;
  ctx.beginPath();
  ctx.moveTo(x - 8, base - h);
  ctx.lineTo(x, base - h - 16);
  ctx.lineTo(x + 8, base - h);
  ctx.closePath();
  ctx.fill();
}

function drawMid(ctx, map, rand) {
  dune(ctx, 620, 70, '#e9c47e', 2.6, 380);
  // oásis à esquerda
  ctx.fillStyle = '#3aa6c8';
  ctx.beginPath();
  ctx.ellipse(40, 590, 170, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(-60, 586, 120, 2);
  ctx.fillStyle = '#5a9a3a';
  ctx.beginPath();
  ctx.ellipse(40, 604, 200, 14, 0, 0, Math.PI);
  ctx.fill();
  palm(ctx, -60, 594, 150, 30, rand);
  palm(ctx, 30, 600, 180, -20, rand);
  palm(ctx, 140, 596, 130, 26, rand);
  // obeliscos à direita
  obelisk(ctx, 1150, 612, 150);
  obelisk(ctx, 1260, 616, 120);
  palm(ctx, 1360, 610, 160, -28, rand);
  dune(ctx, 680, 50, '#e2b56a', 4.1, 300);
}

function midAnimated() {}

// ================================================================ campo

// degrau da pirâmide: blocos de arenito com uma faixa de hieróglifos
function step(ctx, s, rand, glyphs) {
  const g = ctx.createLinearGradient(0, s.y, 0, s.y + s.h);
  g.addColorStop(0, STONE.light);
  g.addColorStop(1, STONE.dark);
  ctx.fillStyle = g;
  ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(s.x, s.y, s.w, s.h);
  ctx.clip();
  const bh = 23;
  for (let y = s.y + 8, r = 0; y < s.y + s.h; y += bh, r++) {
    for (let x = s.x - (r % 2) * 28; x < s.x + s.w; x += 56) {
      ctx.fillStyle = `rgba(255,240,200,${0.05 + rand() * 0.1})`;
      ctx.fillRect(x + 2, y + 2, 52, bh - 4);
      // pedrinha gasta
      if (rand() < 0.2) {
        ctx.fillStyle = 'rgba(90,60,30,0.25)';
        ctx.beginPath();
        ctx.arc(x + 10 + rand() * 36, y + 6 + rand() * 10, 1.5 + rand() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.strokeStyle = STONE.mortar;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(s.x, y);
    ctx.lineTo(s.x + s.w, y);
    for (let x = s.x - (r % 2) * 28; x < s.x + s.w; x += 56) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + bh);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (glyphs) {
    // faixa pintada com hieróglifos simples
    const y = s.y + 14;
    ctx.fillStyle = 'rgba(60,110,170,0.75)';
    ctx.fillRect(s.x, y, s.w, 18);
    ctx.fillStyle = GOLD.mid;
    ctx.fillRect(s.x, y, s.w, 2);
    ctx.fillRect(s.x, y + 16, s.w, 2);
    ctx.strokeStyle = GOLD.light;
    ctx.lineWidth = 1.6;
    for (let x = s.x + 16, i = 0; x < s.x + s.w - 10; x += 30, i++) {
      ctx.beginPath();
      const k = i % 4;
      if (k === 0) { ctx.arc(x, y + 9, 4, 0, Math.PI * 2); ctx.moveTo(x, y + 13); ctx.lineTo(x, y + 16); }   // ankh-ish
      else if (k === 1) { ctx.moveTo(x - 5, y + 14); ctx.lineTo(x, y + 4); ctx.lineTo(x + 5, y + 14); }    // triângulo
      else if (k === 2) { ctx.ellipse(x, y + 9, 6, 3.5, 0, 0, Math.PI * 2); ctx.moveTo(x + 1.5, y + 9); ctx.arc(x, y + 9, 1.5, 0, Math.PI * 2); } // olho
      else { ctx.moveTo(x - 5, y + 5); ctx.quadraticCurveTo(x + 6, y + 6, x - 1, y + 14); }                 // onda
      ctx.stroke();
    }
  }
  // sombra embaixo de cada degrau
  ctx.fillStyle = 'rgba(80,50,20,0.25)';
  ctx.fillRect(s.x, s.y + s.h - 8, s.w, 8);
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(s.x, s.y, s.w, s.h);
  // beirada clara onde se pisa
  ctx.fillStyle = STONE.top;
  ctx.fillRect(s.x - 3, s.y - 2, s.w + 6, 7);
  ctx.fillStyle = 'rgba(255,250,230,0.7)';
  ctx.fillRect(s.x - 3, s.y - 2, s.w + 6, 2);
  ctx.strokeRect(s.x - 3, s.y - 2, s.w + 6, 7);
}

// topo de ouro com o sol gravado
function capstone(ctx, s) {
  const g = ctx.createLinearGradient(s.x, 0, s.x + s.w, 0);
  g.addColorStop(0, GOLD.light);
  g.addColorStop(0.5, GOLD.mid);
  g.addColorStop(1, GOLD.dark);
  ctx.fillStyle = g;
  ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(s.x, s.y, s.w, s.h);
  const cx = s.x + s.w / 2;
  const cy = s.y + s.h / 2 + 4;
  ctx.strokeStyle = GOLD.dark;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.moveTo(cx + Math.cos(a) * 19, cy + Math.sin(a) * 19);
    ctx.lineTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(s.x + 6, s.y + 6, 10, s.h - 12);
  ctx.fillStyle = GOLD.light;
  ctx.fillRect(s.x - 3, s.y - 2, s.w + 6, 6);
  ctx.strokeStyle = INK;
  ctx.strokeRect(s.x - 3, s.y - 2, s.w + 6, 6);
}

// bloco de arenito flutuando (plataforma), com a parte de baixo quebrada
function floatingBlock(ctx, p, rand) {
  const y = p.y;
  ctx.fillStyle = STONE.mid;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(p.x, y);
  ctx.lineTo(p.x + p.w, y);
  ctx.lineTo(p.x + p.w - 6, y + 24);
  let x = p.x + p.w - 6;
  while (x > p.x + 10) {
    x -= 14 + rand() * 12;
    ctx.lineTo(Math.max(p.x + 8, x), y + 26 + rand() * 22);
  }
  ctx.lineTo(p.x + 6, y + 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,200,0.25)';
  ctx.fillRect(p.x + 4, y + 4, p.w - 8, 8);
  ctx.fillStyle = STONE.top;
  ctx.fillRect(p.x - 3, y - 2, p.w + 6, 7);
  ctx.strokeRect(p.x - 3, y - 2, p.w + 6, 7);
  // olho de Hórus pintado
  const cx = p.x + p.w / 2;
  ctx.strokeStyle = 'rgba(40,70,130,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, y + 18, 10, 5, 0, 0, Math.PI * 2);
  ctx.moveTo(cx + 2, y + 18);
  ctx.arc(cx, y + 18, 2, 0, Math.PI * 2);
  ctx.moveTo(cx - 4, y + 23);
  ctx.lineTo(cx - 6, y + 30);
  ctx.stroke();
}

function urn(ctx, x, y) {
  ctx.fillStyle = '#b86a3a';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 6, y);
  ctx.quadraticCurveTo(x - 14, y - 12, x - 7, y - 22);
  ctx.lineTo(x + 7, y - 22);
  ctx.quadraticCurveTo(x + 14, y - 12, x + 6, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8c070';
  ctx.fillRect(x - 9, y - 14, 18, 3);
}

function drawTerrain(ctx, map, rand) {
  const [base, s2, s3, top] = map.solids;
  // monte de areia na base da pirâmide (abre para os lados até embaixo)
  const sand = ctx.createLinearGradient(0, base.y, 0, base.y + 200);
  sand.addColorStop(0, SAND.light);
  sand.addColorStop(0.5, SAND.mid);
  sand.addColorStop(1, SAND.dark);
  ctx.fillStyle = sand;
  ctx.beginPath();
  ctx.moveTo(base.x - 20, base.y + 6);
  ctx.lineTo(base.x + base.w + 20, base.y + 6);
  ctx.bezierCurveTo(base.x + base.w + 26, base.y + 70, base.x + base.w + 40, base.y + 150, base.x + base.w + 110, base.y + 220);
  ctx.lineTo(base.x - 110, base.y + 220);
  ctx.bezierCurveTo(base.x - 40, base.y + 150, base.x - 26, base.y + 70, base.x - 20, base.y + 6);
  ctx.closePath();
  ctx.fill();
  // brilho na crista da areia
  ctx.strokeStyle = 'rgba(255,248,220,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(base.x - 110, base.y + 220);
  ctx.bezierCurveTo(base.x - 40, base.y + 150, base.x - 26, base.y + 70, base.x - 20, base.y + 6);
  ctx.moveTo(base.x + base.w + 20, base.y + 6);
  ctx.bezierCurveTo(base.x + base.w + 26, base.y + 70, base.x + base.w + 40, base.y + 150, base.x + base.w + 110, base.y + 220);
  ctx.stroke();
  // ondinhas na areia
  ctx.strokeStyle = 'rgba(150,110,50,0.4)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 9; i++) {
    const y = base.y + 30 + i * 18;
    ctx.beginPath();
    ctx.moveTo(base.x + 20 + rand() * 60, y);
    ctx.quadraticCurveTo(base.x + base.w / 2, y + 8, base.x + base.w - 20 - rand() * 60, y);
    ctx.stroke();
  }
  // degraus (de baixo para cima)
  step(ctx, { ...base, h: 40 }, rand, false);
  step(ctx, s2, rand, true);
  step(ctx, s3, rand, true);
  capstone(ctx, top);
  // escadinha no meio da frente
  ctx.fillStyle = 'rgba(120,80,40,0.3)';
  for (const s of [s2, s3]) ctx.fillRect(s.x + s.w / 2 - 30, s.y + 34, 60, s.h - 34);
  // vasos nas beiradas
  for (const [x, y] of [[base.x + 24, base.y], [base.x + base.w - 24, base.y], [s2.x + 24, s2.y], [s2.x + s2.w - 24, s2.y]]) urn(ctx, x, y);
  // blocos flutuando
  for (const p of map.platforms) floatingBlock(ctx, p, rand);
}

// ================================================================ frente (animado)

function brazier(ctx, x, y, time) {
  ctx.fillStyle = '#5a3a1a';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 22);
  ctx.lineTo(x + 12, y - 22);
  ctx.lineTo(x + 7, y - 10);
  ctx.lineTo(x - 7, y - 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(x - 2, y - 10, 4, 10);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.5 + Math.sin(time * 9) * 0.1;
  ctx.drawImage(glowSprite('255,170,60'), x - 36, y - 64, 72, 72);
  ctx.restore();
  for (let i = 0; i < 3; i++) {
    const h = 20 - i * 5 + Math.sin(time * 12 + i * 2) * 3;
    ctx.fillStyle = ['#ff6a1f', '#ffa53a', '#ffe08a'][i];
    ctx.beginPath();
    ctx.moveTo(x - 10 + i * 3, y - 22);
    ctx.quadraticCurveTo(x - 8, y - 22 - h * 0.6, x + Math.sin(time * 7 + i) * 2, y - 22 - h);
    ctx.quadraticCurveTo(x + 8, y - 22 - h * 0.6, x + 10 - i * 3, y - 22);
    ctx.closePath();
    ctx.fill();
  }
}

// areia escorrendo dos blocos flutuantes
function sandTrickle(ctx, x, y, time) {
  ctx.fillStyle = 'rgba(232,196,120,0.8)';
  for (let i = 0; i < 6; i++) {
    const k = (time * 0.9 + i / 6) % 1;
    ctx.globalAlpha = 1 - k;
    ctx.fillRect(x + Math.sin(i * 3) * 2, y + k * 120, 2, 5);
  }
  ctx.globalAlpha = 1;
}

export const PIRAMIDE_ART = {
  sky: paintSky,
  skyAnimated,
  far: drawFar,
  farAnimated,
  mid: drawMid,
  midAnimated,
  terrain: drawTerrain,
  behind() {},
  front(ctx, map, time) {
    const top = map.solids[3];
    brazier(ctx, top.x + 14, top.y, time);
    brazier(ctx, top.x + top.w - 14, top.y, time + 1.3);
    map.platforms.forEach((p, i) => sandTrickle(ctx, p.x + p.w / 2 + (i ? 20 : -20), p.y + 40, time + i * 0.5));
  },
  haze: ['rgba(255,230,170,0)', 'rgba(255,220,150,0.3)'],
  vignette: 0.3,
};
