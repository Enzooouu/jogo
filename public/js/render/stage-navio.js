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

import { seeded } from './stage-util.js';
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
  g.addColorStop(0, '#24366e');
  g.addColorStop(0.35, '#4f74b8');
  g.addColorStop(0.62, '#e7a58f');
  g.addColorStop(0.8, '#ffcf8f');
  g.addColorStop(1, '#ffe2b0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const rand = seeded(41);
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.2 + rand() * 0.5})`;
    ctx.fillRect(rand() * VIEW_W, rand() * 170, 1.4, 1.4);
  }
  const glow = ctx.createRadialGradient(SUN.x, SUN.y, 20, SUN.x, SUN.y, 460);
  glow.addColorStop(0, 'rgba(255,236,190,0.8)');
  glow.addColorStop(1, 'rgba(255,200,150,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fff3cf';
  ctx.beginPath();
  ctx.arc(SUN.x, SUN.y, 54, 0, Math.PI * 2);
  ctx.fill();
  // faixas de nuvem fina cortando o sol
  for (const [y, w, x] of [[440, 380, 960], [470, 260, 1020]]) {
    ctx.fillStyle = 'rgba(230,150,150,0.45)';
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function skyAnimated(ctx, time) {
  // riscos de vento passando (os navios estão voando para a direita)
  ctx.strokeStyle = 'rgba(255,255,255,0.32)';
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

function drawFar(ctx, map, rand) {
  // ilhas flutuando lá longe, apagadas pela distância
  for (const [x, y, w] of [[-300, 360, 80], [140, 350, 60], [430, 320, 34], [1180, 340, 70], [1620, 360, 60]]) {
    ctx.fillStyle = 'rgba(130,110,160,0.55)';
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w * 0.4, y + w * (0.7 + rand() * 0.3));
    ctx.lineTo(x - w * 0.3, y + w * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(140,170,120,0.55)';
    ctx.fillRect(x - w, y - 3, w * 2, 4);
  }
  // nuvens grandes e paradas no horizonte
  ctx.fillStyle = 'rgba(255,220,210,0.55)';
  for (let x = -760; x < 2040; x += 60 + rand() * 40) {
    const r = 40 + rand() * 40;
    ctx.beginPath();
    ctx.arc(x, 560 - rand() * 30, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillRect(-760, 560, 2800, 900);
}

function farAnimated(ctx, time) {
  // um navio pequenininho cruzando o céu lá longe
  const fx = ((time * 12) % 1900) - 300;
  ctx.fillStyle = 'rgba(70,60,100,0.5)';
  ctx.beginPath();
  ctx.moveTo(fx - 30, 250);
  ctx.lineTo(fx + 30, 250);
  ctx.lineTo(fx + 20, 258);
  ctx.lineTo(fx - 22, 258);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(fx - 1, 222, 2, 28);
  ctx.beginPath();
  ctx.moveTo(fx + 1, 224);
  ctx.lineTo(fx + 16, 238);
  ctx.lineTo(fx + 1, 246);
  ctx.fill();
}

// ================================================================ meio: nuvens passando

function puff(ctx, x, y, s) {
  ctx.beginPath();
  for (const [dx, dy, r] of [[-60, 8, 32], [-25, -10, 42], [20, -4, 38], [58, 10, 28], [0, 14, 36]]) {
    ctx.moveTo(x + dx * s + r * s, y + dy * s);
    ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
  }
  ctx.fill();
}

const CLOUDS = (() => {
  const rand = seeded(77);
  return Array.from({ length: 10 }, () => ({ x: rand() * 2400, y: 60 + rand() * 340, s: 0.5 + rand() * 0.9, v: 40 + rand() * 70 }));
})();

function drawMid() {}

function midAnimated(ctx, time) {
  ctx.fillStyle = 'rgba(255,236,226,0.55)';
  for (const c of CLOUDS) {
    const x = (((c.x - time * c.v) % 2600) + 2600) % 2600 - 600;
    puff(ctx, x, c.y, c.s);
  }
  // mar de nuvens embaixo, correndo para trás
  const g = ctx.createLinearGradient(0, 640, 0, 760);
  g.addColorStop(0, 'rgba(255,226,210,0.95)');
  g.addColorStop(1, 'rgba(240,190,200,1)');
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i < 46; i++) {
    const r = 40 + ((i * 37) % 50);
    const x = ((((i * 70) - time * 90) % 3200) + 3200) % 3200 - 700;
    ctx.moveTo(x + r, 720);
    ctx.arc(x, 720, r, 0, Math.PI * 2);
  }
  ctx.rect(-700, 720, 3200, 800);
  ctx.fill();
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
  const solids = map.solids.filter((s) => s.ship === i);
  const left = Math.min(...solids.map((s) => s.x));
  const right = Math.max(...solids.map((s) => s.x + s.w));
  const poop = solids.find((s) => s.y < DECK);
  const dir = poop.x === left ? 1 : -1;   // 1 = popa na esquerda, proa na direita
  const sternX = dir > 0 ? left : right;
  const bowX = dir > 0 ? right : left;
  return { sternX, bowX, dir };
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
    const prancha = map.platforms.find((p) => p.ship == null);
    if (prancha) {
      ctx.strokeStyle = 'rgba(60,35,20,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(prancha.x, prancha.y - 28);
      ctx.quadraticCurveTo(prancha.x + prancha.w / 2, prancha.y - 18, prancha.x + prancha.w, prancha.y - 28);
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
