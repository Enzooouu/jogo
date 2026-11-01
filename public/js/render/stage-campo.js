// Fundo do Campo Aberto: fim de tarde dourado no interior.
//
//   céu      azul em cima indo para pêssego no horizonte, sol baixo e quente,
//            nuvens douradas, um balão de ar quente e passarinhos
//   longe    montanhas azuladas, morros com retalhos de plantação (trigo,
//            lavanda, terra arada) separados por cercas vivas, uma vilinha
//            com igreja e um rio fazendo curvas
//   meio     moinho de vento girando, fardos de feno, vacas e ovelhas,
//            papoulas, estradinha de terra e sementes de dente-de-leão no ar
//
// O campo (ilhas, ponte quebrada, plataforma) é o mesmo do Campo de Treino:
// só o fundo muda (o tutorial continua com o fundo dele).

import { seeded } from './stage-util.js';
import { TREINO_ART, cloudSprite, oak, pine, sheep } from './stage-treino.js';

const VIEW_W = 1280;
const VIEW_H = 720;
const SUN = { x: 990, y: 215, r: 46 };

// ================================================================ céu

function paintSky(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, '#2b5aa8');
  sky.addColorStop(0.3, '#5487cc');
  sky.addColorStop(0.55, '#9dbde3');
  sky.addColorStop(0.75, '#f0d6b8');
  sky.addColorStop(0.9, '#ffd49a');
  sky.addColorStop(1, '#ffe2b4');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // luz quente do sol espalhada no céu
  for (const [r, a, c] of [[620, 0.42, '255,206,140'], [240, 0.55, '255,236,190'], [110, 0.7, '255,248,225']]) {
    const g = ctx.createRadialGradient(SUN.x, SUN.y, SUN.r * 0.5, SUN.x, SUN.y, r);
    g.addColorStop(0, `rgba(${c},${a})`);
    g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(SUN.x - r, SUN.y - r, r * 2, r * 2);
  }
  // cirros rosados bem no alto
  const rand = seeded(23);
  for (let i = 0; i < 9; i++) {
    const x = rand() * VIEW_W;
    const y = 30 + rand() * 190;
    const w = 180 + rand() * 280;
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, 'rgba(255,220,220,0)');
    g.addColorStop(0.5, `rgba(255,228,226,${0.2 + rand() * 0.2})`);
    g.addColorStop(1, 'rgba(255,220,220,0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.08 + rand() * 0.05);
    ctx.beginPath();
    ctx.ellipse(0, 0, w / 2, 2.5 + rand() * 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // disco do sol
  const disc = ctx.createRadialGradient(SUN.x - 12, SUN.y - 12, 4, SUN.x, SUN.y, SUN.r);
  disc.addColorStop(0, '#fffdf4');
  disc.addColorStop(0.6, '#fff1c8');
  disc.addColorStop(1, '#ffd27a');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(SUN.x, SUN.y, SUN.r, 0, Math.PI * 2);
  ctx.fill();
  // faixa de bruma dourada no horizonte
  const low = ctx.createLinearGradient(0, 300, 0, 420);
  low.addColorStop(0, 'rgba(255,226,180,0)');
  low.addColorStop(1, 'rgba(255,226,180,0.55)');
  ctx.fillStyle = low;
  ctx.fillRect(0, 300, VIEW_W, 420);
}

// nuvens douradas: as nuvens fofas do treino com a barriga alaranjada
const warmClouds = new Map();
function warmCloud(seed) {
  if (warmClouds.has(seed)) return warmClouds.get(seed);
  const base = cloudSprite(seed);
  const c = document.createElement('canvas');
  c.width = base.width;
  c.height = base.height;
  const x = c.getContext('2d');
  x.drawImage(base, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  const g = x.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, 'rgba(255,246,230,0.1)');
  g.addColorStop(0.55, 'rgba(255,214,170,0.3)');
  g.addColorStop(0.8, 'rgba(240,150,120,0.42)');
  g.addColorStop(1, 'rgba(200,130,150,0.5)');
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  // borda iluminada do lado do sol (direita)
  const r = x.createLinearGradient(c.width * 0.5, 0, c.width, 0);
  r.addColorStop(0, 'rgba(255,240,200,0)');
  r.addColorStop(1, 'rgba(255,236,190,0.35)');
  x.fillStyle = r;
  x.fillRect(0, 0, c.width, c.height);
  warmClouds.set(seed, c);
  return c;
}

const CLOUDS = [
  // x inicial, y, tamanho, velocidade, formato
  [40, 60, 0.8, 4.5, 1], [470, 120, 0.55, 3.2, 2], [820, 36, 0.62, 4, 3],
  [1180, 140, 0.9, 5.5, 4], [260, 200, 0.42, 2.4, 5], [700, 245, 0.38, 2, 6],
];

function balloon(ctx, x, y) {
  // cestinho e cordas
  ctx.strokeStyle = 'rgba(70,45,30,0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 11, y + 14);
  ctx.lineTo(x - 5, y + 36);
  ctx.moveTo(x + 11, y + 14);
  ctx.lineTo(x + 5, y + 36);
  ctx.stroke();
  ctx.fillStyle = '#8a5a32';
  ctx.fillRect(x - 6, y + 35, 12, 8);
  // balão listrado
  const colors = ['#e2483a', '#ffd166', '#e2483a', '#ffd166', '#e2483a'];
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - 12, y + 16);
  ctx.bezierCurveTo(x - 30, y - 2, x - 26, y - 34, x, y - 34);
  ctx.bezierCurveTo(x + 26, y - 34, x + 30, y - 2, x + 12, y + 16);
  ctx.closePath();
  ctx.clip();
  colors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(x - 30 + i * 12, y - 36, 12, 54);
  });
  const shade = ctx.createLinearGradient(x - 28, 0, x + 28, 0);
  shade.addColorStop(0, 'rgba(60,20,40,0.35)');
  shade.addColorStop(0.6, 'rgba(255,255,255,0)');
  shade.addColorStop(1, 'rgba(255,240,200,0.3)');
  ctx.fillStyle = shade;
  ctx.fillRect(x - 30, y - 36, 60, 54);
  ctx.restore();
}

function skyAnimated(ctx, time) {
  // raios do sol bem fracos, girando devagar
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(SUN.x, SUN.y);
  ctx.rotate(time * 0.012);
  const rays = ctx.createRadialGradient(0, 0, SUN.r, 0, 0, 700);
  rays.addColorStop(0, 'rgba(255,224,170,0.08)');
  rays.addColorStop(1, 'rgba(255,224,170,0)');
  ctx.fillStyle = rays;
  ctx.beginPath();
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const w = i % 2 ? 0.04 : 0.08;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a - w) * 700, Math.sin(a - w) * 700);
    ctx.lineTo(Math.cos(a + w) * 700, Math.sin(a + w) * 700);
    ctx.closePath();
  }
  ctx.fill();
  ctx.restore();
  // balão de ar quente atravessando o céu bem devagar
  const bx = ((time * 7 + 300) % 1700) - 200;
  balloon(ctx, bx, 175 + Math.sin(time * 0.5) * 6);
  for (const [x0, y, s, v, seed] of CLOUDS) {
    const w = 320 * s;
    const x = ((x0 + time * v) % (VIEW_W + w + 100)) - w - 50 + 100;
    ctx.drawImage(warmCloud(seed), x, y, w, 150 * s);
  }
}

// ================================================================ fundo distante

const FAR_HILL = (x) => 420 - Math.sin(x * 0.0035 + 0.4) * 30 - Math.sin(x * 0.009 + 2) * 10;
const FAR_HILL2 = (x) => 448 - Math.sin(x * 0.0042 + 2.6) * 26 - Math.sin(x * 0.011 + 1) * 8;

// Cordilheira de verdade: contorno feito por "deslocamento do ponto do
// meio" (cada pedaço ganha um desvio aleatório, cada vez menor), com vários
// picos, ombros e vales. Sombra no lado esquerdo de cada pico (o sol está à
// direita), riscos de rocha no lado claro e neve só nos picos altos.
function ridgeLine(anchors, rand, rough) {
  let pts = anchors.map(([x, y]) => [x, y]);
  for (let level = 0; level < 6; level++) {
    const next = [pts[0]];
    for (let k = 1; k < pts.length; k++) {
      const [ax, ay] = pts[k - 1];
      const [bx, by] = pts[k];
      const len = bx - ax;
      next.push([(ax + bx) / 2 + (rand() - 0.5) * len * 0.15, (ay + by) / 2 + (rand() - 0.5) * len * rough], [bx, by]);
    }
    pts = next;
  }
  return pts;
}

function range(ctx, base, anchors, tone, rand, snowY = null, rough = 0.32) {
  const pts = ridgeLine(anchors, rand, rough);
  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], 1400);
    for (const [x, y] of pts) ctx.lineTo(x, y);
    ctx.lineTo(pts[pts.length - 1][0], 1400);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, base - 260, 0, base + 40);
  g.addColorStop(0, tone.top);
  g.addColorStop(1, tone.bottom);
  ctx.fillStyle = g;
  outline();
  ctx.fill();
  ctx.save();
  outline();
  ctx.clip();
  // picos e vales do contorno
  const peaks = [];
  for (let k = 1; k < pts.length - 1; k++) {
    const y = pts[k][1];
    if (y < pts[k - 1][1] && y <= pts[k + 1][1]) peaks.push(k);
  }
  // sombra: do vale à esquerda até o pico, descendo em diagonal
  ctx.fillStyle = tone.shade;
  for (const p of peaks) {
    let v = p - 1;
    while (v > 0 && pts[v - 1][1] > pts[v][1]) v--;
    const [px, py] = pts[p];
    const [vx] = pts[v];
    if (base - py < 30) continue;
    ctx.beginPath();
    ctx.moveTo(pts[v][0], pts[v][1]);
    for (let k = v; k <= p; k++) ctx.lineTo(pts[k][0], pts[k][1]);
    ctx.lineTo(px + (base - py) * 0.18, base + 40);
    ctx.lineTo(vx, base + 40);
    ctx.closePath();
    ctx.fill();
  }
  // riscos de rocha descendo no lado claro
  ctx.strokeStyle = tone.line;
  ctx.lineWidth = 1.2;
  for (const p of peaks) {
    const [px, py] = pts[p];
    const tall = base - py;
    if (tall < 40) continue;
    for (let r = 0; r < 4; r++) {
      let x = px + 4 + r * tall * 0.08 + rand() * 6;
      let y = py + 6 + r * tall * 0.1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 4; k++) {
        x += 2 + rand() * 8;
        y += tall * 0.07;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  // neve só lá em cima, com a borda irregular
  if (snowY != null) {
    // (o recorte da montanha já está valendo: só pinta dentro dela)
    ctx.fillStyle = tone.snow;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0][0], -400);
    ctx.lineTo(pts[pts.length - 1][0], -400);
    for (let x = pts[pts.length - 1][0]; x >= pts[0][0]; x -= 9) ctx.lineTo(x, snowY + Math.sin(x * 0.09) * 6 + (rand() - 0.3) * 14);
    ctx.closePath();
    ctx.fill();
    // neve na sombra fica azulada
    ctx.fillStyle = tone.snowShade;
    for (const p of peaks) {
      let v = p - 1;
      while (v > 0 && pts[v - 1][1] > pts[v][1]) v--;
      ctx.beginPath();
      ctx.moveTo(pts[v][0], pts[v][1]);
      for (let k = v; k <= p; k++) ctx.lineTo(pts[k][0], pts[k][1]);
      ctx.lineTo(pts[p][0] + 30, snowY + 30);
      ctx.lineTo(pts[v][0], snowY + 30);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
  return pts;
}

// Morro com retalhos de plantação: faixas de cores diferentes seguindo o
// morro, linhas de plantio e cercas vivas (com arvorezinhas) entre elas
// cores de plantação de verdade: tons de verde, trigo maduro e terra arada
const FIELD_COLORS = ['#8fb85a', '#9cc265', '#7faa50', '#a8c46a', '#cdb868', '#c2ad5e', '#a99367', '#93b860'];

function fieldHill(ctx, fn, base, rows, rand) {
  ctx.fillStyle = '#86b25a';
  ctx.beginPath();
  ctx.moveTo(-800, 1400);
  for (let x = -800; x <= 2100; x += 16) ctx.lineTo(x, fn(x));
  ctx.lineTo(2100, 1400);
  ctx.closePath();
  ctx.fill();
  const rowH = 16;
  for (let r = 0; r < rows; r++) {
    let x = -800;
    while (x < 2100) {
      const w = 70 + rand() * 120;
      const color = FIELD_COLORS[Math.floor(rand() * FIELD_COLORS.length)];
      const y0 = (xx) => fn(xx) + 4 + r * rowH;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y0(x));
      ctx.lineTo(x + w, y0(x + w));
      ctx.lineTo(x + w, y0(x + w) + rowH);
      ctx.lineTo(x, y0(x) + rowH);
      ctx.closePath();
      ctx.fill();
      // linhas de plantio
      ctx.strokeStyle = 'rgba(80,60,30,0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 6; k < w; k += 7) {
        ctx.moveTo(x + k, y0(x + k) + 2);
        ctx.lineTo(x + k - 3, y0(x + k) + rowH - 1);
      }
      ctx.stroke();
      // cerca viva no lado
      ctx.fillStyle = '#4f7d3a';
      ctx.fillRect(x - 1, y0(x), 2.2, rowH);
      if (rand() < 0.5) {
        ctx.fillStyle = '#4a7a36';
        ctx.beginPath();
        ctx.arc(x, y0(x) - 2, 4 + rand() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      x += w;
    }
    // cerca viva entre as fileiras
    ctx.strokeStyle = '#557f3c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let xx = -800; xx <= 2100; xx += 16) ctx.lineTo(xx, fn(xx) + 4 + r * rowH);
    ctx.stroke();
  }
  // brilho do sol no alto do morro
  ctx.strokeStyle = 'rgba(255,236,180,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let xx = -800; xx <= 2100; xx += 16) ctx.lineTo(xx, fn(xx) + 1);
  ctx.stroke();
}

function village(ctx, x0, fn, rand) {
  const houses = [[0, 1], [22, 0.9], [44, 1.1], [80, 0.85], [104, 1], [128, 0.9]];
  for (const [dx, s] of houses) {
    const x = x0 + dx;
    const y = fn(x) + 4;
    ctx.fillStyle = '#efe2c8';
    ctx.fillRect(x - 8 * s, y - 10 * s, 16 * s, 10 * s);
    ctx.fillStyle = rand() < 0.5 ? '#c4553e' : '#a8432f';
    ctx.beginPath();
    ctx.moveTo(x - 10 * s, y - 10 * s);
    ctx.lineTo(x, y - 18 * s);
    ctx.lineTo(x + 10 * s, y - 10 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffcf6a';
    ctx.fillRect(x - 2 * s, y - 7 * s, 3 * s, 3 * s);
  }
  // igreja com torre
  const cx = x0 + 62;
  const cy = fn(cx) + 4;
  ctx.fillStyle = '#f2e8d6';
  ctx.fillRect(cx - 7, cy - 34, 14, 34);
  ctx.fillRect(cx - 16, cy - 14, 32, 14);
  ctx.fillStyle = '#8a3d32';
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy - 34);
  ctx.lineTo(cx, cy - 52);
  ctx.lineTo(cx + 9, cy - 34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(cx - 0.8, cy - 60, 1.6, 9);
  ctx.fillRect(cx - 3.5, cy - 57, 7, 1.6);
  ctx.fillStyle = '#6b5544';
  ctx.beginPath();
  ctx.arc(cx, cy - 25, 3, 0, Math.PI * 2);
  ctx.fill();
}

// contorno da cordilheira do fundo (para as pessoinhas andarem em cima)
let RIDGE = null;

function ridgeY(x) {
  let lo = 0;
  let hi = RIDGE.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (RIDGE[mid][0] <= x) lo = mid;
    else hi = mid;
  }
  const [ax, ay] = RIDGE[lo];
  const [bx, by] = RIDGE[hi];
  return ay + ((by - ay) * (x - ax)) / Math.max(1, bx - ax);
}

// Pessoinhas fazendo trilha lá no alto da cordilheira (bem pequenas)
const HIKERS = [
  { x0: -100, speed: 3.2, colors: ['#e2483a', '#ffd166', '#3a7bd5'] },
  { x0: 700, speed: -2.6, colors: ['#2fa36b', '#f28c28'] },
  { x0: 1250, speed: 2.2, colors: ['#9b59b6', '#e2483a', '#ffffff', '#3a7bd5'] },
];

function hiker(ctx, x, y, color, step, dir) {
  ctx.strokeStyle = '#3a3040';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(x, y - 3);
  ctx.lineTo(x - 1.2 * step, y);
  ctx.moveTo(x, y - 3);
  ctx.lineTo(x + 1.2 * step, y);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillRect(x - 1.1, y - 6.5, 2.2, 3.8);
  ctx.fillStyle = '#5a3a28';
  ctx.fillRect(x - dir * 2.2, y - 6.2, 1.3, 2.8);
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(x, y - 7.6, 1.1, 0, Math.PI * 2);
  ctx.fill();
}

function farAnimated(ctx, time) {
  if (!RIDGE) return;
  for (const g of HIKERS) {
    const span = 1900;
    const lead = ((((g.x0 + time * g.speed + 300) % span) + span) % span) - 300;
    const dir = Math.sign(g.speed);
    g.colors.forEach((c, i) => {
      const x = lead - dir * i * 7;
      const step = Math.sin(time * 6 + i * 1.7);
      ctx.save();
      ctx.translate(x, ridgeY(x) + 1);
      ctx.scale(1.35, 1.35);
      hiker(ctx, 0, 0, c, step, dir);
      ctx.restore();
    });
  }
}

function drawFar(ctx, map, rand) {
  // montanhas bem longe, azuladas pela distância (com neve nos picos)
  // (mais baixas: o topo fica abaixo da plataforma do meio)
  RIDGE = range(ctx, 450, [[-800, 450], [-560, 305], [-330, 345], [-60, 245], [200, 330], [470, 270], [720, 345], [1000, 235], [1260, 310], [1500, 262], [1780, 335], [2100, 450]],
    { top: '#93a7d0', bottom: '#b9c6e2', shade: 'rgba(80,96,150,0.35)', line: 'rgba(90,105,160,0.25)', snow: '#f5f1f2', snowShade: 'rgba(170,185,225,0.6)' }, rand, 288);
  // serra mais perto, sem neve, um pouco mais escura
  range(ctx, 455, [[-800, 455], [-520, 370], [-240, 395], [60, 345], [380, 388], [640, 355], [940, 392], [1220, 350], [1520, 385], [1820, 362], [2100, 455]],
    { top: '#7f9cc0', bottom: '#a7bcd8', shade: 'rgba(60,80,130,0.3)', line: 'rgba(70,90,140,0.22)' }, rand);
  // bruma dourada no pé das montanhas
  const fog = ctx.createLinearGradient(0, 300, 0, 420);
  fog.addColorStop(0, 'rgba(255,226,186,0)');
  fog.addColorStop(1, 'rgba(255,226,186,0.6)');
  ctx.fillStyle = fog;
  ctx.fillRect(-800, 300, 2900, 120);
  // morros com retalhos de plantação
  fieldHill(ctx, FAR_HILL, 420, 3, rand);
  village(ctx, -40, FAR_HILL, rand);
  fieldHill(ctx, FAR_HILL2, 448, 4, rand);
  // rio fazendo curvas, refletindo o céu
  ctx.save();
  ctx.lineCap = 'round';
  const river = (w, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.02) {
      const y = FAR_HILL2(600) + 8 + t * 140;
      const x = 620 + Math.sin(t * 7) * 60 * (0.4 + t) + t * 40;
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };
  river(14, '#7aa6c8');
  river(8, '#a9d0ec');
  river(2, 'rgba(255,240,210,0.8)');
  ctx.restore();
  // véu de distância por cima de tudo
  ctx.fillStyle = 'rgba(255,232,200,0.12)';
  ctx.fillRect(-800, 380, 2900, 1000);
}

// ================================================================ fundo médio

const MID_HILL = (x) => 492 - Math.sin(x * 0.0045 + 1.6) * 34 - Math.sin(x * 0.011 + 0.4) * 10;
const MILL = { x: 1185 };

function hayBale(ctx, x, y) {
  ctx.fillStyle = 'rgba(60,80,30,0.25)';
  ctx.beginPath();
  ctx.ellipse(x + 3, y, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(x + 3, y - 14, 2, x, y - 11, 13);
  g.addColorStop(0, '#f6da82');
  g.addColorStop(1, '#c99a3a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y - 11, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,80,20,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y - 11, 6, 0, Math.PI * 2);
  ctx.arc(x, y - 11, 2.5, 0, Math.PI * 2);
  ctx.stroke();
}

function cow(ctx, x, y, s, dir) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * s, s);
  ctx.fillStyle = 'rgba(40,70,30,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 1, 15, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a3030';
  for (const dx of [-9, -5, 6, 10]) ctx.fillRect(dx, -7, 2.4, 8);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, -12, 13, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e2a2a';
  ctx.beginPath();
  ctx.ellipse(-5, -14, 4, 3, 0.4, 0, Math.PI * 2);
  ctx.ellipse(5, -10, 3.5, 2.6, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // cabeça
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(15, -13, 4.5, 4, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2b6a8';
  ctx.beginPath();
  ctx.ellipse(18, -11.5, 2.4, 2, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a3030';
  ctx.fillRect(13, -18.5, 1.4, 2.6);
  ctx.fillRect(16, -18.5, 1.4, 2.6);
  ctx.restore();
}

function poppies(ctx, fn, rand) {
  for (let i = 0; i < 340; i++) {
    const x = -560 + rand() * 2400;
    const y = fn(x) + 10 + rand() * 140;
    ctx.fillStyle = i % 5 === 0 ? '#ffffff' : i % 7 === 0 ? '#ffe866' : '#e53b2c';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(x, y, 1.6 + rand() * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Moinho de vento: torre de pedra clara e telhado; as pás giram em midAnimated
function windmillBody(ctx, x, y) {
  ctx.fillStyle = 'rgba(40,70,30,0.25)';
  ctx.beginPath();
  ctx.ellipse(x + 6, y, 34, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createLinearGradient(x - 18, 0, x + 18, 0);
  g.addColorStop(0, '#cbbfa6');
  g.addColorStop(1, '#f4ead4');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - 20, y);
  ctx.lineTo(x - 13, y - 86);
  ctx.lineTo(x + 13, y - 86);
  ctx.lineTo(x + 20, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(x - 5, y - 18, 10, 18);
  ctx.fillStyle = '#5a3e26';
  ctx.fillRect(x - 3.5, y - 54, 7, 9);
  ctx.fillStyle = '#9a3b2c';
  ctx.beginPath();
  ctx.moveTo(x - 17, y - 84);
  ctx.quadraticCurveTo(x, y - 116, x + 17, y - 84);
  ctx.closePath();
  ctx.fill();
}

function drawMid(ctx, map, rand) {
  // morro do meio com faixas de grama cortada
  const g = ctx.createLinearGradient(0, 440, 0, 760);
  g.addColorStop(0, '#a6d36c');
  g.addColorStop(1, '#6aa548');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-600, 1400);
  for (let x = -600; x <= 1900; x += 16) ctx.lineTo(x, MID_HILL(x));
  ctx.lineTo(1900, 1400);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,220,0.06)';
  for (let x = -900; x < 1900; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 1400);
    ctx.lineTo(x + 400, 380);
    ctx.lineTo(x + 445, 380);
    ctx.lineTo(x + 45, 1400);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,240,180,0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = -600; x <= 1900; x += 16) ctx.lineTo(x, MID_HILL(x) + 1.5);
  ctx.stroke();
  // estradinha de terra subindo o morro
  ctx.fillStyle = '#d2b07a';
  ctx.beginPath();
  for (let t = 0; t <= 1; t += 0.05) {
    const x = 420 + Math.sin(t * 4) * 70 + t * 220;
    const y = MID_HILL(x) + 4 + t * 200;
    ctx.lineTo(x - 4 - t * 26, y);
  }
  for (let t = 1; t >= 0; t -= 0.05) {
    const x = 420 + Math.sin(t * 4) * 70 + t * 220;
    const y = MID_HILL(x) + 4 + t * 200;
    ctx.lineTo(x + 4 + t * 26, y);
  }
  ctx.closePath();
  ctx.fill();
  poppies(ctx, MID_HILL, rand);
  windmillBody(ctx, MILL.x, MID_HILL(MILL.x) + 6);
  // árvores
  for (let i = 0; i < 26; i++) {
    const x = -540 + i * 96 + rand() * 50;
    if (Math.abs(x - MILL.x) < 70 || Math.abs(x - 560) < 60) continue;
    const y = MID_HILL(x) + 6;
    const s = 0.75 + rand() * 0.45;
    if (rand() < 0.3) pine(ctx, x, y, s * 0.9);
    else oak(ctx, x, y, s, rand);
  }
  // fardos de feno, vacas e ovelhas
  for (const x of [80, 120, 940, 1010, 1600]) hayBale(ctx, x, MID_HILL(x) + 22);
  for (const [x, d] of [[260, 1], [880, -1], [1460, 1], [-160, -1]]) cow(ctx, x, MID_HILL(x) + 30, 0.95, d);
  for (const [x, d] of [[320, -1], [700, 1], [1340, -1]]) sheep(ctx, x, MID_HILL(x) + 36, 0.85, d);
}

function midAnimated(ctx, time) {
  // pás do moinho girando
  const x = MILL.x;
  const y = MID_HILL(MILL.x) + 6 - 80;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(time * 0.6);
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#6a4a2c';
    ctx.fillRect(-1.5, 0, 3, 58);
    ctx.fillStyle = 'rgba(245,238,220,0.92)';
    ctx.fillRect(1.5, 10, 11, 46);
    ctx.strokeStyle = 'rgba(106,74,44,0.7)';
    ctx.lineWidth = 0.8;
    for (let k = 14; k < 56; k += 7) {
      ctx.beginPath();
      ctx.moveTo(1.5, k);
      ctx.lineTo(12.5, k);
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.fillStyle = '#4a3220';
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  // bando de passarinhos em V
  ctx.strokeStyle = 'rgba(50,40,50,0.6)';
  ctx.lineWidth = 1.5;
  const fx = ((time * 30) % 2400) - 500;
  for (let i = 0; i < 7; i++) {
    const row = Math.ceil(i / 2);
    const side = i % 2 ? 1 : -1;
    const bx = fx - row * 16;
    const by = 140 + side * row * 9 + Math.sin(time * 0.7) * 6;
    const f = Math.sin(time * 9 + i * 1.3) * 3;
    ctx.beginPath();
    ctx.moveTo(bx - 6, by - f);
    ctx.quadraticCurveTo(bx - 3, by - 3, bx, by);
    ctx.quadraticCurveTo(bx + 3, by - 3, bx + 6, by - f);
    ctx.stroke();
  }
  // sementes de dente-de-leão flutuando
  for (let i = 0; i < 26; i++) {
    const sx = ((i * 173 + time * (16 + (i % 4) * 5)) % 2200) - 400;
    const sy = 220 + ((i * 89) % 380) + Math.sin(time * 1.2 + i) * 14 - ((time * 6 + i * 13) % 60);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k - 2) * 0.45;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(a) * 4, sy + Math.sin(a) * 4);
    }
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy + 4);
    ctx.stroke();
  }
}

export const CAMPO_ART = {
  ...TREINO_ART,
  sky: paintSky,
  skyAnimated,
  far: drawFar,
  farAnimated,
  mid: drawMid,
  midAnimated,
  haze: ['rgba(255,240,210,0)', 'rgba(255,226,186,0.28)'],
};
