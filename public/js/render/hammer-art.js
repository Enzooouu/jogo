// Desenho do Marretão (apontando para -y a partir da mão, como as outras
// armas): cabo comprido com faixas de couro e uma cabeça enorme. Cada
// elemento tem a sua cabeça; o Mortal (e a arma caída) usa a universal, de
// ferro com detalhes dourados e a joia que muda de cor.

import { prismColor } from './universal-art.js';

const INK = '#1a1020';

const HEADS = {
  fogo: { body: ['#3a2a2a', '#1e1414'], trim: '#ff8a3a', glow: '#ffb347' },
  agua: { body: ['#3f7fc0', '#1e4a7a'], trim: '#bfe9ff', glow: '#9fe3ff' },
  terra: { body: ['#8a6a48', '#4f3a27'], trim: '#5f9a3e', glow: '#ffb347' },
  ar: { body: ['#e8f6f2', '#9cc8bf'], trim: '#ffffff', glow: '#7fffe0' },
  mortal: { body: ['#7a8090', '#3c414c'], trim: '#e8c76a', glow: null },
};

export function drawHammerArt(ctx, element, t) {
  const h = HEADS[element] ?? HEADS.mortal;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // cabo de madeira
  ctx.strokeStyle = INK;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.lineTo(0, -52);
  ctx.stroke();
  ctx.strokeStyle = '#8a5a32';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,220,170,0.35)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-1.2, 12);
  ctx.lineTo(-1.2, -50);
  ctx.stroke();
  // faixas de couro no cabo
  ctx.strokeStyle = '#3a2216';
  ctx.lineWidth = 2;
  for (let y = 8; y > -12; y -= 4.5) {
    ctx.beginPath();
    ctx.moveTo(-3, y);
    ctx.lineTo(3, y - 2.5);
    ctx.stroke();
  }
  // pomo
  ctx.fillStyle = h.trim;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 16, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // cabeça: bloco grande com as bordas chanfradas
  const hw = 22;
  const top = -78;
  const bottom = -50;
  const head = () => {
    ctx.beginPath();
    ctx.moveTo(-hw + 4, top);
    ctx.lineTo(hw - 4, top);
    ctx.lineTo(hw, top + 4);
    ctx.lineTo(hw, bottom - 4);
    ctx.lineTo(hw - 4, bottom);
    ctx.lineTo(-hw + 4, bottom);
    ctx.lineTo(-hw, bottom - 4);
    ctx.lineTo(-hw, top + 4);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(-hw, 0, hw, 0);
  g.addColorStop(0, h.body[0]);
  g.addColorStop(0.55, h.body[0]);
  g.addColorStop(1, h.body[1]);
  head();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  head();
  ctx.clip();
  if (element === 'fogo') {
    // rachaduras de lava pulsando
    const pulse = 0.6 + 0.4 * Math.sin(t * 6);
    ctx.strokeStyle = `rgba(255,150,50,${pulse})`;
    ctx.shadowColor = '#ff6a1f';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-16, top + 6); ctx.lineTo(-8, top + 14); ctx.lineTo(-12, bottom - 4);
    ctx.moveTo(6, top + 4); ctx.lineTo(2, top + 13); ctx.lineTo(10, top + 19); ctx.lineTo(8, bottom - 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else if (element === 'agua') {
    // ondas gravadas
    ctx.strokeStyle = 'rgba(220,245,255,0.7)';
    ctx.lineWidth = 1.5;
    for (const y of [top + 9, top + 18]) {
      ctx.beginPath();
      for (let x = -hw; x <= hw; x += 2) ctx.lineTo(x, y + Math.sin(x * 0.4 + t * 3) * 2);
      ctx.stroke();
    }
  } else if (element === 'terra') {
    // pedra com musgo em cima e um cristal
    ctx.fillStyle = h.trim;
    ctx.beginPath();
    ctx.moveTo(-hw, top + 5);
    ctx.quadraticCurveTo(-8, top - 2, 4, top + 3);
    ctx.quadraticCurveTo(12, top + 6, hw, top + 2);
    ctx.lineTo(hw, top - 2);
    ctx.lineTo(-hw, top - 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(30,20,10,0.35)';
    for (const [x, y, r] of [[-12, top + 18, 3], [9, top + 14, 2.5], [-2, bottom - 6, 2]]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (element === 'ar') {
    // espirais de vento
    ctx.strokeStyle = 'rgba(80,170,160,0.75)';
    ctx.lineWidth = 1.6;
    for (const [x, y] of [[-10, top + 14], [9, top + 14]]) {
      ctx.beginPath();
      ctx.arc(x, y, 5, t * 3, t * 3 + Math.PI * 1.5);
      ctx.stroke();
    }
  } else {
    // universal: rebites e o friso dourado
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(-hw, top, hw * 0.9, bottom - top);
    ctx.fillStyle = h.trim;
    for (const x of [-15, 15]) {
      for (const y of [top + 6, bottom - 6]) {
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // brilho em cima
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(-hw, top, hw * 2, 3);
  ctx.restore();
  // faixa no meio da cabeça (onde o cabo encaixa) com a joia
  ctx.fillStyle = h.trim;
  ctx.fillRect(-5, top - 1, 10, bottom - top + 2);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-5, top - 1, 10, bottom - top + 2);
  const gem = h.glow ?? prismColor(t);
  ctx.save();
  ctx.shadowColor = gem;
  ctx.shadowBlur = 8;
  ctx.fillStyle = gem;
  ctx.beginPath();
  ctx.moveTo(0, top + 6);
  ctx.lineTo(4, top + 14);
  ctx.lineTo(0, top + 22);
  ctx.lineTo(-4, top + 14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, top + 6);
  ctx.lineTo(4, top + 14);
  ctx.lineTo(0, top + 22);
  ctx.lineTo(-4, top + 14);
  ctx.closePath();
  ctx.stroke();
  // contorno da cabeça
  head();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ctx.restore();
}

// Rastro da descida do marretão: uma faixa grossa em arco em volta do ombro,
// na altura da cabeça da marreta (mesma convenção de ângulo das poses:
// 0 = para baixo, PI/2 = para a frente, PI = para cima)
export function drawHammerSmear(ctx, color, shoulder, { from, to, alpha }) {
  if (alpha <= 0 || Math.abs(from - to) < 0.05) return;
  const toCanvas = (a) => Math.atan2(Math.cos(a), Math.sin(a));
  const r0 = 58;
  const r1 = 98;
  const a0 = toCanvas(from);
  const a1 = toCanvas(to);
  // de trás-em-cima para a frente-embaixo é sentido horário na tela
  const ccw = false;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  const g = ctx.createRadialGradient(shoulder.x, shoulder.y, r0, shoulder.x, shoulder.y, r1);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.55, color);
  g.addColorStop(0.9, 'rgba(255,255,255,0.95)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(shoulder.x, shoulder.y, r1, a0, a1, ccw);
  ctx.arc(shoulder.x, shoulder.y, r0, a1, a0, !ccw);
  ctx.closePath();
  ctx.fill();
  // linhas de velocidade dentro do rastro
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.5;
  for (const r of [70, 84]) {
    ctx.beginPath();
    ctx.arc(shoulder.x, shoulder.y, r, a0 + (a1 - a0) * 0.3, a1, ccw);
    ctx.stroke();
  }
  ctx.restore();
}
