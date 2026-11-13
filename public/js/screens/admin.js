// Painel de administrador (só para as contas de shared/dev.js): lista as
// contas, mostra quem está online, muda nível/XP, conquistas e acessórios,
// troca a senha de quem esqueceu e apaga contas. Quem confere a permissão de
// verdade é o servidor; aqui é só a tela.

import { api } from '../api.js';
import { ACHIEVEMENTS } from '/shared/achievements.js';
import { levelInfo, xpToNext, emptyStats } from '/shared/profile-stats.js';
import { ACCESSORIES } from '../collection.js';

const $ = (sel) => document.querySelector(sel);

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

const xpForLevel = (level) => {
  let xp = 0;
  for (let l = 1; l < level; l++) xp += xpToNext(l);
  return xp;
};

const date = (s) => (s ? new Date(`${s.replace(' ', 'T')}Z`).toLocaleDateString('pt-BR') : '—');

export class AdminPanel {
  constructor({ onChangedSelf }) {
    this.body = $('#admin-body');
    this.search = '';
    this.onChangedSelf = onChangedSelf;
  }

  open() {
    this.list();
  }

  // aviso logo abaixo de `after` (o botão usado), ou no topo
  msg(text, error = false, after = null) {
    const m = el('p', `adm-msg${error ? ' error' : ''}`, text);
    if (after?.isConnected) after.after(m);
    else this.body.prepend(m);
    setTimeout(() => m.remove(), 4000);
  }

  async list() {
    let res;
    try {
      res = await api.adminUsers(this.search);
    } catch (err) {
      this.body.replaceChildren(el('p', 'adm-msg error', err.message));
      return;
    }
    const b = this.body;
    b.replaceChildren();
    const form = el('form', 'fr-add');
    const input = el('input');
    input.placeholder = 'Procurar conta…';
    input.value = this.search;
    const go = el('button', 'btn small', 'Procurar');
    form.append(input, go);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.search = input.value.trim();
      this.list();
    });
    b.append(form, el('h3', '', `Contas (${res.total} no total${this.search ? `, ${res.users.length} encontradas` : ''})`));
    if (!res.users.length) b.append(el('p', 'hint', 'Nenhuma conta.'));
    for (const u of res.users) {
      const row = el('button', 'fr-row adm-row');
      row.type = 'button';
      row.append(
        el('span', `adm-dot${u.online ? ' on' : ''}`),
        el('span', 'fr-name', u.username),
        el('span', 'fr-state', `nível ${levelInfo(u.xp).level} · desde ${date(u.createdAt)}`),
      );
      row.addEventListener('click', () => this.detail(u.id));
      b.append(row);
    }
  }

  async detail(id) {
    let res;
    try {
      res = await api.adminUser(id);
    } catch (err) {
      this.msg(err.message, true);
      return;
    }
    const { user } = res;
    const data = res.data ?? {};
    const perfil = { ...emptyStats(), ...(data.perfil ?? {}) };
    const ach = data.conquistas ?? { normal: {}, ouro: {}, counters: { normal: {}, ouro: {} } };
    const col = data.colecao ?? { owned: [], equipped: null };
    const b = this.body;
    b.replaceChildren();

    const back = el('button', 'btn ghost small', '‹ Voltar para a lista');
    back.type = 'button';
    back.addEventListener('click', () => this.list());
    b.append(back, el('h3', '', user.username));
    b.append(el('p', 'hint', `${user.online ? 'Online agora' : 'Offline'} · conta criada em ${date(user.createdAt)} · ${perfil.matches} partidas, ${perfil.wins} vitórias`));

    // nível e XP
    b.append(el('h3', '', 'Nível'));
    const lv = el('div', 'fr-add');
    const level = el('input');
    level.type = 'number';
    level.min = 1;
    level.max = 999;
    level.value = levelInfo(perfil.xp).level;
    const xp = el('input');
    xp.type = 'number';
    xp.min = 0;
    xp.value = Math.floor(perfil.xp);
    level.addEventListener('input', () => { xp.value = xpForLevel(Math.max(1, Number(level.value) || 1)); });
    xp.addEventListener('input', () => { level.value = levelInfo(Number(xp.value) || 0).level; });
    lv.append(el('span', 'hint', 'Nível'), level, el('span', 'hint', 'XP'), xp);
    b.append(lv);

    // conquistas
    b.append(el('h3', '', 'Conquistas'));
    const achBoxes = [];
    for (const a of ACHIEVEMENTS) {
      const row = el('div', 'adm-ach');
      row.append(el('span', '', a.name));
      for (const tier of a.gold ? ['normal', 'ouro'] : ['normal']) {
        const label = el('label', 'toggle small');
        const c = el('input');
        c.type = 'checkbox';
        c.checked = Boolean(ach[tier]?.[a.id]);
        achBoxes.push({ c, tier, id: a.id });
        label.append(c, document.createTextNode(tier === 'ouro' ? ' ouro' : ' normal'));
        row.append(label);
      }
      b.append(row);
    }

    // acessórios
    b.append(el('h3', '', 'Acessórios'));
    const accBoxes = [];
    for (const a of Object.values(ACCESSORIES)) {
      const label = el('label', 'toggle');
      const c = el('input');
      c.type = 'checkbox';
      c.checked = col.owned.includes(a.id);
      accBoxes.push({ c, id: a.id });
      label.append(c, document.createTextNode(` ${a.name}`));
      b.append(label);
    }

    const save = el('button', 'btn small', 'Salvar progresso');
    save.type = 'button';
    save.addEventListener('click', async () => {
      const next = { ...data };
      next.perfil = { ...perfil, xp: Math.max(0, Math.floor(Number(xp.value) || 0)) };
      const conquistas = { normal: { ...ach.normal }, ouro: { ...ach.ouro }, counters: ach.counters ?? { normal: {}, ouro: {} } };
      for (const { c, tier, id: aid } of achBoxes) {
        if (c.checked) conquistas[tier][aid] = conquistas[tier][aid] || true;
        else delete conquistas[tier][aid];
      }
      next.conquistas = conquistas;
      const owned = accBoxes.filter((x) => x.c.checked).map((x) => x.id);
      next.colecao = { owned, equipped: owned.includes(col.equipped) ? col.equipped : null };
      try {
        await api.adminSaveProgress(id, next);
        this.msg('Progresso salvo. O jogador vê a mudança quando abrir o jogo de novo.', false, save.parentElement);
        this.onChangedSelf?.(user.username);
      } catch (err) {
        this.msg(err.message, true, save.parentElement);
      }
    });
    b.append(el('div', 'panel-actions', ''));
    b.lastChild.append(save);

    // senha
    b.append(el('h3', '', 'Trocar a senha'));
    b.append(el('p', 'hint', 'A senha atual nunca aparece (ninguém consegue ver). Aqui você só coloca uma nova, por exemplo para quem esqueceu, e passa para a pessoa.'));
    const pw = el('form', 'fr-add');
    const pass = el('input');
    pass.type = 'text';
    pass.placeholder = 'Nova senha (6 ou mais letras)';
    pass.autocomplete = 'off';
    pw.append(pass, el('button', 'btn small', 'Trocar'));
    pw.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.adminSetPassword(id, pass.value);
        pass.value = '';
        this.msg('Senha trocada. A pessoa foi desconectada e entra com a senha nova.', false, pw);
      } catch (err) {
        this.msg(err.message, true, pw);
      }
    });
    b.append(pw);

    // apagar
    b.append(el('h3', '', 'Apagar conta'));
    const del = el('button', 'btn ghost small danger', `Apagar a conta ${user.username}`);
    del.type = 'button';
    del.addEventListener('click', async () => {
      const typed = window.prompt(`Isso apaga a conta, o progresso e os amigos de ${user.username} para sempre.\nPara confirmar, digite o nome da conta:`);
      if (typed?.trim().toLowerCase() !== user.username.toLowerCase()) return;
      try {
        await api.adminDeleteUser(id);
        await this.list();
        this.msg(`Conta ${user.username} apagada.`);
      } catch (err) {
        this.msg(err.message, true);
      }
    });
    b.append(del);
  }
}
