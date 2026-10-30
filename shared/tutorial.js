// Tutorial: 11 etapas, da mais fácil para a mais difícil. Cada etapa tem a
// sua arena de treino (grama, de dia) e uma tarefa. Aqui fica só a lógica
// (roda no navegador e no Node, para os testes); o desenho e os cartões
// ficam em public/js/screens/tutorial.js.
//
// Nas etapas 1 a 5 o jogador é um manequim preto (sem elemento ainda). Na
// etapa 6 ele escolhe um dos 4 elementos e fica com ele até o fim.

import { Game } from './game.js';
import { WEAPONS } from './weapons.js';
import { HAZARD_REACTION } from './elements.js';
import { GROUND } from './maps-treino.js';

const ME = 1;
const DUMMY = 2;

// ---------------------------------------------------------------- ajuda

function place(p, x, footY) {
  p.x = x - p.w / 2;
  p.y = footY - p.h;
  p.px = p.x;
  p.py = p.y;
  p.vx = 0;
  p.vy = 0;
  p.checkpoint = { x, y: footY };
}

function hide(p) {
  p.state = 'out';
  p.x = -9999;
}

const centerX = (p) => p.x + p.w / 2;
const foot = (p) => p.y + p.h;
// Em pé perto da bandeira?
const atGoal = (p, g) => p.state === 'alive' && p.onGround && Math.abs(centerX(p) - g.x) < 46 && Math.abs(foot(p) - g.y) < 4;

const giveWeapon = (p, id) => { p.weapon = { id, uses: WEAPONS[id].uses }; };
const mine = (events, type) => events.filter((e) => e.type === type && (e.id === ME || e.attacker === ME));

// ---------------------------------------------------------------- etapas
//
// Cada etapa:
//   title, map
//   text(s): frase da tarefa; {left}, {up}... viram a tecla escolhida
//   start(game, s): arruma a arena (s = estado da etapa)
//   update(game, s, events): devolve true quando a tarefa foi feita
//   progress(s): "1/3" (opcional)
//   goal: bandeira de chegada { x, y } (opcional)

export const STEPS = [
  {
    id: 'andar', title: 'Andar', map: 'treino-andar',
    goal: { x: 1080, y: GROUND },
    text: () => 'Use {left} e {right} para andar. Vá até a bandeira!',
    start(g) { place(g.me, 200, GROUND); },
    update(g, s) { return atGoal(g.me, this.goal); },
  },
  {
    id: 'pular', title: 'Pular', map: 'treino-pular',
    goal: { x: 1060, y: 350 },
    text: () => 'Aperte {up} para pular. No ar, aperte {up} de novo para o pulo duplo e suba no bloco alto!',
    start(g) { place(g.me, 200, GROUND); },
    update(g, s, events) {
      if (mine(events, 'jump').some((e) => e.double)) s.double = true;
      return atGoal(g.me, this.goal);
    },
  },
  {
    id: 'descer', title: 'Descer das plataformas', map: 'treino-descer',
    text: () => 'Em cima de uma plataforma, aperte {down} para descer por ela. Desça pelas 2 plataformas até o chão!',
    start(g, s) { place(g.me, 640, 260); s.drops = 0; },
    update(g, s, events) {
      s.drops += mine(events, 'drop').length;
      return s.drops >= 2 && g.me.onGround && g.me.standingOn === 'solid';
    },
    progress: (s) => `${Math.min(2, s.drops)}/2`,
  },
  {
    id: 'dash', title: 'Dash', map: 'treino-dash',
    goal: { x: 1100, y: GROUND },
    text: () => 'Aperte {dash} para dar um dash. Pule e dê o dash no ar para atravessar o buraco! Segurando uma direção (ex.: {right} + {up}) o dash vai na diagonal.',
    start(g, s) { place(g.me, 200, GROUND); s.dashes = 0; },
    update(g, s, events) {
      s.dashes += mine(events, 'dash').length;
      return s.dashes > 0 && atGoal(g.me, this.goal);
    },
  },
  {
    id: 'parede', title: 'Paredes', map: 'treino-parede',
    goal: { x: 1060, y: 220 },
    text: () => 'No ar, segure {left} ou {right} na direção da parede para se pendurar. Pendurado, aperte {up} para pular de parede. Saia do poço!',
    start(g, s) { place(g.me, 640, 600); s.wallJumps = 0; },
    update(g, s, events) {
      s.wallJumps += mine(events, 'wallJump').length;
      return s.wallJumps > 0 && atGoal(g.me, this.goal);
    },
  },
  {
    id: 'arma', title: 'Pegar arma', map: 'treino-campo', needsElement: true,
    text: () => 'Caixas com armas caem do céu de paraquedas. Quando ela abrir no chão, encoste na arma para pegar!',
    start(g, s) { place(g.me, 300, GROUND); s.wait = 0.6; },
    update(g, s, events) {
      if (mine(events, 'pickup').length) return true;
      // caixa ainda não caiu, ou sumiu: solta outra perto do jogador
      if (!g.items.length && (s.wait -= 1 / 60) <= 0) {
        g.dropCrate(Math.round(Math.min(1080, centerX(g.me) + 240)), 'espada', 60);
        s.wait = 1;
      }
      return false;
    },
  },
  {
    id: 'atacar', title: 'Atacar', map: 'treino-campo', needsElement: true, dummy: true,
    text: (s) => (s.phase === 'espada'
      ? 'Aperte {attack} para atacar. Acerte 3 golpes de espada no boneco de treino!'
      : 'Agora com o cajado: ele atira de longe. Aperte {attack} e acerte 2 tiros no boneco!'),
    start(g, s) {
      place(g.me, 400, GROUND);
      place(g.dummy, 820, GROUND);
      g.dummy.facing = -1;
      giveWeapon(g.me, 'espada');
      s.phase = 'espada';
      s.hits = 0;
    },
    update(g, s, events) {
      for (const e of events) {
        if (e.type !== 'hit' || e.attacker !== ME || e.target !== DUMMY) continue;
        s.hits++;
        // o boneco não acumula muito dano, para não voar para longe
        g.dummy.damage = Math.min(g.dummy.damage, 30);
      }
      if (s.phase === 'espada' && s.hits >= 3) {
        s.phase = 'cajado';
        s.hits = 0;
        giveWeapon(g.me, 'cajado');
        return false;
      }
      // arma acabou ou foi lançada: ganha outra
      if (!g.me.weapon && !g.projectiles.some((p) => p.owner === ME && p.kind === 'arremesso')) giveWeapon(g.me, s.phase);
      return s.phase === 'cajado' && s.hits >= 2;
    },
    progress: (s) => `${Math.min(s.hits, s.phase === 'espada' ? 3 : 2)}/${s.phase === 'espada' ? 3 : 2}`,
  },
  {
    id: 'lancar', title: 'Lançar a arma', map: 'treino-campo', needsElement: true,
    text: (s) => (s.phase === 'lancar'
      ? 'Aperte {throw} para lançar a espada.'
      : 'Se a arma não acerta ninguém, ela fica no chão. Vá pegar de volta!'),
    start(g, s) {
      place(g.me, 300, GROUND);
      g.me.facing = 1;
      giveWeapon(g.me, 'espada');
      s.phase = 'lancar';
      s.lost = 0;
    },
    update(g, s, events) {
      if (s.phase === 'lancar') {
        if (mine(events, 'throw').length) s.phase = 'buscar';
        return false;
      }
      if (g.me.weapon) return true;
      // a arma caiu no buraco: começa de novo
      const flying = g.projectiles.some((p) => p.owner === ME && p.kind === 'arremesso');
      if (!flying && !g.items.length && (s.lost += 1 / 60) > 0.8) {
        giveWeapon(g.me, 'espada');
        s.phase = 'lancar';
        s.lost = 0;
      }
      return false;
    },
  },
  {
    id: 'perigos', title: 'Perigos', map: 'treino-perigos', needsElement: true,
    goal: { x: 1130, y: GROUND },
    text: (s) => `Cada elemento reage diferente aos perigos. ${hazardText(s.element)} Chegue até a bandeira!`,
    start(g, s) { place(g.me, 160, GROUND); s.element = g.me.element; },
    update(g) { return atGoal(g.me, this.goal); },
  },
  {
    id: 'voltar', title: 'Voltar para a arena', map: 'treino-voltar', needsElement: true,
    text: () => 'Você vai ser arremessado! Para voltar, use o pulo duplo, o dash na diagonal ({left} ou {right} + {up} + {dash}) e se pendure na parede da ilha. Volte 2 vezes!',
    start(g, s) { place(g.me, 640, 520); s.phase = 'espera'; s.timer = 1.2; s.back = 0; s.side = 1; },
    update(g, s, events) {
      const me = g.me;
      if (mine(events, 'ko').length) { s.phase = 'espera'; s.timer = 1.4; }
      if (me.state !== 'alive') return false;
      if (s.phase === 'espera' && me.onGround && (s.timer -= 1 / 60) <= 0) {
        launch(g, me, s.side);
        s.side = -s.side;
        s.phase = 'voando';
      } else if (s.phase === 'voando' && me.onGround && me.hitstun <= 0) {
        s.back++;
        s.phase = 'espera';
        s.timer = 1;
      }
      return s.back >= 2;
    },
    progress: (s) => `${s.back}/2`,
  },
  {
    id: 'final', title: 'Desafio final', map: 'treino-final', needsElement: true, final: true,
    text: () => 'Vença um duelo contra um bot! Cada um tem 2 vidas. Use tudo o que aprendeu. Boa sorte!',
    start() {},
    // ganhou ou perdeu: quem cuida é a tela do tutorial (resultado da partida)
    update(g) { return g.game.result?.winnerTeam === 'A'; },
  },
];

// Empurrão da etapa "voltar": como um golpe forte, sem dano
function launch(g, p, side) {
  p.vx = side * 760;
  p.vy = -620;
  p.onGround = false;
  p.hitstun = 0.3;
  p.facing = -side;
  g.game.emit('launch', { id: p.id, x: centerX(p), y: p.y + p.h / 2, side });
}

const REACTION_TEXT = {
  imune: 'não te machuca',
  morre: 'te derruba (perde vida)',
  dano: 'espeta e dá dano',
  empurra: 'te empurra',
};

export function hazardText(element) {
  const r = HAZARD_REACTION[element] ?? {};
  const names = { lava: 'Lava', agua: 'Água', espinhos: 'Espinhos', vento: 'Vento' };
  return Object.keys(names).map((h) => `${names[h]}: ${REACTION_TEXT[r[h] ?? 'morre']}.`).join(' ');
}

// ---------------------------------------------------------------- partida da etapa

/**
 * Monta a partida de uma etapa.
 * @param {number} index etapa (0 a 10)
 * @param {object} opts
 * @param {string|null} opts.element elemento escolhido (null = manequim)
 * @param {string} opts.name nome do jogador
 * @param {number} [opts.seed]
 */
export function createStep(index, { element = null, name = 'Você', seed = 1 } = {}) {
  const step = STEPS[index];
  const el = element ?? 'agua';
  const other = el === 'terra' ? 'agua' : 'terra';
  const players = [
    { id: ME, name, element: el, team: 'A', skin: element ? null : 'manequim' },
    step.final
      ? { id: DUMMY, name: 'Rival', element: other, team: 'B', isBot: true }
      : { id: DUMMY, name: 'Boneco', element: other, team: 'B', skin: 'boneco' },
  ];
  const game = new Game(step.final
    ? { players, mapId: step.map, seed, lives: 2, timeLimit: 0 }
    : { players, mapId: step.map, seed, practice: true, items: false, countdown: 0, timeLimit: 0, lives: 99 });
  const ctx = { game, me: game.playerById(ME), dummy: game.playerById(DUMMY), get items() { return game.items; }, get projectiles() { return game.projectiles; }, dropCrate: (...a) => game.dropCrate(...a) };
  const state = {};
  if (!step.final && !step.dummy) hide(ctx.dummy);
  step.start(ctx, state);
  return {
    step, game, state,
    // avança a tarefa com os eventos deste passo; true = etapa concluída
    update(events) { return step.update(ctx, state, events); },
  };
}

export const TUTORIAL_LOCAL_ID = ME;
