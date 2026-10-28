// Desenha a partida no canvas a partir do estado da simulação.
// Também transforma os eventos da partida (golpes, K.O....) em efeitos.

import { ELEMENTS } from '/shared/elements.js';
import { weaponProfile } from '/shared/weapons.js';
import { StageRenderer, roundRect } from './stage.js';
import { Particles } from './particles.js';
import { drawFighter, drawSword, drawStaff, hexA } from './fighter.js';

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
        case 'matchEnd':
          this.banner = { text: 'FIM DE JOGO', time: 2.2, max: 2.2, color: '#ffffff' };
          break;
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

    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    ctx.fillStyle = '#0b0610';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.setTransform(this.scale, 0, 0, this.scale, sx * this.scale, sy * this.scale);

    this.stage.drawStatic(ctx);
    this.stage.drawHazards(ctx, this.time, false);
    this.drawItems(ctx);
    this.drawProjectiles(ctx);
    this.drawPlayers(ctx, alpha);
    this.particles.draw(ctx);
    this.stage.drawHazards(ctx, this.time, true);
    if (this.debug) this.drawDebug(ctx);

    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    this.drawOffscreen(ctx, alpha);
    this.drawHud(ctx);
  }

  updateAmbient(dt) {
    const P = this.particles;
    const g = this.game;
    const chance = (rate) => Math.random() < rate * dt;

    for (const h of g.map.hazards) {
      if (h.type === 'lava' && chance(5)) {
        P.add({ x: h.x + Math.random() * h.w, y: h.y, vx: (Math.random() - 0.5) * 20, vy: -40 - Math.random() * 60, life: 1.4, size: 1.8, color: '#ffb347', gravity: -10 });
      }
    }
    for (const p of g.players) {
      if (p.state !== 'alive') continue;
      const cx = p.x + p.w / 2;
      if (p.element === 'fogo' && chance(18)) {
        P.add({ x: cx + (Math.random() - 0.5) * 10, y: p.y - 4, vx: (Math.random() - 0.5) * 30, vy: -60 - Math.random() * 40, life: 0.5, size: 2.2, grow: -3, color: Math.random() < 0.5 ? '#ffd25a' : '#ff6a1f' });
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
      if (p.inHazard && chance(20)) {
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
      drawFighter(ctx, p, x, y, this.vis.get(p.id), this.time, {
        teamColor: this.teamColor.get(p.team),
        isLocal: p.id === this.localId,
      });
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

  drawProjectiles(ctx) {
    for (const pr of this.game.projectiles) {
      const el = ELEMENTS[pr.element];
      ctx.save();
      ctx.translate(pr.x, pr.y);
      if (pr.kind === 'arremesso') {
        ctx.rotate(this.time * 22 * Math.sign(pr.vx || 1));
        ctx.translate(0, 18);
        if (pr.weapon === 'espada') drawSword(ctx, el, this.time);
        else drawStaff(ctx, el, this.time);
      } else if (pr.element === 'agua') {
        ctx.scale(Math.sign(pr.vx) || 1, 1);
        ctx.shadowColor = el.color;
        ctx.shadowBlur = 14;
        const g = ctx.createLinearGradient(-pr.r * 2.4, 0, pr.r, 0);
        g.addColorStop(0, 'rgba(120,200,255,0)');
        g.addColorStop(1, '#bfefff');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(-pr.r * 0.7, 0, pr.r * 1.8, pr.r * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pr.r * 0.3, -2, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.shadowColor = el.color;
        ctx.shadowBlur = 20;
        const g = ctx.createRadialGradient(0, 0, 1, 0, 0, pr.r * 1.3);
        g.addColorStop(0, '#fff7c2');
        g.addColorStop(0.45, el.light);
        g.addColorStop(1, el.color);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, pr.r * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Bolhas na borda da tela mostrando quem foi arremessado para fora.
  drawOffscreen(ctx, alpha) {
    for (const p of this.game.players) {
      if (p.state !== 'alive') continue;
      const x = p.px + (p.x - p.px) * alpha + p.w / 2;
      const y = p.py + (p.y - p.py) * alpha + p.h / 2;
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

    // Cartões dos jogadores, agrupados por time
    const teams = g.teams();
    const ordered = teams.flatMap((t) => g.players.filter((p) => p.team === t));
    const n = ordered.length;
    const gap = 10;
    const extraGap = teams.length > 1 && teams.length <= 4 ? 30 : 0;
    const cardW = Math.min(210, (VIEW_W - 40 - gap * (n - 1) - extraGap * (teams.length - 1)) / n);
    const totalW = cardW * n + gap * (n - 1) + extraGap * (teams.length - 1);
    let x = (VIEW_W - totalW) / 2;
    const y = VIEW_H - 74;
    let prevTeam = ordered[0]?.team;
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

    const me = g.playerById(this.localId);
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
