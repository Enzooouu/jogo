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
    // boneco de pano: juntas amarradas com corda, costura nos membros e palha
    rope: true, seam: 'rgba(90,58,26,0.75)', straw: true,
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
  if (k.rope) {
    // corda enrolada amarrando a junta
    ctx.fillStyle = '#8a6232';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#d9b46a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const o of [-0.45, 0.15]) {
      ctx.moveTo(p.x - r * 0.75, p.y + r * o - r * 0.25);
      ctx.lineTo(p.x + r * 0.75, p.y + r * o + r * 0.25);
    }
    ctx.stroke();
    return;
  }
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
  if (k.seam) {
    // costura tracejada ao longo do braço/perna
    ctx.strokeStyle = k.seam;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([1.4, 1.3]);
    ctx.beginPath();
    for (const [a, b] of [[a1, b1], [a2, b2]]) {
      ctx.moveTo(a.x + w * 0.18, a.y + w * 0.18);
      ctx.lineTo(b.x + w * 0.18, b.y + w * 0.18);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  joint(ctx, l.mid, w * 0.5, k);
  end(l);
}

function hand(ctx, p, k, color) {
  if (k.straw) {
    // palha escapando da luva de pano
    ctx.strokeStyle = '#e8c860';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const [dx, dy] of [[-4.5, 2.5], [-3.5, 4.5], [4, 3.5]]) {
      ctx.moveTo(p.x, p.y + 1);
      ctx.lineTo(p.x + dx, p.y + dy + 1);
    }
    ctx.stroke();
  }
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
    // trama do pano
    ctx.strokeStyle = 'rgba(110,72,32,0.18)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let y = -3; y < chestH + 2; y += 1.8) {
      ctx.moveTo(-10, y);
      ctx.lineTo(10, y + 0.4);
    }
    ctx.stroke();
    // alvo pintado (meio gasto de tanto apanhar)
    const ty = chestH * 0.45;
    ctx.fillStyle = 'rgba(30,18,10,0.35)';
    ctx.beginPath();
    ctx.arc(1.5, ty + 0.6, 6.6, 0, Math.PI * 2);
    ctx.fill();
    for (const [r, c] of [[6.2, '#efe6d2'], [4.6, '#d6372e'], [3, '#efe6d2'], [1.5, '#d6372e']]) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(1.5, ty, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(60,20,10,0.55)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(1.5, ty, 6.2, 0, Math.PI * 2);
    ctx.stroke();
    // marcas de pancada
    ctx.fillStyle = 'rgba(120,80,40,0.45)';
    for (const [x, y, r] of [[-1.5, ty - 2.5, 0.9], [4, ty + 2, 0.7], [-4.5, ty + 4.5, 0.8]]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // costura do lado
    ctx.strokeStyle = 'rgba(80,50,20,0.75)';
    ctx.lineWidth = 0.9;
    ctx.setLineDash([1.6, 1.6]);
    ctx.beginPath();
    ctx.moveTo(-6, 1);
    ctx.lineTo(-4.5, chestH - 1);
    ctx.stroke();
    ctx.setLineDash([]);
    // remendo xadrez embaixo do alvo
    ctx.fillStyle = '#6f8fb8';
    ctx.fillRect(3, chestH - 5.5, 4.5, 4);
    ctx.strokeStyle = '#efe6d2';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(3.4, chestH - 5.1, 3.7, 3.2);
    // luz no ombro
    ctx.fillStyle = 'rgba(255,240,200,0.25)';
    ctx.beginPath();
    ctx.ellipse(-3.5, 1.5, 3.5, 1.6, -0.2, 0, Math.PI * 2);
    ctx.fill();
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
    // corda trançada amarrando a cintura, com nó e pontas soltas
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-7, -5);
    ctx.lineTo(7, -5);
    ctx.stroke();
    ctx.strokeStyle = '#d9b46a';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.strokeStyle = '#a8823e';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let x = -6; x <= 6; x += 2) {
      ctx.moveTo(x, -6);
      ctx.lineTo(x + 1, -4);
    }
    ctx.stroke();
    ctx.strokeStyle = '#d9b46a';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(3, -5);
    ctx.lineTo(4.5, -0.5);
    ctx.moveTo(3, -5);
    ctx.lineTo(1.5, -1);
    ctx.stroke();
    ctx.fillStyle = '#d9b46a';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(3, -5, 1.4, 0, Math.PI * 2);
    ctx.fill();
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
    const sackPath = () => {
      ctx.beginPath();
      ctx.moveTo(-8, 7);
      ctx.quadraticCurveTo(-10, -6, -3, -11);
      ctx.quadraticCurveTo(5, -13, 9, -5);
      ctx.quadraticCurveTo(10, 4, 6, 8);
      ctx.closePath();
    };
    // palha saindo do topo (atrás do saco)
    ctx.lineWidth = 1.2;
    for (const [x, a, c] of [[-4, -0.6, '#c99a38'], [-2, -0.25, '#e8c860'], [0.5, 0.05, '#f0d478'], [3, 0.4, '#e8c860'], [5, 0.75, '#c99a38']]) {
      ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.moveTo(x, -9.5);
      ctx.quadraticCurveTo(x + Math.sin(a) * 3, -12.5, x + Math.sin(a) * 6.5, -10 - Math.cos(a) * 6.5);
      ctx.stroke();
    }
    const sack = ctx.createRadialGradient(-2, -5, 1, 0, -1, 12);
    sack.addColorStop(0, '#e6c88e');
    sack.addColorStop(0.6, k.head);
    sack.addColorStop(1, '#a8874f');
    ctx.fillStyle = sack;
    sackPath();
    ctx.fill();
    ctx.save();
    sackPath();
    ctx.clip();
    // trama do pano
    ctx.strokeStyle = 'rgba(110,72,32,0.2)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let y = -12; y < 9; y += 1.8) {
      ctx.moveTo(-11, y);
      ctx.lineTo(11, y + 0.5);
    }
    for (let x = -10; x < 11; x += 1.8) {
      ctx.moveTo(x, -13);
      ctx.lineTo(x + 0.4, 9);
    }
    ctx.stroke();
    // curativo em X na testa (de tanto apanhar)
    ctx.save();
    ctx.translate(-3.5, -7);
    for (const r of [0.6, -0.6]) {
      ctx.save();
      ctx.rotate(r);
      ctx.fillStyle = '#fff3dc';
      ctx.strokeStyle = 'rgba(70,40,20,0.8)';
      ctx.lineWidth = 0.6;
      ctx.fillRect(-3.8, -1.2, 7.6, 2.4);
      ctx.strokeRect(-3.8, -1.2, 7.6, 2.4);
      ctx.fillStyle = '#e8b4a0';
      ctx.fillRect(-1, -1.2, 2, 2.4);
      ctx.restore();
    }
    ctx.restore();
    ctx.restore();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    sackPath();
    ctx.stroke();
    // olhos de X costurados (linha grossa escura)
    ctx.strokeStyle = '#2e1a0c';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (const ex of [1.5, 6.5]) {
      ctx.moveTo(ex - 1.7, -4.8);
      ctx.lineTo(ex + 1.7, -1.4);
      ctx.moveTo(ex + 1.7, -4.8);
      ctx.lineTo(ex - 1.7, -1.4);
    }
    ctx.stroke();
    // boca costurada em zigue-zague
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0.5, 3.6);
    for (let i = 1; i <= 6; i++) ctx.lineTo(0.5 + i, 3.6 + (i % 2 ? -1 : 0) - i * 0.08);
    ctx.stroke();
    // corda amarrando o saco no pescoço
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-7.5, 6.6);
    ctx.lineTo(6.5, 7.4);
    ctx.stroke();
    ctx.strokeStyle = '#a8823e';
    ctx.lineWidth = 1.8;
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
  // um pouquinho de vento mesmo parado
  const breeze = Math.sin(time * 1.7 + 0.6) * 0.6;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // montinho de terra com tufos de capim
  ctx.fillStyle = '#6b4626';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 1, 16, 5.5, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#87603a';
  ctx.beginPath();
  ctx.ellipse(-4, -1.6, 7, 1.6, 0, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#5f9a45';
  ctx.lineWidth = 1.2;
  for (const [x, h, d] of [[-13, 5, -1], [-11, 6.5, 0.6], [11, 6, -0.5], [13.5, 4.5, 1]]) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.quadraticCurveTo(x + d, -h * 0.6, x + d * 2 + breeze * 0.4, -h);
    ctx.stroke();
  }

  ctx.rotate(sway);

  // estaca e trave de madeira (com veios, pregos e corda amarrando)
  const wood = ctx.createLinearGradient(-3, 0, 3, 0);
  wood.addColorStop(0, '#a5723f');
  wood.addColorStop(1, '#6e4524');
  ctx.fillStyle = wood;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(-3, -76, 6, 78);
  ctx.fill();
  ctx.stroke();
  const beam = ctx.createLinearGradient(0, -53, 0, -48);
  beam.addColorStop(0, '#a5723f');
  beam.addColorStop(1, '#6e4524');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.rect(-31, -53, 62, 5);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(60,30,10,0.45)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-0.8, -18);
  ctx.quadraticCurveTo(0.6, -10, -0.6, 0);
  ctx.moveTo(1.4, -16);
  ctx.lineTo(1.2, -4);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,225,180,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-1.8, -19);
  ctx.lineTo(-1.8, -1);
  ctx.stroke();

  // palha saindo das mangas, amarrada com barbante
  const straw = (x, y, dx, dy, n, len = 9) => {
    for (let i = 0; i < n; i++) {
      const s = (i - (n - 1) / 2) * 0.3;
      const l = len * (0.75 + ((i * 37) % 10) / 30);
      ctx.strokeStyle = i % 3 === 1 ? '#c99a38' : '#ecd070';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + dx * l * 0.5, y + dy * l * 0.5, x + dx * l + dy * s * l + breeze * 0.5, y + dy * l - dx * s * l);
      ctx.stroke();
    }
  };
  straw(-28, -50.5, -1, 0.12, 7);
  straw(28, -50.5, 1, 0.12, 7);
  for (const x of [-11, -6, -1, 4, 9]) straw(x, -21, x * 0.035, 1, 3, 8);

  // camisa xadrez de flanela
  const shirtPath = () => {
    ctx.beginPath();
    ctx.moveTo(-28, -56);
    ctx.lineTo(28, -56);
    ctx.lineTo(28.5, -45);
    ctx.lineTo(13, -44);
    ctx.lineTo(14, -21);
    ctx.lineTo(9, -23.5);
    ctx.lineTo(4, -20.5);
    ctx.lineTo(-1, -23);
    ctx.lineTo(-6, -20);
    ctx.lineTo(-10, -22.5);
    ctx.lineTo(-14, -21);
    ctx.lineTo(-13, -44);
    ctx.lineTo(-28.5, -45);
    ctx.closePath();
  };
  ctx.fillStyle = '#c0483a';
  shirtPath();
  ctx.fill();
  ctx.save();
  shirtPath();
  ctx.clip();
  // faixas escuras largas (verticais e horizontais)
  ctx.fillStyle = 'rgba(70,14,24,0.38)';
  for (let x = -27; x <= 27; x += 9) ctx.fillRect(x, -60, 3.6, 44);
  for (let y = -55; y <= -20; y += 9) ctx.fillRect(-32, y, 64, 3.6);
  // linhas finas amarelas
  ctx.fillStyle = 'rgba(255,214,120,0.35)';
  for (let x = -22.5; x <= 27; x += 9) ctx.fillRect(x, -60, 0.8, 44);
  for (let y = -50.5; y <= -20; y += 9) ctx.fillRect(-32, y, 64, 0.8);
  // sombra do lado direito e luz no ombro esquerdo
  const shade = ctx.createLinearGradient(-28, 0, 28, 0);
  shade.addColorStop(0, 'rgba(255,220,180,0.12)');
  shade.addColorStop(0.55, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(30,6,12,0.35)');
  ctx.fillStyle = shade;
  ctx.fillRect(-32, -60, 64, 44);
  // dobrinhas da camisa
  ctx.strokeStyle = 'rgba(40,8,16,0.4)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-9, -40);
  ctx.quadraticCurveTo(-7, -34, -9, -28);
  ctx.moveTo(10, -42);
  ctx.quadraticCurveTo(8.5, -36, 10, -31);
  ctx.stroke();
  // remendo azul costurado
  ctx.fillStyle = '#4a6fa8';
  ctx.fillRect(-11, -39, 8, 8);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(-11, -39, 8, 2);
  ctx.strokeStyle = '#efe4c8';
  ctx.lineWidth = 0.9;
  ctx.setLineDash([1.6, 1.4]);
  ctx.strokeRect(-10.2, -38.2, 6.4, 6.4);
  ctx.setLineDash([]);
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  shirtPath();
  ctx.stroke();
  // barbante amarrando as mangas
  ctx.strokeStyle = '#d9b46a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-26.5, -55.5);
  ctx.lineTo(-26.5, -45.5);
  ctx.moveTo(26.5, -55.5);
  ctx.lineTo(26.5, -45.5);
  ctx.stroke();
  // gola e botões
  ctx.fillStyle = '#8a2a2a';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, -55);
    ctx.lineTo(sgn * 7.5, -56.5);
    ctx.lineTo(sgn * 4.5, -50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#efe4c8';
  for (const y of [-46, -40, -34]) {
    ctx.beginPath();
    ctx.arc(1.5, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // cinto de corda com nó
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.moveTo(-13.5, -28);
  ctx.lineTo(13.5, -28);
  ctx.stroke();
  ctx.strokeStyle = '#d9b46a';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.strokeStyle = '#a8823e';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let x = -12; x <= 12; x += 2.4) {
    ctx.moveTo(x, -29);
    ctx.lineTo(x + 1.2, -27);
  }
  ctx.stroke();
  ctx.strokeStyle = '#d9b46a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(5, -28);
  ctx.quadraticCurveTo(7, -24, 6 + breeze, -21);
  ctx.moveTo(5, -28);
  ctx.quadraticCurveTo(3.5, -24.5, 3 + breeze, -22);
  ctx.stroke();
  ctx.fillStyle = '#d9b46a';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(5, -28, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // cabeça de saco (juta) amarrada no pescoço
  const sackPath = () => {
    ctx.beginPath();
    ctx.moveTo(-6, -56);
    ctx.quadraticCurveTo(-13, -60, -11.5, -68);
    ctx.quadraticCurveTo(-8.5, -77.5, 1, -77.5);
    ctx.quadraticCurveTo(11.5, -76.5, 11.5, -67);
    ctx.quadraticCurveTo(12, -59, 6, -56);
    ctx.closePath();
  };
  const sack = ctx.createRadialGradient(-2, -71, 2, 1, -66, 14);
  sack.addColorStop(0, '#ecd09a');
  sack.addColorStop(0.6, '#d8b77a');
  sack.addColorStop(1, '#b8945a');
  ctx.fillStyle = sack;
  sackPath();
  ctx.fill();
  ctx.save();
  sackPath();
  ctx.clip();
  // trama do tecido
  ctx.strokeStyle = 'rgba(120,80,40,0.2)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let y = -77; y < -56; y += 2.2) {
    ctx.moveTo(-13, y);
    ctx.lineTo(13, y + 0.6);
  }
  for (let x = -12; x < 13; x += 2.2) {
    ctx.moveTo(x, -78);
    ctx.lineTo(x + 0.5, -55);
  }
  ctx.stroke();
  // costura do lado
  ctx.strokeStyle = 'rgba(90,55,25,0.7)';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([1.4, 1.4]);
  ctx.beginPath();
  ctx.moveTo(-9.5, -59);
  ctx.quadraticCurveTo(-11.5, -67, -7, -75);
  ctx.stroke();
  ctx.setLineDash([]);
  // bochechas
  ctx.fillStyle = 'rgba(220,110,90,0.28)';
  ctx.beginPath();
  ctx.ellipse(-1.5, -63.5, 2.2, 1.4, 0, 0, Math.PI * 2);
  ctx.ellipse(9.5, -63.5, 2, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  sackPath();
  ctx.stroke();
  // olhos de botão (com os furinhos)
  for (const ex of [0.8, 7]) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(ex, -68, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a3428';
    ctx.beginPath();
    ctx.arc(ex, -68, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8b77a';
    for (const [hx, hy] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) ctx.fillRect(ex + hx - 0.3, -68 + hy - 0.3, 0.6, 0.6);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(ex - 1.4, -69.6, 0.9, 0.9);
  }
  // boca costurada (sorriso)
  ctx.strokeStyle = '#3a2410';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-1, -62.8);
  ctx.quadraticCurveTo(4, -59.6, 9, -63);
  ctx.stroke();
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (let x = 0.2; x <= 8.2; x += 2) {
    const y = -62.6 + Math.sin(((x + 1) / 10) * Math.PI) * 1.9;
    ctx.moveTo(x, y - 1.4);
    ctx.lineTo(x + 0.3, y + 1.4);
  }
  ctx.stroke();
  // corda no pescoço com palha saindo por baixo
  for (const [x, d] of [[-4, -0.4], [-1, 0], [2.5, 0.3], [5.5, 0.5]]) {
    ctx.strokeStyle = '#ecd070';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x, -57);
    ctx.lineTo(x + d * 4 + breeze * 0.3, -53.5);
    ctx.stroke();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(-7, -57.5);
  ctx.lineTo(7, -57.5);
  ctx.stroke();
  ctx.strokeStyle = '#a8823e';
  ctx.lineWidth = 2;
  ctx.stroke();

  // chapéu de palha: copa e aba trançadas, fita vermelha com laço, fiapos
  ctx.save();
  ctx.translate(0, -75);
  ctx.rotate(-0.08 + breeze * 0.02);
  const strawFill = ctx.createLinearGradient(0, -12, 0, 2);
  strawFill.addColorStop(0, '#f2d886');
  strawFill.addColorStop(1, '#d0aa52');
  // copa
  ctx.fillStyle = strawFill;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  const crownPath = () => {
    ctx.beginPath();
    ctx.moveTo(-8.5, 0);
    ctx.quadraticCurveTo(-9, -11, 0, -12);
    ctx.quadraticCurveTo(9, -11, 8.5, 0);
    ctx.closePath();
  };
  crownPath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(150,105,35,0.55)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let y = -10; y < 0; y += 2) {
    ctx.moveTo(-10, y);
    ctx.lineTo(10, y);
  }
  ctx.stroke();
  ctx.restore();
  // contorno: refaz o formato da copa (o último traço era a trama)
  crownPath();
  ctx.stroke();
  // fita com laço
  ctx.fillStyle = '#b8283a';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.rect(-8.8, -6.6, 17.6, 3.6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e04a58';
  ctx.beginPath();
  ctx.moveTo(-4.5, -4.8);
  ctx.lineTo(-8, -8);
  ctx.lineTo(-8.2, -2);
  ctx.closePath();
  ctx.moveTo(-4.5, -4.8);
  ctx.lineTo(-1, -8);
  ctx.lineTo(-0.8, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#9a1e2c';
  ctx.beginPath();
  ctx.arc(-4.5, -4.8, 1.3, 0, Math.PI * 2);
  ctx.fill();
  // aba
  ctx.fillStyle = strawFill;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0.6, 19, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(150,105,35,0.6)';
  ctx.lineWidth = 0.7;
  for (const r of [15.5, 12]) {
    ctx.beginPath();
    ctx.ellipse(0, 0.6, r, r * 0.2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // fiapos de palha soltos na beira da aba
  ctx.strokeStyle = '#e2c26a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const [x, dx, dy] of [[-18, -2.5, 1.5], [-15, -1, 3], [16, 2, 2.4], [18.5, 2.6, 0.6], [6, 0.6, 3.6]]) {
    const y = 0.6 + Math.sqrt(Math.max(0, 1 - (x / 19) ** 2)) * 3.6;
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx + breeze * 0.4, y + dy);
  }
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}
