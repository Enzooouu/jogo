// Visuais do tutorial, sem elemento:
//   'manequim' = boneco articulado todo preto e brilhante (o jogador antes de
//                escolher o elemento), com juntas redondas nos cotovelos,
//                joelhos, ombros e quadril
//   'boneco'   = boneco de treino de saco de pano com alvo pintado no peito
// Mesmas coordenadas do fighter.js: origem nos pés, olhando para a direita.

const INK = '#07050a';

const SKINS = {
  manequim: {
    body: '#1c1a22', back: '#121017', hi: 'rgba(190,195,220,0.55)',
    joint: '#26232e', jointHi: 'rgba(230,232,255,0.7)', head: '#1f1d26', rim: 'rgba(160,190,255,0.35)',
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
  g.addColorStop(1, skin === 'manequim' ? '#3a3846' : '#dcbc84');
  ctx.fillStyle = g;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.clip();
  if (skin === 'manequim') {
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
  if (skin === 'manequim') {
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
    ctx.fillStyle = 'rgba(150,170,255,0.18)';
    ctx.beginPath();
    ctx.ellipse(5, -2, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
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

export function drawSkin(ctx, skin, { hip, neck, headPos, shoulder, legF, legB, armF, armB }, time) {
  const k = SKINS[skin] ?? SKINS.manequim;
  // sombra de contorno azulada (o manequim brilha um pouco no escuro)
  if (k.rim) {
    const g = ctx.createRadialGradient(0, -34, 4, 0, -34, 46);
    g.addColorStop(0, 'rgba(140,160,255,0.12)');
    g.addColorStop(1, 'rgba(140,160,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-46, -80, 92, 92);
  }
  // membros de trás
  limb(ctx, hip, legB, 5.5, k.back, null, k, (l) => footShape(ctx, l.end, k.back));
  limb(ctx, shoulder, armB, 4.6, k.back, null, k, (l) => hand(ctx, l.end, k, k.back));
  joint(ctx, hip, 3.6, k);
  body(ctx, skin, k, shoulder, hip);
  limb(ctx, hip, legF, 6, k.body, k.hi, k, (l) => footShape(ctx, l.end, k.body));
  headShape(ctx, skin, k, headPos, neck);
  joint(ctx, shoulder, 3.6, k);
  limb(ctx, shoulder, armF, 5, k.body, k.hi, k, (l) => hand(ctx, l.end, k, k.body));
}
