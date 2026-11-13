// Progresso na conta: nível/XP, conquistas, coleção e foto ficam guardados no
// servidor. O jogo continua lendo e gravando no aparelho (localStorage), e
// este módulo mantém o aparelho e a conta iguais:
//   - ao entrar na conta, o que está no servidor vem para o aparelho
//     (na primeira vez, o que já estava no aparelho vai para a conta);
//   - a cada mudança, manda para o servidor (um pouco depois, juntando várias);
//   - ao sair da conta, o aparelho volta ao progresso de convidado.

import { api } from './api.js';

const PARTS = { perfil: 'brawl.perfil', conquistas: 'brawl.conquistas', colecao: 'brawl.colecao', avatar: 'brawl.avatar' };
const OWNER = 'brawl.nuvem.dono';     // de quem é o progresso que está no aparelho
const GUEST = 'brawl.nuvem.convidado'; // progresso de convidado guardado enquanto há conta

let user = null;
let rev = null;
let ready = false;
let timer = null;
let onChange = () => {};

const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };

function readLocal() {
  const data = {};
  for (const [part, key] of Object.entries(PARTS)) {
    try {
      const v = JSON.parse(get(key) ?? 'null');
      if (v && typeof v === 'object') data[part] = v;
    } catch { /* ignora o que estiver estragado */ }
  }
  return data;
}

function writeLocal(data) {
  for (const [part, key] of Object.entries(PARTS)) set(key, data?.[part] ? JSON.stringify(data[part]) : null);
}

function adopt(res) {
  rev = res.rev ?? null;
  writeLocal(res.data ?? {});
  onChange();
}

/** chamado quando o progresso precisa ser redesenhado (veio do servidor) */
export function onCloudChange(fn) {
  onChange = fn;
}

/** entrou (user) ou saiu (null) da conta */
export async function cloudUser(u) {
  const name = u?.username ?? null;
  if (name === user) return;
  clearTimeout(timer);
  ready = false;
  rev = null;
  const owner = get(OWNER);
  if (!name) {
    user = null;
    // volta o progresso de convidado
    if (owner) {
      writeLocal(JSON.parse(get(GUEST) ?? '{}'));
      set(GUEST, null);
      set(OWNER, null);
      onChange();
    }
    return;
  }
  user = name;
  if (!owner) set(GUEST, JSON.stringify(readLocal()));
  let res;
  try {
    res = await api.progress();
  } catch {
    return; // sem servidor: fica com o que está no aparelho
  }
  if (user !== name) return;
  if (res.data) {
    adopt(res);
  } else {
    // conta sem nada guardado: leva o que é deste aparelho (se era de
    // convidado ou desta mesma conta; nunca o progresso de outra conta)
    if (owner && owner !== name) writeLocal(JSON.parse(get(GUEST) ?? '{}'));
    onChange();
    ready = true;
    set(OWNER, name);
    await push();
    return;
  }
  set(OWNER, name);
  ready = true;
}

/** alguma parte do progresso mudou no aparelho */
export function cloudDirty() {
  if (!user || !ready) return;
  clearTimeout(timer);
  timer = setTimeout(push, 1500);
}

async function push() {
  if (!user || !ready) return;
  const name = user;
  try {
    const res = await api.saveProgress(readLocal(), rev);
    if (user === name) rev = res.rev;
  } catch (err) {
    // o servidor mudou (administrador) ou recusou: fica a versão dele
    if (user === name && (err.status === 409 || err.status === 422) && err.body && 'data' in err.body) {
      if (err.body.data) adopt(err.body);
      else rev = err.body.rev ?? null;
    }
  }
}
