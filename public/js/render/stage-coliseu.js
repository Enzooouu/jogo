// Cenário do Coliseu: arena romana no fim da tarde.
//
//   céu      degradê roxo -> laranja -> dourado, sol baixo e nuvens rosadas
//   longe    a cidade ao longe (templos, ciprestes) na neblina quente
//   meio     a parede do coliseu: três andares de arcos, a torcida nas
//            arquibancadas, faixas vermelhas penduradas
//   campo    palco de pedra com faixa grega entalhada sobre o fosso, colunas
//            quebradas (as plataformas) e uma laje com estandarte no meio;
//            tochas com fogo animado nas pontas
//
// As paredes de espinhos da morte súbita são desenhadas no renderer (elas se
// mexem). Mesmo formato de TREINO_ART (ver stage.js).

import { roundRect, seeded } from './stage-util.js';

const VIEW_W = 1280;
const VIEW_H = 720;
const SUN = { x: 900, y: 330, r: 60 };
const INK = '#1e1208';
const STONE = { light: '#f2dcae', mid: '#d9b57e', dark: '#a8814f', deep: '#6e5032', shadow: '#4a3420' };

// ================================================================ céu

function paintSky(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, '#2c2060');
  sky.addColorStop(0.35, '#7a3a7a');
  sky.addColorStop(0.62, '#e8745a');
  sky.addColorStop(0.85, '#ffb46a');
  sky.addColorStop(1, '#ffd88a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const glow = ctx.createRadialGradient(SUN.x, SUN.y, SUN.r * 0.5, SUN.x, SUN.y, SUN.r * 7);
  glow.addColorStop(0, 'rgba(255,230,160,0.7)');
  glow.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fff1c4';
  ctx.beginPath();
  ctx.arc(SUN.x, SUN.y, SUN.r, 0, Math.PI * 2);
  ctx.fill();
  // nuvens compridas cor-de-rosa
  const rand = seeded(29);
  for (let i = 0; i < 9; i++) {
    const x = rand() * VIEW_W;
    const y = 70 + rand() * 230;
    const w = 180 + rand() * 300;
    ctx.fillStyle = `rgba(255,${150 + Math.floor(rand() * 60)},${150 + Math.floor(rand() * 40)},${0.25 + rand() * 0.25})`;
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, 5 + rand() * 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,240,210,0.25)';
    ctx.beginPath();
    ctx.ellipse(x - w * 0.1, y - 3, w * 0.35, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function skyAnimated(ctx, time) {
  // pássaros voltando para casa
  ctx.strokeStyle = 'rgba(40,20,40,0.6)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 5; i++) {
    const x = ((time * (20 + i * 4) + i * 300) % 1700) - 200;
    const y = 120 + i * 26 + Math.sin(time * 0.7 + i) * 8;
    const f = Math.sin(time * 8 + i * 2) * 3;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - f);
    ctx.quadraticCurveTo(x - 3, y - 3, x, y);
    ctx.quadraticCurveTo(x + 3, y - 3, x + 6, y - f);
    ctx.stroke();
  }
}

// ================================================================ fundo distante

function temple(ctx, x, y, s) {
  ctx.fillRect(x - 40 * s, y - 6 * s, 80 * s, 6 * s);
  for (let i = 0; i < 6; i++) ctx.fillRect(x - 34 * s + i * 13 * s, y - 40 * s, 5 * s, 34 * s);
  ctx.fillRect(x - 42 * s, y - 46 * s, 84 * s, 6 * s);
  ctx.beginPath();
  ctx.moveTo(x - 44 * s, y - 46 * s);
  ctx.lineTo(x, y - 64 * s);
  ctx.lineTo(x + 44 * s, y - 46 * s);
  ctx.closePath();
  ctx.fill();
}

function cypress(ctx, x, y, s) {
  ctx.beginPath();
  ctx.ellipse(x, y - 26 * s, 6 * s, 28 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFar(ctx, map, rand) {
  // morros da cidade
  ctx.fillStyle = '#8a4a6a';
  ctx.beginPath();
  ctx.moveTo(-800, 1400);
  for (let x = -800; x <= 2100; x += 20) ctx.lineTo(x, 400 - Math.sin(x * 0.003 + 1) * 40 - Math.sin(x * 0.009) * 12);
  ctx.lineTo(2100, 1400);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6e3a5c';
  for (let i = 0; i < 9; i++) {
    const x = -500 + i * 300 + rand() * 120;
    const y = 400 - Math.sin(x * 0.003 + 1) * 40 - Math.sin(x * 0.009) * 12 + 4;
    temple(ctx, x, y, 0.6 + rand() * 0.4);
    for (let k = 0; k < 4; k++) cypress(ctx, x + 60 + k * 16 + rand() * 8, y + 2, 0.7 + rand() * 0.5);
  }
  // aqueduto ao longe
  ctx.fillStyle = '#7a4060';
  ctx.fillRect(-800, 352, 2900, 8);
  for (let x = -800; x < 2100; x += 34) {
    ctx.fillRect(x, 360, 8, 50);
  }
  const haze = ctx.createLinearGradient(0, 300, 0, 460);
  haze.addColorStop(0, 'rgba(255,190,140,0)');
  haze.addColorStop(1, 'rgba(255,190,140,0.45)');
  ctx.fillStyle = haze;
  ctx.fillRect(-800, 300, 2900, 1100);
}

function farAnimated() {}

// ================================================================ fundo médio

// Parede do coliseu: três andares de arcos com a torcida
const WALL = { top: 200, floors: [[200, 290], [290, 380], [380, 470]] };

function drawMid(ctx, map, rand) {
  const x0 = -560;
  const x1 = 1840;
  // sombra da parede (curvada, mais alta nas pontas)
  const g = ctx.createLinearGradient(0, WALL.top, 0, 640);
  g.addColorStop(0, '#d9a56e');
  g.addColorStop(1, '#8a5a38');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x0, 1400);
  for (let x = x0; x <= x1; x += 20) ctx.lineTo(x, WALL.top - 60 + ((x - 640) / 900) ** 2 * 60);
  ctx.lineTo(x1, 1400);
  ctx.closePath();
  ctx.fill();
  // andares de arcos
  WALL.floors.forEach(([top, bottom], f) => {
    const archW = 46 - f * 4;
    const gap = 14;
    for (let x = x0; x < x1; x += archW + gap) {
      const curve = ((x - 640) / 900) ** 2 * 60;
      const ay = top + curve - 50;
      const ah = bottom - top - 14;
      // vão escuro do arco
      ctx.fillStyle = f === 2 ? '#3a2014' : '#5a2e1c';
      ctx.beginPath();
      ctx.moveTo(x, ay + ah);
      ctx.lineTo(x, ay + archW / 2);
      ctx.arc(x + archW / 2, ay + archW / 2, archW / 2, Math.PI, 0);
      ctx.lineTo(x + archW, ay + ah);
      ctx.closePath();
      ctx.fill();
      // torcida dentro dos arcos de cima (cabecinhas coloridas)
      if (f < 2) {
        for (let k = 0; k < 3; k++) {
          ctx.fillStyle = ['#c84a3a', '#e8d2a0', '#4a6ab8', '#7ab84a', '#d8a83a', '#f2f2f2'][Math.floor(rand() * 6)];
          ctx.beginPath();
          ctx.arc(x + 8 + k * (archW - 16) / 2, ay + ah - 8, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#e8b890';
          ctx.beginPath();
          ctx.arc(x + 8 + k * (archW - 16) / 2, ay + ah - 16, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // coluna entre os arcos
      ctx.fillStyle = 'rgba(255,230,180,0.35)';
      ctx.fillRect(x + archW + 2, ay, 4, ah);
    }
    // cornija de cada andar
    ctx.fillStyle = '#e8c08a';
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 20) ctx.lineTo(x, bottom - 50 + ((x - 640) / 900) ** 2 * 60);
    for (let x = x1; x >= x0; x -= 20) ctx.lineTo(x, bottom - 42 + ((x - 640) / 900) ** 2 * 60);
    ctx.closePath();
    ctx.fill();
  });
  // arquibancada com o povo na frente da parede
  const standTop = 430;
  ctx.fillStyle = '#7a4a2a';
  ctx.fillRect(x0, standTop, x1 - x0, 400);
  for (let row = 0; row < 7; row++) {
    const y = standTop + 8 + row * 15;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(x0, y + 10, x1 - x0, 3);
    for (let x = x0 + (row % 2) * 6; x < x1; x += 11 + rand() * 4) {
      ctx.fillStyle = ['#b83a2a', '#e8dcc0', '#3a5aa8', '#6aa83a', '#d8a83a', '#8a4ab8', '#f2f2f2'][Math.floor(rand() * 7)];
      ctx.fillRect(x - 4, y - 2, 8, 9);
      ctx.fillStyle = ['#f0c8a0', '#c89070', '#8a5a3a'][Math.floor(rand() * 3)];
      ctx.beginPath();
      ctx.arc(x, y - 6, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // camarote do imperador no meio, com toldo vermelho
  ctx.fillStyle = '#e8c08a';
  ctx.fillRect(560, standTop - 50, 160, 50);
  ctx.fillStyle = '#b8282a';
  ctx.beginPath();
  ctx.moveTo(548, standTop - 50);
  ctx.lineTo(732, standTop - 50);
  ctx.lineTo(720, standTop - 72);
  ctx.lineTo(560, standTop - 72);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#ffd23f' : '#b8282a';
    ctx.beginPath();
    ctx.moveTo(548 + i * 23, standTop - 50);
    ctx.lineTo(548 + (i + 0.5) * 23, standTop - 42);
    ctx.lineTo(548 + (i + 1) * 23, standTop - 50);
    ctx.fill();
  }
  // faixas vermelhas penduradas no alto da parede
  for (let i = 0; i < 9; i++) {
    const x = -300 + i * 260;
    const y = WALL.top - 60 + ((x - 640) / 900) ** 2 * 60;
    ctx.fillStyle = '#a8202a';
    ctx.beginPath();
    ctx.moveTo(x - 16, y);
    ctx.lineTo(x + 16, y);
    ctx.lineTo(x + 16, y + 90);
    ctx.lineTo(x, y + 78);
    ctx.lineTo(x - 16, y + 90);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.arc(x, y + 34, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a8202a';
    ctx.beginPath();
    ctx.arc(x, y + 34, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Torcida animada: bracinhos e bandeirinhas subindo e descendo
function midAnimated(ctx, time) {
  for (let i = 0; i < 40; i++) {
    const x = -500 + i * 61;
    const y = 446 + (i % 5) * 15;
    const up = Math.max(0, Math.sin(time * 4 + i * 1.3));
    if (up < 0.3) continue;
    ctx.strokeStyle = '#f0c8a0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x + 3, y - 8 - up * 8);
    ctx.stroke();
    if (i % 3 === 0) {
      ctx.fillStyle = ['#ffd23f', '#b8282a', '#3a8aff'][i % 3 === 0 ? (i / 3) % 3 : 0];
      ctx.beginPath();
      ctx.moveTo(x + 3, y - 8 - up * 8);
      ctx.lineTo(x + 13, y - 5 - up * 8);
      ctx.lineTo(x + 3, y - 2 - up * 8);
      ctx.fill();
    }
  }
}

// ================================================================ campo (mundo)

// Faixa grega (meandro) entalhada
function meander(ctx, x0, x1, y, h) {
  ctx.strokeStyle = STONE.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = x0; x < x1 - h; x += h * 1.2) {
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y);
    ctx.lineTo(x + h * 0.9, y);
    ctx.lineTo(x + h * 0.9, y + h * 0.7);
    ctx.lineTo(x + h * 0.35, y + h * 0.7);
    ctx.lineTo(x + h * 0.35, y + h * 0.35);
  }
  ctx.stroke();
}

// Palco de pedra sobre o fosso, com colunas grossas descendo para o escuro
function stage(ctx, s, rand) {
  // pilares que seguram o palco, sumindo no fosso
  for (const px of [s.x + 60, s.x + s.w / 2 - 30, s.x + s.w - 120]) {
    const g = ctx.createLinearGradient(px, 0, px + 60, 0);
    g.addColorStop(0, STONE.deep);
    g.addColorStop(0.4, STONE.dark);
    g.addColorStop(1, STONE.shadow);
    ctx.fillStyle = g;
    ctx.fillRect(px, s.y + 60, 60, 900);
  }
  const fade = ctx.createLinearGradient(0, s.y + 150, 0, s.y + 420);
  fade.addColorStop(0, 'rgba(20,10,4,0)');
  fade.addColorStop(1, 'rgba(20,10,4,0.95)');
  ctx.fillStyle = fade;
  ctx.fillRect(s.x - 40, s.y + 150, s.w + 80, 900);
  // corpo do palco: blocos de pedra
  const h = 80;
  const body = ctx.createLinearGradient(0, s.y, 0, s.y + h);
  body.addColorStop(0, STONE.mid);
  body.addColorStop(1, STONE.dark);
  ctx.fillStyle = body;
  ctx.fillRect(s.x, s.y, s.w, h);
  ctx.strokeStyle = 'rgba(90,60,30,0.45)';
  ctx.lineWidth = 1.2;
  for (let row = 0; row < 3; row++) {
    const y = s.y + 22 + row * 20;
    ctx.beginPath();
    ctx.moveTo(s.x, y);
    ctx.lineTo(s.x + s.w, y);
    ctx.stroke();
    for (let x = s.x + (row % 2) * 30; x < s.x + s.w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 20);
      ctx.stroke();
    }
  }
  // faixa grega entalhada
  ctx.fillStyle = STONE.light;
  ctx.fillRect(s.x, s.y + 8, s.w, 14);
  meander(ctx, s.x + 6, s.x + s.w - 6, s.y + 10, 10);
  // manchas e rachaduras
  for (let i = 0; i < s.w / 40; i++) {
    ctx.fillStyle = 'rgba(110,80,40,0.2)';
    ctx.beginPath();
    ctx.ellipse(s.x + rand() * s.w, s.y + 30 + rand() * 45, 6 + rand() * 14, 3 + rand() * 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // borda de baixo do palco, com moldura
  ctx.fillStyle = STONE.light;
  ctx.fillRect(s.x - 8, s.y + h - 6, s.w + 16, 10);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(s.x, s.y, s.w, h);
  ctx.strokeRect(s.x - 8, s.y + h - 6, s.w + 16, 10);
  // chão de areia em cima
  const sand = ctx.createLinearGradient(0, s.y - 6, 0, s.y + 6);
  sand.addColorStop(0, '#f6e2b0');
  sand.addColorStop(1, '#d8b07a');
  ctx.fillStyle = sand;
  ctx.fillRect(s.x - 4, s.y - 5, s.w + 8, 10);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(s.x - 4, s.y - 5, s.w + 8, 10);
  ctx.fillStyle = 'rgba(160,110,60,0.5)';
  for (let i = 0; i < s.w / 6; i++) ctx.fillRect(s.x + rand() * s.w, s.y - 4 + rand() * 7, 1.5, 1.5);
}

// Coluna quebrada que vai do palco até a plataforma (o capitel é a plataforma)
function brokenColumn(ctx, p, floorY) {
  const cx = p.x + p.w / 2;
  const w = 34;
  const g = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
  g.addColorStop(0, STONE.dark);
  g.addColorStop(0.35, STONE.light);
  g.addColorStop(1, STONE.dark);
  ctx.fillStyle = g;
  ctx.fillRect(cx - w / 2, p.y + 12, w, floorY - p.y - 12);
  ctx.strokeStyle = 'rgba(110,80,40,0.55)';
  ctx.lineWidth = 1.5;
  for (let x = cx - w / 2 + 6; x < cx + w / 2; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, p.y + 14);
    ctx.lineTo(x, floorY - 4);
    ctx.stroke();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - w / 2, p.y + 12, w, floorY - p.y - 12);
  // base
  ctx.fillStyle = STONE.mid;
  ctx.fillRect(cx - w / 2 - 6, floorY - 10, w + 12, 10);
  ctx.strokeRect(cx - w / 2 - 6, floorY - 10, w + 12, 10);
}

// Plataforma de pedra (capitel com volutas, ou laje com estandarte)
function capital(ctx, p) {
  ctx.fillStyle = STONE.light;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  roundRect(ctx, p.x, p.y, p.w, 14, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = STONE.mid;
  ctx.beginPath();
  ctx.moveTo(p.x + 14, p.y + 14);
  ctx.lineTo(p.x + p.w - 14, p.y + 14);
  ctx.lineTo(p.x + p.w / 2 + 22, p.y + 24);
  ctx.lineTo(p.x + p.w / 2 - 22, p.y + 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // volutas (os caracóis do capitel)
  for (const side of [-1, 1]) {
    const vx = side < 0 ? p.x + 12 : p.x + p.w - 12;
    ctx.fillStyle = STONE.light;
    ctx.beginPath();
    ctx.arc(vx, p.y + 14, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = STONE.deep;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(vx, p.y + 14, 5, 0, Math.PI * 1.6);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
  }
  // lascas quebradas em cima
  ctx.fillStyle = 'rgba(110,80,40,0.35)';
  ctx.fillRect(p.x + p.w * 0.3, p.y + 2, 18, 3);
}

function slab(ctx, p) {
  ctx.fillStyle = STONE.light;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  roundRect(ctx, p.x, p.y, p.w, 16, 3);
  ctx.fill();
  ctx.stroke();
  meander(ctx, p.x + 6, p.x + p.w - 6, p.y + 4, 7);
  // correntes que seguram a laje lá de cima
  ctx.strokeStyle = '#4a4a52';
  ctx.lineWidth = 2;
  for (const cx of [p.x + 14, p.x + p.w - 14]) {
    for (let y = p.y; y > p.y - 400; y -= 8) {
      ctx.beginPath();
      ctx.ellipse(cx, y - 4, 2.5, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // estandarte vermelho com coroa de louros
  const cx = p.x + p.w / 2;
  ctx.fillStyle = '#a8202a';
  ctx.beginPath();
  ctx.moveTo(cx - 26, p.y + 16);
  ctx.lineTo(cx + 26, p.y + 16);
  ctx.lineTo(cx + 26, p.y + 76);
  ctx.lineTo(cx, p.y + 64);
  ctx.lineTo(cx - 26, p.y + 76);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, p.y + 40, 12, Math.PI * 0.75, Math.PI * 2.25);
  ctx.stroke();
  ctx.fillStyle = '#ffd23f';
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * 0.8 + i * 0.25;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * 12, p.y + 40 + Math.sin(a) * 12, 3, 1.4, a + 1.2, 0, Math.PI * 2);
    ctx.ellipse(cx - Math.cos(a) * 12, p.y + 40 + Math.sin(a) * 12, 3, 1.4, -a - 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Braseiro de bronze (o fogo é animado em `front`)
function brazier(ctx, x, y) {
  ctx.fillStyle = '#6a4a22';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.fillRect(x - 3, y - 46, 6, 46);
  ctx.strokeRect(x - 3, y - 46, 6, 46);
  ctx.fillStyle = '#b8862a';
  ctx.beginPath();
  ctx.moveTo(x - 18, y - 56);
  ctx.lineTo(x + 18, y - 56);
  ctx.lineTo(x + 10, y - 44);
  ctx.lineTo(x - 10, y - 44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8b84a';
  ctx.fillRect(x - 18, y - 58, 36, 3);
}

// Estátua de gladiador (escudo e espada) numa base
function statue(ctx, x, y, dir) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.fillStyle = STONE.mid;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.fillRect(-20, -16, 40, 16);
  ctx.strokeRect(-20, -16, 40, 16);
  ctx.fillStyle = '#cfc6b4';
  // pernas, corpo, cabeça com elmo
  ctx.fillRect(-8, -50, 6, 34);
  ctx.fillRect(3, -50, 6, 34);
  ctx.fillRect(-11, -84, 22, 36);
  ctx.beginPath();
  ctx.arc(0, -94, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b8b0a0';
  ctx.beginPath();
  ctx.moveTo(-9, -98);
  ctx.quadraticCurveTo(0, -116, 10, -100);
  ctx.lineTo(4, -100);
  ctx.closePath();
  ctx.fill();
  // escudo e espada erguida
  ctx.fillStyle = '#bfb6a4';
  ctx.beginPath();
  ctx.ellipse(-16, -66, 9, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(10, -104, 4, 30);
  ctx.fillRect(6, -76, 12, 3);
  ctx.strokeRect(-11, -84, 22, 36);
  ctx.restore();
}

// O palco e a laje do meio ficam no desenho fixo. Colunas, estátuas e
// braseiros são desenhados a cada quadro (em `front`) porque somem quando a
// morte súbita derruba o palco atrás das paredes de espinhos.
function drawTerrain(ctx, map, rand) {
  const floor = map.solids[0];
  stage(ctx, floor, rand);
  for (const p of map.platforms) if (p.y <= floor.y - 200) slab(ctx, p);
}

let WALLS = null;
const standing = (x) => !WALLS || (x > WALLS.left && x < WALLS.right);

// Fogo dos braseiros
function brazierFire(ctx, x, y, time) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(x, y - 62, 2, x, y - 62, 50);
  glow.addColorStop(0, 'rgba(255,170,60,0.45)');
  glow.addColorStop(1, 'rgba(255,120,30,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 50, y - 112, 100, 100);
  ctx.restore();
  for (let i = 0; i < 3; i++) {
    const f = Math.sin(time * 12 + i * 2) * 3;
    const h = 22 - i * 5 + f;
    ctx.fillStyle = ['#ff6a1f', '#ffa53a', '#ffe08a'][i];
    ctx.beginPath();
    ctx.moveTo(x - 14 + i * 4, y - 57);
    ctx.quadraticCurveTo(x - 10 + i * 3, y - 57 - h * 0.6, x + Math.sin(time * 7 + i) * 3, y - 57 - h);
    ctx.quadraticCurveTo(x + 10 - i * 3, y - 57 - h * 0.6, x + 14 - i * 4, y - 57);
    ctx.closePath();
    ctx.fill();
  }
}

export const COLISEU_ART = {
  sky: paintSky,
  skyAnimated,
  far: drawFar,
  farAnimated,
  mid: drawMid,
  midAnimated,
  terrain: drawTerrain,
  behind() {},
  // o renderer avisa onde estão as paredes de espinhos
  setWalls(walls) {
    WALLS = walls;
  },
  front(ctx, map, time) {
    const floor = map.solids[0];
    for (const p of map.platforms) {
      if (p.y <= floor.y - 200 || !standing(p.x + p.w / 2)) continue;
      brokenColumn(ctx, p, floor.y);
      capital(ctx, p);
    }
    for (const [x, dir] of [[floor.x + 26, 1], [floor.x + floor.w - 26, -1]]) if (standing(x)) statue(ctx, x, floor.y, dir);
    for (const [x, k] of [[floor.x + 70, 0], [floor.x + floor.w - 70, 1.3]]) {
      if (!standing(x)) continue;
      brazier(ctx, x, floor.y);
      brazierFire(ctx, x, floor.y, time + k);
    }
  },
  haze: ['rgba(255,180,120,0)', 'rgba(255,170,110,0.25)'],
  vignette: 0.35,
};
