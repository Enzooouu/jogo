// Desenha a partida no canvas a partir do estado da simulação.
// Também transforma os eventos da partida (golpes, K.O....) em efeitos.

import { ELEMENTS } from '/shared/elements.js';
import { weaponProfile } from '/shared/weapons.js';
import { StageRenderer, roundRect } from './stage.js';
import { Particles } from './particles.js';
import { Camera } from './camera.js';
import { startCelebration, updateCelebration, drawCelebration, CELEBRATION_TIME } from './celebrations.js';
import { drawFighter, drawSword, drawStaff, hexA } from './fighter.js';
import { drawSwordArt, drawStaffArt, drawShot } from './weapons-art.js';

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const TEAM_COLORS = ['#ffd23f', '#d65bff', '#3fffa2', '#ff5b7a', '#5bd2ff', '#ff9f43', '#a3ff5b', '#ff5bd2'];
const TEAM_NAMES = ['Time Dourado', 'Time Violeta', 'Time Verde', 'Time Rosa'];

export class Renderer {
  constructor(canvas, game, { localPlayerId = null, debug = false } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;
    this.localId = localPlayerId;
    this.debug = debug;
    this.stage = new StageRenderer(game.map);
    this.camera = new Camera(VIEW_W, VIEW_H, { x: 0, y: 0, w: game.map.width, h: game.map.height });
    this.particles = new Particles();
    this.vis = new Map(game.players.map((p) => [p.id, { runPhase: 0 }]));
    this.time = 0;
    this.shakeTime = 0;
    this.shakePower = 0;
    this.feed = [];
    this.banner = null;
    this.fps = 60;
    this.teamColor = new Map(game.teams().map((t, i) => [t, TEAM_COLORS[i % TEAM_COLORS.length]]));
    this.resize();
  }

  static teamName(index) {
    return TEAM_NAMES[index] ?? `Time ${index + 1}`;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(320, Math.round(rect.width * dpr));
    this.canvas.width = w;
    this.canvas.height = Math.round((w * VIEW_H) / VIEW_W);
    this.scale = this.canvas.width / VIEW_W;
    this.stage.setScale(this.scale);
  }

  shake(power, time) {
    this.shakePower = Math.max(this.shakePower, power);
    this.shakeTime = Math.max(this.shakeTime, time);
  }

  // ------------------------------------------------------------ eventos

  handleEvents(events) {
    const g = this.game;
    const P = this.particles;
    for (const e of events) {
      switch (e.type) {
        case 'start':
          this.banner = { text: 'LUTA!', time: 1.1, max: 1.1, color: '#ffe066' };
          break;
        case 'jump':
          if (e.double) P.add({ type: 'ring', x: e.x, y: e.y, size: 6, grow: 90, life: 0.3, color: 'rgba(255,255,255,0.8)' });
          break;
        case 'hazardHurt': {
          P.burst(e.x, e.y, { type: 'spark', count: 10, speed: 260, angle: -Math.PI / 2, spread: 2.2, life: 0.35, size: 2.2, color: '#ff5a5a', drag: 3 });
          P.add({ type: 'text', text: `+${Math.round(e.amount)}%`, x: e.x + 22, y: e.y - 40, vy: -50, life: 0.8, size: 17, color: '#ff7a7a' });
          const v = this.vis.get(e.id);
          if (v) v.hurt = 0.18;
          if (e.id === this.localId) this.shake(3, 0.1);
          break;
        }
        case 'dash': {
          const p = g.playerById(e.id);
          const el = ELEMENTS[p.element];
          P.add({ type: 'ring', x: e.x, y: e.y, size: 8, grow: 160, life: 0.22, color: el.light });
          P.burst(e.x, e.y, { type: 'spark', count: 8, speed: 260, angle: Math.atan2(-e.dy, -e.dx), spread: 0.9, life: 0.3, size: 2.2, color: el.light, drag: 3 });
          break;
        }
        case 'wallGrab':
          P.burst(e.x, e.y, { count: 5, speed: 80, life: 0.3, size: 2.5, color: 'rgba(220,200,210,0.7)', gravity: 200 });
          break;
        case 'wallJump':
          P.add({ type: 'ring', x: e.x, y: e.y, size: 6, grow: 110, life: 0.25, color: 'rgba(255,255,255,0.8)' });
          P.burst(e.x, e.y, { count: 6, speed: 140, life: 0.3, size: 2.5, color: 'rgba(220,200,210,0.7)', gravity: 300 });
          break;
        case 'land':
          P.burst(e.x, e.y, { count: 5, speed: 90, angle: -Math.PI / 2, spread: Math.PI, life: 0.3, size: 2.5, color: 'rgba(220,200,210,0.7)', gravity: 200 });
          break;
        case 'hit': {
          const el = ELEMENTS[e.element];
          const strong = e.kb > 650;
          P.burst(e.x, e.y, { type: 'spark', count: strong ? 16 : 9, speed: strong ? 520 : 360, life: 0.28, size: 2.5, color: el.light, drag: 4 });
          P.burst(e.x, e.y, { count: 6, speed: 160, life: 0.4, size: 3, color: el.color, gravity: 300 });
          P.add({ type: 'ring', x: e.x, y: e.y, size: 4, grow: strong ? 220 : 140, life: 0.18, color: '#ffffff' });
          P.add({ type: 'text', text: `${Math.round(e.damage)}`, x: e.x + (Math.random() - 0.5) * 20, y: e.y - 24, vy: -60, life: 0.6, size: 16, color: '#fff3c4' });
          if (strong) this.shake(5, 0.15);
          break;
        }
        case 'ko': {
          const victim = g.playerById(e.id);
          const el = ELEMENTS[e.element];
          P.burst(e.x, e.y, { type: 'spark', count: 34, speed: 900, life: 0.6, size: 3.5, color: el.light, drag: 2.5 });
          P.burst(e.x, e.y, { count: 24, speed: 300, life: 0.9, size: 5, color: el.color, gravity: 150, drag: 1.5 });
          P.add({ type: 'ring', x: e.x, y: e.y, size: 10, grow: 420, life: 0.45, color: el.light });
          P.add({ type: 'text', text: 'K.O.!', x: e.x, y: Math.max(60, e.y - 30), vy: -30, life: 1.1, size: 40, color: '#ffffff' });
          if (e.cause === 'lava') P.burst(e.x, e.y, { count: 20, speed: 260, angle: -Math.PI / 2, spread: 1.4, life: 1, size: 4, color: '#ffb347', gravity: 400 });
          if (e.cause === 'agua') P.burst(e.x, e.y, { count: 22, speed: 300, angle: -Math.PI / 2, spread: 1.2, life: 0.9, size: 3.5, color: '#9fe3ff', gravity: 700 });
          this.shake(12, 0.4);
          this.pushFeed(koText(g, e, victim), victim);
          break;
        }
        case 'eliminated': {
          const p = g.playerById(e.id);
          this.pushFeed(`${p.name} foi eliminado!`, p, true);
          break;
        }
        case 'pickup': {
          const p = g.playerById(e.id);
          P.burst(e.x, e.y, { type: 'spark', count: 10, speed: 200, life: 0.4, size: 2, color: '#ffe8a3', drag: 3 });
          P.add({ type: 'text', text: e.name, x: p.x + p.w / 2, y: p.y - 34, vy: -40, life: 1.2, size: 15, color: ELEMENTS[p.element].light });
          break;
        }
        case 'shoot': {
          const el = ELEMENTS[e.element];
          P.burst(e.x, e.y, { count: 6, speed: 150, life: 0.25, size: 3, color: el.light });
          break;
        }
        case 'explosion': {
          P.add({ type: 'ring', x: e.x, y: e.y, size: 8, grow: e.radius * 4, life: 0.25, color: '#ffd25a' });
          P.burst(e.x, e.y, { count: 22, speed: 380, life: 0.45, size: 4, color: '#ff7a1a', drag: 3 });
          P.burst(e.x, e.y, { count: 10, speed: 120, life: 0.8, size: 7, grow: 10, color: 'rgba(60,40,40,0.6)', gravity: -60 });
          this.shake(4, 0.12);
          break;
        }
        case 'projectileEnd':
          if (e.kind === 'magia' && e.element === 'agua') {
            P.burst(e.x, e.y, { count: 12, speed: 260, life: 0.5, size: 3, color: '#9fe3ff', gravity: 800 });
          } else if (e.kind === 'arremesso') {
            P.burst(e.x, e.y, { type: 'spark', count: 8, speed: 260, life: 0.3, size: 2, color: '#dddddd', drag: 3 });
          } else {
            P.burst(e.x, e.y, { count: 6, speed: 120, life: 0.3, size: 3, color: ELEMENTS[e.element].light });
          }
          break;
        case 'itemLand':
          P.burst(e.x, e.y, { count: 8, speed: 120, angle: -Math.PI / 2, spread: Math.PI, life: 0.4, size: 3, color: 'rgba(210,190,170,0.7)', gravity: 300 });
          break;
        case 'weaponBreak':
          P.burst(e.x, e.y, { type: 'spark', count: 12, speed: 260, life: 0.4, size: 2.5, color: '#cccccc', gravity: 600 });
          P.add({ type: 'text', text: 'quebrou!', x: e.x, y: e.y - 30, vy: -40, life: 0.9, size: 14, color: '#dddddd' });
          break;
        case 'respawn':
          P.add({ type: 'ring', x: e.x, y: e.y - 33, size: 50, grow: -60, life: 0.6, color: '#ffffff' });
          break;
        case 'matchEnd': {
          const winner = e.winnerTeam !== null ? g.players.find((p) => p.team === e.winnerTeam) : null;
          if (winner) {
            const el = ELEMENTS[winner.element];
            const of = { fogo: 'DO FOGO', agua: 'DA ÁGUA', terra: 'DA TERRA', ar: 'DO AR' }[winner.element] ?? el.name.toUpperCase();
            this.banner = { text: `VITÓRIA ${of}!`, time: CELEBRATION_TIME, max: CELEBRATION_TIME, color: el.light };
            this.celebration = startCelebration(winner.element);
          } else {
            this.banner = { text: 'EMPATE', time: 2.2, max: 2.2, color: '#ffffff' };
          }
          break;
        }
        default:
          break;
      }
    }
  }

  pushFeed(text, player, strong = false) {
    const color = player ? this.teamColor.get(player.team) : '#fff';
    this.feed.unshift({ text, color, time: strong ? 5 : 4 });
    this.feed.length = Math.min(this.feed.length, 5);
  }

  // ------------------------------------------------------------ desenho

  frame(dt, alpha) {
    this.time += dt;
    this.fps += (1 / Math.max(dt, 1e-3) - this.fps) * 0.05;
    this.particles.update(dt);
    this.updateAmbient(dt);
    for (const f of this.feed) f.time -= dt;
    this.feed = this.feed.filter((f) => f.time > 0);
    if (this.banner) {
      this.banner.time -= dt;
      if (this.banner.time <= 0) this.banner = null;
    }
    for (const p of this.game.players) {
      const v = this.vis.get(p.id);
      if (p.onGround) v.runPhase += Math.abs(p.vx) * dt * 0.045;
      if (v.hurt > 0) v.hurt -= dt;
      // Rastro de "fantasmas" durante o dash
      v.trail = v.trail ?? [];
      if (p.dashTime > 0 && p.state === 'alive') v.trail.push({ x: p.x, y: p.y, life: 0.18 });
      for (const t of v.trail) t.life -= dt;
      v.trail = v.trail.filter((t) => t.life > 0).slice(-6);
    }

    const ctx = this.ctx;
    let sx = 0;
    let sy = 0;
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      sx = (Math.random() - 0.5) * this.shakePower * 2;
      sy = (Math.random() - 0.5) * this.shakePower * 2;
      if (this.shakeTime <= 0) this.shakePower = 0;
    }

    const cam = this.camera;
    cam.update(dt, this.game.players.filter((p) => p.state === 'alive').map((p) => ({
      x: p.px + (p.x - p.px) * alpha, y: p.py + (p.y - p.py) * alpha, w: p.w, h: p.h,
    })));
    this.stage.drawBackground(ctx, cam, this.time, { x: sx, y: sy });

    // Mundo: a câmera decide o centro e o zoom
    const z = this.scale * cam.zoom;
    ctx.setTransform(z, 0, 0, z, (VIEW_W / 2 - cam.x * cam.zoom + sx) * this.scale, (VIEW_H / 2 - cam.y * cam.zoom + sy) * this.scale);
    if (this.celebration) {
      updateCelebration(this.celebration, dt, this);
      drawCelebration(ctx, this.celebration, 'back');
    }
    this.stage.drawTerrain(ctx, this.time, this.game.platforms, alpha);
    this.stage.drawHazards(ctx, this.time, false);
    this.drawWinds(ctx);
    drawCelebration(ctx, this.celebration, 'mid');
    this.drawItems(ctx);
    this.drawProjectiles(ctx);
    this.drawPlayers(ctx, alpha);
    this.particles.draw(ctx);
    drawCelebration(ctx, this.celebration, 'front');
    this.stage.drawHazards(ctx, this.time, true);
    if (this.debug) this.drawDebug(ctx);
    this.stage.drawVignette(ctx);

    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    this.drawOffscreen(ctx, alpha);
    this.drawHud(ctx);
    if (this.showScores) this.drawScoreboard(ctx);
  }

  updateAmbient(dt) {
    const P = this.particles;
    const g = this.game;
    const chance = (rate) => Math.random() < rate * dt;

    if (g.map.id === 'pico') {
      // Folhas e pétalas levadas pelo vento
      if (chance(5)) {
        P.add({ x: -60, y: 100 + Math.random() * 500, vx: 90 + Math.random() * 80, vy: -10 + Math.random() * 30, life: 9, size: 2, color: Math.random() < 0.5 ? '#9fdc6e' : '#ffb3c8', drag: 0.02 });
      }
    } else {
      // Brasas e cinzas no ar (lado do fogo) e gotículas de névoa (lado da água)
      if (chance(6)) {
        P.add({ x: -100 + Math.random() * 700, y: 760, vx: 20 + Math.random() * 30, vy: -50 - Math.random() * 50, life: 5, size: 1.6, color: Math.random() < 0.6 ? '#ff9a3c' : '#ffd25a', drag: 0.1 });
      }
      if (chance(4)) {
        P.add({ x: 700 + Math.random() * 700, y: -20 + Math.random() * 300, vx: -15, vy: 25 + Math.random() * 20, life: 5, size: 1.4, color: 'rgba(180,225,255,0.7)' });
      }
    }
    for (const d of g.map.decor ?? []) {
      if (d.type === 'braseiro' && chance(10)) {
        P.add({ x: d.x + (Math.random() - 0.5) * 16, y: d.y - 50, vx: (Math.random() - 0.5) * 30, vy: -70 - Math.random() * 50, life: 0.9, size: 1.8, grow: -1.5, color: Math.random() < 0.5 ? '#ffd25a' : '#ff6a1f' });
      }
    }
    for (const h of g.map.hazards) {
      if (h.type === 'lava' && chance(5)) {
        P.add({ x: h.x + Math.random() * h.w, y: h.y, vx: (Math.random() - 0.5) * 20, vy: -40 - Math.random() * 60, life: 1.4, size: 1.8, color: '#ffb347', gravity: -10 });
      }
    }
    for (const p of g.players) {
      if (p.state !== 'alive') continue;
      const cx = p.x + p.w / 2;
      if (p.dashTime > 0) {
        // rastro do dash: "fantasmas" do lutador
        P.add({ x: cx + (Math.random() - 0.5) * 10, y: p.y + 10 + Math.random() * 50, vx: -p.vx * 0.1, vy: -p.vy * 0.1, life: 0.3, size: 4, grow: -10, color: ELEMENTS[p.element].light });
      }
      if (p.onWall && p.vy > 40 && chance(25)) {
        P.add({ x: p.onWall > 0 ? p.x + p.w : p.x, y: p.y + 14, vx: -p.onWall * 30, vy: -20, life: 0.35, size: 2.2, color: 'rgba(220,200,210,0.75)', gravity: 150 });
      }
      if (p.element === 'fogo' && chance(18)) {
        P.add({ x: cx + (Math.random() - 0.5) * 10, y: p.y - 4, vx: (Math.random() - 0.5) * 30, vy: -60 - Math.random() * 40, life: 0.5, size: 2.2, grow: -3, color: Math.random() < 0.5 ? '#ffd25a' : '#ff6a1f' });
      }
      if (p.element === 'terra' && p.onGround && Math.abs(p.vx) > 60 && chance(14)) {
        P.add({ x: cx - Math.sign(p.vx) * 10, y: p.y + p.h - 2, vx: -p.vx * 0.1, vy: -30, life: 0.4, size: 3, grow: 4, color: 'rgba(170,140,100,0.6)' });
      }
      if (p.element === 'ar' && chance(10)) {
        P.add({ x: cx + (Math.random() - 0.5) * 20, y: p.y + p.h - 4, vx: -p.facing * 60, vy: -10, life: 0.5, size: 1.6, color: 'rgba(200,255,245,0.8)' });
      }
      if (p.inHazard === 'espinhos' && chance(12)) {
        P.add({ x: cx + (Math.random() - 0.5) * 20, y: p.y + p.h - 6, vx: (Math.random() - 0.5) * 60, vy: -80, life: 0.3, size: 2, color: '#ff6a6a', gravity: 400 });
      }
      if (p.element === 'agua' && chance(4)) {
        P.add({ x: cx + (Math.random() - 0.5) * 16, y: p.y + 10, vx: 0, vy: 20, life: 0.6, size: 1.8, color: '#9fe3ff', gravity: 500 });
      }
      if (p.status.queimadura && chance(30)) {
        P.add({ x: cx + (Math.random() - 0.5) * 22, y: p.y + 20 + Math.random() * 40, vx: 0, vy: -90, life: 0.45, size: 3.5, grow: -6, color: Math.random() < 0.5 ? '#ff7a1a' : '#ffd25a' });
      }
      if (p.status.encharcado && chance(16)) {
        P.add({ x: cx + (Math.random() - 0.5) * 22, y: p.y + 10 + Math.random() * 40, vx: 0, vy: 30, life: 0.5, size: 2.2, color: '#5ab4ff', gravity: 600 });
      }
      if ((p.inHazard === 'lava' || p.inHazard === 'agua') && chance(20)) {
        const color = p.inHazard === 'lava' ? '#ffd25a' : '#e0f7ff';
        P.add({ x: cx + (Math.random() - 0.5) * 30, y: p.y + p.h - 18, vx: (Math.random() - 0.5) * 60, vy: -120, life: 0.4, size: 2.5, color, gravity: 500 });
      }
    }
    for (const pr of g.projectiles) {
      if (pr.kind !== 'magia') continue;
      if (pr.element === 'fogo' && chance(70)) {
        P.add({ x: pr.x, y: pr.y + (Math.random() - 0.5) * 8, vx: -pr.vx * 0.05, vy: -30, life: 0.35, size: 4, grow: -8, color: Math.random() < 0.5 ? '#ff7a1a' : '#ffd25a' });
      } else if (pr.element === 'agua' && chance(50)) {
        P.add({ x: pr.x, y: pr.y + (Math.random() - 0.5) * 10, vx: -pr.vx * 0.05, vy: 0, life: 0.35, size: 2.5, color: '#9fe3ff', gravity: 400 });
      }
    }
  }

  drawPlayers(ctx, alpha) {
    // Jogador local por último, para ficar na frente.
    const list = [...this.game.players].sort((a, b) => (a.id === this.localId) - (b.id === this.localId));
    for (const p of list) {
      if (p.state !== 'alive') continue;
      const x = p.px + (p.x - p.px) * alpha;
      const y = p.py + (p.y - p.py) * alpha;
      for (const t of this.vis.get(p.id).trail ?? []) {
        ctx.save();
        ctx.globalAlpha = (t.life / 0.18) * 0.3;
        drawFighter(ctx, p, t.x, t.y, this.vis.get(p.id), this.time, { showName: false });
        ctx.restore();
      }
      drawFighter(ctx, p, x, y, this.vis.get(p.id), this.time, {
        teamColor: this.teamColor.get(p.team),
        isLocal: p.id === this.localId,
      });
      if (p.status.atordoado) this.drawStunStars(ctx, x + p.w / 2, y - 6);
      // Clarão vermelho quando os espinhos espetam
      const v = this.vis.get(p.id);
      if (v.hurt > 0) {
        ctx.save();
        ctx.globalAlpha = v.hurt / 0.18 * 0.5;
        ctx.fillStyle = '#ff3b3b';
        ctx.beginPath();
        ctx.ellipse(x + p.w / 2, y + p.h / 2, 26, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // Rajadas de vento: aviso (contorno piscando) e depois linhas correndo
  drawWinds(ctx) {
    for (const w of this.game.winds) {
      ctx.save();
      if (w.state === 'aviso') {
        const blink = 0.35 + Math.abs(Math.sin(this.time * 9)) * 0.45;
        ctx.globalAlpha = blink;
        ctx.strokeStyle = '#bff7ec';
        ctx.setLineDash([10, 8]);
        ctx.lineWidth = 2;
        ctx.strokeRect(w.x, w.y, w.w, w.h);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(191,247,236,0.08)';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        // setas mostrando para onde vai empurrar
        ctx.fillStyle = '#e0fff8';
        for (let i = 0; i < 3; i++) {
          const cx = w.x + w.w / 2 + (i - 1) * 40;
          const cy = w.y + w.h / 2;
          ctx.beginPath();
          ctx.moveTo(cx + w.dir * 14, cy);
          ctx.lineTo(cx - w.dir * 6, cy - 11);
          ctx.lineTo(cx - w.dir * 6, cy + 11);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        const g = ctx.createLinearGradient(w.x, 0, w.x + w.w, 0);
        g.addColorStop(w.dir > 0 ? 0 : 1, 'rgba(191,247,236,0)');
        g.addColorStop(w.dir > 0 ? 1 : 0, 'rgba(191,247,236,0.22)');
        ctx.fillStyle = g;
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = 'rgba(235,255,250,0.75)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < 9; i++) {
          const k = (this.time * 1.6 + i * 0.37) % 1;
          const x = w.dir > 0 ? w.x + k * w.w : w.x + w.w - k * w.w;
          const y = w.y + 12 + ((i * 53) % (w.h - 24));
          const len = 26 + (i % 3) * 10;
          ctx.globalAlpha = Math.sin(k * Math.PI);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x - w.dir * len * 0.5, y - 4, x - w.dir * len, y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  drawItems(ctx) {
    for (const item of this.game.items) {
      if (item.landed && item.life < 3 && Math.floor(this.time * 8) % 2 === 0) continue;
      const cx = item.x + item.w / 2;
      ctx.save();
      if (!item.landed) {
        const sway = Math.sin(this.time * 2.5 + item.id) * 0.08;
        ctx.translate(cx, item.y);
        ctx.rotate(sway);
        // paraquedas
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-15, 2); ctx.lineTo(-26, -34);
        ctx.moveTo(15, 2); ctx.lineTo(26, -34);
        ctx.moveTo(0, 0); ctx.lineTo(0, -40);
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = i % 2 ? '#f4f1ea' : '#e2483d';
          ctx.beginPath();
          ctx.moveTo(0, -36);
          ctx.arc(0, -36, 32, Math.PI + (i * Math.PI) / 4, Math.PI + ((i + 1) * Math.PI) / 4);
          ctx.closePath();
          ctx.fill();
        }
        ctx.translate(-cx, -item.y);
      } else {
        const pulse = 0.5 + Math.sin(this.time * 5 + item.id) * 0.5;
        ctx.fillStyle = `rgba(255,230,140,${0.15 + pulse * 0.2})`;
        ctx.beginPath();
        ctx.ellipse(cx, item.y + item.h, 30, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // caixote
      ctx.fillStyle = '#8a5a2b';
      ctx.strokeStyle = '#2b170a';
      ctx.lineWidth = 3;
      roundRect(ctx, item.x, item.y, item.w, item.h, 4);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(43,23,10,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(item.x + 4, item.y + 4); ctx.lineTo(item.x + item.w - 4, item.y + item.h - 4);
      ctx.stroke();
      // ícone
      ctx.translate(cx, item.y + item.h / 2);
      ctx.rotate(Math.PI / 4);
      ctx.scale(0.42, 0.42);
      ctx.translate(0, 18);
      const neutral = { color: '#ffd25a', light: '#fff4c2', dark: '#7a5a10' };
      if (item.weapon === 'espada') drawSword(ctx, neutral, this.time);
      else drawStaff(ctx, neutral, this.time);
      ctx.restore();
    }
  }

  // Estrelinhas girando em cima de quem está atordoado
  drawStunStars(ctx, cx, cy) {
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const a = this.time * 6 + (i * Math.PI * 2) / 3;
      const x = cx + Math.cos(a) * 14;
      const y = cy + Math.sin(a) * 4;
      ctx.fillStyle = '#ffe066';
      ctx.strokeStyle = '#140a14';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const r = k % 2 ? 2 : 5;
        const ang = (k * Math.PI) / 5 - Math.PI / 2;
        if (k === 0) ctx.moveTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r);
        else ctx.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  drawProjectiles(ctx) {
    for (const pr of this.game.projectiles) {
      ctx.save();
      if (pr.kind === 'arremesso') {
        ctx.translate(pr.x, pr.y);
        ctx.rotate(this.time * 22 * Math.sign(pr.vx || 1));
        ctx.translate(0, 18);
        if (pr.weapon === 'espada') drawSwordArt(ctx, pr.element, this.time);
        else drawStaffArt(ctx, pr.element, this.time);
      } else {
        drawShot(ctx, pr.element, pr.x, pr.y, pr.r, Math.sign(pr.vx) || 1, this.time);
      }
      ctx.restore();
    }
  }

  // Bolhas na borda da tela mostrando quem foi arremessado para fora.
  drawOffscreen(ctx, alpha) {
    for (const p of this.game.players) {
      if (p.state !== 'alive') continue;
      const { x, y } = this.camera.toScreen(p.px + (p.x - p.px) * alpha + p.w / 2, p.py + (p.y - p.py) * alpha + p.h / 2);
      const out = x < 0 || x > VIEW_W || y < 0 || y > VIEW_H;
      if (!out) continue;
      const bx = Math.max(28, Math.min(VIEW_W - 28, x));
      const by = Math.max(28, Math.min(VIEW_H - 120, y));
      const el = ELEMENTS[p.element];
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.strokeStyle = this.teamColor.get(p.team);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bx, by, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = el.color;
      ctx.beginPath();
      ctx.arc(bx, by, 8, 0, Math.PI * 2);
      ctx.fill();
      const ang = Math.atan2(y - by, x - bx);
      ctx.fillStyle = this.teamColor.get(p.team);
      ctx.beginPath();
      ctx.moveTo(bx + Math.cos(ang) * 28, by + Math.sin(ang) * 28);
      ctx.lineTo(bx + Math.cos(ang + 0.5) * 19, by + Math.sin(ang + 0.5) * 19);
      ctx.lineTo(bx + Math.cos(ang - 0.5) * 19, by + Math.sin(ang - 0.5) * 19);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawHud(ctx) {
    const g = this.game;
    ctx.save();
    ctx.textBaseline = 'alphabetic';

    // Seu cartão fica destacado no canto de cima; os outros ficam embaixo
    // (no 1x1, o adversário vai para o canto de baixo à direita).
    const me = g.playerById(this.localId);
    if (me) this.drawMyCard(ctx, me, 18, 16);
    const teams = g.teams();
    const ordered = teams.flatMap((t) => g.players.filter((p) => p.team === t && p !== me));
    if (me && ordered.length === 1) {
      this.drawCard(ctx, ordered[0], VIEW_W - 210 - 18, VIEW_H - 74, 210);
      ordered.length = 0;
    }
    const n = ordered.length;
    const gap = 10;
    const extraGap = teams.length > 1 && teams.length <= 4 ? 30 : 0;
    const cardW = Math.min(210, (VIEW_W - 40 - gap * (n - 1) - extraGap * (teams.length - 1)) / n);
    const totalW = cardW * n + gap * (n - 1) + extraGap * (teams.length - 1);
    let x = (VIEW_W - totalW) / 2;
    const y = VIEW_H - 74;
    let prevTeam = ordered[0]?.team;
    const groups = new Set(ordered.map((p) => p.team)).size;
    if (groups < teams.length) x += (extraGap * (teams.length - groups)) / 2;
    for (const p of ordered) {
      if (p.team !== prevTeam) {
        x += extraGap;
        prevTeam = p.team;
      }
      this.drawCard(ctx, p, x, y, cardW);
      x += cardW + gap;
    }

    // Relógio
    if (g.timeLimit > 0) {
      const left = Math.max(0, g.timeLimit - g.time);
      const mm = Math.floor(left / 60);
      const ss = Math.floor(left % 60).toString().padStart(2, '0');
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      roundRect(ctx, VIEW_W / 2 - 52, 12, 104, 38, 10);
      ctx.fill();
      ctx.font = '800 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = left < 30 ? '#ff5b5b' : '#ffffff';
      ctx.fillText(`${mm}:${ss}`, VIEW_W / 2, 40);
    }

    // Feed de K.O.
    ctx.textAlign = 'right';
    ctx.font = '700 15px system-ui, sans-serif';
    this.feed.forEach((f, i) => {
      ctx.globalAlpha = Math.min(1, f.time);
      const w = ctx.measureText(f.text).width + 20;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      roundRect(ctx, VIEW_W - 16 - w, 14 + i * 30, w, 25, 6);
      ctx.fill();
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, VIEW_W - 26, 32 + i * 30);
    });
    ctx.globalAlpha = 1;

    // Contagem regressiva / faixas
    if (g.phase === 'countdown') {
      const n = Math.ceil(g.phaseTimer);
      const frac = g.phaseTimer - Math.floor(g.phaseTimer);
      this.drawBigText(ctx, String(n), 1 + frac * 0.5, '#ffffff', 0.35 + frac);
    } else if (this.banner) {
      const b = this.banner;
      const k = b.time / b.max;
      this.drawBigText(ctx, b.text, 1 + (1 - k) * 0.25, b.color, Math.min(1, k * 2));
    }

    if (me && me.state === 'out' && g.phase === 'playing') {
      ctx.textAlign = 'center';
      ctx.font = '700 18px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      roundRect(ctx, VIEW_W / 2 - 230, 62, 460, 34, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Você foi eliminado. Torça pelo seu time! (F = acelerar)', VIEW_W / 2, 85);
    }

    if (this.debug) {
      ctx.textAlign = 'left';
      ctx.font = '12px monospace';
      ctx.fillStyle = '#9f9';
      ctx.fillText(`FPS ${this.fps.toFixed(0)}  tick ${g.tick}  partículas ${this.particles.list.length}`, 10, 18);
    }
    ctx.restore();
  }

  // Cartão grande do jogador local (canto de cima à esquerda)
  drawMyCard(ctx, p, x, y) {
    const el = ELEMENTS[p.element];
    const w = 300;
    const h = 100;
    const out = p.state === 'out';
    ctx.save();
    ctx.globalAlpha = out ? 0.55 : 1;
    ctx.shadowColor = el.color;
    ctx.shadowBlur = 18;
    const bg = ctx.createLinearGradient(x, 0, x + w, 0);
    bg.addColorStop(0, hexA(el.color, 0.45));
    bg.addColorStop(0.45, 'rgba(14,8,20,0.92)');
    bg.addColorStop(1, 'rgba(14,8,20,0.88)');
    ctx.fillStyle = bg;
    roundRect(ctx, x, y, w, h, 14);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Aviso de que o modo ADM (testes) está ligado
    if (p.admin) {
      ctx.fillStyle = '#e8263a';
      roundRect(ctx, x + 10, y + h + 6, 132, 20, 10);
      ctx.fill();
      ctx.font = '800 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('MODO ADM · 999%', x + 76, y + h + 20);
    }

    // Retrato (cabeça do lutador)
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + 46, y + 50, 32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();
    ctx.strokeStyle = el.light;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.clip();
    // centraliza a cabeça no círculo
    ctx.translate(x + 42, y + 132);
    ctx.scale(1.5, 1.5);
    const portrait = { ...p, x: -15, y: -66, hitstun: 0, attack: null, weapon: null, onWall: 0, dashTime: 0, invuln: 0, vx: 0, vy: 0, onGround: true, facing: 1 };
    drawFighter(ctx, portrait, -15, -66, { runPhase: 0 }, this.time, { showName: false });
    ctx.restore();

    ctx.textAlign = 'left';
    ctx.font = '800 15px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(fit(ctx, `${p.name} (você)`, 150), x + 88, y + 24);
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillStyle = el.light;
    let sub = el.name.toUpperCase();
    if (p.weapon) sub = `${weaponProfile(p.weapon.id, p.element).name} (${p.weapon.uses})`;
    if (p.state === 'respawning') sub = 'VOLTANDO...';
    if (out) sub = 'ELIMINADO';
    ctx.fillText(fit(ctx, sub, 150), x + 88, y + 40);

    // Vidas
    for (let i = 0; i < this.game.lives; i++) {
      ctx.fillStyle = i < p.lives ? el.color : 'rgba(255,255,255,0.15)';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x + 95 + i * 17, y + 58, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Dashes no ar disponíveis
    const maxDash = el.stats?.airDashes ?? 1;
    ctx.font = '800 10px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('DASH', x + 88, y + 86);
    // Cada seta é um dash: apagada = gasta; meio apagada = esperando o intervalo
    const available = out ? 0 : p.onGround ? maxDash : p.airDashes;
    for (let i = 0; i < maxDash; i++) {
      const has = i < available;
      ctx.globalAlpha = (out ? 0.55 : 1) * (has && p.dashCooldown > 0 ? 0.4 : 1);
      const on = has;
      const ax = x + 124 + i * 20;
      const ay = y + 82;
      ctx.fillStyle = on ? el.light : 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.moveTo(ax - 6, ay - 5);
      ctx.lineTo(ax + 2, ay - 5);
      ctx.lineTo(ax + 9, ay);
      ctx.lineTo(ax + 2, ay + 5);
      ctx.lineTo(ax - 6, ay + 5);
      ctx.lineTo(ax - 1, ay);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = out ? 0.55 : 1;

    // Dano
    if (!out) {
      const dmg = Math.round(p.damage);
      const txt = `${dmg}%`;
      ctx.textAlign = 'right';
      ctx.font = '900 40px system-ui, sans-serif';
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      const shakeX = dmg > 120 ? (Math.random() - 0.5) * 3 : 0;
      ctx.strokeText(txt, x + w - 14 + shakeX, y + 88);
      ctx.fillStyle = damageColor(dmg);
      ctx.fillText(txt, x + w - 14 + shakeX, y + 88);
    }
    ctx.restore();
  }

  drawCard(ctx, p, x, y, w) {
    const el = ELEMENTS[p.element];
    const teamColor = this.teamColor.get(p.team);
    const out = p.state === 'out';
    ctx.save();
    ctx.globalAlpha = out ? 0.45 : 1;
    ctx.fillStyle = 'rgba(10,6,16,0.78)';
    roundRect(ctx, x, y, w, 62, 10);
    ctx.fill();
    ctx.strokeStyle = p.id === this.localId ? '#ffffff' : hexA(teamColor, 0.8);
    ctx.lineWidth = p.id === this.localId ? 2.5 : 1.5;
    ctx.stroke();

    // Faixa do elemento
    ctx.fillStyle = el.color;
    roundRect(ctx, x + 6, y + 6, 6, 50, 3);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillStyle = teamColor;
    const name = p.id === this.localId ? `${p.name} (você)` : p.name;
    ctx.fillText(fit(ctx, name, w - 30), x + 20, y + 20);

    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    let sub = el.name;
    if (p.weapon) sub = `${weaponProfile(p.weapon.id, p.element).name} (${p.weapon.uses})`;
    if (p.state === 'respawning') sub = 'voltando...';
    if (out) sub = 'ELIMINADO';
    ctx.fillText(fit(ctx, sub, w - 90), x + 20, y + 52);

    // Dano
    if (!out) {
      const dmg = Math.round(p.damage);
      ctx.textAlign = 'right';
      ctx.font = '900 26px system-ui, sans-serif';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      const txt = `${dmg}%`;
      const shakeX = dmg > 120 ? (Math.random() - 0.5) * 2 : 0;
      ctx.strokeText(txt, x + w - 10 + shakeX, y + 50);
      ctx.fillStyle = damageColor(dmg);
      ctx.fillText(txt, x + w - 10 + shakeX, y + 50);
    }

    // Vidas
    for (let i = 0; i < this.game.lives; i++) {
      ctx.fillStyle = i < p.lives ? el.color : 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(x + 24 + i * 13, y + 34, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Placar completo (segurando TAB)
  drawScoreboard(ctx) {
    const g = this.game;
    const cols = [
      ['Jogador', 250, 'left'], ['Vidas', 70], ['Kills', 70], ['Mortes', 75],
      ['Dano causado', 125], ['Dano recebido', 130], ['Golpes', 80], ['Armas', 75],
    ];
    const tableW = cols.reduce((s, c) => s + c[1], 0);
    const rowH = 34;
    const teams = g.teams();
    const rows = teams.length + g.players.length;
    const w = tableW + 48;
    const h = 120 + rows * rowH;
    const x0 = (VIEW_W - w) / 2;
    const y0 = Math.max(20, (VIEW_H - 80 - h) / 2);

    ctx.save();
    ctx.fillStyle = 'rgba(8,4,14,0.55)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = 'rgba(20,12,28,0.94)';
    roundRect(ctx, x0, y0, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textBaseline = 'middle';
    ctx.font = '900 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PLACAR', x0 + 24, y0 + 32);
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const t = Math.floor(g.time);
    ctx.fillText(`Tempo de luta ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`, x0 + w - 24, y0 + 32);

    // Cabeçalho
    let y = y0 + 70;
    let x = x0 + 24;
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (const [label, cw, align] of cols) {
      ctx.textAlign = align ?? 'right';
      ctx.fillText(label.toUpperCase(), align === 'left' ? x : x + cw - 8, y);
      x += cw;
    }

    y += 22;
    teams.forEach((team, ti) => {
      const color = this.teamColor.get(team);
      const members = g.players.filter((p) => p.team === team)
        .sort((a, b) => b.stats.kills - a.stats.kills || b.stats.damageDealt - a.stats.damageDealt);
      ctx.textAlign = 'left';
      ctx.font = '800 13px system-ui, sans-serif';
      ctx.fillStyle = color;
      const el = ELEMENTS[members[0].element];
      const teamLabel = g.mode.teams ? `${Renderer.teamName(ti)} · ${el.name}` : '';
      if (teamLabel) ctx.fillText(teamLabel.toUpperCase(), x0 + 24, y + rowH / 2);
      y += teamLabel ? rowH : 0;

      for (const p of members) {
        const s = p.stats;
        if (p.id === this.localId) {
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          roundRect(ctx, x0 + 14, y + 2, w - 28, rowH - 4, 8);
          ctx.fill();
        }
        ctx.globalAlpha = p.state === 'out' ? 0.5 : 1;
        const cy = y + rowH / 2;
        // nome com bolinha do elemento
        ctx.fillStyle = ELEMENTS[p.element].color;
        ctx.beginPath();
        ctx.arc(x0 + 32, cy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.textAlign = 'left';
        ctx.font = `${p.id === this.localId ? 800 : 600} 15px system-ui, sans-serif`;
        ctx.fillStyle = '#ffffff';
        let name = p.id === this.localId ? `${p.name} (você)` : p.name;
        if (p.isBot) name += '  BOT';
        ctx.fillText(name, x0 + 46, cy);

        const values = [
          p.state === 'out' ? '—' : String(p.lives), String(s.kills), String(s.deaths),
          String(Math.round(s.damageDealt)), String(Math.round(s.damageTaken)), String(s.hits), String(s.pickups),
        ];
        ctx.font = '700 15px system-ui, sans-serif';
        ctx.textAlign = 'right';
        let cx = x0 + 24 + cols[0][1];
        values.forEach((v, i) => {
          const cw = cols[i + 1][1];
          ctx.fillStyle = i === 3 ? '#ffd27a' : i === 4 ? '#ff9a9a' : '#ffffff';
          ctx.fillText(v, cx + cw - 8, cy);
          cx += cw;
        });
        ctx.globalAlpha = 1;
        y += rowH;
      }
    });

    ctx.textAlign = 'center';
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText('Solte TAB para voltar', VIEW_W / 2, y0 + h - 18);
    ctx.restore();
  }

  drawBigText(ctx, text, scale, color, alpha) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(VIEW_W / 2, VIEW_H / 2 - 40);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.font = '900 84px system-ui, sans-serif';
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(text, 0, 30);
    ctx.fillStyle = color;
    ctx.fillText(text, 0, 30);
    ctx.restore();
  }

  drawDebug(ctx) {
    ctx.save();
    ctx.lineWidth = 1;
    for (const h of this.game.map.hazards) {
      ctx.strokeStyle = '#ff0';
      ctx.strokeRect(h.x, h.y, h.w, h.h);
    }
    for (const p of this.game.players) {
      if (p.state !== 'alive') continue;
      ctx.strokeStyle = '#0f0';
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      if (p.attack?.box) {
        ctx.strokeStyle = '#f00';
        const b = p.attack.box;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
      }
    }
    for (const pr of this.game.projectiles) {
      ctx.strokeStyle = '#0ff';
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function koText(game, e, victim) {
  const killer = e.killer !== null ? game.playerById(e.killer) : null;
  const where = { lava: ' na lava', agua: ' na água', queda: '' }[e.cause] ?? '';
  if (killer) return `${killer.name} nocauteou ${victim.name}${where}`;
  if (e.cause === 'lava') return `${victim.name} derreteu na lava`;
  if (e.cause === 'agua') return `${victim.name} se apagou na água`;
  return `${victim.name} caiu do mapa`;
}

function damageColor(d) {
  if (d < 30) return '#ffffff';
  if (d < 60) return '#ffe066';
  if (d < 100) return '#ff9f43';
  if (d < 150) return '#ff4d4d';
  return '#c20000';
}

function fit(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
  return `${t}…`;
}
