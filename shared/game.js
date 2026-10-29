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
import { WEAPONS, WEAPON_IDS, weaponProfile } from './weapons.js';
import { EMPTY_INPUT } from './input.js';
import { createRng } from './rng.js';
import { rectsOverlap, circleRectOverlap, approach } from './geometry.js';

// Espinhos espetam em "pancadas" a cada meio segundo (fica fácil de perceber)
const SPIKE_TICK = 0.5;
const NO_STATS = { speed: 1, jump: 1, weight: 1, airDashes: PHYS.airDashes };
const statsOf = (p) => ({ ...NO_STATS, ...ELEMENTS[p.element].stats });
// Quanto cada elemento sente o vento (Ar é imune pela tabela de perigos)
const WIND_FACTOR = { terra: 0.5 };

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
   */
  constructor(config) {
    const { players, mode = 'times', mapId, seed = 1, lives = PLAYER.lives, timeLimit = MATCH.timeLimit } = config;
    if (!MODES[mode]) throw new Error(`Modo desconhecido: ${mode}`);
    if (!Array.isArray(players) || players.length < 2) throw new Error('A partida precisa de pelo menos 2 jogadores');

    this.mode = MODES[mode];
    this.map = getMap(mapId);
    this.seed = seed;
    this.rng = createRng(seed);
    this.lives = lives;
    this.timeLimit = timeLimit;

    this.tick = 0;
    this.time = 0;               // tempo de luta (sem contar a contagem regressiva)
    this.phase = 'countdown';    // countdown -> playing -> ending -> ended
    this.phaseTimer = MATCH.countdown;
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
    // Plataformas com posição atual (algumas balançam presas a um balão)
    this.platforms = this.map.platforms.map((pl) => ({ ...pl, baseX: pl.x, baseY: pl.y, px: pl.x, py: pl.y, dx: 0, dy: 0 }));

    const seen = new Set();
    this.players = players.map((cfg, index) => {
      if (seen.has(cfg.id)) throw new Error(`Jogador repetido: ${cfg.id}`);
      seen.add(cfg.id);
      if (!ELEMENTS[cfg.element]) throw new Error(`Elemento desconhecido: ${cfg.element}`);
      // No "todos contra todos" cada jogador é seu próprio time.
      const team = this.mode.teams ? cfg.team : `solo-${cfg.id}`;
      if (team === undefined || team === null) throw new Error(`Jogador ${cfg.id} sem time`);
      return createPlayer({ ...cfg, team }, index, lives);
    });
    if (new Set(this.players.map((p) => p.team)).size < 2) {
      throw new Error('A partida precisa de pelo menos 2 times');
    }
    if (this.mode.teams) {
      const error = teamElementsError(this.players);
      if (error) throw new Error(error);
    }
    this.placeAtSpawns();
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
        damage: p.damage, lives: p.lives, state: p.state, invuln: p.invuln,
        hitstun: p.hitstun, onGround: p.onGround, onWall: p.onWall, windVx: p.windVx,
        dashTime: p.dashTime, airDashes: p.airDashes,
        weapon: p.weapon ? { ...p.weapon } : null,
        attack: p.attack ? { ...p.attack } : null,
        status: structuredClone(p.status),
      })),
      items: this.items.map((i) => ({ ...i })),
      winds: this.winds.map((w) => ({ ...w })),
      projectiles: this.projectiles.map((pr) => ({ ...pr, hitIds: [...pr.hitIds] })),
      platforms: this.platforms.map((pl) => ({ x: pl.x, y: pl.y })),
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
    for (const p of this.players) this.updatePlayer(p, inputs[p.id] ?? EMPTY_INPUT);
    this.updateProjectiles();
    this.updateItems();
    this.spawnItems();
    this.checkEnd();
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
    // quem está em cima vai junto
    for (const p of this.players) {
      if (p.state !== 'alive' || !p.onGround || p.standingOn !== 'platform') continue;
      const pl = this.platforms[p.platform];
      if (!pl) continue;
      p.x += pl.dx;
      p.y += pl.dy;
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
    p.hitstun = Math.max(0, p.hitstun - DT);
    p.pickupCooldown = Math.max(0, p.pickupCooldown - DT);
    p.dropTimer = Math.max(0, p.dropTimer - DT);
    p.wallJumpLock = Math.max(0, p.wallJumpLock - DT);
    p.spikeTimer = Math.max(0, p.spikeTimer - DT);
    p.dashCooldown = Math.max(0, p.dashCooldown - DT);
    this.updateStatus(p);
    // Modo ADM (testes): pulos e dashes no ar sem limite
    if (p.admin) {
      p.jumpsLeft = PHYS.maxJumps;
      p.airDashes = statsOf(p).airDashes;
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

      if (dir !== 0) {
        const accel = p.onGround ? PHYS.groundAccel : PHYS.airAccel;
        p.vx = approach(p.vx, dir * maxSpeed, accel * DT);
      } else {
        const friction = p.onGround ? PHYS.groundFriction : PHYS.airDrag;
        p.vx = approach(p.vx, 0, friction * DT);
      }

      // Parede: no ar, segurando para o lado dela = se pendura e escorrega.
      const grabbing = !p.onGround && dir !== 0 && this.touchingWall(p, dir);
      if (grabbing && p.onWall !== dir) {
        p.wallHang = PHYS.wallHangTime;
        p.airDashes = statsOf(p).airDashes;
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
      }

      if (pressed('dash') && p.dashCooldown <= 0 && (p.onGround || p.airDashes > 0)) this.startDash(p, input);
      if (pressed('attack') && p.cooldown <= 0 && !p.attack) this.startAttack(p);
      if (pressed('throw') && p.weapon) this.throwWeapon(p);
    } else {
      p.onWall = 0;
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

    if (p.dashTime > 0) {
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
        p.vy = Math.min(p.vy + PHYS.gravity * DT, PHYS.wallSlideSpeed);
      }
    } else {
      const fastFalling = control && input.down && !p.onGround && p.vy > 0;
      p.vy = Math.min(p.vy + PHYS.gravity * DT, fastFalling ? PHYS.fastFall : PHYS.maxFall);
      if (fastFalling) p.vy = Math.max(p.vy, PHYS.maxFall * 0.8);
    }

    this.applyWind(p);
    this.moveAndCollide(p);

    if (p.onGround) {
      if (!wasOnGround) this.emit('land', { id: p.id, x: p.x + p.w / 2, y: p.y + p.h });
      p.jumpsLeft = PHYS.maxJumps;
      p.airDashes = statsOf(p).airDashes;
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
    return this.map.solids.some((s) => rectsOverlap(probe, s));
  }

  moveAndCollide(p) {
    const { solids } = this.map;
    const platforms = this.platforms;

    const mvx = p.vx + p.windVx;
    p.x += mvx * DT;
    for (const s of solids) {
      if (!rectsOverlap(p, s)) continue;
      if (mvx > 0) p.x = s.x - p.w;
      else if (mvx < 0) p.x = s.x + s.w;
      p.vx = 0;
      p.windVx = 0;
    }

    const prevBottom = p.y + p.h;
    p.y += p.vy * DT;
    p.onGround = false;
    p.standingOn = null;
    for (const s of solids) {
      if (!rectsOverlap(p, s)) continue;
      if (p.vy > 0) {
        p.y = s.y - p.h;
        p.onGround = true;
        p.standingOn = 'solid';
      } else if (p.vy < 0) {
        p.y = s.y + s.h;
      }
      p.vy = 0;
    }

    if (p.vy >= 0 && p.dropTimer <= 0) {
      const bottom = p.y + p.h;
      for (const pl of platforms) {
        // compara com onde a plataforma estava (ela pode ter subido neste passo)
        const crossing = prevBottom <= Math.max(pl.y, pl.y - pl.dy) + 0.5 && bottom >= pl.y;
        const inside = p.x + p.w > pl.x && p.x < pl.x + pl.w;
        if (crossing && inside) {
          p.y = pl.y - p.h;
          p.vy = 0;
          p.onGround = true;
          p.standingOn = 'platform';
          p.platform = platforms.indexOf(pl);
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
    p.inHazard = null;
    if (p.admin) return; // modo ADM: atravessa lava, água e espinhos
    for (const h of this.map.hazards) {
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
        // Elemento imune "lava" o status contrário (fogo na lava não fica encharcado).
        if (h.type === 'lava') p.status.encharcado = null;
        if (h.type === 'agua') p.status.queimadura = null;
      } else {
        this.knockOut(p, h.type);
        return;
      }
    }
  }

  checkBlastZone(p) {
    const b = this.map.blast;
    if (p.x + p.w < b.left || p.x > b.right || p.y > b.bottom || p.y + p.h < b.top) {
      this.knockOut(p, 'queda');
    }
  }

  checkPickup(p) {
    if (p.weapon || p.pickupCooldown > 0) return;
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
    p.lives--;
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

    if (p.lives > 0) {
      p.state = 'respawning';
      p.respawnTimer = PLAYER.respawnTime;
    } else {
      p.state = 'out';
      this.emit('eliminated', { id: p.id });
    }
  }

  respawn(p) {
    const points = this.map.respawns;
    const s = points[this.respawnIndex++ % points.length];
    p.x = s.x - p.w / 2;
    p.y = s.y - p.h;
    p.px = p.x;
    p.py = p.y;
    p.vx = 0;
    p.vy = 0;
    p.state = 'alive';
    p.invuln = PLAYER.invulnTime;
    p.jumpsLeft = PHYS.maxJumps;
    p.airDashes = statsOf(p).airDashes;
    p.dashTime = 0;
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

    if (profile.kind === 'melee') {
      const box = {
        x: p.facing > 0 ? p.x + p.w - 6 : p.x + 6 - profile.reach,
        y: p.y + p.h * 0.42 - profile.height / 2,
        w: profile.reach,
        h: profile.height,
      };
      p.attack.box = box;
      for (const t of this.players) {
        if (this.canHit(p, t) && rectsOverlap(box, t)) this.applyHit(p, t, profile, p.facing);
      }
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

  applyHit(attacker, target, profile, dirX, scale = {}) {
    const damage = attacker.admin ? PLAYER.adminDamage : profile.damage * (scale.damage ?? 1);
    target.damage += damage;
    target.stats.damageTaken += damage;
    attacker.stats.damageDealt += damage;
    attacker.stats.hits++;

    const kb = ((profile.kbBase + target.damage * profile.kbScale) * (scale.kb ?? 1)) / statsOf(target).weight;
    const angle = profile.angle;
    target.vx = dirX * kb * Math.cos(angle);
    target.vy = Math.min(-kb * Math.sin(angle), -180);
    target.onGround = false;
    target.hitstun = 0.12 + kb * 0.00035;
    target.attack = null;
    target.lastHitBy = attacker.id;
    target.lastHitTime = this.time;
    target.jumpsLeft = Math.max(target.jumpsLeft, 1);
    // Levar golpe interrompe o dash, mas não devolve dashes gastos.
    target.dashTime = 0;
    this.applyStatus(target, profile.status, attacker.id);

    this.emit('hit', {
      attacker: attacker.id, target: target.id, damage, kb,
      element: attacker.element, weapon: profile.id,
      x: target.x + target.w / 2, y: target.y + target.h * 0.4,
    });
  }

  updateProjectiles() {
    const keep = [];
    for (const pr of this.projectiles) {
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
          if (pr.kind === 'arremesso') {
            this.applyHit(owner, t, { id: pr.weapon, ...THROWN, damage: WEAPONS[pr.weapon].throwDamage }, dir);
          } else {
            const profile = weaponProfile(pr.weapon, pr.element);
            this.applyHit(owner, t, profile, dir);
          }
          if (!pr.pierce) {
            alive = false;
            pr.hitSomeone = true;
            break;
          }
        }
      }

      if (alive && this.map.solids.some((s) => circleRectOverlap(pr.x, pr.y, pr.r * 0.6, s))) alive = false;

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

  // Arma caída (sem ser de time nenhum): cai rápido até o chão
  dropWeapon(pr) {
    let x = pr.x;
    let y = pr.y;
    // se entrou na parede, volta um pouco para fora dela
    for (const s of this.map.solids) {
      if (!circleRectOverlap(x, y, pr.r * 0.6, s)) continue;
      if (y < s.y + 14) y = s.y - 16;
      else x -= Math.sign(pr.vx || 1) * 24;
    }
    const item = {
      id: this.nextEntityId++,
      weapon: pr.weapon,
      uses: pr.uses ?? WEAPONS[pr.weapon].uses,
      dropped: true,
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
      this.applyHit(owner, t, { ...profile, ...EXPLOSION_KB, damage }, dir);
    }
  }

  // ---------------------------------------------------------------- armas no chão

  spawnItems() {
    this.nextItemIn -= DT;
    if (this.nextItemIn > 0) return;
    this.nextItemIn = this.rng.range(ITEMS.spawnMin, ITEMS.spawnMax);
    if (this.items.filter((i) => !i.dropped).length >= ITEMS.maxOnMap) return;
    const { minX, maxX, y } = this.map.itemSpawn;
    const item = {
      id: this.nextEntityId++,
      weapon: this.rng.pick(WEAPON_IDS),
      x: Math.round(this.rng.range(minX, maxX)),
      y,
      w: 34,
      h: 30,
      landed: false,
      life: ITEMS.lifetime,
    };
    this.items.push(item);
    this.emit('itemSpawn', { itemId: item.id, weapon: item.weapon, x: item.x });
  }

  updateItems() {
    const keep = [];
    for (const item of this.items) {
      if (!item.landed) {
        const prevBottom = item.y + item.h;
        // caixote desce de paraquedas; arma caída despenca
        item.y += (item.dropped ? ITEMS.dropSpeed : ITEMS.fallSpeed) * DT;
        const bottom = item.y + item.h;
        const surfaces = [...this.map.solids, ...this.platforms];
        for (const s of surfaces) {
          const inside = item.x + item.w > s.x && item.x < s.x + s.w;
          if (inside && prevBottom <= s.y + 0.5 && bottom >= s.y) {
            item.y = s.y - item.h;
            item.landed = true;
            item.platform = this.platforms.indexOf(s);
            this.emit('itemLand', { itemId: item.id, x: item.x + item.w / 2, y: s.y });
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
      const sunk = item.dropped && item.landed && this.map.hazards.some((h) => (h.type === 'lava' || h.type === 'agua') && rectsOverlap(item, h));
      if (sunk) this.emit('itemLost', { itemId: item.id, x: item.x + item.w / 2, y: item.y + item.h / 2 });
      else if (item.life > 0 && item.y < this.map.blast.bottom) keep.push(item);
    }
    this.items = keep;
  }

  // ---------------------------------------------------------------- fim de jogo

  checkEnd() {
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
    this.phaseTimer = MATCH.endDelay;
    this.result = {
      winnerTeam,
      reason,
      mode: this.mode.id,
      duration: this.time,
      players: this.players.map((p) => ({
        id: p.id, name: p.name, team: p.team, element: p.element, isBot: p.isBot,
        kills: p.stats.kills, deaths: p.stats.deaths, falls: p.stats.falls,
        hazardDeaths: p.stats.hazardDeaths,
        damageDealt: Math.round(p.stats.damageDealt), damageTaken: Math.round(p.stats.damageTaken),
        hits: p.stats.hits, pickups: p.stats.pickups, livesLeft: p.state === 'out' ? 0 : p.lives,
      })),
    };
    const winnerElement = winnerTeam !== null ? this.players.find((p) => p.team === winnerTeam)?.element ?? null : null;
    this.emit('matchEnd', { winnerTeam, reason, winnerElement });
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
    slot: index,
    x: 0, y: 0, px: 0, py: 0,
    w: PLAYER.width, h: PLAYER.height,
    vx: 0, vy: 0,
    facing: 1,
    onGround: false,
    standingOn: null,
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
    damage: 0,
    lives,
    state: 'alive',
    respawnTimer: 0,
    invuln: 0,
    hitstun: 0,
    cooldown: 0,
    attack: null,
    weapon: null,
    pickupCooldown: 0,
    status: { queimadura: null, encharcado: null, atordoado: null },
    windVx: 0,              // empurrão do vento (somado ao andar)
    inHazard: null,
    lastHitBy: null,
    lastHitTime: -Infinity,
    prevInput: { ...EMPTY_INPUT },
    stats: { kills: 0, deaths: 0, falls: 0, hazardDeaths: 0, damageDealt: 0, damageTaken: 0, hits: 0, pickups: 0 },
  };
}
