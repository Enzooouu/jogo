// Cenário do Navio Voador: dois navios piratas voando acima das nuvens no
// pôr do sol.
//
//   céu      azul em cima, pêssego no horizonte, sol baixo, primeiras estrelas
//   longe    ilhas flutuando e um navio bem pequeno passando
//   meio     nuvens passando para trás (os navios estão voando) e o mar de
//            nuvens embaixo
//   mundo    os navios (casco, tombadilho, mastro, velas, verga e gávea), a
//            prancha, os canhões e o timão; tudo sobe e desce com o navio
//
// A física fica em shared/ship.js (o navio só manda a posição de agora).

import { seeded, ridgeLine, shadeHex } from './stage-util.js';
import { cloudSprite } from './stage-treino.js';
import { SHIP } from '/shared/ship.js';

const VIEW_W = 1280;
const VIEW_H = 720;
const SUN = { x: 980, y: 455 };
const COLORS = [
  { flag: '#ff6a1f', sail: '#f1e4c8', stripe: '#e2483a' },
  { flag: '#4fb0ff', sail: '#eef0f4', stripe: '#3a7bd5' },
];

let GAME = null;
const shipsOf = (map) => (GAME && GAME.map === map ? GAME.ships : null);

// ================================================================ céu

function paintSky(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#1d2b5c');
  g.addColorStop(0.3, '#43609f');
  g.addColorStop(0.55, '#b98aa6');
  g.addColorStop(0.72, '#f2a58a');
  g.addColorStop(0.86, '#ffcf8f');
  g.addColorStop(1, '#ffe7b8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const rand = seeded(41);
  // estrelas aparecendo no alto (está anoitecendo)
  for (let i = 0; i < 90; i++) {
    const y = rand() * 210;
    ctx.fillStyle = `rgba(255,255,255,${(0.2 + rand() * 0.6) * (1 - y / 260)})`;
    ctx.fillRect(rand() * VIEW_W, y, 1.4, 1.4);
  }
  // lua fininha do outro lado
  ctx.fillStyle = 'rgba(255,250,235,0.85)';
  ctx.beginPath();
  ctx.arc(180, 95, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a3a6e';
  ctx.beginPath();
  ctx.arc(188, 90, 16, 0, Math.PI * 2);
  ctx.fill();
  // brilho grande do sol
  for (const [r, a, c] of [[620, 0.5, '255,200,150'], [260, 0.7, '255,232,190'], [110, 0.9, '255,246,220']]) {
    const glow = ctx.createRadialGradient(SUN.x, SUN.y, 20, SUN.x, SUN.y, r);
    glow.addColorStop(0, `rgba(${c},${a})`);
    glow.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(SUN.x - r, SUN.y - r, r * 2, r * 2);
  }
  ctx.fillStyle = '#fff6da';
  ctx.beginPath();
  ctx.arc(SUN.x, SUN.y, 54, 0, Math.PI * 2);
  ctx.fill();
  // faixas de nuvem fina, rosadas, com a borda de baixo dourada
  for (const [y, w, x, a] of [[140, 520, 360, 0.35], [205, 420, 900, 0.3], [262, 600, 560, 0.28], [440, 380, 960, 0.5], [470, 280, 1030, 0.45]]) {
    const cg = ctx.createLinearGradient(0, y - 6, 0, y + 7);
    cg.addColorStop(0, `rgba(200,130,170,${a})`);
    cg.addColorStop(1, `rgba(255,214,160,${a + 0.2})`);
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function skyAnimated(ctx, time) {
  // raios do sol girando bem devagar
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(SUN.x, SUN.y);
  ctx.rotate(time * 0.01);
  const rays = ctx.createRadialGradient(0, 0, 60, 0, 0, 760);
  rays.addColorStop(0, 'rgba(255,220,170,0.09)');
  rays.addColorStop(1, 'rgba(255,220,170,0)');
  ctx.fillStyle = rays;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const w = i % 2 ? 0.035 : 0.07;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a - w) * 760, Math.sin(a - w) * 760);
    ctx.lineTo(Math.cos(a + w) * 760, Math.sin(a + w) * 760);
    ctx.closePath();
  }
  ctx.fill();
  ctx.restore();
  // riscos de vento passando (os navios estão voando para a direita)
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 12; i++) {
    const x = (((i * 211 - time * 420) % (VIEW_W + 300)) + VIEW_W + 300) % (VIEW_W + 300) - 150;
    const y = 110 + ((i * 97) % 420);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 60 + (i % 3) * 30, y);
    ctx.stroke();
  }
}

// ================================================================ longe

// ilha flutuante: topo de grama, pedra afinando para baixo, raízes
function isle(ctx, x, y, w, rand, tone, extra) {
  const depth = w * (0.9 + rand() * 0.3);
  ctx.fillStyle = tone.rock;
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  for (let k = 1; k < 7; k++) {
    const u = k / 7;
    ctx.lineTo(x - w + u * w * 2, y + depth * Math.sin(u * Math.PI) * (0.55 + rand() * 0.45));
  }
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = tone.lit;
  ctx.fillRect(x + w * 0.2, y, w, depth);
  ctx.restore();
  ctx.fillStyle = tone.grass;
  ctx.fillRect(x - w, y - 4, w * 2, 6);
  for (let k = 0; k < 3; k++) {
    const tx = x - w * 0.6 + rand() * w * 1.2;
    ctx.fillStyle = tone.tree;
    ctx.beginPath();
    ctx.arc(tx, y - w * 0.12, w * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  if (extra === 'farol') {
    // farol pequeno (a luz pisca em farAnimated)
    ctx.fillStyle = '#efe4dc';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3 - 6, y - 2);
    ctx.lineTo(x + w * 0.3 - 4, y - 40);
    ctx.lineTo(x + w * 0.3 + 4, y - 40);
    ctx.lineTo(x + w * 0.3 + 6, y - 2);
    ctx.fill();
    ctx.fillStyle = '#c4553e';
    ctx.fillRect(x + w * 0.3 - 5, y - 26, 10, 5);
    ctx.fillRect(x + w * 0.3 - 6, y - 48, 12, 6);
  }
}

const FAR_ISLE = { rock: 'rgba(120,96,150,0.8)', lit: 'rgba(255,190,170,0.3)', grass: 'rgba(140,175,120,0.85)', tree: 'rgba(110,150,105,0.85)' };
const LIGHTHOUSE = { x: 1180 + 70 * 0.3, y: 330 - 46 };

function drawFar(ctx, map, rand) {
  // picos de montanha furando o mar de nuvens lá longe
  const pts = ridgeLine([[-760, 520], [-500, 420], [-260, 470], [-40, 380], [200, 460], [430, 405], [700, 470], [960, 395], [1240, 455], [1500, 400], [1780, 470], [2040, 520]], rand, 0.2, 5);
  const mg = ctx.createLinearGradient(0, 380, 0, 520);
  mg.addColorStop(0, '#a58fb8');
  mg.addColorStop(1, '#d9a8ac');
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.moveTo(-760, 900);
  for (const [x, y] of pts) ctx.lineTo(x, y);
  ctx.lineTo(2040, 900);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(255,240,236,0.75)';
  ctx.beginPath();
  ctx.moveTo(-760, 0);
  ctx.lineTo(2040, 0);
  for (let x = 2040; x >= -760; x -= 10) ctx.lineTo(x, 418 + Math.sin(x * 0.08) * 6 + (rand() - 0.3) * 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // ilhas flutuantes
  for (const [x, y, w, extra] of [[-320, 360, 70], [140, 340, 54], [450, 300, 30], [1180, 330, 70, 'farol'], [1640, 350, 56]]) {
    isle(ctx, x, y, w, rand, FAR_ISLE, extra);
  }
  // mar de nuvens lá longe
  ctx.fillStyle = 'rgba(255,214,206,0.75)';
  for (let x = -760; x < 2040; x += 50 + rand() * 40) {
    const r = 36 + rand() * 40;
    ctx.beginPath();
    ctx.arc(x, 548 - rand() * 26, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillRect(-760, 548, 2800, 900);
}

// dirigível-navio pequeno (balão em cima e casco embaixo)
function airship(ctx, x, y, s, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#5c4a74';
  ctx.beginPath();
  ctx.ellipse(0, -28, 46, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,210,180,0.4)';
  ctx.beginPath();
  ctx.ellipse(6, -34, 30, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4a3a60';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-26, -16);
  ctx.lineTo(-18, -2);
  ctx.moveTo(26, -16);
  ctx.lineTo(18, -2);
  ctx.stroke();
  ctx.fillStyle = '#4a3a60';
  ctx.beginPath();
  ctx.moveTo(-30, -2);
  ctx.lineTo(30, -2);
  ctx.lineTo(22, 8);
  ctx.lineTo(-24, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function farAnimated(ctx, time) {
  // luz do farol girando
  const on = (Math.sin(time * 2.2) + 1) / 2;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(LIGHTHOUSE.x, LIGHTHOUSE.y, 1, LIGHTHOUSE.x, LIGHTHOUSE.y, 40);
  g.addColorStop(0, `rgba(255,240,180,${0.9 * on})`);
  g.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = g;
  ctx.fillRect(LIGHTHOUSE.x - 40, LIGHTHOUSE.y - 40, 80, 80);
  ctx.restore();
  // dois dirigíveis passando lá longe, em velocidades diferentes
  airship(ctx, ((time * 10) % 2100) - 400, 230, 0.55, 0.55);
  airship(ctx, 1700 - ((time * 6 + 900) % 2200), 170, 0.35, 0.4);
  // bando de pássaros
  ctx.strokeStyle = 'rgba(60,45,70,0.6)';
  ctx.lineWidth = 1.4;
  const fx = ((time * 34) % 2200) - 400;
  for (let i = 0; i < 6; i++) {
    const row = Math.ceil(i / 2);
    const side = i % 2 ? 1 : -1;
    const bx = fx - row * 14;
    const by = 300 + side * row * 8 + Math.sin(time * 0.8) * 5;
    const f = Math.sin(time * 9 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(bx - 6, by - f);
    ctx.quadraticCurveTo(bx - 3, by - 3, bx, by);
    ctx.quadraticCurveTo(bx + 3, by - 3, bx + 6, by - f);
    ctx.stroke();
  }
}

// ================================================================ meio: nuvens passando

// nuvens fofas do treino com cor de pôr do sol (barriga rosada, topo dourado)
const DUSK_CLOUDS = new Map();
function duskCloud(seed) {
  if (DUSK_CLOUDS.has(seed)) return DUSK_CLOUDS.get(seed);
  const base = cloudSprite(seed);
  const c = document.createElement('canvas');
  c.width = base.width;
  c.height = base.height;
  const x = c.getContext('2d');
  x.drawImage(base, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  const g = x.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, 'rgba(255,226,190,0.35)');
  g.addColorStop(0.6, 'rgba(240,160,170,0.45)');
  g.addColorStop(1, 'rgba(170,120,170,0.6)');
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  const r = x.createLinearGradient(c.width * 0.45, 0, c.width, 0);
  r.addColorStop(0, 'rgba(255,230,180,0)');
  r.addColorStop(1, 'rgba(255,226,170,0.45)');
  x.fillStyle = r;
  x.fillRect(0, 0, c.width, c.height);
  DUSK_CLOUDS.set(seed, c);
  return c;
}

const CLOUDS = (() => {
  const rand = seeded(77);
  return Array.from({ length: 8 }, (_, i) => ({ x: rand() * 2400, y: 40 + rand() * 330, s: 0.45 + rand() * 0.6, v: 40 + rand() * 70, seed: 1 + (i % 6) }));
})();

function drawMid() {}

function cloudSea(ctx, time, y, speed, color, light, step) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 50; i++) {
    const r = 40 + ((i * 37) % 50);
    const x = ((((i * step) - time * speed) % 3400) + 3400) % 3400 - 800;
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI * 2);
  }
  ctx.rect(-800, y, 3400, 900);
  ctx.fill();
  // brilho do sol no alto das bolhas
  ctx.fillStyle = light;
  for (let i = 0; i < 50; i++) {
    const r = 40 + ((i * 37) % 50);
    const x = ((((i * step) - time * speed) % 3400) + 3400) % 3400 - 800;
    ctx.beginPath();
    ctx.ellipse(x + r * 0.15, y - r * 0.55, r * 0.55, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function midAnimated(ctx, time) {
  for (const c of CLOUDS) {
    const w = 320 * c.s;
    const x = (((c.x - time * c.v) % 2600) + 2600) % 2600 - 600;
    ctx.drawImage(duskCloud(c.seed), x, c.y, w, 150 * c.s);
  }
  // mar de nuvens: camada de trás mais lenta e rosada, a da frente mais clara
  cloudSea(ctx, time, 700, 60, 'rgba(236,170,180,0.95)', 'rgba(255,220,200,0.6)', 66);
  cloudSea(ctx, time, 745, 110, 'rgba(255,214,200,1)', 'rgba(255,240,220,0.8)', 72);
}

// ================================================================ navio

const DECK = 500;
const POOP = 64;

function plank(ctx, x0, x1, y, h, c1, c2) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(x0, y, x1 - x0, h);
}

// contorno do casco (o mesmo da colisão em shared/maps.js)
function hullPath(ctx, sternX, bowX, dir) {
  const cx = (sternX + bowX) / 2;
  ctx.beginPath();
  ctx.moveTo(sternX, DECK - POOP);
  ctx.lineTo(sternX - dir * 6, DECK + 30);
  ctx.quadraticCurveTo(sternX + dir * 40, DECK + 100, cx, DECK + 104);
  ctx.quadraticCurveTo(bowX - dir * 70, DECK + 100, bowX + dir * 22, DECK - 2);
  // roda de proa: sobe curvada e volta pela amurada até o convés
  ctx.quadraticCurveTo(bowX + dir * 34, DECK - 14, bowX + dir * 30, DECK - 34);
  ctx.lineTo(bowX + dir * 23, DECK - 36);
  ctx.quadraticCurveTo(bowX + dir * 20, DECK - 14, bowX - dir * 8, DECK - 10);
  ctx.lineTo(bowX - dir * 8, DECK);
  ctx.lineTo(sternX + dir * 120, DECK);
  ctx.lineTo(sternX + dir * 120, DECK - POOP);
  ctx.closePath();
}

function barrel(ctx, x, y) {
  const g = ctx.createLinearGradient(x - 9, 0, x + 9, 0);
  g.addColorStop(0, '#6a3e20');
  g.addColorStop(0.5, '#a8703e');
  g.addColorStop(1, '#5a3218');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.quadraticCurveTo(x - 11, y - 12, x - 8, y - 24);
  ctx.lineTo(x + 8, y - 24);
  ctx.quadraticCurveTo(x + 11, y - 12, x + 8, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3a2010';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#4a4e58';
  ctx.fillRect(x - 10, y - 19, 20, 2.5);
  ctx.fillRect(x - 10, y - 7, 20, 2.5);
}

function crate(ctx, x, y, s) {
  ctx.fillStyle = '#b58350';
  ctx.fillRect(x - s / 2, y - s, s, s);
  ctx.strokeStyle = '#5a3420';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - s / 2, y - s, s, s);
  ctx.beginPath();
  ctx.moveTo(x - s / 2, y - s);
  ctx.lineTo(x + s / 2, y);
  ctx.moveTo(x + s / 2, y - s);
  ctx.lineTo(x - s / 2, y);
  ctx.stroke();
}

function ropeCoil(ctx, x, y) {
  ctx.strokeStyle = '#c9a46a';
  ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.ellipse(x, y - 3 - k * 2.4, 12 - k * 2, 3.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// carranca da proa, presa na roda de proa: fênix (fogo) com a asa
// varrendo o casco, ou golfinho (água) com o corpo em arco e a cauda
function figurehead(ctx, x, y, dir, i) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  const gold = ctx.createLinearGradient(0, -34, 0, 30);
  gold.addColorStop(0, '#fff0b0');
  gold.addColorStop(0.5, '#e8b84a');
  gold.addColorStop(1, '#9a6a22');
  const ink = '#5a3a12';
  if (i === 0) {
    // asa: penas douradas com ponta laranja, deitadas no casco
    for (let k = 0; k < 4; k++) {
      const fx = -4 - k * 10;
      const fy = 10 + k * 3;
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.moveTo(fx + 8, fy - 6);
      ctx.quadraticCurveTo(fx - 4, fy - 2, fx - 16, fy + 10);
      ctx.quadraticCurveTo(fx - 2, fy + 8, fx + 8, fy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#ff7a2a';
      ctx.beginPath();
      ctx.moveTo(fx - 9, fy + 5);
      ctx.quadraticCurveTo(fx - 13, fy + 8, fx - 16, fy + 10);
      ctx.quadraticCurveTo(fx - 11, fy + 9, fx - 7, fy + 7);
      ctx.fill();
    }
    // crista de fogo (três línguas)
    const fire = ctx.createLinearGradient(0, -48, 0, -14);
    fire.addColorStop(0, '#ffd25a');
    fire.addColorStop(1, '#ff5a1f');
    ctx.fillStyle = fire;
    ctx.beginPath();
    ctx.moveTo(-2, -16);
    ctx.quadraticCurveTo(-12, -34, -4, -48);
    ctx.quadraticCurveTo(-2, -36, 6, -32);
    ctx.quadraticCurveTo(4, -46, 14, -50);
    ctx.quadraticCurveTo(10, -38, 18, -32);
    ctx.quadraticCurveTo(22, -42, 30, -40);
    ctx.quadraticCurveTo(22, -30, 20, -20);
    ctx.closePath();
    ctx.fill();
    // pescoço e cabeça com bico
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.moveTo(-6, 14);
    ctx.quadraticCurveTo(-8, -10, 8, -22);
    ctx.quadraticCurveTo(22, -30, 30, -20);
    ctx.lineTo(44, -15);
    ctx.lineTo(30, -10);
    ctx.quadraticCurveTo(18, -8, 12, 0);
    ctx.quadraticCurveTo(6, 8, 6, 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(90,58,18,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, -15);
    ctx.lineTo(40, -15);
    ctx.stroke();
    ctx.fillStyle = '#2a160c';
    ctx.beginPath();
    ctx.arc(24, -19, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // corpo do golfinho em arco, descendo pelo casco até a cauda
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.moveTo(6, 14);
    ctx.quadraticCurveTo(4, -14, 20, -24);
    ctx.quadraticCurveTo(36, -32, 44, -20);
    ctx.quadraticCurveTo(52, -16, 54, -12);
    ctx.lineTo(42, -10);
    ctx.quadraticCurveTo(26, -10, 18, 0);
    ctx.quadraticCurveTo(10, 14, -6, 20);
    ctx.quadraticCurveTo(-20, 24, -32, 22);
    ctx.quadraticCurveTo(-18, 16, -10, 8);
    ctx.quadraticCurveTo(-2, 2, 6, 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // cauda
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.moveTo(-30, 22);
    ctx.quadraticCurveTo(-40, 12, -46, 14);
    ctx.quadraticCurveTo(-40, 20, -37, 24);
    ctx.quadraticCurveTo(-42, 30, -48, 32);
    ctx.quadraticCurveTo(-38, 33, -29, 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // barbatanas azuis
    ctx.fillStyle = '#4fb0ff';
    ctx.beginPath();
    ctx.moveTo(22, -24);
    ctx.quadraticCurveTo(18, -44, 34, -46);
    ctx.quadraticCurveTo(28, -36, 32, -28);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1f5a8a';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, 4);
    ctx.quadraticCurveTo(0, 14, 2, 20);
    ctx.quadraticCurveTo(8, 12, 14, 8);
    ctx.closePath();
    ctx.fillStyle = '#4fb0ff';
    ctx.fill();
    ctx.fillStyle = '#2a160c';
    ctx.beginPath();
    ctx.arc(36, -19, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// casco, convés e tombadilho (sem os mastros), em coordenadas do mundo
function hull(ctx, sh, c, sternX, bowX, dir, i) {
  const cx = (sternX + bowX) / 2;
  const x0 = Math.min(sternX, bowX);
  const x1 = Math.max(sternX, bowX);
  const rand = seeded(500 + i);
  // gurupés (mastro deitado na proa) com corda
  const bx = bowX + dir * 20;
  ctx.strokeStyle = '#6a3e20';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(bx - dir * 30, DECK - 4);
  ctx.lineTo(bx + dir * 18, DECK - 58);
  ctx.stroke();
  ctx.lineCap = 'butt';
  // corpo do casco
  hullPath(ctx, sternX, bowX, dir);
  const g = ctx.createLinearGradient(0, DECK - POOP, 0, DECK + 104);
  g.addColorStop(0, '#b0703f');
  g.addColorStop(0.45, '#7c4527');
  g.addColorStop(1, '#4a2616');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  hullPath(ctx, sternX, bowX, dir);
  ctx.clip();
  // tábuas: faixas de tom um pouco diferente, emendas desencontradas
  for (let y = DECK - POOP; y < DECK + 110; y += 11) {
    ctx.fillStyle = `rgba(${rand() < 0.5 ? '255,220,180' : '40,15,5'},${0.04 + rand() * 0.06})`;
    ctx.fillRect(x0 - 60, y, x1 - x0 + 120, 11);
    ctx.strokeStyle = 'rgba(30,12,4,0.45)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x0 - 60, y);
    ctx.lineTo(x1 + 60, y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(30,12,4,0.3)';
    for (let x = x0 - 60 + rand() * 80; x < x1 + 60; x += 70 + rand() * 50) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 11);
      ctx.stroke();
    }
  }
  // fundo de cobre esverdeado com rebites (abaixo da linha)
  const copper = ctx.createLinearGradient(0, DECK + 70, 0, DECK + 106);
  copper.addColorStop(0, '#5a9a8c');
  copper.addColorStop(1, '#2c5a54');
  ctx.fillStyle = copper;
  ctx.fillRect(x0 - 60, DECK + 74, x1 - x0 + 120, 40);
  ctx.fillStyle = 'rgba(220,255,240,0.5)';
  for (let x = x0 - 50; x < x1 + 50; x += 14) {
    ctx.fillRect(x, DECK + 79, 1.6, 1.6);
    ctx.fillRect(x + 7, DECK + 90, 1.6, 1.6);
  }
  ctx.fillStyle = '#e8c068';
  ctx.fillRect(x0 - 60, DECK + 71, x1 - x0 + 120, 3);
  // faixa do time com frisos dourados
  ctx.fillStyle = c.stripe;
  ctx.fillRect(x0 - 60, DECK + 20, x1 - x0 + 120, 9);
  ctx.fillStyle = '#e8c068';
  ctx.fillRect(x0 - 60, DECK + 18, x1 - x0 + 120, 2);
  ctx.fillRect(x0 - 60, DECK + 29, x1 - x0 + 120, 2);
  ctx.fillRect(x0 - 60, DECK + 6, x1 - x0 + 120, 3);
  // luz quente do pôr do sol batendo no lado direito
  const rim = ctx.createLinearGradient(x0, 0, x1, 0);
  rim.addColorStop(0, 'rgba(255,200,150,0)');
  rim.addColorStop(1, 'rgba(255,200,150,0.18)');
  ctx.fillStyle = rim;
  ctx.fillRect(x0 - 60, DECK - POOP, x1 - x0 + 120, 200);
  ctx.restore();
  // portinholas dos canhões com tampa aberta
  for (let k = 0; k < 4; k++) {
    const wx = cx - 132 + k * 84;
    ctx.fillStyle = '#7a4527';
    ctx.fillRect(wx - 10, DECK + 36, 20, 4);
    ctx.fillStyle = '#1a0c06';
    ctx.fillRect(wx - 8, DECK + 41, 16, 14);
    ctx.strokeStyle = '#e8c068';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(wx - 8, DECK + 41, 16, 14);
    ctx.fillStyle = '#2b3038';
    ctx.beginPath();
    ctx.arc(wx, DECK + 48, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // contorno do casco
  hullPath(ctx, sternX, bowX, dir);
  ctx.strokeStyle = '#2a160c';
  ctx.lineWidth = 3;
  ctx.stroke();
  // friso dourado na roda de proa, com uma voluta no alto
  ctx.strokeStyle = '#e8c068';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(bowX + dir * 22, DECK - 2);
  ctx.quadraticCurveTo(bowX + dir * 34, DECK - 14, bowX + dir * 30, DECK - 34);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(bowX + dir * 26, DECK - 38, 4.5, 0, Math.PI * 1.6, dir < 0);
  ctx.stroke();
  ctx.strokeStyle = '#2a160c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bowX + dir * 23, DECK - 36);
  ctx.quadraticCurveTo(bowX + dir * 20, DECK - 14, bowX - dir * 8, DECK - 10);
  ctx.stroke();
  figurehead(ctx, bowX + dir * 28, DECK - 12, dir, i);
  // tombadilho: frente com janelas da cabine (molduras douradas)
  const pA = Math.min(sternX, sternX + dir * 120);
  const pB = Math.max(sternX, sternX + dir * 120);
  plank(ctx, pA, pB, DECK - POOP, 10, '#d9a568', '#a8703e');
  for (let k = 0; k < 3; k++) {
    const wx = pA + 16 + k * 32;
    ctx.fillStyle = '#e8c068';
    ctx.fillRect(wx - 2, DECK - 44, 18, 20);
    const wg = ctx.createLinearGradient(0, DECK - 42, 0, DECK - 26);
    wg.addColorStop(0, '#fff2c0');
    wg.addColorStop(1, '#ffb84a');
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.moveTo(wx, DECK - 26);
    ctx.lineTo(wx, DECK - 36);
    ctx.quadraticCurveTo(wx + 7, DECK - 44, wx + 14, DECK - 36);
    ctx.lineTo(wx + 14, DECK - 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7a4527';
    ctx.fillRect(wx + 6, DECK - 40, 2, 14);
  }
  // grade do tombadilho com balaústres
  const outer = dir > 0 ? pA : pB;
  ctx.fillStyle = '#5a3420';
  ctx.fillRect(dir > 0 ? outer : outer - 72, DECK - POOP - 17, 72, 4);
  for (let k = 0; k < 7; k++) {
    const x = outer + dir * (4 + k * 11);
    ctx.fillStyle = '#7a4a28';
    ctx.beginPath();
    ctx.ellipse(x, DECK - POOP - 7, 2.6, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // poste de popa com lampião (a luz pisca em front)
  ctx.fillStyle = '#5a3420';
  ctx.fillRect(sternX - dir * 2 - 2, DECK - POOP - 40, 4, 40);
  ctx.fillStyle = '#2a1a10';
  ctx.fillRect(sternX - dir * 2 - 6, DECK - POOP - 52, 12, 3);
  ctx.fillStyle = '#ffd98a';
  ctx.fillRect(sternX - dir * 2 - 5, DECK - POOP - 49, 10, 10);
  ctx.strokeStyle = '#2a1a10';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(sternX - dir * 2 - 5, DECK - POOP - 49, 10, 10);
  // escadinha do convés para o tombadilho
  const sx = sternX + dir * 124;
  ctx.strokeStyle = '#6a3e20';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sx, DECK);
  ctx.lineTo(sx + dir * 18, DECK - POOP + 4);
  ctx.moveTo(sx + dir * 12, DECK);
  ctx.lineTo(sx + dir * 30, DECK - POOP + 4);
  ctx.stroke();
  ctx.lineWidth = 2;
  for (let k = 1; k < 5; k++) {
    const u = k / 5;
    ctx.beginPath();
    ctx.moveTo(sx + dir * u * 18, DECK - u * (POOP - 4));
    ctx.lineTo(sx + dir * (12 + u * 18), DECK - u * (POOP - 4));
    ctx.stroke();
  }
  // convés com pregos
  const dA = Math.min(sternX + dir * 120, bowX);
  const dB = Math.max(sternX + dir * 120, bowX);
  plank(ctx, dA, dB, DECK, 10, '#ddb072', '#a8703e');
  ctx.fillStyle = 'rgba(70,40,20,0.5)';
  for (let x = dA + 15; x < dB; x += 30) {
    ctx.fillRect(x, DECK + 2, 1.5, 1.5);
    ctx.fillRect(x, DECK + 7, 1.5, 1.5);
  }
  // carga no convés: barris, caixas e corda enrolada
  const along = (u) => sternX + dir * (150 + u * (Math.abs(bowX - sternX) - 190));
  barrel(ctx, along(0.55), DECK);
  barrel(ctx, along(0.55) + dir * 20, DECK);
  crate(ctx, along(0.92), DECK, 22);
  crate(ctx, along(0.92) + dir * 4, DECK - 22, 16);
  ropeCoil(ctx, along(0.76), DECK);
  void sh;
}

// cada casco vira uma imagem (é desenhado uma vez só)
const HULLS = new Map();
function hullSprite(i, sh, sternX, bowX, dir) {
  if (HULLS.has(i)) return HULLS.get(i);
  const x0 = Math.min(sternX, bowX) - 90;
  const x1 = Math.max(sternX, bowX) + 90;
  const y0 = DECK - POOP - 70;
  const y1 = DECK + 120;
  const res = 2;
  const c = document.createElement('canvas');
  c.width = (x1 - x0) * res;
  c.height = (y1 - y0) * res;
  const x = c.getContext('2d');
  x.scale(res, res);
  x.translate(-x0, -y0);
  hull(x, sh, COLORS[i], sternX, bowX, dir, i);
  const out = { canvas: c, x0, y0, w: x1 - x0, h: y1 - y0 };
  HULLS.set(i, out);
  return out;
}

// pontas de cada navio a partir do mapa
function shipShape(map, i) {
  const sh = map.ships[i];
  return { sternX: sh.stern, bowX: sh.bow, dir: sh.stern < sh.bow ? 1 : -1 };
}

// mastro, velas, verga e gávea (com o balanço)
function rig(ctx, map, i, st, platforms, time) {
  const sh = map.ships[i];
  const c = COLORS[i];
  const plats = platforms.filter((p) => p.ship === i).sort((a, b) => b.y - a.y);
  const verga = plats[0];
  const gavea = plats[1];
  const baseX = sh.mast;
  const baseY = DECK + st.bob;
  const vx = verga.x + verga.w / 2;
  const gx = gavea.x + gavea.w / 2;
  const topX = gx + (gx - baseX) * 0.2;
  const topY = 130 + st.bob;
  // escadas de corda (enfrechates) do convés até a gávea
  ctx.strokeStyle = 'rgba(70,45,25,0.75)';
  ctx.lineWidth = 1.3;
  for (const side of [-1, 1]) {
    const ax = baseX + side * 78;
    const bx2 = gx + side * 30;
    const by2 = gavea.y + 12;
    ctx.beginPath();
    ctx.moveTo(ax, baseY - 2);
    ctx.lineTo(bx2, by2);
    ctx.moveTo(ax - side * 16, baseY - 2);
    ctx.lineTo(bx2 - side * 8, by2);
    for (let k = 1; k < 12; k++) {
      const u = k / 12;
      const y = baseY - 2 + (by2 - baseY + 2) * u;
      ctx.moveTo(ax + (bx2 - ax) * u, y);
      ctx.lineTo(ax - side * 16 + (bx2 - side * 8 - ax + side * 16) * u, y);
    }
    ctx.stroke();
  }
  // mastro inclinado, com aros de ferro
  ctx.lineCap = 'butt';
  ctx.strokeStyle = '#6a3e20';
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(topX, topY);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,215,160,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(baseX + 3, baseY);
  ctx.lineTo(topX + 3, topY);
  ctx.stroke();
  ctx.strokeStyle = '#3a3e48';
  ctx.lineWidth = 3;
  for (let k = 1; k < 7; k++) {
    const u = k / 7;
    const mx = baseX + (topX - baseX) * u;
    const my = baseY + (topY - baseY) * u;
    ctx.beginPath();
    ctx.moveTo(mx - 8, my);
    ctx.lineTo(mx + 8, my);
    ctx.stroke();
  }
  // cordas até a proa e a popa
  const { sternX, bowX, dir } = shipShape(map, i);
  ctx.strokeStyle = 'rgba(60,35,20,0.7)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(topX, topY + 10);
  ctx.lineTo(bowX, DECK + st.bob);
  ctx.moveTo(topX, topY + 10);
  ctx.lineTo(sternX + dir * 60, DECK - POOP + st.bob);
  ctx.stroke();
  // vela grande enfunada
  const billow = 18 + Math.sin(time * 1.3 + i * 2) * 4;
  const vy = verga.y;
  ctx.fillStyle = c.sail;
  ctx.beginPath();
  ctx.moveTo(vx - 100, vy + 10);
  ctx.lineTo(vx + 100, vy + 10);
  ctx.quadraticCurveTo(vx + 100 + billow * 0.4, vy + 84, vx + 92 - (vx - baseX) * 0.3, baseY - 32);
  ctx.quadraticCurveTo(baseX, baseY - 32 + billow, baseX - 92 + (vx - baseX) * 0.7, baseY - 32);
  ctx.quadraticCurveTo(vx - 100 - billow * 0.4, vy + 84, vx - 100, vy + 10);
  ctx.fill();
  ctx.save();
  ctx.clip();
  // sombra nas pontas e luz no meio (pano estufado)
  const sg = ctx.createLinearGradient(vx - 100, 0, vx + 100, 0);
  sg.addColorStop(0, 'rgba(120,90,70,0.25)');
  sg.addColorStop(0.45, 'rgba(255,255,255,0)');
  sg.addColorStop(1, 'rgba(255,200,150,0.18)');
  ctx.fillStyle = sg;
  ctx.fillRect(vx - 110, vy, 220, baseY - vy);
  // costuras do pano e um remendo
  ctx.strokeStyle = 'rgba(120,95,70,0.25)';
  ctx.lineWidth = 1;
  for (let k = -3; k <= 3; k++) {
    ctx.beginPath();
    ctx.moveTo(vx + k * 28, vy + 10);
    ctx.quadraticCurveTo(vx + k * 30, vy + 90, vx + k * 26 + (baseX - vx) * 0.5, baseY - 30);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(200,170,120,0.35)';
  ctx.fillRect(vx + 46, vy + 96, 18, 14);
  ctx.strokeStyle = 'rgba(120,95,70,0.5)';
  ctx.setLineDash([2, 2]);
  ctx.strokeRect(vx + 46, vy + 96, 18, 14);
  ctx.setLineDash([]);
  ctx.restore();
  ctx.strokeStyle = 'rgba(90,70,50,0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // símbolo na vela
  const sx = (vx + baseX) / 2;
  const sy = vy + 70;
  ctx.fillStyle = c.flag;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  if (i === 0) {
    ctx.moveTo(sx, sy - 34);
    ctx.quadraticCurveTo(sx + 28, sy, sx + 14, sy + 30);
    ctx.quadraticCurveTo(sx, sy + 44, sx - 14, sy + 30);
    ctx.quadraticCurveTo(sx - 22, sy + 6, sx - 6, sy - 10);
    ctx.quadraticCurveTo(sx - 4, sy + 6, sx + 2, sy + 10);
    ctx.quadraticCurveTo(sx + 6, sy - 10, sx, sy - 34);
  } else {
    ctx.moveTo(sx, sy - 34);
    ctx.quadraticCurveTo(sx + 26, sy + 6, sx + 16, sy + 26);
    ctx.arc(sx, sy + 24, 16, 0, Math.PI, false);
    ctx.quadraticCurveTo(sx - 26, sy + 6, sx, sy - 34);
  }
  ctx.fill();
  ctx.globalAlpha = 1;
  // verga (plataforma)
  plank(ctx, verga.x - 4, verga.x + verga.w + 4, verga.y, 10, '#b07a46', '#7a4a28');
  ctx.strokeStyle = '#4a2a16';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(verga.x - 4, verga.y, verga.w + 8, 10);
  // vela de cima
  ctx.fillStyle = c.sail;
  ctx.beginPath();
  ctx.moveTo(gx - 60, gavea.y + 26);
  ctx.lineTo(gx + 60, gavea.y + 26);
  ctx.quadraticCurveTo(gx + 66, gavea.y + 74, vx + 58, verga.y - 10);
  ctx.quadraticCurveTo(vx, verga.y - 4 + billow * 0.5, vx - 58, verga.y - 10);
  ctx.quadraticCurveTo(gx - 66, gavea.y + 74, gx - 60, gavea.y + 26);
  ctx.fill();
  ctx.strokeStyle = 'rgba(90,70,50,0.5)';
  ctx.stroke();
  // gávea: o cesto lá no alto
  plank(ctx, gavea.x, gavea.x + gavea.w, gavea.y, 10, '#b07a46', '#7a4a28');
  ctx.fillStyle = '#8a5530';
  ctx.beginPath();
  ctx.moveTo(gavea.x + 6, gavea.y + 10);
  ctx.lineTo(gavea.x + gavea.w - 6, gavea.y + 10);
  ctx.lineTo(gavea.x + gavea.w - 16, gavea.y + 26);
  ctx.lineTo(gavea.x + 16, gavea.y + 26);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4a2a16';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  drawFlag(ctx, topX, topY, -dir, time, c.flag, i);
}

// Bandeira de rabo de andorinha ondulando: faixas verticais mais claras e
// mais escuras seguindo a onda (dobras do pano), barra dourada no mastro e o
// símbolo do elemento no meio; bolinha dourada no topo do mastro
function drawFlag(ctx, x, y, fd, time, color, i) {
  const L = 74;
  const H = 30;
  const N = 12;
  const wave = (u) => Math.sin(time * 6 - u * 5) * 5 * u;
  const top = (u) => [x + fd * u * L, y + wave(u)];
  const bot = (u) => {
    return [x + fd * u * L, y + H - u * 4 + wave(u)];
  };
  // contorno com o corte em V na ponta (rabo de andorinha)
  const [tx, ty] = top(1);
  const [qx, qy] = bot(1);
  const vx = x + fd * L * 0.8;
  const vy = (ty + qy) / 2;
  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 1; k <= N; k++) ctx.lineTo(...top(k / N));
    ctx.lineTo(vx, vy);
    ctx.lineTo(qx, qy);
    for (let k = N - 1; k >= 0; k--) ctx.lineTo(...bot(k / N));
    ctx.closePath();
  };
  // faixas mais claras e mais escuras seguindo a onda (dobras do pano)
  ctx.save();
  outline();
  ctx.clip();
  for (let k = 0; k < N; k++) {
    const u0 = k / N;
    const u1 = (k + 1) / N;
    const slope = Math.cos(time * 6 - ((u0 + u1) / 2) * 5);
    ctx.fillStyle = shadeHex(color, slope * 0.18);
    const [ax, ay] = top(u0);
    const [bx, by] = top(u1);
    const [cx, cy] = bot(u1);
    const [dx, dy] = bot(u0);
    ctx.beginPath();
    ctx.moveTo(ax, ay - 2);
    ctx.lineTo(bx + fd * 0.8, by - 2);
    ctx.lineTo(cx + fd * 0.8, cy + 2);
    ctx.lineTo(dx, dy + 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = shadeHex(color, -0.35);
  ctx.lineWidth = 1.2;
  outline();
  ctx.stroke();
  // barra dourada junto do mastro
  ctx.fillStyle = '#e8c068';
  ctx.fillRect(fd > 0 ? x : x - 5, y, 5, H);
  // símbolo do elemento
  const sx = x + fd * L * 0.42;
  const sy = y + H / 2 + wave(0.42) - 1;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  if (i === 0) {
    ctx.moveTo(sx, sy - 10);
    ctx.quadraticCurveTo(sx + 9, sy - 1, sx + 5, sy + 7);
    ctx.quadraticCurveTo(sx, sy + 11, sx - 5, sy + 7);
    ctx.quadraticCurveTo(sx - 8, sy, sx - 2, sy - 4);
    ctx.quadraticCurveTo(sx - 1, sy + 1, sx + 1, sy + 2);
    ctx.quadraticCurveTo(sx + 3, sy - 4, sx, sy - 10);
  } else {
    ctx.moveTo(sx, sy - 10);
    ctx.quadraticCurveTo(sx + 8, sy, sx + 6, sy + 5);
    ctx.arc(sx, sy + 4, 6, 0, Math.PI, false);
    ctx.quadraticCurveTo(sx - 8, sy, sx, sy - 10);
  }
  ctx.fill();
  // ponta do mastro
  const g = ctx.createRadialGradient(x - 1.5, y - 7, 0.5, x, y - 5, 5);
  g.addColorStop(0, '#fff3c0');
  g.addColorStop(1, '#b8862e');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y - 5, 5, 0, Math.PI * 2);
  ctx.fill();
}

function propeller(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.35, 1);
  ctx.rotate(time * 14);
  ctx.fillStyle = 'rgba(210,190,150,0.9)';
  for (let k = 0; k < 3; k++) {
    ctx.rotate((Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.ellipse(0, -18, 6, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#5a3420';
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
}

// timão: roda de madeira com pegadores, presa num pé
function wheel(ctx, x, y, angle) {
  ctx.fillStyle = '#5a3420';
  ctx.fillRect(x - 3, y - 26, 6, 26);
  ctx.save();
  ctx.translate(x, y - 32);
  ctx.rotate(angle);
  ctx.strokeStyle = '#7a4a28';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2.4;
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
    ctx.lineTo(Math.cos(a) * 19, Math.sin(a) * 19);
    ctx.stroke();
  }
  ctx.fillStyle = '#c9a24a';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function cannonArt(ctx, x, y, dir, recoil, fuse, time) {
  ctx.save();
  ctx.translate(x - dir * recoil, y);
  ctx.scale(dir, 1);
  ctx.fillStyle = '#5a3420';
  ctx.fillRect(-20, -10, 34, 10);
  ctx.fillStyle = '#2a160c';
  for (const wx of [-14, 8]) {
    ctx.beginPath();
    ctx.arc(wx, -2, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  // cano apontando um pouco para cima (atira em arco)
  ctx.save();
  ctx.translate(-4, -16);
  ctx.rotate(-0.35);
  const g = ctx.createLinearGradient(0, -8, 0, 8);
  g.addColorStop(0, '#6a7280');
  g.addColorStop(1, '#2b3038');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-18, -7);
  ctx.lineTo(34, -5);
  ctx.lineTo(34, 5);
  ctx.lineTo(-18, 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1b1f26';
  ctx.fillRect(32, -7, 6, 14);
  ctx.restore();
  if (fuse) {
    // pavio aceso: faísca
    const f = 0.6 + 0.4 * Math.sin(time * 40);
    ctx.fillStyle = `rgba(255,${200 + 40 * f},120,${f})`;
    ctx.beginPath();
    ctx.arc(-22, -24, 3 + f * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ================================================================ por cima dos lutadores

function arcPoints(sh, ships, i) {
  const st = ships.state;
  const x0 = sh.cannon.x + sh.cannon.dir * 34;
  const y0 = sh.deckY + st[i].bob - 16;
  const tx = sh.target.x;
  const ty = sh.target.y + st[1 - i].bob;
  const T = SHIP.cannon.flight;
  const g = SHIP.cannon.gravity;
  const vx = (tx - x0) / T;
  const vy = (ty - y0 - 0.5 * g * T * T) / T;
  const pts = [];
  for (let k = 0; k <= 24; k++) {
    const t = (k / 24) * T;
    pts.push([x0 + vx * t, y0 + vy * t + 0.5 * g * t * t]);
  }
  return pts;
}

function overlay(ctx, time, game) {
  const ships = game.ships;
  if (!ships) return;
  const c = ships.cannon;
  if (c.state === 'pavio') {
    // aviso: caminho da bala pontilhado e alvo piscando onde ela vai cair
    const sh = game.map.ships[c.ship];
    const blink = 0.55 + 0.45 * Math.sin(time * 14);
    ctx.save();
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = `rgba(255,120,110,${0.55 * blink})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (const [k, [x, y]] of arcPoints(sh, ships, c.ship).entries()) {
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    const tx = sh.target.x;
    const ty = sh.target.y + ships.state[1 - c.ship].bob;
    ctx.strokeStyle = `rgba(255,80,80,${blink})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(tx, ty, SHIP.cannon.boom.radius * 0.75, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(255,80,80,${0.18 * blink})`;
    ctx.fill();
    ctx.font = 'italic 900 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(40,10,10,0.8)';
    ctx.strokeText('!', tx, ty - 30);
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText('!', tx, ty - 30);
    ctx.restore();
  }
  // balas voando
  for (const b of ships.balls) {
    ctx.fillStyle = 'rgba(80,80,90,0.3)';
    ctx.beginPath();
    ctx.arc(b.x - b.vx * 0.03, b.y - b.vy * 0.03, SHIP.cannon.r * 0.8, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(b.x - 4, b.y - 4, 1, b.x, b.y, SHIP.cannon.r);
    g.addColorStop(0, '#6a7080');
    g.addColorStop(1, '#16181e');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(b.x, b.y, SHIP.cannon.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const NAVIO_ART = {
  sky: paintSky,
  skyAnimated,
  far: drawFar,
  farAnimated,
  mid: drawMid,
  midAnimated,
  terrain() {},
  setGame(game) {
    GAME = game;
  },
  // velas e mastros atrás dos lutadores, depois os cascos
  behind(ctx, map, time) {
    const ships = shipsOf(map);
    const platforms = GAME && GAME.map === map ? GAME.platforms : map.platforms;
    map.ships.forEach((sh, i) => {
      const st = ships?.state[i] ?? { bob: 0, lean: 0 };
      rig(ctx, map, i, st, platforms, time);
    });
    map.ships.forEach((sh, i) => {
      const st = ships?.state[i] ?? { bob: 0, lean: 0 };
      const { sternX, bowX, dir } = shipShape(map, i);
      const spr = hullSprite(i, sh, sternX, bowX, dir);
      ctx.drawImage(spr.canvas, spr.x0, spr.y0 + st.bob, spr.w, spr.h);
      propeller(ctx, sternX - dir * 18, DECK + 40 + st.bob, time);
    });
  },
  // prancha, canhões e timões
  front(ctx, map, time) {
    const ships = shipsOf(map);
    const plats = GAME && GAME.map === map ? GAME.platforms : map.platforms;
    const prancha = plats.find((p) => p.bridge);
    if (prancha) {
      // corda de mão presa nas pontas dos dois navios
      const b0 = DECK + (ships?.state[0].bob ?? 0);
      const b1 = DECK + (ships?.state[1].bob ?? 0);
      ctx.strokeStyle = 'rgba(60,35,20,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(prancha.x, b0 - 30);
      ctx.quadraticCurveTo(prancha.x + prancha.w / 2, prancha.y - 18, prancha.x + prancha.w, b1 - 30);
      ctx.stroke();
      ctx.beginPath();
      for (let x = prancha.x + 20; x < prancha.x + prancha.w; x += 40) {
        ctx.moveTo(x, prancha.y);
        ctx.lineTo(x, prancha.y - 22);
      }
      ctx.stroke();
      for (let x = prancha.x; x < prancha.x + prancha.w; x += 20) {
        ctx.fillStyle = (x / 20) % 2 ? '#c48a52' : '#b07a46';
        ctx.fillRect(x, prancha.y, 19, 8);
        ctx.strokeStyle = '#5a3420';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, prancha.y, 19, 8);
      }
    }
    map.ships.forEach((sh, i) => {
      const st = ships?.state[i] ?? { bob: 0, lean: 0 };
      const c = ships?.cannon;
      const fuse = c && c.state === 'pavio' && c.ship === i;
      const justFired = c && c.state === 'espera' && c.ship !== i ? Math.max(0, SHIP.cannon.every - SHIP.cannon.fuse - c.time) : 9;
      const recoil = justFired < 0.3 ? (1 - justFired / 0.3) * 10 : 0;
      cannonArt(ctx, sh.cannon.x, DECK + st.bob, sh.cannon.dir, recoil, fuse, time);
      const { sternX, dir } = shipShape(map, i);
      wheel(ctx, sternX + dir * 90, DECK - POOP + st.bob, st.lean * 8 + Math.sin(time * 0.7 + i) * 0.4);
      // luz do lampião da popa
      const lx = sternX - dir * 2;
      const ly = DECK - POOP - 44 + st.bob;
      const f = 0.8 + 0.15 * Math.sin(time * 8 + i * 3) + 0.05 * Math.sin(time * 21);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const lg = ctx.createRadialGradient(lx, ly, 1, lx, ly, 46 * f);
      lg.addColorStop(0, `rgba(255,200,110,${0.55 * f})`);
      lg.addColorStop(1, 'rgba(255,200,110,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(lx - 50, ly - 50, 100, 100);
      ctx.restore();
    });
  },
  overlay(ctx, time, game) {
    if (game.map.art !== 'navio') return;
    overlay(ctx, time, game);
  },
  onEvent(e, P, r) {
    switch (e.type) {
      case 'cannonFuse':
        P.burst(e.x, e.y - 40, { type: 'spark', count: 10, speed: 120, angle: -Math.PI / 2, spread: 1.6, life: 0.5, size: 2, color: '#ffd25a', drag: 2 });
        break;
      case 'cannonFire':
        P.add({ x: e.x, y: e.y, size: 30, grow: 120, life: 0.15, color: 'rgba(255,240,200,0.9)' });
        P.burst(e.x, e.y, { count: 16, speed: 180, angle: e.dir > 0 ? -0.4 : Math.PI + 0.4, spread: 1.2, life: 1.4, size: 12, grow: 22, color: 'rgba(230,225,230,0.6)', drag: 2, gravity: -40 });
        P.burst(e.x, e.y, { type: 'spark', count: 16, speed: 420, angle: e.dir > 0 ? -0.4 : Math.PI + 0.4, spread: 0.8, life: 0.3, size: 2.5, color: '#ffd25a', drag: 3 });
        r?.shake(7, 0.25);
        break;
      case 'cannonBoom':
        P.add({ type: 'ring', x: e.x, y: e.y, size: 10, grow: e.radius * 4, life: 0.3, color: '#ffd25a' });
        P.burst(e.x, e.y, { count: 14, speed: 200, life: 0.6, size: 10, grow: 16, color: 'rgba(255,140,60,0.75)', drag: 3 });
        P.burst(e.x, e.y, { count: 18, speed: 380, angle: -Math.PI / 2, spread: 2.4, life: 0.8, size: 3.5, color: '#7a4a28', gravity: 1200 });
        P.burst(e.x, e.y, { count: 10, speed: 120, life: 1.2, size: 12, grow: 20, color: 'rgba(70,60,60,0.55)', gravity: -60 });
        r?.shake(12, 0.35);
        break;
      default:
    }
  },
  haze: ['rgba(255,236,220,0)', 'rgba(255,220,200,0.25)'],
  vignette: 0.25,
};
