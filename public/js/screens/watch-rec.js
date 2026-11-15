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
    // captureStream(0): cada quadro entra no vídeo na hora exata em que é
    // desenhado (requestFrame), para o som não se desencontrar da imagem
    const stream = this.out.captureStream(0);
    this.track = stream.getVideoTracks()[0];
    const audio = audioStream();
    for (const t of audio?.getAudioTracks() ?? []) stream.addTrack(t);
    this.type = TYPES.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
    this.rec = new MediaRecorder(stream, { mimeType: this.type || undefined, videoBitsPerSecond: 16_000_000, audioBitsPerSecond: 160_000 });
    this.rec.ondataavailable = (e) => { if (e.data.size) this.chunks.push(e.data); };
    this.running = true;
    this.draw();
    this.rec.start(1000);
  }

  // liga no laço do jogo: copia cada quadro logo depois que ele é desenhado
  attach(runner) {
    this.attached = runner;
    cancelAnimationFrame(this.frame);
    runner.afterFrame = this.draw;
  }

  detach() {
    if (this.attached) this.attached.afterFrame = null;
    this.attached = null;
    if (this.running) this.frame = requestAnimationFrame(this.draw);
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
        // o canvas do jogo já é a faixa em pé; se a proporção não bater
        // exatamente, corta o que sobrar dos lados
        const vw = Math.min(source.width, source.height * (W / H));
        ctx.drawImage(source, (source.width - vw) / 2, 0, vw, source.height, 0, 0, W, H);
      } else {
        ctx.drawImage(source, 0, 0, W, H);
      }
    }
    const info = this.info();
    this.drawMark();
    if (info.banner) this.drawBanner(info.players);
    if (info.intro) this.drawIntro(info.intro);
    if (info.winner) this.drawWinner(info.winner);
    this.track?.requestFrame?.();
    // sem partida rodando (fim): continua sozinho
    if (!this.attached) this.frame = requestAnimationFrame(this.draw);
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

  // VENCEDOR entrando junto com a animação de vitória (sem escurecer)
  drawWinner(w) {
    const { ctx, out } = this;
    const W = out.width;
    const H = out.height;
    const t = (performance.now() - (w.start ?? 0)) / 1000;
    const ease = (x) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;
    const portrait = this.portraitMode;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    const outlined = (text, x, y, fill, size) => {
      ctx.lineWidth = Math.max(4, size * 0.12);
      ctx.strokeStyle = 'rgba(0,0,0,.75)';
      ctx.strokeText(text, x, y);
      ctx.fillStyle = fill;
      ctx.fillText(text, x, y);
    };
    // "V E N C E D O R"
    const a1 = ease(t / 0.35);
    ctx.globalAlpha = a1;
    const s1 = portrait ? 44 : 34;
    ctx.font = `800 ${s1}px system-ui, sans-serif`;
    outlined('V E N C E D O R', W / 2, H / 2 - (portrait ? 110 : 90) - (1 - a1) * 30, '#ffd25a', s1);
    // nome do vencedor: entra crescendo
    const a2 = ease((t - 0.25) / 0.4);
    if (a2 > 0) {
      const size = portrait ? 190 : 170;
      const sc = 0.6 + 0.4 * a2 + Math.sin(Math.min(1, (t - 0.25) / 0.6) * Math.PI) * 0.08;
      ctx.globalAlpha = a2;
      ctx.save();
      ctx.translate(W / 2, H / 2 + size * 0.35);
      ctx.scale(sc, sc);
      ctx.font = `italic 900 ${size}px system-ui, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,.6)';
      ctx.shadowBlur = 24;
      outlined(w.name, 0, 0, w.color, size);
      ctx.restore();
    }
    // legenda (site e @): texto branco com contorno, sem fundo
    const a3 = ease((t - 0.8) / 0.4);
    if (a3 > 0) {
      ctx.globalAlpha = a3;
      const lines = [['jogaelementum.com.br', portrait ? 50 : 40], ['@jogaelementum', portrait ? 40 : 32]];
      let y = H / 2 + (portrait ? 190 : 170) * 0.35 + (portrait ? 110 : 90);
      for (const [text, fs] of lines) {
        ctx.font = `800 ${fs}px system-ui, sans-serif`;
        ctx.shadowColor = 'rgba(0,0,0,.7)';
        ctx.shadowBlur = 10;
        outlined(text, W / 2, y, '#ffffff', fs);
        ctx.shadowBlur = 0;
        y += fs * 1.45;
      }
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
