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

import { seeded, ridgeLine } from './stage-util.js';
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

// casco, convés e tombadilho (sem os mastros), em coordenadas do mundo
function hull(ctx, sh, c, sternX, bowX, dir) {
  const cx = (sternX + bowX) / 2;
  const x0 = Math.min(sternX, bowX);
  const x1 = Math.max(sternX, bowX);
  ctx.beginPath();
  ctx.moveTo(sternX, DECK - POOP);
  ctx.lineTo(sternX - dir * 6, DECK + 30);
  ctx.quadraticCurveTo(sternX + dir * 40, DECK + 100, cx, DECK + 104);
  ctx.quadraticCurveTo(bowX - dir * 70, DECK + 100, bowX + dir * 26, DECK - 14);
  ctx.lineTo(bowX, DECK);
  ctx.lineTo(sternX + dir * 120, DECK);
  ctx.lineTo(sternX + dir * 120, DECK - POOP);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, DECK - POOP, 0, DECK + 104);
  g.addColorStop(0, '#9a5d32');
  g.addColorStop(0.5, '#6f3f22');
  g.addColorStop(1, '#3f2214');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#2a160c';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(30,15,8,0.45)';
  ctx.lineWidth = 1.2;
  for (let y = DECK + 14; y < DECK + 104; y += 14) {
    ctx.beginPath();
    ctx.moveTo(x0 - 60, y);
    ctx.lineTo(x1 + 60, y);
    ctx.stroke();
  }
  ctx.fillStyle = c.stripe;
  ctx.fillRect(x0 - 60, DECK + 22, x1 - x0 + 120, 8);
  ctx.fillStyle = '#e8c068';
  ctx.fillRect(x0 - 60, DECK + 6, x1 - x0 + 120, 3);
  for (let k = 0; k < 4; k++) {
    const wx = cx - 120 + k * 80;
    ctx.fillStyle = '#2a160c';
    ctx.beginPath();
    ctx.arc(wx, DECK + 50, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e8c068';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
  // tombadilho com janelas acesas e grade
  const pA = Math.min(sternX, sternX + dir * 120);
  const pB = Math.max(sternX, sternX + dir * 120);
  plank(ctx, pA, pB, DECK - POOP, 10, '#d39a5c', '#a8703e');
  ctx.fillStyle = '#ffd98a';
  for (let k = 0; k < 3; k++) ctx.fillRect(pA + 18 + k * 32, DECK - 40, 14, 14);
  ctx.strokeStyle = '#5a3420';
  ctx.lineWidth = 2;
  const outer = dir > 0 ? pA : pB;
  for (let k = 0; k < 6; k++) {
    const x = outer + dir * (4 + k * 12);
    ctx.beginPath();
    ctx.moveTo(x, DECK - POOP);
    ctx.lineTo(x, DECK - POOP - 14);
    ctx.stroke();
  }
  ctx.fillStyle = '#5a3420';
  ctx.fillRect(dir > 0 ? outer : outer - 66, DECK - POOP - 17, 66, 4);
  // convés
  const dA = Math.min(sternX + dir * 120, bowX);
  const dB = Math.max(sternX + dir * 120, bowX);
  plank(ctx, dA, dB, DECK, 10, '#d9a568', '#a8703e');
  ctx.strokeStyle = 'rgba(80,45,20,0.35)';
  ctx.lineWidth = 1;
  for (let x = dA + 30; x < dB; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, DECK + 1);
    ctx.lineTo(x, DECK + 9);
    ctx.stroke();
  }
  void sh;
}

// cada casco vira uma imagem (é desenhado uma vez só)
const HULLS = new Map();
function hullSprite(i, sh, sternX, bowX, dir) {
  if (HULLS.has(i)) return HULLS.get(i);
  const x0 = Math.min(sternX, bowX) - 50;
  const x1 = Math.max(sternX, bowX) + 50;
  const y0 = DECK - POOP - 30;
  const y1 = DECK + 120;
  const res = 2;
  const c = document.createElement('canvas');
  c.width = (x1 - x0) * res;
  c.height = (y1 - y0) * res;
  const x = c.getContext('2d');
  x.scale(res, res);
  x.translate(-x0, -y0);
  hull(x, sh, COLORS[i], sternX, bowX, dir);
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
  // mastro inclinado
  ctx.strokeStyle = '#7a4a28';
  ctx.lineWidth = 14;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(topX, topY);
  ctx.stroke();
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
  ctx.strokeStyle = 'rgba(90,70,50,0.5)';
  ctx.lineWidth = 1.5;
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
  // bandeira tremulando no topo
  ctx.fillStyle = c.flag;
  const fd = -dir;
  ctx.beginPath();
  ctx.moveTo(topX, topY);
  for (let k = 0; k <= 8; k++) {
    const u = k / 8;
    ctx.lineTo(topX + fd * u * 60, topY + Math.sin(time * 6 - u * 4) * 4 * u);
  }
  for (let k = 8; k >= 0; k--) {
    const u = k / 8;
    ctx.lineTo(topX + fd * u * 60, topY + 26 - u * 6 + Math.sin(time * 6 - u * 4) * 4 * u);
  }
  ctx.closePath();
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
