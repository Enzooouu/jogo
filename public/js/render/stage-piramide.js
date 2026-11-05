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

// altura de uma duna em x (a mesma conta serve para desenhar e para a
// caravana andar em cima dela)
function duneY(x, base, amp, phase, len) {
  return base - amp * (0.6 + 0.4 * Math.sin(x / len + phase)) - amp * 0.3 * Math.sin(x / (len * 0.43) + phase * 2);
}

// duna com o lado do sol mais claro e a crista brilhando
function dune(ctx, base, amp, color, phase, len = 520, shade = 'rgba(150,100,40,0.18)') {
  const pts = [];
  for (let x = -800; x <= 2100; x += 16) pts.push([x, duneY(x, base, amp, phase, len)]);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-800, 1500);
  for (const [x, y] of pts) ctx.lineTo(x, y);
  ctx.lineTo(2100, 1500);
  ctx.closePath();
  ctx.fill();
  // sombra do lado contrário ao sol (encostas que descem para a direita)
  ctx.fillStyle = shade;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    if (y1 <= y0) continue;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1, y1 + 60);
    ctx.lineTo(x0, y0 + 60);
    ctx.closePath();
    ctx.fill();
  }
  // crista clara
  ctx.strokeStyle = 'rgba(255,248,225,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}

// pirâmide lisa com o sol batendo do lado direito (o sol fica à direita)
function bigPyramid(ctx, x, base, h, tone = 0) {
  const lit = tone ? '#efd29a' : '#f2d8a2';
  const dark = tone ? '#c09a62' : '#c8a26a';
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(x - h * 1.05, base);
  ctx.lineTo(x, base - h);
  ctx.lineTo(x + h * 0.15, base);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = lit;
  ctx.beginPath();
  ctx.moveTo(x + h * 0.15, base);
  ctx.lineTo(x, base - h);
  ctx.lineTo(x + h * 1.05, base);
  ctx.closePath();
  ctx.fill();
  // linhas das fileiras de blocos
  ctx.strokeStyle = 'rgba(120,85,40,0.22)';
  ctx.lineWidth = 1;
  for (let k = 0.12; k < 1; k += 0.08) {
    const y = base - h * k;
    const half = h * 1.05 * (1 - k);
    ctx.beginPath();
    ctx.moveTo(x - half, y);
    ctx.lineTo(x + half, y);
    ctx.stroke();
  }
  // pontinha ainda com o revestimento liso
  ctx.fillStyle = 'rgba(255,250,235,0.6)';
  ctx.beginPath();
  ctx.moveTo(x - h * 0.13, base - h * 0.87);
  ctx.lineTo(x, base - h);
  ctx.lineTo(x + h * 0.13, base - h * 0.87);
  ctx.closePath();
  ctx.fill();
}

// esfinge deitada olhando para a esquerda (corpo de leão, cabeça com o lenço listrado)
function sphinx(ctx, x, base, k) {
  ctx.save();
  ctx.translate(x, base);
  ctx.scale(k, k);
  const body = '#d9b57a';
  const shadow = '#b48c52';
  // pedestal de areia
  ctx.fillStyle = 'rgba(170,120,60,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 150, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // corpo
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-120, 0);
  ctx.lineTo(-120, -22);
  ctx.quadraticCurveTo(-60, -30, -20, -44);
  ctx.quadraticCurveTo(60, -58, 110, -42);
  ctx.quadraticCurveTo(140, -34, 140, 0);
  ctx.closePath();
  ctx.fill();
  // sombra da barriga e da anca
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.moveTo(-60, 0);
  ctx.quadraticCurveTo(20, -14, 140, -6);
  ctx.lineTo(140, 0);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(104, -22, 30, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  // patas da frente esticadas
  ctx.fillStyle = body;
  ctx.fillRect(-170, -14, 70, 14);
  ctx.fillRect(-176, -8, 12, 8);
  ctx.fillStyle = shadow;
  ctx.fillRect(-170, -4, 70, 4);
  // peito e pescoço
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-110, -14);
  ctx.lineTo(-104, -62);
  ctx.lineTo(-62, -64);
  ctx.lineTo(-56, -20);
  ctx.closePath();
  ctx.fill();
  // lenço (nemes) com listras
  ctx.fillStyle = '#e6c48a';
  ctx.beginPath();
  ctx.moveTo(-118, -48);
  ctx.quadraticCurveTo(-116, -104, -82, -108);
  ctx.quadraticCurveTo(-48, -104, -48, -48);
  ctx.lineTo(-62, -44);
  ctx.lineTo(-66, -70);
  ctx.lineTo(-100, -70);
  ctx.lineTo(-104, -44);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,90,140,0.55)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-114 + i * 2, -50 - i * 12);
    ctx.lineTo(-104 + i * 2, -50 - i * 12);
    ctx.moveTo(-60 - i * 2, -50 - i * 12);
    ctx.lineTo(-52 - i * 2, -50 - i * 12);
    ctx.stroke();
  }
  // rosto
  ctx.fillStyle = '#d2a868';
  ctx.beginPath();
  ctx.moveTo(-100, -96);
  ctx.lineTo(-64, -96);
  ctx.lineTo(-66, -66);
  ctx.quadraticCurveTo(-82, -58, -98, -66);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(70,45,20,0.75)';
  ctx.fillRect(-94, -86, 9, 3);
  ctx.fillRect(-78, -86, 9, 3);
  ctx.fillRect(-84, -80, 3, 8);
  ctx.fillRect(-90, -70, 14, 2);
  // barbinha quebrada
  ctx.fillStyle = '#c49a5a';
  ctx.fillRect(-86, -60, 8, 8);
  // rachaduras do tempo
  ctx.strokeStyle = 'rgba(110,75,35,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(10, -50);
  ctx.lineTo(20, -36);
  ctx.lineTo(14, -26);
  ctx.moveTo(70, -52);
  ctx.lineTo(64, -40);
  ctx.stroke();
  ctx.restore();
}

function drawFar(ctx) {
  // névoa quente no horizonte
  const haze = ctx.createLinearGradient(0, 400, 0, 520);
  haze.addColorStop(0, 'rgba(255,240,205,0)');
  haze.addColorStop(1, 'rgba(255,236,196,0.55)');
  ctx.fillStyle = haze;
  ctx.fillRect(-800, 400, 2900, 120);
  // pirâmides bem longe, atrás da duna da caravana
  bigPyramid(ctx, 1120, 470, 170);
  bigPyramid(ctx, 1300, 474, 110, 1);
  bigPyramid(ctx, 330, 470, 120, 1);
  bigPyramid(ctx, 150, 474, 80);
  // duna do fundo (a caravana anda em cima dela)
  dune(ctx, CARAVAN.base, CARAVAN.amp, '#efd8a8', CARAVAN.phase, CARAVAN.len, 'rgba(160,120,60,0.12)');
  // duna da frente com a esfinge deitada, entre a pirâmide e o bloco da direita
  dune(ctx, 548, 40, '#e8c992', 0.4, 600, 'rgba(160,110,50,0.14)');
  sphinx(ctx, 985, 524, 0.74);
}

// caravana de camelos andando devagar por cima da duna do fundo
const CARAVAN = { base: 478, amp: 30, phase: 1.3, len: 640, speed: 18 };
function camel(ctx, x, y, step, rider) {
  ctx.save();
  ctx.translate(x, y);
  const legs = [-9, -4, 6, 11];
  ctx.strokeStyle = '#6a4a2a';
  ctx.lineWidth = 2;
  legs.forEach((lx, i) => {
    const swing = Math.sin(step + i * 1.6) * 2.5;
    ctx.beginPath();
    ctx.moveTo(lx, -12);
    ctx.lineTo(lx + swing, 0);
    ctx.stroke();
  });
  ctx.fillStyle = '#8a6238';
  ctx.beginPath();
  ctx.ellipse(1, -15, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // corcova
  ctx.beginPath();
  ctx.ellipse(0, -20, 7, 6, 0, Math.PI, 0);
  ctx.fill();
  // pescoço e cabeça (olhando para a direita, o lado para onde anda)
  ctx.strokeStyle = '#8a6238';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(12, -16);
  ctx.quadraticCurveTo(20, -18, 19, -26);
  ctx.stroke();
  ctx.fillRect(18, -29, 7, 4);
  // carga ou pessoa montada
  if (rider) {
    ctx.fillStyle = rider;
    ctx.fillRect(-3, -32, 6, 9);
    ctx.beginPath();
    ctx.arc(0, -34, 3.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#b84a3a';
    ctx.fillRect(-8, -26, 16, 6);
    ctx.fillStyle = '#e0c070';
    ctx.fillRect(-8, -24, 16, 1.5);
  }
  ctx.restore();
}

function farAnimated(ctx, t) {
  const C = CARAVAN;
  // a fila inteira atravessa de um lado ao outro e recomeça
  const lead = ((t * C.speed) % 1900) - 300;
  const riders = ['#f2ece0', null, '#3a5a9a', null, '#f2ece0', null];
  riders.forEach((rider, i) => {
    const x = lead - i * 34;
    const y = duneY(x, C.base, C.amp, C.phase, C.len) + 1;
    camel(ctx, x, y, t * 5 + i, rider);
  });
  // um homem a pé puxando o primeiro camelo
  const x = lead + 24;
  const y = duneY(x, C.base, C.amp, C.phase, C.len) + 1;
  ctx.fillStyle = '#f2ece0';
  ctx.fillRect(x - 2, y - 13, 5, 10);
  ctx.beginPath();
  ctx.arc(x + 0.5, y - 15, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#6a4a2a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 3);
  ctx.lineTo(x - 2 + Math.sin(t * 5) * 2, y);
  ctx.moveTo(x + 2, y - 3);
  ctx.lineTo(x + 2 - Math.sin(t * 5) * 2, y);
  ctx.moveTo(x - 2, y - 10);
  ctx.lineTo(x - 6, y - 22);
  ctx.stroke();
}

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
  ctx.fillRect(x - 12, base - h, 10, h);
  ctx.fillStyle = GOLD.mid;
  ctx.beginPath();
  ctx.moveTo(x - 8, base - h);
  ctx.lineTo(x, base - h - 16);
  ctx.lineTo(x + 8, base - h);
  ctx.closePath();
  ctx.fill();
  // hieróglifos riscados
  ctx.strokeStyle = 'rgba(110,75,35,0.5)';
  ctx.lineWidth = 1.2;
  for (let y = base - h + 14; y < base - 10; y += 12) {
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x + 4, y);
    ctx.stroke();
  }
}

// casinha de barro com porta, janela e escada no telhado
function mudHouse(ctx, x, base, w, h, rand) {
  ctx.fillStyle = rand() < 0.5 ? '#d9b07a' : '#cfa46c';
  ctx.fillRect(x, base - h, w, h);
  ctx.fillStyle = 'rgba(255,240,210,0.35)';
  ctx.fillRect(x + w - 8, base - h, 8, h);
  ctx.fillStyle = 'rgba(120,80,40,0.3)';
  ctx.fillRect(x, base - h, w, 4);
  ctx.fillStyle = '#4a2e18';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, base);
  ctx.lineTo(x + w * 0.3, base - h * 0.45);
  ctx.quadraticCurveTo(x + w * 0.4, base - h * 0.58, x + w * 0.5, base - h * 0.45);
  ctx.lineTo(x + w * 0.5, base);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x + w * 0.66, base - h * 0.72, 8, 8);
  // toldo listrado em algumas
  if (rand() < 0.5) {
    ctx.fillStyle = rand() < 0.5 ? '#3a6ab0' : '#b8483a';
    ctx.fillRect(x + w * 0.2, base - h * 0.62, w * 0.42, 5);
  }
}

// templo com portal (pilone), colunas pintadas e bandeiras
function temple(ctx, x, base) {
  const stone = '#e4c690';
  const shade = '#c39f62';
  // pilone de dois lados
  for (const dx of [0, 132]) {
    ctx.fillStyle = stone;
    ctx.beginPath();
    ctx.moveTo(x + dx, base);
    ctx.lineTo(x + dx + 8, base - 110);
    ctx.lineTo(x + dx + 62, base - 110);
    ctx.lineTo(x + dx + 70, base);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shade;
    ctx.fillRect(x + dx + 8, base - 110, 54, 8);
    // relevo do faraó
    ctx.strokeStyle = 'rgba(90,60,30,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + dx + 35, base - 70, 9, 0, Math.PI * 2);
    ctx.moveTo(x + dx + 35, base - 61);
    ctx.lineTo(x + dx + 35, base - 30);
    ctx.moveTo(x + dx + 24, base - 48);
    ctx.lineTo(x + dx + 46, base - 48);
    ctx.stroke();
    // mastro com flâmula
    ctx.strokeStyle = '#7a5530';
    ctx.beginPath();
    ctx.moveTo(x + dx + (dx ? 66 : 4), base - 110);
    ctx.lineTo(x + dx + (dx ? 66 : 4), base - 160);
    ctx.stroke();
  }
  // vão do portal com a porta
  ctx.fillStyle = shade;
  ctx.fillRect(x + 70, base - 80, 62, 80);
  ctx.fillStyle = stone;
  ctx.fillRect(x + 66, base - 92, 70, 14);
  ctx.fillStyle = '#3a6ab0';
  ctx.fillRect(x + 66, base - 92, 70, 4);
  ctx.fillStyle = '#5a3820';
  ctx.fillRect(x + 84, base - 56, 34, 56);
  // disco solar com asas em cima da porta
  ctx.fillStyle = GOLD.mid;
  ctx.beginPath();
  ctx.arc(x + 101, base - 85, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + 82, base - 86, 38, 2);
  // colunas na frente
  for (const cx of [x - 26, x + 216]) {
    ctx.fillStyle = stone;
    ctx.fillRect(cx, base - 84, 16, 84);
    ctx.fillStyle = '#4a9a6a';
    ctx.beginPath();
    ctx.moveTo(cx - 6, base - 84);
    ctx.lineTo(cx + 22, base - 84);
    ctx.lineTo(cx + 16, base - 96);
    ctx.lineTo(cx, base - 96);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a6ab0';
    ctx.fillRect(cx, base - 70, 16, 4);
    ctx.fillStyle = 'rgba(120,80,40,0.25)';
    ctx.fillRect(cx, base - 84, 5, 84);
  }
}

// coluna quebrada caída
function brokenColumn(ctx, x, base, h) {
  ctx.fillStyle = '#e0c08a';
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.lineTo(x, base - h);
  ctx.lineTo(x + 6, base - h - 6);
  ctx.lineTo(x + 12, base - h + 2);
  ctx.lineTo(x + 18, base - h - 4);
  ctx.lineTo(x + 18, base);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(120,80,40,0.25)';
  ctx.fillRect(x, base - h, 6, h);
}

function drawMid(ctx, map, rand) {
  dune(ctx, 628, 62, '#ebc888', 2.6, 380);
  // ---- cidade antiga perto do oásis (esquerda)
  for (const [x, w, h] of [[-190, 46, 40], [-140, 38, 52], [-96, 50, 36], [-240, 40, 34], [196, 34, 44], [236, 44, 30]]) mudHouse(ctx, x, 604, w, h, rand);
  temple(ctx, -10, 600);
  // muro baixo da vila
  ctx.fillStyle = '#d2a86e';
  ctx.fillRect(-260, 598, 560, 10);
  // oásis com reflexo
  ctx.fillStyle = '#3aa6c8';
  ctx.beginPath();
  ctx.ellipse(40, 632, 190, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(-90, 628, 120, 2);
  ctx.fillRect(40, 634, 80, 2);
  ctx.fillStyle = '#5a9a3a';
  ctx.beginPath();
  ctx.ellipse(40, 646, 220, 14, 0, 0, Math.PI);
  ctx.fill();
  // juncos
  ctx.strokeStyle = '#4a8a3a';
  ctx.lineWidth = 2;
  for (let i = 0; i < 18; i++) {
    const x = -140 + i * 20 + rand() * 8;
    ctx.beginPath();
    ctx.moveTo(x, 640);
    ctx.lineTo(x + (rand() - 0.5) * 6, 622 - rand() * 10);
    ctx.stroke();
  }
  palm(ctx, -200, 626, 150, 30, rand);
  palm(ctx, -60, 630, 170, -20, rand);
  palm(ctx, 300, 630, 140, 26, rand);
  // ---- ruínas à direita: obeliscos, colunas e um templinho
  obelisk(ctx, 1150, 652, 150);
  obelisk(ctx, 1262, 656, 118);
  for (const [x, h] of [[1190, 70], [1214, 44], [1310, 60]]) brokenColumn(ctx, x, 656, h);
  palm(ctx, 1360, 650, 160, -28, rand);
  palm(ctx, 1080, 660, 120, 20, rand);
  dune(ctx, 720, 46, '#e2b56a', 4.1, 300);
}

// fumacinha das casas e o brilho da água do oásis
function midAnimated(ctx, t) {
  for (const [x, y] of [[-120, 548], [214, 556]]) {
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.25 + i / 4) % 1;
      ctx.globalAlpha = (1 - k) * 0.35;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + Math.sin(t + i) * 4 + k * 10, y - k * 60, 4 + k * 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 5; i++) {
    const a = Math.max(0, Math.sin(t * 2 + i * 1.7));
    if (a < 0.3) continue;
    ctx.globalAlpha = a * 0.8;
    ctx.fillRect(-100 + i * 50, 628 + (i % 2) * 6, 10, 1.5);
  }
  ctx.globalAlpha = 1;
}

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
