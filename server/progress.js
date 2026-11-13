// Regras para gravar o progresso que o jogo manda (nível/XP, conquistas,
// coleção e foto). As partidas contra bots rodam no navegador, então o
// servidor não tem como conferir cada golpe; mas ele barra o que é
// impossível: XP ou partidas demais em pouco tempo, números negativos,
// dados gigantes ou com partes desconhecidas.

export const PROGRESS_PARTS = ['perfil', 'conquistas', 'colecao', 'avatar'];
export const MAX_PROGRESS_BYTES = 64 * 1024;

// XP que dá para ganhar jogando: muito mais que o normal, para não barrar
// ninguém honesto (uma partida rende umas centenas de XP)
const XP_BASE = 4000;
const XP_PER_MINUTE = 1500;
const MATCHES_BASE = 10;
const MATCHES_PER_MINUTE = 6;
// primeira vez (traz o que já tinha neste aparelho, de antes da conta)
const FIRST_XP_MAX = 250000;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function badNumbers(v, depth = 0) {
  if (depth > 6) return true;
  if (typeof v === 'number') return !Number.isFinite(v) || v < 0;
  if (Array.isArray(v)) return v.some((x) => badNumbers(x, depth + 1));
  if (isObj(v)) return Object.values(v).some((x) => badNumbers(x, depth + 1));
  return false;
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/**
 * @param {object} data o que o jogo mandou
 * @param {{data, at}|null} old o que estava guardado (`at` em segundos)
 * @param {number} now segundos
 * @returns {string|null} o erro, ou null se pode gravar
 */
export function checkProgress(data, old, now = Date.now() / 1000) {
  if (!isObj(data)) return 'Progresso inválido.';
  for (const k of Object.keys(data)) if (!PROGRESS_PARTS.includes(k)) return 'Progresso inválido.';
  for (const k of PROGRESS_PARTS) if (data[k] != null && !isObj(data[k])) return 'Progresso inválido.';
  if (JSON.stringify(data).length > MAX_PROGRESS_BYTES) return 'Progresso grande demais.';
  if (badNumbers(data)) return 'Progresso inválido.';
  const xp = num(data.perfil?.xp);
  const matches = num(data.perfil?.matches);
  if (!old) return xp > FIRST_XP_MAX ? 'XP impossível.' : null;
  const minutes = Math.max(0, now - old.at) / 60;
  if (xp - num(old.data.perfil?.xp) > XP_BASE + XP_PER_MINUTE * minutes) return 'XP impossível.';
  if (matches - num(old.data.perfil?.matches) > MATCHES_BASE + MATCHES_PER_MINUTE * minutes) return 'Partidas demais.';
  return null;
}
