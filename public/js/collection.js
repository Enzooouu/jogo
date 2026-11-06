// Coleção de acessórios do jogador (guardada no aparelho). Cada acessório é
// ganho de algum jeito (por enquanto, por conquista) e o jogador escolhe qual
// usar. No futuro a loja de moedas também vai dar acessórios (docs/IDEIAS.md).

const KEY = 'brawl.colecao';

export const ACCESSORIES = {
  capacete: {
    id: 'capacete',
    name: 'Capacete de astronauta',
    icon: '👨‍🚀',
    how: 'Conquista de ouro "Astronauta": passe do andar 50 da Torre.',
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
  } catch {
    // navegação privada
  }
}

// Ganha um acessório (já fica equipado). Devolve true se era novo.
export function grantAccessory(id) {
  const c = loadCollection();
  if (!ACCESSORIES[id] || c.owned.includes(id)) return false;
  c.owned.push(id);
  c.equipped = id;
  saveCollection(c);
  return true;
}

export function equipAccessory(id) {
  const c = loadCollection();
  c.equipped = id && c.owned.includes(id) ? id : null;
  saveCollection(c);
}

export const equippedAccessory = () => loadCollection().equipped;
