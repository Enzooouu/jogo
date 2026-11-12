// Tela ONLINE: criar sala (código de 6 números) ou entrar com código, e a
// sala de espera de 30 segundos (o dono escolhe modo e mapa; cada um escolhe
// o personagem). Quem manda é o servidor: aqui só mostramos e enviamos as
// escolhas.

import { ELEMENTS, enabledElements } from '/shared/elements.js';
import { getMap } from '/shared/maps.js';
import { ONLINE_MODES, mapsFor, RANDOM } from '/shared/net.js';
import { drawPortrait, fitCanvas } from '../render/portrait.js';
import { iconEl } from '../icons.js';

const $ = (sel) => document.querySelector(sel);

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

export class OnlineScreen {
  /**
   * @param {object} o
   * @param {import('../net/online-client.js').OnlineClient} o.client
   * @param {() => string|null} o.getHat acessório que o jogador está usando
   * @param {() => Promise<{username, online}[]>} o.loadFriends amigos (se tiver conta)
   * @param {() => boolean} o.offline versão sem servidor
   * @param {string} o.onlineUrl endereço onde o online funciona (para a versão sem servidor)
   * @param {() => void} o.onBack
   */
  constructor({ client, getHat, loadFriends, offline, onlineUrl, onBack }) {
    this.client = client;
    this.getHat = getHat;
    this.loadFriends = loadFriends;
    this.offline = offline;
    this.onlineUrl = onlineUrl;
    this.lobby = null;
    this.myElement = RANDOM;
    this.ready = false;

    $('#online-back').addEventListener('click', () => {
      this.leave();
      onBack();
    });
    $('#online-create').addEventListener('click', () => this.create());
    $('#online-join-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.join($('#online-code').value);
    });
    $('#online-code').addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    });
    $('#ol-copy').addEventListener('click', () => {
      const code = this.lobby?.code;
      if (!code) return;
      navigator.clipboard?.writeText(code).then(() => this.flash('#ol-copy', 'Copiado!'), () => {});
    });
    $('#ol-ready').addEventListener('click', () => {
      this.ready = !this.ready;
      this.client.send({ t: 'ready', ready: this.ready });
    });
    $('#ol-leave').addEventListener('click', () => {
      this.leave();
      this.showEntry();
    });

    client.on('lobby', (m) => this.onLobby(m));
    client.on('error', (m) => this.status(m.error, true));
    client.on('info', (m) => this.status(m.message));
    client.on('left', (m) => this.status(`${m.name} saiu da sala. Esperando alguém entrar…`));
    client.on('close', () => {
      if (this.lobby) this.status('A conexão com o servidor caiu. Tente de novo.', true);
      this.lobby = null;
      this.showEntry();
    });
    this.tick = setInterval(() => this.updateTimer(), 250);
  }

  // ------------------------------------------------------------ entrada

  async open({ code = null } = {}) {
    if (this.offline()) {
      this.showEntry();
      $('#online-create').disabled = true;
      $('#online-join-form button').disabled = true;
      this.status(this.onlineUrl
        ? `Esta versão do jogo não tem servidor. Para jogar online, abra: ${this.onlineUrl}`
        : 'Esta versão do jogo não tem servidor, então o modo online não funciona aqui.', true);
      return;
    }
    $('#online-create').disabled = false;
    $('#online-join-form button').disabled = false;
    if (this.lobby && !code) {
      this.showLobby();
      return;
    }
    this.showEntry();
    try {
      await this.client.connect();
      this.status(this.client.account ? `Conectado como ${this.client.name}.` : `Conectado como ${this.client.name ?? 'convidado'} (entre na sua conta para usar seu nome e convidar amigos).`);
      if (code) this.join(code);
    } catch (err) {
      this.status(err.message, true);
    }
  }

  async create() {
    try {
      await this.client.connect();
    } catch (err) {
      this.status(err.message, true);
      return;
    }
    this.client.send({ t: 'create' });
  }

  async join(code) {
    code = String(code ?? '').replace(/\D/g, '');
    if (code.length !== 6) {
      this.status('O código tem 6 números.', true);
      return;
    }
    try {
      await this.client.connect();
    } catch (err) {
      this.status(err.message, true);
      return;
    }
    this.client.send({ t: 'join', code });
  }

  leave() {
    if (this.lobby) this.client.send({ t: 'leave' });
    this.lobby = null;
    this.ready = false;
  }

  status(text, error = false) {
    const s = $('#online-status');
    s.textContent = text;
    s.classList.toggle('error', error);
    // na sala de espera o aviso aparece no lugar do relógio
    if (this.lobby && text) {
      this.notice = { text, until: Date.now() + 4000, error };
      this.updateTimer();
    }
  }

  flash(sel, text) {
    const b = $(sel);
    const old = b.textContent;
    b.textContent = text;
    setTimeout(() => { b.textContent = old; }, 1200);
  }

  showEntry() {
    $('#online-entry').hidden = false;
    $('#online-lobby').hidden = true;
  }

  showLobby() {
    $('#online-entry').hidden = true;
    $('#online-lobby').hidden = false;
    requestAnimationFrame(() => this.drawPortraits());
  }

  // ------------------------------------------------------------ sala de espera

  onLobby(m) {
    const first = !this.lobby;
    this.lobby = m;
    this.lobbyAt = Date.now();
    const me = m.members.find((x) => x.you);
    this.ready = Boolean(me?.ready);
    if (first) {
      // manda o personagem e o acessório escolhidos (o último usado fica salvo)
      this.client.send({ t: 'pick', element: this.myElement, hat: this.getHat() });
      this.refreshFriends();
    }
    this.renderLobby();
    if ($('#online-lobby').hidden) this.showLobby();
  }

  renderLobby() {
    const m = this.lobby;
    if (!m) return;
    $('#ol-code').textContent = m.code;
    // jogadores
    const box = $('#ol-players');
    box.innerHTML = '';
    for (let i = 0; i < 2; i++) {
      const p = m.members[i];
      const slot = el('div', `ol-player${p ? '' : ' empty'}${p?.you ? ' you' : ''}${p?.ready ? ' ready' : ''}`);
      const c = el('canvas');
      c.dataset.element = p ? (p.element && p.element !== RANDOM ? p.element : '') : '';
      slot.appendChild(c);
      const info = el('div');
      if (p) {
        const nm = el('b', '', `${p.host ? ' ' : ''}${p.name}${p.you ? ' (você)' : ''}`);
        if (p.host) nm.prepend(iconEl('coroa', 'icon host', 'Criou a sala'));
        info.append(nm);
        info.append(el('small', '', p.element && p.element !== RANDOM ? ELEMENTS[p.element].name : 'Personagem aleatório'));
        info.append(el('span', `ol-badge${p.ready ? ' on' : ''}`, p.ready ? 'PRONTO' : 'escolhendo…'));
      } else {
        info.append(el('b', '', 'Esperando seu amigo…'));
        info.append(el('small', '', `Passe o código ${m.code} para ele entrar.`));
      }
      slot.appendChild(info);
      box.appendChild(slot);
    }
    if (m.members.length === 2) box.insertBefore(el('div', 'ol-vs', m.mode === 'torre' ? '+' : 'VS'), box.children[1]);

    // modos (só o dono muda)
    const host = m.host;
    $('#ol-mode-note').textContent = host ? '(você escolhe)' : '(quem criou a sala escolhe)';
    $('#ol-map-note').textContent = $('#ol-mode-note').textContent;
    const modes = $('#ol-modes');
    modes.innerHTML = '';
    for (const [id, info] of Object.entries(ONLINE_MODES)) {
      const b = el('button', id === m.mode ? 'on' : '', info.name);
      b.type = 'button';
      b.disabled = !host;
      b.addEventListener('click', () => this.client.send({ t: 'config', mode: id, mapId: m.mapId }));
      modes.appendChild(b);
    }
    const maps = $('#ol-maps');
    maps.innerHTML = '';
    const list = m.mode === 'torre' ? ['torre'] : [RANDOM, ...mapsFor(m.mode)];
    for (const id of list) {
      const b = el('button', id === m.mapId || (m.mode === 'torre' && id === 'torre') ? 'on' : '', id === RANDOM ? ' Aleatório' : getMap(id).name);
      if (id === RANDOM) b.prepend(iconEl('dado'));
      b.type = 'button';
      b.disabled = !host;
      b.addEventListener('click', () => this.client.send({ t: 'config', mode: m.mode, mapId: id }));
      maps.appendChild(b);
    }

    // personagens
    const els = $('#ol-elements');
    if (!els.childElementCount) {
      for (const id of [RANDOM, ...enabledElements().map((e) => e.id)]) {
        const b = el('button', 'ol-el');
        b.type = 'button';
        b.dataset.element = id;
        const c = el('canvas');
        c.dataset.element = id === RANDOM ? '' : id;
        b.append(c, el('span', '', id === RANDOM ? 'Aleatório' : ELEMENTS[id].name));
        b.addEventListener('click', () => {
          this.myElement = id;
          this.client.send({ t: 'pick', element: id, hat: this.getHat() });
        });
        els.appendChild(b);
      }
    }
    const mine = m.members.find((x) => x.you)?.element ?? this.myElement;
    for (const b of els.children) b.classList.toggle('on', b.dataset.element === (mine || RANDOM));

    const ready = $('#ol-ready');
    ready.textContent = this.ready ? 'PRONTO (cancelar) ' : 'ESTOU PRONTO';
    if (this.ready) ready.append(iconEl('check'));
    ready.classList.toggle('on', this.ready);
    ready.disabled = m.members.length < 2;
    this.updateTimer();
    requestAnimationFrame(() => this.drawPortraits());
  }

  updateTimer() {
    const m = this.lobby;
    if (!m || $('#online-lobby').hidden) return;
    const t = $('#ol-timer');
    if (this.notice && Date.now() < this.notice.until) {
      t.textContent = this.notice.text;
      t.classList.toggle('error', this.notice.error);
      return;
    }
    t.classList.remove('error');
    if (m.members.length < 2 || m.secondsLeft == null) {
      t.textContent = 'Esperando seu amigo entrar com o código…';
      return;
    }
    const left = Math.max(0, m.secondsLeft - Math.floor((Date.now() - this.lobbyAt) / 1000));
    t.textContent = `A partida começa em ${left} s (ou quando os dois estiverem prontos)`;
    t.classList.toggle('hurry', left <= 5);
  }

  drawPortraits() {
    for (const c of document.querySelectorAll('#online-lobby canvas')) {
      const { ctx, w, h } = fitCanvas(c);
      ctx.clearRect(0, 0, w, h);
      const id = c.dataset.element;
      if (!id) {
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        ctx.font = `900 ${Math.round(h * 0.5)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', w / 2, h / 2);
        continue;
      }
      drawPortrait(ctx, id, w / 2, h * 0.95, Math.min(1.3, h / 80), { facing: 1 });
    }
  }

  // ------------------------------------------------------------ amigos

  async refreshFriends() {
    const box = $('#ol-friends-box');
    const list = this.lobby ? await this.loadFriends().catch(() => null) : null;
    const online = (list ?? []).filter((f) => f.online);
    box.hidden = !online.length;
    const wrap = $('#ol-friends');
    wrap.innerHTML = '';
    for (const f of online) {
      const b = el('button', 'btn small', `Convidar ${f.username}`);
      b.type = 'button';
      b.addEventListener('click', () => this.client.send({ t: 'invite', username: f.username }));
      wrap.appendChild(b);
    }
    clearTimeout(this.friendTimer);
    if (this.lobby) this.friendTimer = setTimeout(() => this.refreshFriends(), 10000);
  }
}
