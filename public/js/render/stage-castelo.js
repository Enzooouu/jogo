// Cenário do Castelo do Rei (Rei da Ilha): pátio de um castelo ao pôr do sol.
//
//   céu      azul-escuro em cima, laranja no horizonte, sol baixo e nuvens
//   longe    morros roxos, uma vila e um castelo distante
//   meio     muralha do fundo com janelas acesas, estandartes e torres
//   campo    pátio de pedra, duas torres com bandeiras, passarelas de
//            madeira nas ameias, o trono no degrau do meio, tapete vermelho e
//            a sacada do rei lá no alto
//
// Mesmo formato dos outros cenários (ver stage.js).

import { roundRect, seeded, ridgeLine, glowSprite } from './stage-util.js';

const INK = '#1c1020';
const STONE = { top: '#cdb89a', light: '#b39d80', mid: '#93806a', dark: '#6e5e4f', deep: '#4c4038', mortar: '#3a3029' };
const WOOD = { light: '#c98b52', mid: '#9c6635', dark: '#6b4322', deep: '#432a16' };
const RED = '#b8283a';
const GOLD = '#f0c04a';

// ================================================================ céu

function paintSky(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, 720);
  sky.addColorStop(0, '#1f2a66');
  sky.addColorStop(0.3, '#4a3c8a');
  sky.addColorStop(0.55, '#c0587a');
  sky.addColorStop(0.75, '#ff9a5a');
  sky.addColorStop(1, '#ffd08a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1280, 720);
  // sol baixo atrás do castelo
  const sun = ctx.createRadialGradient(640, 430, 10, 640, 430, 420);
  sun.addColorStop(0, 'rgba(255,240,190,0.95)');
  sun.addColorStop(0.12, 'rgba(255,210,130,0.7)');
  sun.addColorStop(0.4, 'rgba(255,150,90,0.25)');
  sun.addColorStop(1, 'rgba(255,120,80,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#fff4cf';
  ctx.beginPath();
  ctx.arc(640, 430, 56, 0, Math.PI * 2);
  ctx.fill();
  // estrelinhas no alto
  const rand = seeded(21);
  for (let i = 0; i < 70; i++) {
    ctx.globalAlpha = 0.2 + rand() * 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rand() * 1280, rand() * 190, 1.4, 1.4);
  }
  ctx.globalAlpha = 1;
  // nuvens compridas cor-de-rosa
  for (const [x, y, w, a] of [[220, 250, 420, 0.5], [980, 210, 520, 0.45], [600, 150, 360, 0.35], [1150, 330, 300, 0.4], [80, 360, 260, 0.35]]) {
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, 'rgba(255,170,150,0)');
    g.addColorStop(0.5, `rgba(255,180,160,${a})`);
    g.addColorStop(1, 'rgba(255,170,150,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(120,60,110,${a * 0.5})`;
    ctx.beginPath();
    ctx.ellipse(x + 10, y + 7, w / 2.3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// passarinhos voando em V
function skyAnimated(ctx, t) {
  ctx.strokeStyle = 'rgba(40,20,50,0.7)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 5; i++) {
    const x = ((t * 22 + i * 260) % 1600) - 160;
    const y = 120 + i * 37 + Math.sin(t * 0.8 + i) * 8;
    const flap = Math.sin(t * 9 + i * 2) * 3;
    ctx.beginPath();
    ctx.moveTo(x - 7, y - flap);
    ctx.quadraticCurveTo(x - 3, y - 3, x, y);
    ctx.quadraticCurveTo(x + 3, y - 3, x + 7, y - flap);
    ctx.stroke();
  }
}

// ================================================================ longe

function drawFar(ctx, map, rand) {
  // morros roxos em duas camadas
  for (const [base, color, rough] of [[470, '#7a4a7e', 0.22], [520, '#5a3664', 0.18]]) {
    const pts = ridgeLine([[-600, base - 40], [200, base - 90], [700, base - 30], [1300, base - 100], [2000, base - 40]], rand, rough);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-600, 1400);
    for (const [x, y] of pts) ctx.lineTo(x, y);
    ctx.lineTo(2000, 1400);
    ctx.closePath();
    ctx.fill();
  }
  // castelo distante no morro da direita
  ctx.fillStyle = '#3e2450';
  const cx = 1080;
  const cy = 430;
  ctx.fillRect(cx - 60, cy - 30, 120, 40);
  for (const [dx, h] of [[-60, 70], [-10, 95], [44, 60]]) {
    ctx.fillRect(cx + dx, cy - h, 18, h);
    ctx.beginPath();
    ctx.moveTo(cx + dx - 4, cy - h);
    ctx.lineTo(cx + dx + 9, cy - h - 22);
    ctx.lineTo(cx + dx + 22, cy - h);
    ctx.fill();
  }
  // vila com luzinhas no morro da esquerda
  for (let i = 0; i < 12; i++) {
    const x = 60 + i * 26 + rand() * 10;
    const y = 470 - Math.sin(i / 3) * 20 + rand() * 6;
    ctx.fillStyle = '#3e2450';
    ctx.fillRect(x, y - 12, 18, 14);
    ctx.beginPath();
    ctx.moveTo(x - 3, y - 12);
    ctx.lineTo(x + 9, y - 22);
    ctx.lineTo(x + 21, y - 12);
    ctx.fill();
    if (rand() < 0.7) {
      ctx.fillStyle = '#ffcf6a';
      ctx.fillRect(x + 6, y - 7, 4, 4);
    }
  }
}

function farAnimated() {}

// ================================================================ meio

function drawMid(ctx, map, rand) {
  // muralha do fundo
  const top = 330;
  const wall = ctx.createLinearGradient(0, top, 0, 760);
  wall.addColorStop(0, '#8a6a72');
  wall.addColorStop(1, '#4a3444');
  ctx.fillStyle = wall;
  ctx.fillRect(-400, top, 2100, 900);
  // blocos
  ctx.strokeStyle = 'rgba(40,24,36,0.35)';
  ctx.lineWidth = 1.5;
  for (let y = top + 18, r = 0; y < 900; y += 18, r++) {
    ctx.beginPath();
    ctx.moveTo(-400, y);
    ctx.lineTo(1700, y);
    ctx.stroke();
    for (let x = -400 + (r % 2) * 22; x < 1700; x += 44) {
      ctx.beginPath();
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
  // ameias
  ctx.fillStyle = '#8a6a72';
  for (let x = -400; x < 1700; x += 40) ctx.fillRect(x, top - 18, 24, 18);
  ctx.fillStyle = 'rgba(255,200,150,0.25)';
  for (let x = -400; x < 1700; x += 40) ctx.fillRect(x, top - 18, 24, 3);
  // torres do fundo
  for (const tx of [-120, 380, 900, 1400]) {
    ctx.fillStyle = '#7a5c66';
    ctx.fillRect(tx, top - 130, 90, 140);
    ctx.fillStyle = '#5a3e4c';
    ctx.beginPath();
    ctx.moveTo(tx - 10, top - 130);
    ctx.lineTo(tx + 45, top - 210);
    ctx.lineTo(tx + 100, top - 130);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffcf6a';
    roundRect(ctx, tx + 36, top - 100, 18, 28, 9);
    ctx.fill();
  }
  // janelas acesas e estandartes na muralha
  for (let x = -300; x < 1600; x += 170) {
    const glow = ctx.createRadialGradient(x, top + 90, 2, x, top + 90, 40);
    glow.addColorStop(0, 'rgba(255,190,90,0.45)');
    glow.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 40, top + 50, 80, 80);
    ctx.fillStyle = '#ffc66a';
    roundRect(ctx, x - 9, top + 72, 18, 34, 9);
    ctx.fill();
    ctx.fillStyle = 'rgba(60,30,40,0.6)';
    ctx.fillRect(x - 1, top + 72, 2, 34);
    // estandarte
    const bx = x + 85;
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.moveTo(bx - 16, top + 30);
    ctx.lineTo(bx + 16, top + 30);
    ctx.lineTo(bx + 16, top + 120);
    ctx.lineTo(bx, top + 106);
    ctx.lineTo(bx - 16, top + 120);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = GOLD;
    ctx.fillRect(bx - 16, top + 30, 32, 4);
    crownShape(ctx, bx, top + 70, 0.45, GOLD);
  }
}

function midAnimated() {}

// ================================================================ campo

function stoneFace(ctx, x, y, w, h, rand, blockW = 46, blockH = 24) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, STONE.light);
  g.addColorStop(1, STONE.deep);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  for (let yy = y, r = 0; yy < y + h; yy += blockH, r++) {
    for (let xx = x - (r % 2) * blockW / 2; xx < x + w; xx += blockW) {
      ctx.fillStyle = `rgba(255,240,220,${0.04 + rand() * 0.08})`;
      ctx.fillRect(xx + 2, yy + 2, blockW - 4, blockH - 4);
      ctx.fillStyle = `rgba(30,20,10,${rand() * 0.12})`;
      ctx.fillRect(xx + 2, yy + blockH - 6, blockW - 4, 4);
    }
    ctx.strokeStyle = STONE.mortar;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + w, yy);
    for (let xx = x - (r % 2) * blockW / 2; xx < x + w; xx += blockW) {
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx, yy + blockH);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // escurece embaixo (o pátio afunda na sombra)
  const dark = ctx.createLinearGradient(0, y + h * 0.4, 0, y + h);
  dark.addColorStop(0, 'rgba(20,10,20,0)');
  dark.addColorStop(1, 'rgba(20,10,20,0.6)');
  ctx.fillStyle = dark;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
}

// borda de cima de um bloco de pedra (onde se pisa)
function stoneLip(ctx, x, y, w) {
  ctx.fillStyle = STONE.top;
  ctx.fillRect(x - 4, y - 2, w + 8, 10);
  ctx.fillStyle = 'rgba(255,245,220,0.6)';
  ctx.fillRect(x - 4, y - 2, w + 8, 2);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x - 4, y - 2, w + 8, 10);
}

function crownShape(ctx, x, y, k, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-20, -18);
  ctx.lineTo(-9, -9);
  ctx.lineTo(0, -24);
  ctx.lineTo(9, -9);
  ctx.lineTo(20, -18);
  ctx.lineTo(18, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function tower(ctx, s, rand, side) {
  stoneFace(ctx, s.x, s.y, s.w, s.h + 200, rand, 42, 26);
  // seteiras
  ctx.fillStyle = '#1e1218';
  for (const dy of [40, 100]) {
    roundRect(ctx, s.x + s.w / 2 - 4, s.y + dy, 8, 30, 4);
    ctx.fill();
  }
  // escudo com a coroa
  const cx = s.x + s.w / 2;
  ctx.fillStyle = side < 0 ? '#2f5fb8' : '#2f5fb8';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 22, s.y + 170);
  ctx.lineTo(cx + 22, s.y + 170);
  ctx.lineTo(cx + 22, s.y + 196);
  ctx.quadraticCurveTo(cx, s.y + 222, cx - 22, s.y + 196);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  crownShape(ctx, cx, s.y + 197, 0.6, GOLD);
  stoneLip(ctx, s.x, s.y, s.w);
}

// passarela de madeira presa na torre (plataforma: dá para atravessar de baixo)
function walkway(ctx, p, side) {
  const y = p.y;
  // vigas por baixo, presas na parede da torre
  ctx.strokeStyle = WOOD.dark;
  ctx.lineWidth = 6;
  const wallX = side < 0 ? p.x : p.x + p.w;
  for (const k of [0.45, 0.9]) {
    const x = side < 0 ? p.x + p.w * k : p.x + p.w * (1 - k);
    ctx.beginPath();
    ctx.moveTo(x, y + 12);
    ctx.lineTo(wallX, y + 12 + Math.abs(x - wallX) * 0.55);
    ctx.stroke();
  }
  // tábuas
  ctx.fillStyle = WOOD.mid;
  ctx.fillRect(p.x, y - 2, p.w, 14);
  ctx.fillStyle = WOOD.light;
  ctx.fillRect(p.x, y - 2, p.w, 3);
  ctx.strokeStyle = WOOD.deep;
  ctx.lineWidth = 1.5;
  for (let x = p.x + 24; x < p.x + p.w; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 12);
    ctx.stroke();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(p.x, y - 2, p.w, 14);
  // corrimão de corda na frente
  ctx.strokeStyle = '#d9b46a';
  ctx.lineWidth = 2;
  const posts = [p.x + 6, p.x + p.w / 2, p.x + p.w - 6];
  ctx.beginPath();
  for (let i = 0; i < posts.length - 1; i++) {
    ctx.moveTo(posts[i], y - 22);
    ctx.quadraticCurveTo((posts[i] + posts[i + 1]) / 2, y - 12, posts[i + 1], y - 22);
  }
  ctx.stroke();
  ctx.fillStyle = WOOD.dark;
  for (const x of posts) ctx.fillRect(x - 2.5, y - 26, 5, 26);
}

function throne(ctx, cx, y) {
  // encosto alto dourado com veludo vermelho
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(cx - 34, y);
  ctx.lineTo(cx - 34, y - 70);
  ctx.quadraticCurveTo(cx - 34, y - 100, cx - 14, y - 104);
  ctx.lineTo(cx, y - 122);
  ctx.lineTo(cx + 14, y - 104);
  ctx.quadraticCurveTo(cx + 34, y - 100, cx + 34, y - 70);
  ctx.lineTo(cx + 34, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = RED;
  roundRect(ctx, cx - 22, y - 92, 44, 66, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, cx - 18, y - 88, 12, 56, 6);
  ctx.fill();
  // assento e braços
  ctx.fillStyle = RED;
  roundRect(ctx, cx - 40, y - 30, 80, 14, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = GOLD;
  for (const dx of [-44, 32]) {
    roundRect(ctx, cx + dx, y - 44, 12, 44, 5);
    ctx.fill();
    ctx.stroke();
  }
  // joia no topo
  ctx.fillStyle = '#5fd0ff';
  ctx.beginPath();
  ctx.arc(cx, y - 108, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function balcony(ctx, p) {
  // laje de pedra com mísulas e balaústre
  const y = p.y;
  ctx.fillStyle = STONE.mid;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(p.x, y + 16);
  ctx.lineTo(p.x + p.w, y + 16);
  ctx.lineTo(p.x + p.w - 30, y + 46);
  ctx.quadraticCurveTo(p.x + p.w / 2, y + 66, p.x + 30, y + 46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  stoneLip(ctx, p.x, y, p.w);
  ctx.fillStyle = STONE.top;
  ctx.fillRect(p.x - 4, y + 8, p.w + 8, 8);
  ctx.strokeRect(p.x - 4, y + 8, p.w + 8, 8);
  // estandarte pendurado embaixo
  const bx = p.x + p.w / 2;
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.moveTo(bx - 26, y + 50);
  ctx.lineTo(bx + 26, y + 50);
  ctx.lineTo(bx + 26, y + 130);
  ctx.lineTo(bx, y + 112);
  ctx.lineTo(bx - 26, y + 130);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.fillRect(bx - 26, y + 50, 52, 5);
  crownShape(ctx, bx, y + 94, 0.8, GOLD);
}

function drawTerrain(ctx, map, rand) {
  const [yard, towerL, towerR, dais] = map.solids;
  // pátio: frente de pedra e chão de lajotas
  stoneFace(ctx, yard.x, yard.y, yard.w, yard.h, rand);
  ctx.fillStyle = STONE.top;
  ctx.fillRect(yard.x - 4, yard.y - 2, yard.w + 8, 12);
  ctx.strokeStyle = 'rgba(80,60,40,0.45)';
  ctx.lineWidth = 1.2;
  for (let x = yard.x + 30; x < yard.x + yard.w; x += 34) {
    ctx.beginPath();
    ctx.moveTo(x, yard.y);
    ctx.lineTo(x - 4, yard.y + 10);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,245,220,0.6)';
  ctx.fillRect(yard.x - 4, yard.y - 2, yard.w + 8, 2);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(yard.x - 4, yard.y - 2, yard.w + 8, 12);
  // tapete vermelho do trono até as pontas do pátio
  ctx.fillStyle = RED;
  ctx.fillRect(dais.x - 140, yard.y - 2, dais.w + 280, 6);
  ctx.fillStyle = GOLD;
  ctx.fillRect(dais.x - 140, yard.y + 3, dais.w + 280, 2);

  // torres
  tower(ctx, towerL, rand, -1);
  tower(ctx, towerR, rand, 1);
  // passarelas
  walkway(ctx, map.platforms[0], -1);
  walkway(ctx, map.platforms[1], 1);
  // trono no degrau do meio
  throne(ctx, dais.x + dais.w / 2, dais.y);
  ctx.fillStyle = STONE.light;
  ctx.fillRect(dais.x, dais.y, dais.w, dais.h);
  ctx.fillStyle = RED;
  ctx.fillRect(dais.x + 20, dais.y, dais.w - 40, dais.h);
  ctx.fillStyle = GOLD;
  ctx.fillRect(dais.x + 20, dais.y, dais.w - 40, 3);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(dais.x, dais.y, dais.w, dais.h);
  // sacada do rei
  balcony(ctx, map.platforms[2]);
  // suportes de tocha nas paredes do pátio
  ctx.fillStyle = '#3a2a22';
  for (const x of torchXs(map)) {
    ctx.fillRect(x - 3, yard.y + 40, 6, 22);
    ctx.fillRect(x - 9, yard.y + 36, 18, 6);
  }
}

const torchXs = (map) => {
  const yard = map.solids[0];
  return [yard.x + 220, yard.x + yard.w - 220];
};

// ================================================================ frente (animado)

function flag(ctx, x, y, time, dir) {
  ctx.strokeStyle = '#3a2a22';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 74);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(x, y - 76, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = RED;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 72);
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    ctx.lineTo(x + dir * k * 46, y - 72 + Math.sin(time * 4 + k * 5) * 4 * k);
  }
  for (let i = n; i >= 0; i--) {
    const k = i / n;
    ctx.lineTo(x + dir * k * 46, y - 46 + Math.sin(time * 4 + k * 5) * 4 * k - (k > 0.9 ? 6 : 0));
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function torchFire(ctx, x, y, time) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.55 + Math.sin(time * 9) * 0.1;
  ctx.drawImage(glowSprite('255,160,60'), x - 40, y - 46, 80, 80);
  ctx.restore();
  for (let i = 0; i < 3; i++) {
    const h = 18 - i * 5 + Math.sin(time * 13 + i * 2) * 3;
    ctx.fillStyle = ['#ff6a1f', '#ffa53a', '#ffe08a'][i];
    ctx.beginPath();
    ctx.moveTo(x - 7 + i * 2, y);
    ctx.quadraticCurveTo(x - 6, y - h * 0.6, x + Math.sin(time * 8 + i) * 2, y - h);
    ctx.quadraticCurveTo(x + 6, y - h * 0.6, x + 7 - i * 2, y);
    ctx.closePath();
    ctx.fill();
  }
}

export const CASTELO_ART = {
  sky: paintSky,
  skyAnimated,
  far: drawFar,
  farAnimated,
  mid: drawMid,
  midAnimated,
  terrain: drawTerrain,
  behind() {},
  front(ctx, map, time) {
    const [yard, towerL, towerR] = map.solids;
    flag(ctx, towerL.x + 14, towerL.y, time, 1);
    flag(ctx, towerR.x + towerR.w - 14, towerR.y, time + 1, -1);
    torchXs(map).forEach((x, i) => torchFire(ctx, x, yard.y + 36, time + i));
  },
  haze: ['rgba(255,170,120,0)', 'rgba(255,150,110,0.22)'],
  vignette: 0.4,
};
