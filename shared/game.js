// Simulação da partida. Não desenha nada e não lê teclado: recebe os
// comandos de cada jogador a cada passo (step) e atualiza o estado.
// Por isso a mesma classe serve para:
//   - jogo local contra bots (hoje)
//   - servidor autoritativo do multiplayer online (futuro)
//
// O desenho fica em public/js/render, e quem decide os comandos são o
// teclado (public/js/input) e os bots (shared/ai.js).

import { DT, PHYS, PLAYER, MATCH, ITEMS, MODES } from './constants.js';
import { getMap } from './maps.js';
import { ELEMENTS, HAZARDS, hazardReaction, teamElementsError } from './elements.js';
import { WEAPONS, weaponProfile, pickWeapon } from './weapons.js';
import { EMPTY_INPUT } from './input.js';
import { createRng } from './rng.js';
import { rectsOverlap, circleRectOverlap, approach } from './geometry.js';
import { FrozenLake, LAKE } from './lake.js';
import { KingOfHill, HILL } from './hill.js';
import { Airships } from './ship.js';

// Combinação de disparos: quem continua (o primeiro da lista ganha), o nome
// de cada par e o efeito extra que o elemento absorvido dá ao acertar
const COMBO_CARRIER = ['ar', 'terra', 'fogo', 'agua'];
const COMBO_NAMES = {
  'ar+fogo': 'tornadoDeFogo',
  'fogo+terra': 'magma',
  'agua+terra': 'lama',
  'agua+ar': 'tempestade',
  'ar+terra': 'areia',
};
const COMBO_STATUS = {
  fogo: { type: 'queimadura', duration: 2.5, dps: 4 },
  agua: { type: 'encharcado', duration: 2, slow: 0.3 },
  terra: { type: 'atordoado', duration: 0.5 },
};

// Espinhos espetam em "pancadas" a cada meio segundo (fica fácil de perceber)
const SPIKE_TICK = 0.5;
const NO_STATS = { speed: 1, jump: 1, weight: 1, damage: 1, airDashes: PHYS.airDashes };
const statsOf = (p) => {
  const st = { ...NO_STATS, ...ELEMENTS[p.element].stats };
  // Guardião da Torre: maior = mais pesado (voa menos) e bate mais forte
  if (p.size !== 1) st.weight *= 1 + (p.size - 1) * 0.8;
  if (p.power !== 1) st.damage *= p.power;
  return st;
};
// Quanto cada elemento sente o vento (Ar é imune pela tabela de perigos)
const WIND_FACTOR = { terra: 0.5 };

// Degrau que dá para subir andando, sem pular (ex.: convés do navio um
// pouco mais alto que a prancha)
const STEP_UP = 10;

// Gelo: acelera devagar, quase não freia e corre um pouco mais
const ICE = { accel: 0.28, friction: 0.07, speed: 1.15 };
// Arma jogada pela torcida (Coliseu) que acerta alguém no caminho
const CROWD_HIT = { damage: 8, kbBase: 280, kbScale: 2.6, angle: 0.7 };

const THROWN = { damage: 10, kbBase: 300, kbScale: 3.4, angle: 0.65, speed: 820, gravity: 1100 };
const EXPLOSION_KB = { kbBase: 220, kbScale: 2.2, angle: 0.75 };

export class Game {
  /**
   * @param {object} config
   * @param {Array<{id, name, element, team?, isBot?}>} config.players
   * @param {'times'|'ffa'} [config.mode]
   * @param {string} [config.mapId]
   * @param {number} [config.seed]
   * @param {number} [config.lives]
   * @param {number} [config.timeLimit] segundos (0 = sem limite)
   * @param {boolean} [config.practice] treino (tutorial): ninguém perde vida
   *   e quem cai volta no ponto `checkpoint` do jogador
   * @param {boolean} [config.items] caixas caindo do céu sozinhas (padrão: sim)
   * @param {number} [config.countdown] segundos de contagem antes de começar
   */
  constructor(config) {
    const {
      players, mode = 'times', mapId, seed = 1, lives = PLAYER.lives, timeLimit = MATCH.timeLimit,
      practice = false, items = true, countdown: baseCountdown = MATCH.countdown,
    } = config;
    const countdown = baseCountdown + (config.climb ?? 0);
    if (!MODES[mode]) throw new Error(`Modo desconhecido: ${mode}`);
    if (!Array.isArray(players) || players.length < 2) throw new Error('A partida precisa de pelo menos 2 jogadores');

    this.mode = MODES[mode];
    this.map = getMap(mapId);
    // Torre: o andar muda o céu (uma cópia do mapa com o número do andar)
    if (config.towerFloor !== undefined) {
      this.towerFloor = config.towerFloor;
      this.map = { ...this.map, towerFloor: config.towerFloor, theme: { ...this.map.theme, floor: config.towerFloor } };
    }
    this.seed = seed;
    this.rng = createRng(seed);
    // Rei da Ilha: ninguém perde vida (game.lives = 0 esconde as bolinhas de vida)
    this.lives = this.mode.hill ? 0 : lives;
    this.timeLimit = this.mode.hill && config.timeLimit === undefined ? HILL.timeLimit : timeLimit;
    this.practice = practice;
    this.itemsEnabled = items;
    // gravidade mais leve (Torre, no espaço): pula mais alto e voa mais longe
    this.gravity = config.gravityScale ?? 1;
    // fim da partida: tempo antes do resultado e se tem a comemoração de vitória
    this.endDelay = config.endDelay ?? MATCH.endDelay;
    this.celebrate = config.celebrate ?? true;
    // Torre: segundos de subida do elevador no começo (antes da contagem)
    this.climb = config.climb ?? 0;
    this.climbInfo = config.climbInfo ?? null;   // texto da subida ("ANDAR 3 VENCIDO!")

    this.tick = 0;
    this.time = 0;               // tempo de luta (sem contar a contagem regressiva)
    this.phase = 'countdown';    // countdown -> playing -> ending -> ended
    this.phaseTimer = countdown;
    this.result = null;
    this.events = [];

    this.items = [];
    this.projectiles = [];
    this.nextEntityId = 1;
    this.nextItemIn = ITEMS.firstSpawn;
    this.winds = [];
    this.nextWindIn = this.map.wind ? this.map.wind.first : Infinity;
    this.nextStreamIn = this.map.wind?.stream ? this.map.wind.stream.first : Infinity;
    this.respawnIndex = 0;
    this.walls = null;           // paredes de espinhos da morte súbita (Coliseu)
    this.suddenDeath = false;    // o palco já se abriu?
    this.suddenWarned = false;
    // Plataformas com posição atual (algumas balançam presas a um balão)
    this.platforms = this.map.platforms.map((pl) => ({ ...pl, baseX: pl.x, baseY: pl.y, px: pl.x, py: pl.y, dx: 0, dy: 0 }));
    // Lago Congelado: gelo que racha, plataformas que derretem, nevasca...
    this.lake = this.map.lake ? new FrozenLake(this) : null;
    // Navio Voador: navios balançando e canhões
    this.ships = this.map.ships ? new Airships(this) : null;

    const seen = new Set();
    this.players = players.map((cfg, index) => {
      if (seen.has(cfg.id)) throw new Error(`Jogador repetido: ${cfg.id}`);
      seen.add(cfg.id);
      if (!ELEMENTS[cfg.element]) throw new Error(`Elemento desconhecido: ${cfg.element}`);
      // No "todos contra todos" cada jogador é seu próprio time.
      const team = this.mode.teams ? cfg.team : `solo-${cfg.id}`;
      if (team === undefined || team === null) throw new Error(`Jogador ${cfg.id} sem time`);
      // cfg.lives / cfg.damage: começa com outras vidas ou com dano (Torre)
      const p = createPlayer({ ...cfg, team }, index, this.mode.hill ? 1 : cfg.lives ?? lives);
      if (cfg.damage) p.damage = cfg.damage;
      // quantas bolinhas de vida mostrar (Torre: o bot pode ter só 1)
      p.maxLives = cfg.maxLives ?? p.lives;
      return p;
    });
    if (new Set(this.players.map((p) => p.team)).size < 2) {
      throw new Error('A partida precisa de pelo menos 2 times');
    }
    // no treino o boneco (Mortal) pode ter o mesmo elemento do jogador
    // (online: os dois jogadores podem escolher o mesmo elemento, e na Torre
    // em dupla o time mistura elementos — config.checkElements = false)
    if (this.mode.teams && !this.practice && config.checkElements !== false) {
      const error = teamElementsError(this.players);
      if (error) throw new Error(error);
    }
    this.placeAtSpawns();
    // Rei da Ilha: a área que dá pontos (precisa dos times prontos)
    this.hill = this.mode.hill ? new KingOfHill(this) : null;
  }

  // ---------------------------------------------------------------- consulta

  playerById(id) {
    return this.players.find((p) => p.id === id) ?? null;
  }

  teams() {
    return [...new Set(this.players.map((p) => p.team))];
  }

  // Eventos gerados desde a última chamada (golpes, K.O., armas...). O
  // cliente usa para efeitos visuais e sons; o servidor poderá repassá-los.
  drainEvents() {
    const out = this.events;
    this.events = [];
    return out;
  }

  emit(type, data = {}) {
    this.events.push({ type, tick: this.tick, ...data });
  }

  // Estado serializável (para mandar pela rede no futuro).
  snapshot() {
    return {
      tick: this.tick,
      time: this.time,
      phase: this.phase,
      phaseTimer: this.phaseTimer,
      players: this.players.map((p) => ({
        id: p.id, x: p.x, y: p.y, vx: p.vx, vy: p.vy, facing: p.facing,
        damage: p.damage, lives: p.lives, state: p.state, invuln: p.invuln, hat: p.hat, size: p.size,
        hitstun: p.hitstun, onGround: p.onGround, onWall: p.onWall, windVx: p.windVx,
        dashTime: p.dashTime, airDashes: p.airDashes, lungeTime: p.lungeTime,
        weapon: p.weapon ? { ...p.weapon } : null, snowballs: p.snowballs,
        attack: p.attack ? { ...p.attack } : null,
        status: structuredClone(p.status),
      })),
      items: this.items.map((i) => ({ ...i })),
      winds: this.winds.map((w) => ({ ...w })),
      projectiles: this.projectiles.map((pr) => ({ ...pr, hitIds: [...pr.hitIds] })),
      platforms: this.platforms.map((pl) => ({ x: pl.x, y: pl.y })),
      walls: this.walls ? { ...this.walls } : null,
      result: this.result,
    };
  }

  // ---------------------------------------------------------------- passo

  /** Avança um passo de simulação (1/60 s). inputs = { [playerId]: input } */
  step(inputs = {}) {
    if (this.phase === 'ended') return;
    this.tick++;

    for (const p of this.players) {
      p.px = p.x;
      p.py = p.y;
    }
    for (const pl of this.platforms) {
      pl.px = pl.x;
      pl.py = pl.y;
      pl.dx = 0;
      pl.dy = 0;
    }

    if (this.phase === 'countdown') {
      for (const p of this.players) p.prevInput = { ...(inputs[p.id] ?? EMPTY_INPUT) };
      this.phaseTimer -= DT;
      if (this.phaseTimer <= 0) {
        this.phase = 'playing';
        this.emit('start');
      }
      return;
    }

    if (this.phase === 'ending') {
      this.phaseTimer -= DT;
      if (this.phaseTimer <= 0) {
        this.phase = 'ended';
        this.emit('ended', { result: this.result });
      }
      return;
    }

    this.time += DT;
    this.updatePlatforms();
    this.updateWinds();
    this.updateSuddenDeath();
    this.lake?.update();
    this.ships?.update();
    for (const p of this.players) this.updatePlayer(p, inputs[p.id] ?? EMPTY_INPUT);
    this.hill?.update();
    this.updateProjectiles();
    this.updateItems();
    this.spawnItems();
    for (const p of this.players) if (p.anchored) this.holdAnchored(p);
    this.checkEnd();
  }

  // Espantalho do treino: preso ao chão no ponto `checkpoint`. O empurrão dos
  // golpes não tira ele do lugar, só faz ele balançar na estaca (p.sway).
  holdAnchored(p) {
    if (p.state !== 'alive' || !p.checkpoint) return;
    const speed = Math.hypot(p.vx, p.vy);
    if (speed > 1) p.swayV += Math.sign(p.vx || p.facing) * Math.min(7, 1.5 + speed / 160);
    p.swayV += (-p.sway * 140 - p.swayV * 7) * DT;
    p.sway = Math.max(-0.7, Math.min(0.7, p.sway + p.swayV * DT));
    p.x = p.checkpoint.x - p.w / 2;
    p.y = p.checkpoint.y - p.h;
    p.vx = 0;
    p.vy = 0;
    p.onGround = true;
  }

  // ---------------------------------------------------------------- plataformas

  // Plataformas com `swing` ficam penduradas num balão parado, como uma
  // tábua de balanço: sozinhas não se mexem; quem anda em cima empurra para
  // o lado que está andando e, sem ninguém andando, ela volta devagar para
  // o lugar (o ponto de apoio fica `length` acima da plataforma).
  updatePlatforms() {
    for (const [i, pl] of this.platforms.entries()) {
      const sw = pl.swing;
      if (!sw) continue;
      pl.angle ??= 0;
      pl.spin ??= 0;
      let push = 0;
      for (const p of this.players) {
        if (p.state === 'alive' && p.onGround && p.standingOn === 'platform' && p.platform === i) push += p.vx;
      }
      // o vento também empurra a plataforma
      const box = { x: pl.x, y: pl.y - 20, w: pl.w, h: 40 };
      for (const w of this.winds) {
        if (w.state === 'ativo' && rectsOverlap(box, w)) push += w.dir * (w.strength ?? this.map.wind.strength) * sw.wind;
      }
      const accel = (-sw.gravity * Math.sin(pl.angle) + push * sw.push) / sw.length - sw.damping * pl.spin;
      pl.spin += accel * DT;
      pl.angle = Math.max(-sw.maxAngle, Math.min(sw.maxAngle, pl.angle + pl.spin * DT));
      if (Math.abs(pl.angle) >= sw.maxAngle) pl.spin = 0;
      const angle = pl.angle;
      const x = pl.baseX + sw.length * Math.sin(angle);
      const y = pl.baseY - sw.length * (1 - Math.cos(angle));
      pl.dx = x - pl.x;
      pl.dy = y - pl.y;
      pl.x = x;
      pl.y = y;
    }
    this.ships?.movePlatforms();
    // quem está em cima vai junto
    for (const p of this.players) {
      if (p.state !== 'alive' || !p.onGround || p.standingOn !== 'platform') continue;
      const pl = this.platforms[p.platform];
      if (!pl) continue;
      p.x += pl.dx;
      p.y += pl.dy;
    }
  }

  // ---------------------------------------------------------------- morte súbita

  // Plataforma que caiu na morte súbita (as colunas do Coliseu)
  platformGone(pl) {
    if (pl.goneTime > 0) return true; // derreteu (Lago Congelado)
    return this.suddenDeath && this.map.suddenDeath.dropPlatforms.includes(this.platforms.indexOf(pl));
  }

  // Chão que existe agora: na morte súbita do Coliseu o palco se abre e
  // sobram só os pedaços de `keep`
  solidsNow() {
    if (this.lake) return this.lake.solids();
    if (this.ships) return this.ships.solids();
    if (!this.suddenDeath) return this.map.solids;
    const out = [];
    for (const s of this.map.solids) {
      for (const [a, b] of this.map.suddenDeath.keep) {
        const x0 = Math.max(s.x, a);
        const x1 = Math.min(s.x + s.w, b);
        if (x1 > x0) out.push({ ...s, x: x0, w: x1 - x0 });
      }
    }
    return out;
  }

  // Perigos de agora (no Lago Congelado, a água dos buracos no gelo)
  hazardsNow() {
    return this.lake ? [...this.map.hazards, ...this.lake.hazards()] : this.map.hazards;
  }

  // Morte súbita (Coliseu): depois de `start` segundos de luta o palco se
  // abre (o meio e as bordas caem no abismo, as colunas também) e sobem
  // paredes de espinhos do fosso até o céu nas pontas da arena. Encostar
  // nelas mata na hora.
  updateSuddenDeath() {
    const sd = this.map.suddenDeath;
    if (!sd) return;
    if (this.time < sd.start) {
      if (!this.suddenWarned && this.time >= sd.start - sd.warn) {
        this.suddenWarned = true;
        this.emit('wallsWarn');
      }
      return;
    }
    if (!this.suddenDeath) {
      this.suddenDeath = true;
      this.walls = { left: sd.walls[0], right: sd.walls[1] };
      this.emit('collapse');
    }
    for (const p of this.players) {
      if (p.state !== 'alive' || p.admin) continue;
      const side = p.x < this.walls.left ? 1 : p.x + p.w > this.walls.right ? -1 : 0;
      if (!side) continue;
      this.emit('spikeWall', { id: p.id, dir: side, x: side > 0 ? this.walls.left : this.walls.right, y: p.y + p.h / 2 });
      this.knockOut(p, 'espinhos');
    }
  }

  // ---------------------------------------------------------------- jogadores

  placeAtSpawns() {
    const { spawns, width } = this.map;
    const teams = this.teams();
    // Com 2 times, cada time fica com uma metade do mapa; senão, todos dividem
    // a lista inteira.
    let pools = teams.map(() => spawns);
    if (teams.length === 2) {
      const left = spawns.filter((s) => s.x < width / 2);
      const right = spawns.filter((s) => s.x >= width / 2);
      // Cada time fica no lado do mapa com menos perigos mortais para ele
      // (ex.: time de Água do lado da água).
      const danger = (team, pool) => {
        const el = this.players.find((p) => p.team === team).element;
        return pool.filter((s) => s.near && hazardReaction(el, s.near) !== 'imune').length;
      };
      const straight = danger(teams[0], left) + danger(teams[1], right);
      const swapped = danger(teams[0], right) + danger(teams[1], left);
      pools = swapped < straight ? [right, left] : [left, right];
    }
    const used = new Map();   // ponto -> quantas vezes já foi usado
    let overflow = 0;
    teams.forEach((team, ti) => {
      const pool = pools[ti];
      for (const p of this.players.filter((q) => q.team === team)) {
        // Prefere um ponto livre que não fique ao lado de um perigo mortal
        // para o elemento do jogador.
        const free = pool.filter((s) => !used.has(s));
        const safe = free.find((s) => !s.near || hazardReaction(p.element, s.near) === 'imune');
        const spot = safe ?? free[0] ?? pool[overflow++ % pool.length];
        const wrap = used.get(spot) ?? 0;
        used.set(spot, wrap + 1);
        p.x = spot.x - p.w / 2 + wrap * 28;
        p.y = spot.y - p.h;
        p.px = p.x;
        p.py = p.y;
        p.facing = spot.x < width / 2 ? 1 : -1;
      }
    });
  }

  updatePlayer(p, input) {
    const prev = p.prevInput;
    const pressed = (key) => input[key] && !prev[key];
    p.prevInput = { ...input };

    if (p.state === 'out') return;
    if (p.state === 'respawning') {
      p.respawnTimer -= DT;
      if (p.respawnTimer <= 0) this.respawn(p);
      return;
    }

    p.invuln = Math.max(0, p.invuln - DT);
    p.cooldown = Math.max(0, p.cooldown - DT);
    p.attackBuffer = Math.max(0, p.attackBuffer - DT);
    p.dashBuffer = Math.max(0, p.dashBuffer - DT);
    p.hitstun = Math.max(0, p.hitstun - DT);
    p.pickupCooldown = Math.max(0, p.pickupCooldown - DT);
    p.dropTimer = Math.max(0, p.dropTimer - DT);
    p.wallJumpLock = Math.max(0, p.wallJumpLock - DT);
    p.spikeTimer = Math.max(0, p.spikeTimer - DT);
    p.dashCooldown = Math.max(0, p.dashCooldown - DT);
    this.updateStatus(p);
    // Modo ADM (testes): pulos, dashes e investidas no ar sem limite
    if (p.admin) {
      p.jumpsLeft = PHYS.maxJumps;
      p.airDashes = statsOf(p).airDashes;
      p.airLunges = 1;
    }

    const control = p.hitstun <= 0 && !p.status.atordoado;
    const st = statsOf(p);
    const wasOnGround = p.onGround;
    let jumped = false;

    if (control) {
      let dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      // Logo após um pulo de parede, o impulso vale mais que o direcional.
      if (p.wallJumpLock > 0) dir = 0;
      if (dir !== 0 && !p.attack) p.facing = dir;

      let maxSpeed = PHYS.moveSpeed * st.speed;
      // Encharcado deixa lento só no chão (no ar ainda dá para voltar para a ilha)
      if (p.status.encharcado && p.onGround) maxSpeed *= 1 - p.status.encharcado.slow;
      if (p.attack && p.onGround) maxSpeed *= 0.5;
      const ice = p.onGround && p.onIce;
      if (ice) maxSpeed *= ICE.speed;

      if (dir !== 0) {
        const accel = p.onGround ? PHYS.groundAccel * (ice ? ICE.accel : 1) : PHYS.airAccel;
        p.vx = approach(p.vx, dir * maxSpeed, accel * DT);
      } else {
        const friction = p.onGround ? PHYS.groundFriction * (ice ? ICE.friction : 1) : PHYS.airDrag;
        p.vx = approach(p.vx, 0, friction * DT);
      }

      // Parede: no ar, segurando para o lado dela = se pendura e escorrega.
      const grabbing = !p.onGround && dir !== 0 && this.touchingWall(p, dir);
      if (grabbing && p.onWall !== dir) {
        p.wallHang = PHYS.wallHangTime;
        p.airDashes = statsOf(p).airDashes;
        p.airLunges = 1;
        this.emit('wallGrab', { id: p.id, side: dir, x: p.x + (dir > 0 ? p.w : 0), y: p.y + 20 });
      }
      p.onWall = grabbing ? dir : 0;

      if (pressed('up') && p.onWall) {
        // Pulo de parede: não gasta os pulos normais.
        const away = -p.onWall;
        p.vy = -PHYS.wallJumpSpeed;
        p.vx = away * PHYS.wallJumpPush;
        p.facing = away;
        p.onWall = 0;
        p.wallJumpLock = PHYS.wallJumpLock;
        jumped = true;
        this.emit('wallJump', { id: p.id, x: p.x + (away > 0 ? 0 : p.w), y: p.y + 30 });
      } else if (pressed('up') && p.jumpsLeft > 0) {
        const fromGround = p.onGround;
        p.vy = -(fromGround ? PHYS.jumpSpeed : PHYS.doubleJumpSpeed) * st.jump;
        p.jumpsLeft--;
        p.onGround = false;
        jumped = true;
        this.emit('jump', { id: p.id, double: !fromGround, x: p.x + p.w / 2, y: p.y + p.h });
      }

      if (pressed('down') && p.onGround && p.standingOn === 'platform') {
        p.dropTimer = 0.22;
        p.onGround = false;
        this.emit('drop', { id: p.id });
      }

      // dash: o aperto também fica guardado um instante
      if (pressed('dash')) p.dashBuffer = PHYS.dashBuffer;
      if (p.dashBuffer > 0 && this.dashReady(p)) {
        p.dashBuffer = 0;
        this.startDash(p, input);
      }
      // o aperto de "bater" fica guardado um instante: se apertar no fim do
      // golpe anterior, o próximo sai assim que liberar (os bots nunca perdem
      // um aperto; sem isso quem joga de verdade bate mais devagar que eles)
      if (pressed('attack')) p.attackBuffer = PLAYER.attackBuffer;
      if (p.attackBuffer > 0 && p.cooldown <= 0 && !p.attack) {
        p.attackBuffer = 0;
        this.startAttack(p);
      }
      if (pressed('throw') && p.weapon) this.throwWeapon(p);
      else if (pressed('throw') && p.snowballs > 0) this.throwSnowball(p);
    } else {
      p.onWall = 0;
      p.attackBuffer = 0;   // apanhando: o aperto guardado não vale
      p.dashBuffer = 0;
      p.vx = approach(p.vx, 0, PHYS.hitstunDrag * DT);
    }

    if (p.attack) {
      p.attack.t += DT;
      if (!p.attack.fired && p.attack.t >= p.attack.startup) {
        p.attack.fired = true;
        this.fireAttack(p);
      }
      if (p.attack && p.attack.t >= p.attack.duration) p.attack = null;
    }

    if (p.lungeTime > 0) {
      // Investida da lança: reto para a frente, sem gravidade
      p.lungeTime -= DT;
      p.vx = p.lungeVx;
      p.vy = 0;
      if (p.lungeTime <= 0) {
        p.lungeTime = 0;
        p.vx = p.lungeVx * 0.35;
      }
    } else if (p.dashTime > 0) {
      // Dash: velocidade fixa na direção escolhida, sem gravidade
      p.dashTime -= DT;
      p.vx = p.dashVx;
      p.vy = p.dashVy;
      if (p.dashTime <= 0) {
        p.dashTime = 0;
        p.vx = p.dashVx * 0.45;
        p.vy = p.dashVy * 0.35;
      }
    } else if (p.onWall && p.vy >= 0) {
      // Pendurado: fica parado um instante e depois escorrega devagar.
      if (p.wallHang > 0) {
        p.wallHang -= DT;
        p.vy = 0;
      } else {
        p.vy = Math.min(p.vy + PHYS.gravity * this.gravity * DT, PHYS.wallSlideSpeed);
      }
    } else {
      // logo depois de descer de uma plataforma não acelera a queda (senão
      // atravessa também a plataforma de baixo)
      const fastFalling = control && input.down && !p.onGround && p.vy > 0 && p.dropTimer <= 0;
      p.vy = Math.min(p.vy + PHYS.gravity * this.gravity * DT, (fastFalling ? PHYS.fastFall : PHYS.maxFall) * Math.sqrt(this.gravity));
      if (fastFalling) p.vy = Math.max(p.vy, PHYS.maxFall * 0.8 * Math.sqrt(this.gravity));
    }

    this.applyWind(p);
    this.moveAndCollide(p);
    if (p.lungeTime > 0 && p.attack?.fired) this.lungeHits(p, weaponProfile(p.attack.weapon, p.element));

    if (p.onGround) {
      if (!wasOnGround) this.emit('land', { id: p.id, x: p.x + p.w / 2, y: p.y + p.h });
      p.jumpsLeft = PHYS.maxJumps;
      p.airDashes = statsOf(p).airDashes;
      p.airLunges = 1;
    } else if (wasOnGround && !jumped) {
      // Saiu do chão sem pular (andou para fora da borda): perde o pulo do chão.
      p.jumpsLeft = Math.min(p.jumpsLeft, PHYS.maxJumps - 1);
    }

    this.checkHazards(p);
    if (p.state !== 'alive') return;
    this.checkBlastZone(p);
    if (p.state !== 'alive') return;
    this.checkPickup(p);
  }

  // Tem parede sólida encostada no lado `dir` (-1 esquerda, 1 direita)?
  touchingWall(p, dir) {
    const probe = { x: dir > 0 ? p.x + p.w : p.x - 2, y: p.y + 12, w: 2, h: p.h - 24 };
    return this.solidsNow().some((s) => rectsOverlap(probe, s));
  }

  moveAndCollide(p) {
    const solids = this.solidsNow();
    const platforms = this.platforms;
    const grounded = p.onGround;

    const mvx = p.vx + p.windVx;
    p.x += mvx * DT;
    for (const s of solids) {
      if (!rectsOverlap(p, s)) continue;
      // pé só encostando no chão (diferença de arredondamento, ex.: navio
      // subindo e descendo) não é parede
      if (p.y + p.h - s.y < 0.05) continue;
      // pé só um pouquinho abaixo do topo (degrau, ou o chão do navio subiu
      // embaixo de quem estava no ar, num dash por exemplo): fica em cima
      // em vez de ser empurrado para a ponta do bloco
      if (p.vy >= 0 && p.y + p.h - s.y <= STEP_UP) {
        p.y = s.y - p.h;
        continue;
      }
      // bateu de lado: volta para o lado de onde veio. Se já estava dentro
      // do bloco (o chão subiu embaixo dele), sai pelo lado mais perto, em
      // vez de ir parar na outra ponta do bloco
      const prevX = p.x - mvx * DT;
      const cameLeft = prevX + p.w <= s.x + 0.5;
      const cameRight = prevX >= s.x + s.w - 0.5;
      if (mvx > 0 && cameLeft) p.x = s.x - p.w;
      else if (mvx < 0 && cameRight) p.x = s.x + s.w;
      else {
        const left = p.x + p.w - s.x;
        const right = s.x + s.w - p.x;
        const up = p.y + p.h - s.y;
        if (up <= left && up <= right) {
          p.y = s.y - p.h;
          continue;
        }
        p.x = left < right ? s.x - p.w : s.x + s.w;
      }
      p.vx = 0;
      p.windVx = 0;
    }

    const prevBottom = p.y + p.h;
    p.y += p.vy * DT;
    p.onGround = false;
    p.standingOn = null;
    p.onIce = false;
    for (const s of solids) {
      if (!rectsOverlap(p, s)) continue;
      if (p.vy > 0) {
        if (s.ice && this.lake) this.lake.impact(p, p.vy);
        p.y = s.y - p.h;
        p.onGround = true;
        p.standingOn = 'solid';
        p.onIce = Boolean(s.ice);
      } else if (p.vy < 0) {
        p.y = s.y + s.h;
      }
      p.vy = 0;
    }

    // descendo uma rampa (degrauzinhos): continua grudado no chão em vez de
    // cair degrau por degrau
    if (!p.onGround && grounded && p.vy >= 0) {
      const feet = p.y + p.h;
      let snap = null;
      for (const s of solids) {
        if (!s.ramp || p.x + p.w <= s.x || p.x >= s.x + s.w) continue;
        if (s.y >= feet - 0.05 && s.y - feet <= STEP_UP && (snap === null || s.y < snap)) snap = s.y;
      }
      if (snap !== null) {
        p.y = snap - p.h;
        p.vy = 0;
        p.onGround = true;
        p.standingOn = 'solid';
      }
    }

    if (p.vy >= 0 && p.dropTimer <= 0) {
      const bottom = p.y + p.h;
      for (const pl of platforms) {
        if (this.platformGone(pl)) continue;
        // compara com onde a plataforma estava (ela pode ter subido neste passo)
        // andando no chão, também sobe numa plataforma um pouquinho mais alta
        const step = grounded && p.vy >= 0 ? STEP_UP : 0.5;
        const crossing = prevBottom <= Math.max(pl.y, pl.y - pl.dy) + step && bottom >= pl.y;
        const inside = p.x + p.w > pl.x && p.x < pl.x + pl.w;
        if (crossing && inside) {
          p.y = pl.y - p.h;
          p.vy = 0;
          p.onGround = true;
          p.standingOn = 'platform';
          p.platform = platforms.indexOf(pl);
          p.onIce = Boolean(pl.ice);
        }
      }
    }
  }

  updateStatus(p) {
    const burn = p.status.queimadura;
    if (burn) {
      const dmg = burn.dps * DT;
      p.damage += dmg;
      p.stats.damageTaken += dmg;
      const source = this.playerById(burn.source);
      if (source) source.stats.damageDealt += dmg;
      // A queimadura mantém o crédito da kill com quem acendeu o fogo.
      p.lastHitBy = burn.source;
      p.lastHitTime = this.time;
      burn.time -= DT;
      if (burn.time <= 0) p.status.queimadura = null;
    }
    for (const key of ['encharcado', 'atordoado']) {
      const st = p.status[key];
      if (!st) continue;
      st.time -= DT;
      if (st.time <= 0) p.status[key] = null;
    }
  }

  applyStatus(target, status, sourceId) {
    if (!status) return;
    // Fogo não queima quem é de fogo; água não encharca quem é de água.
    if (status.type === 'queimadura' && target.element === 'fogo') return;
    if (status.type === 'encharcado' && target.element === 'agua') return;
    // Terra é firme demais para ficar atordoado.
    if (status.type === 'atordoado' && target.element === 'terra') return;
    // Água apaga a queimadura e vice-versa.
    if (status.type === 'encharcado') target.status.queimadura = null;
    if (status.type === 'queimadura') target.status.encharcado = null;
    target.status[status.type] = { ...status, time: status.duration, source: sourceId };
  }

  // ------------------------------------------------ vento
  // Rajadas aparecem em lugares aleatórios: primeiro um aviso, depois
  // empurram para fora da ilha (para o lado mais perto da borda).

  updateWinds() {
    const cfg = this.map.wind;
    if (!cfg) return;
    for (const w of this.winds) {
      w.time -= DT;
      if (w.state === 'aviso' && w.time <= 0) {
        w.state = 'ativo';
        w.time = w.stream ? cfg.stream.active : cfg.active;
        this.emit('windStart', { windId: w.id });
      }
    }
    const before = this.winds.length;
    this.winds = this.winds.filter((w) => w.state === 'aviso' || w.time > 0);
    if (this.winds.length < before) this.emit('windEnd');

    if (cfg.stream) this.updateStream(cfg.stream);

    this.nextWindIn -= DT;
    if (this.nextWindIn > 0) return;
    this.nextWindIn = this.rng.range(cfg.every[0], cfg.every[1]);
    if (this.winds.filter((w) => !w.stream).length >= cfg.max) return;
    const surface = this.rng.pick(cfg.surfaces);
    const x = Math.round(this.rng.range(surface.x0, Math.max(surface.x0, surface.x1 - cfg.w)));
    const zone = {
      id: this.nextEntityId++,
      x, y: surface.y - cfg.h, w: cfg.w, h: cfg.h,
      dir: x + cfg.w / 2 < this.map.width / 2 ? -1 : 1,
      state: 'aviso',
      time: cfg.warn,
    };
    this.winds.push(zone);
    this.emit('windWarn', { windId: zone.id, x: zone.x, y: zone.y, w: zone.w, h: zone.h, dir: zone.dir });
  }

  // Corrente de vento: uma faixa que atravessa o mapa inteiro, de ponta a
  // ponta, numa das alturas da lista (uma de cada vez)
  updateStream(sc) {
    this.nextStreamIn -= DT;
    if (this.nextStreamIn > 0) return;
    this.nextStreamIn = this.rng.range(sc.every[0], sc.every[1]);
    if (this.winds.some((w) => w.stream)) return;
    // vai bem além das bordas do mapa, para não acabar "no meio do nada"
    // quando a câmera se afasta
    const { left, right } = this.map.blast;
    const extra = 1400;
    const y = this.rng.pick(sc.bands);
    const zone = {
      id: this.nextEntityId++,
      x: left - extra, y, w: right - left + extra * 2, h: sc.h,
      dir: this.rng.chance(0.5) ? 1 : -1,
      state: 'aviso',
      time: sc.warn,
      stream: true,
      strength: sc.strength,
    };
    this.winds.push(zone);
    this.emit('windWarn', { windId: zone.id, x: zone.x, y: zone.y, w: zone.w, h: zone.h, dir: zone.dir, stream: true });
  }

  applyWind(p) {
    let target = 0;
    const cfg = this.map.wind;
    if (cfg && !p.admin && hazardReaction(p.element, 'vento') !== 'imune') {
      for (const w of this.winds) {
        if (w.state === 'ativo' && rectsOverlap(p, w)) target += w.dir * (w.strength ?? cfg.strength) * (WIND_FACTOR[p.element] ?? 1);
      }
    }
    // nevasca do Lago Congelado (na diagonal, para baixo)
    if (this.lake && !p.admin && hazardReaction(p.element, 'vento') !== 'imune') {
      target += this.lake.blizzardPush(p, WIND_FACTOR[p.element] ?? 1);
    }
    // convés do Navio Voador inclinando: escorrega um pouco
    if (this.ships && !p.admin) target += this.ships.slidePush(p);
    p.windVx = approach(p.windVx, target, 1800 * DT);
  }

  // Tornado: puxa os inimigos que estão por perto
  pullTowards(pr, owner) {
    const profile = weaponProfile(pr.weapon, pr.element);
    if (!profile.pull) return;
    const { radius, strength } = profile.pull;
    for (const t of this.players) {
      if (!this.canHit(owner, t)) continue;
      const dx = pr.x - (t.x + t.w / 2);
      const dy = pr.y - (t.y + t.h / 2);
      if (dx * dx + dy * dy > radius * radius) continue;
      t.vx = approach(t.vx, Math.sign(dx) * 260, strength * DT);
    }
  }

  checkHazards(p) {
    const wasIn = p.inHazard;
    p.inHazard = null;
    if (p.admin) return; // modo ADM: atravessa lava, água e espinhos
    for (const h of this.hazardsNow()) {
      // Margem de 4px para não morrer por encostar um pixel na borda.
      if (!rectsOverlap(p, h, 4)) continue;
      const reaction = hazardReaction(p.element, h.type);
      if (reaction === 'dano') {
        // Espinhos: não matam, mas espetam enquanto você fica em cima
        // (dps por segundo, aplicado de meio em meio segundo; o primeiro
        // espeto é na hora que encosta).
        p.inHazard = h.type;
        if (p.spikeTimer <= 0) {
          const amount = (HAZARDS[h.type].dps ?? 0) * SPIKE_TICK;
          p.damage += amount;
          p.stats.damageTaken += amount;
          p.spikeTimer = SPIKE_TICK;
          this.emit('hazardHurt', { id: p.id, hazard: h.type, amount, x: p.x + p.w / 2, y: p.y + p.h - 8 });
        }
        continue;
      }
      if (reaction === 'imune') {
        p.inHazard = h.type;
        if (wasIn !== h.type) this.emit('hazardEnter', { id: p.id, hazard: h.type });
        // Elemento imune "lava" o status contrário (fogo na lava não fica encharcado).
        if (h.type === 'lava') p.status.encharcado = null;
        if (h.type === 'agua') p.status.queimadura = null;
      } else {
        this.knockOut(p, h.type);
        return;
      }
    }
  }

  // Só cair lá embaixo tira vida: para os lados e para cima não tem limite
  // (quem é arremessado para o lado continua voando e acaba caindo)
  checkBlastZone(p) {
    if (p.y > this.map.blast.bottom) this.knockOut(p, 'queda');
  }

  checkPickup(p) {
    if (p.weapon || p.pickupCooldown > 0 || p.dummy) return;
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (!rectsOverlap(p, item)) continue;
      p.weapon = { id: item.weapon, uses: item.uses ?? WEAPONS[item.weapon].uses };
      this.items.splice(i, 1);
      p.stats.pickups++;
      const profile = weaponProfile(item.weapon, p.element);
      this.emit('pickup', { id: p.id, weapon: item.weapon, name: profile.name, x: item.x + item.w / 2, y: item.y });
      return;
    }
  }

  knockOut(p, cause) {
    if (p.state !== 'alive') return;
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    if (!this.practice && !this.mode.hill) p.lives--;
    p.stats.deaths++;
    if (cause === 'queda') p.stats.falls++;
    else p.stats.hazardDeaths++;

    let killer = null;
    if (p.lastHitBy !== null && this.time - p.lastHitTime <= PLAYER.killCreditTime) {
      const k = this.playerById(p.lastHitBy);
      if (k && k.team !== p.team) {
        killer = k;
        k.stats.kills++;
      }
    }

    this.emit('ko', {
      id: p.id, cause, killer: killer?.id ?? null, livesLeft: p.lives,
      x: Math.max(20, Math.min(this.map.width - 20, cx)),
      y: Math.max(20, Math.min(this.map.height - 20, cy)),
      element: p.element,
    });

    p.weapon = null;
    p.snowballs = 0;
    p.attack = null;
    p.status = { queimadura: null, encharcado: null, atordoado: null };
    p.windVx = 0;
    p.damage = 0;
    p.vx = 0;
    p.vy = 0;
    p.hitstun = 0;
    p.lastHitBy = null;
    p.inHazard = null;
    p.onWall = 0;
    p.dashTime = 0;
    p.lungeTime = 0;

    if (p.lives > 0) {
      p.state = 'respawning';
      p.respawnTimer = this.practice ? 0.8 : PLAYER.respawnTime;
    } else {
      p.state = 'out';
      this.emit('eliminated', { id: p.id });
    }
  }

  respawn(p) {
    // no treino, volta no ponto marcado (ex.: começo da etapa do tutorial)
    const s = (this.practice && p.checkpoint) || this.map.respawns[this.respawnIndex++ % this.map.respawns.length];
    p.x = s.x - p.w / 2;
    p.y = s.y - p.h;
    p.px = p.x;
    p.py = p.y;
    p.vx = 0;
    p.vy = 0;
    p.state = 'alive';
    p.invuln = this.practice ? 0.6 : PLAYER.invulnTime;
    p.jumpsLeft = PHYS.maxJumps;
    p.airDashes = statsOf(p).airDashes;
    p.airLunges = 1;
    p.dashTime = 0;
    p.lungeTime = 0;
    p.cooldown = 0;
    p.dropTimer = 0;
    p.onWall = 0;
    this.emit('respawn', { id: p.id, x: s.x, y: s.y });
  }

  // ---------------------------------------------------------------- combate

  canHit(attacker, target) {
    // Modo ADM (testes): o jogador ADM é intangível, nada acerta ele
    return target !== attacker && target.state === 'alive' && target.invuln <= 0 && target.team !== attacker.team && !target.admin;
  }

  // Dash na direção segurada (8 direções); sem direção, vai para a frente.
  // Dá para dar dash agora? No chão espera o intervalo inteiro; no ar libera
  // logo depois que o dash anterior termina (dash no chão, pulo, dash no ar),
  // mas só enquanto ainda tem dash no ar
  dashReady(p) {
    if (p.onGround) return p.dashCooldown <= 0;
    return p.airDashes > 0 && p.dashCooldown <= PHYS.dashCooldown - PHYS.airDashGap;
  }

  startDash(p, input) {
    let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    if (dx === 0 && dy === 0) dx = p.facing;
    if (p.onGround && dy > 0) return;   // não dá para "furar" o chão
    const len = Math.hypot(dx, dy);
    p.dashVx = (dx / len) * PHYS.dashSpeed;
    p.dashVy = (dy / len) * PHYS.dashSpeed * 0.85;
    p.dashTime = PHYS.dashTime;
    p.dashCooldown = PHYS.dashCooldown;
    if (dx !== 0) p.facing = Math.sign(dx);
    if (!p.onGround) p.airDashes--;
    p.onWall = 0;
    p.attack = null;
    p.lungeTime = 0;
    this.emit('dash', { id: p.id, x: p.x + p.w / 2, y: p.y + p.h / 2, dx: dx / len, dy: dy / len });
  }

  startAttack(p) {
    const weaponId = p.weapon?.id ?? null;
    const profile = weaponProfile(weaponId, p.element);
    p.attack = { weapon: weaponId, kind: profile.kind, t: 0, fired: false, startup: profile.startup, duration: profile.duration };
    p.cooldown = profile.cooldown;
    this.emit('attack', { id: p.id, weapon: weaponId, kind: profile.kind });
  }

  fireAttack(p) {
    const weaponId = p.attack.weapon;
    const profile = weaponProfile(weaponId, p.element);

    if (profile.kind === 'melee' && profile.lunge) {
      // Lança: avança com a ponta para a frente (no ar, só 1 vez por pulo)
      p.attack.hitIds = [];
      if (p.onGround || p.airLunges > 0) {
        if (!p.onGround) p.airLunges--;
        p.lungeTime = profile.lunge.time;
        p.lungeVx = p.facing * profile.lunge.speed;
        p.attack.duration = Math.max(p.attack.duration, p.attack.startup + profile.lunge.time + 0.08);
        p.dashTime = 0;
        p.onWall = 0;
        this.emit('lunge', { id: p.id, x: p.x + p.w / 2, y: p.y + p.h * 0.45, dir: p.facing, element: p.element });
      }
      this.lungeHits(p, profile);
    } else if (profile.kind === 'melee') {
      const reach = profile.reach * p.size;
      const box = {
        x: p.facing > 0 ? p.x + p.w - 6 : p.x + 6 - reach,
        y: p.y + p.h * 0.42 - (profile.height * p.size) / 2,
        w: reach,
        h: profile.height * p.size,
      };
      p.attack.box = box;
      for (const t of this.players) {
        if (this.canHit(p, t) && rectsOverlap(box, t)) this.applyHit(p, t, profile, p.facing);
      }
      // marretão: a pancada faz uma onda de choque no chão à frente
      if (profile.slam) this.emit('hammerSlam', { id: p.id, element: p.element, x: p.x + p.w / 2 + p.facing * profile.reach * 0.7, y: p.y + p.h, dir: p.facing });
    } else {
      const pr = profile.projectile;
      this.projectiles.push({
        id: this.nextEntityId++,
        kind: 'magia',
        owner: p.id,
        team: p.team,
        element: p.element,
        weapon: weaponId,
        x: p.x + p.w / 2 + p.facing * 26,
        y: p.y + 24,
        vx: p.facing * pr.speed,
        vy: 0,
        r: pr.radius,
        gravity: pr.gravity,
        life: pr.life,
        pierce: pr.pierce,
        hitIds: [],
      });
      this.emit('shoot', { id: p.id, weapon: weaponId, element: p.element, x: p.x + p.w / 2 + p.facing * 26, y: p.y + 24 });
    }

    if (p.weapon) {
      p.weapon.uses--;
      if (p.weapon.uses <= 0) {
        this.emit('weaponBreak', { id: p.id, weapon: p.weapon.id, x: p.x + p.w / 2, y: p.y + 20 });
        p.weapon = null;
      }
    }
  }

  // Ponta da lança: acerta quem estiver na frente (cada um uma vez por golpe);
  // acertou alguém, a investida para ali
  lungeHits(p, profile) {
    const reach = profile.reach * p.size;
    const box = {
      x: p.facing > 0 ? p.x + p.w - 4 : p.x + 4 - reach,
      y: p.y + p.h * 0.45 - (profile.height * p.size) / 2,
      w: reach,
      h: profile.height * p.size,
    };
    p.attack.box = box;
    for (const t of this.players) {
      if (p.attack.hitIds.includes(t.id) || !this.canHit(p, t) || !rectsOverlap(box, t)) continue;
      p.attack.hitIds.push(t.id);
      this.applyHit(p, t, profile, p.facing);
      if (p.lungeTime > 0) {
        p.lungeTime = 0;
        p.vx = p.lungeVx * 0.15;
      }
    }
  }

  throwWeapon(p) {
    const weaponId = p.weapon.id;
    const uses = p.weapon.uses;
    p.weapon = null;
    p.attack = null;
    p.pickupCooldown = PLAYER.pickupCooldown;
    this.projectiles.push({
      id: this.nextEntityId++,
      kind: 'arremesso',
      owner: p.id,
      team: p.team,
      element: p.element,
      weapon: weaponId,
      uses,
      x: p.x + p.w / 2 + p.facing * 20,
      y: p.y + 22,
      vx: p.facing * THROWN.speed + p.vx * 0.3,
      vy: -160,
      r: 14,
      gravity: THROWN.gravity,
      life: 2.5,
      pierce: false,
      hitIds: [],
    });
    this.emit('throw', { id: p.id, weapon: weaponId });
  }

  // Bola de neve (Lago Congelado): sai da mão sem ocupar a arma
  throwSnowball(p) {
    const cfg = LAKE.snowball;
    p.snowballs--;
    this.projectiles.push({
      id: this.nextEntityId++,
      kind: 'neve',
      owner: p.id,
      team: p.team,
      element: p.element,
      weapon: null,
      x: p.x + p.w / 2 + p.facing * 18,
      y: p.y + 24,
      vx: p.facing * cfg.speed + p.vx * 0.3,
      vy: cfg.lift,
      r: cfg.r,
      gravity: cfg.gravity,
      life: 2,
      pierce: false,
      hitIds: [],
    });
    this.emit('throw', { id: p.id, weapon: 'neve' });
  }

  applyHit(attacker, target, profile, dirX, scale = {}) {
    // o Mortal (sem elemento) bate mais forte: stats.damage
    const damage = attacker.admin ? PLAYER.adminDamage : profile.damage * (scale.damage ?? 1) * statsOf(attacker).damage;
    target.damage += damage;
    target.stats.damageTaken += damage;
    attacker.stats.damageDealt += damage;
    attacker.stats.hits++;

    const kb = ((profile.kbBase + target.damage * profile.kbScale) * (scale.kb ?? 1)) / statsOf(target).weight;
    const angle = profile.angle;
    this.lake?.strongHit(target, kb);
    target.vx = dirX * kb * Math.cos(angle);
    target.vy = Math.min(-kb * Math.sin(angle), -180);
    target.onGround = false;
    target.hitstun = 0.12 + kb * 0.00035;
    target.attack = null;
    target.lastHitBy = attacker.id;
    target.lastHitTime = this.time;
    target.jumpsLeft = Math.max(target.jumpsLeft, 1);
    // Levar golpe interrompe o dash e a investida, mas não devolve o que já gastou.
    target.dashTime = 0;
    target.lungeTime = 0;
    this.applyStatus(target, profile.status, attacker.id);

    this.emit('hit', {
      attacker: attacker.id, target: target.id, damage, kb,
      element: attacker.element, weapon: profile.id, src: profile.src ?? 'golpe',
      stun: profile.status?.type === 'atordoado' && target.status.atordoado != null,
      x: target.x + target.w / 2, y: target.y + target.h * 0.4,
    });
  }

  // Disparos de elementos diferentes se encontrando no ar se combinam:
  // fogo + água viram vapor (os dois somem); nos outros pares o disparo mais
  // forte continua e ganha o efeito do outro (ver COMBOS)
  combineProjectiles() {
    const list = this.projectiles.filter((p) => p.kind === 'magia' && !p.gone && !p.combo);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (a.gone || b.gone || a.combo || b.combo || a.element === b.element) continue;
        // disparo sem elemento (Mortal) não combina com nada
        if (!COMBO_CARRIER.includes(a.element) || !COMBO_CARRIER.includes(b.element)) continue;
        const reach = (a.r + b.r) * 0.9;
        if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 > reach * reach) continue;
        const x = (a.x + b.x) / 2;
        const y = (a.y + b.y) / 2;
        const pair = [a.element, b.element].sort().join('+');
        if (pair === 'agua+fogo') {
          a.gone = true;
          b.gone = true;
          this.emit('combo', { kind: 'vapor', x, y });
          continue;
        }
        const keep = COMBO_CARRIER.indexOf(a.element) < COMBO_CARRIER.indexOf(b.element) ? a : b;
        const lost = keep === a ? b : a;
        lost.gone = true;
        keep.combo = lost.element;
        this.emit('combo', { kind: COMBO_NAMES[pair], x, y, carrier: keep.element, with: lost.element, id: keep.id });
      }
    }
  }

  updateProjectiles() {
    this.combineProjectiles();
    const keep = [];
    for (const pr of this.projectiles) {
      if (pr.gone) continue;
      pr.vy += pr.gravity * DT;
      pr.x += pr.vx * DT;
      pr.y += pr.vy * DT;
      pr.life -= DT;
      let alive = pr.life > 0;

      const owner = this.playerById(pr.owner);
      if (alive && pr.kind === 'magia') this.pullTowards(pr, owner);
      if (alive) {
        for (const t of this.players) {
          if (pr.hitIds.includes(t.id) || !this.canHit(owner, t)) continue;
          if (!circleRectOverlap(pr.x, pr.y, pr.r, t)) continue;
          pr.hitIds.push(t.id);
          const dir = Math.sign(pr.vx) || owner.facing;
          if (pr.kind === 'neve') {
            this.lake?.snowHit(owner, t, dir);
          } else if (pr.kind === 'arremesso') {
            this.applyHit(owner, t, { id: pr.weapon, ...THROWN, damage: WEAPONS[pr.weapon].throwDamage, src: 'arremesso' }, dir);
          } else {
            const profile = weaponProfile(pr.weapon, pr.element);
            this.applyHit(owner, t, { ...profile, src: 'magia' }, dir);
            // disparo combinado: também aplica o efeito do outro elemento
            if (pr.combo) this.applyStatus(t, COMBO_STATUS[pr.combo], owner.id);
          }
          if (!pr.pierce) {
            alive = false;
            pr.hitSomeone = true;
            break;
          }
        }
      }

      if (alive && this.solidsNow().some((s) => circleRectOverlap(pr.x, pr.y, pr.r * 0.6, s))) alive = false;

      const b = this.map.blast;
      const outside = pr.x < b.left || pr.x > b.right || pr.y > b.bottom;
      if (outside) alive = false;

      if (alive) {
        keep.push(pr);
      } else {
        if (pr.kind === 'magia') this.explodeProjectile(pr, owner);
        // arma arremessada que não acertou ninguém nem saiu do mapa cai no
        // chão e pode ser pega de novo, com as mesmas cargas
        if (pr.kind === 'arremesso' && !pr.hitSomeone && !outside) this.dropWeapon(pr);
        this.emit('projectileEnd', { kind: pr.kind, element: pr.element, weapon: pr.weapon, x: pr.x, y: pr.y });
      }
    }
    this.projectiles = keep;
  }

  // Treino livre: troca o elemento do jogador no meio da luta (os números
  // do elemento são lidos na hora, então só precisa ajustar o que fica
  // guardado: dashes no ar e efeitos que o novo elemento não sofre)
  setElement(id, element) {
    const p = this.playerById(id);
    if (!p || !ELEMENTS[element] || p.element === element) return false;
    p.element = element;
    p.airDashes = statsOf(p).airDashes;
    p.status = { queimadura: null, encharcado: null, atordoado: null };
    p.inHazard = null;
    this.emit('elementSwap', { id, element, x: p.x + p.w / 2, y: p.y + p.h / 2 });
    return true;
  }

  // Treino livre: cria uma arma caindo em (x, y), pronta para pegar
  spawnWeaponAt(weapon, x, y) {
    const item = {
      id: this.nextEntityId++, weapon, uses: WEAPONS[weapon].uses,
      dropped: true, thrown: true, dir: 1,
      x: Math.round(x - 17), y: Math.round(y - 15), w: 34, h: 30,
      landed: false, life: 999,
    };
    this.items.push(item);
    this.emit('weaponDrop', { itemId: item.id, weapon, x, y });
    return item;
  }

  // Arma caída (sem ser de time nenhum): cai rápido até o chão
  dropWeapon(pr) {
    let x = pr.x;
    let y = pr.y;
    // se entrou na parede, volta um pouco para fora dela
    for (const s of this.solidsNow()) {
      if (!circleRectOverlap(x, y, pr.r * 0.6, s)) continue;
      if (y < s.y + 14) y = s.y - 16;
      else x -= Math.sign(pr.vx || 1) * 24;
    }
    const item = {
      id: this.nextEntityId++,
      weapon: pr.weapon,
      uses: pr.uses ?? WEAPONS[pr.weapon].uses,
      dropped: true,
      thrown: true,
      dir: Math.sign(pr.vx) || 1,   // lado para onde ia (a ponta fica para esse lado)
      x: Math.round(x - 17),
      y: Math.round(y - 15),
      w: 34,
      h: 30,
      landed: false,
      life: ITEMS.lifetime,
    };
    this.items.push(item);
    this.emit('weaponDrop', { itemId: item.id, weapon: item.weapon, x, y });
  }

  explodeProjectile(pr, owner) {
    const profile = weaponProfile(pr.weapon, pr.element);
    if (!profile.explosion) return;
    const { radius, damage } = profile.explosion;
    this.emit('explosion', { x: pr.x, y: pr.y, radius, element: pr.element });
    for (const t of this.players) {
      if (pr.hitIds.includes(t.id) || !this.canHit(owner, t)) continue;
      if (!circleRectOverlap(pr.x, pr.y, radius, t)) continue;
      const dir = Math.sign(t.x + t.w / 2 - pr.x) || 1;
      this.applyHit(owner, t, { ...profile, ...EXPLOSION_KB, damage, src: 'magia' }, dir);
    }
  }

  // ---------------------------------------------------------------- armas no chão

  spawnItems() {
    if (!this.itemsEnabled) return;
    this.nextItemIn -= DT;
    if (this.nextItemIn > 0) return;
    this.nextItemIn = this.rng.range(ITEMS.spawnMin, ITEMS.spawnMax);
    // armas arremessadas que ficaram no chão não contam no limite
    if (this.items.filter((i) => !i.thrown).length >= ITEMS.maxOnMap) return;
    const { minX, maxX } = this.map.itemSpawn;
    if (this.map.itemThrow) {
      // a torcida joga a arma: mira num pedaço de chão que existe agora
      const floor = this.rng.pick(this.solidsNow());
      this.throwItem(Math.round(this.rng.range(floor.x + 20, floor.x + floor.w - 54)), floor.y, pickWeapon(() => this.rng.next()));
      return;
    }
    this.dropCrate(Math.round(this.rng.range(minX, maxX)), pickWeapon(() => this.rng.next()));
  }

  hitByCrowd(p, item) {
    const dir = Math.sign(item.vx) || 1;
    const damage = CROWD_HIT.damage;
    p.damage += damage;
    p.stats.damageTaken += damage;
    const kb = (CROWD_HIT.kbBase + p.damage * CROWD_HIT.kbScale) / statsOf(p).weight;
    p.vx = dir * kb * Math.cos(CROWD_HIT.angle);
    p.vy = Math.min(-kb * Math.sin(CROWD_HIT.angle), -180);
    p.onGround = false;
    p.hitstun = 0.12 + kb * 0.00035;
    p.attack = null;
    p.dashTime = 0;
    p.lungeTime = 0;
    // quem levou a pancada não pega a arma no mesmo instante
    p.pickupCooldown = Math.max(p.pickupCooldown, 0.5);
    this.emit('hit', {
      attacker: null, target: p.id, damage, kb, element: 'mortal', weapon: item.weapon, crowd: true,
      x: p.x + p.w / 2, y: p.y + p.h * 0.4,
    });
  }

  // Arma arremessada da arquibancada (Coliseu): sai de um dos lados e cai
  // em arco em (x, chão), já pronta para pegar (sem caixa)
  throwItem(x, groundY, weapon) {
    const cfg = this.map.itemThrow;
    const fromLeft = this.rng.chance(0.5);
    const sx = fromLeft ? cfg.from[0] : cfg.from[1];
    const T = cfg.time;
    const item = {
      id: this.nextEntityId++, weapon, w: 34, h: 30,
      x: sx - 17, y: cfg.y - 15,
      vx: (x - sx) / T,
      vy: (groundY - cfg.y - 0.5 * ITEMS.throwGravity * T * T) / T,
      flying: true, dropped: true, landed: false,
      uses: WEAPONS[weapon].uses, dir: fromLeft ? 1 : -1,
      life: ITEMS.lifetime,
    };
    this.items.push(item);
    this.emit('itemThrown', { itemId: item.id, weapon, x: sx, y: cfg.y, fromLeft });
    return item;
  }

  // Solta uma caixa de paraquedas em `x` (o tutorial usa direto)
  dropCrate(x, weapon, life = ITEMS.lifetime) {
    const item = { id: this.nextEntityId++, weapon, x, y: this.map.itemSpawn.y, w: 34, h: 30, landed: false, life };
    this.items.push(item);
    this.emit('itemSpawn', { itemId: item.id, weapon: item.weapon, x: item.x });
    return item;
  }

  updateItems() {
    const keep = [];
    for (const item of this.items) {
      if (!item.landed) {
        const prevBottom = item.y + item.h;
        if (item.flying) {
          // jogada pela torcida: voa em arco; se acertar alguém no caminho,
          // dá dano, empurra e cai ali mesmo
          item.vy += ITEMS.throwGravity * DT;
          item.x += item.vx * DT;
          item.y += item.vy * DT;
          const victim = this.players.find((p) => p.state === 'alive' && p.invuln <= 0 && !p.admin && rectsOverlap(item, p));
          if (victim) {
            this.hitByCrowd(victim, item);
            item.flying = false;
            item.vx = 0;
            // cai a partir dos pés de quem levou (senão podia atravessar o chão)
            item.y = Math.min(item.y, victim.y + victim.h - item.h - 1);
          }
        } else {
          // caixote desce de paraquedas; arma caída despenca
          item.y += (item.dropped ? ITEMS.dropSpeed : ITEMS.fallSpeed) * DT;
        }
        const bottom = item.y + item.h;
        const surfaces = [...this.solidsNow(), ...this.platforms.filter((pl) => !this.platformGone(pl))];
        for (const s of surfaces) {
          const inside = item.x + item.w > s.x && item.x < s.x + s.w;
          if (inside && prevBottom <= s.y + 0.5 && bottom >= s.y && !(item.flying && item.vy < 0)) {
            item.y = s.y - item.h;
            item.landed = true;
            item.flying = false;
            item.platform = this.platforms.indexOf(s);
            if (!item.dropped) {
              // a caixa se quebra no chão e a arma fica caída, com as cargas cheias
              item.dropped = true;
              item.uses = WEAPONS[item.weapon].uses;
              item.dir = this.rng.chance(0.5) ? 1 : -1;
              this.emit('crateOpen', { itemId: item.id, weapon: item.weapon, x: item.x + item.w / 2, y: s.y });
            } else {
              this.emit('itemLand', { itemId: item.id, x: item.x + item.w / 2, y: s.y });
            }
            break;
          }
        }
      } else {
        item.life -= DT;
        const pl = this.platforms[item.platform];
        if (pl) {
          item.x += pl.dx;
          item.y += pl.dy;
        }
      }
      // arma caída na lava ou na água se perde
      const sunk = item.dropped && item.landed && this.hazardsNow().some((h) => (h.type === 'lava' || h.type === 'agua') && rectsOverlap(item, h));
      if (sunk) this.emit('itemLost', { itemId: item.id, x: item.x + item.w / 2, y: item.y + item.h / 2 });
      else if (item.life > 0 && item.y < this.map.blast.bottom) keep.push(item);
    }
    this.items = keep;
  }

  // ---------------------------------------------------------------- fim de jogo

  checkEnd() {
    if (this.practice) return;
    if (this.hill) {
      // Rei da Ilha: os pontos decidem (a área chama finish ao chegar no alvo)
      if (this.timeLimit > 0 && this.time >= this.timeLimit) this.finish(this.hill.winnerByPoints(), 'tempo');
      return;
    }
    const alive = new Set(this.players.filter((p) => p.state !== 'out').map((p) => p.team));
    if (alive.size <= 1) {
      this.finish(alive.size === 1 ? [...alive][0] : null, 'eliminacao');
      return;
    }
    if (this.timeLimit > 0 && this.time >= this.timeLimit) {
      // Tempo esgotado: vence o time com mais vidas; empate -> menos dano sofrido.
      const score = new Map();
      for (const p of this.players) {
        const s = score.get(p.team) ?? { lives: 0, damage: 0 };
        s.lives += p.state === 'out' ? 0 : p.lives;
        s.damage += p.state === 'out' ? 0 : p.damage;
        score.set(p.team, s);
      }
      const ranked = [...score.entries()].sort((a, b) => b[1].lives - a[1].lives || a[1].damage - b[1].damage);
      const [best, second] = ranked;
      const tie = second && best[1].lives === second[1].lives && Math.round(best[1].damage) === Math.round(second[1].damage);
      this.finish(tie ? null : best[0], 'tempo');
    }
  }

  // Jogador desistiu (saiu da partida): o time dele é eliminado na hora.
  forfeit(playerId) {
    const quitter = this.playerById(playerId);
    if (!quitter || this.phase === 'ended') return;
    for (const p of this.players) {
      if (p.team === quitter.team) {
        p.state = 'out';
        p.lives = 0;
      }
    }
    if (!this.result) {
      this.phase = 'playing';
      const alive = new Set(this.players.filter((p) => p.state !== 'out').map((p) => p.team));
      this.finish(alive.size === 1 ? [...alive][0] : null, 'desistencia');
      this.result.forfeitedBy = playerId;
    }
    this.phase = 'ended';
  }

  finish(winnerTeam, reason) {
    if (this.phase !== 'playing') return;
    this.phase = 'ending';
    this.phaseTimer = this.endDelay;
    this.result = {
      winnerTeam,
      reason,
      mode: this.mode.id,
      duration: this.time,
      hillScores: this.hill ? Object.fromEntries([...this.hill.scores].map(([t, v]) => [t, Math.floor(v)])) : null,
      players: this.players.map((p) => ({
        id: p.id, name: p.name, team: p.team, element: p.element, isBot: p.isBot,
        kills: p.stats.kills, deaths: p.stats.deaths, falls: p.stats.falls,
        hazardDeaths: p.stats.hazardDeaths,
        damageDealt: Math.round(p.stats.damageDealt), damageTaken: Math.round(p.stats.damageTaken),
        hits: p.stats.hits, pickups: p.stats.pickups, livesLeft: p.state === 'out' ? 0 : p.lives,
        damage: Math.round(p.damage),
        hillTime: Math.floor(p.stats.hillTime),
      })),
    };
    const winnerElement = winnerTeam !== null ? this.players.find((p) => p.team === winnerTeam)?.element ?? null : null;
    this.emit('matchEnd', { winnerTeam, reason, winnerElement, celebrate: this.celebrate });
  }
}

function createPlayer(cfg, index, lives) {
  return {
    id: cfg.id,
    name: cfg.name ?? `Jogador ${index + 1}`,
    element: cfg.element,
    team: cfg.team,
    isBot: Boolean(cfg.isBot),
    admin: Boolean(cfg.admin), // modo ADM (testes): cada golpe dá PLAYER.adminDamage
    skin: cfg.skin ?? null,    // visual especial do tutorial ('manequim', 'boneco')
    hat: cfg.hat ?? null,      // acessório na cabeça (colecionável, só visual)
    guardian: !!cfg.guardian,  // Guardião da Torre (aura e coroa de chifres)
    dummy: !!cfg.dummy,        // boneco de treino: não pega armas
    anchored: !!cfg.anchored,  // espantalho do treino: preso ao chão
    sway: 0, swayV: 0,         // balanço do espantalho na estaca
    checkpoint: null,          // treino: onde reaparece depois de cair
    slot: index,
    x: 0, y: 0, px: 0, py: 0,
    // tamanho (Guardião da Torre é 1,3x maior) e força extra
    size: cfg.size ?? 1,
    power: cfg.power ?? 1,
    w: PLAYER.width * (cfg.size ?? 1), h: PLAYER.height * (cfg.size ?? 1),
    vx: 0, vy: 0,
    facing: 1,
    onGround: false,
    standingOn: null,
    onIce: false,           // em pé em cima de gelo (escorrega)
    platform: -1,           // índice da plataforma onde está em pé
    jumpsLeft: PHYS.maxJumps,
    dropTimer: 0,
    onWall: 0,              // -1/1 = pendurado numa parede à esquerda/direita
    spikeTimer: 0,
    dashTime: 0,
    dashVx: 0,
    dashVy: 0,
    dashCooldown: 0,
    airDashes: ELEMENTS[cfg.element]?.stats?.airDashes ?? PHYS.airDashes,
    wallHang: 0,
    wallJumpLock: 0,
    lungeTime: 0,           // investida da lança acontecendo
    lungeVx: 0,
    airLunges: 1,           // investidas no ar até pisar no chão
    damage: 0,
    lives,
    state: 'alive',
    respawnTimer: 0,
    invuln: 0,
    hitstun: 0,
    cooldown: 0,
    attackBuffer: 0,        // tempo que o aperto de bater ainda fica guardado
    dashBuffer: 0,          // tempo que o aperto de dash ainda fica guardado
    attack: null,
    weapon: null,
    pickupCooldown: 0,
    status: { queimadura: null, encharcado: null, atordoado: null },
    windVx: 0,              // empurrão do vento (somado ao andar)
    snowballs: 0,           // bolas de neve na mão (Lago Congelado)
    inHazard: null,
    lastHitBy: null,
    lastHitTime: -Infinity,
    prevInput: { ...EMPTY_INPUT },
    stats: { kills: 0, deaths: 0, falls: 0, hazardDeaths: 0, damageDealt: 0, damageTaken: 0, hits: 0, pickups: 0, hillTime: 0 },
  };
}
