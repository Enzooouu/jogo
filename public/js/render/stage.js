// Desenho do cenário: céu, montanhas, blocos de pedra, plataformas e perigos.
// A parte que não se mexe é desenhada uma vez numa tela fora da vista
// (cache) e só copiada a cada quadro.

export class StageRenderer {
  constructor(map, scale = 1) {
    this.map = map;
    this.scale = scale;
    this.cache = this.buildStatic();
  }

  setScale(scale) {
    if (scale === this.scale) return;
    this.scale = scale;
    this.cache = this.buildStatic();
  }

  buildStatic() {
    const { map, scale } = this;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(map.width * scale);
    canvas.height = Math.round(map.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    const rand = seeded(7);
    const t = map.theme;

    // Céu
    const sky = ctx.createLinearGradient(0, 0, 0, map.height);
    sky.addColorStop(0, t.skyTop);
    sky.addColorStop(0.75, t.skyBottom);
    sky.addColorStop(1, '#5a1f22');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, map.width, map.height);

    // Estrelas
    for (let i = 0; i < 90; i++) {
      ctx.globalAlpha = 0.2 + rand() * 0.6;
      ctx.fillStyle = '#fff';
      const r = rand() * 1.4 + 0.3;
      ctx.beginPath();
      ctx.arc(rand() * map.width, rand() * map.height * 0.55, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Lua
    const moon = ctx.createRadialGradient(1050, 120, 10, 1050, 120, 120);
    moon.addColorStop(0, 'rgba(255,220,190,0.95)');
    moon.addColorStop(0.35, 'rgba(255,170,130,0.35)');
    moon.addColorStop(1, 'rgba(255,120,80,0)');
    ctx.fillStyle = moon;
    ctx.fillRect(900, 0, 300, 260);

    // Brilho no horizonte
    const haze = ctx.createRadialGradient(map.width / 2, map.height, 50, map.width / 2, map.height, 700);
    haze.addColorStop(0, hexA(t.haze, 0.45));
    haze.addColorStop(1, hexA(t.haze, 0));
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, map.width, map.height);

    // Montanhas em camadas
    drawRidge(ctx, map, rand, 430, 140, '#2a1029', 9);
    drawRidge(ctx, map, rand, 500, 110, '#1f0c1f', 13);
    drawVolcano(ctx, 170, 470, 230, '#170915');
    drawVolcano(ctx, 1130, 480, 200, '#170915');

    // Blocos sólidos
    for (const s of map.solids) drawRock(ctx, s, rand);
    // Bordas brilhantes das piscinas (a lava ilumina a pedra)
    for (const h of map.hazards) {
      const glow = ctx.createRadialGradient(h.x + h.w / 2, h.y, 10, h.x + h.w / 2, h.y, h.w);
      glow.addColorStop(0, h.type === 'lava' ? 'rgba(255,120,30,0.35)' : 'rgba(80,180,255,0.25)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(h.x - h.w / 2, h.y - h.w, h.w * 2, h.w * 2);
    }
    // Plataformas finas
    for (const p of map.platforms) drawPlatform(ctx, p, rand);
    return canvas;
  }

  drawStatic(ctx) {
    ctx.drawImage(this.cache, 0, 0, this.map.width, this.map.height);
  }

  // Perigos animados. `front` desenha uma camada translúcida por cima dos
  // personagens para parecer que estão "dentro" da lava/água.
  drawHazards(ctx, time, front = false) {
    for (const h of this.map.hazards) {
      if (h.type === 'lava') drawLava(ctx, h, time, front);
      else if (h.type === 'agua') drawWater(ctx, h, time, front);
    }
  }
}

function drawRidge(ctx, map, rand, baseY, amp, color, steps) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, map.height);
  ctx.lineTo(0, baseY);
  const step = map.width / steps;
  for (let i = 0; i <= steps; i++) {
    const x = i * step;
    const y = baseY - rand() * amp;
    ctx.lineTo(x - step / 2, y);
    ctx.lineTo(x, baseY - rand() * amp * 0.4);
  }
  ctx.lineTo(map.width, map.height);
  ctx.closePath();
  ctx.fill();
}

function drawVolcano(ctx, cx, baseY, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - size, baseY + 250);
  ctx.lineTo(cx - size * 0.18, baseY - size * 0.7);
  ctx.lineTo(cx + size * 0.18, baseY - size * 0.7);
  ctx.lineTo(cx + size, baseY + 250);
  ctx.closePath();
  ctx.fill();
  const glow = ctx.createRadialGradient(cx, baseY - size * 0.7, 2, cx, baseY - size * 0.7, 60);
  glow.addColorStop(0, 'rgba(255,140,50,0.8)');
  glow.addColorStop(1, 'rgba(255,80,20,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 70, baseY - size * 0.7 - 70, 140, 140);
}

function drawRock(ctx, s, rand) {
  const g = ctx.createLinearGradient(0, s.y, 0, s.y + s.h);
  g.addColorStop(0, '#5b4a5e');
  g.addColorStop(0.25, '#3b2e40');
  g.addColorStop(1, '#1e1622');
  ctx.fillStyle = g;
  ctx.fillRect(s.x, s.y, s.w, s.h);

  // Pedrinhas e rachaduras
  ctx.save();
  ctx.beginPath();
  ctx.rect(s.x, s.y, s.w, s.h);
  ctx.clip();
  for (let i = 0; i < (s.w * s.h) / 500; i++) {
    ctx.fillStyle = `rgba(${rand() < 0.5 ? '255,255,255' : '0,0,0'},${0.04 + rand() * 0.06})`;
    const w = 6 + rand() * 18;
    ctx.fillRect(s.x + rand() * s.w, s.y + 8 + rand() * s.h, w, w * 0.5);
  }
  ctx.restore();

  // Topo iluminado
  ctx.fillStyle = '#8f7a8c';
  ctx.fillRect(s.x, s.y, s.w, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(s.x, s.y, s.w, 1.5);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(s.x, s.y + 4, s.w, 3);
}

function drawPlatform(ctx, p, rand) {
  const h = 14;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(p.x + 6, p.y + h, p.w - 12, 6);
  const g = ctx.createLinearGradient(0, p.y, 0, p.y + h);
  g.addColorStop(0, '#a58a7a');
  g.addColorStop(1, '#4e3a3d');
  ctx.fillStyle = g;
  roundRect(ctx, p.x, p.y, p.w, h, 5);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(p.x + 4, p.y + 1, p.w - 8, 2);
  // Runas
  ctx.fillStyle = 'rgba(255,150,80,0.35)';
  for (let x = p.x + 18; x < p.x + p.w - 10; x += 34 + rand() * 10) {
    ctx.fillRect(x, p.y + 6, 8, 3);
  }
}

function drawLava(ctx, h, time, front) {
  ctx.save();
  const top = h.y;
  const g = ctx.createLinearGradient(0, top, 0, h.y + h.h);
  g.addColorStop(0, '#ffd34d');
  g.addColorStop(0.3, '#ff7a1a');
  g.addColorStop(1, '#a3150b');
  ctx.globalAlpha = front ? 0.55 : 1;
  ctx.fillStyle = g;
  wavyRect(ctx, h, time * 2.2, 2.5, 0.07);
  ctx.fill();
  if (!front) {
    ctx.shadowColor = '#ff6a00';
    ctx.shadowBlur = 25;
    ctx.strokeStyle = '#fff2a8';
    ctx.lineWidth = 2;
    wavyLine(ctx, h, time * 2.2, 2.5, 0.07);
    ctx.stroke();
    // Bolhas
    ctx.shadowBlur = 0;
    for (let i = 0; i < 5; i++) {
      const phase = (time * 0.8 + i * 0.37) % 1;
      const bx = h.x + 12 + ((i * 53.7) % (h.w - 24));
      ctx.globalAlpha = 1 - phase;
      ctx.fillStyle = '#ffe28a';
      ctx.beginPath();
      ctx.arc(bx, top + 10 - phase * 10, 2 + phase * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawWater(ctx, h, time, front) {
  ctx.save();
  const g = ctx.createLinearGradient(0, h.y, 0, h.y + h.h);
  g.addColorStop(0, 'rgba(120,210,255,0.95)');
  g.addColorStop(0.4, 'rgba(40,130,240,0.9)');
  g.addColorStop(1, 'rgba(10,50,150,0.95)');
  ctx.globalAlpha = front ? 0.5 : 1;
  ctx.fillStyle = g;
  wavyRect(ctx, h, time * 2.8, 2, 0.09);
  ctx.fill();
  if (!front) {
    ctx.strokeStyle = 'rgba(225,250,255,0.9)';
    ctx.lineWidth = 2;
    wavyLine(ctx, h, time * 2.8, 2, 0.09);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 4; i++) {
      const x = h.x + ((time * 30 + i * 41) % h.w);
      ctx.fillRect(x, h.y + 8 + (i % 2) * 6, 10, 1.5);
    }
  }
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

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
