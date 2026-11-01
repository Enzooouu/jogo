// Menu da tela inicial: a faixa laranja desliza até a opção escolhida
// (mouse por cima, foco do Tab ou setas ↑ ↓).

export function initHomeMenu(nav, isFree) {
  const band = nav.querySelector('.home-band');
  const items = () => [...nav.querySelectorAll('.home-item')].filter((b) => !b.hidden);
  let current = nav.querySelector('.home-item.on');

  function place() {
    if (!current || current.hidden || !nav.offsetParent) return;
    band.style.setProperty('--y', `${current.offsetTop}px`);
  }

  function select(btn) {
    current = btn;
    for (const b of nav.querySelectorAll('.home-item')) b.classList.toggle('on', b === btn);
    place();
  }

  for (const b of nav.querySelectorAll('.home-item')) {
    // o mouse também passa o foco, para o Enter confirmar a opção destacada
    b.addEventListener('mouseenter', () => b.focus({ preventScroll: true }));
    b.addEventListener('focus', () => select(b));
  }

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'ArrowDown' && e.code !== 'ArrowUp') return;
    if (!nav.offsetParent || !isFree()) return;
    const list = items();
    if (!list.length) return;
    e.preventDefault();
    const i = list.indexOf(current);
    const next = list[(i + (e.code === 'ArrowDown' ? 1 : -1) + list.length) % list.length];
    next.focus({ preventScroll: true });
  });

  window.addEventListener('resize', place);
  // a fonte da opção escolhida cresce com transição: reposiciona quando termina
  nav.addEventListener('transitionend', place);
  return { refresh: place };
}
