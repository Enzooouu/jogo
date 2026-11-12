// Ícones do jogo (vetoriais, no lugar de emojis). Todos desenhados numa grade
// de 24x24, com traço arredondado na cor do texto (currentColor); as partes
// marcadas com `f` são preenchidas.
//
//   iconSvg('coroa')          texto SVG para colocar em innerHTML
//   iconEl('coroa')           elemento <svg> pronto
//   drawIcon(ctx, 'coroa', x, y, tamanho, cor)   desenha no canvas

const F = (d) => ({ d, f: true });

export const ICONS = {
  // ---------------------------------------------------------------- conquistas
  trofeu: ['M7 4h10v5a5 5 0 0 1-10 0z', 'M7 6H4v1a3 3 0 0 0 3 3', 'M17 6h3v1a3 3 0 0 1-3 3', 'M12 14v4', 'M8 20h8'],
  escudo: ['M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z', 'M9 12l2 2 4-4'],
  coracao: [F('M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z')],
  explosao: ['M12 2l2 5.5 5-3-2.5 5.5L22 12l-5.5 2 2.5 5.5-5-3L12 22l-2-5.5-5 3 2.5-5.5L2 12l5.5-2L5 4.5l5 3z', F('M12 9.5l1 1.5 1.5 1-1.5 1-1 1.5-1-1.5-1.5-1 1.5-1z')],
  caveira: ['M12 3a7 7 0 0 0-7 7c0 2.6 1.2 4.2 3 5.2V19h8v-3.8c1.8-1 3-2.6 3-5.2a7 7 0 0 0-7-7z', F('M9.2 9.5a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4z'), F('M14.8 9.5a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4z'), 'M10.5 19v2M13.5 19v2'],
  elementos: ['M12 3l9 9-9 9-9-9z', 'M12 3v18M3 12h18'],
  chama: ['M12 3c1 3.2 4.5 4.8 4.5 9.5a4.5 4.5 0 0 1-9 0c0-2 .8-3.3 2-4.4.1 2 1 3.2 2.3 3.4-1-3-.4-5.8.2-8.5z'],
  onda: ['M3 15c2 0 2-2 4.5-2s2.5 2 4.5 2 2-2 4.5-2 2.5 2 4.5 2', 'M3 19.5c2 0 2-2 4.5-2s2.5 2 4.5 2 2-2 4.5-2 2.5 2 4.5 2', 'M6 11a6 6 0 0 1 10-4.5c1 1.2.4 3-1.2 3s-2-1.5-1.3-2.5'],
  rocha: ['M3.5 19l3-8.5L11 7l5 1.5 4.5 5.5-1 5z', 'M11 7l1.2 5-3.2 3', 'M12.2 12l4.3 1'],
  tornado: ['M3 5h18', 'M5 9h14', 'M8 13h9', 'M10 17h5', 'M11.5 21h2'],
  mortal: ['M12 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11z', 'M9 9.5h7', 'M6 21c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5'],
  espada: ['M20.5 3.5l-.8 4L10 17.2 6.8 14 16.5 4.3z', 'M5 12.5l6.5 6.5', 'M7 17l-3.5 3.5'],
  martelo: ['M12.5 3.5l8 8-3 3-8-8z', 'M11 10l-7.5 7.5 3 3L14 13'],
  alvo: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10z', F('M12 10.3a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4z')],
  floco: ['M12 2.5v19', 'M3.8 7.2l16.4 9.6', 'M3.8 16.8l16.4-9.6', 'M9.5 4.5L12 7l2.5-2.5', 'M9.5 19.5L12 17l2.5 2.5'],
  bomba: ['M10.5 21a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M15.5 8.5l2-2', 'M19 3v1.5M21.5 5H20M20.8 3.2l-1 1'],
  coroa: ['M4 17.5L3 7.5l5 4 4-7 4 7 5-4-1 10z', 'M4.5 21h15'],
  punho: ['M7.5 11V8.3a1.5 1.5 0 0 1 3 0V11', 'M10.5 10.5V7.3a1.5 1.5 0 0 1 3 0v3.2', 'M13.5 10.5V8.3a1.5 1.5 0 0 1 3 0V11', 'M16.5 11V10a1.5 1.5 0 0 1 3 0v4a7 7 0 0 1-7 7h-.8a5.2 5.2 0 0 1-5.2-5.2V14a1.5 1.5 0 0 1 3 0v1'],
  pergaminho: ['M8 3.5h10a2 2 0 0 1 2 2V7h-4', 'M8 3.5a2 2 0 0 0-2 2v12.5a2 2 0 0 1-2 2h10a2 2 0 0 0 2-2V5.5a2 2 0 0 1 2-2', 'M9 9h4.5M9 13h4.5'],
  torre: ['M6 21V9h12v12', 'M6 9V4h2.5v2h2V4h3v2h2V4H18v5', 'M10 21v-3.5a2 2 0 0 1 4 0V21', 'M4 21h16'],
  cronometro: ['M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M12 9v4l2.5 2', 'M10 2.5h4', 'M12 2.5V5'],

  // ---------------------------------------------------------------- coleção
  capacete: ['M12 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', F('M8 9.3c0-1.8 1.8-3 4-3s4 1.2 4 3v1.4c0 1.8-1.8 3-4 3s-4-1.2-4-3z'), 'M7 19.5h10'],
  pirata: ['M2 15.5c2.6-.6 4-2.3 5-4.8C8.2 7.6 10 6 12 6s3.8 1.6 5 4.7c1 2.5 2.4 4.2 5 4.8-3 1.8-6.5 2.5-10 2.5s-7-.7-10-2.5z', 'M10.2 9.4l3.6 3.4M13.8 9.4l-3.6 3.4'],

  // ---------------------------------------------------------------- interface
  nivel: ['M12 20V5', 'M6 11l6-6 6 6'],
  cadeado: ['M5.5 11h13v10h-13z', 'M8.5 11V7.5a3.5 3.5 0 0 1 7 0V11', 'M12 15v2.5'],
  check: ['M5 12.5l4.5 4.5L19 7'],
  controle: ['M7.5 8h9a4 4 0 0 1 3.9 3.2l1 5a2.2 2.2 0 0 1-3.8 1.9L15.5 16h-7l-2.1 2.1a2.2 2.2 0 0 1-3.8-1.9l1-5A4 4 0 0 1 7.5 8z', 'M8 10.5v3M6.5 12h3', F('M15.5 10.4a1 1 0 1 1 0 2 1 1 0 0 1 0-2z'), F('M17.5 12.4a1 1 0 1 1 0 2 1 1 0 0 1 0-2z')],
  mapa: ['M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z', 'M9 4v14', 'M15 6v14'],
  dado: ['M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', F('M8.5 7.2a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z'), F('M12 10.7a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z'), F('M15.5 14.2a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z')],
  estrela: [F('M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z')],
  menu: ['M4 7h16M4 12h16M4 17h16'],
  pausa: ['M8.5 5.5v13M15.5 5.5v13'],
  usuarios: ['M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5', 'M16 4.3a3.5 3.5 0 0 1 0 6.4', 'M18 14.8c2.1.7 3.5 2.6 3.5 5.2'],
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function iconSvg(name, cls = 'icon', title = '') {
  const parts = ICONS[name];
  if (!parts) return '';
  const paths = parts.map((p) => (typeof p === 'string'
    ? `<path d="${p}"/>`
    : `<path d="${p.d}" fill="currentColor" stroke="none"/>`)).join('');
  const label = title ? ` role="img" aria-label="${esc(title)}"` : ' aria-hidden="true"';
  return `<svg class="${esc(cls)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${label}>${paths}</svg>`;
}

export function iconEl(name, cls = 'icon', title = '') {
  const t = document.createElement('template');
  t.innerHTML = iconSvg(name, cls, title);
  return t.content.firstElementChild ?? document.createTextNode('');
}

// Desenha o ícone no canvas com o canto de cima à esquerda em (x, y)
const cache = new Map();
export function drawIcon(ctx, name, x, y, size, color) {
  const parts = ICONS[name];
  if (!parts || typeof Path2D === 'undefined') return;
  if (!cache.has(name)) cache.set(name, parts.map((p) => ({ path: new Path2D(typeof p === 'string' ? p : p.d), fill: typeof p !== 'string' })));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const p of cache.get(name)) {
    if (p.fill) ctx.fill(p.path);
    else ctx.stroke(p.path);
  }
  ctx.restore();
}
