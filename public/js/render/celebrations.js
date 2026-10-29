// Comemoração de vitória: cada elemento tem a sua, tocada no fim da partida.
//   fogo  -> chuva de meteoros e um meteoro gigante explodindo atrás da ilha
//   agua  -> tsunami atravessando a tela
//   ar    -> tornado gigante
//   terra -> terremoto: rachaduras, pilares subindo e espinhos rasgando o chão
//
// Camadas (todas em coordenadas do mundo):
//   'back'  -> atrás da ilha     'mid' -> entre a ilha e os lutadores
//   'front' -> na frente de tudo (menos o placar)

export const CELEBRATION_TIME = 4;

export function startCelebration(element) {
  return { element, t: 0, seed: 1 };
}

// Efeitos que não são desenho direto: partículas e tremor de tela.
export function updateCelebration(cel, dt, renderer) {
  cel.t += dt;
  const P = renderer.particles;
  const t = cel.t;
  if (cel.element === 'fogo') {
    updateFire(cel, dt, renderer);
  } else if (cel.element === 'terra') {
    updateQuake(cel, dt, renderer);
  } else if (cel.element === 'agua') {
    const fx = tsunamiFront(t);
    const s = WAVE_SCALE;
    // respingos saindo da ponta da onda
    for (let i = 0; i < 3; i++) {
      if (Math.random() > dt * 40) continue;
      P.add({
        x: fx + (100 + Math.random() * 60) * s, y: WAVE_BASE - (430 + Math.random() * 120) * s,
        vx: 250 + Math.random() * 300, vy: -120 + Math.random() * 260,
        life: 0.9, size: 2.5 + Math.random() * 3.5, color: 'rgba(235,252,255,0.95)', gravity: 900,
      });
    }
    if (Math.random() < dt * 8) {
      P.add({ x: fx + 120 * s, y: WAVE_BASE - 480 * s, vx: 180, vy: -30, life: 1.2, size: 16, grow: 40, color: 'rgba(220,245,255,0.25)' });
    }
    // depois que a crista passa, cai uma chuvinha de gotas
    if (fx > 200 && Math.random() < dt * 50) {
      const x = -100 + Math.random() * Math.min(1500, fx + 100);
      P.add({ x, y: -40 + Math.random() * 200, vx: 60, vy: 300 + Math.random() * 200, life: 1.2, size: 1.6, color: 'rgba(200,240,255,0.8)', gravity: 400 });
    }
  } else if (cel.element === 'ar') {
    const cx = tornadoX(t);
    // folhas e poeira sendo sugadas pela tela em direção ao tornado
    if (Math.random() < dt * 40) {
      const fromLeft = Math.random() < 0.5;
      const x = fromLeft ? -60 : 1340;
      const y = 200 + Math.random() * 420;
      const dx = cx - x;
      P.add({
        x, y, vx: dx * (0.9 + Math.random() * 0.6), vy: -40 - Math.random() * 80,
        life: 1.3, size: 2 + Math.random() * 2.5,
        color: Math.random() < 0.5 ? 'rgba(150,200,110,0.9)' : 'rgba(220,255,248,0.8)',
      });
    }
    // poeira subindo na base
    if (Math.random() < dt * 30) {
      P.add({ x: cx + (Math.random() - 0.5) * 160, y: 560, vx: (Math.random() - 0.5) * 120, vy: -200 - Math.random() * 150, life: 0.9, size: 6, grow: 18, color: 'rgba(200,190,180,0.25)' });
    }
    // relâmpago: clarão na tela
    if (lightningAt(t) && !cel.flashed?.[lightningIndex(t)]) {
      cel.flashed = cel.flashed ?? {};
      cel.flashed[lightningIndex(t)] = true;
      renderer.shake(4, 0.15);
    }
  }
}

export function drawCelebration(ctx, cel, layer) {
  if (!cel) return;
  const fade = Math.min(1, cel.t / 0.4, (CELEBRATION_TIME - cel.t) / 0.5);
  if (fade <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, fade);
  if (cel.element === 'fogo' && layer === 'back') fireBack(ctx, cel.t);
  else if (cel.element === 'fogo' && layer === 'mid') fireMid(ctx, cel.t);
  else if (cel.element === 'fogo' && layer === 'front') fireFront(ctx, cel.t);
  else if (cel.element === 'ar' && layer === 'back') tornado(ctx, cel.t);
  else if (cel.element === 'agua' && layer === 'back') tsunami(ctx, cel.t);
  else if (cel.element === 'agua' && layer === 'mid') islandWash(ctx, cel.t);
  else if (cel.element === 'terra' && layer === 'back') quakeBack(ctx, cel.t);
  else if (cel.element === 'terra' && layer === 'mid') quakeMid(ctx, cel.t);
  else if (cel.element === 'terra' && layer === 'front') quakeFront(ctx, cel.t);
  ctx.restore();
}

function rand(i, k = 0) {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ---------------------------------------------------------------- fogo

// Chuva de meteoros: riscos ao longe, meteoros menores que acertam a ilha
// e deixam crateras pegando fogo, e um meteoro gigante que cai atrás da
// ilha e sobe um cogumelo de fogo.
const ISLAND_TOP = 540;
const HERO = { x: 980, y: 565, t0: 0.9, t1: 2.2, dx: 1250, dy: 950, r: 44 };

// [quando bate, x] — fora das poças de lava e água
const METEORS = [
  [0.4, 520], [0.65, 1040], [0.9, 250], [1.1, 760], [1.4, 610], [1.65, 1000],
  [1.9, 300], [2.75, 700], [2.95, 1060], [3.15, 215], [3.3, 560],
].map(([at, x], i) => ({ at, x, r: 9 + rand(i, 4) * 7, vx: 380 + rand(i, 1) * 160, vy: 1000 + rand(i, 2) * 200 }));

// Momentos das batidas (o som usa)
export const FIRE_IMPACTS = { small: METEORS.map((m) => m.at), bigStart: HERO.t0, big: HERO.t1 };

function heroPos(t) {
  const k = Math.min(1, Math.max(0, (t - HERO.t0) / (HERO.t1 - HERO.t0)));
  const u = Math.pow(k, 1.2); // acelera chegando
  return { x: HERO.x - HERO.dx * (1 - u), y: HERO.y - HERO.dy * (1 - u) };
}

function meteorPos(m, t) {
  const left = m.at - t;
  return { x: m.x - m.vx * left, y: ISLAND_TOP - m.vy * left };
}

function updateFire(cel, dt, renderer) {
  const P = renderer.particles;
  const t = cel.t;
  // cinzas caindo e brasas subindo
  if (Math.random() < dt * 25) {
    P.add({ x: -200 + Math.random() * 1700, y: -60 + Math.random() * 120, vx: 30 + Math.random() * 30, vy: 60 + Math.random() * 70, life: 3, size: 1.4 + Math.random() * 1.4, color: 'rgba(110,95,95,0.85)' });
  }
  if (Math.random() < dt * 25) {
    P.add({ x: Math.random() * 1280, y: 720, vx: (Math.random() - 0.5) * 40, vy: -90 - Math.random() * 90, life: 2.5, size: 1.6, color: Math.random() < 0.5 ? '#ff9a3c' : '#ffd25a' });
  }
  // fagulhas soltas pelo meteoro gigante
  if (t > HERO.t0 && t < HERO.t1 && Math.random() < dt * 70) {
    const h = heroPos(t);
    P.add({ x: h.x + (Math.random() - 0.5) * 40, y: h.y + (Math.random() - 0.5) * 40, vx: -200 - Math.random() * 200, vy: -150 - Math.random() * 150, life: 0.6, size: 2, type: 'spark', color: '#ffb347', gravity: 300 });
  }
  // batidas dos meteoros menores
  cel.hit = cel.hit ?? new Set();
  METEORS.forEach((m, i) => {
    if (t < m.at || cel.hit.has(i)) return;
    cel.hit.add(i);
    const y = ISLAND_TOP - 2;
    P.burst(m.x, y, { count: 16, speed: 520, angle: -Math.PI / 2, spread: 2.2, type: 'spark', size: 2.5, color: '#ffc65a', gravity: 1300, life: 0.7 });
    P.burst(m.x, y, { count: 5, speed: 420, angle: -Math.PI / 2, spread: 1.6, size: 3 + m.r * 0.2, color: '#2e1a12', gravity: 1500, life: 0.9 });
    P.burst(m.x, y - 10, { count: 3, speed: 70, angle: -Math.PI / 2, spread: 1.5, size: 5, grow: 22, color: 'rgba(70,50,45,0.3)', life: 1 });
    renderer.shake(3, 0.12);
  });
  // batida do gigante
  if (t >= HERO.t1 && !cel.bigHit) {
    cel.bigHit = true;
    const x = HERO.x;
    const y = ISLAND_TOP - 4;
    renderer.shake(16, 0.7);
    P.burst(x, y, { count: 70, speed: 1150, angle: -Math.PI / 2, spread: 2.7, type: 'spark', size: 3, color: '#ffd27a', gravity: 900, life: 1.3 });
    P.burst(x, y, { count: 26, speed: 950, angle: -Math.PI / 2, spread: 2.2, size: 6, color: '#2a1810', gravity: 1700, life: 1.7 });
    P.burst(x, y - 30, { count: 14, speed: 320, angle: -Math.PI / 2, spread: 2.4, size: 22, grow: 60, color: 'rgba(255,120,40,0.45)', life: 0.8 });
  }
  // depois do gigante, chove brasa do céu
  const e = t - HERO.t1;
  if (e > 0 && e < 1.5 && Math.random() < dt * 60) {
    P.add({ x: HERO.x - 600 + Math.random() * 1200, y: -40 + Math.random() * 120, vx: (Math.random() - 0.5) * 120, vy: 150 + Math.random() * 150, life: 1.6, size: 2, type: 'spark', color: '#ff9a3c', gravity: 500 });
  }
}

// Atrás da ilha: céu, riscos distantes, meteoro gigante e o cogumelo
function fireBack(ctx, t) {
  const k = Math.min(1, t / 0.8);
  ctx.fillStyle = `rgba(45,0,0,${0.35 * k})`;
  ctx.fillRect(-1200, -900, 3700, 2400);
  const glow = ctx.createLinearGradient(0, 150, 0, 800);
  glow.addColorStop(0, 'rgba(255,90,20,0)');
  glow.addColorStop(1, `rgba(255,90,20,${0.4 * k})`);
  ctx.fillStyle = glow;
  ctx.fillRect(-1200, 150, 3700, 1500);

  farStreaks(ctx, t);

  // brilho no canto do céu antes de o gigante aparecer
  if (t > HERO.t0 - 0.5 && t < HERO.t1) {
    const h = heroPos(Math.max(t, HERO.t0));
    const a = Math.min(1, (t - HERO.t0 + 0.5) / 0.5);
    const g = ctx.createRadialGradient(h.x, h.y, 10, h.x, h.y, 520);
    g.addColorStop(0, `rgba(255,190,90,${0.45 * a})`);
    g.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(h.x - 520, h.y - 520, 1040, 1040);
    if (t >= HERO.t0) drawMeteor(ctx, h.x, h.y, Math.atan2(HERO.dy, HERO.dx), HERO.r, t, 99);
  }
  bigBlast(ctx, t);
}

function farStreaks(ctx, t) {
  ctx.lineCap = 'round';
  for (let i = 0; i < 30; i++) {
    const life = t - (i * 0.12 - 0.3);
    if (life < 0 || life > 1.6) continue;
    const x = -500 + rand(i, 20) * 1800 + 480 * life;
    const y = -450 + 1000 * life;
    const len = 0.14 + rand(i, 21) * 0.08;
    const g = ctx.createLinearGradient(x - 480 * len, y - 1000 * len, x, y);
    g.addColorStop(0, 'rgba(255,150,70,0)');
    g.addColorStop(1, 'rgba(255,225,160,0.7)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.5 + rand(i, 22) * 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 480 * len, y - 1000 * len);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

// Meteoro: rastro de fumaça, cauda de fogo feita de bolhas que brilham
// somando luz, e uma pedra com a frente em brasa. Desenhado deitado no
// sentido do movimento (+x).
function drawMeteor(ctx, x, y, ang, r, t, seed) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const N = 14;
  for (let k = N; k >= 1; k--) {
    const u = k / N;
    const wob = Math.sin(t * 6 + k * 0.9 + seed) * r * 0.3 * u;
    ctx.fillStyle = `rgba(70,45,40,${0.3 * (1 - u)})`;
    ctx.beginPath();
    ctx.arc(-k * r * 0.8, wob, r * (0.7 + 0.9 * u), 0, Math.PI * 2);
    ctx.fill();
  }
  // pedra arredondada com a frente em brasa
  const pts = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const rr = r * 0.7 * (0.85 + rand(seed, i + 40) * 0.3);
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % 7];
    if (i === 0) ctx.moveTo((pts[6][0] + ax) / 2, (pts[6][1] + ay) / 2);
    ctx.quadraticCurveTo(ax, ay, (ax + bx) / 2, (ay + by) / 2);
  }
  ctx.closePath();
  ctx.fillStyle = '#3a1a0e';
  ctx.fill();
  const hot = ctx.createRadialGradient(r * 0.6, 0, 0, r * 0.6, 0, r * 1.4);
  hot.addColorStop(0, '#fff6d0');
  hot.addColorStop(0.45, '#ffa040');
  hot.addColorStop(1, 'rgba(255,80,20,0.2)');
  ctx.fillStyle = hot;
  ctx.fill();
  // cauda de fogo: bolhas com borda suave somando luz por cima da pedra
  ctx.globalCompositeOperation = 'lighter';
  for (let k = N; k >= 2; k--) {
    const u = k / N;
    const px = -k * r * 0.45;
    const py = Math.sin(t * 14 + k * 1.3 + seed) * r * 0.2 * u;
    const rr = r * (1.25 - 0.8 * u);
    const g = ctx.createRadialGradient(px, py, 0, px, py, rr);
    g.addColorStop(0, `rgba(255,${Math.round(220 - 160 * u)},${Math.round(130 - 110 * u)},${0.55 * (1 - u)})`);
    g.addColorStop(1, 'rgba(255,60,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(px - rr, py - rr, rr * 2, rr * 2);
  }
  const halo = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 3.5);
  halo.addColorStop(0, 'rgba(255,170,80,0.55)');
  halo.addColorStop(1, 'rgba(255,90,20,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(-r * 3.5, -r * 3.5, r * 7, r * 7);
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

// Preenche a união de vários círculos de uma vez (sem bordas por dentro)
function blob(ctx, puffs, scale, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (const [x, y, r] of puffs) {
    ctx.moveTo(x + r * scale, y);
    ctx.arc(x, y, r * scale, 0, Math.PI * 2);
  }
  ctx.fill();
}

// Explosão do gigante: clarão e cogumelo de fogo que vira fumaça
function bigBlast(ctx, t) {
  const e = t - HERO.t1;
  if (e < 0) return;
  const heat = Math.max(0, 1 - e / 1.5);
  const R = 250 + e * 700;
  const g = ctx.createRadialGradient(HERO.x, 480, 0, HERO.x, 480, R);
  g.addColorStop(0, `rgba(255,220,140,${0.7 * heat})`);
  g.addColorStop(0.4, `rgba(255,100,30,${0.35 * heat})`);
  g.addColorStop(1, 'rgba(255,60,20,0)');
  ctx.fillStyle = g;
  ctx.fillRect(HERO.x - R, 480 - R, R * 2, R * 2);

  const rise = 1 - Math.pow(1 - Math.min(1, e / 1.1), 3);
  const capY = 500 - 290 * rise;
  const capR = 55 + 95 * rise;
  const cx = HERO.x;
  const puffs = [];
  // coluna afinando para cima
  for (let k = 0; k <= 8; k++) {
    const u = k / 8;
    const y = 590 + (capY + capR * 0.3 - 590) * u;
    puffs.push([cx + Math.sin(k * 1.7 + e * 4) * 6, y, (48 - u * 18) * (0.6 + 0.4 * rise)]);
  }
  // saia de poeira na base
  for (let j = -2; j <= 2; j++) puffs.push([cx + j * 26 * (0.5 + rise), 562 - Math.abs(j) * 4, 34 * (0.5 + 0.5 * rise)]);
  // chapéu do cogumelo girando devagar
  for (let j = 0; j < 12; j++) {
    const a = (j / 12) * Math.PI * 2 + e * 0.5;
    puffs.push([cx + Math.cos(a) * capR * 0.75, capY + Math.sin(a) * capR * 0.32, capR * (0.4 + rand(j, 30) * 0.18)]);
  }
  puffs.push([cx, capY - capR * 0.12, capR * 0.62]);
  const cap = puffs.slice(-13);

  blob(ctx, puffs, 1.12, `rgba(48,28,22,${Math.min(0.92, 0.35 + e)})`);
  // luz de cima na fumaça, para dar volume (aparece quando o fogo apaga)
  blob(ctx, cap.map(([x, y, r]) => [x - r * 0.12, y - r * 0.18, r]), 0.8, `rgba(95,62,50,${0.6 * (1 - heat)})`);
  if (heat <= 0) return;
  const a0 = ctx.globalAlpha;
  ctx.globalAlpha = a0 * heat;
  const fire = ctx.createRadialGradient(cx, capY, capR * 0.1, cx, capY + 120, capR * 2.2);
  fire.addColorStop(0, '#ffe08a');
  fire.addColorStop(0.45, '#ff8a24');
  fire.addColorStop(1, '#b8280a');
  blob(ctx, puffs, 0.95 - 0.25 * (1 - heat), fire);
  ctx.globalAlpha = a0 * heat * heat;
  const core = ctx.createRadialGradient(cx, capY, 0, cx, capY, capR * 1.3);
  core.addColorStop(0, '#fffbe6');
  core.addColorStop(1, 'rgba(255,214,120,0.2)');
  blob(ctx, cap, 0.55, core);
  ctx.globalAlpha = a0;
}

// Na frente da ilha: meteoros menores batendo, crateras em chamas e a
// onda de choque do gigante passando pelo chão
function fireMid(ctx, t) {
  for (let i = 0; i < METEORS.length; i++) {
    const m = METEORS[i];
    const left = m.at - t;
    if (left > 0) {
      if (left < 1.2) {
        const p = meteorPos(m, t);
        drawMeteor(ctx, p.x, p.y, Math.atan2(m.vy, m.vx), m.r, t, i);
      }
      continue;
    }
    const e = -left;
    // marca queimada e fogo na cratera
    ctx.fillStyle = 'rgba(20,8,5,0.6)';
    ctx.beginPath();
    ctx.ellipse(m.x, ISLAND_TOP + 1, m.r * 2.6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    const grow = Math.min(1, e / 0.25);
    for (let f = 0; f < 3; f++) {
      const fx = m.x + (f - 1) * m.r * 0.9;
      const h = m.r * (f === 1 ? 3.2 : 2.2) * grow * (0.8 + 0.2 * Math.sin(t * 17 + f * 2 + i));
      flame(ctx, fx, ISLAND_TOP, h, m.r * 0.7, t + f + i);
    }
    // estouro da batida
    if (e < 0.45) {
      const k = e / 0.45;
      const R = m.r * 6 * (0.4 + k);
      const g = ctx.createRadialGradient(m.x, ISLAND_TOP, 0, m.x, ISLAND_TOP, R);
      g.addColorStop(0, `rgba(255,245,200,${1 - k})`);
      g.addColorStop(0.4, `rgba(255,130,40,${0.8 * (1 - k)})`);
      g.addColorStop(1, 'rgba(255,60,20,0)');
      ctx.fillStyle = g;
      ctx.fillRect(m.x - R, ISLAND_TOP - R, R * 2, R * 2);
    }
  }

  const e = t - HERO.t1;
  if (e < 0) return;
  // chão iluminado pela explosão
  const heat = Math.max(0, 1 - e / 1.4);
  if (heat > 0) {
    ctx.save();
    ctx.translate(HERO.x, ISLAND_TOP);
    ctx.scale(1, 0.12);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 700);
    g.addColorStop(0, `rgba(255,200,110,${0.8 * heat})`);
    g.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-700, -700, 1400, 1400);
    ctx.restore();
  }
  // onda de choque
  if (e < 0.8) {
    const k = e / 0.8;
    const rx = 40 + e * 1500;
    ctx.strokeStyle = `rgba(255,225,160,${0.9 * (1 - k)})`;
    ctx.lineWidth = 12 * (1 - k) + 2;
    ctx.beginPath();
    ctx.ellipse(HERO.x, ISLAND_TOP - 6, rx, rx * 0.16, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  }
}

function flame(ctx, x, y, h, w, t) {
  if (h <= 1) return;
  const sway = Math.sin(t * 9) * w * 0.4;
  ctx.fillStyle = 'rgba(255,90,20,0.9)';
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.quadraticCurveTo(x - w * 0.8, y - h * 0.6, x + sway, y - h);
  ctx.quadraticCurveTo(x + w * 0.8, y - h * 0.6, x + w, y);
  ctx.fill();
  ctx.fillStyle = '#ffd25a';
  ctx.beginPath();
  ctx.moveTo(x - w * 0.5, y);
  ctx.quadraticCurveTo(x - w * 0.4, y - h * 0.4, x + sway * 0.6, y - h * 0.6);
  ctx.quadraticCurveTo(x + w * 0.4, y - h * 0.4, x + w * 0.5, y);
  ctx.fill();
}

// Na frente de tudo: tela avermelhada e o clarão do gigante
function fireFront(ctx, t) {
  const k = Math.min(1, t / 0.8);
  const v = ctx.createRadialGradient(640, 380, 300, 640, 380, 1000);
  v.addColorStop(0, 'rgba(120,20,0,0)');
  v.addColorStop(1, `rgba(120,20,0,${0.35 * k})`);
  ctx.fillStyle = v;
  ctx.fillRect(-1200, -900, 3700, 2400);
  const e = t - HERO.t1;
  if (e >= 0 && e < 0.35) {
    ctx.fillStyle = `rgba(255,240,200,${0.85 * (1 - e / 0.35)})`;
    ctx.fillRect(-1200, -900, 3700, 2400);
  }
}

// ---------------------------------------------------------------- água

// Onda gigante passando atrás da ilha, da esquerda para a direita, com a
// crista curvando para a frente (como um tubo de surf).
const WAVE_BASE = 860;
const WAVE_SCALE = 1;

function tsunamiFront(t) {
  // começa devagar e acelera um pouco
  const u = Math.max(0, t - 0.15);
  return -700 + u * 520 + u * u * 30;
}

function wavePath(ctx, fx, base, s, wob) {
  ctx.beginPath();
  ctx.moveTo(fx - 1700 * s, base);
  ctx.bezierCurveTo(fx - 1100 * s, base, fx - 650 * s, base - 300 * s, fx - 330 * s, base - 480 * s);
  ctx.bezierCurveTo(fx - 210 * s, base - 590 * s, fx - 20 * s, base - 650 * s, fx + 100 * s, base - 600 * s);
  ctx.bezierCurveTo(fx + 190 * s, base - 560 * s, fx + 210 * s, base - 455 * s, fx + 150 * s + wob, base - 395 * s);
  ctx.bezierCurveTo(fx + 110 * s, base - 360 * s, fx + 60 * s, base - 410 * s, fx + 25 * s, base - 440 * s);
  ctx.bezierCurveTo(fx - 60 * s, base - 420 * s, fx - 95 * s, base - 280 * s, fx - 35 * s, base - 180 * s);
  ctx.bezierCurveTo(fx + 20 * s, base - 90 * s, fx + 140 * s, base - 20 * s, fx + 290 * s, base);
  ctx.closePath();
}

// Ponto numa curva de Bézier cúbica (para espalhar a espuma pela crista)
function bez(p0, p1, p2, p3, u) {
  const v = 1 - u;
  return v * v * v * p0 + 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u * p3;
}

function drawWave(ctx, fx, base, s, t, dark) {
  const wob = Math.sin(t * 7) * 6 * s;
  const top = base - 650 * s;

  // corpo da onda
  wavePath(ctx, fx, base, s, wob);
  const g = ctx.createLinearGradient(0, top, 0, base);
  if (dark) {
    g.addColorStop(0, 'rgba(70,150,210,0.9)');
    g.addColorStop(1, 'rgba(8,30,80,0.95)');
  } else {
    g.addColorStop(0, '#c8f4ff');
    g.addColorStop(0.18, '#5cc0f5');
    g.addColorStop(0.55, '#1f78d6');
    g.addColorStop(1, '#0a2d72');
  }
  ctx.fillStyle = g;
  ctx.fill();

  ctx.save();
  wavePath(ctx, fx, base, s, wob);
  ctx.clip();
  // brilho na face (luz atravessando a água perto da crista)
  const glow = ctx.createRadialGradient(fx - 120 * s, base - 480 * s, 10, fx - 120 * s, base - 480 * s, 300 * s);
  glow.addColorStop(0, 'rgba(180,255,240,0.45)');
  glow.addColorStop(1, 'rgba(180,255,240,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(fx - 500 * s, base - 700 * s, 800 * s, 600 * s);
  // listras de água subindo pela face
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 3 * s;
  ctx.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const k = (t * 0.9 + i / 14) % 1;
    const x = fx - (900 - i * 55) * s;
    const y = base - k * 520 * s;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 40 * s, y - 30 * s, x + 90 * s, y - 40 * s);
    ctx.stroke();
  }
  // sombra dentro do tubo
  ctx.strokeStyle = 'rgba(5,25,70,0.55)';
  ctx.lineWidth = 60 * s;
  ctx.beginPath();
  ctx.moveTo(fx + 25 * s, base - 440 * s);
  ctx.bezierCurveTo(fx - 60 * s, base - 420 * s, fx - 95 * s, base - 280 * s, fx - 35 * s, base - 180 * s);
  ctx.stroke();
  ctx.restore();

  if (dark) return;

  // espuma grossa na crista e na ponta
  ctx.strokeStyle = 'rgba(245,253,255,0.95)';
  ctx.lineCap = 'round';
  ctx.lineWidth = 16 * s;
  ctx.beginPath();
  ctx.moveTo(fx - 330 * s, base - 480 * s);
  ctx.bezierCurveTo(fx - 210 * s, base - 590 * s, fx - 20 * s, base - 650 * s, fx + 100 * s, base - 600 * s);
  ctx.bezierCurveTo(fx + 190 * s, base - 560 * s, fx + 210 * s, base - 455 * s, fx + 150 * s + wob, base - 395 * s);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 26; i++) {
    const u = i / 25;
    const seg = u < 0.6 ? 0 : 1;
    const v = seg === 0 ? u / 0.6 : (u - 0.6) / 0.4;
    const x = seg === 0
      ? bez(fx - 330 * s, fx - 210 * s, fx - 20 * s, fx + 100 * s, v)
      : bez(fx + 100 * s, fx + 190 * s, fx + 210 * s, fx + 150 * s + wob, v);
    const y = seg === 0
      ? bez(base - 480 * s, base - 590 * s, base - 650 * s, base - 600 * s, v)
      : bez(base - 600 * s, base - 560 * s, base - 455 * s, base - 395 * s, v);
    const r = (6 + Math.abs(Math.sin(t * 9 + i * 1.7)) * 9) * s;
    ctx.beginPath();
    ctx.arc(x + Math.sin(t * 6 + i) * 4, y + Math.cos(t * 5 + i) * 4, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // espuma na base da onda
  ctx.fillStyle = 'rgba(235,250,255,0.8)';
  for (let i = 0; i < 10; i++) {
    const x = fx + (160 + i * 14) * s;
    ctx.beginPath();
    ctx.arc(x, base - (10 + Math.abs(Math.sin(t * 8 + i)) * 20) * s, (8 + (i % 3) * 4) * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tsunami(ctx, t) {
  const fx = tsunamiFront(t);
  // céu escurecendo/azulando enquanto a onda passa
  const k = Math.min(1, t / 0.8);
  ctx.fillStyle = `rgba(10,50,110,${0.28 * k})`;
  ctx.fillRect(-1200, -900, 3700, 2400);
  // onda de trás (mais longe, menor e escura) e a onda principal
  drawWave(ctx, fx - 520, WAVE_BASE + 40, 0.7, t + 1.3, true);
  drawWave(ctx, fx, WAVE_BASE, WAVE_SCALE, t, false);
}

// Lâmina de água com espuma escorrendo por cima da ilha depois da crista
function islandWash(ctx, t) {
  const fx = tsunamiFront(t);
  const right = Math.min(1100, fx + 40);
  if (right <= 180) return;
  const fade = Math.max(0, Math.min(1, (3.7 - t) / 0.8));
  ctx.save();
  ctx.globalAlpha *= 0.6 * fade;
  ctx.fillStyle = '#4fb2f0';
  ctx.beginPath();
  ctx.moveTo(180, 548);
  for (let x = 180; x <= right; x += 12) ctx.lineTo(x, 532 + Math.sin(x * 0.05 + t * 8) * 4);
  ctx.lineTo(right, 548);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#eafcff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 180; x <= right; x += 12) {
    const y = 532 + Math.sin(x * 0.05 + t * 8) * 4;
    if (x === 180) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- ar

// Tornado: nuvem de tempestade girando, funil que desce dela, faixas em
// espiral, destroços orbitando (na frente e atrás do funil) e relâmpagos.
const CLOUD_Y = 10;
const GROUND_Y = 600;
const LIGHTNINGS = [0.9, 1.9, 2.7];

function lightningIndex(t) {
  return LIGHTNINGS.findIndex((l) => t >= l && t < l + 0.18);
}

function lightningAt(t) {
  return lightningIndex(t) !== -1;
}

function tornadoX(t) {
  return 820 - t * 85 + Math.sin(t * 1.3) * 60;
}

// Quanto o funil já desceu (0 = só a nuvem, 1 = encostou no chão)
function tornadoReach(t) {
  const down = Math.min(1, Math.max(0, (t - 0.3) / 0.9));
  const up = Math.min(1, Math.max(0, (t - 3.3) / 0.6));
  return down * (1 - up);
}

// Centro e raio do funil numa altura u (0 = chão, 1 = nuvem)
function funnelAt(t, u) {
  const cx = tornadoX(t);
  const y = GROUND_Y + (CLOUD_Y - GROUND_Y) * u;
  const bend = Math.sin(u * 3.2 + t * 2.2) * 45 * (1 - u) + Math.sin(t * 1.1) * 30 * u;
  const r = 22 + Math.pow(u, 1.6) * 260;
  return { x: cx + bend, y, r };
}

function stormCloud(ctx, t) {
  const cx = tornadoX(t);
  // escurece o céu
  ctx.fillStyle = 'rgba(20,30,45,0.35)';
  ctx.fillRect(-1200, -900, 3700, 2400);
  // camadas da nuvem girando
  for (let i = 0; i < 4; i++) {
    const a = t * (0.6 + i * 0.25);
    ctx.save();
    ctx.translate(cx + Math.sin(a) * 20, CLOUD_Y - 10 - i * 18);
    const g = ctx.createRadialGradient(0, 0, 20, 0, 0, 520 - i * 80);
    g.addColorStop(0, `rgba(${60 + i * 15},${70 + i * 15},${90 + i * 15},0.9)`);
    g.addColorStop(0.6, `rgba(${40 + i * 10},${48 + i * 10},${64 + i * 10},0.6)`);
    g.addColorStop(1, 'rgba(30,36,50,0)');
    ctx.fillStyle = g;
    ctx.scale(1, 0.28);
    ctx.beginPath();
    ctx.arc(0, 0, 520 - i * 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // espiral na barriga da nuvem
  ctx.strokeStyle = 'rgba(200,230,230,0.25)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const a0 = t * 2 + i * 1.25;
    ctx.beginPath();
    ctx.ellipse(cx, CLOUD_Y, 120 + i * 70, 22 + i * 12, 0, a0, a0 + 1.6);
    ctx.stroke();
  }
}

function lightning(ctx, t) {
  const idx = lightningIndex(t);
  if (idx === -1) return;
  const k = 1 - (t - LIGHTNINGS[idx]) / 0.18;
  // clarão no céu
  ctx.fillStyle = `rgba(220,240,255,${0.25 * k})`;
  ctx.fillRect(-1200, -900, 3700, 2400);
  // raio em zigue-zague da nuvem até o chão ao fundo
  let x = tornadoX(t) + (rand(idx, 20) - 0.5) * 700;
  let y = CLOUD_Y + 20;
  ctx.strokeStyle = `rgba(240,250,255,${k})`;
  ctx.shadowColor = '#bfe9ff';
  ctx.shadowBlur = 18;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i < 9; i++) {
    x += (rand(idx, 30 + i) - 0.5) * 90;
    y += 70;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function debris(ctx, t, reach, front) {
  for (let i = 0; i < 22; i++) {
    const u = 0.05 + rand(i, 5) * 0.8;
    if (u > reach + 0.05 && reach < 1) continue;
    const f = funnelAt(t, u);
    const a = t * (2.5 + rand(i, 6) * 2.5) + i * 2.1;
    const depth = Math.sin(a);              // > 0: na frente do funil
    if ((depth > 0) !== front) continue;
    const orbit = f.r * (1.15 + rand(i, 11) * 0.5);
    const x = f.x + Math.cos(a) * orbit;
    const y = f.y + depth * f.r * 0.22 - Math.sin(t * 3 + i) * 6;
    const size = (5 + rand(i, 7) * 10) * (0.75 + depth * 0.35);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a * 3);
    ctx.globalAlpha *= front ? 1 : 0.55;
    if (i % 3 === 0) {
      // tábua
      ctx.fillStyle = '#7a5532';
      ctx.fillRect(-size * 1.4, -size * 0.25, size * 2.8, size * 0.5);
    } else {
      // pedra
      ctx.fillStyle = i % 2 ? '#6b5560' : '#4a3a50';
      ctx.beginPath();
      ctx.moveTo(-size * 0.6, -size * 0.3);
      ctx.lineTo(size * 0.2, -size * 0.6);
      ctx.lineTo(size * 0.6, size * 0.1);
      ctx.lineTo(-size * 0.1, size * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

function tornado(ctx, t) {
  const reach = tornadoReach(t);
  stormCloud(ctx, t);
  lightning(ctx, t);

  // linhas de vento sendo sugadas para o funil
  const cx = tornadoX(t);
  ctx.strokeStyle = 'rgba(220,255,248,0.35)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? 1 : -1;
    const k = (t * 0.9 + i / 14) % 1;
    const y = 120 + (i * 37) % 420;
    const x = cx + side * (900 - k * 760);
    ctx.globalAlpha = Math.sin(k * Math.PI) * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - side * 60, y - 12, x - side * 130, y - 4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  if (reach <= 0.01) return;
  debris(ctx, t, reach, false);

  // corpo do funil (de cima para baixo até onde já desceu)
  const steps = 30;
  const left = [];
  const right = [];
  for (let i = 0; i <= steps; i++) {
    const u = 1 - (i / steps) * reach;
    const f = funnelAt(t, u);
    const jitter = Math.sin(u * 20 - t * 12) * 4;
    left.push([f.x - f.r - jitter, f.y]);
    right.push([f.x + f.r + jitter, f.y]);
  }
  ctx.beginPath();
  left.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  const g = ctx.createLinearGradient(cx - 260, 0, cx + 260, 0);
  g.addColorStop(0, 'rgba(120,150,150,0.25)');
  g.addColorStop(0.35, 'rgba(210,240,235,0.55)');
  g.addColorStop(0.6, 'rgba(240,255,250,0.65)');
  g.addColorStop(1, 'rgba(110,140,140,0.3)');
  ctx.fillStyle = g;
  ctx.fill();

  // faixas em espiral: metade de trás escura, metade da frente clara
  for (let i = 0; i < 34; i++) {
    const u = 1 - (i / 33) * reach;
    const f = funnelAt(t, u);
    const spin = t * (7 - u * 3) + i * 0.55;
    ctx.lineWidth = 2 + u * 5;
    ctx.strokeStyle = 'rgba(70,100,105,0.35)';
    ctx.beginPath();
    ctx.ellipse(f.x, f.y, f.r, 6 + f.r * 0.12, 0, Math.PI + spin % 1, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = i % 3 ? 'rgba(245,255,252,0.75)' : 'rgba(127,255,224,0.7)';
    ctx.beginPath();
    const a0 = (spin % (Math.PI * 2));
    ctx.ellipse(f.x, f.y, f.r, 6 + f.r * 0.12, 0, Math.max(0.05, a0 % Math.PI), Math.PI - 0.1);
    ctx.stroke();
  }

  // poeira girando na base
  if (reach > 0.9) {
    const base = funnelAt(t, 0);
    for (let i = 0; i < 3; i++) {
      const g2 = ctx.createRadialGradient(base.x, GROUND_Y, 10, base.x, GROUND_Y, 130 + i * 40);
      g2.addColorStop(0, 'rgba(190,180,170,0.4)');
      g2.addColorStop(1, 'rgba(190,180,170,0)');
      ctx.fillStyle = g2;
      ctx.save();
      ctx.translate(base.x, GROUND_Y - 20);
      ctx.scale(1, 0.4);
      ctx.beginPath();
      ctx.arc(0, 0, 130 + i * 40 + Math.sin(t * 6 + i) * 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  debris(ctx, t, reach, true);
}

// ---------------------------------------------------------------- terra

// Terremoto: o chão treme e racha, pilares de basalto sobem do abismo atrás
// da ilha, e no golpe final uma fileira de espinhos de pedra rasga o chão
// enquanto pedregulhos caem do céu e se quebram.
const GROUND = 540;
const RISE_TIME = 0.55;
const SLAM = 2.3;

// [x, largura, altura do topo, quando começa a subir]
const PILLARS = [
  [-30, 110, 170, 0.8], [1310, 120, 150, 1.0], [470, 80, 330, 1.25],
  [880, 90, 260, 1.45], [120, 70, 300, 1.65], [1160, 80, 320, 1.85],
].map(([x, w, top, at]) => ({ x, w, top, at }));

// [x, altura] — espinhos que rasgam o chão no golpe final (fora das poças)
const SPIKES = [[225, 70], [290, 55], [505, 85], [560, 60], [745, 65], [790, 90], [1000, 75], [1060, 55]]
  .map(([x, h]) => ({ x, h, at: SLAM + Math.abs(x - 640) * 0.0004 }));

// Pedregulhos caindo do céu
const BOULDERS = Array.from({ length: 16 }, (_, i) => {
  const at = 0.4 + i * 0.17;
  const x = 200 + rand(i, 8) * 880;
  const s = 10 + rand(i, 9) * 14;
  // tempo até encostar no chão da ilha (queda com gravidade 1600)
  const fall = Math.sqrt((2 * (GROUND - s * 0.6 + 80)) / 1600);
  return { at, x, s, land: at + fall, spin: 4 + rand(i, 10) * 4 };
});

// Rachaduras na parede da ilha: descem do chão em zigue-zague, com galhos
const QUAKE_CRACKS = [210, 300, 400, 520, 640, 760, 880, 1000, 1070].map((x0, i) => {
  const pts = [[x0, GROUND + 1]];
  let x = x0;
  let y = GROUND + 1;
  const bottom = 610 + rand(i, 50) * 85;
  while (y < bottom) {
    y += 9 + rand(i, y) * 12;
    x += (rand(i, y + 1) - 0.5) * 26;
    pts.push([x, Math.min(y, bottom)]);
  }
  const b = Math.floor(pts.length / 2);
  const branch = [pts[b]];
  for (let k = 1; k <= 3; k++) {
    const [px, py] = branch[k - 1];
    branch.push([px + (rand(i, k + 70) < 0.5 ? -1 : 1) * (10 + rand(i, k + 80) * 14), py + 12 + rand(i, k + 90) * 10]);
  }
  return { pts, branch, at: 0.35 + rand(i, 60) * 0.9 };
});

// Momentos das pancadas (o som usa)
export const QUAKE_HITS = { pillars: PILLARS.map((p) => p.at), slam: SLAM };

function easeOutBack(k) {
  const c = k - 1;
  return 1 + 2.7 * c * c * c + 1.7 * c * c;
}

function updateQuake(cel, dt, renderer) {
  const P = renderer.particles;
  const t = cel.t;
  const k = Math.max(0, 1 - t / CELEBRATION_TIME);
  renderer.shake(2 + 3 * k, 0.1);
  // pedrinhas pulando no chão e poeira caindo do alto
  if (Math.random() < dt * 30 * k) {
    P.add({ x: 190 + Math.random() * 900, y: GROUND - 2, vx: (Math.random() - 0.5) * 80, vy: -150 - Math.random() * 180, life: 0.5, size: 1.5 + Math.random() * 2, color: '#6e5236', gravity: 1500 });
  }
  if (Math.random() < dt * 18) {
    P.add({ x: -100 + Math.random() * 1480, y: -30, vx: (Math.random() - 0.5) * 20, vy: 80 + Math.random() * 80, life: 2.5, size: 1.4, color: 'rgba(200,170,120,0.8)', gravity: 200 });
  }
  if (Math.random() < dt * 20 * k) {
    P.add({ x: 180 + Math.random() * 920, y: GROUND, vx: (Math.random() - 0.5) * 40, vy: -40 - Math.random() * 60, life: 1, size: 5, grow: 16, color: 'rgba(150,120,90,0.2)' });
  }
  cel.done = cel.done ?? new Set();
  const once = (key) => !cel.done.has(key) && cel.done.add(key);
  // cada pilar que sobe dá um tranco e solta pedras do topo
  PILLARS.forEach((p, i) => {
    if (t < p.at || !once(`p${i}`)) return;
    renderer.shake(7, 0.3);
    P.burst(p.x, Math.min(GROUND, p.top + 80), { count: 10, speed: 380, angle: -Math.PI / 2, spread: 2.4, size: 3, color: '#5a4029', gravity: 1500, life: 1.1 });
    if (p.x > 180 && p.x < 1100) {
      P.burst(p.x, GROUND - 6, { count: 5, speed: 160, angle: -Math.PI / 2, spread: 2.6, size: 8, grow: 28, color: 'rgba(160,130,95,0.25)', life: 1 });
    }
  });
  // golpe final: espinhos rasgando o chão
  SPIKES.forEach((s, i) => {
    if (t < s.at || !once(`s${i}`)) return;
    P.burst(s.x, GROUND - 4, { count: 10, speed: 420, angle: -Math.PI / 2, spread: 1.8, size: 2.5, color: '#6e5236', gravity: 1500, life: 0.8 });
    P.burst(s.x, GROUND - 8, { count: 3, speed: 120, angle: -Math.PI / 2, spread: 2.6, size: 6, grow: 24, color: 'rgba(170,140,100,0.25)', life: 0.9 });
  });
  if (t >= SLAM && once('slam')) {
    renderer.shake(15, 0.6);
    // poeira rolando pelo chão para os dois lados
    for (let i = 0; i < 24; i++) {
      const dir = i % 2 ? 1 : -1;
      P.add({ x: 640 + dir * Math.random() * 60, y: GROUND - 6 - Math.random() * 14, vx: dir * (300 + Math.random() * 500), vy: -20 - Math.random() * 40, life: 1, size: 7, grow: 22, drag: 1.5, color: 'rgba(180,150,110,0.25)' });
    }
  }
  // pedregulhos que batem no chão se quebram
  BOULDERS.forEach((b, i) => {
    if (t < b.land || !once(`b${i}`)) return;
    P.burst(b.x, GROUND - 4, { count: 7, speed: 300, angle: -Math.PI / 2, spread: 2.2, size: 2 + b.s * 0.15, color: '#7a5a3a', gravity: 1600, life: 0.7 });
    P.burst(b.x, GROUND - 6, { count: 2, speed: 60, angle: -Math.PI / 2, spread: 2, size: 8, grow: 24, color: 'rgba(160,130,95,0.3)', life: 0.8 });
  });
}

// Atrás da ilha: céu empoeirado e pilares subindo do abismo
function quakeBack(ctx, t) {
  const k = Math.min(1, t / 0.8);
  ctx.fillStyle = `rgba(60,38,16,${0.3 * k})`;
  ctx.fillRect(-1200, -900, 3700, 2400);
  for (const p of PILLARS) drawPillar(ctx, p, t);
}

function drawPillar(ctx, p, t) {
  const e = t - p.at;
  if (e < 0) return;
  const k = Math.min(1, e / RISE_TIME);
  const top = 820 + (p.top - 820) * easeOutBack(k);
  const w = p.w;
  const l = p.x - w / 2 + (k < 1 ? Math.sin(t * 70) * 2.5 : 0);
  const bottom = 1200;
  const capUp = top - w * 0.14;
  const capDown = top + w * 0.12;
  ctx.lineJoin = 'round';
  // três faces da coluna (luz vindo da esquerda)
  const faces = [
    ['#7e5f40', [[l, top], [l + w * 0.28, capDown], [l + w * 0.28, bottom], [l, bottom]]],
    ['#614731', [[l + w * 0.28, capDown], [l + w * 0.72, capDown], [l + w * 0.72, bottom], [l + w * 0.28, bottom]]],
    ['#3f2e1e', [[l + w * 0.72, capDown], [l + w, top], [l + w, bottom], [l + w * 0.72, bottom]]],
  ];
  for (const [color, pts] of faces) {
    ctx.fillStyle = color;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
  }
  // emendas do basalto
  ctx.strokeStyle = 'rgba(30,19,11,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let y = capDown + w * 1.1; y < bottom; y += w * 1.3) {
    const tilt = Math.sin(y * 0.05 + p.x) * w * 0.05;
    ctx.moveTo(l, y - w * 0.06 + tilt);
    ctx.lineTo(l + w * 0.28, y + tilt);
    ctx.lineTo(l + w * 0.72, y + tilt);
    ctx.lineTo(l + w, y - w * 0.06 + tilt);
  }
  ctx.stroke();
  // tampa de cima
  ctx.fillStyle = '#9c7b55';
  ctx.beginPath();
  ctx.moveTo(l, top);
  ctx.lineTo(l + w * 0.25, capUp);
  ctx.lineTo(l + w * 0.75, capUp);
  ctx.lineTo(l + w, top);
  ctx.lineTo(l + w * 0.72, capDown);
  ctx.lineTo(l + w * 0.28, capDown);
  ctx.closePath();
  ctx.fill();
  // musgo no topo escorrendo pela face clara
  ctx.fillStyle = '#5f9a3e';
  ctx.beginPath();
  ctx.moveTo(l + w * 0.05, top);
  ctx.lineTo(l + w * 0.3, capUp + 2);
  ctx.lineTo(l + w * 0.55, capUp + 3);
  ctx.quadraticCurveTo(l + w * 0.5, capDown + w * 0.3, l + w * 0.35, capDown + 4);
  ctx.quadraticCurveTo(l + w * 0.18, capDown + w * 0.45, l + w * 0.05, top + w * 0.2);
  ctx.closePath();
  ctx.fill();
  // veio de brasa descendo pela face do meio, como no lutador de Terra
  ctx.strokeStyle = 'rgba(255,179,71,0.8)';
  ctx.shadowColor = '#ff8a1a';
  ctx.shadowBlur = 8;
  ctx.lineWidth = 2;
  ctx.beginPath();
  let vx = l + w * 0.5;
  ctx.moveTo(vx, capDown + 6);
  for (let y = capDown + 6; y < capDown + w * 2.4; y += 12) {
    vx += Math.sin(y * 0.3 + p.x) * 5;
    ctx.lineTo(vx, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  // contorno
  ctx.strokeStyle = '#1e130b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(l, bottom);
  ctx.lineTo(l, top);
  ctx.lineTo(l + w * 0.25, capUp);
  ctx.lineTo(l + w * 0.75, capUp);
  ctx.lineTo(l + w, top);
  ctx.lineTo(l + w, bottom);
  ctx.moveTo(l, top);
  ctx.lineTo(l + w * 0.28, capDown);
  ctx.lineTo(l + w * 0.72, capDown);
  ctx.lineTo(l + w, top);
  ctx.stroke();
}

// Na frente da ilha: rachaduras brilhando, espinhos e a onda do golpe
function quakeMid(ctx, t) {
  const pulse = 0.75 + 0.25 * Math.sin(t * 9);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const c of QUAKE_CRACKS) {
    const grow = Math.min(1, Math.max(0, (t - c.at) / 0.6));
    if (grow <= 0) continue;
    const n = Math.max(2, Math.ceil(c.pts.length * grow));
    const lines = [c.pts.slice(0, n)];
    if (n > c.pts.length / 2 + 1) lines.push(c.branch);
    for (const [width, color, blur] of [[8, 'rgba(25,12,4,0.9)', 0], [2.2, `rgba(255,170,60,${pulse})`, 12]]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.shadowColor = '#ff8a1a';
      ctx.shadowBlur = blur;
      ctx.beginPath();
      for (const pts of lines) pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;

  // espinhos saindo do chão (cortados na linha do chão)
  ctx.save();
  ctx.beginPath();
  ctx.rect(-2000, -2000, 5000, 2000 + GROUND + 4);
  ctx.clip();
  for (const s of SPIKES) {
    const e = t - s.at;
    if (e < 0) continue;
    const k = Math.min(1, e / 0.22);
    drawSpike(ctx, s.x, GROUND + 4, s.h * easeOutBack(k), Math.sign(s.x - 640));
  }
  ctx.restore();

  const e = t - SLAM;
  if (e >= 0 && e < 0.7) {
    const k = e / 0.7;
    const rx = 30 + e * 1300;
    ctx.strokeStyle = `rgba(216,178,122,${0.9 * (1 - k)})`;
    ctx.lineWidth = 10 * (1 - k) + 2;
    ctx.beginPath();
    ctx.ellipse(640, GROUND - 4, rx, rx * 0.1, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  }
}

function drawSpike(ctx, x, base, h, lean) {
  if (h <= 1) return;
  const w = h * 0.32;
  const tipX = x + lean * h * 0.18;
  const tipY = base - h;
  ctx.fillStyle = '#8a6844';
  ctx.beginPath();
  ctx.moveTo(x - w, base);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(x + w * 0.1, base);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4f3a27';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.1, base);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(x + w, base);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1e130b';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - w, base);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(x + w, base);
  ctx.stroke();
  // veio brilhante como o do lutador de Terra
  ctx.strokeStyle = 'rgba(255,179,71,0.85)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.3, base - h * 0.1);
  ctx.lineTo(x - w * 0.15, base - h * 0.35);
  ctx.lineTo(x - w * 0.3 + (tipX - x) * 0.5, base - h * 0.55);
  ctx.stroke();
}

// Na frente de tudo: poeira no ar e pedregulhos caindo
function quakeFront(ctx, t) {
  const k = Math.min(1, t / 0.8);
  const after = t > SLAM ? Math.min(1, (t - SLAM) / 0.4) : 0;
  ctx.fillStyle = `rgba(120,92,60,${0.1 * k + 0.12 * after})`;
  ctx.fillRect(-1200, -900, 3700, 2400);
  for (const b of BOULDERS) {
    const life = t - b.at;
    if (life < 0 || t >= b.land) continue;
    const y = -80 + 0.5 * 1600 * life * life;
    drawBoulder(ctx, b.x, y, b.s, life * b.spin);
  }
}

function drawBoulder(ctx, x, y, s, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const shape = [[-s, 0], [-s * 0.55, -s * 0.85], [s * 0.6, -s * 0.75], [s, s * 0.1], [s * 0.35, s * 0.85], [-s * 0.6, s * 0.65]];
  ctx.beginPath();
  shape.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.closePath();
  ctx.fillStyle = '#7a5a3a';
  ctx.fill();
  ctx.fillStyle = '#a07a52';
  ctx.beginPath();
  ctx.moveTo(-s, 0); ctx.lineTo(-s * 0.55, -s * 0.85); ctx.lineTo(s * 0.6, -s * 0.75); ctx.lineTo(s * 0.1, -s * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1e130b';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  shape.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}
