// Coleção de acessórios do jogador (guardada no aparelho). Cada acessório é
// ganho de algum jeito (por enquanto, por conquista) e o jogador escolhe qual
// usar. No futuro a loja de moedas também vai dar acessórios (docs/IDEIAS.md).

import { cloudDirty } from './cloud.js';

const KEY = 'brawl.colecao';

export const ACCESSORIES = {
  capacete: {
    id: 'capacete',
    name: 'Capacete de astronauta',
    icon: 'capacete',
    how: 'Conquista de ouro "Astronauta": passe do andar 50 da Torre.',
  },
  coroa: {
    id: 'coroa',
    name: 'Coroa do Imperador',
    icon: 'coroa',
    how: 'Conquista de ouro "Imperador": no Difícil, vença o Rei da Ilha no Castelo e na Pirâmide sem o outro time marcar ponto.',
  },
  pirata: {
    id: 'pirata',
    name: 'Chapéu de pirata com tapa-olho',
    icon: 'pirata',
    how: 'Conquista de ouro "Capitão Pirata": no Difícil, derrube 5 inimigos com a ajuda do canhão no Navio Voador.',
  },
};

export function loadCollection() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (v && Array.isArray(v.owned)) return { owned: v.owned.filter((id) => ACCESSORIES[id]), equipped: ACCESSORIES[v.equipped] ? v.equipped : null };
  } catch {
    // sem armazenamento
  }
  return { owned: [], equipped: null };
}

function saveCollection(c) {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
    cloudDirty();
  } catch {
    // navegação privada
  }
}

// Ganha um acessório (já fica equipado, se `equip`). Devolve true se era novo.
export function grantAccessory(id, equip = true) {
  const c = loadCollection();
  if (!ACCESSORIES[id] || c.owned.includes(id)) return false;
  c.owned.push(id);
  if (equip) c.equipped = id;
  saveCollection(c);
  return true;
}

export function equipAccessory(id) {
  const c = loadCollection();
  c.equipped = id && c.owned.includes(id) ? id : null;
  saveCollection(c);
}

export const equippedAccessory = () => loadCollection().equipped;
