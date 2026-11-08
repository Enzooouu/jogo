// Visuais do tutorial, sem elemento:
//   'manequim' = boneco articulado todo preto e brilhante (o jogador antes de
//                escolher o elemento), com juntas redondas nos cotovelos,
//                joelhos, ombros e quadril
//   'boneco'   = boneco de treino de saco de pano com alvo pintado no peito
// Mesmas coordenadas do fighter.js: origem nos pés, olhando para a direita.

const INK = '#07050a';

// Mortal (sem elemento): o manequim com armadura de aço escuro, frisos de
// ouro, o símbolo dos 4 elementos no peito, cinto com as 4 pedras, visor que
// muda de cor e um lenço com as 4 cores
const ELEM4 = ['#4fd1b8', '#ff6a1f', '#9a6634', '#2f86f0'];
let TIME = 0;
const prism = (o = 0) => `hsl(${(TIME * 60 + o) % 360},90%,68%)`;
const isMan = (skin) => skin === 'manequim' || skin === 'mortal';

const SKINS = {
  manequim: {
    body: '#1c1a22', back: '#121017', hi: 'rgba(190,195,220,0.55)',
    joint: '#26232e', jointHi: 'rgba(230,232,255,0.7)', head: '#1f1d26', rim: 'rgba(160,190,255,0.35)',
  },
  mortal: {
    body: '#363448', back: '#1e1c28', hi: 'rgba(215,220,245,0.65)',
    joint: '#c9a24a', jointHi: 'rgba(255,245,200,0.85)', head: '#2a2836', rim: 'rgba(255,214,120,0.4)',
  },
  boneco: {
    body: '#c9a46a', back: '#9d7c48', hi: 'rgba(255,240,200,0.6)',
    joint: '#7a4f28', jointHi: 'rgba(255,220,170,0.6)', head: '#d2ae74', rim: null,
  },
};

// Pedaço de braço/perna: contorno, cor e um fio de brilho em cima
function bone(ctx, a, b, w, color, hi) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = w + 3.5;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke();
  if (hi) {
    ctx.strokeStyle = hi;
    ctx.lineWidth = w * 0.28;
    ctx.beginPath();
    ctx.moveTo(a.x - w * 0.2, a.y - w * 0.2);
    ctx.lineTo(b.x - w * 0.2, b.y - w * 0.2);
    ctx.stroke();
  }
}

// Junta redonda com reflexo
function joint(ctx, p, r, k) {
  ctx.fillStyle = k.joint;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = k.jointHi;
  ctx.beginPath();
  ctx.arc(p.x - r * 0.35, p.y - r * 0.35, r * 0.38, 0, Math.PI * 2);
  ctx.fill();
}

// Encurta o segmento nas pontas para a junta aparecer entre as peças
function shrink(a, b, gap) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const u = Math.min(0.4, gap / len);
  return [{ x: a.x + dx * u, y: a.y + dy * u }, { x: b.x - dx * u, y: b.y - dy * u }];
}

function limb(ctx, start, l, w, color, hi, k, end) {
  const [a1, b1] = shrink(start, l.mid, 2.5);
  const [a2, b2] = shrink(l.mid, l.end, 2.5);
  bone(ctx, a1, b1, w, color, hi);
  bone(ctx, a2, b2, w * 0.9, color, hi);
  joint(ctx, l.mid, w * 0.5, k);
  end(l);
}

function hand(ctx, p, k, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, 3.6, 4.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = k.jointHi;
  ctx.beginPath();
  ctx.arc(p.x - 1, p.y - 1.5, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

function footShape(ctx, p, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(p.x - 4, p.y - 3);
  ctx.quadraticCurveTo(p.x + 7, p.y - 4, p.x + 8, p.y + 1);
  ctx.lineTo(p.x - 4, p.y + 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// Peito e bacia separados por uma junta na cintura
function body(ctx, skin, k, sh, hip) {
  const waist = { x: (sh.x + hip.x) / 2 + (hip.x - sh.x) * 0.1, y: sh.y + (hip.y - sh.y) * 0.62 };
  const ang = Math.atan2(hip.x - sh.x, hip.y - sh.y);
  // peito: forma de gota invertida
  ctx.save();
  ctx.translate(sh.x, sh.y);
  ctx.rotate(-ang);
  const chestH = (waist.y - sh.y) / Math.cos(ang) + 1;
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.quadraticCurveTo(-9, -3, 0, -3.5);
  ctx.quadraticCurveTo(10, -3, 9, 1);
  ctx.quadraticCurveTo(7, chestH * 0.75, 3, chestH);
  ctx.lineTo(-3, chestH);
  ctx.quadraticCurveTo(-7, chestH * 0.7, -8, 0);
  ctx.closePath();
  const g = ctx.createLinearGradient(-9, 0, 9, 0);
  g.addColorStop(0, k.back);
  g.addColorStop(0.55, k.body);
  g.addColorStop(1, isMan(skin) ? '#3a3846' : '#dcbc84');
  ctx.fillStyle = g;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.clip();
  if (skin === 'mortal') {
    // placa do peito: friso de ouro em V e o símbolo dos 4 elementos
    ctx.strokeStyle = '#e8b23a';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-7, 0.5); ctx.lineTo(0.5, chestH * 0.32); ctx.lineTo(8, 0.5); ctx.stroke();
    const ey = chestH * 0.55;
    const r = 3.4;
    [[0, -1, -1], [1, 1, -1], [2, -1, 1], [3, 1, 1]].forEach(([i, sx, sy]) => {
      ctx.fillStyle = ELEM4[i];
      ctx.beginPath(); ctx.moveTo(1, ey); ctx.lineTo(1 + sx * r, ey); ctx.lineTo(1, ey + sy * r); ctx.closePath(); ctx.fill();
    });
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(1, ey - r); ctx.lineTo(1 + r, ey); ctx.lineTo(1, ey + r); ctx.lineTo(1 - r, ey); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath(); ctx.arc(1, ey, 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = k.hi;
    ctx.beginPath(); ctx.ellipse(5, 3, 1.4, 3.6, 0.2, 0, Math.PI * 2); ctx.fill();
  } else if (skin === 'manequim') {
    // linha do peito e brilho
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 1);
    ctx.lineTo(0, chestH - 2);
    ctx.stroke();
    ctx.fillStyle = k.hi;
    ctx.beginPath();
    ctx.ellipse(4.5, 3.5, 1.6, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // alvo pintado
    for (const [r, c] of [[6, '#e8e0d0'], [4.4, '#d6372e'], [2.8, '#e8e0d0'], [1.4, '#d6372e']]) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(1.5, chestH * 0.45, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // costura
    ctx.strokeStyle = 'rgba(80,50,20,0.7)';
    ctx.lineWidth = 0.9;
    ctx.setLineDash([1.6, 1.6]);
    ctx.beginPath();
    ctx.moveTo(-6, 1);
    ctx.lineTo(-4, chestH - 1);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
  ctx.restore();

  // bacia
  ctx.save();
  ctx.translate(hip.x, hip.y);
  ctx.rotate(-ang);
  ctx.beginPath();
  ctx.moveTo(-6.5, -6);
  ctx.lineTo(6.5, -6);
  ctx.quadraticCurveTo(7.5, 1, 4, 3);
  ctx.lineTo(-4, 3);
  ctx.quadraticCurveTo(-7.5, 1, -6.5, -6);
  ctx.closePath();
  ctx.fillStyle = k.body;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  if (skin === 'mortal') {
    // cinto de ouro com as 4 pedras
    ctx.fillStyle = '#c9a24a';
    ctx.fillRect(-6.8, -6.5, 13.6, 3);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    ctx.strokeRect(-6.8, -6.5, 13.6, 3);
    ELEM4.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(-4.5 + i * 3, -5, 0.95, 0, Math.PI * 2); ctx.fill();
    });
  }
  if (skin === 'boneco') {
    // cordinha amarrando a cintura
    ctx.strokeStyle = '#6b4a22';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-6.5, -5);
    ctx.lineTo(6.5, -5);
    ctx.stroke();
  }
  ctx.restore();
  joint(ctx, waist, 3.4, k);
}

function headShape(ctx, skin, k, h, neck) {
  // pescoço
  bone(ctx, neck, { x: (neck.x + h.x) / 2, y: (neck.y + h.y) / 2 + 3 }, 4, k.body, null);
  ctx.save();
  ctx.translate(h.x, h.y);
  if (isMan(skin)) {
    // cabeça de ovo, levemente inclinada para a frente
    ctx.rotate(0.18);
    ctx.beginPath();
    ctx.ellipse(0.5, -1, 8.5, 10.5, 0, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(-3, -5, 1, 0, 0, 12);
    g.addColorStop(0, '#4a4858');
    g.addColorStop(0.45, k.head);
    g.addColorStop(1, '#0e0c12');
    ctx.fillStyle = g;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.6;
    ctx.fill();
    ctx.stroke();
    // reflexo principal e luz de contorno
    ctx.fillStyle = 'rgba(235,238,255,0.75)';
    ctx.beginPath();
    ctx.ellipse(-3, -6, 2, 3.4, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = k.rim;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0.5, -1, 7, 9, 0, -0.3, 1.2);
    ctx.stroke();
    // emenda do molde e visor
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-8, 1);
    ctx.quadraticCurveTo(0, 3, 8.6, 0);
    ctx.stroke();
    if (skin === 'mortal') {
      // visor que brilha na cor que vai mudando
      ctx.save();
      ctx.shadowColor = prism();
      ctx.shadowBlur = 7;
      ctx.fillStyle = prism();
      ctx.beginPath();
      ctx.moveTo(0.5, -4.2); ctx.quadraticCurveTo(6, -5.2, 8.6, -3); ctx.lineTo(8.4, -0.8); ctx.quadraticCurveTo(5, -2, 0.8, -1.6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(3, -3.8, 2.4, 0.8);
      // crista de ouro no alto da cabeça
      ctx.strokeStyle = '#e8b23a';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(0.5, -1, 8.4, 10.4, 0, -2.2, -1.1); ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(150,170,255,0.18)';
      ctx.beginPath();
      ctx.ellipse(5, -2, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // saco de pano amarrado, olhos de X costurados
    ctx.beginPath();
    ctx.moveTo(-8, 7);
    ctx.quadraticCurveTo(-10, -6, -3, -11);
    ctx.quadraticCurveTo(5, -13, 9, -5);
    ctx.quadraticCurveTo(10, 4, 6, 8);
    ctx.closePath();
    ctx.fillStyle = k.head;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(120,80,40,0.25)';
    for (let i = 0; i < 6; i++) ctx.fillRect(-7 + (i * 5) % 14, -9 + i * 2.6, 1.2, 1.2);
    ctx.strokeStyle = '#3a2410';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (const ex of [1, 6]) {
      ctx.moveTo(ex - 1.6, -4.6);
      ctx.lineTo(ex + 1.6, -1.4);
      ctx.moveTo(ex + 1.6, -4.6);
      ctx.lineTo(ex - 1.6, -1.4);
    }
    ctx.moveTo(1, 3.5);
    ctx.lineTo(7, 3);
    ctx.stroke();
    // palha saindo do topo
    ctx.strokeStyle = '#e8c860';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const [x, a] of [[-3, -0.5], [0, -0.1], [3, 0.4]]) {
      ctx.moveTo(x, -11);
      ctx.lineTo(x + Math.sin(a) * 6, -11 - Math.cos(a) * 6);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// `drawWeapon` (opcional) desenha a arma entre o corpo e o braço da frente
export function drawSkin(ctx, skin, { hip, neck, headPos, shoulder, legF, legB, armF, armB }, time, drawWeapon = null) {
  const k = SKINS[skin] ?? SKINS.manequim;
  TIME = time;
  // sombra de contorno azulada (o manequim brilha um pouco no escuro)
  if (k.rim) {
    const g = ctx.createRadialGradient(0, -34, 4, 0, -34, 46);
    g.addColorStop(0, 'rgba(140,160,255,0.12)');
    g.addColorStop(1, 'rgba(140,160,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-46, -80, 92, 92);
  }
  // Mortal: lenço com as 4 cores voando atrás do pescoço
  if (skin === 'mortal') {
    const wave = (i) => Math.sin(time * 8 - i * 0.9) * 2.2;
    ELEM4.forEach((c, j) => {
      ctx.strokeStyle = c;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(neck.x - 1, neck.y + 1 + j * 1.6);
      for (let i = 1; i <= 5; i++) ctx.lineTo(neck.x - 1 - i * 3.6, neck.y + 1 + j * 1.6 + i * 1.6 + wave(i));
      ctx.stroke();
    });
  }
  // membros de trás
  limb(ctx, hip, legB, 5.5, k.back, null, k, (l) => footShape(ctx, l.end, k.back));
  limb(ctx, shoulder, armB, 4.6, k.back, null, k, (l) => hand(ctx, l.end, k, k.back));
  joint(ctx, hip, 3.6, k);
  body(ctx, skin, k, shoulder, hip);
  limb(ctx, hip, legF, 6, k.body, k.hi, k, (l) => footShape(ctx, l.end, k.body));
  headShape(ctx, skin, k, headPos, neck);
  drawWeapon?.();
  joint(ctx, shoulder, 3.6, k);
  limb(ctx, shoulder, armF, 5, k.body, k.hi, k, (l) => hand(ctx, l.end, k, k.body));
}

// Espantalho do treino livre: preso numa estaca fincada no chão, braços
// abertos na trave, camisa xadrez remendada, cabeça de saco com chapéu de
// palha. Não tem pose: só balança na estaca quando apanha (p.sway).
// Origem nos pés, olhando para a direita (o fighter.js já espelhou).
export function drawScarecrow(ctx, p, time) {
  const sway = (p.sway ?? 0) * p.facing;
  ctx.save();
  // montinho de terra onde a estaca entra
  ctx.fillStyle = '#6b4626';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 1, 15, 5, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  ctx.rotate(sway);
  // um pouquinho de vento mesmo parado
  const breeze = Math.sin(time * 1.7 + 0.6) * 0.6;

  // estaca e trave
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#8a5a32';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(-3, -76, 6, 78);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.rect(-31, -53, 62, 5);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,220,170,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-1.5, -74);
  ctx.lineTo(-1.5, -2);
  ctx.stroke();

  // palha saindo das mangas e da barra da camisa
  const straw = (x, y, dx, dy, n) => {
    ctx.strokeStyle = '#e8c45a';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < n; i++) {
      const s = (i - (n - 1) / 2) * 0.32;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx * 8 + dy * s * 8 + breeze * 0.5, y + dy * 8 - dx * s * 8);
      ctx.stroke();
    }
    ctx.strokeStyle = '#b8902e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx * 6, y + dy * 6 + 1.5);
    ctx.stroke();
  };
  straw(-28, -50, -1, 0.15, 5);
  straw(28, -50, 1, 0.15, 5);
  for (const x of [-10, -4, 3, 9]) straw(x, -20, x * 0.03, 1, 3);

  // camisa xadrez: mangas na trave e o corpo
  const shirt = '#b8483a';
  ctx.fillStyle = shirt;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  const shirtPath = () => {
    ctx.beginPath();
    ctx.moveTo(-28, -56);
    ctx.lineTo(28, -56);
    ctx.lineTo(28, -45);
    ctx.lineTo(13, -44);
    ctx.lineTo(14, -21);
    ctx.lineTo(8, -23);
    ctx.lineTo(3, -20);
    ctx.lineTo(-3, -23);
    ctx.lineTo(-8, -20);
    ctx.lineTo(-14, -22);
    ctx.lineTo(-13, -44);
    ctx.lineTo(-28, -45);
    ctx.closePath();
  };
  shirtPath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(40,20,30,0.45)';
  ctx.lineWidth = 2;
  for (let x = -26; x <= 26; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, -58);
    ctx.lineTo(x, -18);
    ctx.stroke();
  }
  for (let y = -54; y <= -20; y += 7) {
    ctx.beginPath();
    ctx.moveTo(-30, y);
    ctx.lineTo(30, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,220,180,0.25)';
  ctx.lineWidth = 0.8;
  for (let x = -23; x <= 26; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, -58);
    ctx.lineTo(x, -18);
    ctx.stroke();
  }
  // remendo azul costurado
  ctx.fillStyle = '#4a6fa8';
  ctx.fillRect(-10, -38, 8, 8);
  ctx.strokeStyle = '#e8dcc0';
  ctx.lineWidth = 0.9;
  ctx.setLineDash([1.6, 1.4]);
  ctx.strokeRect(-9.2, -37.2, 6.4, 6.4);
  ctx.setLineDash([]);
  ctx.restore();
  // contorno da camisa (refaz o caminho: o último traço era uma listra do
  // xadrez, que aparecia solta do lado do espantalho)
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  shirtPath();
  ctx.stroke();
  // cinto de corda
  ctx.strokeStyle = '#d9b46a';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-13.5, -28);
  ctx.lineTo(13.5, -28);
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(4, -28);
  ctx.lineTo(6, -23);
  ctx.moveTo(4, -28);
  ctx.lineTo(2, -23.5);
  ctx.stroke();

  // cabeça de saco amarrada com corda
  ctx.fillStyle = '#d8b77a';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-6, -56);
  ctx.quadraticCurveTo(-13, -60, -11, -68);
  ctx.quadraticCurveTo(-8, -77, 1, -77);
  ctx.quadraticCurveTo(11, -76, 11, -67);
  ctx.quadraticCurveTo(12, -59, 6, -56);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(120,80,40,0.25)';
  for (let i = 0; i < 7; i++) ctx.fillRect(-8 + ((i * 5) % 16), -74 + i * 2.4, 1.2, 1.2);
  ctx.strokeStyle = '#8a6a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6.5, -57.5);
  ctx.lineTo(6.5, -57.5);
  ctx.stroke();
  // olhos de botão e boca costurada
  ctx.fillStyle = '#2a1a12';
  for (const ex of [0.5, 6.5]) {
    ctx.beginPath();
    ctx.arc(ex, -68, 1.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#3a2410';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-1, -62.5);
  ctx.quadraticCurveTo(3.5, -60, 8.5, -63);
  for (let x = 0; x <= 8; x += 2.6) {
    ctx.moveTo(x, -63.6);
    ctx.lineTo(x + 0.4, -60.6);
  }
  ctx.stroke();

  // chapéu de palha
  ctx.save();
  ctx.translate(0, -75);
  ctx.rotate(-0.08 + breeze * 0.02);
  ctx.fillStyle = '#e2c26a';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.quadraticCurveTo(-8, -10, 0, -11);
  ctx.quadraticCurveTo(8, -10, 8, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#b8483a';
  ctx.fillRect(-8, -3.5, 16, 3);
  ctx.fillStyle = '#e2c26a';
  ctx.beginPath();
  ctx.ellipse(0, 0.5, 18, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(150,110,40,0.6)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(0, 0.5, 13, 2.2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}
