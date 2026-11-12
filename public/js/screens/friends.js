// Painel de amigos (menu inicial): adicionar pelo nome da conta, pedidos
// recebidos e enviados, lista com quem está online agora e convite para a
// sala online.

import { api } from '../api.js';

const $ = (sel) => document.querySelector(sel);

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

export class FriendsPanel {
  /**
   * @param {object} o
   * @param {() => object|null} o.getUser conta logada
   * @param {() => boolean} o.offline versão sem servidor
   * @param {() => void} o.onLogin abrir a tela de entrar
   * @param {(username) => void} o.onPlay chamar um amigo para jogar (cria a sala e convida)
   */
  constructor({ getUser, offline, onLogin, onPlay }) {
    this.getUser = getUser;
    this.offline = offline;
    this.onLogin = onLogin;
    this.onPlay = onPlay;
    this.message = null;
  }

  async open() {
    await this.render();
    clearInterval(this.poll);
    // atualiza quem está online enquanto o painel está aberto
    this.poll = setInterval(() => {
      if ($('#friends-panel').hidden) clearInterval(this.poll);
      else this.render();
    }, 8000);
  }

  say(text, error = false) {
    this.message = { text, error };
  }

  async render() {
    const body = $('#friends-body');
    if (this.offline()) {
      body.innerHTML = '';
      body.appendChild(el('p', 'hint', 'Os amigos precisam do servidor do jogo. Nesta versão sem servidor eles não funcionam.'));
      return;
    }
    if (!this.getUser()) {
      body.innerHTML = '';
      body.appendChild(el('p', 'hint', 'Entre na sua conta (ou crie uma) para adicionar amigos, ver quem está online e chamar para jogar.'));
      const b = el('button', 'btn', 'Entrar ou criar conta');
      b.type = 'button';
      b.addEventListener('click', () => this.onLogin());
      body.appendChild(b);
      return;
    }
    let data;
    try {
      data = await api.friends();
    } catch (err) {
      body.innerHTML = '';
      body.appendChild(el('p', 'error', err.message));
      return;
    }
    body.innerHTML = '';

    // adicionar
    const form = el('form', 'fr-add');
    const input = el('input');
    input.placeholder = 'Nome da conta do amigo';
    input.maxLength = 20;
    input.autocomplete = 'off';
    const add = el('button', 'btn', 'Adicionar');
    add.type = 'submit';
    form.append(input, add);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = input.value.trim();
      if (!name) return;
      try {
        const r = await api.addFriend(name);
        this.say(r.message);
      } catch (err) {
        this.say(err.message, true);
      }
      this.render();
    });
    body.appendChild(form);
    if (this.message) {
      body.appendChild(el('p', this.message.error ? 'error fr-msg' : 'fr-msg', this.message.text));
      this.message = null;
    }

    // pedidos recebidos
    if (data.incoming.length) {
      body.appendChild(el('h3', '', 'Pedidos de amizade'));
      for (const name of data.incoming) {
        const row = el('div', 'fr-row');
        row.append(el('span', 'fr-name', name));
        const yes = el('button', 'btn small', 'Aceitar');
        yes.type = 'button';
        yes.addEventListener('click', async () => {
          try {
            this.say((await api.acceptFriend(name)).message);
          } catch (err) {
            this.say(err.message, true);
          }
          this.render();
        });
        const no = el('button', 'btn ghost small', 'Recusar');
        no.type = 'button';
        no.addEventListener('click', async () => {
          await api.removeFriend(name).catch(() => {});
          this.render();
        });
        row.append(yes, no);
        body.appendChild(row);
      }
    }

    // amigos (online primeiro)
    body.appendChild(el('h3', '', `Seus amigos (${data.friends.length})`));
    if (!data.friends.length) body.appendChild(el('p', 'hint', 'Você ainda não tem amigos aqui. Adicione pelo nome da conta.'));
    const sorted = [...data.friends].sort((a, b) => b.online - a.online || a.username.localeCompare(b.username));
    for (const f of sorted) {
      const row = el('div', `fr-row${f.online ? ' online' : ''}`);
      row.append(el('i', 'fr-dot'), el('span', 'fr-name', f.username), el('small', 'fr-state', f.online ? 'online agora' : 'offline'));
      if (f.online) {
        const play = el('button', 'btn small', 'Chamar para jogar');
        play.type = 'button';
        play.addEventListener('click', () => this.onPlay(f.username));
        row.appendChild(play);
      }
      const rm = el('button', 'btn ghost small fr-rm', 'Remover');
      rm.type = 'button';
      rm.title = `Desfazer amizade com ${f.username}`;
      rm.addEventListener('click', async () => {
        if (!confirm(`Remover ${f.username} dos seus amigos?`)) return;
        await api.removeFriend(f.username).catch(() => {});
        this.render();
      });
      row.appendChild(rm);
      body.appendChild(row);
    }

    // pedidos enviados
    if (data.outgoing.length) {
      body.appendChild(el('h3', '', 'Esperando aceitar'));
      for (const name of data.outgoing) {
        const row = el('div', 'fr-row');
        row.append(el('span', 'fr-name', name));
        const cancel = el('button', 'btn ghost small', 'Cancelar');
        cancel.type = 'button';
        cancel.addEventListener('click', async () => {
          await api.removeFriend(name).catch(() => {});
          this.render();
        });
        row.appendChild(cancel);
        body.appendChild(row);
      }
    }
  }
}
