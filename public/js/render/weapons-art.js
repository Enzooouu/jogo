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

function handle(ctx, wrap, pommel, len = 11) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6.5;
  ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, len - 3); ctx.stroke();
  ctx.strokeStyle = wrap;
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  for (let y = -2; y < len - 3; y += 3) {
    ctx.beginPath(); ctx.moveTo(-1.7, y); ctx.lineTo(1.7, y + 1.5); ctx.stroke();
  }
  ctx.fillStyle = pommel;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, len - 1, 2.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

function outline(ctx, w = 2.2) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = w;
  ctx.stroke();
}

// Fogo: lâmina de obsidiana com núcleo de magma e chamas no dorso
function flameBlade(ctx, t) {
  handle(ctx, '#3a1c14', '#ff9a3c');
  // chamas saindo do dorso da lâmina
  for (let i = 0; i < 4; i++) {
    const y = -14 - i * 9;
    const fl = Math.sin(t * 14 + i * 1.7) * 2;
    ctx.fillStyle = i % 2 ? '#ffd25a' : '#ff6a1a';
    ctx.beginPath();
    ctx.moveTo(-3.5, y + 4);
    ctx.quadraticCurveTo(-9, y + 1, -11 + fl, y - 6);
    ctx.quadraticCurveTo(-6, y - 2, -3.2, y - 4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(-3.6, -7); ctx.lineTo(-3.2, -40); ctx.lineTo(0.5, -52); ctx.lineTo(4, -40); ctx.lineTo(3.8, -7);
  ctx.closePath();
  const g = ctx.createLinearGradient(-4, 0, 4, 0);
  g.addColorStop(0, '#1a1013'); g.addColorStop(0.55, '#3b1d1a'); g.addColorStop(1, '#5a2a1e');
  ctx.fillStyle = g;
  ctx.fill();
  outline(ctx);
  // núcleo de magma
  ctx.shadowColor = '#ff7a1a';
  ctx.shadowBlur = 10 + Math.sin(t * 8) * 3;
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0.3, -9); ctx.lineTo(-0.6, -20); ctx.lineTo(0.8, -30); ctx.lineTo(-0.2, -40); ctx.lineTo(0.5, -48);
  ctx.stroke();
  ctx.shadowBlur = 0;
  // guarda em chifres
  ctx.fillStyle = '#2b1f22';
  ctx.beginPath();
  ctx.moveTo(-10, -9); ctx.quadraticCurveTo(-6, -4, 0, -5); ctx.quadraticCurveTo(6, -4, 10, -9);
  ctx.quadraticCurveTo(7, -3, 0, -2); ctx.quadraticCurveTo(-7, -3, -10, -9);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 1.8);
  ctx.fillStyle = '#ff7a1a';
  ctx.beginPath(); ctx.arc(0, -4.5, 1.8, 0, Math.PI * 2); ctx.fill();
}

// Água: lâmina curva translúcida com crista de onda e gotas
function tideBlade(ctx, t) {
  handle(ctx, '#1f6f8f', '#e8f7ff');
  ctx.beginPath();
  ctx.moveTo(-3, -7);
  ctx.quadraticCurveTo(-6, -30, 3, -53);
  ctx.quadraticCurveTo(7, -44, 5.5, -38);
  for (let i = 0; i < 4; i++) {
    const y = -38 + i * 7.5;
    ctx.quadraticCurveTo(8.5, y + 2, 5.2, y + 5.5);
  }
  ctx.lineTo(3.5, -7);
  ctx.closePath();
  const g = ctx.createLinearGradient(-5, -50, 6, -8);
  g.addColorStop(0, 'rgba(225,250,255,0.95)'); g.addColorStop(0.45, 'rgba(110,200,255,0.92)'); g.addColorStop(1, 'rgba(30,110,220,0.95)');
  ctx.fillStyle = g;
  ctx.fill();
  outline(ctx);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(-1.5, -10); ctx.quadraticCurveTo(-3.6, -30, 2, -48); ctx.stroke();
  // bolhas dentro da lâmina
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 3; i++) {
    const y = -10 - ((t * 20 + i * 12) % 36);
    ctx.beginPath(); ctx.arc(1 + Math.sin(i + t * 3), y, 0.9, 0, Math.PI * 2); ctx.fill();
  }
  // gota pingando da ponta
  const k = (t * 1.5) % 1;
  ctx.fillStyle = `rgba(160,225,255,${1 - k})`;
  ctx.beginPath(); ctx.arc(7 + k * 3, -46 + k * 10, 1.6, 0, Math.PI * 2); ctx.fill();
  // guarda de concha
  ctx.fillStyle = '#efe0c4';
  ctx.beginPath(); ctx.arc(0, -5, 7, Math.PI, 0); ctx.closePath(); ctx.fill();
  outline(ctx, 1.8);
  ctx.strokeStyle = 'rgba(120,90,60,0.6)';
  ctx.lineWidth = 0.9;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(i * 2.8, -10.5 + Math.abs(i) * 0.9); ctx.stroke();
  }
}

// Terra: espadão de pedra com rachaduras, musgo e cristal de âmbar
function stoneBlade(ctx, t) {
  handle(ctx, '#5a3b20', '#8a7a68', 13);
  ctx.beginPath();
  ctx.moveTo(-6, -7); ctx.lineTo(-7.5, -38); ctx.lineTo(-4, -52); ctx.lineTo(3.5, -54); ctx.lineTo(7.5, -42); ctx.lineTo(6.5, -7);
  ctx.closePath();
  const g = ctx.createLinearGradient(-7, 0, 7, 0);
  g.addColorStop(0, '#5a4128'); g.addColorStop(0.5, '#8a6a48'); g.addColorStop(1, '#a8865c');
  ctx.fillStyle = g;
  ctx.fill();
  outline(ctx, 2.4);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-6, -30); ctx.lineTo(-2, -33); ctx.lineTo(-3, -38); ctx.moveTo(6, -18); ctx.lineTo(2, -20); ctx.lineTo(3, -25);
  ctx.moveTo(-5, -46); ctx.lineTo(0, -44);
  ctx.stroke();
  ctx.fillStyle = '#5f8f3a';
  ctx.beginPath(); ctx.moveTo(-6.4, -9); ctx.quadraticCurveTo(0, -13, 6.6, -9); ctx.lineTo(6.6, -12); ctx.quadraticCurveTo(0, -17, -6.6, -12); ctx.closePath(); ctx.fill();
  // cristal
  ctx.shadowColor = '#ffb347';
  ctx.shadowBlur = 8 + Math.sin(t * 4) * 3;
  ctx.fillStyle = '#ffd27a';
  ctx.beginPath(); ctx.moveTo(0, -31); ctx.lineTo(3, -26); ctx.lineTo(0, -21); ctx.lineTo(-3, -26); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  outline(ctx, 1.2);
  // guarda de rocha
  ctx.fillStyle = '#6e5a48';
  ctx.beginPath(); ctx.moveTo(-12, -8); ctx.lineTo(-9, -3); ctx.lineTo(9, -2.5); ctx.lineTo(12.5, -7); ctx.lineTo(8, -9.5); ctx.lineTo(-8, -10); ctx.closePath(); ctx.fill();
  outline(ctx, 1.8);
}

// Ar: lâmina fina e clara, linhas de vento e fita na ponta do cabo
function windBlade(ctx, t) {
  // fita no pomo
  ctx.fillStyle = '#9ff0e0';
  ctx.beginPath();
  ctx.moveTo(0, 9);
  for (let i = 0; i <= 6; i++) ctx.lineTo(-i * 3, 10 + i * 1.5 + Math.sin(t * 10 - i) * 2);
  for (let i = 6; i >= 0; i--) ctx.lineTo(-i * 3, 12.5 + i * 1.5 + Math.sin(t * 10 - i) * 2);
  ctx.closePath();
  ctx.fill();
  handle(ctx, '#e9fffb', '#7fffe0');
  ctx.beginPath();
  ctx.moveTo(-1.8, -7); ctx.lineTo(-1.3, -50); ctx.lineTo(0, -58); ctx.lineTo(1.3, -50); ctx.lineTo(1.8, -7);
  ctx.closePath();
  const g = ctx.createLinearGradient(-2, 0, 2, 0);
  g.addColorStop(0, '#bfeee6'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#9fdcd2');
  ctx.fillStyle = g;
  ctx.fill();
  outline(ctx, 1.8);
  // linhas de vento correndo ao lado
  ctx.strokeStyle = 'rgba(127,255,224,0.75)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    const y = -12 - ((t * 60 + i * 15) % 42);
    const side = i % 2 ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(side * 4.5, y); ctx.quadraticCurveTo(side * 6.5, y - 5, side * 4, y - 10); ctx.stroke();
  }
  // guarda em anel
  ctx.fillStyle = '#7fffe0';
  ctx.beginPath(); ctx.ellipse(0, -5.5, 6, 2.2, 0, 0, Math.PI * 2); ctx.fill();
  outline(ctx, 1.6);
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

function pole(ctx, color, from, to, w = 4) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = w + 3;
  ctx.beginPath(); ctx.moveTo(0, from); ctx.lineTo(0, to); ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke();
}

function flameStaff(ctx, t) {
  pole(ctx, '#3a2020', 14, -32);
  ctx.fillStyle = '#ff8a3a';
  for (const y of [8, -6, -20]) { ctx.beginPath(); ctx.arc(0.6, y, 0.9, 0, Math.PI * 2); ctx.fill(); }
  // garras segurando a bola de fogo
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(0, -31); ctx.quadraticCurveTo(s * 10, -38, s * 5, -50); ctx.stroke();
  }
  ctx.strokeStyle = '#2b1f22';
  ctx.lineWidth = 2.2;
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(0, -31); ctx.quadraticCurveTo(s * 10, -38, s * 5, -50); ctx.stroke();
  }
  drawFireball(ctx, 0, -41, 6.5 + Math.sin(t * 7) * 0.6, t, 0);
}

function tideStaff(ctx, t) {
  pole(ctx, '#c9b08a', 14, -30);
  ctx.strokeStyle = '#2f8cff';
  ctx.lineWidth = 2;
  for (const y of [4, -12]) { ctx.beginPath(); ctx.moveTo(-2.5, y); ctx.lineTo(2.5, y - 2); ctx.stroke(); }
  // gancho em lua crescente
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(0, -40, 10, Math.PI * 0.55, Math.PI * 1.85); ctx.stroke();
  ctx.strokeStyle = '#efe0c4';
  ctx.lineWidth = 3;
  ctx.stroke();
  // esfera de água
  const r = 6.5;
  const g = ctx.createRadialGradient(-2, -43, 1, 0, -40, r);
  g.addColorStop(0, '#e6fbff'); g.addColorStop(0.5, '#5ab8ff'); g.addColorStop(1, '#1f5fc0');
  ctx.fillStyle = g;
  ctx.shadowColor = '#5ab8ff';
  ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(0, -40, r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  outline(ctx, 1.6);
  const k = (t * 1.2) % 1;
  ctx.strokeStyle = `rgba(200,240,255,${1 - k})`;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, -40, r + k * 6, 0, Math.PI * 2); ctx.stroke();
}

function stoneStaff(ctx, t) {
  // galho retorcido
  ctx.strokeStyle = INK;
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(0, 14); ctx.quadraticCurveTo(-3, -6, 1, -18); ctx.quadraticCurveTo(4, -26, -1, -32); ctx.stroke();
  ctx.strokeStyle = '#6b4a2b';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = '#4a321c';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-1, -30); ctx.quadraticCurveTo(-7, -36, -5, -42); ctx.moveTo(1, -30); ctx.quadraticCurveTo(7, -35, 6, -42); ctx.stroke();
  // pedra flutuando com cristais
  const bob = Math.sin(t * 3) * 1.5;
  ctx.save();
  ctx.translate(0, -45 + bob);
  ctx.rotate(Math.sin(t * 1.5) * 0.15);
  ctx.fillStyle = '#7a5a3a';
  ctx.beginPath(); ctx.moveTo(-7, 2); ctx.lineTo(-6, -4); ctx.lineTo(0, -7); ctx.lineTo(7, -3); ctx.lineTo(6, 4); ctx.lineTo(-1, 6); ctx.closePath(); ctx.fill();
  outline(ctx, 1.8);
  ctx.shadowColor = '#ffb347';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ffd27a';
  ctx.beginPath(); ctx.moveTo(-2, -5); ctx.lineTo(0, -12); ctx.lineTo(2, -5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(2, -4); ctx.lineTo(6, -9); ctx.lineTo(5, -2); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function windStaff(ctx, t) {
  pole(ctx, '#f2fffc', 14, -30, 3.2);
  ctx.strokeStyle = '#3fd6c0';
  ctx.lineWidth = 2;
  for (const y of [6, -10, -24]) { ctx.beginPath(); ctx.moveTo(-2, y); ctx.lineTo(2, y); ctx.stroke(); }
  // penas penduradas
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(s * 3, -30);
    ctx.rotate(s * 0.4 + Math.sin(t * 6 + s) * 0.15);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(0, 7, 2, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#9fdcd2'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, 1); ctx.lineTo(0, 13); ctx.stroke();
    ctx.restore();
  }
  // anel com redemoinho girando
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(0, -40, 9, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#e9fffb';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.save();
  ctx.translate(0, -40);
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
}

// ====================================================================== disparos
// Desenhados no centro (x, y); dir = 1 indo para a direita, -1 esquerda.

export function drawShot(ctx, element, x, y, r, dir, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir || 1, 1);
  if (element === 'agua') waterShot(ctx, r, t);
  else if (element === 'terra') rockShot(ctx, r, t);
  else if (element === 'ar') windShot(ctx, r, t);
  else drawFireball(ctx, 0, 0, r, t, 1);
  ctx.restore();
}

// Bola de fogo; tail = tamanho da cauda (0 = parada no cajado)
export function drawFireball(ctx, x, y, r, t, tail) {
  ctx.save();
  ctx.translate(x, y);
  if (tail) {
    // cauda de chamas para trás
    for (let i = 0; i < 3; i++) {
      const fl = Math.sin(t * 20 + i * 2) * r * 0.25;
      ctx.fillStyle = ['rgba(255,90,20,0.75)', 'rgba(255,160,50,0.8)', 'rgba(255,230,140,0.9)'][i];
      const len = r * (3.4 - i * 0.8);
      const wid = r * (1.05 - i * 0.22);
      ctx.beginPath();
      ctx.moveTo(0, -wid);
      ctx.quadraticCurveTo(-len * 0.5, -wid * 0.9 + fl, -len, fl * 0.6);
      ctx.quadraticCurveTo(-len * 0.5, wid * 0.9 + fl, 0, wid);
      ctx.closePath();
      ctx.fill();
    }
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
  ctx.shadowColor = '#ff6a00';
  ctx.shadowBlur = 16;
  const g = ctx.createRadialGradient(r * 0.2, -r * 0.2, 1, 0, 0, r * 1.1);
  g.addColorStop(0, '#fffbe0'); g.addColorStop(0.35, '#ffd25a'); g.addColorStop(0.8, '#ff7a1a'); g.addColorStop(1, '#c2300a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function waterShot(ctx, r, t) {
  // jato alongado com espuma na frente
  ctx.shadowColor = '#5ab8ff';
  ctx.shadowBlur = 12;
  const g = ctx.createLinearGradient(-r * 3.2, 0, r, 0);
  g.addColorStop(0, 'rgba(90,180,255,0)'); g.addColorStop(0.5, 'rgba(90,180,255,0.75)'); g.addColorStop(1, '#d8f6ff');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(r * 1.1, 0);
  ctx.quadraticCurveTo(r * 0.6, -r, -r * 0.8, -r * 0.7 + Math.sin(t * 25) * 1.5);
  ctx.quadraticCurveTo(-r * 2.4, -r * 0.4, -r * 3.4, 0);
  ctx.quadraticCurveTo(-r * 2.4, r * 0.4, -r * 0.8, r * 0.7 + Math.cos(t * 25) * 1.5);
  ctx.quadraticCurveTo(r * 0.6, r, r * 1.1, 0);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(r * 0.2, 0, r * 0.85, -1.1, 1.1); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    const y = (i - 1) * r * 0.45;
    const x = -r * (1 + ((t * 8 + i * 0.4) % 1) * 2);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - r * 0.8, y); ctx.stroke();
  }
}

function rockShot(ctx, r, t) {
  ctx.fillStyle = 'rgba(140,110,80,0.35)';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.arc(-r * (1.4 + i * 0.7), Math.sin(t * 9 + i) * 2, r * (0.5 - i * 0.12), 0, Math.PI * 2); ctx.fill();
  }
  ctx.save();
  ctx.rotate(t * 10);
  ctx.fillStyle = '#7a5a3a';
  ctx.beginPath();
  ctx.moveTo(-r, r * 0.2); ctx.lineTo(-r * 0.7, -r * 0.8); ctx.lineTo(r * 0.3, -r); ctx.lineTo(r, -r * 0.2); ctx.lineTo(r * 0.7, r * 0.8); ctx.lineTo(-r * 0.3, r);
  ctx.closePath();
  ctx.fill();
  outline(ctx, 2);
  ctx.fillStyle = '#a8865c';
  ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.6); ctx.lineTo(r * 0.2, -r * 0.8); ctx.lineTo(-r * 0.1, -r * 0.2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffd27a';
  ctx.shadowColor = '#ffb347';
  ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.moveTo(r * 0.2, r * 0.1); ctx.lineTo(r * 0.5, -r * 0.3); ctx.lineTo(r * 0.6, r * 0.4); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function windShot(ctx, r, t) {
  // mini tornado: elipses empilhadas girando
  for (let i = 0; i < 6; i++) {
    const u = i / 5;
    const y = -r * 1.4 + u * r * 2.8;
    const w = r * (1.5 - u * 1.1);
    const off = Math.sin(t * 18 + i) * r * 0.25;
    ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,0.9)' : 'rgba(127,255,224,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(off, y, w, r * 0.3, 0, Math.PI * (0.1 + ((t * 3 + i * 0.3) % 1)), Math.PI * (1.7 + ((t * 3 + i * 0.3) % 1)));
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(127,255,224,0.5)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 2; i++) {
    const y = (i - 0.5) * r;
    ctx.beginPath(); ctx.moveTo(-r * 1.6, y); ctx.quadraticCurveTo(-r * 2.6, y - 3, -r * 3.4, y); ctx.stroke();
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
