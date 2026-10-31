// Desenho das armas de cada elemento e do que o cajado lança.
// Convenção: origem na mão (empunhadura), a arma aponta para -y.

const INK = '#0b0710';

// ====================================================================== espadas

export function drawSwordArt(ctx, element, t) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (element === 'agua') tideBlade(ctx, t);
  else if (element === 'terra') stoneBlade(ctx, t);
  else if (element === 'ar') windBlade(ctx, t);
  else flameBlade(ctx, t);
  ctx.restore();
}

// Punho enrolado com anéis e pomo (gem = pedra do pomo)
function handle(ctx, wrap, ring, gem, len = 11) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, len - 3); ctx.stroke();
  ctx.strokeStyle = wrap;
  ctx.lineWidth = 4;
  ctx.stroke();
  // faixas do couro (claro em cima, sombra embaixo)
  for (let y = -2; y < len - 3; y += 3) {
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-1.9, y); ctx.lineTo(1.9, y + 1.4); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.moveTo(-1.9, y + 1.2); ctx.lineTo(1.9, y + 2.6); ctx.stroke();
  }
  // anel de metal
  ctx.fillStyle = ring;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.rect(-3, len - 4.5, 6, 2.4); ctx.fill(); ctx.stroke();
  // pomo com pedra
  ctx.fillStyle = ring;
  ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(0, len, 3.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = gem;
  ctx.beginPath(); ctx.arc(0, len, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath(); ctx.arc(-0.6, len - 0.7, 0.6, 0, Math.PI * 2); ctx.fill();
}

function outline(ctx, w = 2.2) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = w;
  ctx.stroke();
}

function shape(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

// Lado da sombra de uma lâmina: preenche só a metade direita (x > cx)
function shadeRight(ctx, pts, color, cx = 0) {
  ctx.save();
  shape(ctx, pts);
  ctx.clip();
  ctx.fillStyle = color;
  ctx.fillRect(cx, -80, 30, 100);
  ctx.restore();
}

// ---------------------------------------------------------------- Fogo
// Lâmina de obsidiana com dentes de chama no dorso, rachaduras de magma e
// guarda de ferro com chifres e uma brasa no meio
function flameBlade(ctx, t) {
  handle(ctx, '#7a1f14', '#c9a14a', '#ff8a2a');
  // chamas lambendo o dorso (atrás da lâmina)
  for (let i = 0; i < 3; i++) {
    const y = -18 - i * 11;
    const fl = Math.sin(t * 13 + i * 1.9) * 2;
    for (const [w, c] of [[1, '#ff5a14'], [0.6, '#ffc24a']]) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(4, y + 5 * w);
      ctx.quadraticCurveTo(10 * w + 2, y + 1, 9 * w + 3 + fl, y - 8 * w);
      ctx.quadraticCurveTo(6, y - 2, 4, y - 3 * w);
      ctx.closePath();
      ctx.fill();
    }
  }
  const blade = [[-4.5, -7], [-4.2, -40], [-1.5, -52], [1, -57], [4.6, -44], [6.2, -40], [4.4, -36], [6.4, -30], [4.4, -25], [6.4, -19], [4.4, -14], [4.6, -7]];
  shape(ctx, blade);
  const g = ctx.createLinearGradient(-5, 0, 6, 0);
  g.addColorStop(0, '#5a3330');
  g.addColorStop(0.45, '#2c1518');
  g.addColorStop(1, '#140a0c');
  ctx.fillStyle = g;
  ctx.fill();
  // fio da lâmina claro
  ctx.strokeStyle = 'rgba(255,190,150,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-3.6, -9); ctx.lineTo(-3.4, -40); ctx.lineTo(-0.9, -51); ctx.stroke();
  // rachaduras de magma (miolo amarelo, borda laranja)
  const pulse = 0.75 + Math.sin(t * 7) * 0.25;
  for (const [w, c] of [[2.4, `rgba(255,90,20,${pulse})`], [1, '#ffe08a']]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(0.5, -9); ctx.lineTo(-0.6, -18); ctx.lineTo(1.2, -26); ctx.lineTo(-0.4, -35); ctx.lineTo(0.8, -44); ctx.lineTo(0.2, -50);
    ctx.moveTo(-0.6, -18); ctx.lineTo(-2.6, -22);
    ctx.moveTo(-0.4, -35); ctx.lineTo(2.6, -38);
    ctx.stroke();
  }
  shape(ctx, blade);
  outline(ctx);
  // calor saindo da base da lâmina
  const heat = ctx.createLinearGradient(0, -7, 0, -20);
  heat.addColorStop(0, `rgba(255,120,40,${0.45 * pulse})`);
  heat.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.save();
  shape(ctx, blade);
  ctx.clip();
  ctx.fillStyle = heat;
  ctx.fillRect(-6, -20, 14, 14);
  ctx.restore();
  // guarda de ferro com chifres
  const guard = [[-12, -12], [-9, -6], [-3, -4.5], [3, -4.5], [9, -6], [12, -12], [10.5, -4], [4, -1.5], [-4, -1.5], [-10.5, -4]];
  shape(ctx, guard);
  ctx.fillStyle = '#3a2a2e';
  ctx.fill();
  shadeRight(ctx, guard, 'rgba(0,0,0,0.35)');
  shape(ctx, guard);
  outline(ctx, 1.8);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(-8, -5.5, 6, 1);
  // brasa no meio da guarda
  ctx.shadowColor = '#ff7a1a';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ffb347';
  shape(ctx, [[0, -6.5], [2.4, -3.6], [0, -0.8], [-2.4, -3.6]]);
  ctx.fill();
  ctx.shadowBlur = 0;
  outline(ctx, 1.2);
}

// ---------------------------------------------------------------- Água
// Lâmina curva de água cristalina com crista de onda, corrente de luz
// descendo por dentro, guarda de concha e pomo de pérola
function tideBlade(ctx, t) {
  handle(ctx, '#1f6f8f', '#e6d6b8', '#f4fbff');
  const blade = new Path2D();
  blade.moveTo(-3.4, -7);
  blade.quadraticCurveTo(-6.5, -30, 2, -55);
  blade.quadraticCurveTo(7, -48, 6.2, -41);
  for (let i = 0; i < 4; i++) {
    const y = -41 + i * 8;
    blade.quadraticCurveTo(9.5, y + 2, 5.6, y + 6);
    blade.quadraticCurveTo(4.6, y + 7, 6, y + 8);
  }
  blade.lineTo(3.8, -7);
  blade.closePath();
  const g = ctx.createLinearGradient(-6, 0, 8, 0);
  g.addColorStop(0, 'rgba(225,250,255,0.98)');
  g.addColorStop(0.4, 'rgba(120,205,255,0.95)');
  g.addColorStop(1, 'rgba(25,95,200,0.98)');
  ctx.fillStyle = g;
  ctx.fill(blade);
  ctx.save();
  ctx.clip(blade);
  // corrente de luz descendo
  for (let i = 0; i < 3; i++) {
    const y = -55 + ((t * 30 + i * 16) % 48);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.ellipse(-0.5 + Math.sin(y * 0.2) * 1.2, y, 1.1, 4, 0.15, 0, Math.PI * 2); ctx.fill();
  }
  // espuma na crista
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const y = -41 + i * 8;
    ctx.moveTo(6.5, y + 1); ctx.quadraticCurveTo(8, y + 3, 5.4, y + 5.5);
  }
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-2, -10); ctx.quadraticCurveTo(-4.4, -30, 1.6, -50); ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.stroke(blade);
  // gota pingando
  const k = (t * 1.4) % 1;
  ctx.fillStyle = `rgba(170,230,255,${1 - k})`;
  ctx.beginPath();
  ctx.moveTo(7.5 + k * 2, -45 + k * 12 - 2);
  ctx.quadraticCurveTo(9 + k * 2, -45 + k * 12 + 1, 7.5 + k * 2, -45 + k * 12 + 2);
  ctx.quadraticCurveTo(6 + k * 2, -45 + k * 12 + 1, 7.5 + k * 2, -45 + k * 12 - 2);
  ctx.fill();
  // guarda de concha com estrias
  ctx.fillStyle = '#f2e3c6';
  ctx.beginPath(); ctx.moveTo(-8, -3); ctx.quadraticCurveTo(-8, -12, 0, -12.5); ctx.quadraticCurveTo(8, -12, 8, -3); ctx.closePath();
  ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = 'rgba(200,150,120,0.35)';
  ctx.fillRect(0, -14, 9, 12);
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(-8, -3); ctx.quadraticCurveTo(-8, -12, 0, -12.5); ctx.quadraticCurveTo(8, -12, 8, -3); ctx.closePath();
  outline(ctx, 1.8);
  ctx.strokeStyle = 'rgba(140,90,60,0.6)';
  ctx.lineWidth = 0.9;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(i * 2.4, -11.5 + Math.abs(i) * 0.8); ctx.stroke();
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(0, -3.5, 1.6, 0, Math.PI * 2); ctx.fill();
}

// ---------------------------------------------------------------- Terra
// Espadão de pedra lapidada em facetas, veios de âmbar acesos, musgo e
// guarda de pedra com tiras de metal
function stoneBlade(ctx, t) {
  handle(ctx, '#7a5434', '#8a8a92', '#ffb347', 13);
  const blade = [[-6.5, -7], [-7.8, -36], [-5.5, -50], [0, -56], [5, -52], [7.8, -40], [7, -7]];
  shape(ctx, blade);
  ctx.fillStyle = '#9a7a54';
  ctx.fill();
  // facetas: esquerda clara, meio, direita escura
  ctx.save();
  shape(ctx, blade);
  ctx.clip();
  ctx.fillStyle = '#b8966a';
  shape(ctx, [[-8, -7], [-8, -36], [-5.5, -50], [0, -56], [-1, -40], [-2, -7]]);
  ctx.fill();
  ctx.fillStyle = '#6a5034';
  shape(ctx, [[2.5, -7], [2, -38], [0, -56], [5, -52], [8, -40], [8, -7]]);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  shape(ctx, [[-1, -40], [0, -56], [2, -38]]);
  ctx.fill();
  // rachaduras
  ctx.strokeStyle = 'rgba(30,15,5,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-7, -28); ctx.lineTo(-3, -31); ctx.lineTo(-4, -36);
  ctx.moveTo(7, -20); ctx.lineTo(3, -22); ctx.lineTo(4, -27);
  ctx.moveTo(-6, -46); ctx.lineTo(-1, -44);
  ctx.stroke();
  // veio de âmbar aceso
  const pulse = 0.7 + Math.sin(t * 4) * 0.3;
  for (const [w, c] of [[2.6, `rgba(255,140,40,${0.5 * pulse})`], [1.1, '#ffd27a']]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(0.5, -12); ctx.lineTo(-0.8, -20); ctx.lineTo(1, -27); ctx.stroke();
  }
  // musgo na base
  ctx.fillStyle = '#5f9a3e';
  ctx.beginPath(); ctx.moveTo(-8, -8); ctx.quadraticCurveTo(-3, -14, 0, -10); ctx.quadraticCurveTo(4, -14, 8, -9); ctx.lineTo(8, -7); ctx.lineTo(-8, -7); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#86c45a';
  ctx.beginPath(); ctx.arc(-4, -10.5, 1.2, 0, Math.PI * 2); ctx.arc(4, -11, 1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  shape(ctx, blade);
  outline(ctx, 2.4);
  // cristal de âmbar
  ctx.shadowColor = '#ffb347';
  ctx.shadowBlur = 7 + Math.sin(t * 4) * 3;
  ctx.fillStyle = '#ffd27a';
  shape(ctx, [[0.5, -38], [3.6, -33], [0.5, -27], [-2.6, -33]]);
  ctx.fill();
  ctx.shadowBlur = 0;
  outline(ctx, 1.2);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  shape(ctx, [[0.5, -37], [-1.4, -33], [0.5, -34]]);
  ctx.fill();
  // guarda de pedra com tiras de metal
  const guard = [[-13, -9], [-10, -2.5], [10, -2.5], [13.5, -8], [9, -11], [-9, -11.5]];
  shape(ctx, guard);
  ctx.fillStyle = '#7a6656';
  ctx.fill();
  shadeRight(ctx, guard, 'rgba(0,0,0,0.3)', 1);
  shape(ctx, guard);
  outline(ctx, 1.8);
  ctx.fillStyle = '#9aa0aa';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  for (const x of [-7, 5]) {
    ctx.beginPath(); ctx.rect(x, -11, 2.4, 8.5); ctx.fill(); ctx.stroke();
  }
}

// ---------------------------------------------------------------- Ar
// Lâmina fina prateada com desenhos de vento, guarda em asas de pena e
// fita no pomo balançando
function windBlade(ctx, t) {
  // fita no pomo (atrás de tudo)
  ctx.fillStyle = '#7fe8d6';
  ctx.beginPath();
  ctx.moveTo(0, 9);
  for (let i = 0; i <= 7; i++) ctx.lineTo(-i * 3, 10 + i * 1.6 + Math.sin(t * 10 - i) * 2.2);
  for (let i = 7; i >= 0; i--) ctx.lineTo(-i * 3, 12.8 + i * 1.6 + Math.sin(t * 10 - i) * 2.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(11,7,16,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  handle(ctx, '#f2fffc', '#bfe9e1', '#3fd6c0');
  const blade = [[-2.2, -7], [-1.7, -50], [0, -59], [1.7, -50], [2.2, -7]];
  shape(ctx, blade);
  const g = ctx.createLinearGradient(-2.2, 0, 2.2, 0);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.5, '#e3f6f2');
  g.addColorStop(0.51, '#a9d8d0');
  g.addColorStop(1, '#8cc6bd');
  ctx.fillStyle = g;
  ctx.fill();
  // desenhos de vento gravados
  ctx.strokeStyle = 'rgba(63,214,192,0.9)';
  ctx.lineWidth = 0.9;
  for (const y of [-16, -28, -40]) {
    ctx.beginPath(); ctx.arc(0, y, 1.4, Math.PI * 0.2, Math.PI * 1.6); ctx.stroke();
  }
  shape(ctx, blade);
  outline(ctx, 1.8);
  // brilho correndo
  const k = (t * 0.9) % 1;
  if (k < 0.3) {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath(); ctx.ellipse(-0.6, -10 - (k / 0.3) * 40, 0.8, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  }
  // linhas de vento correndo ao lado
  ctx.strokeStyle = 'rgba(127,255,224,0.8)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    const y = -12 - ((t * 60 + i * 15) % 42);
    const side = i % 2 ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(side * 4.5, y); ctx.quadraticCurveTo(side * 7, y - 5, side * 4, y - 11); ctx.stroke();
  }
  // guarda em asas de pena
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.quadraticCurveTo(s * 7, -12, s * 13, -12);
    ctx.quadraticCurveTo(s * 10, -8, s * 11, -6);
    ctx.quadraticCurveTo(s * 7, -5, s * 9, -3);
    ctx.quadraticCurveTo(s * 4, -2, 0, -3);
    ctx.closePath();
    ctx.fill();
    outline(ctx, 1.4);
    ctx.strokeStyle = 'rgba(63,160,150,0.6)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(s * 2, -4.5); ctx.quadraticCurveTo(s * 7, -9, s * 11, -10); ctx.stroke();
  }
  ctx.fillStyle = '#3fd6c0';
  ctx.beginPath(); ctx.arc(0, -4.5, 1.8, 0, Math.PI * 2); ctx.fill();
  outline(ctx, 1);
}

// ====================================================================== cajados

export function drawStaffArt(ctx, element, t) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (element === 'agua') tideStaff(ctx, t);
  else if (element === 'terra') stoneStaff(ctx, t);
  else if (element === 'ar') windStaff(ctx, t);
  else flameStaff(ctx, t);
  ctx.restore();
}

// Haste com luz do lado esquerdo e sombra do direito
function pole(ctx, color, shadow, from, to, w = 4) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = w + 3;
  ctx.beginPath(); ctx.moveTo(0, from); ctx.lineTo(0, to); ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke();
  ctx.strokeStyle = shadow;
  ctx.lineWidth = w * 0.4;
  ctx.beginPath(); ctx.moveTo(w * 0.25, from); ctx.lineTo(w * 0.25, to); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-w * 0.3, from); ctx.lineTo(-w * 0.3, to); ctx.stroke();
}

// Fogo: haste escura com anéis de brasa e braseiro de ferro com a bola de fogo
function flameStaff(ctx, t) {
  pole(ctx, '#4a2a26', 'rgba(0,0,0,0.4)', 14, -30);
  // ponteira e anéis
  ctx.fillStyle = '#3a2a2e';
  shape(ctx, [[-3, 13], [0, 19], [3, 13]]);
  ctx.fill(); outline(ctx, 1.4);
  for (const y of [6, -8, -22]) {
    ctx.fillStyle = '#c9a14a';
    ctx.beginPath(); ctx.rect(-3.2, y, 6.4, 2.4); ctx.fill(); outline(ctx, 1.1);
    ctx.fillStyle = '#ff8a2a';
    ctx.beginPath(); ctx.arc(0, y + 1.2, 0.8, 0, Math.PI * 2); ctx.fill();
  }
  // braseiro: garras de ferro em volta da bola de fogo
  for (const s of [-1, 1]) {
    for (const [w, c] of [[4.4, INK], [2.4, '#3a2a2e']]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(s * 11, -36, s * 7, -48); ctx.lineTo(s * 4, -51); ctx.stroke();
    }
  }
  ctx.fillStyle = '#3a2a2e';
  ctx.beginPath(); ctx.ellipse(0, -31, 6, 2.6, 0, 0, Math.PI * 2); ctx.fill(); outline(ctx, 1.4);
  drawFireball(ctx, 0, -41, 6.8 + Math.sin(t * 7) * 0.6, t, 0);
  // faíscas subindo
  ctx.fillStyle = '#ffd25a';
  for (let i = 0; i < 3; i++) {
    const k = (t * 1.3 + i / 3) % 1;
    ctx.globalAlpha = 1 - k;
    ctx.beginPath(); ctx.arc(Math.sin(i * 2 + t * 3) * 4, -50 - k * 14, 0.9, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Água: madeira clara com amarração turquesa, onda curvada no topo e
// esfera com correnteza girando e bolhas
function tideStaff(ctx, t) {
  pole(ctx, '#d8c29a', 'rgba(120,90,50,0.45)', 14, -30);
  ctx.fillStyle = '#efe0c4';
  shape(ctx, [[-2.5, 13], [0, 18], [2.5, 13]]);
  ctx.fill(); outline(ctx, 1.3);
  // amarração em X
  ctx.strokeStyle = '#2aa6c8';
  ctx.lineWidth = 1.8;
  for (const y of [6, -10, -24]) {
    ctx.beginPath(); ctx.moveTo(-2.6, y); ctx.lineTo(2.6, y - 3); ctx.moveTo(-2.6, y - 3); ctx.lineTo(2.6, y); ctx.stroke();
  }
  // onda curvada abraçando a esfera
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6.5;
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.bezierCurveTo(-14, -34, -12, -52, 0, -53); ctx.quadraticCurveTo(9, -53, 10, -46); ctx.stroke();
  ctx.strokeStyle = '#4fb2f0';
  ctx.lineWidth = 3.4;
  ctx.stroke();
  ctx.strokeStyle = '#e8fbff';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-1, -31); ctx.bezierCurveTo(-12, -35, -10.5, -50, 0, -51); ctx.stroke();
  // espuma na ponta da onda
  ctx.fillStyle = '#ffffff';
  for (const [x, y, r] of [[10, -46, 2], [8, -44, 1.4], [11.5, -43.5, 1.1]]) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  // esfera de água com correnteza girando
  const r = 6.5;
  const cy = -41;
  const g = ctx.createRadialGradient(-2, cy - 3, 1, 0, cy, r);
  g.addColorStop(0, '#e6fbff'); g.addColorStop(0.5, '#5ab8ff'); g.addColorStop(1, '#1f5fc0');
  ctx.fillStyle = g;
  ctx.shadowColor = '#5ab8ff';
  ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(0, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.save();
  ctx.translate(0, cy);
  ctx.rotate(t * 3);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.arc(0, 0, 3.6, 0, Math.PI * 0.9); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 2, Math.PI, Math.PI * 1.8); ctx.stroke();
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, cy, r, 0, Math.PI * 2);
  outline(ctx, 1.6);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.ellipse(-2.4, cy - 2.8, 1.2, 2, -0.5, 0, Math.PI * 2); ctx.fill();
  // bolhas subindo
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.9 + i / 3) % 1;
    ctx.strokeStyle = `rgba(200,240,255,${1 - k})`;
    ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.arc(Math.sin(i * 2.3 + t * 2) * 6, cy - 8 - k * 12, 1 + k, 0, Math.PI * 2); ctx.stroke();
  }
}

// Terra: galho retorcido com raízes e folhas, rocha flutuante com
// cristais de âmbar e pedrinhas orbitando
function stoneStaff(ctx, t) {
  // galho
  const branch = () => {
    ctx.beginPath(); ctx.moveTo(0, 15); ctx.quadraticCurveTo(-3, -6, 1, -18); ctx.quadraticCurveTo(4, -26, -1, -32);
  };
  ctx.strokeStyle = INK; ctx.lineWidth = 8.5; branch(); ctx.stroke();
  ctx.strokeStyle = '#7a5434'; ctx.lineWidth = 5.4; branch(); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(1.5, 14); ctx.quadraticCurveTo(-1, -6, 2.8, -18); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,220,180,0.3)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-1.6, 12); ctx.quadraticCurveTo(-4, -6, -0.4, -17); ctx.stroke();
  // raízes abraçando o topo
  for (const s of [-1, 1]) {
    for (const [w, c] of [[3.4, INK], [1.8, '#5a3b20']]) {
      ctx.strokeStyle = c; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(-0.5, -30); ctx.quadraticCurveTo(s * 8, -35, s * 6, -43); ctx.stroke();
    }
  }
  // folhas
  for (const [x, y, a] of [[-3, -14, -0.9], [3.5, -24, 0.8], [-3, 4, -1.1]]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a + Math.sin(t * 3 + x) * 0.1);
    ctx.fillStyle = '#6fbf4a';
    ctx.beginPath(); ctx.ellipse(0, -3.5, 2, 4, 0, 0, Math.PI * 2); ctx.fill();
    outline(ctx, 1);
    ctx.strokeStyle = '#3c7d2c'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -7); ctx.stroke();
    ctx.restore();
  }
  // rocha flutuante com facetas e cristais
  const bob = Math.sin(t * 3) * 1.5;
  ctx.save();
  ctx.translate(0, -47 + bob);
  ctx.rotate(Math.sin(t * 1.5) * 0.12);
  const rock = [[-8, 2], [-7, -4], [-1, -8], [7, -4], [7.5, 3], [0, 7]];
  shape(ctx, rock);
  ctx.fillStyle = '#8a6a48';
  ctx.fill();
  ctx.fillStyle = '#b8966a';
  shape(ctx, [[-8, 2], [-7, -4], [-1, -8], [-1, 0]]);
  ctx.fill();
  ctx.fillStyle = '#5a4128';
  shape(ctx, [[-1, 0], [7.5, 3], [0, 7]]);
  ctx.fill();
  shape(ctx, rock);
  outline(ctx, 1.8);
  ctx.shadowColor = '#ffb347';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ffd27a';
  shape(ctx, [[-2.5, -6], [0, -14], [2.5, -6]]);
  ctx.fill();
  shape(ctx, [[2, -5], [6.5, -10.5], [5.5, -3]]);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  shape(ctx, [[-1.6, -7], [0, -12.5], [-0.4, -7]]);
  ctx.fill();
  ctx.restore();
  // pedrinhas orbitando
  for (let i = 0; i < 3; i++) {
    const a = t * 2 + (i * Math.PI * 2) / 3;
    const x = Math.cos(a) * 12;
    const y = -47 + bob + Math.sin(a) * 4;
    ctx.fillStyle = '#7a5a3a';
    ctx.beginPath(); ctx.arc(x, y, 1.7, 0, Math.PI * 2); ctx.fill();
    outline(ctx, 0.9);
  }
}

// Ar: haste branca com asas de pena e fitas, anel com redemoinho girando
function windStaff(ctx, t) {
  pole(ctx, '#f2fffc', 'rgba(80,160,150,0.35)', 14, -30, 3.4);
  ctx.fillStyle = '#bfe9e1';
  shape(ctx, [[-2.4, 13], [0, 18], [2.4, 13]]);
  ctx.fill(); outline(ctx, 1.2);
  ctx.strokeStyle = '#3fd6c0';
  ctx.lineWidth = 2;
  for (const y of [6, -10]) { ctx.beginPath(); ctx.moveTo(-2.2, y); ctx.lineTo(2.2, y); ctx.stroke(); }
  // fitas caindo junto da haste, balançando de leve
  for (const s of [-1, 1]) {
    ctx.fillStyle = s < 0 ? '#7fe8d6' : '#ffffff';
    ctx.beginPath();
    ctx.moveTo(s * 1.5, -27);
    for (let i = 1; i <= 5; i++) ctx.lineTo(s * (2 + i * 0.5) + Math.sin(t * 7 + i + s) * 1.2, -27 + i * 3.2);
    for (let i = 5; i >= 1; i--) ctx.lineTo(s * (3.6 + i * 0.5) + Math.sin(t * 7 + i + s) * 1.2, -27 + i * 3.2 - 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(11,7,16,0.6)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  // asas de pena embaixo do anel
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -29);
    ctx.quadraticCurveTo(s * 9, -30, s * 14, -36);
    ctx.quadraticCurveTo(s * 10, -34, s * 11, -31);
    ctx.quadraticCurveTo(s * 7, -29, s * 8, -26.5);
    ctx.quadraticCurveTo(s * 4, -26, 0, -27);
    ctx.closePath();
    ctx.fill();
    outline(ctx, 1.4);
  }
  // anel com redemoinho
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(0, -42, 9, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#e9fffb';
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(63,214,192,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, -42, 9, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
  ctx.save();
  ctx.translate(0, -42);
  ctx.rotate(t * 6);
  ctx.strokeStyle = '#7fffe0';
  ctx.shadowColor = '#7fffe0';
  ctx.shadowBlur = 8;
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 3; i++) {
    ctx.rotate((Math.PI * 2) / 3);
    ctx.beginPath(); ctx.arc(2.5, 0, 4, Math.PI, Math.PI * 1.9); ctx.stroke();
  }
  ctx.restore();
  // fiapos de vento orbitando
  ctx.strokeStyle = 'rgba(200,255,245,0.85)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const a = -t * 3 + (i * Math.PI * 2) / 3;
    ctx.beginPath(); ctx.arc(0, -42, 13, a, a + 0.7); ctx.stroke();
  }
}

// ====================================================================== disparos
// Desenhados no centro (x, y); dir = 1 indo para a direita, -1 esquerda.

// combo = elemento absorvido quando dois disparos se combinaram no ar
export function drawShot(ctx, element, x, y, r, dir, t, combo = null) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir || 1, 1);
  if (element === 'agua') waterShot(ctx, r, t);
  else if (element === 'terra') {
    if (combo === 'fogo') magmaShot(ctx, r, t);
    else if (combo === 'agua') mudShot(ctx, r, t);
    else rockShot(ctx, r, t);
  } else if (element === 'ar') windShot(ctx, r, t, combo);
  else if (element === 'mortal') neutralShot(ctx, r, t);
  else drawFireball(ctx, 0, 0, r, t, 1);
  ctx.restore();
}

// Cores do tornado: normal, de fogo, de chuva e de areia
const TORNADO_COLORS = {
  ar: { bands: ['rgba(110,235,215,0.9)', 'rgba(255,255,255,0.85)'], glow: '235,255,252', base: 'rgba(235,255,250,0.7)', suction: 'rgba(200,255,245,0.35)' },
  fogo: { bands: ['rgba(255,110,30,0.95)', 'rgba(255,220,120,0.9)'], glow: '255,170,80', base: 'rgba(255,180,90,0.8)', suction: 'rgba(255,170,90,0.35)' },
  agua: { bands: ['rgba(80,150,230,0.9)', 'rgba(225,240,255,0.85)'], glow: '170,200,240', base: 'rgba(200,225,255,0.7)', suction: 'rgba(170,210,255,0.35)' },
  terra: { bands: ['rgba(180,140,80,0.95)', 'rgba(240,215,165,0.9)'], glow: '230,200,150', base: 'rgba(220,190,140,0.75)', suction: 'rgba(220,190,140,0.35)' },
};

// Bola de fogo; tail = tamanho da cauda (0 = parada no cajado)
export function drawFireball(ctx, x, y, r, t, tail) {
  ctx.save();
  ctx.translate(x, y);
  if (tail) {
    // halo de calor
    const halo = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 2.6);
    halo.addColorStop(0, 'rgba(255,140,40,0.45)');
    halo.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(-r * 2.6, -r * 2.6, r * 5.2, r * 5.2);
    // línguas de fogo para trás, cada uma ondulando
    const tongues = [
      [3.9, 1.1, -0.35, 'rgba(200,40,10,0.8)'],
      [3.6, 1.0, 0.4, 'rgba(255,80,20,0.85)'],
      [3.0, 0.85, -0.1, 'rgba(255,150,40,0.9)'],
      [2.2, 0.6, 0.15, 'rgba(255,220,120,0.95)'],
    ];
    tongues.forEach(([len, wid, bend, color], i) => {
      const L = r * len * (0.9 + 0.1 * Math.sin(t * 22 + i));
      const W = r * wid;
      const wob = Math.sin(t * 18 + i * 1.7) * r * 0.35;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(r * 0.2, -W);
      ctx.bezierCurveTo(-L * 0.3, -W * 1.05 + wob, -L * 0.7, -W * 0.5 + bend * r + wob, -L, bend * r + wob * 0.6);
      ctx.bezierCurveTo(-L * 0.7, W * 0.5 + bend * r + wob, -L * 0.3, W * 1.05 + wob, r * 0.2, W);
      ctx.closePath();
      ctx.fill();
    });
  } else {
    for (let i = 0; i < 3; i++) {
      const fl = Math.sin(t * 15 + i * 2) * 1.2;
      ctx.fillStyle = i === 1 ? '#ffd25a' : '#ff6a1a';
      const bx = (i - 1) * r * 0.55;
      ctx.beginPath();
      ctx.moveTo(bx - r * 0.35, -r * 0.6);
      ctx.quadraticCurveTo(bx + fl, -r * 1.4, bx + fl * 0.5, -r * (1.8 + (i === 1 ? 0.4 : 0)));
      ctx.quadraticCurveTo(bx + r * 0.2, -r * 1.2, bx + r * 0.35, -r * 0.6);
      ctx.fill();
    }
  }
  // núcleo: borda vermelha escura, laranja e miolo quase branco
  ctx.shadowColor = '#ff6a00';
  ctx.shadowBlur = 16;
  const g = ctx.createRadialGradient(r * 0.25, -r * 0.2, 1, 0, 0, r * 1.1);
  g.addColorStop(0, '#fffbe6'); g.addColorStop(0.3, '#ffe08a'); g.addColorStop(0.65, '#ff8a24'); g.addColorStop(1, '#b8280a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  // chamas na frente do núcleo (a bola "ferve")
  if (tail) {
    ctx.fillStyle = 'rgba(255,250,220,0.45)';
    for (let i = 0; i < 3; i++) {
      const a = t * 9 + i * 2.1;
      ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.35, Math.sin(a) * r * 0.35, r * 0.3, 0, Math.PI * 2); ctx.fill();
    }
    // brasas soltas atrás
    ctx.fillStyle = '#ffd25a';
    for (let i = 0; i < 4; i++) {
      const k = (t * 3 + i / 4) % 1;
      ctx.globalAlpha = 1 - k;
      ctx.beginPath(); ctx.arc(-r * (1.2 + k * 3), Math.sin(i * 2.7 + t * 6) * r * 0.9, r * 0.12, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// Jato d'água: bolha na frente com coroa de espuma, corrente girando dentro
// e um rastro de gotas
function waterShot(ctx, r, t) {
  // rastro de água afinando
  const g = ctx.createLinearGradient(-r * 4, 0, r, 0);
  g.addColorStop(0, 'rgba(90,180,255,0)');
  g.addColorStop(0.55, 'rgba(70,160,250,0.7)');
  g.addColorStop(1, 'rgba(200,240,255,0.95)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(r * 0.6, -r * 0.9);
  ctx.bezierCurveTo(-r * 1.2, -r * 0.8 + Math.sin(t * 25) * 2, -r * 2.6, -r * 0.35, -r * 4, Math.sin(t * 14) * r * 0.2);
  ctx.bezierCurveTo(-r * 2.6, r * 0.35, -r * 1.2, r * 0.8 + Math.cos(t * 25) * 2, r * 0.6, r * 0.9);
  ctx.closePath();
  ctx.fill();
  // bolha da frente
  ctx.shadowColor = '#5ab8ff';
  ctx.shadowBlur = 12;
  const head = ctx.createRadialGradient(r * 0.3, -r * 0.3, 1, 0, 0, r);
  head.addColorStop(0, '#f2fdff');
  head.addColorStop(0.5, '#7fcfff');
  head.addColorStop(1, '#2a7ae0');
  ctx.fillStyle = head;
  ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05, r * 0.9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  // corrente girando dentro
  ctx.save();
  ctx.rotate(-t * 9);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 1.1); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.28, Math.PI, Math.PI * 1.9); ctx.stroke();
  ctx.restore();
  // coroa de espuma na frente
  ctx.fillStyle = '#ffffff';
  for (let i = -2; i <= 2; i++) {
    const a = i * 0.45;
    const rr = r * (0.18 + (2 - Math.abs(i)) * 0.05) * (0.85 + 0.15 * Math.sin(t * 20 + i));
    ctx.beginPath(); ctx.arc(Math.cos(a) * r * 1.02, Math.sin(a) * r * 0.9, rr, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(r * 0.15, 0, r * 0.85, -1.1, 1.1); ctx.stroke();
  // gotas soltas para trás
  ctx.fillStyle = 'rgba(190,235,255,0.95)';
  for (let i = 0; i < 5; i++) {
    const k = (t * 4 + i / 5) % 1;
    const y = (i % 2 ? 1 : -1) * r * (0.5 + k * 0.6);
    ctx.globalAlpha = 1 - k;
    ctx.beginPath(); ctx.arc(-r * (1 + k * 3), y, r * 0.14, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Pedrada: pedra lapidada girando, rachaduras de âmbar acesas, pedrinhas
// e poeira atrás
function rockShot(ctx, r, t) {
  // poeira
  for (let i = 0; i < 4; i++) {
    const k = (t * 3 + i / 4) % 1;
    ctx.fillStyle = `rgba(150,120,90,${0.35 * (1 - k)})`;
    ctx.beginPath(); ctx.arc(-r * (1.2 + k * 2.6), Math.sin(t * 9 + i) * 3, r * (0.35 + k * 0.4), 0, Math.PI * 2); ctx.fill();
  }
  // riscos de velocidade
  ctx.strokeStyle = 'rgba(230,210,180,0.55)';
  ctx.lineWidth = 1.4;
  for (const y of [-0.7, 0.1, 0.8]) {
    ctx.beginPath(); ctx.moveTo(-r * 1.2, y * r); ctx.lineTo(-r * 2.4, y * r); ctx.stroke();
  }
  // pedrinhas seguindo
  for (let i = 0; i < 2; i++) {
    const k = (t * 2.5 + i * 0.5) % 1;
    ctx.fillStyle = '#6a4e32';
    ctx.beginPath(); ctx.arc(-r * (1.4 + k * 1.6), (i ? 1 : -1) * r * 0.6, r * 0.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.save();
  ctx.rotate(t * 10);
  const rock = [[-r, r * 0.2], [-r * 0.7, -r * 0.8], [r * 0.3, -r], [r, -r * 0.2], [r * 0.7, r * 0.8], [-r * 0.3, r]];
  shape(ctx, rock);
  ctx.fillStyle = '#8a6a48';
  ctx.fill();
  // facetas
  ctx.fillStyle = '#b8966a';
  shape(ctx, [[-r, r * 0.2], [-r * 0.7, -r * 0.8], [r * 0.3, -r], [0, 0]]);
  ctx.fill();
  ctx.fillStyle = '#5a4128';
  shape(ctx, [[0, 0], [r, -r * 0.2], [r * 0.7, r * 0.8], [-r * 0.3, r]]);
  ctx.fill();
  // rachaduras de âmbar
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 1.6;
  ctx.shadowColor = '#ffb347';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.3); ctx.lineTo(0, 0); ctx.lineTo(r * 0.5, -r * 0.1);
  ctx.moveTo(0, 0); ctx.lineTo(-r * 0.1, r * 0.6);
  ctx.stroke();
  ctx.shadowBlur = 0;
  shape(ctx, rock);
  outline(ctx, 2);
  ctx.restore();
}

// Pedra de magma (Terra + Fogo): crosta escura em placas com lava brilhando
// nas frestas, gotas de lava pingando e cauda de fogo
function magmaShot(ctx, r, t) {
  const halo = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 2.4);
  halo.addColorStop(0, 'rgba(255,120,30,0.55)');
  halo.addColorStop(1, 'rgba(255,80,20,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(-r * 2.4, -r * 2.4, r * 4.8, r * 4.8);
  // cauda de fogo em línguas ondulando
  [[3.2, 0.95, 'rgba(200,40,10,0.8)'], [2.7, 0.8, 'rgba(255,100,25,0.85)'], [2, 0.55, 'rgba(255,200,90,0.9)']].forEach(([len, wid, c], i) => {
    const L = r * len * (0.9 + 0.1 * Math.sin(t * 20 + i));
    const W = r * wid;
    const wob = Math.sin(t * 16 + i * 1.7) * r * 0.3;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -W);
    ctx.bezierCurveTo(-L * 0.4, -W + wob, -L * 0.8, -W * 0.4 + wob, -L - r * 0.3, wob * 0.6);
    ctx.bezierCurveTo(-L * 0.8, W * 0.4 + wob, -L * 0.4, W + wob, -r * 0.3, W);
    ctx.closePath();
    ctx.fill();
  });
  // gotas de lava pingando para trás e para baixo
  for (let i = 0; i < 3; i++) {
    const k = (t * 2.2 + i / 3) % 1;
    const x = -r * (0.4 + k * 1.6);
    const y = r * (0.6 + k * k * 2.4);
    ctx.globalAlpha = 1 - k * 0.6;
    ctx.fillStyle = '#ff9a2a';
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.35);
    ctx.quadraticCurveTo(x + r * 0.2, y, x, y + r * 0.18);
    ctx.quadraticCurveTo(x - r * 0.2, y, x, y - r * 0.35);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.rotate(t * 8);
  const rock = [[-r, r * 0.2], [-r * 0.7, -r * 0.8], [r * 0.3, -r], [r, -r * 0.2], [r * 0.7, r * 0.8], [-r * 0.3, r]];
  // lava por baixo (aparece nas frestas)
  shape(ctx, rock);
  const lava = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
  lava.addColorStop(0, '#fff2b0');
  lava.addColorStop(0.5, '#ffb347');
  lava.addColorStop(1, '#ff5a14');
  ctx.fillStyle = lava;
  ctx.fill();
  // placas de crosta escura (com as frestas entre elas)
  const plates = [
    [[-r * 0.95, r * 0.15], [-r * 0.68, -r * 0.72], [-r * 0.12, -r * 0.5], [-r * 0.28, r * 0.05]],
    [[-r * 0.02, -r * 0.62], [r * 0.28, -r * 0.92], [r * 0.9, -r * 0.22], [r * 0.32, -r * 0.08]],
    [[r * 0.36, r * 0.06], [r * 0.92, -r * 0.08], [r * 0.66, r * 0.74], [r * 0.18, r * 0.5]],
    [[-r * 0.32, r * 0.22], [r * 0.08, r * 0.6], [-r * 0.28, r * 0.92], [-r * 0.82, r * 0.34]],
  ];
  plates.forEach((pl, i) => {
    shape(ctx, pl);
    ctx.fillStyle = i % 2 ? '#3a1a12' : '#2a120c';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,170,90,0.18)';
    ctx.beginPath(); ctx.moveTo(pl[0][0], pl[0][1]); ctx.lineTo(pl[1][0], pl[1][1]); ctx.lineTo(pl[2][0], pl[2][1]); ctx.closePath(); ctx.fill();
  });
  shape(ctx, rock);
  outline(ctx, 2);
  ctx.restore();
}

// Lama (Terra + Água): bola molhada balançando, brilho de molhado, pedrinhas
// grudadas, bolhas estourando e pingos compridos caindo
function mudShot(ctx, r, t) {
  // pingos compridos e respingos para trás
  for (let i = 0; i < 4; i++) {
    const k = (t * 2.6 + i / 4) % 1;
    const x = -r * (0.5 + k * 1.8);
    const y = r * (0.4 + k * k * 2);
    const len = r * (0.5 + (1 - k) * 0.4);
    ctx.globalAlpha = 1 - k * 0.7;
    ctx.fillStyle = '#5a3e28';
    ctx.beginPath();
    ctx.moveTo(x, y - len);
    ctx.quadraticCurveTo(x + r * 0.22, y, x, y + r * 0.2);
    ctx.quadraticCurveTo(x - r * 0.22, y, x, y - len);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(90,62,40,0.8)';
  for (let i = 0; i < 3; i++) {
    const k = (t * 3 + i / 3) % 1;
    ctx.beginPath(); ctx.arc(-r * (1.2 + k * 2), -r * (0.4 - k * 0.8) + Math.sin(i * 3) * 3, r * 0.12, 0, Math.PI * 2); ctx.fill();
  }
  // bola de lama que balança (mais esticada para trás)
  const blob = new Path2D();
  for (let i = 0; i <= 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const back = Math.cos(a) < 0 ? 1 + Math.abs(Math.cos(a)) * 0.18 : 1;
    const rr = r * back * (1 + Math.sin(a * 3 + t * 12) * 0.07 + Math.sin(a * 5 - t * 9) * 0.04);
    const x = Math.cos(a) * rr * 1.05;
    const y = Math.sin(a) * rr * 0.92;
    if (i === 0) blob.moveTo(x, y);
    else blob.lineTo(x, y);
  }
  blob.closePath();
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, 1, 0, 0, r * 1.15);
  g.addColorStop(0, '#a07a52');
  g.addColorStop(0.55, '#6e4c30');
  g.addColorStop(1, '#3a2616');
  ctx.fillStyle = g;
  ctx.fill(blob);
  ctx.save();
  ctx.clip(blob);
  // manchas mais escuras e pedrinhas grudadas
  ctx.fillStyle = 'rgba(40,24,12,0.45)';
  for (const [x, y, rr] of [[0.35, 0.3, 0.3], [-0.4, 0.5, 0.22], [0.55, -0.35, 0.18]]) {
    ctx.beginPath(); ctx.ellipse(x * r, y * r, rr * r, rr * r * 0.7, 0.4, 0, Math.PI * 2); ctx.fill();
  }
  for (const [x, y, rr] of [[-0.1, 0.15, 0.13], [0.45, 0.05, 0.1], [-0.55, -0.1, 0.09]]) {
    ctx.fillStyle = '#8a8070';
    ctx.beginPath(); ctx.arc(x * r, y * r, rr * r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(x * r - rr * r * 0.3, y * r - rr * r * 0.3, rr * r * 0.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.stroke(blob);
  // brilho de molhado
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.42, r * 0.3, r * 0.13, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath(); ctx.arc(r * 0.05, -r * 0.62, r * 0.07, 0, Math.PI * 2); ctx.fill();
  // bolha estourando na superfície
  const k = (t * 1.6) % 1;
  ctx.strokeStyle = `rgba(200,170,130,${1 - k})`;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(r * 0.4, -r * 0.55, r * (0.08 + k * 0.2), Math.PI, 0); ctx.stroke();
}

// Enfeites do tornado combinado: de fogo, de chuva (tempestade) ou de areia
function tornadoCombo(ctx, r, t, combo, top, bottom, widthAt, sway) {
  const along = (u) => top + (bottom - top) * u;
  if (combo === 'fogo') {
    // núcleo de fogo dentro do funil
    const core = ctx.createLinearGradient(0, top, 0, bottom);
    core.addColorStop(0, 'rgba(255,120,30,0.05)');
    core.addColorStop(0.6, 'rgba(255,140,40,0.45)');
    core.addColorStop(1, 'rgba(255,220,120,0.7)');
    ctx.fillStyle = core;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) { const u = i / 10; ctx.lineTo(-widthAt(u) * 0.45 + sway(u), along(u)); }
    for (let i = 10; i >= 0; i--) { const u = i / 10; ctx.lineTo(widthAt(u) * 0.45 + sway(u), along(u)); }
    ctx.closePath();
    ctx.fill();
    // chamas subindo pelas laterais
    for (let i = 0; i < 6; i++) {
      const u = 0.15 + ((i * 0.37 + t * 0.6) % 0.8);
      const side = i % 2 ? 1 : -1;
      const x = side * widthAt(u) + sway(u);
      const y = along(u);
      const h = r * (0.45 + 0.2 * Math.sin(t * 14 + i));
      flameTongue(ctx, x, y, h, r * 0.18, side * 0.4, t + i);
    }
    // anel de fogo na base
    for (let i = 0; i < 5; i++) {
      const x = ((i - 2) / 2) * r * 0.9 + sway(1);
      const h = r * (0.6 + 0.35 * Math.sin(t * 15 + i * 1.9));
      flameTongue(ctx, x, bottom + 2, h, r * 0.24, 0, t + i * 0.7);
    }
    // brasas subindo em espiral e fumaça no topo
    ctx.fillStyle = '#ffd25a';
    for (let i = 0; i < 6; i++) {
      const u = (t * 0.8 + i / 6) % 1;
      const a = t * 9 + i * 2;
      ctx.globalAlpha = 0.4 + u * 0.6;
      ctx.beginPath(); ctx.arc(Math.cos(a) * widthAt(1 - u) * 0.9 + sway(1 - u), along(1 - u), 1.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(70,45,45,0.4)';
    for (let i = 0; i < 3; i++) {
      const k = (t * 1.2 + i / 3) % 1;
      ctx.beginPath(); ctx.arc((i - 1) * r * 0.6, top - k * r * 0.9, r * (0.25 + k * 0.3), 0, Math.PI * 2); ctx.fill();
    }
  } else if (combo === 'agua') {
    // chuva inclinada caindo dentro e em volta
    ctx.strokeStyle = 'rgba(190,225,255,0.9)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 10; i++) {
      const k = (t * 3.2 + i / 10) % 1;
      const x = (i / 9 - 0.5) * r * 2.4 + sway(k);
      const y = top + (bottom - top + r * 0.4) * k;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2.5, y + 6); ctx.stroke();
    }
    // respingos na base
    ctx.strokeStyle = 'rgba(200,230,255,0.8)';
    for (let i = 0; i < 3; i++) {
      const k = (t * 2.5 + i / 3) % 1;
      ctx.globalAlpha = 1 - k;
      ctx.beginPath(); ctx.arc((i - 1) * r * 0.7 + sway(1), bottom + 3, 2 + k * 5, Math.PI, 0); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // nuvem escura com relevo
    const cy = top - r * 0.25;
    for (const [dx, dy, rr, c] of [[-0.75, 0.1, 0.42, '#4a5878'], [0.75, 0.1, 0.42, '#4a5878'], [-0.3, -0.15, 0.55, '#56658a'], [0.3, -0.1, 0.5, '#56658a'], [0, 0.15, 0.5, '#46526e']]) {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(dx * r * 1.3 + sway(0), cy + dy * r, rr * r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(170,190,225,0.6)';
    for (const [dx, rr] of [[-0.35, 0.3], [0.3, 0.26]]) {
      ctx.beginPath(); ctx.arc(dx * r * 1.3 + sway(0) - 2, cy - r * 0.28, rr * r, Math.PI, 0); ctx.fill();
    }
    // relâmpago piscando de vez em quando
    if ((t * 1.3) % 1 < 0.12) {
      ctx.strokeStyle = '#fff7c0';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(sway(0), cy + r * 0.3);
      ctx.lineTo(sway(0) - r * 0.25, cy + r * 0.8);
      ctx.lineTo(sway(0) + r * 0.05, cy + r * 0.85);
      ctx.lineTo(sway(0) - r * 0.2, cy + r * 1.4);
      ctx.stroke();
    }
  } else if (combo === 'terra') {
    // funil cor de areia
    const sand = ctx.createLinearGradient(-r, 0, r, 0);
    sand.addColorStop(0, 'rgba(210,175,120,0.1)');
    sand.addColorStop(0.5, 'rgba(225,195,140,0.45)');
    sand.addColorStop(1, 'rgba(180,140,90,0.15)');
    ctx.fillStyle = sand;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) { const u = i / 10; ctx.lineTo(-widthAt(u) + sway(u), along(u)); }
    for (let i = 10; i >= 0; i--) { const u = i / 10; ctx.lineTo(widthAt(u) + sway(u), along(u)); }
    ctx.closePath();
    ctx.fill();
    // muitos grãos e algumas pedrinhas girando
    for (let i = 0; i < 22; i++) {
      const a = t * 9 + i * 0.9;
      const u = (i * 0.37) % 1;
      const front = Math.sin(a) > 0;
      ctx.fillStyle = front ? '#e8c890' : '#b08a50';
      ctx.beginPath(); ctx.arc(Math.cos(a) * (widthAt(u) + 2) + sway(u), along(u) + Math.sin(a) * 2, i % 5 === 0 ? 1.8 : 1, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < 3; i++) {
      const a = t * 6 + i * 2.1;
      const u = 0.3 + i * 0.22;
      ctx.fillStyle = '#6a4e32';
      ctx.beginPath(); ctx.arc(Math.cos(a) * (widthAt(u) + 4) + sway(u), along(u), 2, 0, Math.PI * 2); ctx.fill();
    }
    // nuvem de poeira na base
    for (let i = 0; i < 4; i++) {
      const k = (t * 1.5 + i / 4) % 1;
      ctx.fillStyle = `rgba(215,185,135,${0.45 * (1 - k)})`;
      ctx.beginPath(); ctx.arc((i - 1.5) * r * 0.5 + sway(1), bottom - k * r * 0.3, r * (0.25 + k * 0.3), 0, Math.PI * 2); ctx.fill();
    }
  }
}

// Língua de fogo saindo de (x, y) para cima (tilt inclina a ponta)
function flameTongue(ctx, x, y, h, w, tilt, t) {
  const sway = Math.sin(t * 13) * w * 0.6 + tilt * h;
  for (const [k, c] of [[1, '#ff5a14'], [0.65, '#ffb347'], [0.35, '#fff0b0']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - w * k, y);
    ctx.quadraticCurveTo(x - w * k * 0.8, y - h * k * 0.6, x + sway * k, y - h * k);
    ctx.quadraticCurveTo(x + w * k * 0.8, y - h * k * 0.6, x + w * k, y);
    ctx.closePath();
    ctx.fill();
  }
}

// Tornado: funil translúcido com faixas em espiral girando, poeira na base,
// folhas voando em volta e linhas de sucção
function windShot(ctx, r, t, combo = null) {
  const col = TORNADO_COLORS[combo] ?? TORNADO_COLORS.ar;
  const top = -r * 1.5;
  const bottom = r * 1.4;
  const widthAt = (u) => r * (0.25 + 1.2 * Math.pow(1 - u, 1.4)); // u: 0 = topo, 1 = base
  const sway = (u) => Math.sin(t * 7 + u * 4) * r * 0.18 * u;
  // linhas de sucção (puxa os inimigos)
  ctx.strokeStyle = col.suction;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) {
    const a = t * 2 + (i * Math.PI) / 2;
    const rr = r * (2.2 + ((t * 1.5 + i * 0.25) % 1) * -0.9);
    ctx.beginPath(); ctx.arc(0, 0, Math.max(r * 1.2, rr), a, a + 0.8); ctx.stroke();
  }
  // brilho claro no meio do funil
  const glow = ctx.createLinearGradient(-r, 0, r, 0);
  glow.addColorStop(0, `rgba(${col.glow},0)`);
  glow.addColorStop(0.5, `rgba(${col.glow},${combo ? 0.5 : 0.35})`);
  glow.addColorStop(1, `rgba(${col.glow},0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    const y = top + (bottom - top) * u;
    if (i === 0) ctx.moveTo(-widthAt(u) * 0.8 + sway(u), y);
    else ctx.lineTo(-widthAt(u) * 0.8 + sway(u), y);
  }
  for (let i = 10; i >= 0; i--) {
    const u = i / 10;
    ctx.lineTo(widthAt(u) * 0.8 + sway(u), top + (bottom - top) * u);
  }
  ctx.closePath();
  ctx.fill();
  // faixas de vento em espiral girando (finas e grossas, brancas e turquesa)
  ctx.lineCap = 'round';
  for (let i = 0; i < 11; i++) {
    const u = (i + ((t * 3) % 1)) / 11;
    const y = top + (bottom - top) * u;
    const w = widthAt(u);
    const start = Math.PI * (0.05 + ((i * 0.37 + t * 2) % 0.4));
    ctx.strokeStyle = i % 3 === 0 ? col.bands[0] : col.bands[1];
    ctx.lineWidth = i % 2 ? 1.4 : 2.2;
    ctx.beginPath();
    ctx.ellipse(sway(u), y, w, r * 0.2, 0, start, start + Math.PI * 0.75);
    ctx.stroke();
  }
  // redemoinho de vento na base
  ctx.strokeStyle = col.base;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    const a = t * 8 + i * 2.1;
    ctx.beginPath(); ctx.ellipse(sway(1), bottom + 1, r * (0.5 + i * 0.25), r * 0.12, 0, a, a + 1.6); ctx.stroke();
  }
  if (combo) tornadoCombo(ctx, r, t, combo, top, bottom, widthAt, sway);
  // folhas girando em volta
  for (let i = 0; i < 3 && !combo; i++) {
    const a = t * 6 + (i * Math.PI * 2) / 3;
    const u = 0.25 + i * 0.25;
    const x = Math.cos(a) * (widthAt(u) + 3) + sway(u);
    const y = top + (bottom - top) * u + Math.sin(a) * 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a * 2);
    ctx.fillStyle = i % 2 ? '#7fbf4a' : '#a8d86a';
    ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 1.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ====================================================================== rastro do golpe

// Arco de corte da espada (coordenadas locais do lutador).
export function drawSlash(ctx, color, shoulder, angleNow, angleStart, alpha) {
  const toCanvas = (a) => Math.atan2(Math.cos(a), Math.sin(a));
  const r = 40;
  ctx.save();
  ctx.globalAlpha = alpha;
  const a0 = toCanvas(angleStart);
  const a1 = toCanvas(angleNow);
  const g = ctx.createRadialGradient(shoulder.x, shoulder.y, r - 12, shoulder.x, shoulder.y, r + 4);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.7, color);
  g.addColorStop(1, 'rgba(255,255,255,0.9)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(shoulder.x, shoulder.y, r + 4, a0, a1, a1 < a0);
  ctx.arc(shoulder.x, shoulder.y, r - 12, a1, a0, !(a1 < a0));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- lanças
// Mesma convenção: origem na mão, a ponta aponta para -y. A haste passa da
// mão para trás (cabo em +y) e a lâmina fica lá na frente (-y).

export function drawSpearArt(ctx, element, t) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (element === 'agua') tideSpear(ctx, t);
  else if (element === 'terra') stoneSpear(ctx, t);
  else if (element === 'ar') windSpear(ctx, t);
  else flameSpear(ctx, t);
  ctx.restore();
}

// Partes que todas as lanças usam ------------------------------------------

// Lâmina com nervura no meio: face esquerda clara, direita escura, fio claro
function ridgedBlade(ctx, pts, light, dark, edge, ridgeFrom, ridgeTo) {
  shape(ctx, pts);
  ctx.fillStyle = dark;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = light;
  ctx.fillRect(-20, ridgeTo - 4, 20, ridgeFrom - ridgeTo + 8);
  ctx.restore();
  shape(ctx, pts);
  outline(ctx, 1.8);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, ridgeFrom); ctx.lineTo(0, ridgeTo); ctx.stroke();
}

// Colar de metal entre a haste e a lâmina, com uma pedra no meio
function collar(ctx, y, w, metal, metalDark, gem, gemLight) {
  const g = ctx.createLinearGradient(-w, 0, w, 0);
  g.addColorStop(0, metalDark);
  g.addColorStop(0.35, metal);
  g.addColorStop(1, metalDark);
  ctx.fillStyle = g;
  shape(ctx, [[-w * 0.7, y + 5], [-w, y + 1], [-w * 0.8, y - 4], [w * 0.8, y - 4], [w, y + 1], [w * 0.7, y + 5]]);
  ctx.fill(); outline(ctx, 1.3);
  ctx.fillStyle = gem;
  ctx.beginPath(); ctx.arc(0, y + 0.5, 2.2, 0, Math.PI * 2); ctx.fill(); outline(ctx, 0.9);
  ctx.fillStyle = gemLight;
  ctx.beginPath(); ctx.arc(-0.7, y - 0.3, 0.8, 0, Math.PI * 2); ctx.fill();
}

// Borla (tufinho de fios) pendurada no colar, balançando
function tassel(ctx, y, colors, t, swing = 1) {
  const sway = Math.sin(t * 5) * 1.6 * swing;
  ctx.lineWidth = 1.3;
  colors.forEach((c, i) => {
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.moveTo(1.5, y);
    ctx.quadraticCurveTo(4 + i, y + 5, 3 + i * 1.3 + sway, y + 11 + i);
    ctx.stroke();
  });
  ctx.fillStyle = colors[0];
  ctx.beginPath(); ctx.arc(2, y + 0.5, 1.6, 0, Math.PI * 2); ctx.fill(); outline(ctx, 0.8);
}

// Fogo: haste de ferro queimado com rachaduras de brasa pulsando, colar
// dourado com rubi, borla vermelha e lâmina ondulada (como chama) de
// obsidiana com o fio derretido; brasinhas subindo da ponta
function flameSpear(ctx, t) {
  pole(ctx, '#2e1c1e', 'rgba(0,0,0,0.5)', 22, -40, 3.8);
  ctx.save();
  ctx.shadowColor = '#ff6a1a';
  ctx.shadowBlur = 5;
  ctx.strokeStyle = '#ff8a2a';
  ctx.lineWidth = 0.9;
  for (const [y, k] of [[16, 0], [5, 1], [-8, 2], [-22, 3], [-33, 4]]) {
    ctx.globalAlpha = 0.45 + Math.sin(t * 5 + k) * 0.35;
    ctx.beginPath(); ctx.moveTo(-1.4, y); ctx.lineTo(0.6, y - 3); ctx.lineTo(-0.6, y - 5.5); ctx.lineTo(1, y - 8); ctx.stroke();
  }
  ctx.restore();
  // cabo: ponteira de ferro e anel dourado
  ctx.fillStyle = '#3a2a2e';
  shape(ctx, [[-3, 19], [0, 27], [3, 19]]); ctx.fill(); outline(ctx, 1.2);
  ctx.fillStyle = '#d8ae52';
  ctx.beginPath(); ctx.rect(-3.2, 16, 6.4, 3); ctx.fill(); outline(ctx, 1);
  ctx.beginPath(); ctx.rect(-3.2, -2, 6.4, 2.6); ctx.fill(); outline(ctx, 1);
  collar(ctx, -41, 6, '#f0c860', '#9a6a20', '#d81e2a', '#ff9a9a');
  tassel(ctx, -38, ['#ff4a2a', '#ff8a2a', '#c81e1e'], t);
  // lâmina ondulada
  const pts = [[0, -45], [-4.5, -48], [-6.5, -55], [-4.5, -60], [-6, -66], [-3.5, -72], [-3.8, -77], [0, -88], [3.8, -77], [3.5, -72], [6, -66], [4.5, -60], [6.5, -55], [4.5, -48]];
  ridgedBlade(ctx, pts, '#4a3640', '#221820', 'rgba(255,190,120,0.7)', -47, -84);
  ctx.save();
  ctx.shadowColor = '#ff7a1a';
  ctx.shadowBlur = 10 + Math.sin(t * 7) * 3;
  const edge = ctx.createLinearGradient(0, -45, 0, -88);
  edge.addColorStop(0, '#ff6a1a');
  edge.addColorStop(1, '#ffe08a');
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  shape(ctx, pts);
  ctx.stroke();
  ctx.restore();
  // brasinhas subindo
  for (let i = 0; i < 3; i++) {
    const u = (t * 0.9 + i / 3) % 1;
    ctx.fillStyle = `rgba(255,${180 + i * 25},80,${1 - u})`;
    ctx.beginPath(); ctx.arc(Math.sin(t * 3 + i * 2) * 3, -86 - u * 14, 1.3 - u * 0.6, 0, Math.PI * 2); ctx.fill();
  }
}

// Água: haste azul-coral com espiral prateada, colar em forma de concha com
// pérola, tridente de três pontas com farpas e gotinhas caindo
function tideSpear(ctx, t) {
  pole(ctx, '#2468b0', 'rgba(0,30,80,0.5)', 22, -44, 3.6);
  // espiral prateada enrolando a haste
  ctx.strokeStyle = '#d8eef8';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  for (let y = 18; y > -40; y -= 1.5) {
    const x = Math.sin(y * 0.45) * 1.9;
    if (y === 18) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#d8eef8';
  shape(ctx, [[-2.6, 20], [0, 26], [2.6, 20]]); ctx.fill(); outline(ctx, 1.1);
  // concha
  ctx.fillStyle = '#f2e6d8';
  ctx.beginPath();
  ctx.moveTo(-7, -42); ctx.quadraticCurveTo(-7, -51, 0, -52); ctx.quadraticCurveTo(7, -51, 7, -42);
  ctx.closePath();
  ctx.fill(); outline(ctx, 1.4);
  ctx.strokeStyle = 'rgba(160,120,100,0.7)';
  ctx.lineWidth = 0.8;
  for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) {
    ctx.beginPath(); ctx.moveTo(0, -42); ctx.lineTo(Math.sin(a) * 6.5, -42 - Math.cos(a) * 9); ctx.stroke();
  }
  // tridente
  const g = ctx.createLinearGradient(-9, 0, 9, 0);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.45, '#bfe2f2');
  g.addColorStop(1, '#5f8fb4');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-10, -62); ctx.quadraticCurveTo(-10, -51, 0, -50); ctx.quadraticCurveTo(10, -51, 10, -62);
  ctx.lineTo(7.6, -62); ctx.quadraticCurveTo(7, -54, 0, -53.5); ctx.quadraticCurveTo(-7, -54, -7.6, -62);
  ctx.closePath();
  ctx.fill(); outline(ctx, 1.6);
  for (const [x, top, barb] of [[-8.8, -74, -1], [0, -88, 0], [8.8, -74, 1]]) {
    const pts = [[x - 1.5, -60], [x - 1.5, top + 8]];
    if (barb <= 0) pts.push([x - 4, top + 10]);
    pts.push([x - 1.6, top + 5], [x, top], [x + 1.6, top + 5]);
    if (barb >= 0) pts.push([x + 4, top + 10]);
    pts.push([x + 1.5, top + 8], [x + 1.5, -60]);
    shape(ctx, pts);
    ctx.fill(); outline(ctx, 1.4);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(x - 0.6, -60); ctx.lineTo(x - 0.6, top + 4); ctx.stroke();
  }
  // pérola
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(0, -51.5, 2.8, 0, Math.PI * 2); ctx.fill(); outline(ctx, 1);
  ctx.fillStyle = 'rgba(159,227,255,0.9)';
  ctx.beginPath(); ctx.arc(0.8, -50.8, 1.2, 0, Math.PI * 2); ctx.fill();
  // gotinhas pingando das pontas
  for (const [x, top, k] of [[-8.8, -74, 0], [0, -88, 0.4], [8.8, -74, 0.7]]) {
    const d = (t * 1.3 + k) % 1;
    ctx.fillStyle = `rgba(159,227,255,${0.9 * (1 - d)})`;
    ctx.beginPath(); ctx.ellipse(x, top + 4 + d * 26, 1.1, 1.6, 0, 0, Math.PI * 2); ctx.fill();
  }
}

// Terra: haste grossa de madeira com casca, corda amarrada, anéis de bronze
// com pedra verde, ponta enorme de pedra lascada com veio de âmbar e musgo
function stoneSpear(ctx, t) {
  pole(ctx, '#7a5532', 'rgba(40,20,5,0.5)', 22, -42, 5);
  // casca da madeira
  ctx.strokeStyle = 'rgba(50,28,10,0.55)';
  ctx.lineWidth = 0.8;
  for (const [y0, len, x] of [[14, 6, -1], [2, 8, 1], [-12, 7, -1.2], [-26, 6, 0.8]]) {
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + 0.3, y0 - len); ctx.stroke();
  }
  // corda
  ctx.strokeStyle = '#e2cc94';
  ctx.lineWidth = 1.4;
  for (const y0 of [-38, 8]) {
    for (let k = 0; k < 4; k++) {
      ctx.beginPath(); ctx.moveTo(-3.4, y0 + k * 2.4); ctx.lineTo(3.4, y0 + k * 2.4 + 1.6); ctx.stroke();
    }
  }
  // pomo de pedra
  ctx.fillStyle = '#6e665c';
  shape(ctx, [[-4, 18], [-4.5, 23], [0, 28], [4.5, 23], [4, 18]]); ctx.fill(); outline(ctx, 1.3);
  ctx.fillStyle = '#9a9286';
  shape(ctx, [[0, 28], [4.5, 23], [4, 18], [1, 19]]); ctx.fill();
  collar(ctx, -42, 6.5, '#c8904a', '#6e4a22', '#4fae5a', '#c8ffc8');
  // ponta de pedra lascada, com facetas
  const pts = [[-6.5, -45], [-8, -56], [-6.5, -66], [-3, -76], [0, -86], [3.5, -76], [7, -64], [8, -54], [6.5, -45]];
  shape(ctx, pts);
  ctx.fillStyle = '#7d756a';
  ctx.fill();
  ctx.save();
  shape(ctx, pts);
  ctx.clip();
  ctx.fillStyle = '#a89f92';
  shape(ctx, [[0, -86], [3.5, -76], [7, -64], [8, -54], [2, -56], [0.5, -70]]); ctx.fill();
  ctx.fillStyle = '#5a5248';
  shape(ctx, [[-6.5, -45], [-8, -56], [-6.5, -66], [-1.5, -60], [-1, -46]]); ctx.fill();
  ctx.fillStyle = '#c9c0b2';
  shape(ctx, [[0, -86], [1.8, -78], [0.5, -70]]); ctx.fill();
  // veio de âmbar brilhando
  ctx.strokeStyle = `rgba(255,180,60,${0.65 + Math.sin(t * 3) * 0.25})`;
  ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(-3, -50); ctx.lineTo(1, -58); ctx.lineTo(-0.5, -64); ctx.lineTo(2, -70); ctx.stroke();
  ctx.restore();
  shape(ctx, pts);
  outline(ctx, 2);
  // lascas na borda
  ctx.strokeStyle = 'rgba(30,20,10,0.6)';
  ctx.lineWidth = 0.8;
  for (const [x, y, dx] of [[-7.5, -52, 2], [-6, -64, 2], [7.4, -58, -2], [5, -70, -1.6]]) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y - 1.5); ctx.stroke();
  }
  // musgo e folhinhas
  ctx.fillStyle = '#5f9f3a';
  ctx.beginPath(); ctx.ellipse(-4, -37, 3, 1.6, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8ad05a';
  ctx.beginPath(); ctx.ellipse(-6.5, -33 + Math.sin(t * 2) * 0.4, 2.4, 1.1, 0.8, 0, Math.PI * 2); ctx.fill();
}

// Ar: haste perolada com fita verde-água enrolada, guarda em forma de asas,
// lâmina fina e longa com janelinha vazada e fio brilhando, fita solta
// voando e redemoinhos de vento em volta
function windSpear(ctx, t) {
  pole(ctx, '#eef7f4', 'rgba(60,110,100,0.35)', 22, -44, 3);
  ctx.strokeStyle = '#5fcfbc';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let y = 16; y > -40; y -= 1.5) {
    const x = Math.sin(y * 0.5) * 1.6;
    if (y === 16) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#bff3ea';
  shape(ctx, [[-2.2, 20], [0, 26], [2.2, 20]]); ctx.fill(); outline(ctx, 1);
  // guarda de asas
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#ffffff';
    shape(ctx, [[0, -44], [side * 4, -47], [side * 10, -45], [side * 12, -50], [side * 7, -50], [side * 3, -51]]);
    ctx.fill(); outline(ctx, 1.1);
    ctx.strokeStyle = 'rgba(95,207,188,0.8)';
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(side * 3, -47.5); ctx.lineTo(side * 10, -47.5); ctx.stroke();
  }
  // fita solta voando
  ctx.strokeStyle = '#7fd6c6';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(1, -40);
  for (let i = 1; i <= 7; i++) ctx.lineTo(3 + i * 2.6, -40 + i * 3.2 + Math.sin(t * 9 - i * 0.9) * 2.6);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // lâmina longa com janelinha
  const pts = [[0, -50], [-3.4, -56], [-2.6, -76], [0, -92], [2.6, -76], [3.4, -56]];
  ctx.save();
  ctx.shadowColor = '#7fffe0';
  ctx.shadowBlur = 9 + Math.sin(t * 4) * 3;
  shape(ctx, pts);
  const g = ctx.createLinearGradient(-3, 0, 3, 0);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.5, '#e6fbf6');
  g.addColorStop(1, '#a8dcd2');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  shape(ctx, pts);
  outline(ctx, 1.5);
  ctx.fillStyle = 'rgba(63,214,192,0.55)';
  shape(ctx, [[0, -60], [-1.2, -64], [0, -72], [1.2, -64]]); ctx.fill();
  ctx.strokeStyle = 'rgba(11,7,16,0.6)';
  ctx.lineWidth = 0.8;
  shape(ctx, [[0, -60], [-1.2, -64], [0, -72], [1.2, -64]]); ctx.stroke();
  // redemoinhos de vento girando em volta da lâmina
  ctx.strokeStyle = 'rgba(200,255,245,0.7)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 2; i++) {
    const a = t * 5 + i * Math.PI;
    ctx.beginPath();
    ctx.ellipse(0, -72 + i * 10, 7, 2.4, 0, a, a + 2.2);
    ctx.stroke();
  }
}

// Disparo sem elemento (Mortal): esfera de força prateada com miolo escuro,
// anel girando e rastro de faíscas brancas
function neutralShot(ctx, r, t) {
  // rastro
  for (let i = 1; i <= 4; i++) {
    ctx.fillStyle = `rgba(230,232,255,${0.35 - i * 0.07})`;
    ctx.beginPath(); ctx.arc(-i * r * 0.8, Math.sin(t * 20 + i) * 1.5, r * (1 - i * 0.16), 0, Math.PI * 2); ctx.fill();
  }
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.55, '#d8dcef');
  g.addColorStop(1, '#7a7e96');
  ctx.save();
  ctx.shadowColor = '#e8eaff';
  ctx.shadowBlur = 12;
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.stroke();
  // miolo escuro (o "vazio" de quem não tem elemento)
  ctx.fillStyle = '#1c1a22';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath(); ctx.arc(-r * 0.12, -r * 0.14, r * 0.1, 0, Math.PI * 2); ctx.fill();
  // anel girando
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.ellipse(0, 0, r * 1.35, r * 0.45, t * 6, 0, Math.PI * 1.3); ctx.stroke();
}
