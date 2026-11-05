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

// Partes das espadas ------------------------------------------------------
// medidas: pomo +13 · empunhadura -3..+10 · guarda por volta de -5 · lâmina -8..-64

// Empunhadura de couro com faixas e o pomo com pedra
export function swGrip(ctx, leather, metal, dark, gem, t = 0) {
  ctx.save();
  shape(ctx, [[-2.9, 10], [-2.9, -3], [2.9, -3], [2.9, 10]]);
  ctx.fillStyle = leather;
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1.1;
  for (let y = 11; y > -5; y -= 2.8) { ctx.beginPath(); ctx.moveTo(-4, y); ctx.lineTo(4, y - 2); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 0.7;
  for (let y = 9.9; y > -5; y -= 2.8) { ctx.beginPath(); ctx.moveTo(-4, y); ctx.lineTo(4, y - 2); ctx.stroke(); }
  ctx.restore();
  shape(ctx, [[-2.9, 10], [-2.9, -3], [2.9, -3], [2.9, 10]]);
  outline(ctx, 1.4);
  const m = ctx.createLinearGradient(-4.5, 0, 4.5, 0);
  m.addColorStop(0, dark); m.addColorStop(0.4, metal); m.addColorStop(1, dark);
  ctx.fillStyle = m;
  shape(ctx, [[-3.6, 9.4], [3.6, 9.4], [3.6, 11.6], [-3.6, 11.6]]);
  ctx.fill(); outline(ctx, 1);
  // pomo
  shape(ctx, [[-3.4, 11.6], [-4.4, 14], [-2.4, 17.4], [2.4, 17.4], [4.4, 14], [3.4, 11.6]]);
  ctx.fill(); outline(ctx, 1.4);
  ctx.save();
  ctx.shadowColor = gem;
  ctx.shadowBlur = 4 + Math.sin(t * 4) * 1.5;
  ctx.fillStyle = gem;
  ctx.beginPath(); ctx.arc(0, 14.4, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, 14.4, 1.8, 0, Math.PI * 2); outline(ctx, 0.8);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(-0.6, 13.8, 0.6, 0, Math.PI * 2); ctx.fill();
}

// guarda com volume (luz em cima, sombra embaixo) e pedra no meio
export function swGuard(ctx, pts, metal, dark, gem, gemLight, t = 0, glow = 6) {
  const m = ctx.createLinearGradient(0, -10, 0, 0);
  m.addColorStop(0, metal); m.addColorStop(1, dark);
  ctx.fillStyle = m;
  shape(ctx, pts);
  ctx.fill(); outline(ctx, 1.8);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  shape(ctx, pts.filter(([, y]) => y < -4).map(([x, y]) => [x * 0.9, y + 0.8]));
  ctx.globalAlpha = 0.35;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.shadowColor = gem;
  ctx.shadowBlur = glow + Math.sin(t * 4) * 2;
  ctx.fillStyle = gem;
  shape(ctx, [[0, -8.6], [2.8, -5], [0, -1.6], [-2.8, -5]]);
  ctx.fill();
  ctx.restore();
  shape(ctx, [[0, -8.6], [2.8, -5], [0, -1.6], [-2.8, -5]]);
  outline(ctx, 1.1);
  ctx.fillStyle = gemLight;
  shape(ctx, [[0, -8.6], [-2.8, -5], [-0.7, -5.2]]);
  ctx.fill();
}

// ---------------------------------------------------------------- Fogo
// Lâmina larga de obsidiana com o dorso em labaredas, miolo de lava
// pulsando e fio em brasa; guarda de ferro com chifres curvados como
// chamas e um rubi; fagulhas subindo
function flameBlade(ctx, t) {
  swGrip(ctx, '#5a1a12', '#e8b23a', '#7a4a10', '#ff6a1f', t);
  // chamas atrás do dorso
  for (let i = 0; i < 3; i++) {
    const y = -22 - i * 12;
    const fl = Math.sin(t * 13 + i * 1.9) * 2;
    for (const [w, c] of [[1, '#ff5a14'], [0.6, '#ffc24a']]) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(5, y + 6 * w);
      ctx.quadraticCurveTo(11 * w + 3, y + 1, 10 * w + 4 + fl, y - 9 * w);
      ctx.quadraticCurveTo(7, y - 2, 5, y - 3 * w);
      ctx.closePath();
      ctx.fill();
    }
  }
  const blade = [[-5.2, -8], [-5.6, -42], [-3, -56], [0.5, -66], [4.4, -56], [7.6, -50], [5.4, -46], [7.8, -39], [5.4, -34], [7.8, -27], [5.4, -22], [7.6, -15], [5.2, -8]];
  spBlade(ctx, blade, '#5e4450', '#20141c', 'rgba(255,150,70,0.85)', -10, -60);
  // miolo de lava
  const pulse = 0.75 + Math.sin(t * 7) * 0.25;
  ctx.save();
  ctx.shadowColor = '#ff6a1a';
  ctx.shadowBlur = 8;
  for (const [w, c] of [[2.6, `rgba(255,90,20,${pulse})`], [1.1, '#ffe08a']]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(0.6, -11); ctx.lineTo(-0.8, -20); ctx.lineTo(1.4, -29); ctx.lineTo(-0.4, -39); ctx.lineTo(1, -48); ctx.lineTo(0.3, -56);
    ctx.moveTo(-0.8, -20); ctx.lineTo(-3.2, -24);
    ctx.moveTo(-0.4, -39); ctx.lineTo(3, -42);
    ctx.stroke();
  }
  ctx.restore();
  // fio em brasa
  ctx.save();
  ctx.shadowColor = '#ff7a1a';
  ctx.shadowBlur = 8 + Math.sin(t * 7) * 3;
  ctx.strokeStyle = 'rgba(255,170,80,0.9)';
  ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(-4.6, -10); ctx.lineTo(-5, -42); ctx.lineTo(-2.6, -55); ctx.lineTo(0.4, -64); ctx.stroke();
  ctx.restore();
  glint(ctx, blade, t, -10, -64, 2.8);
  // guarda com chifres de chama
  const guard = [[-13, -14], [-11, -8], [-4, -6], [4, -6], [11, -8], [13, -14], [12.6, -5], [5, -1.6], [-5, -1.6], [-12.6, -5]];
  swGuard(ctx, guard, '#6a5058', '#2a1c20', '#ff3a1f', '#ffb0a0', t, 9);
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#ff8a2a';
    ctx.beginPath(); ctx.arc(s * 12.6, -12.4, 1.4, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < 3; i++) {
    const u = (t * 0.9 + i / 3) % 1;
    ctx.fillStyle = `rgba(255,${180 + i * 25},80,${1 - u})`;
    ctx.beginPath(); ctx.arc(Math.sin(t * 3 + i * 2) * 4, -64 - u * 14, 1.3 - u * 0.6, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------------------------------------------------------------- Água
// Lâmina curva de água cristalina com crista de onda no dorso, uma
// correnteza de luz descendo por dentro, guarda de concha com pérola e
// gotinhas pingando da ponta
function tideBlade(ctx, t) {
  swGrip(ctx, '#173a6a', '#e6f6ff', '#6f9fc4', '#9fe3ff', t);
  const blade = new Path2D();
  blade.moveTo(-4.6, -8);
  blade.quadraticCurveTo(-8, -36, 2.4, -66);
  blade.quadraticCurveTo(8.6, -57, 7.8, -48);
  for (let i = 0; i < 4; i++) {
    const y = -48 + i * 9.5;
    blade.quadraticCurveTo(11.5, y + 2.4, 6.8, y + 7);
    blade.quadraticCurveTo(5.6, y + 8.2, 7.2, y + 9.5);
  }
  blade.lineTo(4.8, -8);
  blade.closePath();
  const g = ctx.createLinearGradient(-6, 0, 9, 0);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.3, '#9fe3ff');
  g.addColorStop(0.75, '#2f86f0');
  g.addColorStop(1, '#174a9a');
  ctx.fillStyle = g;
  ctx.fill(blade);
  ctx.save();
  ctx.clip(blade);
  // correnteza de luz descendo
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.8 + i / 3) % 1;
    const y = -64 + k * 56;
    ctx.fillStyle = `rgba(255,255,255,${0.55 * Math.sin(k * Math.PI)})`;
    ctx.beginPath(); ctx.ellipse(-0.5 + Math.sin(y * 0.2) * 1.5, y, 1.6, 6, 0, 0, Math.PI * 2); ctx.fill();
  }
  // bolhinhas
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (const [x, y] of [[2, -20], [3.5, -33], [1, -46]]) { ctx.beginPath(); ctx.arc(x, y, 0.9, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.stroke(blade);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-3.6, -10); ctx.quadraticCurveTo(-6.6, -36, 1.6, -62); ctx.stroke();
  // guarda de concha
  ctx.fillStyle = '#f6ece0';
  ctx.beginPath();
  ctx.moveTo(-10, -4); ctx.quadraticCurveTo(-10, -13, 0, -14); ctx.quadraticCurveTo(10, -13, 10, -4);
  ctx.quadraticCurveTo(0, -1, -10, -4);
  ctx.closePath();
  ctx.fill(); outline(ctx, 1.6);
  ctx.strokeStyle = 'rgba(160,120,100,0.75)';
  ctx.lineWidth = 0.9;
  for (const a of [-1.1, -0.55, 0, 0.55, 1.1]) { ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(Math.sin(a) * 9, -3 - Math.cos(a) * 10); ctx.stroke(); }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(0, -4.5, 2.6, 0, Math.PI * 2); ctx.fill(); outline(ctx, 1);
  ctx.fillStyle = 'rgba(95,208,255,0.85)';
  ctx.beginPath(); ctx.arc(0.8, -3.9, 1.1, 0, Math.PI * 2); ctx.fill();
  // gotinha caindo da ponta
  const d = (t * 1.1) % 1;
  ctx.fillStyle = `rgba(159,227,255,${0.9 * (1 - d)})`;
  ctx.beginPath(); ctx.ellipse(8, -40 + d * 26, 1.2, 1.8, 0, 0, Math.PI * 2); ctx.fill();
}

// ---------------------------------------------------------------- Terra
// Espadão de pedra: lâmina larga com facetas lascadas, runa e cristal de
// âmbar brilhando, guarda grossa de bronze com pedra verde e musgo
function stoneBlade(ctx, t) {
  swGrip(ctx, '#4a3018', '#d8a868', '#7a4c22', '#4fae5a', t);
  const blade = [[-7, -8], [-8, -38], [-6.5, -52], [-2.5, -62], [0.5, -66], [4, -60], [7.4, -50], [8.2, -36], [7, -8]];
  shape(ctx, blade);
  ctx.fillStyle = '#867a6a';
  ctx.fill();
  ctx.save();
  shape(ctx, blade);
  ctx.clip();
  ctx.fillStyle = '#b4a898';
  shape(ctx, [[-8, -40], [-2, -44], [0.5, -66], [-6.5, -52]]); ctx.fill();
  ctx.fillStyle = '#a09484';
  shape(ctx, [[-7, -8], [-2, -12], [-2, -44], [-8, -40]]); ctx.fill();
  ctx.fillStyle = '#5e5448';
  shape(ctx, [[2, -12], [7, -8], [8.2, -36], [3, -40]]); ctx.fill();
  ctx.fillStyle = '#6e6458';
  shape(ctx, [[3, -40], [8.2, -36], [7.4, -50], [0.5, -66], [-2, -44]]); ctx.fill();
  // rachaduras
  ctx.strokeStyle = 'rgba(30,20,10,0.55)';
  ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(-6, -20); ctx.lineTo(-3, -24); ctx.lineTo(-5, -29); ctx.moveTo(6, -46); ctx.lineTo(3.5, -50); ctx.stroke();
  // runa de âmbar
  ctx.shadowColor = '#ffb347';
  ctx.shadowBlur = 6 + Math.sin(t * 3) * 2;
  ctx.strokeStyle = `rgba(255,190,80,${0.75 + Math.sin(t * 3) * 0.2})`;
  ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(-3, -14); ctx.lineTo(-1, -19); ctx.lineTo(0.4, -16.5); ctx.lineTo(1.6, -18.5); ctx.lineTo(3, -14); ctx.closePath(); ctx.stroke();
  ctx.restore();
  shape(ctx, blade);
  outline(ctx, 2.2);
  // cristal de âmbar encravado
  ctx.save();
  ctx.shadowColor = '#ffb347';
  ctx.shadowBlur = 7;
  const amber = ctx.createLinearGradient(-2.5, 0, 2.5, 0);
  amber.addColorStop(0, '#fff0a8'); amber.addColorStop(1, '#d8861e');
  ctx.fillStyle = amber;
  shape(ctx, [[0, -30], [-3, -36], [0, -44], [3, -36]]);
  ctx.fill();
  ctx.restore();
  shape(ctx, [[0, -30], [-3, -36], [0, -44], [3, -36]]);
  outline(ctx, 1.1);
  glint(ctx, blade, t, -10, -64, 3.4);
  // guarda grossa de bronze
  const guard = [[-13, -11], [-12, -6.5], [-5, -5.5], [5, -5.5], [12, -6.5], [13, -11], [14, -4], [6, -1], [-6, -1], [-14, -4]];
  swGuard(ctx, guard, '#e2b070', '#7a4c22', '#4fae5a', '#c8ffc8', t, 5);
  // musgo e folhinha
  ctx.fillStyle = '#5f9f3a';
  ctx.beginPath(); ctx.ellipse(-8, -9, 3.2, 1.6, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8ad05a';
  ctx.save(); ctx.translate(-11, -10); ctx.rotate(-0.6 + Math.sin(t * 2) * 0.1);
  ctx.beginPath(); ctx.ellipse(0, -2, 1.3, 2.8, 0, 0, Math.PI * 2); ctx.fill(); outline(ctx, 0.7);
  ctx.restore();
}

// ---------------------------------------------------------------- Ar
// Lâmina longa e fina de pérola com sulco verde-água brilhando, guarda de
// asas emplumadas, fita presa no pomo voando e redemoinhos em volta
function windBlade(ctx, t) {
  // fita voando do pomo
  ctx.strokeStyle = '#4fd1b8';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, 16);
  for (let i = 1; i <= 7; i++) ctx.lineTo(-i * 2.6, 16 + i * 2 + Math.sin(t * 9 - i * 0.9) * 2.6);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  swGrip(ctx, '#2f7f74', '#ffffff', '#9cc8bf', '#7fffe0', t);
  const blade = [[-3.4, -8], [-3.6, -50], [-2, -60], [0, -70], [2, -60], [3.6, -50], [3.4, -8]];
  ctx.save();
  ctx.shadowColor = '#7fffe0';
  ctx.shadowBlur = 8 + Math.sin(t * 4) * 3;
  shape(ctx, blade);
  ctx.fillStyle = '#e6fbf6';
  ctx.fill();
  ctx.restore();
  spBlade(ctx, blade, '#ffffff', '#b4ddd4', 'rgba(127,255,224,0.9)', -10, -66);
  // sulco verde-água
  ctx.fillStyle = 'rgba(40,170,150,0.55)';
  shape(ctx, [[-0.8, -12], [-0.8, -50], [0, -56], [0.8, -50], [0.8, -12]]);
  ctx.fill();
  glint(ctx, blade, t, -10, -68, 2.2);
  // guarda de asas emplumadas
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === 0 ? '#ffffff' : i === 1 ? '#e6fbf6' : '#c4efe6';
      ctx.beginPath();
      const by = -8 + i * 2;
      ctx.moveTo(side * 2.5, by);
      ctx.quadraticCurveTo(side * (9 - i), by - 7 + i, side * (15 - i * 2.6), by - 6 + i * 1.6);
      ctx.quadraticCurveTo(side * (8 - i), by + 1, side * 2.5, by + 2.6);
      ctx.closePath();
      ctx.fill(); outline(ctx, 1);
    }
  }
  ctx.save();
  ctx.shadowColor = '#7fffe0';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#7fffe0';
  ctx.beginPath(); ctx.arc(0, -5, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, -5, 2.2, 0, Math.PI * 2); outline(ctx, 1);
  // redemoinhos de vento
  ctx.strokeStyle = 'rgba(200,255,245,0.75)';
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 2; i++) {
    const a = t * 5 + i * Math.PI;
    ctx.beginPath(); ctx.ellipse(0, -46 + i * 16, 8, 2.6, 0, a, a + 2.2); ctx.stroke();
  }
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

// Cajados: haste curta de +14 a -30 (como os originais), ponteira pequena
// embaixo e a cabeça logo acima da haste.

// ponteira pequena no pé do cajado
function stButt(ctx, light, dark) {
  const m = ctx.createLinearGradient(-3, 0, 3, 0);
  m.addColorStop(0, light); m.addColorStop(1, dark);
  ctx.fillStyle = m;
  shape(ctx, [[-2.8, 13], [0, 20], [2.8, 13]]);
  ctx.fill(); outline(ctx, 1.3);
}

// anel de metal na haste
function stRing(ctx, y, metal, dark, dot) {
  const m = ctx.createLinearGradient(-4, 0, 4, 0);
  m.addColorStop(0, dark); m.addColorStop(0.4, metal); m.addColorStop(1, dark);
  ctx.fillStyle = m;
  shape(ctx, [[-3.6, y - 1.3], [3.6, y - 1.3], [3.6, y + 1.3], [-3.6, y + 1.3]]);
  ctx.fill(); outline(ctx, 1);
  if (dot) { ctx.fillStyle = dot; ctx.beginPath(); ctx.arc(0, y, 0.9, 0, Math.PI * 2); ctx.fill(); }
}

// ---------------------------------------------------------------- Fogo
// Madeira queimada com anéis de ferro e brasas; no alto, um braseiro de
// ferro com três garras curvas segurando a bola de fogo, e faíscas subindo
function flameStaff(ctx, t) {
  spShaft(ctx, '#6a3a30', '#3a1e1a', '#1c0e0c', 4.8, 14, -30);
  stButt(ctx, '#5a5a62', '#2a2a32');
  stRing(ctx, 6, '#e8b23a', '#7a4a10', '#ff8a2a');
  for (const y of [-8, -22]) {
    const m = ctx.createLinearGradient(-4, 0, 4, 0);
    m.addColorStop(0, '#3a3a42'); m.addColorStop(0.4, '#8a8a92'); m.addColorStop(1, '#3a3a42');
    ctx.fillStyle = m;
    shape(ctx, [[-3.8, y - 1.4], [3.8, y - 1.4], [3.8, y + 1.4], [-3.8, y + 1.4]]);
    ctx.fill(); outline(ctx, 1);
    ctx.fillStyle = '#ff8a2a';
    ctx.beginPath(); ctx.arc(0, y, 0.9, 0, Math.PI * 2); ctx.fill();
  }
  // cabeça mais perto da mão e um pouco menor (como os cajados originais)
  ctx.save();
  ctx.translate(0, 16);
  ctx.translate(0, -62);
  ctx.scale(0.88, 0.88);
  ctx.translate(0, 62);
  // brilho da brasa por trás
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const halo = ctx.createRadialGradient(0, -62, 2, 0, -62, 20);
  halo.addColorStop(0, `rgba(255,150,50,${0.45 + Math.sin(t * 6) * 0.1})`);
  halo.addColorStop(1, 'rgba(255,90,20,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(-20, -82, 40, 40);
  ctx.restore();
  // bola de fogo
  drawFireball(ctx, 0, -62, 8.2 + Math.sin(t * 7) * 0.7, t, 0);
  // garras de ferro na frente da bola
  for (const s of [-1, 0, 1]) {
    for (const [w, c] of [[4.6, INK], [2.4, s ? '#5a5a62' : '#7a7a82']]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.beginPath();
      if (s) { ctx.moveTo(s * 3, -47); ctx.quadraticCurveTo(s * 14, -54, s * 10, -68); ctx.lineTo(s * 6, -72); }
      else { ctx.moveTo(0, -48); ctx.lineTo(0, -53); }
      ctx.stroke();
    }
  }
  // base do braseiro
  const b = ctx.createLinearGradient(-7, 0, 7, 0);
  b.addColorStop(0, '#3a3a42'); b.addColorStop(0.4, '#9a9aa2'); b.addColorStop(1, '#3a3a42');
  ctx.fillStyle = b;
  shape(ctx, [[-4, -45], [-7.5, -49], [-6, -52], [6, -52], [7.5, -49], [4, -45]]);
  ctx.fill(); outline(ctx, 1.4);
  ctx.save();
  ctx.shadowColor = '#ff3a1f'; ctx.shadowBlur = 6;
  ctx.fillStyle = '#ff3a1f';
  shape(ctx, [[0, -51.5], [2, -49], [0, -46.5], [-2, -49]]); ctx.fill();
  ctx.restore();
  shape(ctx, [[0, -51.5], [2, -49], [0, -46.5], [-2, -49]]); outline(ctx, 0.9);
  for (let i = 0; i < 4; i++) {
    const k = (t * 1.3 + i / 4) % 1;
    ctx.fillStyle = `rgba(255,${190 + i * 15},90,${1 - k})`;
    ctx.beginPath(); ctx.arc(Math.sin(i * 2 + t * 3) * 5, -72 - k * 16, 1.1 - k * 0.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- Água
// Madeira clara de praia com amarração turquesa; no alto, uma onda curva
// que se fecha em volta de uma esfera de água com correnteza girando,
// bolhas subindo e uma pérola
function tideStaff(ctx, t) {
  spShaft(ctx, '#f0dcb4', '#d8c29a', '#a88a5a', 4.6, 14, -30);
  ctx.strokeStyle = '#2aa6c8';
  ctx.lineWidth = 1.5;
  for (const y of [-10, -22]) {
    ctx.beginPath(); ctx.moveTo(-3, y - 2.4); ctx.lineTo(3, y + 2.4); ctx.moveTo(3, y - 2.4); ctx.lineTo(-3, y + 2.4); ctx.stroke();
  }
  stButt(ctx, '#f6ecd8', '#b8a07a');
  // cabeça mais perto da mão e um pouco menor (como os cajados originais)
  ctx.save();
  ctx.translate(0, 16);
  ctx.translate(0, -62);
  ctx.scale(0.88, 0.88);
  ctx.translate(0, 62);
  // onda curva (atrás da esfera)
  const wave = ctx.createLinearGradient(-12, 0, 12, 0);
  wave.addColorStop(0, '#9fe3ff'); wave.addColorStop(0.6, '#2f86f0'); wave.addColorStop(1, '#174a9a');
  ctx.fillStyle = wave;
  ctx.beginPath();
  ctx.moveTo(-3, -46);
  ctx.quadraticCurveTo(-15, -52, -13, -66);
  ctx.quadraticCurveTo(-11, -80, 2, -80);
  ctx.quadraticCurveTo(13, -79, 13, -70);
  ctx.quadraticCurveTo(8, -75, 3, -73);
  ctx.quadraticCurveTo(-7, -70, -7, -61);
  ctx.quadraticCurveTo(-6, -52, 3, -46);
  ctx.closePath();
  ctx.fill(); outline(ctx, 1.8);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-11, -58); ctx.quadraticCurveTo(-11, -76, 2, -78); ctx.stroke();
  // espuma na crista
  ctx.fillStyle = '#ffffff';
  for (const [x, y, r] of [[13, -70, 1.6], [10.5, -73, 1.2], [8, -75, 1]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  // esfera de água
  const cy = -61;
  const orb = ctx.createRadialGradient(-2, cy - 3, 1, 0, cy, 8.5);
  orb.addColorStop(0, '#ffffff'); orb.addColorStop(0.35, '#9fe3ff'); orb.addColorStop(1, '#1e64c8');
  ctx.save();
  ctx.shadowColor = '#5fd0ff'; ctx.shadowBlur = 10;
  ctx.fillStyle = orb;
  ctx.beginPath(); ctx.arc(1.5, cy, 8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.arc(1.5, cy, 8, 0, Math.PI * 2); outline(ctx, 1.6);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 2; i++) {
    const a = t * 4 + i * Math.PI;
    ctx.beginPath(); ctx.arc(1.5, cy, 4.6 - i * 1.6, a, a + 2.4); ctx.stroke();
  }
  // bolhas subindo
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.7 + i / 3) % 1;
    ctx.strokeStyle = `rgba(200,240,255,${1 - k})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(-4 + i * 4 + Math.sin(t * 2 + i) * 1.5, -74 - k * 14, 1.1 + k * 0.6, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- Terra
// Galho retorcido com folhas e casca; no alto, raízes abraçando um geodo
// com cristais de âmbar e esmeralda, e pedrinhas flutuando em volta
function stoneStaff(ctx, t) {
  // galho retorcido
  ctx.strokeStyle = INK;
  ctx.lineWidth = 8.6;
  ctx.beginPath(); ctx.moveTo(0, 16); ctx.quadraticCurveTo(-3, -2, 1, -14); ctx.quadraticCurveTo(4, -26, 0, -32); ctx.stroke();
  const wood = ctx.createLinearGradient(-3, 0, 3, 0);
  wood.addColorStop(0, '#b07a48'); wood.addColorStop(0.5, '#7a5532'); wood.addColorStop(1, '#4a3018');
  ctx.strokeStyle = wood;
  ctx.lineWidth = 5.2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(40,20,5,0.55)';
  ctx.lineWidth = 0.9;
  for (const [x, y] of [[-1.5, 6], [1, -8], [1.6, -20]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.4, y - 6); ctx.stroke(); }
  // folhas no galho
  for (const [x, y, a] of [[3, -12, 0.8], [-3.5, -22, -0.9], [3, -27, 0.6]]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.sin(t * 2 + y) * 0.08);
    ctx.fillStyle = '#6fbf4a';
    ctx.beginPath(); ctx.ellipse(0, -3.4, 1.9, 4, 0, 0, Math.PI * 2); ctx.fill(); outline(ctx, 0.9);
    ctx.strokeStyle = 'rgba(30,80,20,0.6)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(0, -0.5); ctx.lineTo(0, -6.5); ctx.stroke();
    ctx.restore();
  }
  // cabeça mais perto da mão e um pouco menor (como os cajados originais)
  ctx.save();
  ctx.translate(0, 16);
  ctx.translate(0, -62);
  ctx.scale(0.88, 0.88);
  ctx.translate(0, 62);
  // raízes abraçando o geodo
  for (const s of [-1, 1]) {
    for (const [w, c] of [[4.4, INK], [2.4, '#6a4426']]) {
      ctx.strokeStyle = c; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(0, -46); ctx.quadraticCurveTo(s * 12, -52, s * 9, -66); ctx.quadraticCurveTo(s * 6, -72, s * 2, -72); ctx.stroke();
    }
  }
  // geodo: pedra escura com cristais
  ctx.fillStyle = '#5a5248';
  shape(ctx, [[-7, -52], [-8, -60], [-4, -68], [4, -68], [8, -60], [7, -52], [0, -49]]);
  ctx.fill(); outline(ctx, 1.6);
  ctx.save();
  ctx.shadowColor = '#ffb347'; ctx.shadowBlur = 8 + Math.sin(t * 3) * 2;
  for (const [x, h, a, c1, c2] of [[-2, 14, -0.25, '#fff0a8', '#d8861e'], [3, 11, 0.3, '#c8ffc8', '#3a9a4a'], [0, 17, 0.02, '#fff6c8', '#e8a020']]) {
    ctx.save(); ctx.translate(x, -58); ctx.rotate(a);
    const g = ctx.createLinearGradient(-2.6, 0, 2.6, 0);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g;
    shape(ctx, [[-2.6, 0], [-2.6, -h + 4], [0, -h], [2.6, -h + 4], [2.6, 0]]);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  for (const [x, h, a] of [[-2, 14, -0.25], [3, 11, 0.3], [0, 17, 0.02]]) {
    ctx.save(); ctx.translate(x, -58); ctx.rotate(a);
    shape(ctx, [[-2.6, 0], [-2.6, -h + 4], [0, -h], [2.6, -h + 4], [2.6, 0]]);
    outline(ctx, 1.1);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(-1.8, -h + 5, 1, h - 7);
    ctx.restore();
  }
  // pedrinhas flutuando
  for (let i = 0; i < 3; i++) {
    const a = t * 1.4 + (i * Math.PI * 2) / 3;
    const x = Math.cos(a) * 13;
    const y = -62 + Math.sin(a) * 5;
    ctx.fillStyle = '#9a9286';
    shape(ctx, [[x - 2, y], [x - 0.5, y - 2], [x + 2, y - 1], [x + 1.5, y + 1.6], [x - 1, y + 1.8]]);
    ctx.fill(); outline(ctx, 0.9);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- Ar
// Haste perolada com fita em espiral; no alto, um aro com asas emplumadas
// e uma esfera de vento com redemoinho girando, penas balançando
function windStaff(ctx, t) {
  spShaft(ctx, '#ffffff', '#e6f6f2', '#a8d8ce', 4.2, 14, -30);
  ctx.strokeStyle = '#4fd1b8';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (let y = -4; y > -29; y -= 1.4) {
    const x = Math.sin(y * 0.5) * 1.7;
    if (y === -4) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  stButt(ctx, '#ffffff', '#9cc8bf');
  stRing(ctx, 4, '#4fd1b8', '#2f9f8c');
  // cabeça mais perto da mão e um pouco menor (como os cajados originais)
  ctx.save();
  ctx.translate(0, 16);
  ctx.translate(0, -62);
  ctx.scale(0.88, 0.88);
  ctx.translate(0, 62);
  const cy = -62;
  // asas
  for (const side of [-1, 1]) {
    const flap = Math.sin(t * 4 + side) * 1.2;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === 0 ? '#ffffff' : i === 1 ? '#e6fbf6' : '#c4efe6';
      ctx.beginPath();
      const by = cy + 2 + i * 3;
      ctx.moveTo(side * 9, by);
      ctx.quadraticCurveTo(side * (16 - i), by - 9 + i + flap, side * (22 - i * 3), by - 7 + i * 2 + flap);
      ctx.quadraticCurveTo(side * (15 - i), by + 1, side * 9, by + 4);
      ctx.closePath();
      ctx.fill(); outline(ctx, 1.1);
    }
  }
  // aro
  for (const [w, c] of [[5, INK], [2.8, '#ffffff']]) {
    ctx.strokeStyle = c; ctx.lineWidth = w;
    ctx.beginPath(); ctx.arc(0, cy, 11, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.strokeStyle = '#4fd1b8';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, cy, 11, Math.PI * 0.9, Math.PI * 1.6); ctx.stroke();
  // esfera de vento
  ctx.save();
  ctx.shadowColor = '#7fffe0'; ctx.shadowBlur = 10;
  const orb = ctx.createRadialGradient(-2, cy - 2, 1, 0, cy, 8);
  orb.addColorStop(0, '#ffffff'); orb.addColorStop(1, '#4fd1b8');
  ctx.fillStyle = orb;
  ctx.beginPath(); ctx.arc(0, cy, 7.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, cy, 7.4, 0, Math.PI * 2); outline(ctx, 1.2);
  ctx.strokeStyle = 'rgba(20,110,100,0.9)';
  ctx.lineWidth = 1.3;
  for (let i = 0; i < 3; i++) {
    const a = t * 5 + (i * Math.PI * 2) / 3;
    ctx.beginPath(); ctx.arc(Math.cos(a) * 1.5, cy + Math.sin(a) * 1.5, 4.2, a, a + 2); ctx.stroke();
  }
  // encaixe
  const m = ctx.createLinearGradient(-5, 0, 5, 0);
  m.addColorStop(0, '#9cc8bf'); m.addColorStop(0.4, '#ffffff'); m.addColorStop(1, '#9cc8bf');
  ctx.fillStyle = m;
  shape(ctx, [[-3.6, -45], [-5.4, -49], [-3, -51.5], [3, -51.5], [5.4, -49], [3.6, -45]]);
  ctx.fill(); outline(ctx, 1.2);
  // redemoinho em volta
  ctx.strokeStyle = 'rgba(200,255,245,0.75)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const a = -t * 3 + (i * Math.PI * 2) / 3;
    ctx.beginPath(); ctx.arc(0, cy, 16, a, a + 0.7); ctx.stroke();
  }
  ctx.restore();
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
//   ponteira +16..+28 · empunhadura -2..+14 · haste até -48 · alvado -48..-57
//   lâmina -57..-95

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

// Haste com volume: contorno, degradê (claro à esquerda) e um fio de luz
export function spShaft(ctx, light, mid, dark, w = 5, from = 24, to = -50) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = w + 3.4;
  ctx.beginPath(); ctx.moveTo(0, from); ctx.lineTo(0, to); ctx.stroke();
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, light);
  g.addColorStop(0.45, mid);
  g.addColorStop(1, dark);
  ctx.strokeStyle = g;
  ctx.lineWidth = w;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(-w * 0.28, from - 2); ctx.lineTo(-w * 0.28, to + 2); ctx.stroke();
}

// Empunhadura de couro com faixas inclinadas e anéis de metal
export function spGrip(ctx, leather, ring, ringDark, w = 3.4) {
  ctx.save();
  shape(ctx, [[-w, 14], [-w, -2], [w, -2], [w, 14]]);
  ctx.fillStyle = leather;
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1.1;
  for (let y = 15; y > -4; y -= 3) { ctx.beginPath(); ctx.moveTo(-w - 1, y); ctx.lineTo(w + 1, y - 2.2); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 0.7;
  for (let y = 13.8; y > -4; y -= 3) { ctx.beginPath(); ctx.moveTo(-w - 1, y); ctx.lineTo(w + 1, y - 2.2); ctx.stroke(); }
  ctx.restore();
  shape(ctx, [[-w, 14], [-w, -2], [w, -2], [w, 14]]);
  outline(ctx, 1.2);
  for (const y of [-3, 15]) {
    const m = ctx.createLinearGradient(-w - 1, 0, w + 1, 0);
    m.addColorStop(0, ringDark); m.addColorStop(0.4, ring); m.addColorStop(1, ringDark);
    ctx.fillStyle = m;
    shape(ctx, [[-w - 0.8, y - 1.4], [w + 0.8, y - 1.4], [w + 0.8, y + 1.4], [-w - 0.8, y + 1.4]]);
    ctx.fill(); outline(ctx, 1);
  }
}

// Ponteira de metal no fim do cabo
export function spButt(ctx, light, dark) {
  const m = ctx.createLinearGradient(-3.5, 0, 3.5, 0);
  m.addColorStop(0, light); m.addColorStop(1, dark);
  ctx.fillStyle = m;
  shape(ctx, [[-3.4, 17], [-2.6, 23], [0, 29], [2.6, 23], [3.4, 17]]);
  ctx.fill(); outline(ctx, 1.3);
}

// Alvado: peça de metal que prende a lâmina, com as tiras descendo pela
// haste e uma pedra na frente
export function spSocket(ctx, metal, dark, gem, gemLight, glow = 0, t = 0) {
  const m = ctx.createLinearGradient(-6, 0, 6, 0);
  m.addColorStop(0, dark); m.addColorStop(0.38, metal); m.addColorStop(1, dark);
  ctx.fillStyle = m;
  // tiras (langetas)
  for (const x of [-2.6, 2.6]) {
    shape(ctx, [[x - 0.9, -48], [x + 0.9, -48], [x + 0.6, -38], [x, -36], [x - 0.6, -38]]);
    ctx.fill(); outline(ctx, 0.8);
  }
  // corpo do alvado, alargando até a lâmina
  shape(ctx, [[-3.6, -47], [-4.4, -50], [-6, -55], [-4.6, -58], [4.6, -58], [6, -55], [4.4, -50], [3.6, -47]]);
  ctx.fill(); outline(ctx, 1.4);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  shape(ctx, [[-4.2, -50.5], [-5.2, -55], [-3.8, -56.6], [-3, -51]]);
  ctx.fill();
  // anel de baixo
  ctx.fillStyle = metal;
  shape(ctx, [[-4.4, -46], [4.4, -46], [4.4, -48.6], [-4.4, -48.6]]);
  ctx.fill(); outline(ctx, 1);
  // pedra
  ctx.save();
  if (glow) { ctx.shadowColor = gem; ctx.shadowBlur = glow + Math.sin(t * 4) * 2; }
  ctx.fillStyle = gem;
  shape(ctx, [[0, -56.6], [2.6, -53.4], [0, -50], [-2.6, -53.4]]);
  ctx.fill();
  ctx.restore();
  shape(ctx, [[0, -56.6], [2.6, -53.4], [0, -50], [-2.6, -53.4]]);
  outline(ctx, 1);
  ctx.fillStyle = gemLight;
  shape(ctx, [[0, -56.6], [-2.6, -53.4], [-0.6, -53.6]]);
  ctx.fill();
}

// Lâmina com nervura: face esquerda clara, direita escura, fio claro por dentro
export function spBlade(ctx, pts, light, dark, edgeLight, ridgeFrom, ridgeTo) {
  shape(ctx, pts);
  ctx.fillStyle = dark;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = light;
  ctx.fillRect(-20, ridgeTo - 6, 20, ridgeFrom - ridgeTo + 12);
  // fio claro acompanhando a borda (desenhado por dentro)
  shape(ctx, pts);
  ctx.strokeStyle = edgeLight;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.restore();
  shape(ctx, pts);
  outline(ctx, 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(-0.4, ridgeFrom); ctx.lineTo(-0.4, ridgeTo); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.moveTo(0.6, ridgeFrom); ctx.lineTo(0.6, ridgeTo); ctx.stroke();
}

// brilho que corre pela lâmina de vez em quando
export function glint(ctx, pts, t, from, to, every = 2.6) {
  const k = (t % every) / 0.5;
  if (k >= 1) return;
  const y = from + (to - from) * k;
  ctx.save();
  shape(ctx, pts);
  ctx.clip();
  const g = ctx.createLinearGradient(0, y - 6, 0, y + 6);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.75)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-12, y - 6, 24, 12);
  ctx.restore();
}

// Fogo -------------------------------------------------------------------
// Haste de ferro queimado com rachaduras de brasa, alvado dourado com rubi e
// duas labaredas de metal; lâmina de obsidiana ondulada como chama, com um
// miolo de lava pulsando e o fio em brasa; fagulhas subindo
function flameSpear(ctx, t) {
  spShaft(ctx, '#5a3a3a', '#2e1c1e', '#160c0e', 5);
  ctx.save();
  ctx.shadowColor = '#ff6a1a';
  ctx.shadowBlur = 5;
  ctx.strokeStyle = '#ff8a2a';
  ctx.lineWidth = 1;
  for (const [y, k] of [[-12, 0], [-24, 1], [-36, 2]]) {
    ctx.globalAlpha = 0.5 + Math.sin(t * 5 + k) * 0.35;
    ctx.beginPath(); ctx.moveTo(-1.6, y); ctx.lineTo(0.8, y - 3); ctx.lineTo(-0.7, y - 6); ctx.lineTo(1.1, y - 9); ctx.stroke();
  }
  ctx.restore();
  spGrip(ctx, '#4a1e14', '#e8b23a', '#8a5a14');
  spButt(ctx, '#e8b23a', '#7a4a10');
  // labaredas de metal saindo do alvado
  for (const side of [-1, 1]) {
    ctx.fillStyle = side < 0 ? '#ffb347' : '#e86a1a';
    ctx.beginPath();
    ctx.moveTo(side * 4, -50);
    ctx.quadraticCurveTo(side * 10, -50, side * 11, -57);
    ctx.quadraticCurveTo(side * 8, -55, side * 7.5, -58);
    ctx.quadraticCurveTo(side * 7, -53, side * 4.5, -55);
    ctx.closePath();
    ctx.fill(); outline(ctx, 1.2);
  }
  spSocket(ctx, '#f0c860', '#9a6a20', '#e01e2a', '#ff9a9a', 6, t);
  // lâmina ondulada de obsidiana
  const pts = [[0, -57], [-5.5, -59], [-8, -66], [-5.5, -71], [-7.5, -77], [-4.5, -83], [-4.6, -87], [0, -97], [4.6, -87], [4.5, -83], [7.5, -77], [5.5, -71], [8, -66], [5.5, -59]];
  spBlade(ctx, pts, '#5a4450', '#241a24', 'rgba(255,140,60,0.9)', -59, -93);
  // miolo de lava
  const core = [[0, -61], [-2.6, -66], [-2, -76], [0, -88], [2, -76], [2.6, -66]];
  ctx.save();
  ctx.shadowColor = '#ff6a1a';
  ctx.shadowBlur = 8;
  const lava = ctx.createLinearGradient(0, -61, 0, -88);
  lava.addColorStop(0, '#ff4a1a');
  lava.addColorStop(0.6, '#ffa53a');
  lava.addColorStop(1, '#fff0a8');
  ctx.globalAlpha = 0.75 + Math.sin(t * 6) * 0.2;
  ctx.fillStyle = lava;
  shape(ctx, core);
  ctx.fill();
  ctx.restore();
  // fio em brasa
  ctx.save();
  ctx.shadowColor = '#ff7a1a';
  ctx.shadowBlur = 9 + Math.sin(t * 7) * 3;
  ctx.strokeStyle = 'rgba(255,170,80,0.85)';
  ctx.lineWidth = 1.1;
  shape(ctx, pts);
  ctx.stroke();
  ctx.restore();
  glint(ctx, pts, t, -60, -96);
  // fagulhas subindo
  for (let i = 0; i < 4; i++) {
    const u = (t * 0.9 + i / 4) % 1;
    ctx.fillStyle = `rgba(255,${170 + i * 20},80,${1 - u})`;
    ctx.beginPath(); ctx.arc(Math.sin(t * 3 + i * 2) * 4, -95 - u * 16, 1.4 - u * 0.7, 0, Math.PI * 2); ctx.fill();
  }
}

// Água -------------------------------------------------------------------
// Haste azul-funda com espiral de prata, empunhadura azul, alvado em concha
// com pérola; tridente: ponta do meio larga e as de fora saindo de uma
// travessa em forma de onda, com farpas; gotinhas pingando
function tideSpear(ctx, t) {
  spShaft(ctx, '#5fb4ff', '#2468b0', '#123a70', 4.8);
  ctx.strokeStyle = '#e6f6ff';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  for (let y = -6; y > -46; y -= 1.4) {
    const x = Math.sin(y * 0.42) * 2;
    if (y === -6) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  spGrip(ctx, '#173a6a', '#d8eef8', '#6f9fc4');
  spButt(ctx, '#e6f6ff', '#6f9fc4');
  // concha (alvado)
  ctx.fillStyle = '#f6ece0';
  ctx.beginPath();
  ctx.moveTo(-7.5, -48); ctx.quadraticCurveTo(-8, -58, 0, -59); ctx.quadraticCurveTo(8, -58, 7.5, -48);
  ctx.closePath();
  ctx.fill(); outline(ctx, 1.5);
  ctx.strokeStyle = 'rgba(160,120,100,0.75)';
  ctx.lineWidth = 0.9;
  for (const a of [-1, -0.5, 0, 0.5, 1]) { ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(Math.sin(a) * 7, -48 - Math.cos(a) * 10); ctx.stroke(); }
  // travessa em onda, curvando para fora
  const steel = ctx.createLinearGradient(-12, 0, 12, 0);
  steel.addColorStop(0, '#ffffff'); steel.addColorStop(0.45, '#bfe2f2'); steel.addColorStop(1, '#4f7fa4');
  ctx.fillStyle = steel;
  ctx.beginPath();
  ctx.moveTo(-3, -58);
  ctx.quadraticCurveTo(-11, -58, -12.5, -66);
  ctx.quadraticCurveTo(-14.5, -63, -13, -60);
  ctx.quadraticCurveTo(-11, -55, -3, -55);
  ctx.lineTo(3, -55);
  ctx.quadraticCurveTo(11, -55, 13, -60);
  ctx.quadraticCurveTo(14.5, -63, 12.5, -66);
  ctx.quadraticCurveTo(11, -58, 3, -58);
  ctx.closePath();
  ctx.fill(); outline(ctx, 1.6);
  // pontas de fora com farpa
  for (const side of [-1, 1]) {
    const x = side * 12;
    const pts = [[x - 1.6, -64], [x - 1.6, -74], [x - side * 0 - 1.6, -74], [x, -82], [x + 1.6, -74], [x + 1.6, -64]];
    const barb = [[x - side * 1.6, -72], [x - side * 5, -71], [x - side * 1.6, -76]];
    shape(ctx, pts); ctx.fill(); outline(ctx, 1.4);
    shape(ctx, barb); ctx.fill(); outline(ctx, 1.1);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(x - 0.6, -65); ctx.lineTo(x - 0.6, -79); ctx.stroke();
  }
  // ponta do meio, larga
  const mid = [[0, -58], [-4.5, -64], [-5.5, -74], [-3, -84], [0, -97], [3, -84], [5.5, -74], [4.5, -64]];
  spBlade(ctx, mid, '#eaf8ff', '#6f9fc4', 'rgba(255,255,255,0.95)', -61, -93);
  glint(ctx, mid, t, -60, -96, 3.1);
  // pérola
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(0, -57, 3, 0, Math.PI * 2); ctx.fill(); outline(ctx, 1.1);
  ctx.fillStyle = 'rgba(95,208,255,0.85)';
  ctx.beginPath(); ctx.arc(0.9, -56.3, 1.3, 0, Math.PI * 2); ctx.fill();
  // gotinhas pingando das pontas
  for (const [x, top, k] of [[-12, -82, 0], [0, -97, 0.4], [12, -82, 0.7]]) {
    const d = (t * 1.3 + k) % 1;
    ctx.fillStyle = `rgba(159,227,255,${0.9 * (1 - d)})`;
    ctx.beginPath(); ctx.ellipse(x, top + 6 + d * 26, 1.2, 1.8, 0, 0, Math.PI * 2); ctx.fill();
  }
}

// Terra -------------------------------------------------------------------
// Haste grossa de madeira com nós, amarrada com couro; alvado de bronze com
// pedra verde; ponta enorme de pedra lascada com facetas, cristal de âmbar
// encravado e musgo com folhinhas
function stoneSpear(ctx, t) {
  spShaft(ctx, '#b07a48', '#7a5532', '#4a3018', 6);
  ctx.strokeStyle = 'rgba(50,28,10,0.6)';
  ctx.lineWidth = 0.9;
  for (const [y0, len, x] of [[-8, 7, -1.4], [-22, 8, 1.2], [-34, 6, -1]]) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + 0.3, y0 - len); ctx.stroke(); }
  // nó da madeira
  ctx.fillStyle = '#5e3a1c';
  ctx.beginPath(); ctx.ellipse(1.2, -28, 1.6, 2.4, 0, 0, Math.PI * 2); ctx.fill();
  spGrip(ctx, '#4a3018', '#d8a868', '#7a4c22', 3.8);
  // ponteira de pedra
  ctx.fillStyle = '#7d756a';
  shape(ctx, [[-4, 17], [-5, 22], [0, 29], [5, 22], [4, 17]]); ctx.fill(); outline(ctx, 1.4);
  ctx.fillStyle = '#a89f92';
  shape(ctx, [[0, 29], [5, 22], [4, 17], [1, 18]]); ctx.fill();
  spSocket(ctx, '#d8a868', '#7a4c22', '#4fae5a', '#c8ffc8', 4, t);
  // tiras de couro amarrando
  ctx.strokeStyle = '#3a2412';
  ctx.lineWidth = 1.5;
  for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-4.4, -44 + k * 2.4); ctx.lineTo(4.4, -45.6 + k * 2.4); ctx.stroke(); }
  // ponta de pedra lascada
  const pts = [[-7, -57], [-9.5, -66], [-8, -76], [-4, -86], [0, -97], [4.5, -86], [8.5, -74], [9.5, -64], [7, -57]];
  shape(ctx, pts);
  ctx.fillStyle = '#7d756a';
  ctx.fill();
  ctx.save();
  shape(ctx, pts);
  ctx.clip();
  ctx.fillStyle = '#b0a698';
  shape(ctx, [[0, -97], [4.5, -86], [8.5, -74], [9.5, -64], [2.5, -66], [0.5, -80]]); ctx.fill();
  ctx.fillStyle = '#5a5248';
  shape(ctx, [[-7, -57], [-9.5, -66], [-8, -76], [-2, -70], [-1.5, -58]]); ctx.fill();
  ctx.fillStyle = '#d0c8ba';
  shape(ctx, [[0, -97], [2, -88], [0.5, -80]]); ctx.fill();
  ctx.fillStyle = 'rgba(30,20,10,0.25)';
  shape(ctx, [[2.5, -66], [9.5, -64], [7, -57], [1, -58]]); ctx.fill();
  ctx.restore();
  shape(ctx, pts);
  outline(ctx, 2.2);
  // lascas na borda
  ctx.strokeStyle = 'rgba(30,20,10,0.7)';
  ctx.lineWidth = 0.9;
  for (const [x, y, dx] of [[-9, -63, 2.2], [-7.6, -76, 2], [8.8, -69, -2.2], [6, -81, -1.8]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y - 1.6); ctx.stroke(); }
  // cristal de âmbar encravado
  ctx.save();
  ctx.shadowColor = '#ffb347';
  ctx.shadowBlur = 6 + Math.sin(t * 3) * 2;
  const amber = ctx.createLinearGradient(-2, 0, 2, 0);
  amber.addColorStop(0, '#fff0a8'); amber.addColorStop(1, '#d8861e');
  ctx.fillStyle = amber;
  shape(ctx, [[-0.5, -66], [-3, -71], [-0.5, -78], [2, -71]]);
  ctx.fill();
  ctx.restore();
  shape(ctx, [[-0.5, -66], [-3, -71], [-0.5, -78], [2, -71]]);
  outline(ctx, 1.1);
  glint(ctx, pts, t, -60, -96, 3.4);
  // musgo e folhinhas no alvado
  ctx.fillStyle = '#5f9f3a';
  ctx.beginPath(); ctx.ellipse(-4.5, -57, 3.4, 1.8, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8ad05a';
  for (const [x, y, a] of [[-7, -55, 0.9], [-8.5, -58, -0.4]]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.sin(t * 2) * 0.1);
    ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 1.2, 0, 0, Math.PI * 2); ctx.fill(); outline(ctx, 0.7);
    ctx.restore();
  }
}

// Ar ----------------------------------------------------------------------
// Haste perolada com fita verde-água em espiral, guarda de asas emplumadas,
// lâmina longa e fina com janela vazada e fio brilhando, duas penas
// penduradas balançando e redemoinhos em volta
function windSpear(ctx, t) {
  spShaft(ctx, '#ffffff', '#e6f6f2', '#a8d8ce', 4.2);
  ctx.strokeStyle = '#4fd1b8';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (let y = -4; y > -46; y -= 1.4) {
    const x = Math.sin(y * 0.5) * 1.7;
    if (y === -4) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  spGrip(ctx, '#2f7f74', '#ffffff', '#9cc8bf', 3.2);
  spButt(ctx, '#ffffff', '#9cc8bf');
  // penas penduradas num cordão
  const sway = Math.sin(t * 4) * 0.25;
  ctx.strokeStyle = '#2f7f74';
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(3, -46); ctx.quadraticCurveTo(6, -42, 6 + sway * 4, -38); ctx.stroke();
  for (const [dx, len, a] of [[0, 13, 0.25], [2.5, 10, 0.5]]) {
    ctx.save();
    ctx.translate(6 + dx + sway * 4, -38);
    ctx.rotate(a + sway);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(3, len * 0.4, 0.6, len);
    ctx.quadraticCurveTo(-2.4, len * 0.5, 0, 0);
    ctx.closePath();
    ctx.fill(); outline(ctx, 0.9);
    ctx.strokeStyle = 'rgba(79,209,184,0.9)';
    ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(0, 0.5); ctx.lineTo(0.5, len - 1); ctx.stroke();
    ctx.restore();
  }
  // guarda de asas emplumadas
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === 0 ? '#ffffff' : i === 1 ? '#e6fbf6' : '#c4efe6';
      ctx.beginPath();
      const by = -54 + i * 2.2;
      ctx.moveTo(side * 3, by);
      ctx.quadraticCurveTo(side * (9 - i), by - 6 + i, side * (14 - i * 2.5), by - 4 + i * 1.5);
      ctx.quadraticCurveTo(side * (8 - i), by + 1, side * 3, by + 2.4);
      ctx.closePath();
      ctx.fill(); outline(ctx, 1);
    }
  }
  spSocket(ctx, '#ffffff', '#9cc8bf', '#7fffe0', '#ffffff', 8, t);
  // lâmina longa com janela vazada
  const pts = [[0, -57], [-4, -62], [-3.4, -80], [0, -99], [3.4, -80], [4, -62]];
  ctx.save();
  ctx.shadowColor = '#7fffe0';
  ctx.shadowBlur = 9 + Math.sin(t * 4) * 3;
  shape(ctx, pts);
  ctx.fillStyle = '#e6fbf6';
  ctx.fill();
  ctx.restore();
  spBlade(ctx, pts, '#ffffff', '#a8dcd2', 'rgba(127,255,224,0.9)', -60, -95);
  ctx.fillStyle = 'rgba(30,140,125,0.6)';
  shape(ctx, [[0, -67], [-1.4, -72], [0, -82], [1.4, -72]]); ctx.fill();
  outline(ctx, 0.9);
  glint(ctx, pts, t, -60, -98, 2.2);
  // redemoinhos de vento
  ctx.strokeStyle = 'rgba(200,255,245,0.75)';
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 2; i++) {
    const a = t * 5 + i * Math.PI;
    ctx.beginPath();
    ctx.ellipse(0, -80 + i * 12, 8, 2.6, 0, a, a + 2.2);
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
