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

// Pedra de magma (Terra + Fogo): pedra escura com rachaduras grossas em
// brasa, halo de calor e fogo atrás
function magmaShot(ctx, r, t) {
  const halo = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 2.2);
  halo.addColorStop(0, 'rgba(255,120,30,0.5)');
  halo.addColorStop(1, 'rgba(255,80,20,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(-r * 2.2, -r * 2.2, r * 4.4, r * 4.4);
  for (let i = 0; i < 3; i++) {
    const L = r * (2.6 - i * 0.6);
    const W = r * (0.8 - i * 0.18);
    const wob = Math.sin(t * 18 + i) * r * 0.2;
    ctx.fillStyle = ['rgba(255,80,20,0.8)', 'rgba(255,150,40,0.85)', 'rgba(255,220,120,0.9)'][i];
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -W);
    ctx.quadraticCurveTo(-L * 0.6, -W + wob, -L - r * 0.4, wob);
    ctx.quadraticCurveTo(-L * 0.6, W + wob, -r * 0.4, W);
    ctx.closePath();
    ctx.fill();
  }
  ctx.save();
  ctx.rotate(t * 10);
  const rock = [[-r, r * 0.2], [-r * 0.7, -r * 0.8], [r * 0.3, -r], [r, -r * 0.2], [r * 0.7, r * 0.8], [-r * 0.3, r]];
  shape(ctx, rock);
  ctx.fillStyle = '#2a1410';
  ctx.fill();
  ctx.fillStyle = '#4a2418';
  shape(ctx, [[-r, r * 0.2], [-r * 0.7, -r * 0.8], [r * 0.3, -r], [0, 0]]);
  ctx.fill();
  const pulse = 0.75 + Math.sin(t * 9) * 0.25;
  for (const [w, c] of [[3.6, `rgba(255,90,20,${pulse})`], [1.6, '#ffe08a']]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r * 0.3); ctx.lineTo(0, 0); ctx.lineTo(r * 0.7, -r * 0.1);
    ctx.moveTo(0, 0); ctx.lineTo(-r * 0.1, r * 0.75);
    ctx.moveTo(r * 0.2, -r * 0.05); ctx.lineTo(r * 0.3, -r * 0.7);
    ctx.stroke();
  }
  shape(ctx, rock);
  outline(ctx, 2);
  ctx.restore();
}

// Lama (Terra + Água): bola marrom molenga balançando, brilho de molhado e
// pingos caindo
function mudShot(ctx, r, t) {
  ctx.fillStyle = 'rgba(90,64,44,0.85)';
  for (let i = 0; i < 4; i++) {
    const k = (t * 3 + i / 4) % 1;
    ctx.beginPath(); ctx.arc(-r * (0.8 + k * 1.5), r * (0.2 + k * 1.2), r * 0.18 * (1 - k * 0.5), 0, Math.PI * 2); ctx.fill();
  }
  ctx.beginPath();
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const rr = r * (1 + Math.sin(a * 3 + t * 12) * 0.08 + Math.sin(a * 5 - t * 9) * 0.05);
    const x = Math.cos(a) * rr * 1.08;
    const y = Math.sin(a) * rr * 0.92;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r * 1.1);
  g.addColorStop(0, '#9a7450');
  g.addColorStop(0.6, '#6a4a30');
  g.addColorStop(1, '#3e2a1a');
  ctx.fillStyle = g;
  ctx.fill();
  outline(ctx, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.28, r * 0.14, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(40,25,15,0.5)';
  for (const [x, y, rr] of [[0.3, 0.2, 0.15], [-0.2, 0.4, 0.1], [0.5, -0.3, 0.09]]) {
    ctx.beginPath(); ctx.arc(x * r, y * r, rr * r, 0, Math.PI * 2); ctx.fill();
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
  if (combo === 'fogo') {
    // chamas na base e brasas girando
    for (let i = 0; i < 3; i++) {
      const fx = (i - 1) * r * 0.45 + sway(1);
      const fh = r * (0.7 + 0.3 * Math.sin(t * 16 + i * 2));
      ctx.fillStyle = i === 1 ? '#ffd25a' : '#ff6a1a';
      ctx.beginPath();
      ctx.moveTo(fx - r * 0.25, bottom);
      ctx.quadraticCurveTo(fx, bottom - fh * 1.2, fx + Math.sin(t * 9 + i) * 3, bottom - fh * 1.5);
      ctx.quadraticCurveTo(fx + r * 0.1, bottom - fh * 0.7, fx + r * 0.25, bottom);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd25a';
    for (let i = 0; i < 5; i++) {
      const a = t * 7 + i * 1.3;
      const u = (i + 0.5) / 5;
      ctx.beginPath(); ctx.arc(Math.cos(a) * widthAt(u) + sway(u), top + (bottom - top) * u, 1.6, 0, Math.PI * 2); ctx.fill();
    }
  } else if (combo === 'agua') {
    // nuvenzinha em cima e chuva caindo dentro
    ctx.fillStyle = 'rgba(150,170,200,0.85)';
    for (const [dx, rr] of [[-0.6, 0.45], [0, 0.6], [0.6, 0.45]]) {
      ctx.beginPath(); ctx.arc(dx * r * 1.2 + sway(0), top - r * 0.2, rr * r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(190,225,255,0.9)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) {
      const k = (t * 3 + i / 6) % 1;
      const x = (i / 5 - 0.5) * r * 1.6;
      const y = top + (bottom - top) * k;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 5); ctx.stroke();
    }
  } else if (combo === 'terra') {
    // grãos de areia girando
    ctx.fillStyle = '#d8b27a';
    for (let i = 0; i < 12; i++) {
      const a = t * 9 + i * 0.9;
      const u = ((i * 0.37) % 1);
      ctx.beginPath(); ctx.arc(Math.cos(a) * (widthAt(u) + 2) + sway(u), top + (bottom - top) * u + Math.sin(a) * 2, 1.1, 0, Math.PI * 2); ctx.fill();
    }
  }
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
