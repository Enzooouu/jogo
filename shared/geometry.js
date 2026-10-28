// Funções de colisão simples (retângulos alinhados aos eixos e círculos).

export function rectsOverlap(a, b, inset = 0) {
  return (
    a.x + inset < b.x + b.w &&
    a.x + a.w - inset > b.x &&
    a.y + inset < b.y + b.h &&
    a.y + a.h - inset > b.y
  );
}

export function circleRectOverlap(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy <= r * r;
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function approach(value, target, amount) {
  if (value < target) return Math.min(value + amount, target);
  if (value > target) return Math.max(value - amount, target);
  return value;
}
