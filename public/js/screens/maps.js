// Tela de escolher o mapa: carrossel de cartões (o do meio grande, os
// vizinhos menores e apagados dos lados). Cada cartão tem o nome em cima e a
// prévia do mapa de verdade (o cenário animado, sem lutadores) no meio. O
// primeiro cartão é o "Aleatório" (sorteia na hora de lutar).
//
// Setas na tela, ← → no teclado, clique no cartão do lado para ir até ele,
// Enter (ou clique no cartão do meio) para continuar.

import { Game } from '/shared/game.js';
import { MAPS, HILL_MAPS, getMap } from '/shared/maps.js';
import { Renderer } from '../render/renderer.js';

export const RANDOM_MAP = 'aleatorio';

const INFO = {
  aleatorio: { text: 'Sorteia um dos mapas na hora de lutar.', tags: ['Surpresa'] },
  caldeira: { text: 'Ilha de pedra entre o vulcão e a cachoeira.', tags: ['Lava', 'Água', 'Espinhos'] },
  pico: { text: 'Ilhas no céu do pôr do sol, com plataformas presas em balões.', tags: ['Vento', 'Lava', 'Água'] },
  campo: { text: 'Duas ilhas de grama com um vão no meio: só vale derrubar.', tags: ['Sem perigos'] },
  gelo: { text: 'Gelo que escorrega e racha, plataformas que derretem e nevasca.', tags: ['Gelo', 'Nevasca', 'Pingentes'] },
  coliseu: { text: 'A torcida joga as armas e, depois de 2:30, o palco se abre.', tags: ['Torcida', 'Morte súbita'] },
  navio: { text: 'Dois navios voando, com canhões que atiram em arco.', tags: ['Canhão', 'Balanço'] },
  castelo: { text: 'Pátio do castelo com torres, passarelas e o trono no meio.', tags: ['Rei da Ilha', 'Torres', 'Trono'] },
  piramide: { text: 'Pirâmide em degraus no deserto; o topo dourado é o mais disputado.', tags: ['Rei da Ilha', 'Degraus', 'Deserto'] },
};

// mapas de cada modo: o Rei da Ilha tem os dele (e só eles)
export function mapIdsFor(mode) {
  return Object.keys(mode === 'rei' ? HILL_MAPS : MAPS);
}

export class MapPicker {
  constructor(root, { onContinue }) {
    this.root = root;
    this.onContinue = onContinue;
    this.ids = [RANDOM_MAP, ...Object.keys(MAPS)];
    this.index = 0;
    this.previews = new Map();   // id -> { renderer }
    this.frame = null;
    this.build();
    this.root.querySelector('.map-prev').addEventListener('click', () => this.go(this.index - 1));
    this.root.querySelector('.map-next').addEventListener('click', () => this.go(this.index + 1));
    window.addEventListener('keydown', (e) => {
      if (!this.root.offsetParent) return;
      if (e.code === 'ArrowRight') this.go(this.index + 1);
      else if (e.code === 'ArrowLeft') this.go(this.index - 1);
      else if (e.code === 'Enter' && !(e.target instanceof HTMLButtonElement)) this.onContinue(this.current());
      else return;
      e.preventDefault();
    });
  }

  current() {
    return this.ids[this.index];
  }

  build() {
    const track = this.root.querySelector('.map-track');
    track.innerHTML = '';
    this.cards = this.ids.map((id, i) => {
      const map = id === RANDOM_MAP ? null : getMap(id);
      const info = INFO[id] ?? { text: '', tags: [] };
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'map-card';
      card.dataset.map = id;
      card.innerHTML = `
        <div class="map-name"><span class="map-eyebrow"></span><b></b></div>
        <div class="map-view">${id === RANDOM_MAP ? '<div class="map-random"><span>?</span></div>' : '<canvas aria-hidden="true"></canvas>'}</div>`;
      card.querySelector('.map-eyebrow').textContent = id === RANDOM_MAP ? 'SURPRESA' : `MAPA ${String(i).padStart(2, '0')}`;
      card.querySelector('b').textContent = id === RANDOM_MAP ? 'ALEATÓRIO' : map.name.toUpperCase();
      card.addEventListener('click', () => {
        if (i === this.index) this.onContinue(this.current());
        else this.go(i);
      });
      track.appendChild(card);
      return card;
    });
    // pontinhos de progresso
    const dots = this.root.querySelector('.map-dots');
    dots.innerHTML = '';
    this.dots = this.ids.map((id, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.setAttribute('aria-label', id === RANDOM_MAP ? 'Aleatório' : getMap(id).name);
      d.addEventListener('click', () => this.go(i));
      dots.appendChild(d);
      return d;
    });
  }

  // troca a lista de mapas (ex.: Rei da Ilha) e monta os cartões de novo
  setMaps(ids) {
    const next = [RANDOM_MAP, ...ids];
    if (next.join() === this.ids.join()) return;
    this.ids = next;
    this.previews.clear();
    this.build();
  }

  open(current) {
    const i = this.ids.indexOf(current);
    this.go(i >= 0 ? i : 0, true);
    this.start();
  }

  go(i, instant = false) {
    const n = this.ids.length;
    this.index = ((i % n) + n) % n;
    this.cards.forEach((card, k) => {
      // distância até o do meio, dando a volta (o último fica à esquerda do primeiro)
      let d = k - this.index;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
      card.style.setProperty('--d', d);
      card.style.setProperty('--s', d === 0 ? 1 : 0.8);
      card.classList.toggle('on', d === 0);
      card.classList.toggle('near', Math.abs(d) === 1);
      card.classList.toggle('far', Math.abs(d) > 1);
      card.tabIndex = d === 0 ? 0 : -1;
      if (instant) card.style.transition = 'none';
    });
    if (instant) requestAnimationFrame(() => this.cards.forEach((c) => (c.style.transition = '')));
    this.dots.forEach((d, k) => d.classList.toggle('on', k === this.index));
    this.root.querySelector('.map-count').textContent = `${this.index + 1} / ${n}`;
    this.root.querySelector('.map-progress i').style.width = `${((this.index + 1) / n) * 100}%`;
    // descrição e etiquetas do mapa do meio
    const info = INFO[this.current()] ?? { text: '', tags: [] };
    this.root.querySelector('.map-desc p').textContent = info.text;
    const tags = this.root.querySelector('.map-desc .map-tags');
    tags.innerHTML = '';
    for (const t of info.tags) {
      const span = document.createElement('span');
      span.textContent = t;
      tags.appendChild(span);
    }
    this.onChange?.(this.current());
  }

  // prévia viva: o cenário do mapa animado (sem lutadores), só nos cartões visíveis
  preview(id) {
    if (this.previews.has(id)) return this.previews.get(id);
    const canvas = this.cards[this.ids.indexOf(id)].querySelector('canvas');
    const players = [{ id: 1, element: 'fogo', team: 'A' }, { id: 2, element: 'agua', team: 'B' }];
    const game = new Game({ players, mapId: id, items: false, seed: 3 });
    const renderer = new Renderer(canvas, game, {});
    renderer.drawHud = () => {};
    renderer.drawPlayers = () => {};
    renderer.drawOffscreen = () => {};
    const p = { renderer, game };
    this.previews.set(id, p);
    return p;
  }

  start() {
    if (this.frame) return;
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.ids.forEach((id, k) => {
        if (id === RANDOM_MAP) return;
        const card = this.cards[k];
        if (card.classList.contains('far')) return;
        const p = this.preview(id);
        // os do lado ficam parados; o do meio anima
        p.renderer.frame(card.classList.contains('on') ? dt : 0, 0);
      });
      this.frame = requestAnimationFrame(loop);
    };
    this.frame = requestAnimationFrame(loop);
  }

  stop() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = null;
  }
}

// sorteia um mapa de verdade
export function pickRandomMap(rng = Math.random, ids = Object.keys(MAPS)) {
  return ids[Math.floor(rng() * ids.length)];
}
