// Cenário do Pico dos Ventos (protótipo): ilhas no céu ao entardecer.
//   céu: pôr do sol com sol grande, nuvens finas e pássaros voando
//   longe: banco de nuvens, ilhas-montanha com cachoeiras e o pico nevado
//   médio: torre com moinho gigante, santuário com faixas ao vento, pipa
//   mundo: mar de nuvens, ilhas gramadas, plataformas presas em balões
//
// Mesmo formato do cenário da Caldeira (ver CALDEIRA_ART em stage.js).

import { roundRect, glowSprite } from './stage-util.js';

const VIEW_W = 1280;
const VIEW_H = 720;
const SUN = { x: 930, y: 410, r: 70 };

const INK = '#2a1726';
const ROCK = { light: '#b88c8c', mid: '#8a6274', dark: '#553a52', deep: '#3a2640' };
const GRASS = { base: '#5fae55', light: '#9fdc6e', dark: '#3c7d44' };

// ======================================================================
// Céu

function paintSky(ctx, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, t.skyTop);
  sky.addColorStop(0.35, '#7d6cc0');
  sky.addColorStop(0.6, '#e98fa2');
  sky.addColorStop(0.82, t.skyBottom);
  sky.addColorStop(1, '#ffdca6');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // primeiras estrelas no alto (ainda está escurecendo)
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 40; i++) {
    ctx.globalAlpha = 0.15 + ((i * 7) % 10) / 30;
    ctx.fillRect((i * 331) % VIEW_W, (i * 97) % 160, 1.5, 1.5);
  }
  ctx.globalAlpha = 1;
  // brilho do sol e raios
  const glow = ctx.createRadialGradient(SUN.x, SUN.y, SUN.r * 0.6, SUN.x, SUN.y, 520);
  glow.addColorStop(0, 'rgba(255,236,190,0.75)');
  glow.addColorStop(0.3, 'rgba(255,190,140,0.3)');
  glow.addColorStop(1, 'rgba(255,160,140,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  ctx.translate(SUN.x, SUN.y);
  for (let i = 0; i < 10; i++) {
    ctx.rotate((Math.PI * 2) / 10);
    ctx.fillStyle = 'rgba(255,240,210,0.06)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(900, -50);
    ctx.lineTo(900, 50);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  const disc = ctx.createRadialGradient(SUN.x - 15, SUN.y - 15, 5, SUN.x, SUN.y, SUN.r);
  disc.addColorStop(0, '#fffbe8');
  disc.addColorStop(1, '#ffd38a');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(SUN.x, SUN.y, SUN.r, 0, Math.PI * 2);
  ctx.fill();
  // nuvens finas e compridas no alto
  for (const [x, y, w, a] of [[200, 120, 520, 0.35], [760, 70, 460, 0.3], [520, 190, 380, 0.25], [1080, 160, 360, 0.3]]) {
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, 'rgba(255,220,230,0)');
    g.addColorStop(0.5, `rgba(255,220,230,${a})`);
    g.addColorStop(1, 'rgba(255,220,230,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, 6, -0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 40, y + 12, w / 3, 4, -0.04, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Pássaros voando em bando devagar pelo céu
function skyAnimated(ctx, time) {
  ctx.strokeStyle = 'rgba(60,40,70,0.75)';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  const baseX = ((time * 26) % 1700) - 200;
  for (let i = 0; i < 6; i++) {
    const x = baseX - (i % 3) * 26 - Math.floor(i / 3) * 14;
    const y = 220 + (i % 3) * 14 + Math.floor(i / 3) * 20 + Math.sin(time * 1.5 + i) * 3;
    const flap = Math.sin(time * 9 + i * 1.3) * 4;
    ctx.beginPath();
    ctx.moveTo(x - 7, y - flap);
    ctx.quadraticCurveTo(x - 3, y - 2, x, y);
    ctx.quadraticCurveTo(x + 3, y - 2, x + 7, y - flap);
    ctx.stroke();
  }
}

// ======================================================================
// Nuvens: um banco de nuvens com o topo fofo, iluminado pelo sol

function cloudBank(ctx, y, x0, x1, size, body, light, shade, rand) {
  const puffs = [];
  for (let x = x0; x < x1; x += size * (0.7 + rand() * 0.5)) {
    puffs.push([x, y - rand() * size * 0.7, size * (0.6 + rand() * 0.6)]);
  }
  // corpo
  ctx.fillStyle = body;
  ctx.beginPath();
  for (const [px, py, r] of puffs) {
    ctx.moveTo(px + r, py);
    ctx.arc(px, py, r, 0, Math.PI * 2);
  }
  ctx.rect(x0 - size, y, x1 - x0 + size * 2, 1600);
  ctx.fill();
  // sombra embaixo de cada bolha
  ctx.fillStyle = shade;
  for (const [px, py, r] of puffs) {
    ctx.beginPath();
    ctx.ellipse(px, py + r * 0.55, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // luz do sol no topo
  ctx.fillStyle = light;
  for (const [px, py, r] of puffs) {
    ctx.beginPath();
    ctx.ellipse(px - r * 0.15, py - r * 0.45, r * 0.65, r * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Nuvem solta (para passar flutuando)
function cloudPuff(ctx, x, y, s, body, light) {
  ctx.fillStyle = body;
  ctx.beginPath();
  for (const [dx, dy, r] of [[-1.1, 0.15, 0.55], [-0.45, -0.2, 0.75], [0.35, -0.1, 0.7], [1.05, 0.2, 0.5], [0, 0.25, 0.6]]) {
    ctx.moveTo(x + dx * s + r * s, y + dy * s);
    ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.ellipse(x - 0.4 * s, y - 0.55 * s, 0.55 * s, 0.25 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ======================================================================
// Fundo distante

function drawFar(ctx, map, rand) {
  // o pico nevado, com o templo do vento lá em cima
  ctx.fillStyle = '#7a6aa6';
  ctx.beginPath();
  ctx.moveTo(-200, 700);
  ctx.lineTo(80, 260);
  ctx.lineTo(150, 170);
  ctx.lineTo(200, 60);
  ctx.lineTo(250, 160);
  ctx.lineTo(330, 240);
  ctx.lineTo(560, 700);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,200,190,0.35)';
  ctx.beginPath();
  ctx.moveTo(200, 60);
  ctx.lineTo(250, 160);
  ctx.lineTo(330, 240);
  ctx.lineTo(560, 700);
  ctx.lineTo(380, 700);
  ctx.lineTo(260, 260);
  ctx.closePath();
  ctx.fill();
  // neve
  ctx.fillStyle = '#fbeef2';
  ctx.beginPath();
  ctx.moveTo(150, 170);
  ctx.lineTo(200, 60);
  ctx.lineTo(250, 160);
  ctx.lineTo(228, 150);
  ctx.lineTo(214, 172);
  ctx.lineTo(196, 146);
  ctx.lineTo(176, 178);
  ctx.closePath();
  ctx.fill();
  // templo no topo: telhado curvo e pilares
  ctx.fillStyle = '#4b3a6e';
  ctx.fillRect(186, 40, 4, 18);
  ctx.fillRect(210, 40, 4, 18);
  ctx.beginPath();
  ctx.moveTo(176, 42);
  ctx.quadraticCurveTo(200, 26, 224, 42);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(191,233,225,0.9)';
  ctx.beginPath();
  ctx.arc(200, 50, 3, 0, Math.PI * 2);
  ctx.fill();
  // espiral de vento em volta do pico
  ctx.strokeStyle = 'rgba(235,250,255,0.45)';
  ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.ellipse(200, 120 + k * 60, 60 + k * 40, 12 + k * 4, -0.1, Math.PI * 0.1, Math.PI * 1.25);
    ctx.stroke();
  }

  // ilhas-montanha distantes, com cachoeiras caindo nas nuvens
  for (const [x, y, s] of [[700, 300, 60], [1150, 260, 80], [1500, 330, 50], [-420, 300, 70]]) {
    ctx.fillStyle = '#8e7cb3';
    ctx.beginPath();
    ctx.moveTo(x - s * 1.2, y);
    ctx.lineTo(x - s * 0.4, y - s * 1.1);
    ctx.lineTo(x, y - s * 0.7);
    ctx.lineTo(x + s * 0.5, y - s * 1.4);
    ctx.lineTo(x + s * 1.2, y);
    ctx.lineTo(x + s * 0.4, y + s * 0.9);
    ctx.lineTo(x - s * 0.3, y + s * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,215,200,0.4)';
    ctx.beginPath();
    ctx.moveTo(x + s * 0.5, y - s * 1.4);
    ctx.lineTo(x + s * 1.2, y);
    ctx.lineTo(x + s * 0.6, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(120,170,110,0.7)';
    ctx.fillRect(x - s * 1.2, y - 3, s * 2.4, 4);
    ctx.fillStyle = 'rgba(240,250,255,0.6)';
    ctx.fillRect(x + s * 0.2, y + 2, 3, 260);
  }

  // banco de nuvens no horizonte
  cloudBank(ctx, 520, -760, 2040, 70, '#f3c7c9', 'rgba(255,240,215,0.85)', 'rgba(190,150,190,0.35)', rand);
}

function farAnimated(ctx, time) {
  // nuvens soltas passando devagar
  for (let i = 0; i < 4; i++) {
    const x = ((time * (8 + i * 3) + i * 600) % 2600) - 700;
    cloudPuff(ctx, x, 330 + (i % 2) * 90, 34 + i * 6, 'rgba(255,225,225,0.7)', 'rgba(255,245,230,0.8)');
  }
}

// ======================================================================
// Fundo médio

const MILL = { x: -60, y: 600, h: 290 };
const SHRINE = { x: 1340, y: 560 };

function drawMid(ctx, map, rand) {
  // nuvens mais perto, rosadas
  cloudBank(ctx, 640, -560, 1840, 90, '#eab4c2', 'rgba(255,236,220,0.9)', 'rgba(170,120,170,0.35)', rand);

  // ilha da torre do moinho (esquerda)
  midIsland(ctx, MILL.x, MILL.y, 150, rand);
  const tg = ctx.createLinearGradient(MILL.x - 34, 0, MILL.x + 34, 0);
  tg.addColorStop(0, '#c9a3a3');
  tg.addColorStop(0.45, '#9a7488');
  tg.addColorStop(1, '#6d4e66');
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(MILL.x - 40, MILL.y);
  ctx.lineTo(MILL.x - 26, MILL.y - MILL.h);
  ctx.lineTo(MILL.x + 26, MILL.y - MILL.h);
  ctx.lineTo(MILL.x + 40, MILL.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,35,60,0.35)';
  ctx.lineWidth = 2;
  for (let y = MILL.y - 30; y > MILL.y - MILL.h; y -= 34) {
    ctx.beginPath();
    ctx.moveTo(MILL.x - 40 + (MILL.y - y) * 0.048, y);
    ctx.lineTo(MILL.x + 40 - (MILL.y - y) * 0.048, y);
    ctx.stroke();
  }
  // janelas acesas e porta
  ctx.fillStyle = '#ffd79a';
  for (const y of [MILL.y - 90, MILL.y - 170]) roundRect(ctx, MILL.x - 6, y, 12, 18, 6), ctx.fill();
  ctx.fillStyle = '#4a2f3e';
  roundRect(ctx, MILL.x - 10, MILL.y - 34, 20, 34, 9);
  ctx.fill();
  // telhado
  ctx.fillStyle = '#4f7fa8';
  ctx.beginPath();
  ctx.moveTo(MILL.x - 40, MILL.y - MILL.h + 4);
  ctx.quadraticCurveTo(MILL.x, MILL.y - MILL.h - 70, MILL.x + 40, MILL.y - MILL.h + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(MILL.x - 40, MILL.y - MILL.h + 4);
  ctx.quadraticCurveTo(MILL.x - 10, MILL.y - MILL.h - 60, MILL.x, MILL.y - MILL.h - 30);
  ctx.lineTo(MILL.x - 18, MILL.y - MILL.h + 4);
  ctx.closePath();
  ctx.fill();

  // ponte de corda até uma pedrinha
  midIsland(ctx, 150, 520, 50, rand);
  ctx.strokeStyle = '#6b4a3e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MILL.x + 60, MILL.y - 8);
  ctx.quadraticCurveTo(60, 590, 120, 518);
  ctx.stroke();
  for (let k = 1; k < 10; k++) {
    const u = k / 10;
    const x = (1 - u) * (1 - u) * (MILL.x + 60) + 2 * (1 - u) * u * 60 + u * u * 120;
    const y = (1 - u) * (1 - u) * (MILL.y - 8) + 2 * (1 - u) * u * 590 + u * u * 518;
    ctx.fillStyle = '#9a6d52';
    ctx.fillRect(x - 3, y - 1, 6, 4);
  }

  // ilha do santuário (direita): telhado de dois andares
  midIsland(ctx, SHRINE.x, SHRINE.y, 130, rand);
  ctx.fillStyle = '#c99a9a';
  ctx.fillRect(SHRINE.x - 44, SHRINE.y - 70, 88, 70);
  ctx.fillStyle = '#ffd79a';
  roundRect(ctx, SHRINE.x - 14, SHRINE.y - 50, 28, 50, 12);
  ctx.fill();
  for (const [w, y, h] of [[130, SHRINE.y - 70, 24], [96, SHRINE.y - 118, 22]]) {
    ctx.fillStyle = '#3f6f99';
    ctx.beginPath();
    ctx.moveTo(SHRINE.x - w / 2 - 14, y + 4);
    ctx.quadraticCurveTo(SHRINE.x - w / 2, y - 4, SHRINE.x - w / 3, y - h);
    ctx.lineTo(SHRINE.x + w / 3, y - h);
    ctx.quadraticCurveTo(SHRINE.x + w / 2, y - 4, SHRINE.x + w / 2 + 14, y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(SHRINE.x - w / 3, y - h, w / 1.5, 4);
  }
  ctx.fillStyle = '#c99a9a';
  ctx.fillRect(SHRINE.x - 30, SHRINE.y - 118, 60, 26);
  // mastro das faixas
  ctx.fillStyle = '#6b4a3e';
  ctx.fillRect(SHRINE.x - 80, SHRINE.y - 190, 5, 190);

  // mar de nuvens bem embaixo, na largura toda
  cloudBank(ctx, 860, -560, 1840, 110, '#f7d3d0', 'rgba(255,246,228,0.95)', 'rgba(190,140,180,0.3)', rand);
}

function midIsland(ctx, x, y, w, rand) {
  ctx.fillStyle = ROCK.mid;
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w * 0.7, y + w * 0.35);
  ctx.lineTo(x + w * 0.25, y + w * (0.9 + rand() * 0.3));
  ctx.lineTo(x - w * 0.2, y + w * 0.7);
  ctx.lineTo(x - w * 0.7, y + w * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,210,190,0.25)';
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w * 0.7, y + w * 0.35);
  ctx.lineTo(x + w * 0.25, y + w);
  ctx.lineTo(x + w * 0.4, y + w * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = GRASS.dark;
  ctx.fillRect(x - w, y - 4, w * 2, 8);
  ctx.fillStyle = GRASS.base;
  ctx.fillRect(x - w, y - 6, w * 2, 4);
}

function midAnimated(ctx, time) {
  // pás do moinho girando
  ctx.save();
  ctx.translate(MILL.x, MILL.y - MILL.h + 40);
  ctx.rotate(time * 0.8);
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#7a5440';
    ctx.fillRect(-3, 0, 6, 120);
    ctx.fillStyle = '#f4e6d4';
    ctx.fillRect(4, 20, 26, 96);
    ctx.strokeStyle = 'rgba(120,80,60,0.6)';
    ctx.lineWidth = 1;
    for (let k = 32; k < 116; k += 14) {
      ctx.beginPath();
      ctx.moveTo(4, k);
      ctx.lineTo(30, k);
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#5a3b2e';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // faixas compridas ao vento no santuário
  const px = SHRINE.x - 75;
  for (const [y, color, len] of [[SHRINE.y - 186, '#bfe9e1', 150], [SHRINE.y - 160, '#ffffff', 120], [SHRINE.y - 134, '#7fd0ff', 100]]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(px, y);
    for (let x = 0; x <= len; x += 10) ctx.lineTo(px + x, y + Math.sin(x * 0.06 - time * 5) * (x * 0.08));
    for (let x = len; x >= 0; x -= 10) ctx.lineTo(px + x, y + 12 - x * 0.04 + Math.sin(x * 0.06 - time * 5) * (x * 0.08));
    ctx.closePath();
    ctx.fill();
  }

  // pipa no céu, balançando, com rabo
  const kx = 980 + Math.sin(time * 0.7) * 30;
  const ky = 120 + Math.sin(time * 1.1) * 14;
  ctx.strokeStyle = 'rgba(80,50,60,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(kx, ky + 26);
  ctx.quadraticCurveTo(kx + 120, ky + 240, SHRINE.x - 40, SHRINE.y - 60);
  ctx.stroke();
  ctx.fillStyle = '#ff7a8a';
  ctx.beginPath();
  ctx.moveTo(kx, ky - 22);
  ctx.lineTo(kx + 16, ky);
  ctx.lineTo(kx, ky + 26);
  ctx.lineTo(kx - 16, ky);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd25a';
  ctx.beginPath();
  ctx.moveTo(kx, ky - 22);
  ctx.lineTo(kx + 16, ky);
  ctx.lineTo(kx, ky);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ff7a8a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(kx, ky + 26);
  for (let k = 1; k < 6; k++) ctx.lineTo(kx + Math.sin(time * 4 + k) * 6, ky + 26 + k * 10);
  ctx.stroke();
}

// ======================================================================
// Mundo: ilhas, plataformas e enfeites

function drawTerrain(ctx, map, rand) {
  // balões parados no céu (as plataformas balançam penduradas neles e são
  // desenhadas a cada quadro, em hangingPlatforms)
  for (const p of map.platforms) balloon(ctx, p);

  // ilhas
  const islands = islandsOf(map);
  for (const isl of islands) drawIsland(ctx, isl, map, rand);

  for (const d of map.decor ?? []) decorStatic(ctx, d);
}

// Ponto onde as cordas se prendem no balão (cesto), fixo no céu
function anchorOf(p) {
  return { x: p.x + p.w / 2, y: p.y - (p.swing?.length ?? 120) };
}

// Cordas e plataformas na posição atual (`plats` vem do jogo; `alpha` suaviza
// entre um passo de simulação e outro)
function hangingPlatforms(ctx, map, plats, alpha) {
  map.platforms.forEach((base, i) => {
    const cur = plats?.[i];
    const x = cur ? cur.px + (cur.x - cur.px) * alpha : base.x;
    const y = cur ? cur.py + (cur.y - cur.py) * alpha : base.y;
    const a = anchorOf(base);
    ctx.strokeStyle = '#6b4a3e';
    ctx.lineWidth = 1.8;
    for (const [ax, px] of [[a.x - 9, x + 10], [a.x + 9, x + base.w - 10]]) {
      ctx.beginPath();
      ctx.moveTo(ax, a.y);
      ctx.lineTo(px, y);
      ctx.stroke();
    }
    woodPlatform(ctx, { x, y, w: base.w });
  });
}

// Junta os blocos sólidos que se encostam numa ilha só
function islandsOf(map) {
  const top = (s) => s.y;
  const sorted = [...map.solids].sort((a, b) => a.x - b.x);
  const out = [];
  for (const s of sorted) {
    const last = out[out.length - 1];
    if (last && s.x <= last.x + last.w + 1) {
      last.w = Math.max(last.w, s.x + s.w - last.x);
      last.y = Math.min(last.y, top(s));
      last.bottom = Math.max(last.bottom, s.y + s.h);
    } else {
      out.push({ x: s.x, y: s.y, w: s.w, bottom: s.y + s.h });
    }
  }
  return out;
}

function drawIsland(ctx, isl, map, rand) {
  const { x, y, w, bottom } = isl;
  const tip = bottom + w * 0.35 + 30;
  // corpo de pedra afinando para baixo
  const body = new Path2D();
  body.moveTo(x, y);
  body.lineTo(x + w, y);
  body.lineTo(x + w, bottom - 10);
  const n = 7;
  for (let i = 1; i < n; i++) {
    const u = 1 - i / n;
    const px = x + w * u;
    const depth = Math.sin(Math.PI * u) * (tip - bottom) + (rand() - 0.5) * 12;
    body.lineTo(px, bottom - 10 + depth);
  }
  body.lineTo(x, bottom - 10);
  body.closePath();
  const g = ctx.createLinearGradient(0, y, 0, tip);
  g.addColorStop(0, ROCK.light);
  g.addColorStop(0.35, ROCK.mid);
  g.addColorStop(1, ROCK.deep);
  ctx.fillStyle = g;
  ctx.fill(body);
  ctx.save();
  ctx.clip(body);
  // camadas de terra
  ctx.strokeStyle = 'rgba(60,30,50,0.3)';
  ctx.lineWidth = 3;
  for (let yy = y + 30; yy < tip; yy += 26 + rand() * 12) {
    ctx.beginPath();
    ctx.moveTo(x, yy);
    for (let xx = x; xx <= x + w; xx += 40) ctx.lineTo(xx, yy + Math.sin(xx * 0.05) * 4);
    ctx.stroke();
  }
  // luz do sol pelo lado direito
  const sun = ctx.createLinearGradient(x, 0, x + w, 0);
  sun.addColorStop(0, 'rgba(40,20,50,0.25)');
  sun.addColorStop(0.6, 'rgba(255,200,170,0)');
  sun.addColorStop(1, 'rgba(255,200,170,0.3)');
  ctx.fillStyle = sun;
  ctx.fillRect(x, y, w, tip - y);
  // pedrinhas
  for (let i = 0; i < w / 30; i++) {
    const px = x + rand() * w;
    const py = y + 24 + rand() * (bottom - y);
    ctx.fillStyle = 'rgba(60,30,50,0.3)';
    ctx.beginPath();
    ctx.ellipse(px, py, 5 + rand() * 6, 3 + rand() * 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke(body);

  // cristais de vento e raízes pendurados embaixo
  for (let i = 0; i < Math.max(2, Math.round(w / 140)); i++) {
    const cx = x + w * (0.25 + 0.5 * (i / Math.max(1, Math.round(w / 140) - 1 || 1)));
    const cy = bottom - 10 + Math.sin(Math.PI * ((cx - x) / w)) * (tip - bottom) - 8;
    windCrystal(ctx, cx, cy, 8 + rand() * 6, 24 + rand() * 18);
  }
  ctx.strokeStyle = '#4a6b3a';
  ctx.lineWidth = 2;
  for (let i = 0; i < w / 60; i++) {
    const rx = x + 10 + rand() * (w - 20);
    const ry = bottom - 10 + Math.sin(Math.PI * ((rx - x) / w)) * (tip - bottom) * 0.8;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.bezierCurveTo(rx + 8, ry + 20, rx - 8, ry + 36, rx + 2, ry + 50 + rand() * 30);
    ctx.stroke();
  }

  // grama em cima com tufos caindo pelas bordas
  const gaps = map.hazards.filter((h) => (h.type === 'agua' || h.type === 'lava') && h.x >= x && h.x < x + w);
  const inGap = (px) => gaps.some((h) => px > h.x && px < h.x + h.w);
  ctx.fillStyle = GRASS.dark;
  ctx.fillRect(x - 3, y, w + 6, 12);
  ctx.fillStyle = GRASS.base;
  ctx.fillRect(x - 3, y - 2, w + 6, 8);
  ctx.fillStyle = GRASS.light;
  ctx.fillRect(x - 3, y - 2, w + 6, 2.5);
  for (let px = x - 2; px < x + w + 2; px += 6 + rand() * 6) {
    if (inGap(px)) continue;
    ctx.strokeStyle = rand() < 0.5 ? GRASS.light : GRASS.base;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.quadraticCurveTo(px + 2, y - 5, px + 3 - rand() * 6, y - 8 - rand() * 6);
    ctx.stroke();
  }
  for (const ex of [x, x + w]) {
    ctx.fillStyle = GRASS.base;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.ellipse(ex + (ex === x ? -2 : 2), y + 8 + k * 9, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // florzinhas
  for (let i = 0; i < w / 50; i++) {
    const fx = x + 10 + rand() * (w - 20);
    if (inGap(fx)) continue;
    ctx.fillStyle = rand() < 0.5 ? '#ffffff' : '#ffb3c8';
    ctx.beginPath();
    ctx.arc(fx, y - 4, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // fundo do lago com pedra escura
  for (const h of gaps) {
    ctx.fillStyle = '#3a2a40';
    ctx.fillRect(h.x, y, h.w, h.y + h.h - y);
  }
}

function windCrystal(ctx, x, y, w, h) {
  ctx.fillStyle = '#9fe0d6';
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8fffb';
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x - w * 0.2, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w, y);
  ctx.stroke();
}

// Plataforma de tábuas, presa por cordas a um balão
function balloon(ctx, p) {
  const a = anchorOf(p);
  const cx = a.x;
  const by = a.y - 46;
  // balão listrado
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, by, 34, 40, 0, 0, Math.PI * 2);
  ctx.clip();
  for (let i = -3; i <= 3; i++) {
    ctx.fillStyle = i % 2 ? '#7fd0c6' : '#fff2df';
    ctx.fillRect(cx + i * 10 - 5, by - 42, 10, 84);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx - 12, by - 14, 8, 16, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(80,40,80,0.25)';
  ctx.fillRect(cx + 14, by - 42, 30, 84);
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(cx, by, 34, 40, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#8a5a3e';
  roundRect(ctx, cx - 10, by + 38, 20, 8, 3);
  ctx.fill();
}

function woodPlatform(ctx, p) {
  const h = 14;
  ctx.fillStyle = 'rgba(40,20,40,0.25)';
  ctx.fillRect(p.x + 6, p.y + h, p.w - 12, 6);
  ctx.fillStyle = '#b07a52';
  roundRect(ctx, p.x, p.y, p.w, h, 4);
  ctx.fill();
  ctx.fillStyle = '#d29a6a';
  ctx.fillRect(p.x + 3, p.y + 1.5, p.w - 6, 3);
  // tábuas e pregos
  ctx.fillStyle = 'rgba(70,40,30,0.55)';
  for (let x = p.x + 26; x < p.x + p.w - 6; x += 26) ctx.fillRect(x, p.y + 2, 2, h - 3);
  ctx.fillStyle = '#5a3b2e';
  for (let x = p.x + 12; x < p.x + p.w; x += 26) {
    ctx.fillRect(x, p.y + 5, 2, 2);
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  roundRect(ctx, p.x, p.y, p.w, h, 4);
  ctx.stroke();
  // fitinhas penduradas
  for (const [fx, color] of [[p.x + 16, '#7fd0c6'], [p.x + p.w - 16, '#ff9fb0']]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(fx - 4, p.y + h);
    ctx.lineTo(fx + 4, p.y + h);
    ctx.lineTo(fx + 2, p.y + h + 18);
    ctx.lineTo(fx - 1, p.y + h + 12);
    ctx.closePath();
    ctx.fill();
  }
}

function decorStatic(ctx, d) {
  switch (d.type) {
    case 'arvore': {
      ctx.fillStyle = '#6b4a3e';
      ctx.fillRect(d.x - 4, d.y - 44, 8, 44);
      for (const [dx, dy, r, c] of [[-14, -50, 18, '#3c7d44'], [12, -56, 20, '#4f9a4f'], [-2, -72, 20, '#5fae55'], [0, -54, 14, '#9fdc6e']]) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(d.x + dx, d.y + dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'bandeira':
      ctx.fillStyle = '#6b4a3e';
      ctx.fillRect(d.x - 2, d.y - 70, 4, 70);
      ctx.fillStyle = '#e8d6b0';
      ctx.beginPath();
      ctx.arc(d.x, d.y - 72, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'moinho':
      ctx.fillStyle = '#c99a9a';
      ctx.beginPath();
      ctx.moveTo(d.x - 12, d.y);
      ctx.lineTo(d.x - 8, d.y - 46);
      ctx.lineTo(d.x + 8, d.y - 46);
      ctx.lineTo(d.x + 12, d.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#4f7fa8';
      ctx.beginPath();
      ctx.moveTo(d.x - 12, d.y - 44);
      ctx.lineTo(d.x, d.y - 60);
      ctx.lineTo(d.x + 12, d.y - 44);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    case 'santuario':
      // pedra baixa com o símbolo do Ar
      ctx.fillStyle = '#c4a6b0';
      roundRect(ctx, d.x - 16, d.y - 22, 32, 22, 6);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = '#4fb8a8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const dy of [-16, -11, -6]) {
        ctx.moveTo(d.x - 8, d.y + dy);
        ctx.quadraticCurveTo(d.x, d.y + dy - 4, d.x + 8, d.y + dy);
      }
      ctx.stroke();
      break;
    default:
      break;
  }
}

function decorAnimated(ctx, d, time) {
  switch (d.type) {
    case 'bandeira': {
      // flâmula balançando ao vento
      ctx.fillStyle = d.x < 640 ? '#7fd0c6' : '#ff9fb0';
      ctx.beginPath();
      ctx.moveTo(d.x + 2, d.y - 68);
      for (let x = 0; x <= 40; x += 5) ctx.lineTo(d.x + 2 + x, d.y - 68 + Math.sin(x * 0.15 - time * 7) * (x * 0.12));
      for (let x = 40; x >= 0; x -= 5) ctx.lineTo(d.x + 2 + x, d.y - 52 - x * 0.2 + Math.sin(x * 0.15 - time * 7) * (x * 0.12));
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'moinho': {
      ctx.save();
      ctx.translate(d.x, d.y - 40);
      ctx.rotate(time * 2.4);
      ctx.fillStyle = '#f4e6d4';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.rect(2, 4, 8, 26);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'santuario': {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35 + Math.sin(time * 2) * 0.15;
      ctx.drawImage(glowSprite('120,230,210'), d.x - 40, d.y - 52, 80, 60);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    default:
      break;
  }
}

// ======================================================================

export const PICO_ART = {
  sky: paintSky,
  skyAnimated,
  far: drawFar,
  farAnimated,
  mid: drawMid,
  midAnimated,
  terrain: drawTerrain,
  // nuvens passando embaixo das ilhas
  behind(ctx, map, time) {
    for (let i = 0; i < 3; i++) {
      const x = ((time * (12 + i * 5) + i * 520) % 1900) - 300;
      cloudPuff(ctx, x, 720 + i * 40, 46 + i * 10, 'rgba(255,236,232,0.85)', 'rgba(255,250,240,0.9)');
    }
  },
  front(ctx, map, time, plats, alpha) {
    hangingPlatforms(ctx, map, plats, alpha);
    for (const d of map.decor ?? []) decorAnimated(ctx, d, time);
  },
  haze: ['rgba(255,214,168,0)', 'rgba(255,214,190,0.35)'],
};
