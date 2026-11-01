// Cenário do Coliseu: arena romana no fim da tarde.
//
//   céu      degradê roxo -> laranja -> dourado, sol baixo e nuvens rosadas
//   longe    a cidade ao longe (templos, ciprestes) na neblina quente
//   meio     a parede do coliseu (três andares de arcos), o velário (toldo
//            listrado), a torcida dividida pelos 5 elementos pulando e o
//            camarote do imperador, que faz joinha quando alguém cai
//   campo    palco de pedra com faixa grega entalhada sobre o fosso, colunas
//            quebradas (as plataformas) e uma laje com estandarte no meio;
//            tochas com fogo animado nas pontas
//
// A morte súbita (palco se abrindo e paredes de espinhos) é desenhada no
// renderer. Mesmo formato de TREINO_ART (ver stage.js).

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

function skyAnimated() {}

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

// Parede do coliseu: três andares de arcos (com profundidade e a luz do sol
// da tarde vindo da direita), o toldo listrado (velário) lá em cima, a
// arquibancada separada pelos 5 elementos com a torcida pulando, e o
// camarote do imperador à direita.
const WALL = { top: 200, floors: [[200, 290], [290, 380], [380, 470]] };
const curve = (x) => ((x - 640) / 900) ** 2 * 60;
const STANDS = { top: 432, rows: 7, rowH: 15 };
const BOX = { x: 1030, w: 170 };   // camarote do imperador

// Setores da torcida: um por elemento (cores das camisas, bandeira e símbolo)
const SECTIONS = [
  { el: 'fogo', shirts: ['#ff6a1f', '#ffb347', '#c83a12'], flag: ['#ff6a1f', '#ffd25a'] },
  { el: 'agua', shirts: ['#2f8cff', '#9fe3ff', '#1a5ab8'], flag: ['#2f8cff', '#9fe3ff'] },
  { el: 'mortal', shirts: ['#2a2830', '#55525e', '#e8e8f2'], flag: ['#1c1a22', '#e8e8f2'] },
  { el: 'terra', shirts: ['#9a6b3a', '#5f8f3a', '#d8b27a'], flag: ['#8a5a2e', '#9ccf5f'] },
  { el: 'ar', shirts: ['#bfe9e1', '#7fd6c6', '#ffffff'], flag: ['#7fd6c6', '#ffffff'] },
];
const SECTION_W = 256;
const sectionAt = (x) => SECTIONS[((Math.floor(x / SECTION_W) % 5) + 5) % 5];

function wallPath(ctx, x0, x1, yOf) {
  ctx.beginPath();
  for (let x = x0; x <= x1; x += 20) ctx.lineTo(x, yOf(x));
}

function drawMid(ctx, map, rand) {
  const x0 = -560;
  const x1 = 1840;
  // corpo da parede
  const g = ctx.createLinearGradient(0, WALL.top - 60, 0, 640);
  g.addColorStop(0, '#dcaa72');
  g.addColorStop(1, '#8a5a38');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x0, 1400);
  for (let x = x0; x <= x1; x += 20) ctx.lineTo(x, WALL.top - 60 + curve(x));
  ctx.lineTo(x1, 1400);
  ctx.closePath();
  ctx.fill();
  // andares de arcos com profundidade
  WALL.floors.forEach(([top, bottom], f) => {
    const archW = 46 - f * 4;
    const gap = 16;
    for (let x = x0; x < x1; x += archW + gap) {
      const ay = top + curve(x) - 50;
      const ah = bottom - top - 16;
      const path = () => {
        ctx.beginPath();
        ctx.moveTo(x, ay + ah);
        ctx.lineTo(x, ay + archW / 2);
        ctx.arc(x + archW / 2, ay + archW / 2, archW / 2, Math.PI, 0);
        ctx.lineTo(x + archW, ay + ah);
        ctx.closePath();
      };
      // vão: escuro em cima, um pouco de luz embaixo
      const inside = ctx.createLinearGradient(0, ay, 0, ay + ah);
      inside.addColorStop(0, '#2a140a');
      inside.addColorStop(1, f === 2 ? '#4a2614' : '#5a301c');
      ctx.fillStyle = inside;
      path();
      ctx.fill();
      // espessura da parede: a face de dentro do lado esquerdo pega luz
      ctx.save();
      path();
      ctx.clip();
      ctx.fillStyle = 'rgba(240,190,130,0.45)';
      ctx.beginPath();
      ctx.moveTo(x, ay + archW / 2);
      ctx.lineTo(x + 7, ay + archW / 2 + 4);
      ctx.lineTo(x + 7, ay + ah);
      ctx.lineTo(x, ay + ah);
      ctx.closePath();
      ctx.fill();
      // vão do outro lado da parede (luz do céu passando)
      ctx.fillStyle = 'rgba(255,190,120,0.18)';
      ctx.beginPath();
      ctx.arc(x + archW / 2 + 6, ay + archW / 2 + 6, archW / 2 - 8, Math.PI, 0);
      ctx.lineTo(x + archW - 2, ay + ah);
      ctx.lineTo(x + 14, ay + ah);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // contorno do arco e a pedra do topo (aduela)
      ctx.strokeStyle = 'rgba(90,50,24,0.7)';
      ctx.lineWidth = 1.5;
      path();
      ctx.stroke();
      ctx.fillStyle = '#efc790';
      ctx.beginPath();
      ctx.moveTo(x + archW / 2 - 4, ay - 3);
      ctx.lineTo(x + archW / 2 + 4, ay - 3);
      ctx.lineTo(x + archW / 2 + 3, ay + 6);
      ctx.lineTo(x + archW / 2 - 3, ay + 6);
      ctx.closePath();
      ctx.fill();
      // coluna entre os arcos: lado do sol claro, lado da sombra escuro
      const cx = x + archW + 2;
      ctx.fillStyle = '#f2c88e';
      ctx.fillRect(cx + gap / 2 - 1, ay - 6, gap / 2 - 2, ah + 6);
      ctx.fillStyle = 'rgba(110,60,30,0.35)';
      ctx.fillRect(cx, ay - 6, gap / 2 - 1, ah + 6);
    }
    // cornija de cada andar, com dentículos
    ctx.fillStyle = '#ecc48c';
    wallPath(ctx, x0, x1, (x) => bottom - 52 + curve(x));
    for (let x = x1; x >= x0; x -= 20) ctx.lineTo(x, bottom - 42 + curve(x));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(110,60,30,0.45)';
    for (let x = x0; x < x1; x += 8) ctx.fillRect(x, bottom - 44 + curve(x), 4, 3);
  });
  // luz do pôr do sol vindo da direita
  const sun = ctx.createLinearGradient(-200, 0, 1500, 0);
  sun.addColorStop(0, 'rgba(60,20,40,0.25)');
  sun.addColorStop(0.7, 'rgba(255,170,90,0)');
  sun.addColorStop(1, 'rgba(255,200,120,0.18)');
  ctx.fillStyle = sun;
  ctx.fillRect(x0, WALL.top - 80, x1 - x0, 400);

  // arquibancada (os degraus; a torcida é animada em midAnimated)
  const st = ctx.createLinearGradient(0, STANDS.top, 0, STANDS.top + 130);
  st.addColorStop(0, '#8a5a34');
  st.addColorStop(1, '#5a3820');
  ctx.fillStyle = st;
  ctx.fillRect(x0, STANDS.top - 8, x1 - x0, 400);
  for (let r = 0; r <= STANDS.rows; r++) {
    ctx.fillStyle = 'rgba(255,220,170,0.18)';
    ctx.fillRect(x0, STANDS.top + r * STANDS.rowH + 9, x1 - x0, 2);
  }
  // escadinhas separando os setores
  for (let x = -512; x < x1; x += SECTION_W) {
    ctx.fillStyle = '#b8895a';
    ctx.fillRect(x - 7, STANDS.top - 8, 14, 130);
    ctx.fillStyle = 'rgba(80,50,26,0.5)';
    for (let r = 0; r < 9; r++) ctx.fillRect(x - 7, STANDS.top - 4 + r * 14, 14, 2);
  }
  // muro da frente da arquibancada com panos vermelhos
  ctx.fillStyle = '#d9b57e';
  ctx.fillRect(x0, STANDS.top + STANDS.rows * STANDS.rowH + 6, x1 - x0, 40);
  ctx.fillStyle = 'rgba(110,70,30,0.4)';
  ctx.fillRect(x0, STANDS.top + STANDS.rows * STANDS.rowH + 6, x1 - x0, 3);
  for (let x = x0; x < x1; x += 64) {
    ctx.fillStyle = '#a8202a';
    ctx.beginPath();
    const y = STANDS.top + STANDS.rows * STANDS.rowH + 9;
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 32, y + 22, x + 64, y);
    ctx.lineTo(x + 64, y + 4);
    ctx.quadraticCurveTo(x + 32, y + 26, x, y + 4);
    ctx.fill();
  }
  // faixa grande de cada setor, pendurada na parede atrás da torcida
  for (let x = -512; x < x1; x += SECTION_W) {
    const sec = sectionAt(x + 10);
    if (x + SECTION_W / 2 > BOX.x - 40 && x + SECTION_W / 2 < BOX.x + BOX.w + 40) continue;
    sectionBanner(ctx, x + SECTION_W / 2, STANDS.top - 74, sec);
  }
  emperorBox(ctx);
}

// Faixa de um setor: pano na cor do elemento com o símbolo
function sectionBanner(ctx, x, y, sec) {
  const [c1, c2] = sec.flag;
  ctx.fillStyle = c1;
  ctx.strokeStyle = 'rgba(30,15,5,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 46, y);
  ctx.lineTo(x + 46, y);
  ctx.lineTo(x + 46, y + 52);
  ctx.lineTo(x, y + 64);
  ctx.lineTo(x - 46, y + 52);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = c2;
  ctx.fillRect(x - 46, y + 4, 92, 4);
  ctx.save();
  ctx.translate(x, y + 30);
  ctx.fillStyle = c2;
  ctx.strokeStyle = c2;
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (sec.el === 'fogo') {
    ctx.moveTo(0, -15);
    ctx.quadraticCurveTo(11, -2, 7, 8);
    ctx.quadraticCurveTo(3, 13, 0, 13);
    ctx.quadraticCurveTo(-10, 12, -9, 2);
    ctx.quadraticCurveTo(-6, -5, -2, -2);
    ctx.quadraticCurveTo(-2, -10, 0, -15);
    ctx.fill();
  } else if (sec.el === 'agua') {
    ctx.moveTo(0, -15);
    ctx.quadraticCurveTo(11, 0, 9, 6);
    ctx.arc(0, 5, 9, 0.1, Math.PI - 0.1);
    ctx.quadraticCurveTo(-11, 0, 0, -15);
    ctx.fill();
  } else if (sec.el === 'terra') {
    ctx.moveTo(-13, 11);
    ctx.lineTo(-4, -8);
    ctx.lineTo(1, 0);
    ctx.lineTo(6, -13);
    ctx.lineTo(14, 11);
    ctx.closePath();
    ctx.fill();
  } else if (sec.el === 'ar') {
    ctx.arc(0, 0, 10, 0.3, Math.PI * 1.7);
    ctx.moveTo(-12, 6);
    ctx.quadraticCurveTo(0, 14, 12, 5);
    ctx.stroke();
  } else {
    // Mortal: cabeça de manequim
    ctx.ellipse(0, -2, 9, 11, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.ellipse(-3, -6, 2, 3.5, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Camarote do imperador (o imperador é animado em midAnimated)
function emperorBox(ctx) {
  const x = BOX.x;
  const y = STANDS.top - 40;
  ctx.fillStyle = '#efe2c4';
  ctx.strokeStyle = 'rgba(40,20,8,0.85)';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, BOX.w, 120);
  ctx.strokeRect(x, y, BOX.w, 120);
  // colunas de mármore
  for (const cx of [x + 10, x + BOX.w - 18]) {
    ctx.fillStyle = '#fff6e0';
    ctx.fillRect(cx, y - 60, 8, 60);
    ctx.strokeRect(cx, y - 60, 8, 60);
  }
  // fundo roxo do camarote
  ctx.fillStyle = '#4a1a5a';
  ctx.fillRect(x + 18, y - 60, BOX.w - 36, 60);
  // toldo vermelho e dourado
  ctx.fillStyle = '#b8282a';
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 60);
  ctx.lineTo(x + BOX.w + 10, y - 60);
  ctx.lineTo(x + BOX.w - 4, y - 86);
  ctx.lineTo(x + 4, y - 86);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = i % 2 ? '#ffd23f' : '#b8282a';
    ctx.beginPath();
    ctx.moveTo(x - 10 + i * 21, y - 60);
    ctx.lineTo(x - 10 + (i + 0.5) * 21, y - 51);
    ctx.lineTo(x - 10 + (i + 1) * 21, y - 60);
    ctx.fill();
  }
  // parapeito com a águia dourada
  ctx.fillStyle = '#d9b57e';
  ctx.fillRect(x - 6, y - 4, BOX.w + 12, 14);
  ctx.strokeRect(x - 6, y - 4, BOX.w + 12, 14);
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.moveTo(x + BOX.w / 2, y + 30);
  ctx.lineTo(x + BOX.w / 2 - 22, y + 18);
  ctx.lineTo(x + BOX.w / 2 - 8, y + 26);
  ctx.lineTo(x + BOX.w / 2, y + 14);
  ctx.lineTo(x + BOX.w / 2 + 8, y + 26);
  ctx.lineTo(x + BOX.w / 2 + 22, y + 18);
  ctx.closePath();
  ctx.fill();
  // trono dourado
  ctx.fillStyle = '#d8a83a';
  ctx.fillRect(x + BOX.w / 2 - 16, y - 52, 32, 44);
  ctx.fillStyle = '#b8862a';
  ctx.fillRect(x + BOX.w / 2 - 20, y - 56, 40, 6);
}

// Torcedor: corpinho e cabeça (as cores vêm do setor)
function fan(ctx, x, y, shirt, skin, flag, arms) {
  ctx.fillStyle = shirt;
  ctx.fillRect(x - 4, y - 2, 8, 9);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(x, y - 6, 3.6, 0, Math.PI * 2);
  ctx.fill();
  if (arms) {
    ctx.strokeStyle = skin;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x - 3, y - 1);
    ctx.lineTo(x - 6, y - 10);
    ctx.moveTo(x + 3, y - 1);
    ctx.lineTo(x + 6, y - 10);
    ctx.stroke();
  }
  if (flag) {
    ctx.strokeStyle = '#3a2010';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 5, y);
    ctx.lineTo(x + 5, y - 18);
    ctx.stroke();
    ctx.fillStyle = flag[0];
    ctx.fillRect(x + 5, y - 18, 10, 7);
    ctx.fillStyle = flag[1];
    ctx.fillRect(x + 5, y - 15, 10, 2);
  }
}

// Grupinhos de 4 torcedores desenhados uma vez por setor (3 jeitos cada)
const CLUSTER = { w: 44, h: 30 };
const clusters = new Map();
function clusterSprite(secIndex, variant) {
  const key = `${secIndex}:${variant}`;
  if (clusters.has(key)) return clusters.get(key);
  const c = document.createElement('canvas');
  c.width = CLUSTER.w * 2;
  c.height = CLUSTER.h * 2;
  const ctx = c.getContext('2d');
  ctx.scale(2, 2);
  const sec = SECTIONS[secIndex];
  const rand = seeded(secIndex * 31 + variant * 7 + 3);
  for (let i = 0; i < 4; i++) {
    const shirt = sec.shirts[Math.floor(rand() * sec.shirts.length)];
    const skin = ['#f0c8a0', '#c89070', '#8a5a3a', '#e8b890'][Math.floor(rand() * 4)];
    const flag = variant === 1 && i === 2 ? sec.flag : null;
    const arms = variant === 2 ? i % 2 === 0 : rand() < 0.25;
    fan(ctx, 6 + i * 11, 22, shirt, skin, flag, arms);
  }
  clusters.set(key, c);
  return c;
}

// Empolgação da torcida (sobe quando alguém cai) e o gesto do imperador
const MOOD = { excite: 0, gesture: null, gestureT: 0 };

function midAnimated(ctx, time) {
  const dt = MOOD.last == null ? 0 : Math.max(0, Math.min(0.1, time - MOOD.last));
  MOOD.last = time;
  MOOD.excite = Math.max(0, MOOD.excite - dt * 0.5);
  if (MOOD.gesture) {
    MOOD.gestureT += dt;
    if (MOOD.gestureT > 2.4) MOOD.gesture = null;
  }

  // torcida nos dois andares de arcos de baixo (o de cima fica vazio)
  for (const f of [1, 2]) {
    const [top, bottom] = WALL.floors[f];
    const archW = 46 - f * 4;
    const gap = 16;
    const w = archW - 6;
    const h = (w * CLUSTER.h) / CLUSTER.w;
    for (let x = -560; x < 1840; x += archW + gap) {
      const ay = top + curve(x) - 50;
      const ah = bottom - top - 16;
      const secIndex = SECTIONS.indexOf(sectionAt(x + archW / 2));
      const seed = Math.abs(Math.sin(x * 7.13 + f * 91.7) * 43758.5453) % 1;
      const hop = Math.abs(Math.sin(time * (5 + seed * 3) + seed * 10)) * (2 + MOOD.excite * 5);
      ctx.save();
      // só aparece dentro do vão do arco
      ctx.beginPath();
      ctx.moveTo(x, ay + ah);
      ctx.lineTo(x, ay + archW / 2);
      ctx.arc(x + archW / 2, ay + archW / 2, archW / 2, Math.PI, 0);
      ctx.lineTo(x + archW, ay + ah);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(clusterSprite(secIndex, Math.floor(seed * 3)), x + 3, ay + ah - h + 3 - hop, w, h);
      ctx.restore();
    }
  }

  // torcida pulando, setor por setor
  for (let r = 0; r < STANDS.rows; r++) {
    const y = STANDS.top + r * STANDS.rowH - 16;
    for (let x = -560 + (r % 2) * 22; x < 1840; x += CLUSTER.w) {
      if (x + CLUSTER.w > BOX.x - 6 && x < BOX.x + BOX.w + 6) continue;
      const secIndex = SECTIONS.indexOf(sectionAt(x + CLUSTER.w / 2));
      const seed = Math.abs(Math.sin(x * 12.9898 + r * 78.233) * 43758.5453) % 1;
      const variant = Math.floor(seed * 3);
      const speed = 5 + seed * 3;
      const amp = 2.5 + MOOD.excite * 7;
      const hop = Math.abs(Math.sin(time * speed + seed * 10)) * amp;
      ctx.drawImage(clusterSprite(secIndex, variant), x, y - hop, CLUSTER.w, CLUSTER.h);
    }
  }

  // imperador no trono
  const ex = BOX.x + BOX.w / 2;
  const ey = STANDS.top - 54;
  ctx.fillStyle = '#6a2a8a';
  ctx.fillRect(ex - 9, ey + 2, 18, 22);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(ex - 9, ey + 8, 18, 3);
  ctx.fillStyle = '#f0c8a0';
  ctx.beginPath();
  ctx.arc(ex, ey - 4, 7, 0, Math.PI * 2);
  ctx.fill();
  // coroa de louros
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ex, ey - 4, 7.5, Math.PI * 0.9, Math.PI * 2.1);
  ctx.stroke();
  // braço: parado no colo, ou erguido fazendo joinha / polegar para baixo
  const up = MOOD.gesture ? Math.min(1, MOOD.gestureT / 0.25) : 0;
  const hx = ex + 10 + up * 10;
  const hy = ey + 14 - up * 24;
  ctx.strokeStyle = '#f0c8a0';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(ex + 7, ey + 6);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  if (MOOD.gesture) {
    const dir = MOOD.gesture === 'up' ? -1 : 1;
    ctx.fillStyle = '#f0c8a0';
    ctx.fillRect(hx - 3, hy - 3, 6, 6);
    ctx.fillRect(hx - 1, hy + dir * 3 - (dir < 0 ? 4 : 0), 3, 5);
    // balão grande com o polegar, para dar para ver de longe
    const pop = Math.min(1, MOOD.gestureT / 0.2);
    const bx = ex;
    const by = ey - 58 - (1 - pop) * 10;
    ctx.globalAlpha = Math.min(1, (2.4 - MOOD.gestureT) / 0.3);
    ctx.fillStyle = MOOD.gesture === 'up' ? '#3fbf5a' : '#d8282a';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(bx, by, 22 * pop, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(pop, pop * -dir);
    ctx.fillStyle = '#ffffff';
    // mão fechada com o polegar para cima (virada para baixo quando dir = 1)
    ctx.fillRect(-9, -2, 14, 12);
    ctx.fillRect(-3, -13, 6, 12);
    ctx.fillRect(-12, 0, 4, 9);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  // guardas com lança dos dois lados
  for (const gx of [BOX.x + 26, BOX.x + BOX.w - 26]) {
    ctx.fillStyle = '#b8282a';
    ctx.fillRect(gx - 5, ey + 4, 10, 18);
    ctx.fillStyle = '#c8c8d0';
    ctx.beginPath();
    ctx.arc(gx, ey - 2, 6, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#f0c8a0';
    ctx.fillRect(gx - 4, ey - 2, 8, 6);
    ctx.strokeStyle = '#6a4a2a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(gx + 7, ey + 24);
    ctx.lineTo(gx + 7, ey - 26);
    ctx.stroke();
    ctx.fillStyle = '#d8d8e0';
    ctx.beginPath();
    ctx.moveTo(gx + 4, ey - 26);
    ctx.lineTo(gx + 7, ey - 34);
    ctx.lineTo(gx + 10, ey - 26);
    ctx.fill();
  }

  velarium(ctx, time);

  // pássaros voltando para casa
  ctx.strokeStyle = 'rgba(40,20,40,0.6)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 4; i++) {
    const x = ((time * (20 + i * 4) + i * 300) % 1700) - 200;
    const y = 40 + i * 20 + Math.sin(time * 0.7 + i) * 8;
    const f = Math.sin(time * 8 + i * 2) * 3;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - f);
    ctx.quadraticCurveTo(x - 3, y - 3, x, y);
    ctx.quadraticCurveTo(x + 3, y - 3, x + 6, y - f);
    ctx.stroke();
  }
}

// Velário: o toldo listrado que os romanos esticavam por cima do coliseu.
// Faixas de pano saindo do alto da tela até a beira da parede, com a barra
// ondulada balançando no vento e as cordas.
function velarium(ctx, time) {
  const hem = (x) => WALL.top - 70 + curve(x) * 0.6 - 40 * Math.cos(((x - 640) / 1500) * Math.PI) + Math.sin(time * 1.2 + x * 0.01) * 3;
  const stripes = 28;
  const xa = -560;
  const xb = 1840;
  for (let i = 0; i < stripes; i++) {
    const a = xa + ((xb - xa) * i) / stripes;
    const b = xa + ((xb - xa) * (i + 1)) / stripes;
    ctx.fillStyle = i % 2 ? '#f2e6cc' : '#c0392b';
    ctx.beginPath();
    ctx.moveTo(a + (a - 640) * 0.6, -420);
    ctx.lineTo(b + (b - 640) * 0.6, -420);
    ctx.lineTo(b, hem(b));
    ctx.quadraticCurveTo((a + b) / 2, hem((a + b) / 2) + 14, a, hem(a));
    ctx.closePath();
    ctx.fill();
  }
  // sombra embaixo do pano e cordas
  ctx.strokeStyle = 'rgba(60,30,20,0.55)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i <= stripes; i++) {
    const x = xa + ((xb - xa) * i) / stripes;
    ctx.beginPath();
    ctx.moveTo(x, hem(x));
    ctx.lineTo(x + (x - 640) * 0.6, -420);
    ctx.stroke();
  }
  ctx.strokeStyle = '#7a4a2a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = xa; x <= xb; x += 20) ctx.lineTo(x, hem(x) + 6);
  ctx.stroke();
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
// Fosso embaixo do palco: parede de pedra na sombra, portões de ferro de
// onde saíam as feras, tochas, pilares segurando o palco e o chão de areia
// lá no fundo. Fica atrás do palco (aparece quando o palco se abre).
function fosso(ctx, floor, rand) {
  const top = floor.y + 20;
  const x0 = -400;
  const x1 = 1700;
  // parede do fundo
  const wall = ctx.createLinearGradient(0, top, 0, top + 420);
  wall.addColorStop(0, '#7a5232');
  wall.addColorStop(0.5, '#4e321e');
  wall.addColorStop(1, '#241408');
  ctx.fillStyle = wall;
  ctx.fillRect(x0, top, x1 - x0, 1000);
  // blocos de pedra
  ctx.strokeStyle = 'rgba(30,16,6,0.45)';
  ctx.lineWidth = 1.5;
  for (let r = 0; r < 14; r++) {
    const y = top + r * 30;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    for (let x = x0 + (r % 2) * 35; x < x1; x += 70) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 30);
      ctx.stroke();
    }
  }
  // portões de ferro (arco escuro com grade)
  const gates = [floor.x + 150, floor.x + floor.w / 2, floor.x + floor.w - 150];
  for (const gx of gates) {
    const gy = top + 60;
    const w = 90;
    const h = 120;
    ctx.fillStyle = '#e0b880';
    ctx.beginPath();
    ctx.moveTo(gx - w / 2 - 10, gy + h);
    ctx.lineTo(gx - w / 2 - 10, gy + w / 2);
    ctx.arc(gx, gy + w / 2, w / 2 + 10, Math.PI, 0);
    ctx.lineTo(gx + w / 2 + 10, gy + h);
    ctx.closePath();
    ctx.fill();
    const dark = ctx.createLinearGradient(0, gy, 0, gy + h);
    dark.addColorStop(0, '#0e0604');
    dark.addColorStop(1, '#2a160a');
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(gx - w / 2, gy + h);
    ctx.lineTo(gx - w / 2, gy + w / 2);
    ctx.arc(gx, gy + w / 2, w / 2, Math.PI, 0);
    ctx.lineTo(gx + w / 2, gy + h);
    ctx.closePath();
    ctx.fill();
    // olhos brilhando lá no escuro (alguma fera esperando)
    ctx.fillStyle = 'rgba(255,200,60,0.8)';
    ctx.beginPath();
    ctx.arc(gx - 6, gy + 70, 2.2, 0, Math.PI * 2);
    ctx.arc(gx + 6, gy + 70, 2.2, 0, Math.PI * 2);
    ctx.fill();
    // grade de ferro
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(gx - w / 2, gy + h);
    ctx.lineTo(gx - w / 2, gy + w / 2);
    ctx.arc(gx, gy + w / 2, w / 2, Math.PI, 0);
    ctx.lineTo(gx + w / 2, gy + h);
    ctx.closePath();
    ctx.clip();
    ctx.strokeStyle = '#3a3a44';
    ctx.lineWidth = 4;
    for (let x = gx - w / 2 + 8; x < gx + w / 2; x += 13) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x, gy + h);
      ctx.stroke();
    }
    for (const y of [gy + 40, gy + 85]) {
      ctx.beginPath();
      ctx.moveTo(gx - w / 2, y);
      ctx.lineTo(gx + w / 2, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(160,160,180,0.5)';
    ctx.lineWidth = 1.2;
    for (let x = gx - w / 2 + 7; x < gx + w / 2; x += 13) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x, gy + h);
      ctx.stroke();
    }
    ctx.restore();
    // pedra do topo do arco
    ctx.fillStyle = '#f2d4a0';
    ctx.fillRect(gx - 8, gy - 10, 16, 14);
  }
  // suportes das tochas entre os portões (o fogo é animado em front)
  for (const tx of fossoTorches(floor)) {
    ctx.fillStyle = '#3a2a1e';
    ctx.fillRect(tx - 3, top + 90, 6, 26);
    ctx.fillStyle = '#6a4a22';
    ctx.fillRect(tx - 8, top + 84, 16, 8);
  }
  // pilares que seguram o palco
  for (const px of [floor.x + 40, floor.x + floor.w / 2 - 28, floor.x + floor.w - 96]) {
    const g = ctx.createLinearGradient(px, 0, px + 56, 0);
    g.addColorStop(0, STONE.deep);
    g.addColorStop(0.4, STONE.mid);
    g.addColorStop(1, STONE.shadow);
    ctx.fillStyle = g;
    ctx.fillRect(px, floor.y + 70, 56, 900);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(px, floor.y + 70, 56, 900);
    ctx.fillStyle = 'rgba(40,20,8,0.3)';
    for (let y = floor.y + 110; y < floor.y + 500; y += 40) ctx.fillRect(px, y, 56, 3);
  }
  // chão de areia lá no fundo, com escudos e lanças velhas
  const sandY = top + 230;
  const sand = ctx.createLinearGradient(0, sandY, 0, sandY + 60);
  sand.addColorStop(0, '#c89a5a');
  sand.addColorStop(1, '#6a4a28');
  ctx.fillStyle = sand;
  ctx.fillRect(x0, sandY, x1 - x0, 400);
  for (let i = 0; i < 10; i++) {
    const x = floor.x + rand() * floor.w;
    ctx.fillStyle = '#8a5a2a';
    ctx.beginPath();
    ctx.ellipse(x, sandY + 8, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 14, sandY + 10);
    ctx.lineTo(x + 40, sandY - 6);
    ctx.stroke();
  }
  // escuridão no fundo
  const deep = ctx.createLinearGradient(0, top, 0, top + 360);
  deep.addColorStop(0, 'rgba(10,4,0,0.1)');
  deep.addColorStop(1, 'rgba(10,4,0,0.75)');
  ctx.fillStyle = deep;
  ctx.fillRect(x0, top, x1 - x0, 1000);
}

const fossoTorches = (floor) => [floor.x + 75, floor.x + floor.w / 2 - 125, floor.x + floor.w / 2 + 125, floor.x + floor.w - 75];

// O palco é desenhado uma vez numa tela própria e copiado a cada quadro: na
// morte súbita só os pedaços que ficam são copiados, e os que caem viram
// blocos caindo girando (aparece o fosso por trás)
let STAGE_SPRITE = null;
function stageSprite(floor) {
  if (STAGE_SPRITE && STAGE_SPRITE.floor === floor) return STAGE_SPRITE;
  const pad = 14;
  const rect = { x: floor.x - pad, y: floor.y - 10, w: floor.w + pad * 2, h: 104 };
  const canvas = document.createElement('canvas');
  canvas.width = rect.w * 2;
  canvas.height = rect.h * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  ctx.translate(-rect.x, -rect.y);
  stage(ctx, floor, seeded(41));
  STAGE_SPRITE = { floor, rect, canvas };
  return STAGE_SPRITE;
}

// copia o pedaço [a, b] do palco
function stagePiece(ctx, sp, a, b) {
  const { rect, canvas } = sp;
  const sx = (a - rect.x) * 2;
  const sw = (b - a) * 2;
  if (sw <= 0) return;
  ctx.drawImage(canvas, sx, 0, sw, rect.h * 2, a, rect.y, b - a, rect.h);
}

function drawTerrain(ctx, map, rand) {
  const floor = map.solids[0];
  fosso(ctx, floor, rand);
  for (const p of map.platforms) if (p.y <= floor.y - 200) slab(ctx, p);
}

// Morte súbita: o palco se abriu (colunas, estátuas e braseiros caem)
let GAME = null;
const sudden = () => Boolean(GAME?.suddenDeath);

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
  // o renderer passa a partida (para saber se o palco já se abriu)
  setGame(game) {
    GAME = game;
  },
  // reações ao que acontece na luta: a torcida pula mais e o imperador faz
  // joinha (alguém derrubou alguém) ou polegar para baixo (caiu sozinho)
  onEvent(e) {
    if (e.type === 'ko') {
      MOOD.excite = 1;
      MOOD.gesture = e.killer != null ? 'up' : 'down';
      MOOD.gestureT = 0;
    } else if (e.type === 'collapse' || e.type === 'wallsWarn') {
      MOOD.excite = 1;
    } else if (e.type === 'hit' && e.kb > 650) {
      MOOD.excite = Math.max(MOOD.excite, 0.5);
    }
  },
  front(ctx, map, time) {
    const floor = map.solids[0];
    // tochas do fosso
    // (o fogo nasce em cima do suporte, que fica em floor.y + 104)
    for (const [i, tx] of fossoTorches(floor).entries()) brazierFire(ctx, tx, floor.y + 104 + 57, time + i);
    const sp = stageSprite(floor);
    if (sudden()) {
      const sd = map.suddenDeath;
      for (const [a, b] of sd.keep) {
        stagePiece(ctx, sp, a, b);
        // beiradas quebradas
        ctx.fillStyle = STONE.dark;
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2;
        for (const [x, dir] of [[a, -1], [b, 1]]) {
          ctx.beginPath();
          ctx.moveTo(x, floor.y - 5);
          for (let i = 0; i <= 6; i++) ctx.lineTo(x + dir * ((i * 37) % 4) * 3, floor.y - 5 + i * 14);
          ctx.lineTo(x, floor.y + 80);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
      // pedaços que caíram: blocos do próprio palco caindo e girando
      const since = GAME.time - sd.start;
      if (since < 3) {
        let x = sp.rect.x;
        const fallen = [];
        for (const [a, b] of sd.keep) {
          if (a > x) fallen.push([x, a]);
          x = Math.max(x, b);
        }
        if (x < sp.rect.x + sp.rect.w) fallen.push([x, sp.rect.x + sp.rect.w]);
        for (const [a, b] of fallen) {
          const n = Math.max(1, Math.round((b - a) / 60));
          for (let i = 0; i < n; i++) {
            const pa = a + ((b - a) * i) / n;
            const pb = a + ((b - a) * (i + 1)) / n;
            const fall = Math.max(0, since - i * 0.08);
            const cx = (pa + pb) / 2;
            ctx.save();
            ctx.globalAlpha = Math.max(0, 1 - fall / 2.2);
            ctx.translate(cx, floor.y + 40 + 700 * fall * fall);
            ctx.rotate((i % 2 ? 1 : -1) * fall * 1.6);
            ctx.translate(-cx, -(floor.y + 40));
            stagePiece(ctx, sp, pa, pb);
            ctx.restore();
          }
        }
      }
      return;
    }
    stagePiece(ctx, sp, sp.rect.x, sp.rect.x + sp.rect.w);
    for (const p of map.platforms) {
      if (p.y <= floor.y - 200) continue;
      brokenColumn(ctx, p, floor.y);
      capital(ctx, p);
    }
    statue(ctx, floor.x + 26, floor.y, 1);
    statue(ctx, floor.x + floor.w - 26, floor.y, -1);
    for (const [x, k] of [[floor.x + 70, 0], [floor.x + floor.w - 70, 1.3]]) {
      brazier(ctx, x, floor.y);
      brazierFire(ctx, x, floor.y, time + k);
    }
  },
  haze: ['rgba(255,180,120,0)', 'rgba(255,170,110,0.25)'],
  vignette: 0.35,
};
