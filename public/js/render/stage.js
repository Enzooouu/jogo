// Desenho do cenário em camadas:
//   céu (fixo na tela) -> fundo distante -> fundo médio -> ilha (mundo)
// As camadas de fundo andam menos que o mundo quando a câmera se move
// (paralaxe), o que dá sensação de profundidade. O que não se mexe é
// desenhado uma vez em telas fora da vista (cache) e só copiado a cada quadro.

const VIEW_W = 1280;
const VIEW_H = 720;

// Área coberta por cada camada (em coordenadas da própria camada) e quanto
// ela acompanha a câmera.
const FAR = { f: 0.2, x: -760, y: -520, w: 2800, h: 1900, res: 0.5 };
const MID = { f: 0.5, x: -560, y: -360, w: 2400, h: 1700, res: 0.75 };

export class StageRenderer {
  constructor(map, scale = 1) {
    this.map = map;
    this.scale = 0;
    this.terrainRect = { x: 60, y: -420, w: 1160, h: 1340 };
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
    sky.addColorStop(0.7, t.skyBottom);
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
    const rand = seeded(3);
    for (let i = 0; i < 140; i++) {
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

    for (const [layer, cache, animate] of [[FAR, this.far, drawFarAnimated], [MID, this.mid, null]]) {
      const l = camera.layer(layer.f);
      const z = s * l.zoom;
      ctx.setTransform(z, 0, 0, z, (l.ox + shake.x * layer.f) * s, (l.oy + shake.y * layer.f) * s);
      ctx.drawImage(cache, layer.x, layer.y, layer.w, layer.h);
      animate?.(ctx, time);
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
    const r = this.terrainRect;
    ctx.drawImage(this.terrain, r.x, r.y, r.w, r.h);
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
}

// ======================================================================
// Fundo distante: vulcão em erupção à esquerda, penhasco com cachoeira à
// direita, ilhas flutuando bem longe.

function drawFar(ctx, map, rand) {
  // Lua
  const moon = ctx.createRadialGradient(980, 40, 8, 980, 40, 220);
  moon.addColorStop(0, 'rgba(255,226,200,0.95)');
  moon.addColorStop(0.18, 'rgba(255,190,150,0.5)');
  moon.addColorStop(1, 'rgba(255,120,90,0)');
  ctx.fillStyle = moon;
  ctx.fillRect(760, -180, 440, 440);
  ctx.fillStyle = '#ffe9d6';
  ctx.beginPath();
  ctx.arc(980, 40, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(200,150,140,0.35)';
  for (const [dx, dy, r] of [[-10, -8, 7], [12, 10, 5], [6, -16, 4]]) {
    ctx.beginPath();
    ctx.arc(980 + dx, 40 + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ilhas distantes
  for (let i = 0; i < 7; i++) {
    const x = -500 + rand() * 2300;
    const y = -200 + rand() * 380;
    floatingRock(ctx, x, y, 30 + rand() * 60, '#2a1430', rand);
  }

  // Vulcão (esquerda)
  ctx.fillStyle = '#26101f';
  ctx.beginPath();
  ctx.moveTo(-760, 1380);
  ctx.lineTo(-420, 600);
  ctx.quadraticCurveTo(-140, 220, 40, 170);
  ctx.lineTo(170, 170);
  ctx.quadraticCurveTo(330, 230, 560, 640);
  ctx.lineTo(820, 1380);
  ctx.closePath();
  ctx.fill();
  // Rios de lava descendo
  ctx.lineCap = 'round';
  for (const [x0, x1, y1] of [[80, -40, 430], [112, 150, 520], [140, 300, 400]]) {
    ctx.beginPath();
    ctx.moveTo(x0, 178);
    ctx.bezierCurveTo(x0 + (x1 - x0) * 0.2, 260, x0 + (x1 - x0) * 0.9, y1 - 160, x1, y1);
    ctx.strokeStyle = 'rgba(255,90,20,0.18)';
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,170,70,0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Penhasco (direita) de onde cai a cachoeira
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
  ctx.fillStyle = 'rgba(120,180,255,0.08)';
  for (let i = 0; i < 40; i++) ctx.fillRect(1180 + rand() * 800, 150 + rand() * 900, 30 + rand() * 60, 3);
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

  // Cachoeira
  const x = 1190;
  const top = 160;
  const bottom = 980;
  const g = ctx.createLinearGradient(x - 40, 0, x + 40, 0);
  g.addColorStop(0, 'rgba(90,170,255,0.35)');
  g.addColorStop(0.5, 'rgba(200,235,255,0.75)');
  g.addColorStop(1, 'rgba(90,170,255,0.35)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 36, top, 72, bottom - top);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 14; i++) {
    const lx = x - 30 + ((i * 37) % 60);
    const ly = top + ((time * 260 + i * 97) % (bottom - top));
    ctx.fillRect(lx, ly, 3, 50);
  }
  // Névoa na base
  const mist = ctx.createRadialGradient(x, 900, 10, x, 900, 260);
  mist.addColorStop(0, 'rgba(200,230,255,0.35)');
  mist.addColorStop(1, 'rgba(200,230,255,0)');
  ctx.fillStyle = mist;
  ctx.fillRect(x - 260, 640, 520, 520);
}

// ======================================================================
// Fundo médio: serras e ruínas de um templo dos elementos.

function drawMid(ctx, map, rand) {
  ctx.fillStyle = '#1d0b1c';
  ctx.beginPath();
  ctx.moveTo(-560, 1340);
  let x = -560;
  ctx.lineTo(x, 640);
  while (x < 1840) {
    x += 60 + rand() * 90;
    ctx.lineTo(x, 520 + rand() * 170);
  }
  ctx.lineTo(1840, 1340);
  ctx.closePath();
  ctx.fill();

  // Colunas em ruínas: runas laranja do lado do fogo, azuis do lado da água
  const columns = [[-120, 300, '#ff7a2a'], [90, 360, '#ff7a2a'], [1180, 340, '#4fb0ff'], [1390, 290, '#4fb0ff']];
  for (const [cx, h, rune] of columns) {
    const base = 640;
    ctx.fillStyle = '#2b1530';
    ctx.fillRect(cx - 26, base - h, 52, h + 40);
    ctx.fillStyle = '#3a1f3f';
    ctx.fillRect(cx - 34, base - h - 14, 68, 16);
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
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let i = 0; i < 3; i++) ctx.fillRect(cx - 26 + 12 + i * 12, base - h, 3, h + 40);
    ctx.shadowColor = rune;
    ctx.shadowBlur = 14;
    ctx.fillStyle = rune;
    for (let i = 0; i < 3; i++) {
      const ry = base - h + 50 + i * 60;
      ctx.fillRect(cx - 6, ry, 12, 3);
      ctx.fillRect(cx - 1.5, ry - 8, 3, 18);
    }
    ctx.shadowBlur = 0;
  }
  // Arco quebrado no meio
  ctx.strokeStyle = '#2b1530';
  ctx.lineWidth = 30;
  ctx.beginPath();
  ctx.arc(640, 560, 210, Math.PI * 1.08, Math.PI * 1.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(640, 560, 210, Math.PI * 1.7, Math.PI * 1.92);
  ctx.stroke();
}

// ======================================================================
// Ilha principal (mundo)

function drawTerrain(ctx, map, rand) {
  const bounds = islandBounds(map);

  // Correntes segurando as plataformas
  for (const p of map.platforms) {
    for (const cx of [p.x + 16, p.x + p.w - 16]) chain(ctx, cx, -420, p.y + 2);
  }

  // Parte de baixo da ilha: pedras penduradas
  ctx.fillStyle = '#2a1d2e';
  ctx.beginPath();
  ctx.moveTo(bounds.left + 70, 700);
  let x = bounds.left + 70;
  const baseRight = bounds.right - 70;
  while (x < baseRight) {
    const w = 26 + rand() * 40;
    const depth = 40 + rand() * 120 * Math.sin(((x - bounds.left) / (bounds.right - bounds.left)) * Math.PI);
    ctx.lineTo(x + w * 0.5, 780 + depth);
    ctx.lineTo(x + w, 770 + rand() * 20);
    x += w;
  }
  ctx.lineTo(baseRight, 700);
  ctx.closePath();
  ctx.fill();
  // Pedrinhas soltas flutuando embaixo
  for (let i = 0; i < 6; i++) floatingRock(ctx, bounds.left + 60 + rand() * (bounds.right - bounds.left - 120), 900 + rand() * 60, 10 + rand() * 18, '#2a1d2e', rand);

  // Blocos de pedra
  for (const s of map.solids) drawRock(ctx, s, rand);

  // Tom quente à esquerda e frio à direita
  const tint = ctx.createLinearGradient(bounds.left, 0, bounds.right, 0);
  tint.addColorStop(0, 'rgba(255,90,30,0.2)');
  tint.addColorStop(0.45, 'rgba(255,90,30,0)');
  tint.addColorStop(0.55, 'rgba(60,140,255,0)');
  tint.addColorStop(1, 'rgba(60,140,255,0.2)');
  ctx.save();
  ctx.beginPath();
  for (const s of map.solids) ctx.rect(s.x, s.y, s.w, s.h);
  ctx.clip();
  ctx.fillStyle = tint;
  ctx.fillRect(bounds.left, 540, bounds.right - bounds.left, 300);
  // Veias de lava (esquerda) e de cristal (direita) nas laterais
  veins(ctx, bounds.left + 10, 600, 1, 'rgba(255,120,40,0.85)', rand);
  veins(ctx, bounds.right - 10, 600, -1, 'rgba(110,200,255,0.85)', rand);
  ctx.restore();

  // Ranhuras nas paredes externas (onde dá para se pendurar)
  for (const [wx, dir] of [[bounds.left, 1], [bounds.right, -1]]) {
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    for (let y = 560; y < 690; y += 22) {
      ctx.beginPath();
      ctx.moveTo(wx + dir * 2, y);
      ctx.lineTo(wx + dir * 10, y + 4);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(dir > 0 ? wx : wx - 3, 544, 3, 152);
  }

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

function drawRock(ctx, s, rand) {
  const g = ctx.createLinearGradient(0, s.y, 0, s.y + s.h);
  g.addColorStop(0, '#5d4a60');
  g.addColorStop(0.18, '#433347');
  g.addColorStop(1, '#241a29');
  ctx.fillStyle = g;
  ctx.fillRect(s.x, s.y, s.w, s.h);

  // Pedras encaixadas (facetas)
  ctx.save();
  ctx.beginPath();
  ctx.rect(s.x, s.y, s.w, s.h);
  ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 1.5;
  for (let row = s.y + 14; row < s.y + s.h; row += 24 + rand() * 10) {
    let x = s.x - rand() * 30;
    while (x < s.x + s.w) {
      const w = 34 + rand() * 40;
      ctx.beginPath();
      ctx.moveTo(x, row + rand() * 4);
      ctx.lineTo(x + w * 0.5, row - 2 + rand() * 4);
      ctx.lineTo(x + w, row + rand() * 4);
      ctx.lineTo(x + w + rand() * 4, row + 22);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${0.02 + rand() * 0.04})`;
      ctx.fillRect(x + 3, row + 3, w - 6, 8);
      x += w;
    }
  }
  ctx.restore();

  // Topo: crosta clara com borda
  if (s.y <= 572) {
    ctx.fillStyle = '#8c7689';
    ctx.fillRect(s.x, s.y, s.w, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(s.x, s.y, s.w, 1.5);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(s.x, s.y + 5, s.w, 3);
    // Pedrinhas soltas no chão
    for (let i = 0; i < s.w / 40; i++) {
      ctx.fillStyle = '#6e5a6c';
      ctx.beginPath();
      ctx.ellipse(s.x + 6 + rand() * (s.w - 12), s.y + 1, 2 + rand() * 3, 1.5, 0, Math.PI, 0);
      ctx.fill();
    }
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

function drawPlatform(ctx, p, map) {
  const h = 16;
  const side = p.x + p.w / 2 < map.width * 0.42 ? 'fogo' : p.x + p.w / 2 > map.width * 0.58 ? 'agua' : 'meio';
  const rune = { fogo: '#ff8a3a', agua: '#5ab8ff', meio: '#c77dff' }[side];
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(p.x + 8, p.y + h, p.w - 16, 7);
  const g = ctx.createLinearGradient(0, p.y, 0, p.y + h);
  g.addColorStop(0, '#ab92a2');
  g.addColorStop(0.35, '#6d5767');
  g.addColorStop(1, '#3e2c3c');
  ctx.fillStyle = g;
  roundRect(ctx, p.x, p.y, p.w, h, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,10,20,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(p.x + 5, p.y + 1.5, p.w - 10, 2);
  // Ponta de pedra pendurada embaixo do centro
  ctx.fillStyle = '#3e2c3c';
  ctx.beginPath();
  ctx.moveTo(p.x + p.w * 0.3, p.y + h);
  ctx.lineTo(p.x + p.w * 0.5, p.y + h + 18);
  ctx.lineTo(p.x + p.w * 0.7, p.y + h);
  ctx.closePath();
  ctx.fill();
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
  ctx.strokeStyle = '#3b2d3a';
  ctx.lineWidth = 2.5;
  for (let y = y0; y < y1; y += 12) {
    ctx.beginPath();
    ctx.ellipse(x, y + 6, 3, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
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

// ======================================================================
// Enfeites

function drawDecorStatic(ctx, d, rand) {
  switch (d.type) {
    case 'braseiro': {
      ctx.fillStyle = '#2b1f27';
      ctx.fillRect(d.x - 3, d.y - 26, 6, 26);
      ctx.fillRect(d.x - 10, d.y - 3, 20, 3);
      ctx.fillStyle = '#4a3540';
      ctx.beginPath();
      ctx.moveTo(d.x - 16, d.y - 34);
      ctx.lineTo(d.x + 16, d.y - 34);
      ctx.lineTo(d.x + 9, d.y - 24);
      ctx.lineTo(d.x - 9, d.y - 24);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff9a3c';
      ctx.fillRect(d.x - 14, d.y - 35, 28, 2);
      break;
    }
    case 'obsidiana':
      for (const [dx, h, lean] of [[-14, 22, -0.2], [0, 34, 0.05], [12, 18, 0.25]]) {
        ctx.save();
        ctx.translate(d.x + dx, d.y);
        ctx.rotate(lean);
        ctx.fillStyle = '#120a14';
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(0, -h);
        ctx.lineTo(6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,120,50,0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
      break;
    case 'cristal':
      for (const [dx, h, lean] of [[-12, 26, -0.3], [2, 40, 0], [14, 22, 0.35]]) {
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
        ctx.restore();
      }
      break;
    case 'fonte':
      ctx.fillStyle = '#4a3a50';
      ctx.fillRect(d.x - 4, d.y - 22, 8, 22);
      ctx.fillStyle = '#5f4c66';
      ctx.beginPath();
      ctx.ellipse(d.x, d.y - 22, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7fd0ff';
      ctx.beginPath();
      ctx.ellipse(d.x, d.y - 23, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'runa':
      ctx.strokeStyle = 'rgba(199,125,255,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y + 2, 70, 7, 0, Math.PI, 0);
      ctx.stroke();
      break;
    default:
      break;
  }
}

function drawDecorAnimated(ctx, d, time) {
  switch (d.type) {
    case 'braseiro': {
      const glow = ctx.createRadialGradient(d.x, d.y - 44, 2, d.x, d.y - 44, 70);
      glow.addColorStop(0, 'rgba(255,170,70,0.45)');
      glow.addColorStop(1, 'rgba(255,100,30,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(d.x - 70, d.y - 114, 140, 140);
      flame(ctx, d.x, d.y - 34, 16, 30, time, ['#ff5a1a', '#ffb347', '#fff1b0']);
      break;
    }
    case 'cristal': {
      const a = 0.25 + Math.sin(time * 2.2) * 0.12;
      const glow = ctx.createRadialGradient(d.x, d.y - 20, 2, d.x, d.y - 20, 60);
      glow.addColorStop(0, `rgba(140,210,255,${a})`);
      glow.addColorStop(1, 'rgba(140,210,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(d.x - 60, d.y - 80, 120, 120);
      break;
    }
    case 'fonte': {
      ctx.fillStyle = 'rgba(170,225,255,0.85)';
      for (let i = 0; i < 8; i++) {
        const k = (time * 1.3 + i / 8) % 1;
        const side = i % 2 ? 1 : -1;
        const x = d.x + side * k * 14;
        const y = d.y - 26 - Math.sin(k * Math.PI) * 22;
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
  const top = d.y - 10;
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
  }
  ctx.restore();
}

function drawWater(ctx, h, time, front) {
  ctx.save();
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
    const tall = h.h + 8 + ((i * 7) % 3) * 3;
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

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
