// Desenho do cenário em camadas:
//   céu (fixo na tela) -> fundo distante -> fundo médio -> ilha (mundo)
// As camadas de fundo andam menos que o mundo quando a câmera se move
// (paralaxe), o que dá sensação de profundidade. O que não se mexe é
// desenhado uma vez em telas fora da vista (cache) e só copiado a cada quadro.
//
// Só o visual mora aqui: chão, paredes, plataformas e perigos continuam nas
// posições de shared/maps.js (é lá que fica a colisão).

const VIEW_W = 1280;
const VIEW_H = 720;

// Área coberta por cada camada (em coordenadas da própria camada) e quanto
// ela acompanha a câmera.
const FAR = { f: 0.2, x: -760, y: -520, w: 2800, h: 1900, res: 0.5 };
const MID = { f: 0.5, x: -560, y: -360, w: 2400, h: 1700, res: 0.75 };

// Paleta da pedra da ilha
const STONE = {
  outline: '#140a16',
  mortar: '#1b111f',
  blocks: ['#4d3d55', '#46374f', '#54435c', '#3f3148', '#4a3a51'],
  lip: '#a38fa6',
  lipDark: '#5c4a60',
};

export class StageRenderer {
  constructor(map, scale = 1) {
    this.map = map;
    this.scale = 0;
    this.terrainRect = { x: 60, y: -420, w: 1160, h: 1400 };
    this.setScale(scale);
  }

  setScale(scale) {
    if (scale === this.scale) return;
    this.scale = scale;
    this.sky = this.buildSky();
    this.far = this.buildLayer(FAR, (ctx, rand) => drawFar(ctx, this.map, rand));
    this.mid = this.buildLayer(MID, (ctx, rand) => drawMid(ctx, this.map, rand));
    this.terrain = this.buildLayer({ ...this.terrainRect, res: 1 }, (ctx, rand) => drawTerrain(ctx, this.map, rand));
  }

  makeCanvas(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w));
    canvas.height = Math.max(1, Math.round(h));
    return canvas;
  }

  buildSky() {
    const s = this.scale;
    const canvas = this.makeCanvas(VIEW_W * s, VIEW_H * s);
    const ctx = canvas.getContext('2d');
    ctx.scale(s, s);
    const t = this.map.theme;
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    sky.addColorStop(0, t.skyTop);
    sky.addColorStop(0.45, '#26113c');
    sky.addColorStop(0.75, t.skyBottom);
    sky.addColorStop(1, '#2a0f24');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // Metade quente (vulcão) e metade fria (cachoeira)
    const side = ctx.createLinearGradient(0, 0, VIEW_W, 0);
    side.addColorStop(0, 'rgba(255,80,30,0.22)');
    side.addColorStop(0.5, 'rgba(120,40,120,0)');
    side.addColorStop(1, 'rgba(40,130,255,0.2)');
    ctx.fillStyle = side;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // Nebulosas bem suaves
    for (const [x, y, r, c] of [[420, 120, 380, '122,60,255,0.10'], [930, 80, 300, '47,181,201,0.08'], [660, 250, 440, '255,79,154,0.06']]) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${c})`);
      g.addColorStop(1, `rgba(${c.split(',').slice(0, 3).join(',')},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const rand = seeded(3);
    // Faixa da via láctea (diagonal)
    ctx.save();
    ctx.translate(640, 160);
    ctx.rotate(-0.28);
    const band = ctx.createLinearGradient(0, -90, 0, 90);
    band.addColorStop(0, 'rgba(220,200,255,0)');
    band.addColorStop(0.5, 'rgba(220,200,255,0.07)');
    band.addColorStop(1, 'rgba(220,200,255,0)');
    ctx.fillStyle = band;
    ctx.fillRect(-900, -90, 1800, 180);
    for (let i = 0; i < 160; i++) {
      ctx.globalAlpha = 0.15 + rand() * 0.5;
      ctx.fillStyle = '#f2e8ff';
      ctx.fillRect(-800 + rand() * 1600, (rand() + rand() - 1) * 70, 1, 1);
    }
    ctx.restore();
    for (let i = 0; i < 150; i++) {
      ctx.globalAlpha = 0.15 + rand() * 0.65;
      ctx.fillStyle = rand() < 0.15 ? '#ffd7b0' : '#ffffff';
      ctx.beginPath();
      ctx.arc(rand() * VIEW_W, rand() * VIEW_H * 0.6, rand() * 1.3 + 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    return canvas;
  }

  buildLayer(rect, paint) {
    const s = this.scale * rect.res;
    const canvas = this.makeCanvas(rect.w * s, rect.h * s);
    const ctx = canvas.getContext('2d');
    ctx.scale(s, s);
    ctx.translate(-rect.x, -rect.y);
    paint(ctx, seeded(11));
    return canvas;
  }

  // Céu e camadas de fundo. `shake` é o tremor de tela em unidades lógicas.
  drawBackground(ctx, camera, time, shake = { x: 0, y: 0 }) {
    const s = this.scale;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.sky, 0, 0);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    drawSkyAnimated(ctx, time);

    for (const [layer, cache, animate] of [[FAR, this.far, drawFarAnimated], [MID, this.mid, drawMidAnimated]]) {
      const l = camera.layer(layer.f);
      const z = s * l.zoom;
      ctx.setTransform(z, 0, 0, z, (l.ox + shake.x * layer.f) * s, (l.oy + shake.y * layer.f) * s);
      ctx.drawImage(cache, layer.x, layer.y, layer.w, layer.h);
      animate(ctx, time);
    }

    // Neblina quente subindo do fundo
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const fog = ctx.createLinearGradient(0, VIEW_H * 0.55, 0, VIEW_H);
    fog.addColorStop(0, 'rgba(60,20,40,0)');
    fog.addColorStop(1, 'rgba(70,24,40,0.55)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  // Ilha, plataformas e enfeites (com a transformação do mundo já aplicada).
  drawTerrain(ctx, time) {
    for (const d of this.map.decor ?? []) {
      if (d.type === 'cascata') drawCascade(ctx, d, time);
    }
    drawAbyssGlow(ctx, time);
    const r = this.terrainRect;
    ctx.drawImage(this.terrain, r.x, r.y, r.w, r.h);
    drawIslandAnimated(ctx, time);
    for (const d of this.map.decor ?? []) drawDecorAnimated(ctx, d, time);
  }

  // Perigos animados. `front` desenha uma camada translúcida por cima dos
  // personagens para parecer que estão "dentro" da lava/água.
  drawHazards(ctx, time, front = false) {
    for (const h of this.map.hazards) {
      if (h.type === 'lava') drawLava(ctx, h, time, front);
      else if (h.type === 'agua') drawWater(ctx, h, time, front);
      else if (h.type === 'espinhos' && !front) drawSpikes(ctx, h, time);
    }
  }

  // Escurece as bordas da tela (por cima do mundo, embaixo do placar).
  drawVignette(ctx) {
    const s = this.scale;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const v = ctx.createRadialGradient(VIEW_W / 2, VIEW_H * 0.55, VIEW_H * 0.45, VIEW_W / 2, VIEW_H * 0.55, VIEW_W * 0.75);
    v.addColorStop(0, 'rgba(8,2,14,0)');
    v.addColorStop(1, 'rgba(8,2,14,0.45)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

// ======================================================================
// Céu animado: estrelas piscando e, de vez em quando, uma estrela cadente.

const TWINKLES = Array.from({ length: 16 }, (_, i) => ({
  x: (i * 397) % VIEW_W, y: 20 + ((i * 211) % 300), p: i * 1.7, r: 1 + (i % 3) * 0.5,
}));

function drawSkyAnimated(ctx, time) {
  for (const s of TWINKLES) {
    const a = Math.max(0, Math.sin(time * 1.6 + s.p));
    if (a < 0.05) continue;
    ctx.globalAlpha = a * 0.9;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(s.x - s.r * 3, s.y - 0.5, s.r * 6, 1);
    ctx.fillRect(s.x - 0.5, s.y - s.r * 3, 1, s.r * 6);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // estrela cadente a cada 9 s
  const k = (time % 9) / 0.9;
  if (k < 1) {
    const n = Math.floor(time / 9);
    const x0 = 200 + ((n * 431) % 800);
    const x = x0 + k * 260;
    const y = 40 + ((n * 97) % 120) + k * 110;
    const g = ctx.createLinearGradient(x - 120, y - 50, x, y);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, `rgba(255,255,255,${0.8 * (1 - k)})`);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = g;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 120, y - 50);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ======================================================================
// Fundo distante: serras, vulcão em erupção à esquerda, penhasco com
// cachoeira à direita, ilhas flutuando bem longe.

function drawFar(ctx, map, rand) {
  // Lua com halo e nuvens finas passando na frente
  const moon = ctx.createRadialGradient(980, 40, 8, 980, 40, 240);
  moon.addColorStop(0, 'rgba(255,226,200,0.95)');
  moon.addColorStop(0.18, 'rgba(255,190,150,0.45)');
  moon.addColorStop(1, 'rgba(255,120,90,0)');
  ctx.fillStyle = moon;
  ctx.fillRect(740, -200, 480, 480);
  const disc = ctx.createRadialGradient(970, 30, 4, 980, 40, 36);
  disc.addColorStop(0, '#fff6ea');
  disc.addColorStop(1, '#f2c9b0');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(980, 40, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(200,150,140,0.35)';
  for (const [dx, dy, r] of [[-10, -8, 7], [12, 10, 5], [6, -16, 4], [-14, 14, 3]]) {
    ctx.beginPath();
    ctx.arc(980 + dx, 40 + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const [x, y, w] of [[930, 54, 180], [1000, 70, 130], [1030, 26, 110]]) {
    const c = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    c.addColorStop(0, 'rgba(70,35,80,0)');
    c.addColorStop(0.5, 'rgba(70,35,80,0.4)');
    c.addColorStop(1, 'rgba(70,35,80,0)');
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ilhas distantes, algumas com ruínas e luzinhas
  for (let i = 0; i < 7; i++) {
    const x = -500 + rand() * 2300;
    const y = -200 + rand() * 380;
    distantIsland(ctx, x, y, 30 + rand() * 60, rand);
  }

  // Serras bem ao fundo (duas camadas, a de trás mais clara pela névoa)
  ridge(ctx, rand, -760, 2040, 470, 120, '#2a1636');
  ridge(ctx, rand, -760, 2040, 560, 110, '#22112d');

  // Vulcão (esquerda), com o lado da luz à esquerda e sulcos na encosta
  const vg = ctx.createLinearGradient(0, 170, 0, 1300);
  vg.addColorStop(0, '#3a1628');
  vg.addColorStop(0.5, '#28101f');
  vg.addColorStop(1, '#1a0a16');
  ctx.fillStyle = vg;
  ctx.beginPath();
  ctx.moveTo(-760, 1380);
  ctx.lineTo(-420, 600);
  ctx.quadraticCurveTo(-140, 220, 40, 170);
  ctx.lineTo(170, 170);
  ctx.quadraticCurveTo(330, 230, 560, 640);
  ctx.lineTo(820, 1380);
  ctx.closePath();
  ctx.fill();
  // lado na sombra (direita)
  ctx.fillStyle = 'rgba(10,2,12,0.35)';
  ctx.beginPath();
  ctx.moveTo(130, 172);
  ctx.lineTo(170, 170);
  ctx.quadraticCurveTo(330, 230, 560, 640);
  ctx.lineTo(820, 1380);
  ctx.lineTo(300, 1380);
  ctx.quadraticCurveTo(260, 600, 130, 172);
  ctx.fill();
  // sulcos
  ctx.strokeStyle = 'rgba(10,2,12,0.35)';
  ctx.lineWidth = 3;
  for (const [x0, x1] of [[60, -260], [20, -400], [150, 420], [120, 250]]) {
    ctx.beginPath();
    ctx.moveTo(x0, 190);
    ctx.quadraticCurveTo((x0 + x1) / 2 + 20, 500, x1, 1000);
    ctx.stroke();
  }
  // borda da cratera brilhando
  ctx.strokeStyle = 'rgba(255,140,60,0.7)';
  ctx.shadowColor = '#ff6a1a';
  ctx.shadowBlur = 14;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, 171);
  ctx.quadraticCurveTo(105, 160, 170, 171);
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Rios de lava descendo
  ctx.lineCap = 'round';
  for (const [x0, x1, y1] of [[80, -40, 430], [112, 150, 520], [140, 300, 400], [60, -180, 620]]) {
    ctx.beginPath();
    ctx.moveTo(x0, 178);
    ctx.bezierCurveTo(x0 + (x1 - x0) * 0.2, 260, x0 + (x1 - x0) * 0.9, y1 - 160, x1, y1);
    ctx.strokeStyle = 'rgba(255,90,20,0.2)';
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,170,70,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Penhasco (direita) de onde cai a cachoeira: facetas de rocha azulada
  ctx.fillStyle = '#121a33';
  ctx.beginPath();
  ctx.moveTo(1180, 1380);
  ctx.lineTo(1150, 300);
  ctx.lineTo(1210, 120);
  ctx.lineTo(1330, 90);
  ctx.lineTo(1460, 140);
  ctx.lineTo(2040, 120);
  ctx.lineTo(2040, 1380);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(90,130,220,0.10)';
  for (const pts of [[[1150, 300], [1210, 120], [1240, 360], [1190, 700]], [[1330, 90], [1460, 140], [1420, 420], [1300, 380]], [[1560, 135], [1700, 128], [1660, 520]]]) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(120,180,255,0.08)';
  for (let i = 0; i < 40; i++) ctx.fillRect(1180 + rand() * 800, 150 + rand() * 900, 30 + rand() * 60, 3);
  // árvores pequenas no topo do penhasco
  for (let i = 0; i < 9; i++) {
    const x = 1240 + i * 70 + rand() * 30;
    const y = x < 1460 ? 90 + (x - 1330) * 0.38 + 6 : 128;
    pineSilhouette(ctx, x, Math.max(y, 95), 26 + rand() * 22, '#0b1226');
  }
  // cristais azuis brilhando na rocha
  for (const [x, y] of [[1240, 420], [1380, 300], [1520, 520]]) {
    ctx.shadowColor = '#5ab8ff';
    ctx.shadowBlur = 16;
    ctx.fillStyle = 'rgba(140,210,255,0.8)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 6, y - 18);
    ctx.lineTo(x + 12, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function ridge(ctx, rand, x0, x1, base, amp, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x0, 1380);
  let x = x0;
  ctx.lineTo(x, base);
  while (x < x1) {
    x += 80 + rand() * 120;
    ctx.lineTo(x - 40, base - amp * (0.4 + rand() * 0.6));
    ctx.lineTo(x, base - rand() * amp * 0.3);
  }
  ctx.lineTo(x1, 1380);
  ctx.closePath();
  ctx.fill();
}

function pineSilhouette(ctx, x, y, h, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + h * 0.32, y);
  ctx.lineTo(x - h * 0.32, y);
  ctx.closePath();
  ctx.fill();
}

function distantIsland(ctx, x, y, size, rand) {
  ctx.fillStyle = '#2a1430';
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size * 0.55, y + size * 0.35);
  ctx.lineTo(x + size * 0.2, y + size * (0.7 + rand() * 0.4));
  ctx.lineTo(x - size * 0.25, y + size * 0.55);
  ctx.lineTo(x - size * 0.7, y + size * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3b2045';
  ctx.fillRect(x - size, y - 2, size * 2, 3);
  if (rand() < 0.6) {
    // ruína: duas colunas e um telhado
    ctx.fillStyle = '#2a1430';
    const w = size * 0.5;
    ctx.fillRect(x - w * 0.5, y - w * 0.7, w * 0.15, w * 0.7);
    ctx.fillRect(x + w * 0.35, y - w * 0.7, w * 0.15, w * 0.7);
    ctx.beginPath();
    ctx.moveTo(x - w * 0.65, y - w * 0.7);
    ctx.lineTo(x, y - w * 1.05);
    ctx.lineTo(x + w * 0.65, y - w * 0.7);
    ctx.fill();
    ctx.fillStyle = rand() < 0.5 ? 'rgba(255,170,90,0.85)' : 'rgba(140,210,255,0.85)';
    ctx.fillRect(x - 1.5, y - w * 0.45, 3, 3);
  } else {
    pineSilhouette(ctx, x - size * 0.3, y, size * 0.5, '#2a1430');
    pineSilhouette(ctx, x + size * 0.1, y, size * 0.7, '#2a1430');
  }
}

function drawFarAnimated(ctx, time) {
  // Brilho pulsando na cratera
  const pulse = 0.55 + Math.sin(time * 1.7) * 0.15;
  const crater = ctx.createRadialGradient(105, 170, 6, 105, 170, 170);
  crater.addColorStop(0, `rgba(255,190,90,${pulse})`);
  crater.addColorStop(0.4, `rgba(255,90,30,${pulse * 0.45})`);
  crater.addColorStop(1, 'rgba(255,60,20,0)');
  ctx.fillStyle = crater;
  ctx.fillRect(-80, 0, 370, 340);
  // Fumaça
  for (let i = 0; i < 6; i++) {
    const k = (time * 0.05 + i / 6) % 1;
    const sx = 105 + Math.sin(i * 2 + time * 0.3) * 30 + k * 140;
    const sy = 150 - k * 380;
    const r = 50 + k * 120;
    const puff = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    puff.addColorStop(0, `rgba(60,30,45,${0.35 * (1 - k)})`);
    puff.addColorStop(1, 'rgba(60,30,45,0)');
    ctx.fillStyle = puff;
    ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
  }
  // Pedrinhas de lava sendo cuspidas
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.45 + i * 0.27) % 1;
    const dir = i % 2 ? 1 : -1;
    const x = 105 + dir * k * (60 + i * 20);
    const y = 165 - Math.sin(k * Math.PI) * (90 + i * 25);
    ctx.globalAlpha = 1 - k;
    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Cachoeira com várias faixas de água
  const x = 1190;
  const top = 160;
  const bottom = 980;
  const g = ctx.createLinearGradient(x - 40, 0, x + 40, 0);
  g.addColorStop(0, 'rgba(90,170,255,0.35)');
  g.addColorStop(0.5, 'rgba(200,235,255,0.75)');
  g.addColorStop(1, 'rgba(90,170,255,0.35)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - 30, top);
  ctx.lineTo(x + 30, top);
  ctx.lineTo(x + 40, bottom);
  ctx.lineTo(x - 40, bottom);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 18; i++) {
    const lx = x - 30 + ((i * 37) % 60);
    const ly = top + ((time * (240 + (i % 3) * 40) + i * 97) % (bottom - top));
    ctx.fillRect(lx, ly, 2.5, 40 + (i % 4) * 10);
  }
  // espuma no topo
  const foam = ctx.createRadialGradient(x, top + 4, 2, x, top + 4, 40);
  foam.addColorStop(0, 'rgba(235,250,255,0.7)');
  foam.addColorStop(1, 'rgba(235,250,255,0)');
  ctx.fillStyle = foam;
  ctx.fillRect(x - 40, top - 16, 80, 40);
  // Névoa na base
  const mist = ctx.createRadialGradient(x, 900, 10, x, 900, 260);
  mist.addColorStop(0, 'rgba(200,230,255,0.35)');
  mist.addColorStop(1, 'rgba(200,230,255,0)');
  ctx.fillStyle = mist;
  ctx.fillRect(x - 260, 640, 520, 520);
}

// ======================================================================
// Fundo médio: morros, um grande arco de templo com o selo dos quatro
// elementos, colunas em ruínas e pedras flutuando.

function drawMid(ctx, map, rand) {
  // Morros com a borda iluminada (quente à esquerda, fria à direita)
  const hills = [];
  let x = -560;
  hills.push([x, 640]);
  while (x < 1840) {
    x += 60 + rand() * 90;
    hills.push([x, 520 + rand() * 170]);
  }
  ctx.fillStyle = '#1d0b1c';
  ctx.beginPath();
  ctx.moveTo(-560, 1340);
  for (const [hx, hy] of hills) ctx.lineTo(hx, hy);
  ctx.lineTo(1840, 1340);
  ctx.closePath();
  ctx.fill();
  const rim = ctx.createLinearGradient(-200, 0, 1500, 0);
  rim.addColorStop(0, 'rgba(255,120,60,0.35)');
  rim.addColorStop(0.5, 'rgba(180,110,200,0.15)');
  rim.addColorStop(1, 'rgba(90,170,255,0.35)');
  ctx.strokeStyle = rim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  hills.forEach(([hx, hy], i) => (i ? ctx.lineTo(hx, hy) : ctx.moveTo(hx, hy)));
  ctx.stroke();

  templeArch(ctx);

  // Colunas em ruínas: runas laranja do lado do fogo, azuis do lado da água
  const columns = [[-120, 300, '#ff7a2a', false], [90, 360, '#ff7a2a', false], [1180, 340, '#4fb0ff', true], [1390, 290, '#4fb0ff', true]];
  for (const [cx, h, rune, ivy] of columns) ruinColumn(ctx, cx, 640, h, rune, ivy, rand);

  // Pedras flutuando entre o fundo e a ilha
  for (const [fx, fy, size] of [[-300, 120, 40], [1500, 60, 50], [300, -120, 26], [1000, -160, 30]]) {
    floatingRock(ctx, fx, fy, size, '#2a1530', rand);
    ctx.fillStyle = '#3d2346';
    ctx.fillRect(fx - size, fy - 2, size * 2, 3);
  }
}

// Arco do templo atrás da arena, com o selo dos elementos no alto
function templeArch(ctx) {
  const cx = 640;
  const baseY = 650;
  const top = 250;
  const body = '#24102a';
  const edge = '#3a1f42';
  for (const px of [390, 890]) {
    const g = ctx.createLinearGradient(px - 34, 0, px + 34, 0);
    g.addColorStop(0, edge);
    g.addColorStop(0.4, body);
    g.addColorStop(1, '#1a0a1e');
    ctx.fillStyle = g;
    ctx.fillRect(px - 34, top, 68, baseY - top);
    ctx.fillStyle = edge;
    ctx.fillRect(px - 42, top - 16, 84, 18);
    ctx.fillRect(px - 42, baseY - 20, 84, 20);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let y = top + 40; y < baseY - 20; y += 46) ctx.fillRect(px - 34, y, 68, 3);
  }
  // arco (com um pedaço quebrado à direita)
  ctx.lineWidth = 46;
  ctx.strokeStyle = body;
  ctx.beginPath();
  ctx.arc(cx, top - 8, 250, Math.PI * 1.0, Math.PI * 1.72);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, top - 8, 250, Math.PI * 1.8, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = edge;
  ctx.beginPath();
  ctx.arc(cx, top - 8, 273, Math.PI * 1.0, Math.PI * 1.72);
  ctx.stroke();
  // pedaços do arco flutuando perto do buraco
  for (const [bx, by, r, rot] of [[880, 10, 11, 0.5], [905, 48, 7, -0.4]]) {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(rot);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-r, -r * 0.4);
    ctx.lineTo(-r * 0.3, -r * 0.8);
    ctx.lineTo(r, -r * 0.5);
    ctx.lineTo(r * 0.7, r * 0.6);
    ctx.lineTo(-r * 0.6, r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r, -r * 0.4);
    ctx.lineTo(-r * 0.3, -r * 0.8);
    ctx.lineTo(r, -r * 0.5);
    ctx.stroke();
    ctx.restore();
  }
  // selo dos quatro elementos (pedra com runas acesas)
  const sy = -40;
  ctx.fillStyle = '#2d1435';
  ctx.beginPath();
  ctx.arc(cx, sy, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(199,125,255,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, sy, 44, 0, Math.PI * 2);
  ctx.stroke();
  const sigils = [
    [0, -44, '#ff8a3a', 'fogo'], [44, 0, '#5ab8ff', 'agua'],
    [0, 44, '#d8b27a', 'terra'], [-44, 0, '#bfe9e1', 'ar'],
  ];
  for (const [dx, dy, color, el] of sigils) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#1a0a1e';
    ctx.beginPath();
    ctx.arc(cx + dx, sy + dy, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    elementGlyph(ctx, cx + dx, sy + dy, el);
  }
  ctx.shadowBlur = 0;
}

// Símbolo simples de cada elemento (usado no selo do templo)
function elementGlyph(ctx, x, y, el) {
  ctx.beginPath();
  if (el === 'fogo') {
    ctx.moveTo(x, y - 8);
    ctx.quadraticCurveTo(x + 7, y, x + 4, y + 6);
    ctx.quadraticCurveTo(x, y + 9, x - 4, y + 6);
    ctx.quadraticCurveTo(x - 7, y, x, y - 8);
    ctx.fill();
  } else if (el === 'agua') {
    ctx.moveTo(x, y - 8);
    ctx.quadraticCurveTo(x + 7, y + 2, x, y + 7);
    ctx.quadraticCurveTo(x - 7, y + 2, x, y - 8);
    ctx.fill();
  } else if (el === 'terra') {
    ctx.moveTo(x - 7, y + 6);
    ctx.lineTo(x - 2, y - 6);
    ctx.lineTo(x + 2, y);
    ctx.lineTo(x + 4, y - 3);
    ctx.lineTo(x + 8, y + 6);
    ctx.closePath();
    ctx.fill();
  } else {
    for (const dy of [-4, 1, 6]) {
      ctx.moveTo(x - 7, y + dy);
      ctx.quadraticCurveTo(x, y + dy - 4, x + 7, y + dy);
    }
    ctx.stroke();
  }
}

function ruinColumn(ctx, cx, base, h, rune, ivy, rand) {
  const g = ctx.createLinearGradient(cx - 26, 0, cx + 26, 0);
  g.addColorStop(0, '#3d2245');
  g.addColorStop(0.35, '#2e1736');
  g.addColorStop(1, '#1d0d22');
  ctx.fillStyle = g;
  ctx.fillRect(cx - 26, base - h, 52, h + 40);
  // base e capitel
  ctx.fillStyle = '#3a1f3f';
  ctx.fillRect(cx - 34, base - h - 14, 68, 16);
  ctx.fillRect(cx - 32, base - 8, 64, 48);
  // topo quebrado
  ctx.fillStyle = '#1d0b1c';
  ctx.beginPath();
  ctx.moveTo(cx - 34, base - h - 14);
  ctx.lineTo(cx - 10, base - h - 4);
  ctx.lineTo(cx + 6, base - h - 18);
  ctx.lineTo(cx + 34, base - h - 8);
  ctx.lineTo(cx + 34, base - h - 30);
  ctx.lineTo(cx - 34, base - h - 30);
  ctx.closePath();
  ctx.fill();
  // caneluras
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (let i = 0; i < 3; i++) ctx.fillRect(cx - 26 + 12 + i * 12, base - h, 3, h);
  // rachadura
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  let y = base - h + 20 + rand() * 40;
  ctx.moveTo(cx - 26, y);
  for (let k = 0; k < 4; k++) {
    y += 10 + rand() * 14;
    ctx.lineTo(cx - 26 + (k + 1) * 9, y);
  }
  ctx.stroke();
  // runas
  ctx.shadowColor = rune;
  ctx.shadowBlur = 14;
  ctx.fillStyle = rune;
  for (let i = 0; i < 3; i++) {
    const ry = base - h + 50 + i * 60;
    ctx.fillRect(cx - 6, ry, 12, 3);
    ctx.fillRect(cx - 1.5, ry - 8, 3, 18);
  }
  ctx.shadowBlur = 0;
  // trepadeira (lado da água)
  if (ivy) {
    ctx.strokeStyle = '#1f4a3a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 20, base - h);
    for (let yy = base - h; yy < base; yy += 20) ctx.lineTo(cx - 20 + Math.sin(yy * 0.08) * 12, yy);
    ctx.stroke();
    ctx.fillStyle = '#2f6b4c';
    for (let yy = base - h + 10; yy < base; yy += 22) {
      ctx.beginPath();
      ctx.ellipse(cx - 20 + Math.sin(yy * 0.08) * 12 + 5, yy, 5, 3, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawMidAnimated(ctx, time) {
  // Selo do templo pulsando devagar
  const a = 0.15 + (Math.sin(time * 1.2) + 1) * 0.08;
  const g = ctx.createRadialGradient(640, -40, 10, 640, -40, 120);
  g.addColorStop(0, `rgba(199,125,255,${a})`);
  g.addColorStop(1, 'rgba(199,125,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(520, -160, 240, 240);
  // Névoa passando na frente dos morros
  for (let i = 0; i < 5; i++) {
    const x = ((time * (14 + i * 4) + i * 420) % 2400) - 560;
    const y = 600 + (i % 3) * 40;
    const r = 220 + (i % 2) * 80;
    const fog = ctx.createRadialGradient(x, y, 0, x, y, r);
    fog.addColorStop(0, 'rgba(120,70,120,0.12)');
    fog.addColorStop(1, 'rgba(120,70,120,0)');
    ctx.fillStyle = fog;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

// ======================================================================
// Ilha principal (mundo)

// Contorno de baixo da ilha: acompanha os blocos de colisão da base e
// termina em pontas de pedra penduradas.
const UNDERSIDE = [
  [180, 700], [192, 712], [238, 718], [254, 744], [300, 758], [366, 762], [384, 792],
  [450, 806], [530, 814], [640, 820], [750, 814], [830, 806], [896, 792],
  [914, 762], [980, 758], [1026, 744], [1042, 718], [1088, 712], [1100, 700],
];

function drawTerrain(ctx, map, rand) {
  const bounds = islandBounds(map);
  const top = Math.min(...map.solids.map((s) => s.y));

  // Correntes segurando as plataformas
  for (const p of map.platforms) {
    for (const cx of [p.x + 16, p.x + p.w - 16]) chain(ctx, cx, -420, p.y + 2);
  }

  drawUnderside(ctx, rand);

  // Fundo escuro das piscinas (a parede de trás da bacia)
  for (const h of map.hazards) {
    if (h.type !== 'lava' && h.type !== 'agua') continue;
    const lava = h.type === 'lava';
    ctx.fillStyle = '#1a1020';
    ctx.fillRect(h.x, top, h.w, h.y + h.h - top);
    const glow = ctx.createLinearGradient(0, top, 0, h.y + 4);
    glow.addColorStop(0, 'rgba(0,0,0,0)');
    glow.addColorStop(1, lava ? 'rgba(255,110,30,0.55)' : 'rgba(80,170,255,0.45)');
    ctx.fillStyle = glow;
    ctx.fillRect(h.x, top, h.w, h.y + 4 - top);
  }

  // Paredão de pedra: blocos com chanfro, só onde existe chão de verdade
  const wall = map.solids.filter((s) => s.y < 700);
  ctx.save();
  ctx.beginPath();
  for (const s of wall) ctx.rect(s.x, s.y, s.w, Math.min(s.h, 700 - s.y));
  ctx.clip();
  ctx.fillStyle = STONE.mortar;
  ctx.fillRect(bounds.left, top, bounds.right - bounds.left, 700 - top);
  masonry(ctx, bounds.left, top + 9, bounds.right - bounds.left, 700 - top - 9, rand);
  // friso esculpido logo abaixo do chão
  frieze(ctx, bounds.left, top + 9, bounds.right - bounds.left);
  // sombra para baixo e tom quente/frio
  const shade = ctx.createLinearGradient(0, top, 0, 700);
  shade.addColorStop(0, 'rgba(10,4,16,0)');
  shade.addColorStop(1, 'rgba(10,4,16,0.55)');
  ctx.fillStyle = shade;
  ctx.fillRect(bounds.left, top, bounds.right - bounds.left, 700 - top);
  const tint = ctx.createLinearGradient(bounds.left, 0, bounds.right, 0);
  tint.addColorStop(0, 'rgba(255,90,30,0.22)');
  tint.addColorStop(0.42, 'rgba(255,90,30,0)');
  tint.addColorStop(0.58, 'rgba(60,140,255,0)');
  tint.addColorStop(1, 'rgba(60,140,255,0.22)');
  ctx.fillStyle = tint;
  ctx.fillRect(bounds.left, top, bounds.right - bounds.left, 700 - top);
  // fuligem perto da lava, musgo e manchas de água perto da água
  soot(ctx, map, rand);
  mossAndDrips(ctx, map, rand);
  // veias de lava (esquerda) e de cristal (direita)
  veins(ctx, bounds.left + 10, 600, 1, 'rgba(255,120,40,0.85)', rand);
  veins(ctx, bounds.right - 10, 600, -1, 'rgba(110,200,255,0.85)', rand);
  ctx.restore();

  // Contorno escuro do paredão
  ctx.strokeStyle = STONE.outline;
  ctx.lineWidth = 3;
  for (const s of wall) {
    ctx.beginPath();
    if (s.x === bounds.left) {
      ctx.moveTo(s.x, 700);
      ctx.lineTo(s.x, s.y);
    }
    if (s.x + s.w === bounds.right) {
      ctx.moveTo(s.x + s.w, s.y);
      ctx.lineTo(s.x + s.w, 700);
    }
    ctx.stroke();
  }

  // Bordas das paredes de fora (onde dá para se pendurar): apoios esculpidos
  for (const [wx, dir, color] of [[bounds.left, 1, '#ff8a3a'], [bounds.right, -1, '#5ab8ff']]) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(dir > 0 ? wx : wx - 4, top + 4, 4, 696 - top);
    for (let y = top + 28; y < 690; y += 34) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(dir > 0 ? wx + 4 : wx - 14, y, 10, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(dir > 0 ? wx + 4 : wx - 14, y - 1, 10, 1);
    }
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = color;
    for (const y of [596, 652]) {
      ctx.beginPath();
      ctx.arc(wx + dir * 9, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  // Chão: borda de pedra clara em cima de cada bloco
  for (const s of map.solids) {
    if (s.y !== top) continue;
    groundLip(ctx, s, rand);
  }
  // Bordas das piscinas
  for (const h of map.hazards) {
    if (h.type !== 'lava' && h.type !== 'agua') continue;
    for (const ex of [h.x, h.x + h.w]) {
      ctx.fillStyle = STONE.lip;
      roundRect(ctx, ex - 7, top - 3, 14, 9, 3);
      ctx.fill();
      ctx.strokeStyle = STONE.outline;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  grassAndEmbers(ctx, map, rand);

  // Plataformas finas
  for (const p of map.platforms) drawPlatform(ctx, p, map);

  // Partes paradas dos enfeites
  for (const d of map.decor ?? []) drawDecorStatic(ctx, d, rand);
}

function islandBounds(map) {
  let left = Infinity;
  let right = -Infinity;
  for (const s of map.solids) {
    left = Math.min(left, s.x);
    right = Math.max(right, s.x + s.w);
  }
  return { left, right };
}

// Parte de baixo da ilha: rocha com facetas, veias, raízes, estalactites e
// um cristal roxo pendurado no meio.
function drawUnderside(ctx, rand) {
  // contorno com pequenas irregularidades
  const pts = [];
  for (let i = 0; i < UNDERSIDE.length - 1; i++) {
    const [ax, ay] = UNDERSIDE[i];
    const [bx, by] = UNDERSIDE[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / 22));
    for (let k = 0; k < n; k++) {
      const u = k / n;
      const jag = i > 0 && k > 0 ? (rand() - 0.3) * 8 : 0;
      pts.push([ax + (bx - ax) * u, ay + (by - ay) * u + jag]);
    }
  }
  pts.push(UNDERSIDE[UNDERSIDE.length - 1]);

  // estalactites (atrás do corpo, para nascerem dele)
  ctx.fillStyle = '#21152a';
  ctx.strokeStyle = STONE.outline;
  ctx.lineWidth = 2.5;
  for (const [sx, len, w] of [[300, 40, 14], [350, 30, 10], [430, 70, 18], [500, 55, 14], [575, 95, 20], [700, 85, 18], [770, 60, 14], [850, 75, 16], [930, 34, 12], [990, 40, 12]]) {
    const y0 = undersideAt(sx) - 6;
    ctx.beginPath();
    ctx.moveTo(sx - w, y0);
    ctx.lineTo(sx + (rand() - 0.5) * 6, y0 + len);
    ctx.lineTo(sx + w, y0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  const g = ctx.createLinearGradient(0, 690, 0, 830);
  g.addColorStop(0, '#3a2c44');
  g.addColorStop(1, '#1d1224');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(180, 690);
  for (const [x, y] of pts) ctx.lineTo(x, y);
  ctx.lineTo(1100, 690);
  ctx.closePath();
  ctx.fill();

  // facetas de rocha (lado esquerdo de cada uma mais claro)
  ctx.save();
  ctx.clip();
  for (let i = 0; i < 26; i++) {
    const fx = 200 + rand() * 880;
    const fy = 704 + rand() * 90;
    const s = 16 + rand() * 26;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.moveTo(fx - s, fy);
    ctx.lineTo(fx - s * 0.2, fy - s * 0.5);
    ctx.lineTo(fx, fy + s * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fx - s * 0.2, fy - s * 0.5);
    ctx.lineTo(fx + s * 0.7, fy + s * 0.1);
    ctx.lineTo(fx, fy + s * 0.6);
    ctx.stroke();
  }
  veins(ctx, 230, 712, 1, 'rgba(255,120,40,0.75)', rand);
  veins(ctx, 1050, 712, -1, 'rgba(110,200,255,0.75)', rand);
  ctx.restore();

  ctx.strokeStyle = STONE.outline;
  ctx.lineWidth = 3;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();

  // raízes penduradas
  ctx.strokeStyle = '#2a1a22';
  ctx.lineWidth = 2;
  for (const rx of [270, 405, 610, 680, 880, 1010]) {
    const y0 = undersideAt(rx) - 4;
    ctx.beginPath();
    ctx.moveTo(rx, y0);
    ctx.bezierCurveTo(rx + 8, y0 + 20, rx - 10, y0 + 40, rx + 4, y0 + 58 + rand() * 30);
    ctx.stroke();
  }

  // cristais pendurados: brasa do lado do fogo, gelo do lado da água
  for (const [cx, color, light] of [[470, '#ff6a1f', '#ffd27a'], [540, '#ff6a1f', '#ffd27a'], [790, '#3a8fe0', '#bfe9ff'], [730, '#3a8fe0', '#bfe9ff']]) {
    hangingCrystal(ctx, cx, undersideAt(cx) - 4, 10 + rand() * 6, 26 + rand() * 16, color, light);
  }
  // coração de ametista no meio
  hangingCrystal(ctx, 640, 816, 18, 64, '#9b4dff', '#e6c8ff');
  hangingCrystal(ctx, 618, 812, 9, 34, '#7a3ad6', '#d9b8ff');
  hangingCrystal(ctx, 662, 812, 9, 30, '#7a3ad6', '#d9b8ff');

  // pedrinhas soltas flutuando embaixo
  for (let i = 0; i < 6; i++) floatingRock(ctx, 260 + rand() * 760, 940 + rand() * 60, 10 + rand() * 18, '#2a1d2e', rand);
}

// Altura do contorno de baixo da ilha num x
function undersideAt(x) {
  for (let i = 0; i < UNDERSIDE.length - 1; i++) {
    const [ax, ay] = UNDERSIDE[i];
    const [bx, by] = UNDERSIDE[i + 1];
    if (x >= ax && x <= bx) return ay + ((by - ay) * (x - ax)) / (bx - ax);
  }
  return 700;
}

function hangingCrystal(ctx, x, y, w, h, color, light) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
  g.addColorStop(0, light);
  g.addColorStop(0.5, color);
  g.addColorStop(1, shadeHex(color, -0.4));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.lineTo(x - w * 0.6, y + h * 0.65);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w * 0.6, y + h * 0.65);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = STONE.outline;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.5, y + 3);
  ctx.lineTo(x - w * 0.2, y + h * 0.6);
  ctx.stroke();
  ctx.restore();
}

// Blocos de pedra com juntas, chanfro claro em cima/esquerda e escuro
// embaixo/direita, e uma rachadura de vez em quando.
function masonry(ctx, x0, y0, w, h, rand) {
  let row = 0;
  for (let y = y0; y < y0 + h; row++) {
    const rh = 26 + rand() * 8;
    let x = x0 - (row % 2 ? 30 : 0) - rand() * 20;
    while (x < x0 + w) {
      const bw = 48 + rand() * 44;
      const bx = x + 1.5;
      const by = y + 1.5;
      const bwi = bw - 3;
      const bhi = rh - 3;
      ctx.fillStyle = STONE.blocks[Math.floor(rand() * STONE.blocks.length)];
      roundRect(ctx, bx, by, bwi, bhi, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(bx + 2, by, bwi - 4, 2);
      ctx.fillRect(bx, by + 2, 2, bhi - 4);
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(bx + 2, by + bhi - 3, bwi - 4, 3);
      ctx.fillRect(bx + bwi - 3, by + 2, 3, bhi - 4);
      if (rand() < 0.18) {
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        const cx = bx + rand() * bwi;
        ctx.moveTo(cx, by);
        ctx.lineTo(cx + (rand() - 0.5) * 12, by + bhi * 0.5);
        ctx.lineTo(cx + (rand() - 0.5) * 16, by + bhi);
        ctx.stroke();
      }
      if (rand() < 0.25) {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.arc(bx + rand() * bwi, by + rand() * bhi, 1.5 + rand() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      x += bw;
    }
    y += rh;
  }
}

// Faixa esculpida embaixo do chão, com losangos e pedrinhas coloridas
function frieze(ctx, x0, y, w) {
  ctx.fillStyle = '#5f4d68';
  ctx.fillRect(x0, y, w, 14);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x0, y + 12, w, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x0, y, w, 1.5);
  ctx.strokeStyle = 'rgba(20,10,24,0.6)';
  ctx.lineWidth = 1.5;
  for (let x = x0 + 8; x < x0 + w; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, y + 7);
    ctx.lineTo(x + 6, y + 2);
    ctx.lineTo(x + 12, y + 7);
    ctx.lineTo(x + 6, y + 12);
    ctx.closePath();
    ctx.stroke();
    const u = (x - x0) / w;
    ctx.fillStyle = u < 0.4 ? 'rgba(255,138,58,0.8)' : u > 0.6 ? 'rgba(90,184,255,0.8)' : 'rgba(199,125,255,0.8)';
    ctx.fillRect(x + 5, y + 6, 2, 2);
  }
}

function groundLip(ctx, s, rand) {
  const g = ctx.createLinearGradient(0, s.y, 0, s.y + 9);
  g.addColorStop(0, STONE.lip);
  g.addColorStop(1, STONE.lipDark);
  ctx.fillStyle = g;
  ctx.fillRect(s.x, s.y, s.w, 9);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(s.x, s.y, s.w, 1.5);
  // juntas da borda
  ctx.fillStyle = 'rgba(20,10,24,0.55)';
  for (let x = s.x + 30 + rand() * 20; x < s.x + s.w - 10; x += 46 + rand() * 30) ctx.fillRect(x, s.y + 2, 2, 7);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(s.x, s.y + 9, s.w, 2);
  // pedrinhas soltas no chão
  for (let i = 0; i < s.w / 40; i++) {
    ctx.fillStyle = '#7a6680';
    ctx.beginPath();
    ctx.ellipse(s.x + 6 + rand() * (s.w - 12), s.y + 0.5, 2 + rand() * 3, 1.6, 0, Math.PI, 0);
    ctx.fill();
  }
}

function soot(ctx, map, rand) {
  for (const h of map.hazards) {
    if (h.type !== 'lava') continue;
    for (let i = 0; i < 6; i++) {
      const x = h.x - 40 + rand() * (h.w + 80);
      const y = h.y + 20 + rand() * 90;
      const r = 20 + rand() * 30;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(10,4,6,0.35)');
      g.addColorStop(1, 'rgba(10,4,6,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
}

function mossAndDrips(ctx, map, rand) {
  for (const h of map.hazards) {
    if (h.type !== 'agua') continue;
    // manchas escorrendo das bordas da piscina
    ctx.fillStyle = 'rgba(20,40,70,0.35)';
    for (let i = 0; i < 7; i++) {
      const x = h.x - 30 + rand() * (h.w + 60);
      const len = 30 + rand() * 70;
      roundRect(ctx, x, h.y + h.h, 4 + rand() * 4, len, 3);
      ctx.fill();
    }
    // tufos de musgo grudados nas pedras perto da água
    for (let i = 0; i < 9; i++) {
      const x = h.x - 120 + rand() * (h.w + 300);
      const y = h.y + 30 + rand() * 90;
      for (let k = 0; k < 9; k++) {
        ctx.fillStyle = ['#2f5e3a', '#3f7a45', '#5f9a52'][Math.floor(rand() * 3)];
        ctx.beginPath();
        ctx.arc(x + (rand() - 0.5) * 18, y + (rand() - 0.5) * 6, 1.5 + rand() * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // musgo escorrendo da borda do chão
    for (let i = 0; i < 12; i++) {
      const x = h.x - 130 + rand() * (h.w + 300);
      if (x > h.x - 4 && x < h.x + h.w + 4) continue;
      const len = 6 + rand() * 18;
      ctx.strokeStyle = rand() < 0.5 ? '#3f7a45' : '#5f9a52';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, h.y - 2);
      ctx.quadraticCurveTo(x + 2, h.y + len * 0.5, x - 1, h.y + len);
      ctx.stroke();
    }
  }
}

// Grama e musgo do lado da água; brasas e fuligem no chão do lado do fogo
function grassAndEmbers(ctx, map, rand) {
  const top = Math.min(...map.solids.map((s) => s.y));
  const bounds = islandBounds(map);
  const mid = (bounds.left + bounds.right) / 2;
  const inPool = (x) => map.hazards.some((h) => (h.type === 'lava' || h.type === 'agua') && x > h.x - 8 && x < h.x + h.w + 8);
  for (let x = bounds.left + 6; x < bounds.right - 6; x += 7 + rand() * 9) {
    if (inPool(x)) continue;
    const u = (x - bounds.left) / (bounds.right - bounds.left);
    if (u > 0.6 && rand() < 0.75) {
      // tufos de grama (mais densos perto da direita)
      ctx.strokeStyle = rand() < 0.5 ? '#4f8a4a' : '#7fc06a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let b = 0; b < 3; b++) {
        const bx = x + b * 2 - 2;
        ctx.moveTo(bx, top + 1);
        ctx.quadraticCurveTo(bx + (b - 1) * 2, top - 4, bx + (b - 1) * 3, top - 6 - rand() * 4);
      }
      ctx.stroke();
    } else if (u < 0.4 && rand() < 0.35) {
      // brasinhas no chão
      ctx.fillStyle = rand() < 0.5 ? '#ff7a2a' : '#ffb347';
      ctx.shadowColor = '#ff6a1a';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x, top + 2, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  // pequenas flores azuis perto da fonte
  for (const fx of [mid + 260, mid + 300, mid + 395]) {
    if (inPool(fx)) continue;
    ctx.fillStyle = '#9fd8ff';
    ctx.beginPath();
    ctx.arc(fx, top - 5, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function veins(ctx, x0, y0, dir, color, rand) {
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    let x = x0;
    let y = y0 + i * 40 + rand() * 20;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      x += dir * (10 + rand() * 18);
      y += (rand() - 0.4) * 22;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

// Plataforma: laje de pedra com runas na frente, uma cunha de rocha por
// baixo e um cristal do lado (fogo, água ou meio) pendurado no centro.
function drawPlatform(ctx, p, map) {
  const h = 16;
  const side = p.x + p.w / 2 < map.width * 0.42 ? 'fogo' : p.x + p.w / 2 > map.width * 0.58 ? 'agua' : 'meio';
  const rune = { fogo: '#ff8a3a', agua: '#5ab8ff', meio: '#c77dff' }[side];
  const crystal = { fogo: ['#ff6a1f', '#ffd27a'], agua: ['#3a8fe0', '#bfe9ff'], meio: ['#9b4dff', '#e6c8ff'] }[side];
  const cx = p.x + p.w / 2;

  // cunha de rocha embaixo
  ctx.fillStyle = '#2f2236';
  ctx.beginPath();
  ctx.moveTo(p.x + 14, p.y + h);
  ctx.lineTo(p.x + p.w * 0.3, p.y + h + 14);
  ctx.lineTo(cx, p.y + h + 22);
  ctx.lineTo(p.x + p.w * 0.7, p.y + h + 14);
  ctx.lineTo(p.x + p.w - 14, p.y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = STONE.outline;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(p.x + p.w * 0.3, p.y + h + 2);
  ctx.lineTo(p.x + p.w * 0.36, p.y + h + 14);
  ctx.moveTo(p.x + p.w * 0.62, p.y + h + 2);
  ctx.lineTo(p.x + p.w * 0.58, p.y + h + 16);
  ctx.stroke();
  hangingCrystal(ctx, cx, p.y + h + 18, 7, 22, crystal[0], crystal[1]);

  // laje
  const g = ctx.createLinearGradient(0, p.y, 0, p.y + h);
  g.addColorStop(0, '#b9a2b6');
  g.addColorStop(0.3, '#7a6378');
  g.addColorStop(1, '#45324a');
  ctx.fillStyle = g;
  roundRect(ctx, p.x, p.y, p.w, h, 5);
  ctx.fill();
  ctx.strokeStyle = STONE.outline;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(p.x + 5, p.y + 1.5, p.w - 10, 2);
  // juntas
  ctx.fillStyle = 'rgba(20,10,24,0.5)';
  for (const u of [0.25, 0.5, 0.75]) ctx.fillRect(p.x + p.w * u, p.y + 4, 1.5, h - 5);
  // argolas das correntes
  for (const ax of [p.x + 16, p.x + p.w - 16]) {
    ctx.fillStyle = '#2a2030';
    ctx.fillRect(ax - 5, p.y - 4, 10, 6);
    ctx.strokeStyle = '#6c5a70';
    ctx.lineWidth = 1;
    ctx.strokeRect(ax - 5, p.y - 4, 10, 6);
  }
  // Runas
  ctx.shadowColor = rune;
  ctx.shadowBlur = 10;
  ctx.fillStyle = rune;
  for (let x = p.x + 28; x < p.x + p.w - 20; x += 40) {
    ctx.fillRect(x, p.y + 8, 10, 2.5);
    ctx.fillRect(x + 4, p.y + 5, 2.5, 8);
  }
  ctx.shadowBlur = 0;
}

function chain(ctx, x, y0, y1) {
  for (let y = y0, i = 0; y < y1; y += 11, i++) {
    if (i % 2) {
      // elo visto de lado
      ctx.fillStyle = '#4a3a4c';
      ctx.fillRect(x - 1.5, y, 3, 12);
    } else {
      ctx.strokeStyle = '#3b2d3a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(x, y + 6, 3.5, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x - 1, y + 6, 2.5, 5, 0, Math.PI * 0.9, Math.PI * 1.5);
      ctx.stroke();
    }
  }
}

function floatingRock(ctx, x, y, size, color, rand) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x - size * 0.6, y - size * 0.35);
  ctx.lineTo(x + size * 0.5, y - size * 0.4);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size * 0.3, y + size * (0.6 + rand() * 0.5));
  ctx.lineTo(x - size * 0.2, y + size * 0.9);
  ctx.closePath();
  ctx.fill();
}

// Luzes que mudam com o tempo na ilha: cristal do meio e brilho das veias
function drawIslandAnimated(ctx, time) {
  const a = 0.25 + (Math.sin(time * 1.8) + 1) * 0.12;
  const g = ctx.createRadialGradient(640, 850, 4, 640, 850, 120);
  g.addColorStop(0, `rgba(170,100,255,${a})`);
  g.addColorStop(1, 'rgba(170,100,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(520, 730, 240, 240);
}

// Brilho vindo do abismo: laranja embaixo da lava, azul embaixo da água
function drawAbyssGlow(ctx, time) {
  for (const [x, c] of [[420, '255,110,40'], [862, '80,170,255']]) {
    const a = 0.16 + Math.sin(time * 1.3 + x) * 0.04;
    const g = ctx.createRadialGradient(x, 1050, 10, x, 1050, 360);
    g.addColorStop(0, `rgba(${c},${a})`);
    g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - 360, 690, 720, 720);
  }
}

// ======================================================================
// Enfeites

function drawDecorStatic(ctx, d, rand) {
  switch (d.type) {
    case 'braseiro': {
      // pés de ferro, bacia e carvões
      ctx.strokeStyle = '#1e1620';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(d.x - 10, d.y);
      ctx.lineTo(d.x - 4, d.y - 24);
      ctx.moveTo(d.x + 10, d.y);
      ctx.lineTo(d.x + 4, d.y - 24);
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x, d.y - 24);
      ctx.stroke();
      const g = ctx.createLinearGradient(0, d.y - 36, 0, d.y - 22);
      g.addColorStop(0, '#6b5260');
      g.addColorStop(1, '#2b1f27');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(d.x - 17, d.y - 35);
      ctx.lineTo(d.x + 17, d.y - 35);
      ctx.quadraticCurveTo(d.x + 14, d.y - 22, d.x, d.y - 21);
      ctx.quadraticCurveTo(d.x - 14, d.y - 22, d.x - 17, d.y - 35);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = STONE.outline;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ff9a3c';
      ctx.fillRect(d.x - 15, d.y - 36, 30, 2);
      break;
    }
    case 'obsidiana':
      for (const [dx, h, lean] of [[-14, 22, -0.2], [0, 36, 0.05], [12, 18, 0.25]]) {
        ctx.save();
        ctx.translate(d.x + dx, d.y);
        ctx.rotate(lean);
        ctx.fillStyle = '#1a0f1c';
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(0, -h);
        ctx.lineTo(7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2e1c30';
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(0, -h);
        ctx.lineTo(-1, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,120,50,0.75)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(0, -h);
        ctx.lineTo(7, 0);
        ctx.stroke();
        ctx.restore();
      }
      break;
    case 'cristal':
      for (const [dx, h, lean] of [[-12, 26, -0.3], [2, 42, 0], [14, 22, 0.35]]) {
        ctx.save();
        ctx.translate(d.x + dx, d.y);
        ctx.rotate(lean);
        const g = ctx.createLinearGradient(-6, 0, 6, 0);
        g.addColorStop(0, '#2c6fd1');
        g.addColorStop(0.5, '#a8e4ff');
        g.addColorStop(1, '#1f4f9e');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(-6, -h * 0.7);
        ctx.lineTo(0, -h);
        ctx.lineTo(6, -h * 0.7);
        ctx.lineTo(6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#10264a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-3, -2);
        ctx.lineTo(-3, -h * 0.65);
        ctx.stroke();
        ctx.restore();
      }
      break;
    case 'fonte': {
      // bacia de pedra esculpida
      ctx.fillStyle = '#4a3a50';
      ctx.fillRect(d.x - 5, d.y - 20, 10, 20);
      ctx.fillStyle = '#5f4c66';
      ctx.fillRect(d.x - 9, d.y - 4, 18, 4);
      ctx.beginPath();
      ctx.moveTo(d.x - 16, d.y - 26);
      ctx.lineTo(d.x + 16, d.y - 26);
      ctx.quadraticCurveTo(d.x + 12, d.y - 16, d.x, d.y - 17);
      ctx.quadraticCurveTo(d.x - 12, d.y - 16, d.x - 16, d.y - 26);
      ctx.fill();
      ctx.strokeStyle = STONE.outline;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#7fd0ff';
      ctx.beginPath();
      ctx.ellipse(d.x, d.y - 26, 13, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'runa':
      ctx.strokeStyle = 'rgba(199,125,255,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y + 2, 70, 7, 0, Math.PI, 0);
      ctx.stroke();
      break;
    case 'tocha': {
      // suporte de ferro preso na parede
      ctx.fillStyle = '#2a2030';
      ctx.fillRect(d.x - 6, d.y + 6, 12, 5);
      ctx.fillRect(d.x - 2, d.y - 4, 4, 14);
      ctx.fillStyle = '#4a3a4c';
      ctx.beginPath();
      ctx.moveTo(d.x - 7, d.y - 8);
      ctx.lineTo(d.x + 7, d.y - 8);
      ctx.lineTo(d.x + 4, d.y - 2);
      ctx.lineTo(d.x - 4, d.y - 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = STONE.outline;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }
    default:
      break;
  }
}

function drawDecorAnimated(ctx, d, time) {
  switch (d.type) {
    case 'braseiro': {
      const glow = ctx.createRadialGradient(d.x, d.y - 44, 2, d.x, d.y - 44, 90);
      glow.addColorStop(0, 'rgba(255,170,70,0.45)');
      glow.addColorStop(1, 'rgba(255,100,30,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(d.x - 90, d.y - 134, 180, 180);
      flame(ctx, d.x, d.y - 35, 16, 32, time, ['#ff5a1a', '#ffb347', '#fff1b0']);
      break;
    }
    case 'tocha': {
      const flick = 0.85 + Math.sin(time * 11 + d.x) * 0.1;
      const glow = ctx.createRadialGradient(d.x, d.y - 16, 2, d.x, d.y - 16, 80 * flick);
      glow.addColorStop(0, d.cold ? 'rgba(120,200,255,0.4)' : 'rgba(255,170,70,0.4)');
      glow.addColorStop(1, d.cold ? 'rgba(80,160,255,0)' : 'rgba(255,100,30,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(d.x - 80, d.y - 96, 160, 160);
      flame(ctx, d.x, d.y - 8, 7, 18, time + d.x, d.cold ? ['#2f7fe0', '#7fd0ff', '#eafcff'] : ['#ff5a1a', '#ffb347', '#fff1b0']);
      break;
    }
    case 'cristal': {
      const a = 0.25 + Math.sin(time * 2.2) * 0.12;
      const glow = ctx.createRadialGradient(d.x, d.y - 20, 2, d.x, d.y - 20, 70);
      glow.addColorStop(0, `rgba(140,210,255,${a})`);
      glow.addColorStop(1, 'rgba(140,210,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(d.x - 70, d.y - 90, 140, 140);
      // brilho correndo pela ponta
      const k = (time * 0.5) % 1;
      if (k < 0.2) {
        ctx.fillStyle = `rgba(255,255,255,${1 - k * 5})`;
        ctx.beginPath();
        ctx.arc(d.x + 2, d.y - 42, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'fonte': {
      ctx.fillStyle = 'rgba(170,225,255,0.85)';
      for (let i = 0; i < 10; i++) {
        const k = (time * 1.3 + i / 10) % 1;
        const side = i % 2 ? 1 : -1;
        const x = d.x + side * k * 15;
        const y = d.y - 28 - Math.sin(k * Math.PI) * 24;
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'runa': {
      const a = 0.2 + (Math.sin(time * 1.5) + 1) * 0.15;
      ctx.strokeStyle = `rgba(199,125,255,${a})`;
      ctx.shadowColor = '#c77dff';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y + 2, 46, 4.5, 0, Math.PI, 0);
      ctx.stroke();
      ctx.shadowBlur = 0;
      break;
    }
    default:
      break;
  }
}

function flame(ctx, x, y, w, h, time, colors) {
  colors.forEach((c, i) => {
    const k = 1 - i * 0.3;
    const flick = Math.sin(time * 14 + i * 2) * 3 * k;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - w * k, y);
    ctx.quadraticCurveTo(x - w * k * 0.8, y - h * k * 0.6, x + flick, y - h * k - Math.abs(flick));
    ctx.quadraticCurveTo(x + w * k * 0.8, y - h * k * 0.6, x + w * k, y);
    ctx.closePath();
    ctx.fill();
  });
}

// Lava e água escorrendo pela parte de baixo da ilha
function drawCascade(ctx, d, time) {
  const lava = d.hazard === 'lava';
  const top = undersideAt(d.x) - 20;
  const bottom = 1300;
  const w = 16;
  const g = ctx.createLinearGradient(d.x - w, 0, d.x + w, 0);
  if (lava) {
    g.addColorStop(0, 'rgba(200,40,10,0.7)');
    g.addColorStop(0.5, '#ffb347');
    g.addColorStop(1, 'rgba(200,40,10,0.7)');
  } else {
    g.addColorStop(0, 'rgba(40,120,230,0.55)');
    g.addColorStop(0.5, 'rgba(210,240,255,0.9)');
    g.addColorStop(1, 'rgba(40,120,230,0.55)');
  }
  ctx.save();
  if (lava) {
    ctx.shadowColor = '#ff6a00';
    ctx.shadowBlur = 24;
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(d.x - w * 0.6, top);
  ctx.lineTo(d.x + w * 0.6, top);
  ctx.lineTo(d.x + w, bottom);
  ctx.lineTo(d.x - w, bottom);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = lava ? 'rgba(255,240,180,0.8)' : 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 7; i++) {
    const y = top + ((time * (lava ? 160 : 300) + i * 83) % (bottom - top));
    ctx.fillRect(d.x - w * 0.5 + ((i * 7) % (w)), y, 2, 34);
  }
  ctx.restore();
}

// ======================================================================
// Perigos

function drawLava(ctx, h, time, front) {
  ctx.save();
  if (!front) {
    // calor iluminando em volta
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(h.x + h.w / 2, h.y, 10, h.x + h.w / 2, h.y, h.w);
    glow.addColorStop(0, `rgba(255,110,30,${0.22 + Math.sin(time * 2) * 0.04})`);
    glow.addColorStop(1, 'rgba(255,110,30,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(h.x - h.w * 0.5, h.y - h.w, h.w * 2, h.w * 1.6);
    ctx.globalCompositeOperation = 'source-over';
  }
  const g = ctx.createLinearGradient(0, h.y, 0, h.y + h.h);
  g.addColorStop(0, '#ffe066');
  g.addColorStop(0.25, '#ff8a1f');
  g.addColorStop(1, '#a3150b');
  ctx.globalAlpha = front ? 0.55 : 1;
  ctx.fillStyle = g;
  wavyRect(ctx, h, time * 2.2, 2.5, 0.07);
  ctx.fill();
  if (!front) {
    ctx.save();
    wavyRect(ctx, h, time * 2.2, 2.5, 0.07);
    ctx.clip();
    // Placas de crosta escura boiando devagar
    ctx.fillStyle = 'rgba(90,20,10,0.55)';
    for (let i = 0; i < 4; i++) {
      const x = h.x + ((time * 9 + i * 41) % (h.w + 40)) - 20;
      ctx.beginPath();
      ctx.ellipse(x, h.y + 9 + (i % 2) * 6, 13, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.shadowColor = '#ff6a00';
    ctx.shadowBlur = 25;
    ctx.strokeStyle = '#fff2a8';
    ctx.lineWidth = 2;
    wavyLine(ctx, h, time * 2.2, 2.5, 0.07);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Bolhas estourando
    for (let i = 0; i < 5; i++) {
      const phase = (time * 0.8 + i * 0.37) % 1;
      const bx = h.x + 12 + ((i * 53.7) % (h.w - 24));
      ctx.globalAlpha = 1 - phase;
      ctx.strokeStyle = '#ffe28a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, h.y + 6 - phase * 8, 2 + phase * 4, Math.PI, 0);
      ctx.stroke();
    }
    // Ar tremendo de calor em cima
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#ffd2a0';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const k = (time * 0.6 + i / 3) % 1;
      const x = h.x + 30 + i * 40;
      ctx.globalAlpha = 0.2 * (1 - k);
      ctx.beginPath();
      for (let y = 0; y < 24; y += 4) {
        const yy = h.y - 6 - k * 40 - y;
        const xx = x + Math.sin(yy * 0.3 + time * 6) * 3;
        if (y === 0) ctx.moveTo(xx, yy);
        else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawWater(ctx, h, time, front) {
  ctx.save();
  if (!front) {
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(h.x + h.w / 2, h.y, 10, h.x + h.w / 2, h.y, h.w * 0.9);
    glow.addColorStop(0, 'rgba(80,170,255,0.16)');
    glow.addColorStop(1, 'rgba(80,170,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(h.x - h.w * 0.5, h.y - h.w, h.w * 2, h.w * 1.6);
    ctx.globalCompositeOperation = 'source-over';
  }
  const g = ctx.createLinearGradient(0, h.y, 0, h.y + h.h);
  g.addColorStop(0, 'rgba(140,220,255,0.95)');
  g.addColorStop(0.4, 'rgba(40,130,240,0.9)');
  g.addColorStop(1, 'rgba(10,50,150,0.95)');
  ctx.globalAlpha = front ? 0.5 : 1;
  ctx.fillStyle = g;
  wavyRect(ctx, h, time * 2.8, 2, 0.09);
  ctx.fill();
  if (!front) {
    ctx.save();
    wavyRect(ctx, h, time * 2.8, 2, 0.09);
    ctx.clip();
    // Reflexos (cáusticas)
    ctx.strokeStyle = 'rgba(230,250,255,0.35)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) {
      const x = h.x + ((time * 22 + i * 29) % (h.w + 30)) - 15;
      ctx.beginPath();
      ctx.moveTo(x, h.y + 8 + (i % 3) * 4);
      ctx.quadraticCurveTo(x + 7, h.y + 5 + (i % 3) * 4, x + 14, h.y + 8 + (i % 3) * 4);
      ctx.stroke();
    }
    ctx.restore();
    ctx.shadowColor = '#7fd0ff';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = 'rgba(235,252,255,0.95)';
    ctx.lineWidth = 2;
    wavyLine(ctx, h, time * 2.8, 2, 0.09);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // brilho da lua na água
    const k = (Math.sin(time * 1.4) + 1) / 2;
    ctx.fillStyle = `rgba(255,245,230,${0.35 + k * 0.3})`;
    ctx.fillRect(h.x + h.w * 0.62, h.y + 3, 18, 1.5);
    ctx.fillRect(h.x + h.w * 0.66, h.y + 6, 10, 1.5);
  }
  ctx.restore();
}

// Espinhos de pedra com pontas avermelhadas
function drawSpikes(ctx, h, time) {
  ctx.save();
  const base = h.y + h.h;
  const n = Math.max(3, Math.round(h.w / 11));
  const sw = h.w / n;
  for (let i = 0; i < n; i++) {
    const x = h.x + i * sw;
    const tall = h.h + 14 + ((i * 7) % 3) * 4;
    const g = ctx.createLinearGradient(0, base - tall, 0, base);
    g.addColorStop(0, '#ff8a7a');
    g.addColorStop(0.25, '#c9b8c4');
    g.addColorStop(1, '#4a3a50');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#140a14';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 1, base);
    ctx.lineTo(x + sw / 2, base - tall);
    ctx.lineTo(x + sw - 1, base);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // brilho de alerta pulsando
  ctx.globalAlpha = 0.25 + Math.sin(time * 4) * 0.12;
  ctx.fillStyle = '#ff4d4d';
  ctx.fillRect(h.x, base - 2, h.w, 2);
  ctx.restore();
}

function wavyRect(ctx, h, t, amp, freq) {
  ctx.beginPath();
  ctx.moveTo(h.x, h.y + h.h);
  for (let x = 0; x <= h.w; x += 4) {
    ctx.lineTo(h.x + x, h.y + Math.sin(x * freq + t) * amp);
  }
  ctx.lineTo(h.x + h.w, h.y + h.h);
  ctx.closePath();
}

function wavyLine(ctx, h, t, amp, freq) {
  ctx.beginPath();
  for (let x = 0; x <= h.w; x += 4) {
    const y = h.y + Math.sin(x * freq + t) * amp;
    if (x === 0) ctx.moveTo(h.x, y);
    else ctx.lineTo(h.x + x, y);
  }
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Clareia (k > 0) ou escurece (k < 0) uma cor #rrggbb
function shadeHex(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k);
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `rgb(${r},${g},${b})`;
}

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
