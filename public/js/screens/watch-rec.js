// Gravação de vídeo do modo Assistir, feita pelo próprio navegador.
// A cada quadro monta a imagem do vídeo: o pedaço do jogo que aparece na
// tela, o placar de cima (FOGO vs ÁGUA, dano e vidas) e o "VENCEDOR" no fim.
// Em pé sai 1080x1920 (TikTok/Reels); deitado, 1920x1080 (YouTube).
// No fim baixa o arquivo (MP4 quando o navegador sabe gravar MP4; se não, WebM).

import { audioStream } from '../audio.js';

const TYPES = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];

export const canRecord = () => typeof MediaRecorder !== 'undefined' && Boolean(HTMLCanvasElement.prototype.captureStream);

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class WatchRecorder {
  /**
   * @param {object} o
   * @param {HTMLCanvasElement} o.source canvas do jogo
   * @param {() => boolean} o.portrait vídeo em pé?
   * @param {() => {players, banner, winner}} o.info placar e vencedor
   * @param {string} o.name nome do arquivo (sem extensão)
   */
  constructor({ source, portrait, info, name }) {
    this.source = source;
    this.portraitMode = portrait();
    this.info = info;
    this.name = name;
    this.out = document.createElement('canvas');
    this.out.width = this.portraitMode ? 1080 : 1920;
    this.out.height = this.portraitMode ? 1920 : 1080;
    this.ctx = this.out.getContext('2d');
    this.chunks = [];
    this.running = false;
  }

  start() {
    const stream = this.out.captureStream(30);
    const audio = audioStream();
    for (const t of audio?.getAudioTracks() ?? []) stream.addTrack(t);
    this.type = TYPES.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
    this.rec = new MediaRecorder(stream, { mimeType: this.type || undefined, videoBitsPerSecond: 10_000_000 });
    this.rec.ondataavailable = (e) => { if (e.data.size) this.chunks.push(e.data); };
    this.running = true;
    this.draw();
    this.rec.start(1000);
  }

  draw = () => {
    if (!this.running) return;
    const { ctx, out, source } = this;
    const W = out.width;
    const H = out.height;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    if (source.width && source.height) {
      if (this.portraitMode) {
        // o meio do jogo (a parte que aparece no celular em pé)
        const vw = source.height * (W / H);
        ctx.drawImage(source, (source.width - vw) / 2, 0, vw, source.height, 0, 0, W, H);
      } else {
        ctx.drawImage(source, 0, 0, W, H);
      }
    }
    const info = this.info();
    // no fim: escurece a luta, mas o placar continua bem visível por cima
    if (info.winner) {
      ctx.fillStyle = 'rgba(10,6,18,.55)';
      ctx.fillRect(0, 0, W, H);
    }
    this.drawMark();
    if (info.banner) this.drawBanner(info.players);
    if (info.intro) this.drawIntro(info.intro);
    if (info.winner) this.drawWinner(info.winner);
    this.frame = requestAnimationFrame(this.draw);
  };

  drawBanner(players) {
    const { ctx, out } = this;
    const portrait = this.portraitMode;
    const W = out.width;
    const bw = portrait ? W - 48 : 760;
    const bh = portrait ? 230 : 120;
    const x = (W - bw) / 2;
    const y = portrait ? 70 : 34;
    ctx.save();
    ctx.fillStyle = 'rgba(14,8,24,.72)';
    roundRect(ctx, x, y, bw, bh, portrait ? 40 : 60);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const nameSize = portrait ? 96 : 64;
    ctx.font = `italic 900 ${portrait ? 62 : 44}px system-ui, sans-serif`;
    ctx.fillStyle = '#ffd25a';
    ctx.fillText('VS', W / 2, y + (portrait ? 128 : 80));
    players.forEach((p, i) => {
      const cx = W / 2 + (i === 0 ? -1 : 1) * bw * 0.29;
      ctx.globalAlpha = p.out ? 0.4 : 1;
      ctx.font = `italic 900 ${nameSize}px system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.fillText(p.name, cx, y + (portrait ? 108 : 82) + 5);
      ctx.fillStyle = p.color;
      ctx.fillText(p.name, cx, y + (portrait ? 108 : 82));
      if (portrait) {
        ctx.font = '900 80px system-ui, sans-serif';
        const dmg = `${p.damage}%`;
        const dots = '●'.repeat(Math.max(0, p.lives));
        const dw = ctx.measureText(dmg).width;
        ctx.font = '900 40px system-ui, sans-serif';
        const lw = ctx.measureText(dots).width;
        const left = cx - (dw + 14 + lw) / 2;
        ctx.textAlign = 'left';
        ctx.font = '900 80px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(0,0,0,.5)';
        ctx.fillText(dmg, left, y + 200 + 5);
        ctx.fillStyle = '#fff';
        ctx.fillText(dmg, left, y + 200);
        ctx.font = '900 40px system-ui, sans-serif';
        ctx.fillStyle = p.color;
        ctx.fillText(dots, left + dw + 14, y + 196);
        ctx.textAlign = 'center';
      }
    });
    ctx.restore();
  }

  // marca d'água bem discreta, em cima do placar
  drawMark() {
    const { ctx, out } = this;
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${this.portraitMode ? 26 : 22}px system-ui, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('@jogaelementum', out.width / 2, this.portraitMode ? 46 : 18);
    ctx.restore();
  }

  // frase dourada do começo
  drawIntro({ text, alpha, scale = 1 }) {
    const { ctx, out } = this;
    const W = out.width;
    const H = out.height;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = this.portraitMode ? 120 : 130;
    ctx.font = `italic 900 ${size}px system-ui, sans-serif`;
    // quebra em duas linhas se não couber
    const maxW = W * 0.86;
    const words = text.split(' ');
    let lines = [text];
    if (ctx.measureText(text).width > maxW && words.length > 1) {
      let best = null;
      for (let i = 1; i < words.length; i++) {
        const a = words.slice(0, i).join(' ');
        const b = words.slice(i).join(' ');
        const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
        if (!best || w < best.w) best = { w, lines: [a, b] };
      }
      lines = best.lines;
    }
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest > maxW) {
      size = Math.floor(size * maxW / widest);
      ctx.font = `italic 900 ${size}px system-ui, sans-serif`;
    }
    const grad = ctx.createLinearGradient(0, -size, 0, size);
    grad.addColorStop(0, '#fff2a8');
    grad.addColorStop(0.5, '#ffd25a');
    grad.addColorStop(1, '#f0a020');
    lines.forEach((line, i) => {
      const y = (i - (lines.length - 1) / 2) * size * 1.05;
      ctx.lineWidth = size * 0.14;
      ctx.strokeStyle = 'rgba(40,18,0,.85)';
      ctx.lineJoin = 'round';
      ctx.strokeText(line, 0, y);
      ctx.shadowColor = 'rgba(255,190,60,.7)';
      ctx.shadowBlur = size * 0.35;
      ctx.fillStyle = grad;
      ctx.fillText(line, 0, y);
      ctx.shadowBlur = 0;
    });
    ctx.restore();
  }

  drawWinner(w) {
    const { ctx, out } = this;
    const W = out.width;
    const H = out.height;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `800 ${this.portraitMode ? 44 : 34}px system-ui, sans-serif`;
    ctx.fillStyle = '#ffd25a';
    ctx.fillText('V E N C E D O R', W / 2, H / 2 - (this.portraitMode ? 110 : 90));
    const size = this.portraitMode ? 190 : 170;
    ctx.font = `italic 900 ${size}px system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillText(w.name, W / 2, H / 2 + size * 0.35 + 8);
    ctx.fillStyle = w.color;
    ctx.fillText(w.name, W / 2, H / 2 + size * 0.35);
    // legenda: o site e o @, como legenda de vídeo
    const lines = [['jogaelementum.com.br', this.portraitMode ? 50 : 40], ['@jogaelementum', this.portraitMode ? 40 : 32]];
    let y = H / 2 + size * 0.35 + (this.portraitMode ? 110 : 90);
    for (const [text, fs] of lines) {
      ctx.font = `800 ${fs}px system-ui, sans-serif`;
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = 'rgba(0,0,0,.62)';
      roundRect(ctx, W / 2 - tw / 2 - fs * 0.45, y - fs * 0.78, tw + fs * 0.9, fs * 1.32, fs * 0.28);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, W / 2, y - fs * 0.12);
      ctx.textBaseline = 'alphabetic';
      y += fs * 1.6;
    }
    ctx.restore();
  }

  // para e baixa o vídeo
  stop() {
    if (!this.running) return Promise.resolve(null);
    this.running = false;
    cancelAnimationFrame(this.frame);
    return new Promise((resolve) => {
      this.rec.onstop = () => {
        const type = this.rec.mimeType || this.type || 'video/webm';
        const blob = new Blob(this.chunks, { type });
        const ext = type.includes('mp4') ? 'mp4' : 'webm';
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${this.name}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
        resolve({ blob, ext });
      };
      this.rec.stop();
    });
  }
}
